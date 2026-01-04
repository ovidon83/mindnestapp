import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thought, Action, AppView, PotentialType, SharePosts, TodoData, InsightData } from '../types';
import { fetchThoughts, insertThought, updateThought as updateThoughtDb, deleteThought as deleteThoughtDb } from '../lib/thoughts-db';
import { fetchActions, insertAction, updateAction as updateActionDb, deleteAction as deleteActionDb } from '../lib/thoughts-db';
import { processThoughtMVP } from '../lib/process-thought-mvp';
import { supabase } from '../lib/supabase';
import { backfillRecommendations } from '../lib/backfill-recommendations';

interface GenieNotesStore {
  thoughts: Thought[];
  actions: Action[]; // Kept for backward compatibility
  currentView: AppView;
  user: any | null;
  loading: boolean;
  pendingText: string | null; // Text waiting to be saved after login
  navigateToThoughtId: string | null; // Thought ID to select when navigating to a view
  
  // Auth
  setUser: (user: any) => void;
  loadThoughts: () => Promise<void>;
  loadActions: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Thought management
  processAndSaveThought: (rawInput: string) => Promise<void>;
  updateThought: (id: string, updates: Partial<Thought>) => Promise<void>;
  deleteThought: (id: string) => Promise<void>;
  addSpark: (thoughtId: string) => Promise<void>;
  removeSpark: (thoughtId: string) => Promise<void>;
  setPotential: (thoughtId: string, potential: PotentialType | null) => Promise<void>;
  parkThought: (thoughtId: string) => Promise<void>;
  unparkThought: (thoughtId: string) => Promise<void>;
  togglePowerful: (thoughtId: string) => Promise<void>;
  backfillRecommendations: (onProgress?: (current: number, total: number, thoughtId: string) => void) => Promise<{ success: number; failed: number; errors: Array<{ thoughtId: string; error: string }> }>;
  
  // Potential-specific methods
  generateSharePosts: (thoughtId: string, thoughtOverride?: Thought, userFeedback?: string) => Promise<SharePosts>;
  updateTodoData: (thoughtId: string, todoData: Partial<TodoData>) => Promise<void>;
  updateInsightData: (thoughtId: string, insightData: Partial<InsightData>) => Promise<void>;
  markAsShared: (thoughtId: string, platform: 'linkedin' | 'twitter' | 'instagram') => Promise<void>;
  
  // Action management (kept for backward compatibility)
  createAction: (thoughtId: string, type: Action['type'], title: string, content: string) => Promise<void>;
  updateAction: (id: string, updates: Partial<Action>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  
  // App state
  setCurrentView: (view: AppView, thoughtId?: string) => void;
  setPendingText: (text: string | null) => void;
  clearNavigateToThought: () => void;
}

// Track if we're currently loading to prevent concurrent loads
let isLoadingThoughts = false;
let lastLoadTime = 0;
const MIN_LOAD_INTERVAL = 1000; // Minimum 1 second between loads

export const useGenieNotesStore = create<GenieNotesStore>()(
  persist(
    (set, get) => ({
      thoughts: [],
      actions: [],
      currentView: 'thoughts', // Default to thoughts view
      user: null,
      loading: false,
      pendingText: null,
      navigateToThoughtId: null,

      setUser: (user) => {
        set({ user });
      },

      loadThoughts: async () => {
        // Prevent concurrent loads and rapid successive loads
        const now = Date.now();
        if (isLoadingThoughts) {
          console.log('[loadThoughts] Already loading, skipping');
          return;
        }
        if (now - lastLoadTime < MIN_LOAD_INTERVAL) {
          console.log('[loadThoughts] Too soon since last load, skipping');
          return;
        }
        isLoadingThoughts = true;
        lastLoadTime = now;
        console.log('[loadThoughts] Starting load');
        set({ loading: true });
        try {
          const thoughts = await fetchThoughts();
          // Calculate powerful scores for thoughts that don't have them
          const { calculatePowerfulScore } = await import('../lib/calculate-powerful-score');
          const thoughtsWithScores = thoughts.map(thought => {
            if (thought.powerfulScore === undefined) {
              return {
                ...thought,
                powerfulScore: calculatePowerfulScore(thought, thoughts)
              };
            }
            return thought;
          });
          set({ thoughts: thoughtsWithScores, loading: false });
          console.log('[loadThoughts] Loaded', thoughts.length, 'thoughts');
        } catch (error) {
          console.error('Error loading thoughts:', error);
          set({ loading: false });
        } finally {
          isLoadingThoughts = false;
        }
      },

      loadActions: async () => {
        try {
          const actions = await fetchActions();
          set({ actions });
        } catch (error) {
          console.error('Error loading actions:', error);
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, thoughts: [], actions: [] });
      },
      
      processAndSaveThought: async (rawInput: string) => {
        try {
          // Process with AI to detect Spark and suggest Potentials
          const processedThought = await processThoughtMVP(rawInput);
          
          // Save to database
          await insertThought(processedThought);
          
          // Reload thoughts
          await get().loadThoughts();
          
          // Navigate to thoughts view after saving
          get().setCurrentView('thoughts');
        } catch (error) {
          console.error('Error processing and saving thought:', error);
          throw error;
        }
      },

      updateThought: async (id: string, updates: Partial<Thought>) => {
        try {
          // Optimistically update local state first
          const currentThoughts = get().thoughts;
          const thoughtIndex = currentThoughts.findIndex(t => t.id === id);
          if (thoughtIndex !== -1) {
            const updatedThoughts = [...currentThoughts];
            // Create a new thought object with updates, properly merging sharePosts
            const currentThought = updatedThoughts[thoughtIndex];
            let updatedThought = { ...currentThought, ...updates };
            
            // Special handling for sharePosts to ensure proper merging
            if (updates.sharePosts && currentThought.sharePosts) {
              updatedThought = {
                ...updatedThought,
                sharePosts: {
                  ...currentThought.sharePosts,
                  ...updates.sharePosts,
                  // Deep merge shared object
                  shared: {
                    ...(currentThought.sharePosts.shared || {}),
                    ...(updates.sharePosts.shared || {}),
                  },
                },
              };
            }
            
            updatedThoughts[thoughtIndex] = updatedThought;
            set({ thoughts: updatedThoughts });
          }
          
          // Then update in database (this will map 'Do' to 'To-Do' for database)
          await updateThoughtDb(id, updates);
          
          // Only reload if it's a significant change (not just potential or sharePosts updates)
          // For potential/sharePosts updates, the optimistic update is sufficient
          const isSignificantChange = updates.originalText !== undefined || 
                                      updates.tags !== undefined || 
                                      updates.summary !== undefined ||
                                      updates.isParked !== undefined;
          
          if (isSignificantChange) {
            const now = Date.now();
            if (!isLoadingThoughts && (now - lastLoadTime >= MIN_LOAD_INTERVAL)) {
              await get().loadThoughts();
            }
          }
        } catch (error) {
          console.error('Error updating thought:', error);
          // Revert optimistic update on error
          await get().loadThoughts();
          throw error;
        }
      },

      deleteThought: async (id: string) => {
        try {
          await deleteThoughtDb(id);
          await get().loadThoughts();
        } catch (error) {
          console.error('Error deleting thought:', error);
          throw error;
        }
      },

      addSpark: async (thoughtId: string) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (thought) {
          // Ensure potential is set to a valid value before adding spark
          const currentPotential = thought.potential || thought.bestPotential || 'Just a thought';
          if (!thought.bestPotential) {
            // Generate best potential when spark is added
            const { generateBestPotential } = await import('../lib/generate-best-potential');
            const bestPotential = await generateBestPotential(thought);
            await get().updateThought(thoughtId, { 
              isSpark: true, 
              bestPotential,
              potential: currentPotential, // Ensure potential is always valid
            });
          } else {
            await get().updateThought(thoughtId, { 
              isSpark: true,
              potential: currentPotential, // Ensure potential is always valid
            });
          }
        }
      },

      removeSpark: async (thoughtId: string) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (thought) {
          await get().updateThought(thoughtId, { 
            isSpark: false, 
            potential: 'Just a thought', // Set to "Just a thought" instead of null
            bestPotential: null,
            sharePosts: undefined,
            todoData: undefined,
            insightData: undefined,
          });
        }
      },

      setPotential: async (thoughtId: string, potential: PotentialType | null) => {
        // Always save as a string value - "Just a thought" is a valid potential
        // Ensure we're passing a valid PotentialType, not null
        const potentialToSave: PotentialType = potential === null || potential === undefined 
          ? 'Just a thought' 
          : potential;
        await get().updateThought(thoughtId, { potential: potentialToSave });
      },

      parkThought: async (thoughtId: string) => {
        await get().updateThought(thoughtId, { isParked: true });
      },

      unparkThought: async (thoughtId: string) => {
        await get().updateThought(thoughtId, { isParked: false });
      },

      togglePowerful: async (thoughtId: string) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (thought) {
          await get().updateThought(thoughtId, { isPowerful: !thought.isPowerful });
        }
      },

      backfillRecommendations: async (onProgress) => {
        // Ensure thoughts are loaded first
        if (get().thoughts.length === 0) {
          console.log('No thoughts loaded. Loading thoughts first...');
          await get().loadThoughts();
        }
        
        const thoughts = get().thoughts;
        console.log(`Starting backfill for ${thoughts.length} thoughts...`);
        const result = await backfillRecommendations(thoughts, onProgress);
        console.log('Backfill result:', result);
        // Reload thoughts to get updated recommendations
        console.log('Reloading thoughts...');
        await get().loadThoughts();
        console.log('Thoughts reloaded. Check Explore view to see recommendations.');
        return result;
      },

      generateSharePosts: async (thoughtId: string, thoughtOverride?: Thought, userFeedback?: string): Promise<SharePosts> => {
        const thought = thoughtOverride || get().thoughts.find(t => t.id === thoughtId);
        if (!thought) {
          throw new Error('Thought not found');
        }
        
        const { generatePostDrafts } = await import('../lib/generate-posts');
        const { fetchUserProfile } = await import('../lib/db');
        
        const userProfile = await fetchUserProfile().catch(() => null);
        const otherThoughts = get().thoughts.filter(t => t.id !== thoughtId).slice(0, 10);
        const drafts = await generatePostDrafts(thought, userProfile || undefined, otherThoughts, userFeedback);
        
        const now = new Date();
        const existingSharePosts = thought.sharePosts;
        const draftCount = (existingSharePosts?.draftCount || 0) + 1;
        const draftsGeneratedAt = existingSharePosts?.draftsGeneratedAt || [];
        draftsGeneratedAt.push(now);
        
        const sharePosts: SharePosts = {
          ...existingSharePosts, // Preserve existing shared status and dates
          linkedin: drafts.linkedin,
          twitter: drafts.twitter,
          instagram: drafts.instagram,
          generatedAt: now,
          firstGeneratedAt: existingSharePosts?.firstGeneratedAt || now,
          draftCount,
          draftsGeneratedAt: draftsGeneratedAt.slice(-100), // Keep last 100 draft dates
        };
        
        await get().updateThought(thoughtId, { sharePosts });
        return sharePosts;
      },

      updateTodoData: async (thoughtId: string, todoData: Partial<TodoData>) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (!thought) return;
        
        const updatedTodoData: TodoData = {
          ...thought.todoData,
          completed: false,
          ...todoData,
        };
        
        await get().updateThought(thoughtId, { todoData: updatedTodoData });
      },

      updateInsightData: async (thoughtId: string, insightData: Partial<InsightData>) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (!thought) return;
        
        const updatedInsightData: InsightData = {
          content: '',
          format: 'short',
          ...thought.insightData,
          ...insightData,
          updatedAt: new Date(),
        };
        
        await get().updateThought(thoughtId, { insightData: updatedInsightData });
      },

      markAsShared: async (thoughtId: string, platform: 'linkedin' | 'twitter' | 'instagram') => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (!thought || !thought.sharePosts) {
          console.warn('[markAsShared] Thought not found or no sharePosts:', thoughtId);
          return;
        }
        
        const now = new Date();
        const platformSharedAtKey = `${platform}SharedAt` as 'linkedinSharedAt' | 'twitterSharedAt' | 'instagramSharedAt';
        
        const updatedSharePosts: SharePosts = {
          ...thought.sharePosts,
          shared: {
            ...(thought.sharePosts.shared || {}),
            [platform]: true,
            [platformSharedAtKey]: now, // Track per-platform shared date for analytics
            sharedAt: now, // Keep legacy field for backward compatibility
          },
        };
        
        try {
          // Use updateThought which handles optimistic updates properly
          // Don't call loadThoughts() here - the optimistic update should be sufficient
          // and calling loadThoughts() might cause a race condition
          await get().updateThought(thoughtId, { sharePosts: updatedSharePosts });
          
          // Small delay then reload to ensure database has updated
          setTimeout(async () => {
            await get().loadThoughts();
          }, 500);
        } catch (error) {
          console.error('[markAsShared] Error marking as shared:', error);
          // On error, reload to get correct state
          await get().loadThoughts();
          throw error;
        }
      },

      createAction: async (thoughtId: string, type: Action['type'], title: string, content: string) => {
        try {
          await insertAction({
            thoughtId,
            type,
            title,
            content,
            completed: false,
          });
          await get().loadActions();
        } catch (error) {
          console.error('Error creating action:', error);
          throw error;
        }
      },

      updateAction: async (id: string, updates: Partial<Action>) => {
        try {
          await updateActionDb(id, updates);
          await get().loadActions();
        } catch (error) {
          console.error('Error updating action:', error);
          throw error;
        }
      },

      deleteAction: async (id: string) => {
        try {
          await deleteActionDb(id);
          await get().loadActions();
        } catch (error) {
          console.error('Error deleting action:', error);
          throw error;
        }
      },

      setCurrentView: (view: AppView, thoughtId?: string) => {
        set({ 
          currentView: view,
          navigateToThoughtId: thoughtId || null,
        });
        // Update URL hash to match the view
        const hash = view === 'home' ? 'thoughts' : view;
        window.history.pushState({ view, thoughtId }, '', `#${hash}`);
      },
      
      clearNavigateToThought: () => {
        set({ navigateToThoughtId: null });
      },

      setPendingText: (text: string | null) => {
        set({ pendingText: text });
      },
    }),
    {
      name: 'genienotes-storage',
      partialize: (state) => ({
        currentView: state.currentView,
      }),
    }
  )
);

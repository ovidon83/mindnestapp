import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thought, Action, AppView, PotentialType, SharePosts, TodoData, InsightData } from '../types';
import { fetchThoughts, insertThought, updateThought as updateThoughtDb, deleteThought as deleteThoughtDb } from '../lib/thoughts-db';
import { fetchActions, insertAction, updateAction as updateActionDb, deleteAction as deleteActionDb } from '../lib/thoughts-db';
import { processThoughtMVP } from '../lib/process-thought-mvp';
import { supabase } from '../lib/supabase';

interface GenieNotesStore {
  thoughts: Thought[];
  actions: Action[]; // Kept for backward compatibility
  currentView: AppView;
  user: any | null;
  loading: boolean;
  pendingText: string | null; // Text waiting to be saved after login
  
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
  
  // Potential-specific methods
  generateSharePosts: (thoughtId: string) => Promise<SharePosts>;
  updateTodoData: (thoughtId: string, todoData: Partial<TodoData>) => Promise<void>;
  updateInsightData: (thoughtId: string, insightData: Partial<InsightData>) => Promise<void>;
  markAsShared: (thoughtId: string, platform: 'linkedin' | 'twitter' | 'instagram') => Promise<void>;
  
  // Action management (kept for backward compatibility)
  createAction: (thoughtId: string, type: Action['type'], title: string, content: string) => Promise<void>;
  updateAction: (id: string, updates: Partial<Action>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  
  // App state
  setCurrentView: (view: AppView) => void;
  setPendingText: (text: string | null) => void;
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
          set({ thoughts, loading: false });
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
          await updateThoughtDb(id, updates);
          // Debounce: only reload if not already loading and enough time has passed
          const now = Date.now();
          if (!isLoadingThoughts && (now - lastLoadTime >= MIN_LOAD_INTERVAL)) {
            await get().loadThoughts();
          }
        } catch (error) {
          console.error('Error updating thought:', error);
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
        if (thought && !thought.bestPotential) {
          // Generate best potential when spark is added
          const { generateBestPotential } = await import('../lib/generate-best-potential');
          const bestPotential = await generateBestPotential(thought);
          await get().updateThought(thoughtId, { isSpark: true, bestPotential });
        } else if (thought) {
          await get().updateThought(thoughtId, { isSpark: true });
        }
      },

      removeSpark: async (thoughtId: string) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (thought) {
          await get().updateThought(thoughtId, { 
            isSpark: false, 
            potential: null,
            bestPotential: null,
            sharePosts: undefined,
            todoData: undefined,
            insightData: undefined,
          });
        }
      },

      setPotential: async (thoughtId: string, potential: PotentialType | null) => {
        await get().updateThought(thoughtId, { potential });
      },

      parkThought: async (thoughtId: string) => {
        await get().updateThought(thoughtId, { isParked: true });
      },

      unparkThought: async (thoughtId: string) => {
        await get().updateThought(thoughtId, { isParked: false });
      },

      generateSharePosts: async (thoughtId: string, thoughtOverride?: Thought): Promise<SharePosts> => {
        const thought = thoughtOverride || get().thoughts.find(t => t.id === thoughtId);
        if (!thought) {
          throw new Error('Thought not found');
        }
        
        const { generatePostDrafts } = await import('../lib/generate-posts');
        const { fetchUserProfile } = await import('../lib/db');
        
        const userProfile = await fetchUserProfile().catch(() => null);
        const otherThoughts = get().thoughts.filter(t => t.id !== thoughtId).slice(0, 10);
        const drafts = await generatePostDrafts(thought, userProfile || undefined, otherThoughts);
        
        const sharePosts: SharePosts = {
          linkedin: drafts.linkedin,
          twitter: drafts.twitter,
          instagram: drafts.instagram,
          generatedAt: new Date(),
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
        if (!thought || !thought.sharePosts) return;
        
        const updatedSharePosts: SharePosts = {
          ...thought.sharePosts,
          shared: {
            ...thought.sharePosts.shared,
            [platform]: true,
            sharedAt: new Date(),
          },
        };
        
        await get().updateThought(thoughtId, { sharePosts: updatedSharePosts });
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

      setCurrentView: (view: AppView) => {
        set({ currentView: view });
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

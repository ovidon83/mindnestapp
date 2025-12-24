import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thought, Action, AppView, Potential } from '../types';
import { fetchThoughts, insertThought, updateThought as updateThoughtDb, deleteThought as deleteThoughtDb } from '../lib/thoughts-db';
import { fetchActions, insertAction, updateAction as updateActionDb, deleteAction as deleteActionDb } from '../lib/thoughts-db';
import { processThoughtMVP } from '../lib/process-thought-mvp';
import { supabase } from '../lib/supabase';

interface GenieNotesStore {
  thoughts: Thought[];
  actions: Action[];
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
  addPotential: (thoughtId: string, potential: Potential) => Promise<void>;
  removePotential: (thoughtId: string, potentialId: string) => Promise<void>;
  
  // Action management
  createAction: (thoughtId: string, type: Action['type'], title: string, content: string) => Promise<void>;
  updateAction: (id: string, updates: Partial<Action>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  
  // App state
  setCurrentView: (view: AppView) => void;
  setPendingText: (text: string | null) => void;
}

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
        set({ loading: true });
        try {
          const thoughts = await fetchThoughts();
          set({ thoughts, loading: false });
        } catch (error) {
          console.error('Error loading thoughts:', error);
          set({ loading: false });
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
          await get().loadThoughts();
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
        if (thought) {
          await get().updateThought(thoughtId, { isSpark: true });
        }
      },

      removeSpark: async (thoughtId: string) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (thought) {
          await get().updateThought(thoughtId, { isSpark: false, potentials: [] });
        }
      },

      addPotential: async (thoughtId: string, potential: Potential) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (thought && thought.isSpark && thought.potentials.length < 3) {
          const newPotentials = [...thought.potentials, potential];
          await get().updateThought(thoughtId, { potentials: newPotentials });
        }
      },

      removePotential: async (thoughtId: string, potentialId: string) => {
        const thought = get().thoughts.find(t => t.id === thoughtId);
        if (thought) {
          const newPotentials = thought.potentials.filter(p => p.id !== potentialId);
          await get().updateThought(thoughtId, { potentials: newPotentials });
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

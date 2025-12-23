import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entry, AppView } from '../types';
import { fetchEntries, insertEntry, updateEntry as updateEntryDb, deleteEntry as deleteEntryDb } from '../lib/db';
import { processThought } from '../lib/ai';
import { supabase } from '../lib/supabase';

interface GenieNotesStore {
  entries: Entry[];
  currentView: AppView;
  user: any | null;
  loading: boolean;
  
  // Auth
  setUser: (user: any) => void;
  loadEntries: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Entry management
  processAndSave: (rawInput: string, entryType?: 'thought' | 'journal') => Promise<void>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  
  // App state
  setCurrentView: (view: AppView) => void;
}

export const useGenieNotesStore = create<GenieNotesStore>()(
  persist(
    (set, get) => ({
      entries: [],
      currentView: 'mindbox', // Default to mindbox view
      user: null,
      loading: false,

      setUser: (user) => {
        set({ user });
      },

      loadEntries: async () => {
        set({ loading: true });
        try {
          const entries = await fetchEntries();
          set({ entries, loading: false });
        } catch (error) {
          console.error('Error loading entries:', error);
          set({ loading: false });
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, entries: [] });
      },
      
      processAndSave: async (rawInput: string, entryType: 'thought' | 'journal' = 'thought', captureType?: 'todo' | 'insight' | 'journal') => {
        try {
          // Process with AI
          const processedEntry = await processThought(rawInput, entryType, captureType);
          
          // Save to database
          const newEntry = await insertEntry(processedEntry);
          
          // Reload entries to get the full entry with all fields
          await get().loadEntries();
          
          // Navigate to mindbox after saving
          get().setCurrentView('mindbox');
        
          // Post generation is now user-initiated only
          // Users can manually add entries to ShareIt and generate posts when ready
          // This saves tokens and gives users full control
        } catch (error) {
          console.error('Error processing and saving:', error);
          throw error;
        }
      },

      updateEntry: async (id: string, updates: Partial<Entry>) => {
        try {
          await updateEntryDb(id, updates);
          await get().loadEntries();
        } catch (error) {
          console.error('Error updating entry:', error);
          throw error;
        }
      },

      deleteEntry: async (id: string) => {
        try {
          await deleteEntryDb(id);
          await get().loadEntries();
        } catch (error) {
          console.error('Error deleting entry:', error);
          throw error;
        }
      },

      setCurrentView: (view: AppView) => {
        set({ currentView: view });
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

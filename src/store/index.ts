import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { 
  AppView, 
  Entry, 
  EntryType, 
  Priority, 
  ReviewReason,
  AppState,
  UIState
} from '../types';

interface GenieNotesStore {
  // Core data
  entries: Entry[];
  
  // App state
  appState: AppState;
  uiState: UIState;
  
  // Entry management
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  completeEntry: (id: string) => void;
  
  // Entry operations
  changeEntryType: (id: string, newType: EntryType) => void;
  changeEntryPriority: (id: string, newPriority: Priority) => void;
  addEntryTag: (id: string, tag: string) => void;
  removeEntryTag: (id: string, tag: string) => void;
  setEntryDueDate: (id: string, dueDate: Date | null) => void;
  setEntryLocation: (id: string, location: string | null) => void;
  
  // Review system
  markForReview: (id: string, reason: ReviewReason, note?: string) => void;
  markReviewed: (id: string) => void;
  
  // Search and filtering
  getFilteredEntries: () => Entry[];
  getEntriesNeedingReview: () => Entry[];
  getUrgentEntries: () => Entry[];
  
  // UI state management
  setCurrentView: (view: AppView) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Partial<AppState['activeFilters']>) => void;
  setSelectedEntry: (id: string | null) => void;
  setEditingEntry: (id: string | null) => void;
  toggleReviewModal: () => void;
  toggleSidebar: () => void;
  toggleFocusMode: () => void;
  
  // Utility functions
  getTopTags: (entries: Entry[]) => Array<{ tag: string; count: number }>;
  getEntriesByType: (type: EntryType) => Entry[];
  getEntriesByPriority: (priority: Priority) => Entry[];
}

export const useGenieNotesStore = create<GenieNotesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      entries: [],
      
      appState: {
        currentView: 'capture',
        searchQuery: '',
        activeFilters: {
          type: 'all',
          priority: 'all',
          status: 'all',
          tags: [],
          needsReview: false
        }
      },
      
      uiState: {
        selectedEntryId: null,
        editingEntryId: null,
        showReviewModal: false,
        sidebarOpen: false,
        focusMode: false
      },
      
      // Entry management
      addEntry: (entryData) => {
        const entry: Entry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('=== Store Debug: Adding Entry ===');
        console.log('Entry data:', entryData);
        console.log('Created entry:', entry);
        
        set((state) => {
          const newState = {
            entries: [entry, ...state.entries]
          };
          console.log('New store state:', newState);
          return newState;
        });
      },
      
      updateEntry: (id, updates) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { ...entry, ...updates, updatedAt: new Date() } : entry
        )
      })),
      
      deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id)
      })),
      
      completeEntry: (id) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { 
            ...entry, 
            status: 'completed', 
            completedAt: new Date(), 
            updatedAt: new Date() 
          } : entry
        )
      })),
      
      // Entry operations
      changeEntryType: (id, newType) => get().updateEntry(id, { type: newType }),
      changeEntryPriority: (id, newPriority) => get().updateEntry(id, { priority: newPriority }),
      
      addEntryTag: (id, tag) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id 
            ? { ...entry, tags: [...entry.tags, tag], updatedAt: new Date() }
            : entry
        )
      })),
      
      removeEntryTag: (id, tag) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id 
            ? { ...entry, tags: entry.tags.filter(t => t !== tag), updatedAt: new Date() }
            : entry
        )
      })),
      
      setEntryDueDate: (id, dueDate) => get().updateEntry(id, { dueDate: dueDate || undefined }),
      setEntryLocation: (id, location) => get().updateEntry(id, { location: location || undefined }),
      
      // Review system
      markForReview: (id, reason, note) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { 
            ...entry, 
            needsReview: true, 
            reviewReason: reason, 
            reviewNote: note,
            updatedAt: new Date() 
          } : entry
        )
      })),
      
      markReviewed: (id) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { 
            ...entry, 
            needsReview: false, 
            reviewReason: undefined, 
            reviewNote: undefined,
            lastReviewedAt: new Date(),
            updatedAt: new Date() 
          } : entry
        )
      })),
      
      // Search and filtering
      getFilteredEntries: () => {
        const { entries, appState } = get();
        let filtered = entries;
        
        console.log('=== Store Debug: getFilteredEntries ===');
        console.log('Total entries in store:', entries.length);
        console.log('Current filters:', appState.activeFilters);
        console.log('Search query:', appState.searchQuery);
        console.log('All entries:', entries);
        
        // Filter by type
        if (appState.activeFilters.type && appState.activeFilters.type !== 'all') {
          const beforeTypeFilter = filtered.length;
          filtered = filtered.filter(entry => entry.type === appState.activeFilters.type);
          console.log(`Type filter (${appState.activeFilters.type}): ${beforeTypeFilter} -> ${filtered.length}`);
        }
        
        // Filter by priority
        if (appState.activeFilters.priority && appState.activeFilters.priority !== 'all') {
          const beforePriorityFilter = filtered.length;
          filtered = filtered.filter(entry => entry.priority === appState.activeFilters.priority);
          console.log(`Priority filter (${appState.activeFilters.priority}): ${beforePriorityFilter} -> ${filtered.length}`);
        }
        
        // Filter by status
        if (appState.activeFilters.status && appState.activeFilters.status !== 'all') {
          const beforeStatusFilter = filtered.length;
          filtered = filtered.filter(entry => entry.status === appState.activeFilters.status);
          console.log(`Status filter (${appState.activeFilters.status}): ${beforeStatusFilter} -> ${filtered.length}`);
        }
        
        // Filter by tags
        if (appState.activeFilters.tags.length > 0) {
          const beforeTagsFilter = filtered.length;
          filtered = filtered.filter(entry => 
            appState.activeFilters.tags.some(tag => entry.tags.includes(tag))
          );
          console.log(`Tags filter (${appState.activeFilters.tags}): ${beforeTagsFilter} -> ${filtered.length}`);
        }
        
        // Filter by review status
        if (appState.activeFilters.needsReview) {
          const beforeReviewFilter = filtered.length;
          filtered = filtered.filter(entry => entry.needsReview);
          console.log(`Review filter: ${beforeReviewFilter} -> ${filtered.length}`);
        }
        
        // Search query
        if (appState.searchQuery) {
          const beforeSearchFilter = filtered.length;
          filtered = filtered.filter(entry =>
            entry.content.toLowerCase().includes(appState.searchQuery.toLowerCase()) ||
            entry.tags.some(tag => tag.toLowerCase().includes(appState.searchQuery.toLowerCase())) ||
            entry.notes?.toLowerCase().includes(appState.searchQuery.toLowerCase())
          );
          console.log(`Search filter ("${appState.searchQuery}"): ${beforeSearchFilter} -> ${filtered.length}`);
        }
        
        console.log('Final filtered entries:', filtered);
        
        // Sort by urgency and recency
        return filtered.sort((a, b) => {
          // First by review status (needs review first)
          if (a.needsReview && !b.needsReview) return -1;
          if (!a.needsReview && b.needsReview) return 1;
          
          // Then by priority
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority];
          const bPriority = priorityOrder[b.priority];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          // Then by due date (urgent first)
          if (a.dueDate && b.dueDate) {
            const aDate = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
            const bDate = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
            return aDate.getTime() - bDate.getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          
          // Finally by recency (newest first)
          const aCreated = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const bCreated = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return bCreated.getTime() - aCreated.getTime();
        });
      },
      
      getEntriesNeedingReview: () => {
        const { entries } = get();
        return entries
          .filter(entry => entry.needsReview)
          .sort((a, b) => {
            const aCreated = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const bCreated = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return bCreated.getTime() - aCreated.getTime();
          });
      },
      
      getUrgentEntries: () => {
        const { entries } = get();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        console.log('=== Store Debug: getUrgentEntries ===');
        console.log('Total entries in store:', entries.length);
        console.log('Today date:', today);
        console.log('All entries:', entries);
        
        const urgentEntries = entries
          .filter(entry => {
            if (entry.status === 'completed') return false;
            if (entry.priority === 'urgent') return true;
            if (entry.dueDate) {
              const dueDate = entry.dueDate instanceof Date ? entry.dueDate : new Date(entry.dueDate);
              return dueDate <= today;
            }
            return false;
          })
          .sort((a, b) => {
            // Urgent priority first
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
            
            // Then by due date
            if (a.dueDate && b.dueDate) {
              const aDate = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
              const bDate = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
              return aDate.getTime() - bDate.getTime();
            }
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            
            // Finally by priority
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });
        
        console.log('Urgent entries found:', urgentEntries);
        return urgentEntries;
      },
      
      // UI state management
      setCurrentView: (view) => set((state) => ({
        appState: { ...state.appState, currentView: view }
      })),
      
      setSearchQuery: (query) => set((state) => ({
        appState: { ...state.appState, searchQuery: query }
      })),
      
      setActiveFilters: (filters) => set((state) => ({
        appState: { 
          ...state.appState, 
          activeFilters: { ...state.appState.activeFilters, ...filters }
        }
      })),
      
      setSelectedEntry: (id) => set((state) => ({
        uiState: { ...state.uiState, selectedEntryId: id }
      })),
      
      setEditingEntry: (id) => set((state) => ({
        uiState: { ...state.uiState, editingEntryId: id }
      })),
      
      toggleReviewModal: () => set((state) => ({
        uiState: { ...state.uiState, showReviewModal: !state.uiState.showReviewModal }
      })),
      
      toggleSidebar: () => set((state) => ({
        uiState: { ...state.uiState, sidebarOpen: !state.uiState.sidebarOpen }
      })),
      
      toggleFocusMode: () => set((state) => ({
        uiState: { ...state.uiState, focusMode: !state.uiState.focusMode }
      })),
      
      // Utility functions
      getTopTags: (entries) => {
        const tagCounts: Record<string, number> = {};
        entries.forEach(entry => {
          entry.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        return Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      },
      
      getEntriesByType: (type) => {
        const { entries } = get();
        return entries.filter(entry => entry.type === type);
      },
      
      getEntriesByPriority: (priority) => {
        const { entries } = get();
        return entries.filter(entry => entry.priority === priority);
      }
    }),
    {
      name: "genienotes-storage",
      partialize: (state) => ({
        entries: state.entries,
        appState: state.appState,
        uiState: state.uiState
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('=== Store: Rehydrating from localStorage ===');
          
          // Convert date strings back to Date objects for all entries
          state.entries = state.entries.map(entry => {
            const updatedEntry = { ...entry };
            
            // Convert createdAt and updatedAt
            if (entry.createdAt && !(entry.createdAt instanceof Date)) {
              updatedEntry.createdAt = new Date(entry.createdAt);
            }
            if (entry.updatedAt && !(entry.updatedAt instanceof Date)) {
              updatedEntry.updatedAt = new Date(entry.updatedAt);
            }
            
            // Convert dueDate
            if (entry.dueDate && !(entry.dueDate instanceof Date)) {
              updatedEntry.dueDate = new Date(entry.dueDate);
            }
            
            // Convert startDate and endDate
            if (entry.startDate && !(entry.startDate instanceof Date)) {
              updatedEntry.startDate = new Date(entry.startDate);
            }
            if (entry.endDate && !(entry.endDate instanceof Date)) {
              updatedEntry.endDate = new Date(entry.endDate);
            }
            
            // Convert reminderDate
            if (entry.reminderDate && !(entry.reminderDate instanceof Date)) {
              updatedEntry.reminderDate = new Date(entry.reminderDate);
            }
            
            // Convert completedAt
            if (entry.completedAt && !(entry.completedAt instanceof Date)) {
              updatedEntry.completedAt = new Date(entry.completedAt);
            }
            
            // Convert lastReviewedAt
            if (entry.lastReviewedAt && !(entry.lastReviewedAt instanceof Date)) {
              updatedEntry.lastReviewedAt = new Date(entry.lastReviewedAt);
            }
            
            // Convert pinnedForDate (new field)
            if (entry.pinnedForDate && !(entry.pinnedForDate instanceof Date)) {
              updatedEntry.pinnedForDate = new Date(entry.pinnedForDate);
            }
            
            return updatedEntry;
          });
          
          console.log('=== Store: Date conversion complete ===');
          console.log('Updated entries:', state.entries);
        }
      }
    }
  )
); 
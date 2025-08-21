import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entry, TimeBucket, Priority, HomeViewPreferences, GroupingMode, AppView } from '../types';

interface AllyMindStore {
  entries: Entry[];
  homeViewPrefs: HomeViewPreferences;
  currentView: AppView;
  
  // Migration
  migrateOldEntries: () => Entry[];
  
  // Entry management
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'timeBucket'>) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  toggleEntryComplete: (id: string) => void;
  toggleEntryPin: (id: string) => void;
  
  // Bulk operations
  bulkComplete: (ids: string[]) => void;
  bulkDelete: (ids: string[]) => void;
  bulkDefer: (ids: string[], timeBucket: TimeBucket) => void;
  bulkAddTags: (ids: string[], tags: string[]) => void;
  
  // App state
  setCurrentView: (view: AppView) => void;
  
  // Preferences
  updateHomeViewPrefs: (updates: Partial<HomeViewPreferences>) => void;
  setGrouping: (grouping: GroupingMode) => void;
  setFilters: (filters: Partial<HomeViewPreferences['filters']>) => void;
  setSort: (sort: Partial<HomeViewPreferences['sort']>) => void;
  toggleGroupCollapsed: (groupId: string) => void;
  setSearchQuery: (query: string) => void;
  
  // Computed values
  getFilteredEntries: () => Entry[];
  getGroupedEntries: () => Record<string, Entry[]>;
  getTimeBucketFromDate: (date?: Date) => TimeBucket;
}

const defaultHomeViewPrefs: HomeViewPreferences = {
  grouping: 'time',
  filters: {
    types: ['task', 'thought'],
    timeBuckets: ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday'],
    status: 'incomplete',
    pinnedOnly: false,
  },
  sort: {
    primary: 'timeBucket',
    secondary: 'priority',
  },
  collapsedGroups: {},
  searchQuery: '',
};

export const useAllyMindStore = create<AllyMindStore>()(
  persist(
    (set, get) => ({
      entries: [],
      homeViewPrefs: defaultHomeViewPrefs,
      currentView: 'capture' as AppView,
      
      // Migration function to convert old entries to new format
      migrateOldEntries: () => {
        const { entries } = get();
        const migratedEntries = entries.map(entry => {
          // Check if this is an old entry format
          if ('content' in entry && !('title' in entry)) {
            // Convert old format to new format
            const oldEntry = entry as any;
            return {
              id: oldEntry.id,
              type: oldEntry.type === 'task' ? 'task' : 'thought', // Convert to simplified types
              title: oldEntry.content?.substring(0, 100) || 'Untitled',
              body: oldEntry.content || '',
              tags: oldEntry.tags || [],
              createdAt: oldEntry.createdAt ? new Date(oldEntry.createdAt) : new Date(),
              dueAt: oldEntry.dueDate ? new Date(oldEntry.dueDate) : undefined,
              timeBucket: get().getTimeBucketFromDate(oldEntry.dueDate ? new Date(oldEntry.dueDate) : undefined),
              priority: oldEntry.priority,
              pinned: oldEntry.pinnedForDate ? true : false,
              completed: oldEntry.status === 'completed',
              aiConfidence: oldEntry.confidence || 0.8,
            } as Entry;
          }
          return entry;
        });
        
        set({ entries: migratedEntries });
        return migratedEntries;
      },

      addEntry: (entryData) => {
        const now = new Date();
        const timeBucket = get().getTimeBucketFromDate(entryData.dueAt);
        
        const newEntry: Entry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: now,
          timeBucket,
          completed: false,
          pinned: false,
        };
        
        set((state) => ({
          entries: [...state.entries, newEntry],
        }));
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === id) {
              const updatedEntry = { ...entry, ...updates };
              // Recalculate timeBucket if dueAt changed
              if (updates.dueAt !== undefined) {
                updatedEntry.timeBucket = get().getTimeBucketFromDate(updates.dueAt);
              }
              return updatedEntry;
            }
            return entry;
          }),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      toggleEntryComplete: (id) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === id && entry.type === 'task') {
              return { ...entry, completed: !entry.completed };
            }
            return entry;
          }),
        }));
      },

      toggleEntryPin: (id) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === id) {
              return { ...entry, pinned: !entry.pinned };
            }
            return entry;
          }),
        }));
      },

      bulkComplete: (ids) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (ids.includes(entry.id) && entry.type === 'task') {
              return { ...entry, completed: true };
            }
            return entry;
          }),
        }));
      },

      bulkDelete: (ids) => {
        set((state) => ({
          entries: state.entries.filter((entry) => !ids.includes(entry.id)),
        }));
      },

      bulkDefer: (ids, timeBucket) => {
        const now = new Date();
        let dueAt: Date | undefined;
        
        switch (timeBucket) {
          case 'tomorrow':
            dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'this_week':
            dueAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'next_week':
            dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            break;
          case 'later':
            dueAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dueAt = undefined;
        }
        
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (ids.includes(entry.id)) {
              return { 
                ...entry, 
                dueAt,
                timeBucket: get().getTimeBucketFromDate(dueAt),
              };
            }
            return entry;
          }),
        }));
      },

      bulkAddTags: (ids, tags) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (ids.includes(entry.id)) {
              const newTags = [...new Set([...entry.tags, ...tags])];
              return { ...entry, tags: newTags };
            }
            return entry;
          }),
        }));
      },

      updateHomeViewPrefs: (updates) => {
        set((state) => ({
          homeViewPrefs: { ...state.homeViewPrefs, ...updates },
        }));
      },

      setGrouping: (grouping) => {
        set((state) => ({
          homeViewPrefs: { ...state.homeViewPrefs, grouping },
        }));
      },

      setFilters: (filters) => {
        set((state) => ({
          homeViewPrefs: { 
            ...state.homeViewPrefs, 
            filters: { ...state.homeViewPrefs.filters, ...filters },
          },
        }));
      },

      setSort: (sort) => {
        set((state) => ({
          homeViewPrefs: { 
            ...state.homeViewPrefs, 
            sort: { ...state.homeViewPrefs.sort, ...sort },
          },
        }));
      },

      toggleGroupCollapsed: (groupId) => {
        set((state) => ({
          homeViewPrefs: {
            ...state.homeViewPrefs,
            collapsedGroups: {
              ...state.homeViewPrefs.collapsedGroups,
              [groupId]: !state.homeViewPrefs.collapsedGroups[groupId],
            },
          },
        }));
      },

      setSearchQuery: (query) => {
        set((state) => ({
          homeViewPrefs: { ...state.homeViewPrefs, searchQuery: query },
        }));
      },

      setCurrentView: (view) => {
        set(() => ({
          currentView: view,
        }));
      },

      getFilteredEntries: () => {
        const { entries, homeViewPrefs } = get();
        const { filters, searchQuery } = homeViewPrefs;
        
        return entries.filter((entry) => {
          // Type filter
          if (!filters.types.includes(entry.type)) return false;
          
          // Time bucket filter
          if (!filters.timeBuckets.includes(entry.timeBucket)) return false;
          
          // Status filter
          if (filters.status === 'incomplete' && entry.completed) return false;
          if (filters.status === 'completed' && !entry.completed) return false;
          
          // Pinned filter
          if (filters.pinnedOnly && !entry.pinned) return false;
          
          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = entry.title.toLowerCase().includes(query);
            const matchesBody = entry.body.toLowerCase().includes(query);
            const matchesTags = entry.tags.some(tag => tag.toLowerCase().includes(query));
            if (!matchesTitle && !matchesBody && !matchesTags) return false;
          }
          
          return true;
        });
      },

      getGroupedEntries: () => {
        const { getFilteredEntries, homeViewPrefs } = get();
        const filteredEntries = getFilteredEntries();
        const { grouping, sort } = homeViewPrefs;
        
        // Sort entries
        const sortedEntries = [...filteredEntries].sort((a, b) => {
          // Primary sort
          if (sort.primary === 'timeBucket') {
            const timeOrder = ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday', 'none'];
            const aOrder = timeOrder.indexOf(a.timeBucket);
            const bOrder = timeOrder.indexOf(b.timeBucket);
            if (aOrder !== bOrder) return aOrder - bOrder;
          } else if (sort.primary === 'priority') {
            const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
            const aPriority = a.priority ? priorityOrder[a.priority] : 4;
            const bPriority = b.priority ? priorityOrder[b.priority] : 4;
            if (aPriority !== bPriority) return aPriority - bPriority;
          } else if (sort.primary === 'dueAt') {
            if (a.dueAt && b.dueAt) {
              if (a.dueAt.getTime() !== b.dueAt.getTime()) {
                return a.dueAt.getTime() - b.dueAt.getTime();
              }
            }
          } else if (sort.primary === 'createdAt') {
            if (a.createdAt.getTime() !== b.createdAt.getTime()) {
              return b.createdAt.getTime() - a.createdAt.getTime();
            }
          }
          
          // Secondary sort
          if (sort.secondary === 'priority') {
            const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
            const aPriority = a.priority ? priorityOrder[a.priority] : 4;
            const bPriority = b.priority ? priorityOrder[b.priority] : 4;
            if (aPriority !== bPriority) return aPriority - bPriority;
          } else if (sort.secondary === 'dueAt') {
            if (a.dueAt && b.dueAt) {
              if (a.dueAt.getTime() !== b.dueAt.getTime()) {
                return a.dueAt.getTime() - b.dueAt.getTime();
              }
            }
          } else if (sort.secondary === 'createdAt') {
            if (a.createdAt.getTime() !== b.createdAt.getTime()) {
              return b.createdAt.getTime() - a.createdAt.getTime();
            }
          }
          
          // Final sort: pinned first, then by creation date
          if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        // Group entries
        if (grouping === 'none') {
          return { 'All Entries': sortedEntries };
        }
        
        if (grouping === 'time') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            const group = entry.timeBucket;
            if (!groups[group]) groups[group] = [];
            groups[group].push(entry);
          });
          return groups;
        }
        
        if (grouping === 'type') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            const group = entry.type;
            if (!groups[group]) groups[group] = [];
            groups[group].push(entry);
          });
          return groups;
        }
        
        if (grouping === 'time_type') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            const group = `${entry.timeBucket} ▸ ${entry.type}`;
            if (!groups[group]) groups[group] = [];
            groups[group].push(entry);
          });
          return groups;
        }
        
        if (grouping === 'type_time') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            const group = `${entry.type} ▸ ${entry.timeBucket}`;
            if (!groups[group]) groups[group] = [];
            groups[group].push(entry);
          });
          return groups;
        }
        
        return { 'All Entries': sortedEntries };
      },

      getTimeBucketFromDate: (date?: Date): TimeBucket => {
        if (!date) return 'none';
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const endOfNextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (dueDate < today) return 'overdue';
        if (dueDate.getTime() === today.getTime()) return 'today';
        if (dueDate.getTime() === tomorrow.getTime()) return 'tomorrow';
        if (dueDate <= endOfWeek) return 'this_week';
        if (dueDate <= endOfNextWeek) return 'next_week';
        if (dueDate.getTime() < today.getTime() + 30 * 24 * 60 * 60 * 1000) return 'later';
        return 'someday';
      },
    }),
    {
      name: 'allymind-storage',
      partialize: (state) => ({
        entries: state.entries,
        homeViewPrefs: state.homeViewPrefs,
      }),
    }
  )
); 
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entry, TimeBucket, Priority, HomeViewPreferences, GroupingMode, AppView } from '../types';

interface AllyMindStore {
  entries: Entry[];
  homeViewPrefs: HomeViewPreferences;
  currentView: AppView;
  
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
    timeBuckets: ['overdue', 'today', 'tomorrow', 'this_week', 'next_week', 'later', 'someday', 'none'],
    status: 'both',
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
          try {
            // Handle both old and new entry formats using type assertion
            const oldEntry = entry as any;
            const entryType = entry.type || 'thought'; // Default to thought for old entries
            const entryCompleted = entry.completed || oldEntry.status === 'completed' || false;
            const entryPinned = entry.pinned || !!oldEntry.pinnedForDate || false;
            
            // Type filter - convert old types to new simplified types
            let normalizedType = entryType;
            if (['idea', 'insight', 'reflection', 'journal', 'reminder', 'note', 'event'].includes(entryType)) {
              normalizedType = 'thought';
            }
            if (!filters.types.includes(normalizedType as any)) return false;
            
            // Time bucket filter - calculate for old entries if missing
            let timeBucket = entry.timeBucket;
            if (!timeBucket) {
              if (oldEntry.dueDate) {
                try {
                  const dueDate = new Date(oldEntry.dueDate);
                  if (!isNaN(dueDate.getTime())) {
                    timeBucket = get().getTimeBucketFromDate(dueDate);
                  } else {
                    timeBucket = 'none';
                  }
                } catch {
                  timeBucket = 'none';
                }
              } else if (oldEntry.pinnedForDate) {
                try {
                  const pinnedDate = new Date(oldEntry.pinnedForDate);
                  if (!isNaN(pinnedDate.getTime())) {
                    timeBucket = get().getTimeBucketFromDate(pinnedDate);
                  } else {
                    timeBucket = 'none';
                  }
                } catch {
                  timeBucket = 'none';
                }
              } else {
                timeBucket = 'none';
              }
            }
            if (!filters.timeBuckets.includes(timeBucket)) return false;
            
            // Status filter
            if (filters.status === 'incomplete' && entryCompleted) return false;
            if (filters.status === 'completed' && !entryCompleted) return false;
            
            // Pinned filter
            if (filters.pinnedOnly && !entryPinned) return false;
            
            // Search filter
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              const content = entry.title || oldEntry.content || '';
              const body = entry.body || oldEntry.content || '';
              const tags = entry.tags || [];
              
              const matchesTitle = content.toLowerCase().includes(query);
              const matchesBody = body.toLowerCase().includes(query);
              const matchesTags = tags.some(tag => tag.toLowerCase().includes(query));
              if (!matchesTitle && !matchesBody && !matchesTags) return false;
            }
            
            return true;
          } catch (error) {
            console.error('Error filtering entry:', entry, error);
            return false; // Skip problematic entries
          }
        });
      },

      getGroupedEntries: () => {
        const { getFilteredEntries, homeViewPrefs } = get();
        const filteredEntries = getFilteredEntries();
        const { grouping, sort } = homeViewPrefs;
        
        // Sort entries
        const sortedEntries = [...filteredEntries].sort((a, b) => {
          try {
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
                try {
                  const aTime = a.dueAt instanceof Date ? a.dueAt.getTime() : new Date(a.dueAt).getTime();
                  const bTime = b.dueAt instanceof Date ? b.dueAt.getTime() : new Date(b.dueAt).getTime();
                  if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
                    return aTime - bTime;
                  }
                } catch (error) {
                  console.error('Error comparing dueAt dates:', error);
                }
              }
            } else if (sort.primary === 'createdAt') {
              try {
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
                  return bTime - aTime;
                }
              } catch (error) {
                console.error('Error comparing createdAt dates:', error);
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
                try {
                  const aTime = a.dueAt instanceof Date ? a.dueAt.getTime() : new Date(a.dueAt).getTime();
                  const bTime = b.dueAt instanceof Date ? b.dueAt.getTime() : new Date(b.dueAt).getTime();
                  if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
                    return aTime - bTime;
                  }
                } catch (error) {
                  console.error('Error comparing dueAt dates in secondary sort:', error);
                }
              }
            } else if (sort.secondary === 'createdAt') {
              try {
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
                  return bTime - aTime;
                }
              } catch (error) {
                console.error('Error comparing createdAt dates in secondary sort:', error);
              }
            }
            
                      // Final sort: pinned first, then by creation date
          if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
          try {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            if (!isNaN(aTime) && !isNaN(bTime)) {
              return bTime - aTime;
            }
          } catch (error) {
            console.error('Error comparing createdAt dates in final sort:', error);
          }
          return 0;
          } catch (error) {
            console.error('Error sorting entries:', error);
            return 0; // Keep original order if sorting fails
          }
        });
        
        // Group entries
        if (grouping === 'none') {
          return { 'All Entries': sortedEntries };
        }
        
        if (grouping === 'time') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            try {
              // Handle old entries that might not have timeBucket
              let group = entry.timeBucket;
              if (!group) {
                const oldEntry = entry as any;
                if (oldEntry.dueDate) {
                  try {
                    const dueDate = new Date(oldEntry.dueDate);
                    if (!isNaN(dueDate.getTime())) {
                      group = get().getTimeBucketFromDate(dueDate);
                    } else {
                      group = 'none';
                    }
                  } catch {
                    group = 'none';
                  }
                } else if (oldEntry.pinnedForDate) {
                  try {
                    const pinnedDate = new Date(oldEntry.pinnedForDate);
                    if (!isNaN(pinnedDate.getTime())) {
                      group = get().getTimeBucketFromDate(pinnedDate);
                    } else {
                      group = 'none';
                    }
                  } catch {
                    group = 'none';
                  }
                } else {
                  group = 'none';
                }
              }
              if (!groups[group]) groups[group] = [];
              groups[group].push(entry);
            } catch (error) {
              console.error('Error grouping entry by time:', entry, error);
              // Put problematic entries in 'none' group
              if (!groups['none']) groups['none'] = [];
              groups['none'].push(entry);
            }
          });
          return groups;
        }
        
        if (grouping === 'type') {
          const groups: Record<string, Entry[]> = {};
          sortedEntries.forEach((entry) => {
            // Handle old entry types - convert to simplified types
            let group = entry.type;
            if (['idea', 'insight', 'reflection', 'journal', 'reminder', 'note', 'event'].includes(group)) {
              group = 'thought';
            }
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
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { 
  AppView, 
  Entry, 
  EntryType, 
  Priority, 
  CalendarEvent,
  ReviewSummary,
  AnalyticsData,
  SearchResult,
  AppState,
  UIState,
  AutoAction
} from '../types';

interface GenieNotesStore {
  // Core data
  entries: Entry[];
  calendarEvents: CalendarEvent[];
  
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
  
  // Auto-actions
  completeAutoAction: (entryId: string, actionId: string) => void;
  addAutoAction: (entryId: string, action: Omit<AutoAction, 'id'>) => void;
  
  // Calendar management
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  
  // Search and filtering
  searchEntries: (query: string) => SearchResult[];
  getEntriesByType: (type: EntryType) => Entry[];
  getEntriesByTag: (tag: string) => Entry[];
  getEntriesByDateRange: (start: Date, end: Date) => Entry[];
  
  // Next Up logic
  getNextUpEntries: () => Entry[];
  getTodayEntries: () => Entry[];
  getThisWeekEntries: () => Entry[];
  getUpcomingEntries: () => Entry[];
  
  // Reviews and insights
  generateDailyReview: () => ReviewSummary;
  generateWeeklyReview: () => ReviewSummary;
  generateMonthlyReview: () => ReviewSummary;
  getAnalytics: () => AnalyticsData;
  
  // UI state management
  setCurrentView: (view: AppView) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Partial<AppState['activeFilters']>) => void;
  toggleFocusMode: () => void;
  toggleSidebar: () => void;
  toggleConfirmationFeed: () => void;
  setSelectedEntry: (id: string | null) => void;
  setEditingEntry: (id: string | null) => void;
  
  // Utility functions
  exportToICS: (entryId: string) => string;
  importFromText: () => Entry[];
  debugEntries: () => { total: number; nextUp: number };
  
  // Helper methods for analytics
  getTopTags: (entries: Entry[]) => Array<{ tag: string; count: number }>;
  getTopThemes: (entries: Entry[]) => string[];
  generateInsights: (entries: Entry[]) => string[];
  getEntriesByTypeCount: (entries: Entry[]) => Record<string, number>;
  getEntriesByTimeCount: (entries: Entry[]) => Array<{ hour: number; count: number }>;
  getEntriesByDayCount: (entries: Entry[]) => Array<{ day: string; count: number }>;
  getCompletionRate: (entries: Entry[]) => number;
  getAverageMood: (entries: Entry[]) => number;
  getProductivityScore: (entries: Entry[]) => number;
}

export const useGenieNotesStore = create<GenieNotesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      entries: [],
      calendarEvents: [],
      
      appState: {
        currentView: 'nextup',
        searchQuery: '',
        activeFilters: {
          types: [],
          tags: [],
          dateRange: null
        },
        focusMode: false
      },
      
      uiState: {
        sidebarOpen: false,
        showConfirmationFeed: false,
        selectedEntryId: null,
        editingEntryId: null,
        theme: 'light'
      },
      
      // Entry management
      addEntry: (entryData) => {
        const entry: Entry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          entries: [entry, ...state.entries]
        }));
        
        // Auto-generate calendar event for events
        if (entry.type === 'event' && entry.startDate) {
          const startDate = entry.startDate instanceof Date ? entry.startDate : new Date(entry.startDate);
          const calendarEvent: CalendarEvent = {
            id: crypto.randomUUID(),
            title: entry.content,
            startDate: startDate,
            endDate: entry.endDate || new Date(startDate.getTime() + 60 * 60 * 1000),
            location: entry.location,
            description: entry.notes,
            type: entry.type,
            entryId: entry.id
          };
          
          set((state) => ({
            calendarEvents: [calendarEvent, ...state.calendarEvents]
          }));
        }
      },
      
      updateEntry: (id, updates) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { ...entry, ...updates, updatedAt: new Date() } : entry
        )
      })),
      
      deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
        calendarEvents: state.calendarEvents.filter((event) => event.entryId !== id)
      })),
      
      completeEntry: (id) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { ...entry, status: 'completed', completedAt: new Date(), updatedAt: new Date() } : entry
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
      
      // Auto-actions
      completeAutoAction: (entryId, actionId) => set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                autoActions: entry.autoActions.map((action) =>
                  action.id === actionId ? { ...action, completed: true } : action
                ),
                updatedAt: new Date()
              }
            : entry
        )
      })),
      
      addAutoAction: (entryId, actionData) => {
        const action: AutoAction = {
          ...actionData,
          id: crypto.randomUUID()
        };
        
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, autoActions: [...entry.autoActions, action], updatedAt: new Date() }
              : entry
          )
        }));
      },
      
      // Calendar management
      addCalendarEvent: (eventData) => {
        const event: CalendarEvent = {
          ...eventData,
          id: crypto.randomUUID()
        };
        
        set((state) => ({
          calendarEvents: [event, ...state.calendarEvents]
        }));
      },
      
      updateCalendarEvent: (id, updates) => set((state) => ({
        calendarEvents: state.calendarEvents.map((event) =>
          event.id === id ? { ...event, ...updates } : event
        )
      })),
      
      deleteCalendarEvent: (id) => set((state) => ({
        calendarEvents: state.calendarEvents.filter((event) => event.id !== id)
      })),
      
      // Search and filtering
      searchEntries: (query) => {
        const { entries } = get();
        const lowerQuery = query.toLowerCase();
        
        return entries
          .filter(entry => 
            entry.content.toLowerCase().includes(lowerQuery) ||
            entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            entry.location?.toLowerCase().includes(lowerQuery)
          )
          .map(entry => ({
            entry,
            relevance: calculateRelevance(entry, lowerQuery),
            matchedFields: getMatchedFields(entry, lowerQuery),
            relatedEntries: findRelatedEntries(entry, entries)
          }))
          .sort((a, b) => b.relevance - a.relevance);
      },
      
      getEntriesByType: (type) => get().entries.filter(entry => entry.type === type),
      getEntriesByTag: (tag) => get().entries.filter(entry => entry.tags.includes(tag)),
      
      getEntriesByDateRange: (start, end) => get().entries.filter(entry => {
        const entryDate = entry.dueDate || entry.startDate || entry.createdAt;
        return entryDate >= start && entryDate <= end;
      }),
      
      // Next Up logic
      getNextUpEntries: () => {
        const { entries } = get();
        
        return entries
          .filter(entry => entry.status !== 'completed')
          .sort((a, b) => {
            // Priority ranking: deadlines > prep dependencies > importance > recency
            
            // First, prioritize entries with due dates
            const aHasDueDate = a.dueDate || a.startDate;
            const bHasDueDate = b.dueDate || b.startDate;
            
            if (aHasDueDate && !bHasDueDate) return -1;
            if (!aHasDueDate && bHasDueDate) return 1;
            
            // If both have due dates, sort by date
            if (aHasDueDate && bHasDueDate) {
              const aDate = a.dueDate || a.startDate;
              const bDate = b.dueDate || b.startDate;
              if (aDate && bDate) {
                const aDateObj = aDate instanceof Date ? aDate : new Date(aDate);
                const bDateObj = bDate instanceof Date ? bDate : new Date(bDate);
                return aDateObj.getTime() - bDateObj.getTime();
              }
            }
            
            // Then by priority
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            
            if (aPriority !== bPriority) {
              return bPriority - aPriority;
            }
            
            // Finally by recency (newest first)
            const aCreated = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const bCreated = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return bCreated.getTime() - aCreated.getTime();
          });
      },
      
      getTodayEntries: () => {
        const { entries } = get();
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
        
        return entries.filter(entry => {
          // Include entries created today OR entries due today
          const created = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
          const isCreatedToday = created >= todayStart && created <= todayEnd;
          
          const entryDate = entry.dueDate || entry.startDate;
          if (entryDate) {
            const date = entryDate instanceof Date ? entryDate : new Date(entryDate);
            const isDueToday = date >= todayStart && date <= todayEnd;
            return isCreatedToday || isDueToday;
          }
          
          return isCreatedToday;
        });
      },
      
      getThisWeekEntries: () => {
        const { entries } = get();
        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        
        return entries.filter(entry => {
          // Include entries created this week OR entries due this week
          const created = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
          const isCreatedThisWeek = created >= weekStart && created <= weekEnd;
          
          const entryDate = entry.dueDate || entry.startDate;
          if (entryDate) {
            const date = entryDate instanceof Date ? entryDate : new Date(entryDate);
            const isDueThisWeek = date >= weekStart && date <= weekEnd;
            return isCreatedThisWeek || isDueThisWeek;
          }
          
          return isCreatedThisWeek;
        });
      },
      
      getUpcomingEntries: () => {
        const { entries } = get();
        const now = new Date();
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return entries.filter(entry => {
          // Include entries created in the future OR entries due in the future
          const created = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
          const isCreatedInFuture = created > weekEnd;
          
          const entryDate = entry.dueDate || entry.startDate;
          if (entryDate) {
            const date = entryDate instanceof Date ? entryDate : new Date(entryDate);
            const isDueInFuture = date > weekEnd;
            return isCreatedInFuture || isDueInFuture;
          }
          
          return isCreatedInFuture;
        });
      },
      
      // Reviews and insights
      generateDailyReview: () => {
        const { entries } = get();
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
        
        const todayEntries = entries.filter(entry => {
          const created = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
          return created >= todayStart && created <= todayEnd;
        });
        
        return {
          period: 'daily',
          startDate: todayStart,
          endDate: todayEnd,
          totalEntries: todayEntries.length,
          completedTasks: todayEntries.filter(e => e.status === 'completed').length,
          upcomingDeadlines: todayEntries.filter(e => {
            if (!e.dueDate) return false;
            const due = e.dueDate instanceof Date ? e.dueDate : new Date(e.dueDate);
            return due > today;
          }).length,
          topTags: get().getTopTags(todayEntries),
          topThemes: get().getTopThemes(todayEntries),
          insights: get().generateInsights(todayEntries)
        };
      },
      
      generateWeeklyReview: () => {
        const { entries } = get();
        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
        
        const weekEntries = entries.filter(entry => 
          entry.createdAt >= weekStart && entry.createdAt <= weekEnd
        );
        
        return {
          period: 'weekly',
          startDate: weekStart,
          endDate: weekEnd,
          totalEntries: weekEntries.length,
          completedTasks: weekEntries.filter(e => e.status === 'completed').length,
          upcomingDeadlines: weekEntries.filter(e => e.dueDate && e.dueDate > now).length,
          topTags: get().getTopTags(weekEntries),
          topThemes: get().getTopThemes(weekEntries),
          insights: get().generateInsights(weekEntries)
        };
      },
      
      generateMonthlyReview: () => {
        const { entries } = get();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const monthEntries = entries.filter(entry => 
          entry.createdAt >= monthStart && entry.createdAt <= monthEnd
        );
        
        return {
          period: 'monthly',
          startDate: monthStart,
          endDate: monthEnd,
          totalEntries: monthEntries.length,
          completedTasks: monthEntries.filter(e => e.status === 'completed').length,
          upcomingDeadlines: monthEntries.filter(e => e.dueDate && e.dueDate > now).length,
          topTags: get().getTopTags(monthEntries),
          topThemes: get().getTopThemes(monthEntries),
          insights: get().generateInsights(monthEntries)
        };
      },
      
      getAnalytics: () => {
        const { entries } = get();
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentEntries = entries.filter(entry => entry.createdAt >= last30Days);
        
        return {
          totalEntries: entries.length,
          entriesByType: get().getEntriesByTypeCount(recentEntries),
          entriesByTime: get().getEntriesByTimeCount(recentEntries),
          entriesByDay: get().getEntriesByDayCount(recentEntries),
          topTags: get().getTopTags(recentEntries),
          completionRate: get().getCompletionRate(recentEntries),
          averageMood: get().getAverageMood(recentEntries),
          productivityScore: get().getProductivityScore(recentEntries)
        };
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
      
      toggleFocusMode: () => set((state) => ({
        appState: { ...state.appState, focusMode: !state.appState.focusMode }
      })),
      
      toggleSidebar: () => set((state) => ({
        uiState: { ...state.uiState, sidebarOpen: !state.uiState.sidebarOpen }
      })),
      
      toggleConfirmationFeed: () => set((state) => ({
        uiState: { ...state.uiState, showConfirmationFeed: !state.uiState.showConfirmationFeed }
      })),
      
      setSelectedEntry: (id) => set((state) => ({
        uiState: { ...state.uiState, selectedEntryId: id }
      })),
      
      setEditingEntry: (id) => set((state) => ({
        uiState: { ...state.uiState, editingEntryId: id }
      })),
      
      // Utility functions
      exportToICS: (entryId) => {
        const { entries } = get();
        const entry = entries.find(e => e.id === entryId);
        if (!entry) return '';
        
        const startDate = entry.startDate || entry.dueDate || entry.createdAt;
        const startDateObj = startDate instanceof Date ? startDate : new Date(startDate);
        const endDate = entry.endDate || new Date(startDateObj.getTime() + 60 * 60 * 1000);
        const endDateObj = endDate instanceof Date ? endDate : new Date(endDate);
        
        return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${entry.content}
DTSTART:${startDateObj.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDateObj.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DESCRIPTION:${entry.notes || ''}
LOCATION:${entry.location || ''}
END:VEVENT
END:VCALENDAR`;
      },
      
      // Debug function to help troubleshoot
      debugEntries: () => {
        const { entries } = get();
        console.log('=== DEBUG: All Entries ===');
        console.log('Total entries:', entries.length);
        entries.forEach((entry, index) => {
          console.log(`${index + 1}. ${entry.type}: "${entry.content}"`, {
            id: entry.id,
            status: entry.status,
            priority: entry.priority,
            dueDate: entry.dueDate,
            startDate: entry.startDate,
            createdAt: entry.createdAt,
            tags: entry.tags
          });
        });
        
        console.log('=== DEBUG: Next Up Entries ===');
        const nextUp = get().getNextUpEntries();
        console.log('Next Up count:', nextUp.length);
        nextUp.forEach((entry, index) => {
          console.log(`${index + 1}. ${entry.type}: "${entry.content}"`);
        });
        
        return { total: entries.length, nextUp: nextUp.length };
      },
      
      importFromText: () => {
        // This will be implemented to use the AI service
        return [];
      },
      
      // Helper methods for analytics
      getTopTags: (entries: Entry[]) => {
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
      
      getTopThemes: (entries: Entry[]) => {
        const themes = entries
          .filter(e => e.tags.includes('goal') || e.tags.includes('priority'))
          .map(e => e.content.split(' ').slice(0, 3).join(' '));
        return [...new Set(themes)].slice(0, 5);
      },
      
      generateInsights: (entries: Entry[]) => {
        const insights: string[] = [];
        const completed = entries.filter(e => e.status === 'completed').length;
        const total = entries.length;
        
        if (completed > 0) {
          insights.push(`Completed ${completed} out of ${total} items`);
        }
        
        const highPriority = entries.filter(e => e.priority === 'high' || e.priority === 'urgent').length;
        if (highPriority > 0) {
          insights.push(`${highPriority} high-priority items need attention`);
        }
        
        return insights;
      },
      
      getEntriesByTypeCount: (entries: Entry[]) => {
        const counts: Record<string, number> = {};
        entries.forEach(entry => {
          counts[entry.type] = (counts[entry.type] || 0) + 1;
        });
        return counts;
      },
      
      getEntriesByTimeCount: (entries: Entry[]) => {
        const timeCounts: Record<number, number> = {};
        entries.forEach(entry => {
          const date = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
          const hour = date.getHours();
          timeCounts[hour] = (timeCounts[hour] || 0) + 1;
        });
        return Object.entries(timeCounts)
          .map(([hour, count]) => ({ hour: parseInt(hour), count }))
          .sort((a, b) => a.hour - b.hour);
      },
      
      getEntriesByDayCount: (entries: Entry[]) => {
        const dayCounts: Record<string, number> = {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        entries.forEach(entry => {
          const date = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
          const day = days[date.getDay()];
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        return days.map(day => ({ day, count: dayCounts[day] || 0 }));
      },
      
      getCompletionRate: (entries: Entry[]) => {
        const tasks = entries.filter(e => e.type === 'task');
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(e => e.status === 'completed').length;
        return Math.round((completed / tasks.length) * 100);
      },
      
      getAverageMood: (entries: Entry[]) => {
        const moodEntries = entries.filter(e => e.mood);
        if (moodEntries.length === 0) return 0;
        const moodValues = { great: 5, good: 4, okay: 3, bad: 2, terrible: 1 };
        const total = moodEntries.reduce((sum, e) => sum + moodValues[e.mood!], 0);
        return Math.round(total / moodEntries.length);
      },
      
      getProductivityScore: (entries: Entry[]) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEntries = entries.filter(e => {
          const date = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt);
          return date >= today;
        });
        
        let score = 0;
        score += todayEntries.filter(e => e.status === 'completed').length * 10;
        score += todayEntries.filter(e => e.priority === 'high' || e.priority === 'urgent').length * 5;
        score += todayEntries.filter(e => e.type === 'task').length * 2;
        
        return Math.min(score, 100);
      }
    }),
    {
      name: "genienotes-storage",
      partialize: (state) => ({
        entries: state.entries,
        calendarEvents: state.calendarEvents,
        appState: state.appState,
        uiState: state.uiState
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert date strings back to Date objects
          state.entries = state.entries.map(entry => ({
            ...entry,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
            dueDate: entry.dueDate ? new Date(entry.dueDate) : undefined,
            startDate: entry.startDate ? new Date(entry.startDate) : undefined,
            endDate: entry.endDate ? new Date(entry.endDate) : undefined,
            reminderDate: entry.reminderDate ? new Date(entry.reminderDate) : undefined,
            completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined
          }));
          
          state.calendarEvents = state.calendarEvents.map(event => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate)
          }));
        }
      }
    }
  )
);

// Helper functions (these would be moved to a separate utils file in a real implementation)
function calculateRelevance(entry: Entry, query: string): number {
  let score = 0;
  
  if (entry.content.toLowerCase().includes(query)) score += 10;
  if (entry.tags.some(tag => tag.toLowerCase().includes(query))) score += 5;
  if (entry.location?.toLowerCase().includes(query)) score += 3;
  
  return score;
}

function getMatchedFields(entry: Entry, query: string): string[] {
  const fields: string[] = [];
  
  if (entry.content.toLowerCase().includes(query)) fields.push('content');
  if (entry.tags.some(tag => tag.toLowerCase().includes(query))) fields.push('tags');
  if (entry.location?.toLowerCase().includes(query)) fields.push('location');
  
  return fields;
}

function findRelatedEntries(entry: Entry, allEntries: Entry[]): Entry[] {
  return allEntries
    .filter(e => e.id !== entry.id)
    .filter(e => 
      e.tags.some(tag => entry.tags.includes(tag)) ||
      e.content.toLowerCase().includes(entry.content.toLowerCase().split(' ')[0])
    )
    .slice(0, 3);
} 
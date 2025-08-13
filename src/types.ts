// AI Personal Assistant Types for GenieNotes
export type AppView = 'capture' | 'nextup' | 'inbox' | 'calendar' | 'reviews' | 'insights';

// Entry classification types
export type EntryType = 'task' | 'event' | 'idea' | 'insight' | 'reflection' | 'journal';

// Priority levels
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Status for tasks
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Mood for reflections/journal
export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

// Unified entry interface
export interface Entry {
  id: string;
  content: string;
  type: EntryType;
  createdAt: Date;
  updatedAt: Date;
  
  // Classification metadata
  confidence: number; // AI confidence in classification
  tags: string[];
  priority: Priority;
  
  // Date/time handling
  dueDate?: Date; // For tasks
  startDate?: Date; // For events
  endDate?: Date; // For events
  reminderDate?: Date; // When to remind
  
  // Location
  location?: string;
  
  // Relationships
  parentId?: string; // For prep tasks linked to events
  relatedIds: string[]; // Related entries
  
  // Status and progress
  status: TaskStatus;
  completedAt?: Date;
  
  // Additional metadata
  notes?: string;
  mood?: Mood; // For reflections/journal
  
  // Auto-generated actions
  autoActions: AutoAction[];
}

// Auto-generated actions
export interface AutoAction {
  id: string;
  type: 'prep_task' | 'reminder' | 'follow_up' | 'research';
  content: string;
  dueDate?: Date;
  completed: boolean;
}

// Parsed input result
export interface ParsedInput {
  entries: Entry[];
  confidence: number;
  suggestions: string[];
}

// Date parsing result
export interface DateParseResult {
  date: Date;
  confidence: number;
  type: 'exact' | 'relative' | 'fuzzy';
  context: string;
}

// Location parsing result
export interface LocationParseResult {
  location: string;
  confidence: number;
  type: 'exact' | 'fuzzy' | 'inferred';
}

// AI classification result
export interface ClassificationResult {
  type: EntryType;
  confidence: number;
  reasoning: string;
  suggestedTags: string[];
  suggestedPriority: Priority;
}

// Calendar event
export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  description?: string;
  type: EntryType;
  entryId: string; // Link to original entry
}

// Review summary
export interface ReviewSummary {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalEntries: number;
  completedTasks: number;
  upcomingDeadlines: number;
  topTags: Array<{ tag: string; count: number }>;
  topThemes: string[];
  moodTrend?: Mood;
  insights: string[];
}

// Analytics data
export interface AnalyticsData {
  totalEntries: number;
  entriesByType: Record<EntryType, number>;
  entriesByTime: Array<{ hour: number; count: number }>;
  entriesByDay: Array<{ day: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
  completionRate: number;
  averageMood: number;
  productivityScore: number;
}

// Search result
export interface SearchResult {
  entry: Entry;
  relevance: number;
  matchedFields: string[];
  relatedEntries: Entry[];
}

// App state
export interface AppState {
  currentView: AppView;
  searchQuery: string;
  activeFilters: {
    types: EntryType[];
    tags: string[];
    dateRange: { start: Date; end: Date } | null;
  };
  focusMode: boolean;
}

// UI state
export interface UIState {
  sidebarOpen: boolean;
  showConfirmationFeed: boolean;
  selectedEntryId: string | null;
  editingEntryId: string | null;
  theme: 'light' | 'dark';
}
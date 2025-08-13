export type AppView = 'capture' | 'home';

export type EntryType = 'task' | 'event' | 'idea' | 'insight' | 'reflection' | 'journal' | 'reminder' | 'note';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export type ReviewReason = 'unclear_outcome' | 'overdue' | 'ignored_long_time' | 'needs_clarification' | 'low_confidence';

export interface Entry {
  id: string;
  content: string;
  type: EntryType;
  createdAt: Date;
  updatedAt: Date;
  
  // AI Analysis
  confidence: number; // AI confidence in classification
  reasoning: string; // Why AI classified it this way
  needsReview: boolean; // Flag for review section
  reviewReason?: ReviewReason;
  reviewNote?: string;
  
  // Parsed Data
  tags: string[];
  priority: Priority;
  dueDate?: Date;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  people?: string[]; // Extracted people names
  
  // Additional Context
  notes?: string;
  mood?: Mood; // For reflections/journal
  status: TaskStatus; // For tasks
  
  // Relationships
  relatedIds: string[]; // Related entries
  parentId?: string; // For subtasks
  
  // Metadata
  reminderDate?: Date;
  completedAt?: Date;
  lastReviewedAt?: Date;
}

export interface AppState {
  currentView: AppView;
  searchQuery: string;
  activeFilters: {
    type: EntryType | 'all';
    priority: Priority | 'all';
    status: TaskStatus | 'all';
    tags: string[];
    needsReview: boolean;
  };
}

export interface UIState {
  selectedEntryId: string | null;
  editingEntryId: string | null;
  showReviewModal: boolean;
  sidebarOpen: boolean;
  focusMode: boolean;
}
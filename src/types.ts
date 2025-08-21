export type AppView = 'capture' | 'home';

export type EntryType = 'task' | 'thought';

export type TimeBucket = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'later' | 'someday' | 'none';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type GroupingMode = 'none' | 'time' | 'type' | 'time_type' | 'type_time';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Entry {
  id: string;
  type: EntryType;
  title: string;
  body: string;
  tags: string[];
  createdAt: Date;
  dueAt?: Date;
  timeBucket: TimeBucket;
  priority?: Priority;
  pinned?: boolean;
  completed?: boolean; // Only for tasks
  aiConfidence?: number;
  // New fields for enhanced task management
  note?: string; // AI-generated insights + user notes
  subTasks?: SubTask[];
  progress?: number; // 0-100 based on sub-tasks completion
}

export interface HomeViewPreferences {
  grouping: GroupingMode;
  filters: {
    types: EntryType[];
    timeBuckets: TimeBucket[];
    status: 'incomplete' | 'completed' | 'both';
    pinnedOnly: boolean;
  };
  sort: {
    primary: 'timeBucket' | 'priority' | 'dueAt' | 'createdAt';
    secondary: 'priority' | 'dueAt' | 'createdAt';
  };
  collapsedGroups: Record<string, boolean>;
  searchQuery: string;
}

export interface AppState {
  currentView: AppView;
  homeViewPrefs: HomeViewPreferences;
}

export interface UIState {
  selectedEntryIds: Set<string>;
  expandedEntryIds: Set<string>;
  showKeyboardShortcuts: boolean;
  showBulkActions: boolean;
}
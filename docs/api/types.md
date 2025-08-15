# GenieNotes Types & Interfaces

**File:** `src/types.ts`  
**Purpose:** TypeScript type definitions for the entire application

## Core Types

### AppView
```typescript
export type AppView = 'capture' | 'home';
```
Defines the main application views available to users.

### EntryType
```typescript
export type EntryType = 'task' | 'event' | 'idea' | 'insight' | 'reflection' | 'journal' | 'reminder' | 'note';
```
Categorizes the different types of thoughts and entries users can create.

**Type Descriptions:**
- **task:** Actionable items to complete
- **event:** Scheduled activities and meetings
- **idea:** Creative concepts and possibilities
- **insight:** Key learnings and realizations
- **reflection:** Personal thoughts and feelings
- **journal:** Daily entries and experiences
- **reminder:** Time-sensitive notifications
- **note:** General information and observations

### Priority
```typescript
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
```
Defines the importance level of entries.

**Priority Levels:**
- **urgent:** Highest priority, immediate attention required
- **high:** Important, complete soon
- **medium:** Standard priority (default)
- **low:** Lower priority, can wait

### TaskStatus
```typescript
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';
```
Tracks the completion state of task-type entries.

**Status Values:**
- **pending:** Not yet started
- **in_progress:** Currently being worked on
- **completed:** Finished successfully
- **archived:** No longer relevant

### Mood
```typescript
export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';
```
Represents emotional state for reflection and journal entries.

### ReviewReason
```typescript
export type ReviewReason = 'unclear_outcome' | 'overdue' | 'ignored_long_time' | 'needs_clarification' | 'low_confidence';
```
Categorizes why an entry needs review.

**Review Reasons:**
- **unclear_outcome:** Ambiguous or unclear goals
- **overdue:** Past due dates
- **ignored_long_time:** Long-neglected entries
- **needs_clarification:** Requires more detail
- **low_confidence:** AI had low confidence in parsing

## Main Interfaces

### Entry
The core data structure representing a captured thought or task.

```typescript
export interface Entry {
  // Core identification
  id: string;
  content: string;           // Clean, directive-free content for display
  rawContent: string;        // Original text with directives for reference/debug
  type: EntryType;
  createdAt: Date;
  updatedAt: Date;
  
  // AI Analysis
  confidence: number;        // AI confidence in classification (0-1)
  reasoning: string;         // Why AI classified it this way
  needsReview: boolean;      // Flag for review section
  reviewReason?: ReviewReason;
  reviewNote?: string;
  
  // Parsed Data
  tags: string[];            // User tags only (excludes directive tags)
  priority: Priority;
  dueDate?: Date;            // Specific due date/time
  pinnedForDate?: Date;      // Date to pin to (e.g., today, specific date)
  targetWeek?: string;       // Target week (e.g., "currentWeek", "nextWeek")
  startDate?: Date;
  endDate?: Date;
  location?: string;
  people?: string[];         // Extracted people names
  
  // Additional Context
  notes?: string;
  mood?: Mood;               // For reflections/journal
  status: TaskStatus;        // For tasks
  
  // Relationships
  parentId?: string;         // For subtasks
  relatedIds: string[];      // Related entries
  
  // Metadata
  reminderDate?: Date;
  completedAt?: Date;
  lastReviewedAt?: Date;
}
```

### AppState
Manages the main application state and user preferences.

```typescript
export interface AppState {
  currentView: AppView;      // Currently active view
  searchQuery: string;       // Current search term
  activeFilters: {
    type: EntryType | 'all';
    priority: Priority | 'all';
    status: TaskStatus | 'all';
    tags: string[];
    needsReview: boolean;
  };
}
```

### UIState
Manages UI-specific state and user interactions.

```typescript
export interface UIState {
  selectedEntryId: string | null;    // Currently selected entry
  editingEntryId: string | null;     // Entry being edited
  showReviewModal: boolean;          // Review modal visibility
  sidebarOpen: boolean;              // Sidebar visibility
  focusMode: boolean;                // Focus mode state
}
```

## Type Usage Examples

### Creating a New Entry
```typescript
const newEntry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'> = {
  content: "Complete project documentation",
  rawContent: "Complete project documentation #task #urgent",
  type: "task",
  priority: "urgent",
  tags: ["project", "documentation"],
  dueDate: new Date("2024-01-15"),
  status: "pending",
  confidence: 0.95,
  reasoning: "Contains actionable language 'complete' and urgency indicator",
  needsReview: false,
  relatedIds: []
};
```

### Filtering by Type
```typescript
const filterByType = (entries: Entry[], type: EntryType): Entry[] => {
  return entries.filter(entry => entry.type === type);
};

const tasks = filterByType(allEntries, 'task');
const ideas = filterByType(allEntries, 'idea');
```

### Priority-Based Sorting
```typescript
const sortByPriority = (entries: Entry[]): Entry[] => {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  
  return entries.sort((a, b) => {
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};
```

### Review System Usage
```typescript
const markForReview = (entry: Entry, reason: ReviewReason, note?: string) => {
  const updatedEntry: Entry = {
    ...entry,
    needsReview: true,
    reviewReason: reason,
    reviewNote: note,
    lastReviewedAt: new Date()
  };
  
  return updatedEntry;
};

// Usage
const entryNeedingReview = markForReview(
  someEntry, 
  'needs_clarification', 
  'Need more details about the project scope'
);
```

## Type Safety Benefits

### Compile-Time Validation
- **Interface Compliance:** Ensures objects match expected structure
- **Method Signatures:** Validates function parameters and return types
- **Property Access:** Prevents accessing non-existent properties

### Development Experience
- **IntelliSense:** Autocomplete and type hints
- **Error Detection:** Catches type mismatches early
- **Refactoring:** Safe renaming and restructuring

### Runtime Safety
- **Data Validation:** Ensures data integrity
- **API Contracts:** Clear expectations for data exchange
- **Error Prevention:** Reduces runtime errors

## Future Type Extensions

### Potential New Types
```typescript
// Collaboration features
export type CollaborationLevel = 'private' | 'shared' | 'public';
export type Permission = 'read' | 'write' | 'admin';

// Advanced categorization
export type Category = 'work' | 'personal' | 'health' | 'learning';
export type Project = 'active' | 'completed' | 'archived';

// Time tracking
export type TimeUnit = 'minutes' | 'hours' | 'days' | 'weeks';
export type Recurrence = 'daily' | 'weekly' | 'monthly' | 'yearly';
```

### Enhanced Interfaces
```typescript
// With collaboration
interface CollaborativeEntry extends Entry {
  collaborationLevel: CollaborationLevel;
  permissions: Permission[];
  collaborators: string[];
}

// With time tracking
interface TimeTrackedEntry extends Entry {
  estimatedTime?: number;
  actualTime?: number;
  timeUnit: TimeUnit;
  recurrence?: Recurrence;
}
```

## Related Files
- **Store:** `src/store/index.ts` - Uses these types for state management
- **Components:** All components implement these interfaces
- **App:** `src/App.tsx` - Type-safe routing and state

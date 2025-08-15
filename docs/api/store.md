# GenieNotes Store API

**File:** `src/store/index.ts`  
**Technology:** Zustand with persistence middleware

## Overview
The GenieNotes store is the central state management system that handles all data persistence, entry operations, and application state using Zustand with local storage persistence.

## Store Interface

### Core Data
```typescript
interface GenieNotesStore {
  // Core data
  entries: Entry[];
  
  // App state
  appState: AppState;
  uiState: UIState;
}
```

### Entry Management
```typescript
// Entry operations
addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => void;
updateEntry: (id: string, updates: Partial<Entry>) => void;
deleteEntry: (id: string) => void;
completeEntry: (id: string) => void;

// Entry modifications
changeEntryType: (id: string, newType: EntryType) => void;
changeEntryPriority: (id: string, newPriority: Priority) => void;
changeEntryTimePeriod: (id: string, period: 'today' | 'week' | 'upcoming') => void;
adjustPriority: (id: string, direction: 'up' | 'down') => void;
addEntryTag: (id: string, tag: string) => void;
removeEntryTag: (id: string, tag: string) => void;
setEntryDueDate: (id: string, dueDate: Date | null) => void;
setEntryLocation: (id: string, location: string | null) => void;
```

### Review System
```typescript
// Review operations
markForReview: (id: string, reason: ReviewReason, note?: string) => void;
markReviewed: (id: string) => void;
```

### Search and Filtering
```typescript
// Data retrieval
getFilteredEntries: () => Entry[];
getEntriesNeedingReview: () => Entry[];
getUrgentEntries: () => Entry[];
getTopTags: (entries: Entry[]) => Array<{ tag: string; count: number }>;
getEntriesByType: (type: EntryType) => Entry[];
getEntriesByPriority: (priority: Priority) => Entry[];
```

### UI State Management
```typescript
// View management
setCurrentView: (view: AppView) => void;
setSearchQuery: (query: string) => void;
setActiveFilters: (filters: Partial<AppState['activeFilters']>) => void;
setSelectedEntry: (id: string | null) => void;
setEditingEntry: (id: string | null) => void;

// UI toggles
toggleReviewModal: () => void;
toggleSidebar: () => void;
toggleFocusMode: () => void;
```

### Data Migration
```typescript
// Cleanup and migration
cleanupDuplicateTags: () => void;
cleanupDirectiveTags: () => void;
migrateEntriesToCleanFormat: () => void;
```

## State Structure

### AppState
```typescript
interface AppState {
  currentView: AppView; // 'capture' | 'home'
  searchQuery: string;
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
```typescript
interface UIState {
  selectedEntryId: string | null;
  editingEntryId: string | null;
  showReviewModal: boolean;
  sidebarOpen: boolean;
  focusMode: boolean;
}
```

## Key Functions

### addEntry(entryData)
Creates a new entry with automatic ID generation and timestamps.

**Process:**
1. Generate unique ID
2. Set creation and update timestamps
3. Ensure unique tags
4. Add to entries array
5. Persist to local storage

### updateEntry(id, updates)
Updates an existing entry with partial data.

**Features:**
- Partial updates supported
- Automatic timestamp updates
- Validation of update data
- Persistence to local storage

### getFilteredEntries()
Retrieves entries based on current filter state.

**Filtering Logic:**
- Search query matching
- Type filtering
- Priority filtering
- Status filtering
- Tag filtering
- Review status filtering

### getEntriesNeedingReview()
Identifies entries requiring user attention.

**Review Criteria:**
- `needsReview: true` flag
- Specific review reasons
- Overdue items
- Low confidence AI parsing

## Persistence

### Local Storage
- **Key:** `genie-notes-store`
- **Middleware:** Zustand persist middleware
- **Serialization:** Automatic JSON serialization
- **Hydration:** Automatic on app startup

### Data Migration
- **Version Tracking:** Store version management
- **Backward Compatibility:** Handles old data formats
- **Cleanup Functions:** Removes deprecated data

## Performance Features

### Efficient Updates
- **Immutable Updates:** Uses Zustand's immutable update patterns
- **Selective Re-renders:** Components only re-render when relevant state changes
- **Optimized Queries:** Cached filter results

### Memory Management
- **Lazy Loading:** Progressive data loading
- **Cleanup:** Automatic cleanup of old data
- **Size Limits:** Prevents excessive local storage usage

## Error Handling

### Validation
- **Input Validation:** Validates entry data before storage
- **Type Safety:** TypeScript interfaces ensure data integrity
- **Fallback Values:** Default values for missing data

### Recovery
- **Data Recovery:** Handles corrupted local storage
- **Fallback State:** Default state if store fails to load
- **Error Logging:** Console logging for debugging

## Usage Examples

### Adding an Entry
```typescript
const { addEntry } = useGenieNotesStore();

addEntry({
  content: "Complete project documentation",
  rawContent: "Complete project documentation #task #urgent",
  type: "task",
  priority: "urgent",
  tags: ["project", "documentation"],
  dueDate: new Date("2024-01-15"),
  status: "pending"
});
```

### Updating an Entry
```typescript
const { updateEntry } = useGenieNotesStore();

updateEntry("entry-id", {
  status: "completed",
  completedAt: new Date()
});
```

### Filtering Entries
```typescript
const { getFilteredEntries } = useGenieNotesStore();

const filteredEntries = getFilteredEntries();
// Returns entries based on current search and filter state
```

## Related Files
- **Types:** `src/types.ts` - TypeScript interfaces
- **Components:** All view components use the store
- **App:** `src/App.tsx` - Store initialization

## Future Enhancements
- Cloud synchronization
- Offline support
- Data export/import
- Advanced analytics
- Collaborative features

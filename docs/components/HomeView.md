# HomeView Component

**File:** `src/components/HomeView.tsx`  
**Purpose:** Time-based organization and daily workflow management interface

## Component Overview
HomeView provides a time-focused dashboard that organizes thoughts and tasks by urgency and time periods, helping users manage their daily workflow effectively.

## Props
This component has no external props - it's a self-contained view component.

## State Management
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [activeFilters, setActiveFilters] = useState({
  type: 'all',
  status: 'all',
  needsReview: false
});
const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
const [insightsDrawerOpen, setInsightsDrawerOpen] = useState(false);
const [activeTab, setActiveTab] = useState<'today' | 'thisWeek' | 'later' | 'completed'>('today');
const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
const [selectedTag, setSelectedTag] = useState<string | null>(null);
```

## Key Functions

### getCurrentTabEntries()
Retrieves and sorts entries for the currently active tab.

**Sorting Logic:**
1. Urgent items first (high priority or overdue)
2. Then by creation date (newest first)

### moveToToday(entryId: string)
Moves an entry to today's view by setting both pinnedForDate and dueDate to today 9 AM.

**Fixed Implementation:**
```typescript
const moveToToday = (entryId: string) => {
  const today = new Date();
  today.setHours(9, 0, 0, 0); // Set to 9 AM
  updateEntry(entryId, { pinnedForDate: today, dueDate: today });
};
```

### moveToThisWeek(entryId: string)
Moves an entry to this week's view by setting it to next Monday 9 AM.

### moveToLater(entryId: string)
Moves an entry to later view by clearing time constraints.

### moveEntryUp/Down(entryId: string)
Reorders entries within the current tab by adjusting timestamps.

### getAllTags()
Retrieves all unique tags from filtered entries for grouping functionality.

## UI Components

### Tag Grouping System
- **Tag Filter Interface:** Above main tabs for easy access
- **Visual Selection:** Selected tags highlighted in blue
- **All Tags Option:** Quick return to unfiltered view
- **Cross-Tab Consistency:** Filter applies to all time periods

### Tab Navigation
- **Today:** Due today, pinned for today, or overdue (merged view)
- **This Week:** Within next 7 days
- **Later:** Future items beyond this week
- **Completed:** Finished tasks

### Entry Cards
Each entry displays:
- **Centered Content:** Title and metadata centered for readability
- **Type Pill:** Visual entry type indicator
- **Status Indicators:** Priority and completion status
- **Clean Tags:** Organized tag layout with # prefix
- **Action Buttons:** Edit, complete, time management on the right
- **Ordering Controls:** Up/down arrows on the right side

### Entry Actions
- **Inline Editing:** Edit entries directly in cards
- **Quick Completion:** Mark tasks as done
- **Time Management:** Move between time periods
- **Batch Selection:** Multi-select for bulk operations

## Data Organization

### Time Period Logic
```typescript
// Today: due today OR pinned for today OR overdue (merged view)
const todayEntries = tagFilteredEntries.filter(entry => {
  if (entry.status === 'completed') return false;
  if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate.toDateString() === today.toDateString()) return true;
  if (entry.pinnedForDate && entry.pinnedForDate instanceof Date && entry.pinnedForDate.toDateString() === today.toDateString()) return true;
  // Include overdue items in today view
  if (entry.dueDate && entry.dueDate instanceof Date && entry.dueDate < today) return true;
  return false;
});

// This Week: within next 7 days (exclude today entries)
// Later: everything else (exclude today and this week entries)
// Completed: all completed entries
```

### Tag Filtering Logic
```typescript
// Apply tag filter
const tagFilteredEntries = selectedTag 
  ? filteredEntries.filter(entry => entry.tags.includes(selectedTag))
  : filteredEntries;

// Get all unique tags for grouping
const getAllTags = () => {
  const allTags = new Set<string>();
  filteredEntries.forEach(entry => {
    entry.tags.forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags).sort();
};
```

### Priority System
- **Urgent:** Highest priority, immediate attention
- **High:** Important, complete soon
- **Medium:** Standard priority (default)
- **Low:** Lower priority, can wait

## User Workflow

### Daily Management
1. **Check Today:** Review today's priorities (including overdue items)
2. **Plan Week:** Review this week's items
3. **Organize Later:** Plan future items
4. **Track Progress:** Monitor completed items

### Tag-Based Organization
1. **Select Tag:** Choose specific tag for filtering
2. **Cross-View Filtering:** Filter applies to all time periods
3. **Quick Toggle:** Switch between tag views and all tags
4. **Consistent Experience:** Same filtering across all tabs

### Entry Management
1. **Quick Capture:** Use capture button for new thoughts
2. **Organize:** Move items between time periods
3. **Complete:** Mark tasks as done
4. **Edit:** Modify entries inline

## Card Layout Improvements

### Centered Design
- **Title Centering:** Main content centered for better readability
- **Organized Rows:** Clear separation of type, status, and tags
- **Visual Hierarchy:** Better spacing and organization

### Right-Side Actions
- **Action Buttons:** Edit, complete, and time management grouped together
- **Ordering Controls:** Up/down arrows moved to the right side
- **Logical Flow:** Actions flow from left to right in order of importance

### Tag Display
- **Cleaner Layout:** Tags displayed in organized rows
- **Hash Prefix:** Clear # prefix for all tags
- **Limited Display:** Show first 3 tags with +X more indicator

## Performance Features

### Efficient Filtering
- **Date-Based Logic:** Optimized time period calculations
- **Smart Sorting:** Priority and time-based ordering
- **Lazy Rendering:** Progressive entry display

### State Optimization
- **Minimal Re-renders:** Efficient state updates
- **Batch Operations:** Grouped state changes
- **Smart Caching:** Store-based data management

## Accessibility Features
- **Semantic HTML:** Proper heading hierarchy
- **ARIA Labels:** Screen reader support
- **Keyboard Navigation:** Full keyboard support
- **Focus Management:** Clear focus indicators

## Related Files
- **Types:** `src/types.ts` - Entry, EntryType, TaskStatus interfaces
- **Store:** `src/store/index.ts` - Entry management functions
- **App:** `src/App.tsx` - View routing

## Future Enhancements
- Calendar integration
- Time tracking features
- Progress analytics
- Goal setting and tracking
- Team collaboration features
- Mobile app optimization

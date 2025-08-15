# Home Dashboard Feature

**Component:** `src/components/HomeView.tsx`  
**Purpose:** Time-based organization and daily workflow management

## Overview
The Home Dashboard provides a time-focused view of thoughts and tasks, organizing them by urgency and time periods to help users manage their daily workflow effectively.

## Key Features

### 📅 Time-Based Organization
- **Today:** Items due today, pinned for today, or overdue (merged view for better organization)
- **This Week:** Upcoming items within the next 7 days
- **Later:** Future items beyond this week
- **Completed:** Finished tasks and completed entries

### 🏷️ Tag Grouping System
- **Filter by Tags:** Group entries by specific tags (#soccer, #work, #apps, etc.)
- **Cross-View Filtering:** Tag filtering works across all time-based tabs
- **Visual Tag Display:** Clear tag indicators with # prefix
- **Quick Toggle:** Easy switching between "All Tags" and specific tag views

### 🎯 Smart Prioritization
- **Urgent Items:** High-priority and overdue items highlighted
- **Visual Indicators:** Color-coded priority levels and status
- **Smart Sorting:** Urgent items appear first, then by creation date

### 🔄 Flexible Time Management
- **Move Between Periods:** Shift items between time contexts
- **Quick Actions:** Single-click time period changes
- **Context-Aware:** Maintains entry relationships and metadata

### 📊 Batch Operations
- **Multi-Select:** Choose multiple entries for batch actions
- **Select All:** Quick selection within current tab
- **Bulk Actions:** Complete, move, or delete multiple items

### 🎨 Enhanced Entry Cards
- **Centered Layout:** Title and content centered for better readability
- **Type Pills:** Clear visual entry type indicators
- **Status Badges:** Completion and priority status
- **Clean Tag Display:** Organized tag layout with # prefix
- **Action Buttons:** Edit, complete, and time management on the right
- **Ordering Controls:** Up/down arrows moved to the right side

## User Experience

### Tab Navigation
- **Intuitive Tabs:** Clear time period organization
- **Entry Counts:** Visual indicators of items in each period
- **Active States:** Clear current tab indication

### Tag Grouping
- **Filter Interface:** Tag selection above the main tabs
- **Visual Feedback:** Selected tags highlighted in blue
- **All Tags Option:** Quick return to unfiltered view
- **Cross-Tab Consistency:** Filter applies to all time periods

### Entry Management
- **Inline Editing:** Edit entries directly in the dashboard
- **Quick Completion:** Mark tasks as done with one click
- **Time Shifting:** Move items between time periods
- **Smart Reordering:** Manual priority adjustment with right-side arrows

### Search & Filtering
- **Global Search:** Search across all entries
- **Type Filtering:** Filter by entry type
- **Status Filtering:** Filter by completion status
- **Review Filtering:** Show only items needing attention
- **Tag Filtering:** Group by specific tags

## Technical Implementation

### Core Functions
- `getCurrentTabEntries()` - Retrieves entries for active tab
- `moveToToday()` - Shifts entry to today's view (fixed functionality)
- `moveToThisWeek()` - Moves entry to weekly view
- `moveToLater()` - Shifts entry to future view

### Tag Grouping Logic
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

### State Management
- Active tab selection
- Search query state
- Filter configurations
- Entry selection state
- Editing state management
- Tag selection state

### Performance Features
- **Efficient Filtering:** Optimized date-based filtering
- **Smart Sorting:** Priority and time-based ordering
- **Lazy Rendering:** Progressive entry display

## Data Organization

### Time Period Logic
```typescript
// Today: due today OR pinned for today OR overdue
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

### Priority System
- **Urgent:** Highest priority, immediate attention
- **High:** Important, complete soon
- **Medium:** Standard priority (default)
- **Low:** Lower priority, can wait

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

## Related Components
- **CaptureView:** Creates new entries
- **ThoughtsView:** Shows all entries with filtering and search
- **Store:** Manages entry data and operations

## User Workflow
1. **Daily Review:** Check today's tab for immediate priorities (including overdue)
2. **Weekly Planning:** Review this week's items
3. **Future Planning:** Organize later items
4. **Completion Tracking:** Monitor progress in completed tab
5. **Tag Grouping:** Filter by specific tags across all views

## Future Enhancements
- Calendar integration
- Time tracking features
- Progress analytics
- Goal setting and tracking
- Team collaboration features
- Mobile app optimization

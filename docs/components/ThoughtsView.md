# ThoughtsView Component

**File:** `src/components/ThoughtsView.tsx`  
**Purpose:** Comprehensive thought organization, search, and review interface

## Component Overview
ThoughtsView provides a complete view of all captured thoughts with advanced filtering, search capabilities, and a review system for entries that need attention.

## Props
This component has no external props - it's a self-contained view component.

## State Management
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [activeFilter, setActiveFilter] = useState<'all' | EntryType>('all');
const [showReviewSection, setShowReviewSection] = useState(true);
```

## Key Functions

### getFilteredEntries()
Retrieves and filters entries based on current search and filter criteria.

**Filtering Logic:**
- Search across content, tags, and metadata
- Type-based filtering
- Status-based filtering
- Review status filtering

### getEntriesNeedingReview()
Identifies entries that require user attention.

**Review Triggers:**
- `unclear_outcome` - Ambiguous goals
- `overdue` - Past due dates
- `ignored_long_time` - Long-neglected items
- `needs_clarification` - Requires more detail
- `low_confidence` - AI had low parsing confidence

### getUrgentEntries()
Finds high-priority and time-sensitive entries.

**Urgency Criteria:**
- Priority level: 'urgent'
- Overdue items
- Items due soon

### getTopTags(entries: Entry[])
Analyzes tag usage patterns to show most popular tags.

**Returns:** Array of `{ tag: string, count: number }`

## UI Components

### Search & Filters
- **Search Input:** Real-time text search
- **Type Filters:** Quick type-based filtering
- **Status Filters:** Completion status filtering
- **Review Toggle:** Show/hide review section

### Entry Cards
Each entry displays:
- **Content:** Main thought description
- **Type Icon:** Visual entry type indicator
- **Priority Badge:** Color-coded priority level
- **Status Badge:** Completion status
- **Metadata:** Dates, locations, creation time
- **Tags:** User-defined categories
- **Actions:** Complete, edit, delete buttons

### Review Section
- **Collapsible Panel:** Can be hidden/shown
- **Review Indicators:** Clear reason for review
- **Quick Actions:** Mark as reviewed button

## Data Flow

### Entry Retrieval
1. Get all entries from store
2. Apply search filter
3. Apply type/status filters
4. Sort by priority and date
5. Render filtered results

### Review System
1. System flags entries needing review
2. User reviews flagged entries
3. User takes action (complete, edit, clarify)
4. User marks as reviewed
5. Entry removed from review list

## Performance Features

### Efficient Filtering
- **Smart Search:** Optimized text search algorithms
- **Lazy Rendering:** Progressive entry display
- **Memoized Results:** Cached filter results

### State Optimization
- **Minimal Re-renders:** Efficient state updates
- **Batch Operations:** Grouped state changes
- **Smart Caching:** Store-based data management

## Accessibility Features
- **Semantic HTML:** Proper heading hierarchy
- **ARIA Labels:** Screen reader support
- **Keyboard Navigation:** Full keyboard support
- **Focus Management:** Clear focus indicators

## Error Handling
- **Graceful Degradation:** Handles missing data
- **User Feedback:** Clear error messages
- **Fallback States:** Default values for missing fields

## Related Files
- **Types:** `src/types.ts` - Entry, EntryType, Priority interfaces
- **Store:** `src/store/index.ts` - Entry management functions
- **App:** `src/App.tsx` - View routing

## Future Enhancements
- Advanced analytics dashboard
- Export functionality
- Bulk operations
- Custom filter presets
- Integration with external tools

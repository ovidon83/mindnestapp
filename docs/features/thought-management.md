# Thought Management Feature

**Component:** `src/components/ThoughtsView.tsx`  
**Purpose:** Comprehensive thought organization, search, and review system

## Overview
The Thought Management feature provides a complete view of all captured thoughts with advanced filtering, search capabilities, and a review system for entries that need attention.

## Key Features

### 🔍 Advanced Search & Filtering
- **Full-Text Search:** Search across content, tags, and metadata
- **Type Filtering:** Filter by entry type (task, idea, event, etc.)
- **Status Filtering:** Filter by completion status
- **Review Filtering:** Show only entries needing review

### 📊 Entry Organization
- **Card-Based Layout:** Clean, scannable entry cards
- **Type Icons:** Visual indicators for different entry types
- **Priority Badges:** Color-coded priority levels
- **Status Indicators:** Clear completion status display

### 🚨 Review System
- **Smart Review Detection:** Identifies entries needing attention
- **Review Reasons:** Categorized review triggers:
  - `unclear_outcome` - Ambiguous or unclear goals
  - `overdue` - Past due dates
  - `ignored_long_time` - Long-neglected entries
  - `needs_clarification` - Requires more detail
  - `low_confidence` - AI had low confidence in parsing

### 🏷️ Tag Management
- **User Tags:** Custom categorization system
- **Top Tags Display:** Shows most used tags with counts
- **Tag Filtering:** Filter entries by specific tags

### ⚡ Quick Actions
- **Complete Entry:** Mark tasks as done
- **Edit Entry:** Modify content and metadata
- **Delete Entry:** Remove unwanted entries
- **Mark Reviewed:** Clear review flags

## User Experience

### Entry Cards
Each entry displays:
- **Content:** Main thought or task description
- **Type & Priority:** Visual categorization
- **Status:** Current completion state
- **Metadata:** Due dates, locations, creation time
- **Tags:** User-defined categories
- **Review Info:** Special attention indicators

### Review Workflow
1. **Identify:** System flags entries needing review
2. **Assess:** User reviews flagged entries
3. **Action:** Complete, edit, or clarify as needed
4. **Clear:** Mark as reviewed when resolved

### Search & Discovery
- **Instant Search:** Real-time filtering as you type
- **Smart Suggestions:** Context-aware search results
- **Filter Combinations:** Mix search with type/status filters

## Technical Implementation

### Core Functions
- `getFilteredEntries()` - Applies search and filter criteria
- `getEntriesNeedingReview()` - Identifies review candidates
- `getUrgentEntries()` - Finds high-priority items
- `getTopTags()` - Analyzes tag usage patterns

### State Management
- Search query state
- Active filter selections
- Review section visibility
- Entry selection for batch operations

### Performance Features
- **Efficient Filtering:** Optimized search algorithms
- **Lazy Loading:** Progressive entry rendering
- **Smart Caching:** Store-based data management

## Related Components
- **CaptureView:** Creates new entries
- **HomeView:** Time-based organization
- **Store:** Data persistence and operations

## Data Flow
1. **Capture:** Entries created via CaptureView
2. **Process:** AI parsing and categorization
3. **Store:** Persistent storage in Zustand store
4. **Display:** Organized presentation in ThoughtsView
5. **Review:** Smart detection of attention-needed items

## Future Enhancements
- Advanced analytics and insights
- Export and sharing capabilities
- Integration with external tools
- Collaborative thought sharing
- AI-powered thought connections

# Thouthy Refactor Summary

## Overview
Thouthy has been refactored to align with the new product vision: a calm, observer-style thought management app.

## Key Changes

### 1. Primary View: Mindbox
- **Replaced**: To-Do, Insights, and Journal views
- **New**: Single "Mindbox" view showing all thoughts
- **Default**: Last 30 days (toggle to "View all thoughts")
- **Search**: Always searches all thoughts (all time)
- **Thought Row**: Shows only:
  - Original thought text (primary)
  - One badge: To-Do, Insight, or Journal (clickable to override)
  - One AI hint line (subtle, secondary)
- **Visual De-emphasis**: Older thoughts fade based on age (Today → normal, This week → muted, Earlier → more muted)

### 2. Badge Override
- Users can click badge to change type (To-Do/Insight/Journal)
- Override persists (AI won't reclassify)
- Stored in `badge_override` field

### 3. Hybrid Search
- **Text-based**: Searches original text, summary, and AI hint
- **Semantic**: Falls back to keyword expansion when no exact matches
- **Indicators**: Shows "Related" label for semantic matches
- **Ranking**: By relevance and recency

### 4. Share it View
- **Replaced**: Posts view
- **Purpose**: Quiet holding area for thoughts that might want to live outside
- **Auto-add**: AI calculates posting score (hidden), adds if score >= 60
- **Manual add**: "Add to Share it" button in Mindbox
- **Content**: Shows original thought + drafts for LinkedIn, X, Instagram
- **Actions**: Edit, Copy, Mark as shared, Remove from Share it
- **No scores**: Virality scores hidden from UI
- **No prioritization**: All platforms shown equally

### 5. AI Enhancements
- **AI Hint**: Single subtle hint per thought
  - "Possible next step: ..." (for todos)
  - "This topic keeps coming up." (recurring patterns)
  - "Might be worth sharing." (sharing potential)
  - "Personal reflection." (journal entries)
  - "No action needed." (neutral)
- **Posting Score**: Internal 0-100 score (hidden from UI)
- **Auto Share it**: Entries with score >= 60 automatically added

### 6. Removed/De-emphasized
- ❌ Separate To-Do/Insights/Journal navigation
- ❌ Analytics dashboards from primary flow
- ❌ Virality scores from UI
- ❌ Topic-based logic from Share it
- ✅ Tags still exist in background (for future use)

## Database Migration Required

Run this migration to add new fields:

```sql
-- File: supabase/migration-add-mindbox-fields.sql
```

This adds:
- `ai_hint` (TEXT)
- `badge_override` (TEXT, CHECK constraint)
- `posting_score` (INTEGER, 0-100)
- `in_share_it` (BOOLEAN)

## Navigation Structure

**Before:**
- To-Do | Insights | Journal | Posts

**After:**
- Mindbox | Share it

## User Flow

1. **Capture**: User captures thought → AI processes → Redirects to Mindbox
2. **Mindbox**: Shows last 30 days, user can:
   - View all thoughts
   - Search (text + semantic)
   - Change badge type
   - Add to Share it manually
3. **Share it**: Shows thoughts with sharing potential:
   - Auto-added (posting score >= 60)
   - Manually added
   - User can edit drafts, copy, mark as shared, or remove

## Technical Notes

- All existing data is preserved
- Backward compatibility maintained for legacy fields
- Semantic search uses basic keyword expansion (can be enhanced with embeddings/OpenAI later)
- Posting score calculation happens in background during thought processing
- Draft generation triggered automatically when entry added to Share it

## Next Steps

1. Run database migration: `supabase/migration-add-mindbox-fields.sql`
2. Test the new Mindbox view
3. Test Share it functionality
4. Verify badge override works
5. Test search (text + semantic)


# Revert Guide - Category/Type Merge Changes

This document explains how to revert the changes made to merge categories and types into a single unified system.

## Changes Made

1. **Database Schema**: Added `type` and `completed` columns (old columns remain)
2. **Type System**: Merged `category` and `entryType` into single `type` field
3. **New Views**: Created ToDoView, InsightsView, JournalView
4. **Navigation**: Added Navigation component for switching between views
5. **Analytics**: Added Analytics component (hidden by default)

## To Revert

### 1. Database
- The old `category` and `entry_type` columns still exist
- The new `type` and `completed` columns can be dropped if needed:
  ```sql
  ALTER TABLE entries DROP COLUMN IF EXISTS type;
  ALTER TABLE entries DROP COLUMN IF EXISTS completed;
  ```

### 2. Code Files to Restore
- `src/types.ts`: Restore original `Category` and `EntryType` as separate types
- `src/lib/db.ts`: Restore original conversion functions
- `src/lib/ai.ts`: Restore original processing logic
- `src/components/HomeView.tsx`: Restore original view (or keep as backup)
- `src/App.tsx`: Remove new view routing, restore original

### 3. Files to Delete (if reverting completely)
- `src/components/ToDoView.tsx`
- `src/components/InsightsView.tsx`
- `src/components/JournalView.tsx`
- `src/components/Navigation.tsx`
- `src/components/Analytics.tsx`
- `supabase/migration-merge-category-type.sql`

### 4. Keep for Reference
- All old code is preserved with backward compatibility
- Legacy fields (`category`, `entryType`) are still supported
- Database migration is additive (doesn't drop old columns)

## Current State

- **Backward Compatible**: Old entries with `category`/`entry_type` still work
- **New Entries**: Use `type` field
- **Views**: Three separate views (To-Do, Insights, Journal)
- **Navigation**: Top navigation bar for switching views


# Supabase Setup Guide

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from the project settings

## Database Setup

1. Go to your Supabase project SQL Editor
2. Run the SQL from `supabase/schema.sql` to create the `entries` table and set up Row Level Security

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase credentials.

## Features

- **Authentication**: Sign up and sign in with email/password
- **Database**: All entries are stored in Supabase with Row Level Security
- **Real-time**: Data syncs automatically between client and database
- **User Isolation**: Each user only sees their own entries

## Notes

- Preferences (homeViewPrefs) are still stored in localStorage for simplicity
- All entry operations (create, update, delete) sync with Supabase
- The app automatically loads entries when a user signs in


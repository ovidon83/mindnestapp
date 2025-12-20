# Quick Fix: Disable Email Confirmation

## Steps:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/uzwyovtwyltfjrswgtct

2. **Navigate to Authentication Settings:**
   - Click **"Authentication"** in the left sidebar
   - Click **"Settings"** (or go to Authentication → Settings)

3. **Disable Email Confirmation:**
   - Scroll down to **"Email Auth"** section
   - Find **"Enable email confirmations"** toggle
   - **Turn it OFF** (disable it)
   - Click **"Save"** at the bottom

4. **Try Again:**
   - Go back to your app at http://localhost:5173
   - Try signing up again with the same email
   - You should be able to sign in immediately

## Alternative: Manually Confirm User

If you want to keep email confirmation enabled:

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Find your user (ovidon83@gmail.com)
3. Click on the user
4. Click **"Confirm email"** button
5. Then try signing in


# Deployment Guide

## Services on Render

### 1. Frontend Service (allymind)
- **Name**: `allymind`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `VITE_SUPABASE_URL` - Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
  - `VITE_OPENAI_API_KEY` - (Optional) OpenAI API key
  - `VITE_API_URL` - URL of the subscription API service (see below)

### 2. Subscription API Service (thouthy-subscription-api)
- **Name**: `thouthy-subscription-api`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `PORT` - Set to `10000` (or let Render assign automatically)
  - `EMAIL_USER` - Your Gmail address (e.g., `ovidon83@gmail.com`)
  - `EMAIL_PASSWORD` - Gmail App Password (not your regular password)

## Setting Up Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to "App passwords" section
4. Create a new app password for "Mail"
5. Copy the 16-character password
6. Use this as `EMAIL_PASSWORD` in Render

## After Deployment

1. **Get the Subscription API URL**:
   - Go to Render dashboard
   - Find the `thouthy-subscription-api` service
   - Copy the service URL (e.g., `https://thouthy-subscription-api.onrender.com`)

2. **Update Frontend Service**:
   - Go to `allymind` service settings
   - Add environment variable: `VITE_API_URL` = `https://thouthy-subscription-api.onrender.com`
   - Redeploy the frontend service

## Testing

Once deployed:
- Users can enter their email in the "Early Access" form
- Emails are saved to `data/subscriptions.csv` on the API server
- You receive an email notification at `ovidon83@gmail.com`


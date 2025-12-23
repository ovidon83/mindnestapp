# Formspree Setup Guide

## What is Formspree?

Formspree is a simple form submission service that handles email delivery for you. No backend code needed!

## Setup Steps

1. **Sign up for Formspree** (free tier: 50 submissions/month)
   - Go to: https://formspree.io
   - Sign up with your email

2. **Create a new form**
   - Click "New Form"
   - Name it "Thouthy Early Access"
   - Set notification email to: `ovidon83@gmail.com`

3. **Get your form endpoint**
   - After creating the form, you'll get a URL like: `https://formspree.io/f/xjvqknyz`
   - Copy this URL

4. **Add to Render environment variables**
   - Go to your frontend service in Render
   - Add environment variable:
     - **Key**: `VITE_FORMSPREE_ENDPOINT`
     - **Value**: `https://formspree.io/f/YOUR_FORM_ID` (use your actual form ID)

5. **Redeploy**
   - Render will automatically redeploy with the new environment variable

## How it works

- User enters email → clicks "Early Access"
- Form submits to Formspree
- Formspree sends you an email with the subscriber's email
- Formspree also stores submissions (you can view them in dashboard)
- User sees success message

## Benefits

- ✅ No backend code needed
- ✅ No email credentials to manage
- ✅ Free tier: 50 submissions/month
- ✅ Automatic spam protection
- ✅ View all submissions in dashboard
- ✅ Can export to CSV if needed

## Testing

1. Test locally by setting `VITE_FORMSPREE_ENDPOINT` in a `.env` file
2. Submit a test email
3. Check your email inbox for the notification


# EmailJS Setup Guide

## What is EmailJS?

EmailJS is a simple email service that sends emails directly from your frontend - no backend needed!

## Setup Steps

1. **Sign up for EmailJS** (free tier: 200 emails/month)
   - Go to: https://www.emailjs.com
   - Sign up with your email (or Google account)

2. **Add Email Service**
   - Go to "Email Services" in dashboard
   - Click "Add New Service"
   - Choose "Gmail" (or your preferred email provider)
   - Connect your Gmail account (`ovidon83@gmail.com`)
   - **Copy the Service ID** (e.g., `service_abc123`)

3. **Create Email Template**
   - Go to "Email Templates" in dashboard
   - Click "Create New Template"
   - **Template Name**: "Thouty Subscription"
   - **Subject**: `New Thouty Early Access Subscription`
   - **Content**:
     ```
     New email subscription received!
     
     Email: {{email}}
     Timestamp: {{timestamp}}
     ```
   - **To Email**: `ovidon83@gmail.com`
   - **From Name**: `Thouty`
   - **From Email**: `ovidon83@gmail.com` (or your Gmail)
   - Click "Save"
   - **Copy the Template ID** (e.g., `template_xyz789`)

4. **Get Public Key**
   - Go to "Account" → "General"
   - **Copy your Public Key** (e.g., `abcdefghijklmnop`)

5. **Add to Render environment variables**
   - Go to your frontend service in Render
   - Add these environment variables:
     - **Key**: `VITE_EMAILJS_SERVICE_ID`
       **Value**: `service_abc123` (your service ID)
     - **Key**: `VITE_EMAILJS_TEMPLATE_ID`
       **Value**: `template_xyz789` (your template ID)
     - **Key**: `VITE_EMAILJS_PUBLIC_KEY`
       **Value**: `abcdefghijklmnop` (your public key)

6. **Redeploy**
   - Render will automatically redeploy with the new environment variables

## How it works

- User enters email → clicks "Early Access"
- Frontend calls EmailJS API directly
- EmailJS sends you an email with the subscriber's email
- User sees success message

## Benefits

- ✅ No backend code needed
- ✅ No email credentials in your code
- ✅ Free tier: 200 emails/month
- ✅ Works directly from frontend
- ✅ Simple API

## Testing

1. Test locally by setting the environment variables in a `.env` file:
   ```
   VITE_EMAILJS_SERVICE_ID=service_abc123
   VITE_EMAILJS_TEMPLATE_ID=template_xyz789
   VITE_EMAILJS_PUBLIC_KEY=abcdefghijklmnop
   ```
2. Submit a test email
3. Check your email inbox for the notification

## Template Variables

The template can use these variables:
- `{{email}}` - Subscriber's email
- `{{timestamp}}` - Current timestamp (if you add it)
- Any custom variables you define


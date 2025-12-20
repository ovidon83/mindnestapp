# Email Subscription Setup

## Installation

1. Install the new dependencies:
```bash
npm install express cors nodemailer concurrently
npm install --save-dev @types/express @types/cors @types/nodemailer
```

## Configuration

1. Create a `.env` file in the root directory:
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
PORT=3001
```

2. **Gmail App Password Setup:**
   - Go to your Google Account settings
   - Enable 2-Step Verification
   - Go to App Passwords
   - Generate a new app password for "Mail"
   - Use that password in the `.env` file

## Running the Application

### Development (both frontend and backend):
```bash
npm run dev:all
```

### Or run separately:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:server
```

## How It Works

1. Users enter their email in the subscription form
2. Email is saved to `data/subscriptions.csv`
3. Notification email is sent to ovidon83@gmail.com
4. User sees success/error message

## Files Created

- `server.js` - Express server for handling subscriptions
- `data/subscriptions.csv` - CSV file with all subscriptions
- `.env` - Environment variables (not committed to git)


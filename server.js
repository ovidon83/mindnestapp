import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// CSV file path
const CSV_FILE = path.join(dataDir, 'subscriptions.csv');

// Ensure CSV file exists with headers
if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(CSV_FILE, 'email,timestamp\n');
}

// Email transporter (using Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
  },
});

// Subscription endpoint (for backward compatibility)
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Save to CSV
    const timestamp = new Date().toISOString();
    const csvLine = `${email},${timestamp}\n`;
    fs.appendFileSync(CSV_FILE, csvLine);

    // Send notification email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'ovidon83@gmail.com',
        subject: 'New Thouthy Subscription',
        text: `New email subscription: ${email}\nTimestamp: ${timestamp}`,
        html: `
          <h2>New Thouthy Subscription</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
        `,
      });
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ success: true, message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});

// Notification-only endpoint (for Supabase subscriptions)
app.post('/api/subscribe/notify', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Send notification email
    const timestamp = new Date().toISOString();
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'ovidon83@gmail.com',
        subject: 'New Thouthy Subscription',
        text: `New email subscription: ${email}\nTimestamp: ${timestamp}`,
        html: `
          <h2>New Thouthy Subscription</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
        `,
      });
      res.json({ success: true, message: 'Notification sent' });
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to process notification' });
  }
});

app.listen(PORT, () => {
  console.log(`Subscription server running on http://localhost:${PORT}`);
});


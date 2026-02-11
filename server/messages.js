// server/messages.js
import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// In-memory activity log (for demo)
const activityLog = [];

// Configure nodemailer (for demo, use ethereal.email or your SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Send message and log activity
router.post('/send', async (req, res) => {
  const { to, subject, text, context } = req.body;
  if (!to || !subject || !text) return res.status(400).json({ error: 'Missing fields' });
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@audit-iq.com',
      to,
      subject,
      text,
    });
    // Log activity
    activityLog.push({
      to, subject, text, context, date: new Date().toISOString(), messageId: info.messageId,
    });
    res.json({ success: true, messageId: info.messageId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get activity log (optionally filter by context)
router.get('/activity', (req, res) => {
  const { customerId, invoiceId, exceptionId } = req.query;
  let filtered = activityLog;
  if (customerId) filtered = filtered.filter(a => a.context?.customerId === customerId);
  if (invoiceId) filtered = filtered.filter(a => a.context?.invoiceId === invoiceId);
  if (exceptionId) filtered = filtered.filter(a => a.context?.exceptionId === exceptionId);
  res.json(filtered);
});

export default router;

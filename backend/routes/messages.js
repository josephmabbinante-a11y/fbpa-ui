import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// In-memory activity log (for demo)
const activityLog = [];

const hasSmtpCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

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
  const payload = req.body || {};
  const directTo = payload.to;
  const context = payload.context || {
    customer: payload.customer,
    invoice: payload.invoice,
    exception: payload.exception,
  };

  const to =
    directTo ||
    payload.customer?.email ||
    payload.context?.customer?.email ||
    payload.context?.email;

  const subject =
    payload.subject ||
    `Update for ${payload.invoice?.invoiceNumber || payload.context?.invoice?.invoiceNumber || 'invoice'}`;

  const text = payload.text || payload.message;

  if (!to || !subject || !text) return res.status(400).json({ error: 'Missing fields' });
  try {
    let messageId = `local-${Date.now()}`;
    if (hasSmtpCredentials) {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@audit-iq.com',
        to,
        subject,
        text,
      });
      messageId = info.messageId;
    }

    // Log activity
    activityLog.push({
      to, subject, text, context, date: new Date().toISOString(), messageId,
    });
    res.json({ success: true, messageId, delivery: hasSmtpCredentials ? 'smtp' : 'local-log-only' });
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

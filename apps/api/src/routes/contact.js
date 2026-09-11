import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const hits = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return next();
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'too many requests — try again later' });
  }
  entry.count += 1;
  next();
}

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[contact] SMTP not configured — emails will be logged only.');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

router.post('/', rateLimit, async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'a valid email is required' });
  }
  if (
    typeof name !== 'string' ||
    typeof message !== 'string' ||
    name.length > 200 ||
    message.length > 5000 ||
    (subject && (typeof subject !== 'string' || subject.length > 200))
  ) {
    return res.status(400).json({ error: 'invalid field length' });
  }

  const safeName = escapeHtml(name);
  const safeSubject = subject ? escapeHtml(subject) : '';
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const transport = createTransport();
  const mailOptions = {
    from: `"${safeName}" <${process.env.SMTP_USER || email}>`,
    replyTo: email,
    to: process.env.CONTACT_EMAIL_TO || 'gerald@geraldvillorente.com',
    subject: safeSubject || `Contact from ${safeName}`,
    text: message,
    html: `<p><strong>From:</strong> ${safeName} &lt;${escapeHtml(email)}&gt;</p><p>${safeMessage}</p>`,
  };

  if (transport) {
    await transport.sendMail(mailOptions);
  } else {
    console.log('[contact] Would send:', mailOptions);
  }

  res.json({ ok: true });
});

export default router;

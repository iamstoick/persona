import { Router } from 'express';
import nodemailer from 'nodemailer';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Redis-backed, so the limit survives restarts and applies across replicas —
// the old in-process Map lost all state on every deploy.
const contactThrottle = rateLimit({ prefix: 'contact', max: 5, windowMs: 15 * 60 * 1000 });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Newlines survive HTML-escaping, so strip them before interpolating into mail
// headers — otherwise `name`/`subject` become email header injection vectors.
function stripNewlines(str) {
  return str.replace(/[\r\n]+/g, ' ');
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

router.post('/', contactThrottle, async (req, res) => {
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

  const safeName = escapeHtml(stripNewlines(name));
  const safeSubject = subject ? escapeHtml(stripNewlines(subject)) : '';
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

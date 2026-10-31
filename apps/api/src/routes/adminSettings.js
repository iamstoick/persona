import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { cacheDel } from '../cache/redis.js';

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');

const VALID_KEYS = ['hero', 'skills', 'contact'];

router.get('/', editorOrAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM site_settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

router.put('/:key', editorOrAdmin, async (req, res) => {
  const { key } = req.params;
  if (!VALID_KEYS.includes(key)) {
    return res.status(400).json({ error: `Unknown settings key: ${key}` });
  }
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Body must be a JSON object' });
  }

  // Social hrefs render as raw <a href> in Contact.tsx — React does not sanitize
  // javascript: URLs, so only http(s) and mailto links may be saved. The contact
  // email feeds a mailto: link for the same reason.
  if (key === 'contact' && req.body) {
    const socials = Array.isArray(req.body.socials) ? req.body.socials : [];
    for (const s of socials) {
      if (typeof s?.href !== 'string' || !/^(https?:\/\/|mailto:)/i.test(s.href)) {
        return res.status(400).json({ error: 'Social links must start with http(s):// or mailto:' });
      }
    }
    if (req.body.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email))) {
      return res.status(400).json({ error: 'Contact email is not a valid email address' });
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO site_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
     RETURNING key, value`,
    [key, JSON.stringify(req.body)]
  );

  await cacheDel('cache:settings:all');
  res.json(rows[0]);
});

export default router;

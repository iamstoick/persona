import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { cacheDelPattern } from '../cache/redis.js';
import { purgeUrls } from '../cache/cloudflare.js';

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:8899';
const deckUrl = (slug) => `${SITE_URL}/slides/${slug}`;

router.get('/', editorOrAdmin, async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT d.*, COUNT(s.id)::int AS slide_count
     FROM slide_decks d
     LEFT JOIN slides s ON s.deck_id = d.id
     GROUP BY d.id
     ORDER BY d.sort_order ASC, d.created_at ASC`
  );
  res.json(rows);
});

router.put('/:id', editorOrAdmin, async (req, res) => {
  const { title, description, status, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (status && !['draft', 'published'].includes(status)) {
    return res.status(400).json({ error: 'status must be draft or published' });
  }

  const { rows } = await pool.query(
    `UPDATE slide_decks SET title = $1, description = $2, status = COALESCE($3, status), sort_order = $4
     WHERE id = $5 RETURNING *`,
    [title, description || null, status, sort_order ?? 0, req.params.id]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  await cacheDelPattern('cache:slides:*');
  await purgeUrls([deckUrl(rows[0].slug)]);
  res.json(rows[0]);
});

export default router;

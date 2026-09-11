import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { cacheDel } from '../cache/redis.js';

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');

function parseTags(tags) {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === 'string') return tags.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}

router.get('/', editorOrAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC');
  res.json(rows);
});

router.post('/', editorOrAdmin, async (req, res) => {
  const { title, excerpt, tags, github_url, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { rows } = await pool.query(
    `INSERT INTO projects (title, excerpt, tags, github_url, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, excerpt || null, parseTags(tags), github_url || null, sort_order ?? 0]
  );

  await cacheDel('cache:projects:all');
  res.status(201).json(rows[0]);
});

router.put('/:id', editorOrAdmin, async (req, res) => {
  const { title, excerpt, tags, github_url, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { rows } = await pool.query(
    `UPDATE projects SET title = $1, excerpt = $2, tags = $3, github_url = $4, sort_order = $5
     WHERE id = $6 RETURNING *`,
    [title, excerpt || null, parseTags(tags), github_url || null, sort_order ?? 0, req.params.id]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  await cacheDel('cache:projects:all');
  res.json(rows[0]);
});

router.delete('/:id', editorOrAdmin, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  await cacheDel('cache:projects:all');
  res.json({ ok: true });
});

export default router;

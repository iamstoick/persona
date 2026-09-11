import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { cacheDel } from '../cache/redis.js';

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');

router.get('/', editorOrAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM services ORDER BY sort_order ASC, created_at ASC');
  res.json(rows);
});

router.post('/', editorOrAdmin, async (req, res) => {
  const { title, description, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { rows } = await pool.query(
    `INSERT INTO services (title, description, sort_order) VALUES ($1, $2, $3) RETURNING *`,
    [title, description || null, sort_order ?? 0]
  );

  await cacheDel('cache:services:all');
  res.status(201).json(rows[0]);
});

router.put('/:id', editorOrAdmin, async (req, res) => {
  const { title, description, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { rows } = await pool.query(
    `UPDATE services SET title = $1, description = $2, sort_order = $3 WHERE id = $4 RETURNING *`,
    [title, description || null, sort_order ?? 0, req.params.id]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  await cacheDel('cache:services:all');
  res.json(rows[0]);
});

router.delete('/:id', editorOrAdmin, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  await cacheDel('cache:services:all');
  res.json({ ok: true });
});

export default router;

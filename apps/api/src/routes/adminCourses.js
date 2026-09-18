import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { cacheDelPattern } from '../cache/redis.js';

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');

router.get('/', editorOrAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM courses ORDER BY sort_order ASC, created_at ASC');
  res.json(rows);
});

router.put('/:id', editorOrAdmin, async (req, res) => {
  const { title, description, status, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (status && !['draft', 'published'].includes(status)) {
    return res.status(400).json({ error: 'status must be draft or published' });
  }

  const { rows } = await pool.query(
    `UPDATE courses SET title = $1, description = $2, status = COALESCE($3, status), sort_order = $4
     WHERE id = $5 RETURNING *`,
    [title, description || null, status, sort_order ?? 0, req.params.id]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  await cacheDelPattern('cache:courses:*');
  res.json(rows[0]);
});

router.get('/:id/feedback', editorOrAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT cf.*, u.name AS user_name, u.email AS user_email
     FROM course_feedback cf
     JOIN users u ON u.id = cf.user_id
     WHERE cf.course_id = $1
     ORDER BY cf.created_at DESC`,
    [req.params.id]
  );
  res.json(rows);
});

export default router;

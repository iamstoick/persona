import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';

const router = Router();
const adminOnly = requireRole('admin');

router.get('/', adminOnly, async (_req, res) => {
  const { rows } = await pool.query('SELECT id, email, name, avatar_url, role, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

router.put('/:id', adminOnly, async (req, res) => {
  const { role } = req.body;
  const validRoles = ['subscriber', 'editor', 'admin'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const { rows } = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
    [role, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

export default router;

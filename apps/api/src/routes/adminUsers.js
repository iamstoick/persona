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

  const { rows: existing } = await pool.query('SELECT id, role FROM users WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Not found' });

  // Nobody may demote themselves out of administration, and the last admin
  // can't be removed — either mistake locks everyone out.
  if (existing[0].role === 'admin' && role !== 'admin') {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot demote your own admin account' });
    }
    const { rows: adminCount } = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
    if (parseInt(adminCount[0].n, 10) <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin' });
    }
  }

  const { rows } = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
    [role, req.params.id]
  );
  res.json(rows[0]);
});

export default router;

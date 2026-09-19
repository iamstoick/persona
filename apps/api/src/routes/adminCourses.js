import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { cacheDelPattern } from '../cache/redis.js';
import { purgeUrls } from '../cache/cloudflare.js';

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:8899';
const courseUrl = (slug) => `${SITE_URL}/courses/${slug}`;

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
  await purgeUrls([courseUrl(rows[0].slug)]);
  res.json(rows[0]);
});

// One row per (student, course) they've made any progress in, with completed/total
// lesson counts — used by the admin dashboard's "student progress" view. Only lists
// students who've actually started a course, not every registered user.
router.get('/progress', editorOrAdmin, async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT
       u.id AS user_id, u.name AS user_name, u.email AS user_email,
       c.id AS course_id, c.title AS course_title,
       COUNT(DISTINCT cp.lesson_id) AS completed_lessons,
       (SELECT COUNT(*) FROM course_lessons cl2
        JOIN course_phases cph2 ON cph2.id = cl2.phase_id
        WHERE cph2.course_id = c.id) AS total_lessons,
       MAX(cp.completed_at) AS last_activity
     FROM course_progress cp
     JOIN users u ON u.id = cp.user_id
     JOIN course_lessons cl ON cl.id = cp.lesson_id
     JOIN course_phases cph ON cph.id = cl.phase_id
     JOIN courses c ON c.id = cph.course_id
     GROUP BY u.id, u.name, u.email, c.id, c.title
     ORDER BY u.name ASC, c.title ASC`
  );
  res.json(rows);
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

import { Router } from 'express';
import { pool } from '../db/pool.js';
import { optionalAuth, requireAuth } from '../middleware/requireAuth.js';
import { cacheGet, cacheSet, cacheDel, TTL } from '../cache/redis.js';

const router = Router();

router.get('/', async (_req, res) => {
  const cacheKey = 'cache:courses:list';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT id, slug, title, description, sort_order
     FROM courses WHERE status = 'published'
     ORDER BY sort_order ASC, created_at ASC`
  );

  await cacheSet(cacheKey, rows, TTL.POSTS);
  res.json(rows);
});

router.get('/:slug', optionalAuth, async (req, res) => {
  const { rows: courseRows } = await pool.query(
    `SELECT id, slug, title, description FROM courses WHERE slug = $1 AND status = 'published'`,
    [req.params.slug]
  );
  const course = courseRows[0];
  if (!course) return res.status(404).json({ error: 'Not found' });

  const { rows: phases } = await pool.query(
    `SELECT id, title, description, sort_order FROM course_phases
     WHERE course_id = $1 ORDER BY sort_order ASC`,
    [course.id]
  );

  const { rows: lessons } = await pool.query(
    `SELECT l.id, l.phase_id, l.day_number, l.title, l.duration_minutes, l.summary, l.sort_order
     FROM course_lessons l
     JOIN course_phases p ON p.id = l.phase_id
     WHERE p.course_id = $1
     ORDER BY l.sort_order ASC`,
    [course.id]
  );

  let completedIds = new Set();
  if (req.user) {
    const { rows: progress } = await pool.query(
      `SELECT lesson_id FROM course_progress cp
       JOIN course_lessons l ON l.id = cp.lesson_id
       JOIN course_phases p ON p.id = l.phase_id
       WHERE cp.user_id = $1 AND p.course_id = $2`,
      [req.user.id, course.id]
    );
    completedIds = new Set(progress.map((r) => r.lesson_id));
  }

  const phasesOut = phases.map((phase) => ({
    ...phase,
    lessons: lessons
      .filter((l) => l.phase_id === phase.id)
      .map(({ phase_id: _phaseId, ...lesson }) => ({
        ...lesson,
        completed: completedIds.has(lesson.id),
      })),
  }));

  res.json({ ...course, phases: phasesOut, authenticated: Boolean(req.user) });
});

router.get('/:slug/lessons/:lessonId', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.id, l.title, l.duration_minutes, l.summary, l.content, l.day_number,
            p.title AS phase_title, c.title AS course_title, c.slug AS course_slug
     FROM course_lessons l
     JOIN course_phases p ON p.id = l.phase_id
     JOIN courses c ON c.id = p.course_id
     WHERE l.id = $1 AND c.slug = $2 AND c.status = 'published'`,
    [req.params.lessonId, req.params.slug]
  );
  const lesson = rows[0];
  if (!lesson) return res.status(404).json({ error: 'Not found' });

  const { rows: completedRows } = await pool.query(
    'SELECT 1 FROM course_progress WHERE user_id = $1 AND lesson_id = $2',
    [req.user.id, lesson.id]
  );

  res.json({ ...lesson, completed: completedRows.length > 0 });
});

router.post('/:slug/lessons/:lessonId/complete', requireAuth, async (req, res) => {
  await pool.query(
    `INSERT INTO course_progress (user_id, lesson_id) VALUES ($1, $2)
     ON CONFLICT (user_id, lesson_id) DO NOTHING`,
    [req.user.id, req.params.lessonId]
  );
  await cacheDel(`cache:courses:progress:${req.user.id}`);
  res.json({ ok: true });
});

router.delete('/:slug/lessons/:lessonId/complete', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM course_progress WHERE user_id = $1 AND lesson_id = $2', [
    req.user.id,
    req.params.lessonId,
  ]);
  res.json({ ok: true });
});

export default router;

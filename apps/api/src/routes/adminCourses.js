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

async function courseOr404(courseId) {
  const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
  return rows[0] || null;
}

async function bustCourseCache(course) {
  await cacheDelPattern('cache:courses:*');
  await purgeUrls([courseUrl(course.slug)]);
}

router.get('/:id/phases', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { rows: phases } = await pool.query(
    'SELECT * FROM course_phases WHERE course_id = $1 ORDER BY sort_order ASC',
    [course.id]
  );
  const { rows: lessons } = await pool.query(
    `SELECT l.* FROM course_lessons l
     JOIN course_phases p ON p.id = l.phase_id
     WHERE p.course_id = $1
     ORDER BY l.sort_order ASC`,
    [course.id]
  );
  res.json(phases.map((p) => ({ ...p, lessons: lessons.filter((l) => l.phase_id === p.id) })));
});

router.post('/:id/phases', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { rows: orderRows } = await pool.query(
    'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM course_phases WHERE course_id = $1',
    [course.id]
  );
  const { rows } = await pool.query(
    'INSERT INTO course_phases (course_id, title, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
    [course.id, title, description || null, orderRows[0].next]
  );

  await bustCourseCache(course);
  res.status(201).json(rows[0]);
});

// NOTE: literal '/order' routes must stay above their '/:phaseId' and '/:lessonId'
// siblings, or Express matches 'order' as an id first.
router.put('/:id/phases/order', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: 'orderedIds must be a non-empty array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [index, phaseId] of orderedIds.entries()) {
      const { rowCount } = await client.query(
        'UPDATE course_phases SET sort_order = $1 WHERE id = $2 AND course_id = $3',
        [index, phaseId, course.id]
      );
      if (rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'orderedIds contains an unknown phase' });
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await bustCourseCache(course);
  res.json({ ok: true });
});

router.put('/:id/phases/:phaseId', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const { rows } = await pool.query(
    `UPDATE course_phases SET title = $1, description = $2
     WHERE id = $3 AND course_id = $4 RETURNING *`,
    [title, description || null, req.params.phaseId, course.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  await bustCourseCache(course);
  res.json(rows[0]);
});

router.delete('/:id/phases/:phaseId', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const { rows } = await pool.query(
    'DELETE FROM course_phases WHERE id = $1 AND course_id = $2 RETURNING id',
    [req.params.phaseId, course.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  await bustCourseCache(course);
  res.json({ ok: true });
});

function validLessonContent(content) {
  return content === null || content === undefined || typeof content === 'object';
}

router.post('/:id/phases/:phaseId/lessons', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { rows: phaseRows } = await pool.query(
    'SELECT id FROM course_phases WHERE id = $1 AND course_id = $2',
    [req.params.phaseId, course.id]
  );
  if (!phaseRows[0]) return res.status(404).json({ error: 'Phase not found' });

  const { day_number, title, duration_minutes, summary, content } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!Number.isInteger(day_number) || day_number < 1) {
    return res.status(400).json({ error: 'day_number must be a positive integer' });
  }
  if (!validLessonContent(content)) return res.status(400).json({ error: 'content must be an object' });

  // Course-wide MAX, not per-phase: the public outline sorts all of a course's
  // lessons by one global sort_order, so per-phase numbering would tie and
  // scramble the order (Postgres doesn't break sort ties deterministically).
  const { rows: orderRows } = await pool.query(
    `SELECT COALESCE(MAX(l.sort_order) + 1, 0) AS next FROM course_lessons l
     JOIN course_phases p ON p.id = l.phase_id WHERE p.course_id = $1`,
    [course.id]
  );
  const { rows } = await pool.query(
    `INSERT INTO course_lessons (phase_id, day_number, title, duration_minutes, summary, content, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      req.params.phaseId,
      day_number,
      title,
      Number.isInteger(duration_minutes) && duration_minutes > 0 ? duration_minutes : 60,
      summary || null,
      content ? JSON.stringify(content) : null,
      orderRows[0].next,
    ]
  );

  await bustCourseCache(course);
  await purgeUrls([`${courseUrl(course.slug)}/lessons/${rows[0].id}`]);
  res.status(201).json(rows[0]);
});

router.put('/:id/lessons/order', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: 'orderedIds must be a non-empty array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [index, lessonId] of orderedIds.entries()) {
      const { rowCount } = await client.query(
        `UPDATE course_lessons SET sort_order = $1 WHERE id = $2 AND phase_id IN
         (SELECT id FROM course_phases WHERE course_id = $3)`,
        [index, lessonId, course.id]
      );
      if (rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'orderedIds contains an unknown lesson' });
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await bustCourseCache(course);
  res.json({ ok: true });
});

router.put('/:id/lessons/:lessonId', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { phase_id, day_number, title, duration_minutes, summary, content } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (day_number !== undefined && (!Number.isInteger(day_number) || day_number < 1)) {
    return res.status(400).json({ error: 'day_number must be a positive integer' });
  }
  if (!validLessonContent(content)) return res.status(400).json({ error: 'content must be an object' });
  if (phase_id) {
    const { rows: phaseRows } = await pool.query(
      'SELECT id FROM course_phases WHERE id = $1 AND course_id = $2',
      [phase_id, course.id]
    );
    if (!phaseRows[0]) return res.status(400).json({ error: 'phase_id is not in this course' });
  }

  const { rows } = await pool.query(
    `UPDATE course_lessons SET
       phase_id = COALESCE($1, phase_id),
       day_number = COALESCE($2, day_number),
       title = $3,
       duration_minutes = COALESCE($4, duration_minutes),
       summary = $5,
       content = $6
     WHERE id = $7 AND phase_id IN (SELECT id FROM course_phases WHERE course_id = $8)
     RETURNING *`,
    [
      phase_id || null,
      day_number ?? null,
      title,
      Number.isInteger(duration_minutes) && duration_minutes > 0 ? duration_minutes : null,
      summary || null,
      content ? JSON.stringify(content) : null,
      req.params.lessonId,
      course.id,
    ]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  await bustCourseCache(course);
  await purgeUrls([`${courseUrl(course.slug)}/lessons/${rows[0].id}`]);
  res.json(rows[0]);
});

router.delete('/:id/lessons/:lessonId', editorOrAdmin, async (req, res) => {
  const course = await courseOr404(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const { rows } = await pool.query(
    `DELETE FROM course_lessons WHERE id = $1 AND phase_id IN
     (SELECT id FROM course_phases WHERE course_id = $2) RETURNING id`,
    [req.params.lessonId, course.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  await bustCourseCache(course);
  await purgeUrls([`${courseUrl(course.slug)}/lessons/${rows[0].id}`]);
  res.json({ ok: true });
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

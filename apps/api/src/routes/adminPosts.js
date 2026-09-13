import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { cacheDelPattern } from '../cache/redis.js';
import { purgeUrls } from '../cache/cloudflare.js';

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:8899';
const postUrl = (slug) => `${SITE_URL}/blog/${slug}`;

router.get('/', editorOrAdmin, async (req, res) => {
  const { type, status, page = '1', limit = '20', q } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];

  if (type) { params.push(type); conditions.push(`p.type = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`p.status = $${params.length}`); }
  if (q) { params.push(`%${q}%`); conditions.push(`p.title ILIKE $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(parseInt(limit), offset);
  const { rows } = await pool.query(
    `SELECT p.*, u.name AS author_name
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     ${where}
     ORDER BY p.updated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json(rows);
});

router.post('/', editorOrAdmin, async (req, res) => {
  const { type, status, slug, title, excerpt, content, featured_image_url,
          is_featured, meta_title, meta_description } = req.body;

  // $2 (status) and $12 carry the same value on purpose: reusing $2 inside the CASE below
  // makes Postgres infer two different types for one parameter (the SET-list context wants
  // the status column's varchar type, the string comparison wants text) and it refuses to
  // run the query at all ("inconsistent types deduced for parameter"). A second, dedicated
  // parameter sidesteps the ambiguity entirely.
  const { rows } = await pool.query(
    `INSERT INTO posts (type, status, slug, title, excerpt, content,
       featured_image_url, is_featured, author_id, meta_title, meta_description,
       published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
       CASE WHEN $12 = 'published' THEN NOW() ELSE NULL END)
     RETURNING *`,
    [type, status || 'draft', slug, title, excerpt, content ? JSON.stringify(content) : null,
     featured_image_url, is_featured || false, req.user.id, meta_title, meta_description, status || 'draft']
  );

  await cacheDelPattern('cache:posts:*');
  await purgeUrls([postUrl(rows[0].slug)]);
  res.status(201).json(rows[0]);
});

router.get('/:id', editorOrAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.put('/:id', editorOrAdmin, async (req, res) => {
  const { type, status, slug, title, excerpt, content, featured_image_url,
          is_featured, meta_title, meta_description } = req.body;

  const { rows: existing } = await pool.query('SELECT slug FROM posts WHERE id = $1', [req.params.id]);
  const oldSlug = existing[0]?.slug;

  // $2 (status) is deliberately duplicated as $12 — see the comment on the same pattern
  // in the POST route above. This is the query that was actually failing: every edit save
  // hit this "inconsistent types deduced for parameter $2" error and rolled back silently,
  // so admin post edits never persisted despite the UI showing no error.
  const { rows } = await pool.query(
    `UPDATE posts SET
       type = $1, status = $2, slug = $3, title = $4, excerpt = $5,
       content = $6, featured_image_url = $7, is_featured = $8,
       meta_title = $9, meta_description = $10,
       published_at = CASE
         WHEN $12 = 'published' AND published_at IS NULL THEN NOW()
         ELSE published_at END
     WHERE id = $11
     RETURNING *`,
    [type, status, slug, title, excerpt, content ? JSON.stringify(content) : null,
     featured_image_url, is_featured || false, meta_title, meta_description, req.params.id, status]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  await cacheDelPattern('cache:posts:*');
  // Purge both slugs when the slug changed on this edit — the old URL should also stop
  // serving a cached copy of content that no longer lives there.
  await purgeUrls([postUrl(rows[0].slug), oldSlug ? postUrl(oldSlug) : null]);
  res.json(rows[0]);
});

router.delete('/:id', editorOrAdmin, async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE posts SET status = 'archived' WHERE id = $1 RETURNING slug",
    [req.params.id]
  );
  await cacheDelPattern('cache:posts:*');
  if (rows[0]) await purgeUrls([postUrl(rows[0].slug)]);
  res.json({ ok: true });
});

export default router;

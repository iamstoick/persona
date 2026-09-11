import { Router } from 'express';
import { pool } from '../db/pool.js';
import { cacheGet, cacheSet, TTL } from '../cache/redis.js';

const router = Router();

function readTime(content) {
  const text = JSON.stringify(content || {});
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200);
}

router.get('/', async (req, res) => {
  const { type = 'post', status = 'published', page = '1', limit = '10' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const cacheKey = `cache:posts:list:${type}:${status}:${page}:${limit}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT p.*, u.name AS author_name, u.avatar_url AS author_avatar,
            array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     LEFT JOIN post_tags pt ON pt.post_id = p.id
     LEFT JOIN tags t ON t.id = pt.tag_id
     WHERE p.type = $1 AND p.status = $2
     GROUP BY p.id, u.name, u.avatar_url
     ORDER BY p.published_at DESC
     LIMIT $3 OFFSET $4`,
    [type, status, parseInt(limit), offset]
  );

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) FROM posts WHERE type = $1 AND status = $2',
    [type, status]
  );

  const result = {
    data: rows.map((p) => ({ ...p, read_time: readTime(p.content) })),
    total: parseInt(countRows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
  };

  await cacheSet(cacheKey, result, TTL.POSTS);
  res.json(result);
});

router.get('/featured', async (req, res) => {
  const cacheKey = 'cache:posts:featured';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT p.*, u.name AS author_name, u.avatar_url AS author_avatar,
            array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     LEFT JOIN post_tags pt ON pt.post_id = p.id
     LEFT JOIN tags t ON t.id = pt.tag_id
     WHERE p.is_featured = TRUE AND p.status = 'published'
     GROUP BY p.id, u.name, u.avatar_url
     ORDER BY p.published_at DESC
     LIMIT 1`
  );

  const result = rows[0] || null;
  await cacheSet(cacheKey, result, TTL.POSTS);
  res.json(result);
});

router.get('/:slug', async (req, res) => {
  const cacheKey = `cache:posts:slug:${req.params.slug}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT p.*, u.name AS author_name, u.avatar_url AS author_avatar,
            array_agg(DISTINCT c.slug) FILTER (WHERE c.slug IS NOT NULL) AS categories,
            array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
     FROM posts p
     LEFT JOIN users u ON u.id = p.author_id
     LEFT JOIN post_categories pc ON pc.post_id = p.id
     LEFT JOIN categories c ON c.id = pc.category_id
     LEFT JOIN post_tags pt ON pt.post_id = p.id
     LEFT JOIN tags t ON t.id = pt.tag_id
     WHERE p.slug = $1 AND p.status = 'published'
     GROUP BY p.id, u.name, u.avatar_url`,
    [req.params.slug]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  const result = { ...rows[0], read_time: readTime(rows[0].content) };
  await cacheSet(cacheKey, result, TTL.POSTS);
  res.json(result);
});

export default router;

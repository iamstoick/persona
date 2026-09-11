import { Router } from 'express';
import { pool } from '../db/pool.js';
import { cacheGet, cacheSet, TTL } from '../cache/redis.js';

const router = Router();

router.get('/:name', async (req, res) => {
  const cacheKey = `cache:menus:${req.params.name}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows: menuRows } = await pool.query('SELECT * FROM menus WHERE name = $1', [req.params.name]);
  if (!menuRows[0]) return res.status(404).json({ error: 'Menu not found' });

  const { rows: items } = await pool.query(
    `SELECT mi.*, p.slug AS post_slug
     FROM menu_items mi
     LEFT JOIN posts p ON p.id = mi.post_id
     WHERE mi.menu_id = $1
     ORDER BY mi."order" ASC`,
    [menuRows[0].id]
  );

  const result = { ...menuRows[0], items };
  await cacheSet(cacheKey, result, TTL.MENUS);
  res.json(result);
});

export default router;

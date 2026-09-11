import { Router } from 'express';
import { pool } from '../db/pool.js';
import { cacheGet, cacheSet, TTL } from '../cache/redis.js';

const router = Router();

router.get('/', async (_req, res) => {
  const cacheKey = 'cache:settings:all';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query('SELECT key, value FROM site_settings');
  const result = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  await cacheSet(cacheKey, result, TTL.POSTS);
  res.json(result);
});

export default router;

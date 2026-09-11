import { Router } from 'express';
import { pool } from '../db/pool.js';
import { cacheGet, cacheSet, TTL } from '../cache/redis.js';

const router = Router();

router.get('/', async (_req, res) => {
  const cacheKey = 'cache:services:all';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query('SELECT * FROM services ORDER BY sort_order ASC, created_at ASC');
  await cacheSet(cacheKey, rows, TTL.POSTS);
  res.json(rows);
});

export default router;

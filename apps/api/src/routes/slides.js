import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { cacheGet, cacheSet, TTL } from '../cache/redis.js';

const router = Router();

// Public: deck catalogue only (titles + slide counts). Full slide content is
// gated to logged-in users on GET /:slug below.
router.get('/', async (_req, res) => {
  const cacheKey = 'cache:slides:list';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const { rows } = await pool.query(
    `SELECT d.id, d.slug, d.title, d.description, d.sort_order,
            COUNT(s.id)::int AS slide_count
     FROM slide_decks d
     LEFT JOIN slides s ON s.deck_id = d.id
     WHERE d.status = 'published'
     GROUP BY d.id
     ORDER BY d.sort_order ASC, d.created_at ASC`
  );

  await cacheSet(cacheKey, rows, TTL.POSTS);
  res.json(rows);
});

router.get('/:slug', requireAuth, async (req, res) => {
  const { rows: deckRows } = await pool.query(
    `SELECT id, slug, title, description FROM slide_decks
     WHERE slug = $1 AND status = 'published'`,
    [req.params.slug]
  );
  const deck = deckRows[0];
  if (!deck) return res.status(404).json({ error: 'Not found' });

  const { rows: slides } = await pool.query(
    `SELECT id, title, content, notes, sort_order FROM slides
     WHERE deck_id = $1 ORDER BY sort_order ASC`,
    [deck.id]
  );

  // Speaker notes are visible to admins only — regular members get the slide
  // content without them. (The admin management API still serves notes to
  // editor/admin roles so authors can write them.)
  const isAdmin = req.user?.role === 'admin';
  res.json({ ...deck, slides: slides.map((s) => ({ ...s, notes: isAdmin ? s.notes : null })) });
});

export default router;

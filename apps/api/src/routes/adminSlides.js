import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireRole } from '../middleware/requireAuth.js';
import { cacheDelPattern } from '../cache/redis.js';
import { purgeUrls } from '../cache/cloudflare.js';

const router = Router();
const editorOrAdmin = requireRole('editor', 'admin');
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:8899';
const deckUrl = (slug) => `${SITE_URL}/slides/${slug}`;

router.get('/', editorOrAdmin, async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT d.*, COUNT(s.id)::int AS slide_count
     FROM slide_decks d
     LEFT JOIN slides s ON s.deck_id = d.id
     GROUP BY d.id
     ORDER BY d.sort_order ASC, d.created_at ASC`
  );
  res.json(rows);
});

router.put('/:id', editorOrAdmin, async (req, res) => {
  const { title, description, status, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (status && !['draft', 'published'].includes(status)) {
    return res.status(400).json({ error: 'status must be draft or published' });
  }

  const { rows } = await pool.query(
    `UPDATE slide_decks SET title = $1, description = $2, status = COALESCE($3, status), sort_order = $4
     WHERE id = $5 RETURNING *`,
    [title, description || null, status, sort_order ?? 0, req.params.id]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  await cacheDelPattern('cache:slides:*');
  await purgeUrls([deckUrl(rows[0].slug)]);
  res.json(rows[0]);
});

async function deckOr404(deckId) {
  const { rows } = await pool.query('SELECT * FROM slide_decks WHERE id = $1', [deckId]);
  return rows[0] || null;
}

function validContent(content) {
  return content === null || content === undefined || typeof content === 'object';
}

router.get('/:id/slides', editorOrAdmin, async (req, res) => {
  const deck = await deckOr404(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  const { rows } = await pool.query(
    'SELECT * FROM slides WHERE deck_id = $1 ORDER BY sort_order ASC',
    [deck.id]
  );
  res.json(rows);
});

router.post('/:id/slides', editorOrAdmin, async (req, res) => {
  const deck = await deckOr404(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  const { title, content, notes, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!validContent(content)) return res.status(400).json({ error: 'content must be an object' });

  const order =
    Number.isInteger(sort_order) && sort_order >= 0
      ? sort_order
      : (await pool.query('SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM slides WHERE deck_id = $1', [deck.id])).rows[0].next;

  const { rows } = await pool.query(
    `INSERT INTO slides (deck_id, title, content, notes, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [deck.id, title, content ? JSON.stringify(content) : null, notes || null, order]
  );

  await cacheDelPattern('cache:slides:*');
  await purgeUrls([deckUrl(deck.slug)]);
  res.status(201).json(rows[0]);
});

// NOTE: this literal route must stay above '/:id/slides/:slideId' below, or
// Express matches 'order' as a slideId first.
// Persists a full deck ordering in one transaction — the admin UI sends the
// slide ids top-to-bottom after an up/down move. Ids outside this deck abort
// the whole reorder rather than partially applying it.
router.put('/:id/slides/order', editorOrAdmin, async (req, res) => {
  const deck = await deckOr404(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: 'orderedIds must be a non-empty array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [index, slideId] of orderedIds.entries()) {
      const { rowCount } = await client.query(
        'UPDATE slides SET sort_order = $1 WHERE id = $2 AND deck_id = $3',
        [index, slideId, deck.id]
      );
      if (rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'orderedIds contains an unknown slide' });
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await cacheDelPattern('cache:slides:*');
  await purgeUrls([deckUrl(deck.slug)]);
  res.json({ ok: true });
});

router.put('/:id/slides/:slideId', editorOrAdmin, async (req, res) => {
  const deck = await deckOr404(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  const { title, content, notes, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!validContent(content)) return res.status(400).json({ error: 'content must be an object' });

  const { rows } = await pool.query(
    `UPDATE slides SET title = $1, content = $2, notes = $3, sort_order = COALESCE($4, sort_order)
     WHERE id = $5 AND deck_id = $6 RETURNING *`,
    [
      title,
      content ? JSON.stringify(content) : null,
      notes || null,
      Number.isInteger(sort_order) && sort_order >= 0 ? sort_order : null,
      req.params.slideId,
      deck.id,
    ]
  );

  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  await cacheDelPattern('cache:slides:*');
  await purgeUrls([deckUrl(deck.slug)]);
  res.json(rows[0]);
});

router.delete('/:id/slides/:slideId', editorOrAdmin, async (req, res) => {
  const deck = await deckOr404(req.params.id);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  const { rows } = await pool.query('DELETE FROM slides WHERE id = $1 AND deck_id = $2 RETURNING id', [
    req.params.slideId,
    deck.id,
  ]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  await cacheDelPattern('cache:slides:*');
  await purgeUrls([deckUrl(deck.slug)]);
  res.json({ ok: true });
});

export default router;

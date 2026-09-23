-- Drop the speaker notes on the cover slide (sort_order 0). Idempotent.
UPDATE slides SET notes = NULL
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND sort_order = 0;

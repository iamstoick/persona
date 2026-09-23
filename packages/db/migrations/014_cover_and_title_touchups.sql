-- Cover heading capitalization + two slide title touch-ups. Idempotent: the title
-- UPDATEs match old titles, and the cover replacement sets an exact value.
UPDATE slides SET content = $slide${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"What to study · Which skills matter · What employers want · What it pays"}]},{"type":"paragraph","content":[{"type":"text","text":"A plain-language map for anyone curious about the AI engineering career — no technical background assumed."}]},{"type":"paragraph","content":[{"type":"text","text":"12 slides · about 15 minutes"}]}]}$slide$::jsonb
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND sort_order = 0;

UPDATE slides SET title = 'What an AI engineer actually does?'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'What an AI engineer actually does';

UPDATE slides SET title = 'AI Fields And Roles'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'AI fields and roles';

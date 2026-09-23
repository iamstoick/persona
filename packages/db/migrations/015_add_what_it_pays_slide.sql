-- New "What It Pays" slide ahead of the salary slides: title + the Alexandr
-- Wang / Meta $14.3B screenshot only. The image file itself
-- (apps/web/public/images/alexandr-wang-meta-deal.png) is added alongside.
-- Deck grows from 12 to 13 slides, still about 15 minutes.
-- Idempotent: guarded so re-running changes nothing.
UPDATE slides SET sort_order = sort_order + 1
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND sort_order >= 9
  AND NOT EXISTS (
    SELECT 1 FROM slides s2
    WHERE s2.deck_id = slides.deck_id AND s2.title = 'What It Pays'
  );

INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'What It Pays', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/alexandr-wang-meta-deal.png","alt":"Fortune headline: self-made billionaire college dropout Alexandr Wang signs $14.3 billion deal to bolster Meta's AI efforts","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Fortune · Photo: David Paul Morris/Bloomberg via Getty Images"}]}]}$slide$::jsonb, 'Open the pay discussion with this headline: Meta paid $14.3 billion for a stake in Scale AI and hired its founder Alexandr Wang to lead its AI efforts — the premium on proven AI talent in one picture. Then move to the salary ranges. About one minute.', 9
FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer'
AND NOT EXISTS (
  SELECT 1 FROM slides s2
  WHERE s2.deck_id = slide_decks.id AND s2.title = 'What It Pays'
);

-- Cover slide and deck description now count 13 slides.
UPDATE slides SET content = $slide${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"What to study · Which skills matter · What employers want · What it pays"}]},{"type":"paragraph","content":[{"type":"text","text":"A plain-language map for anyone curious about the AI engineering career — no technical background assumed."}]},{"type":"paragraph","content":[{"type":"text","text":"13 slides · about 15 minutes"}]}]}$slide$::jsonb
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND sort_order = 0;

UPDATE slide_decks
SET description = 'A plain-language guide: what to study, which skills matter, what employers want, and what it pays — internationally and in the Philippines. 13 slides, about 15 minutes.'
WHERE slug = 'how-to-be-an-ai-engineer';

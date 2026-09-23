-- Reconcile 015_add_what_it_pays_slide with 015_retarget_deck_for_professors: a
-- parallel session retargeted this deck (new title, faculty framing, its own
-- lowercase "What it pays" slide). This removes the duplicate Title-Case slide,
-- restores the retarget cover/description, puts the Wang/Meta screenshot into the
-- retarget's existing "What it pays" slide (title + screenshot only), and pins the
-- 12-slide order by title so fresh and existing databases converge.
-- Idempotent: re-running changes nothing.
DELETE FROM slides
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'What It Pays';

UPDATE slides SET content = $slide${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"What AI can do for you · How it works · Where your expertise fits · What it pays"}]},{"type":"paragraph","content":[{"type":"text","text":"A plain-language talk for educators with little or no AI background. No programming needed to start."}]},{"type":"paragraph","content":[{"type":"text","text":"12 slides · about 15 minutes"}]}]}$slide$::jsonb
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'AI for professors: use it, teach with it, earn from it';

UPDATE slides
SET content = $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/alexandr-wang-meta-deal.png","alt":"Fortune headline: self-made billionaire college dropout Alexandr Wang signs $14.3 billion deal to bolster Meta's AI efforts","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Fortune · Photo: David Paul Morris/Bloomberg via Getty Images"}]}]}$slide$::jsonb,
    notes = 'Open with this headline: Meta paid $14.3 billion for a stake in Scale AI and hired its founder Alexandr Wang to lead its AI efforts — the premium on proven AI talent in one picture. Invite questions on pay before moving to the roadmap. About one minute.'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'What it pays';

UPDATE slides SET sort_order = CASE title
  WHEN 'AI for professors: use it, teach with it, earn from it' THEN 0
  WHEN 'What AI can do for you this week' THEN 1
  WHEN 'What an AI engineer actually does' THEN 2
  WHEN 'Common fears, honest answers' THEN 3
  WHEN 'How AI works, in plain terms' THEN 4
  WHEN 'Skills anyone can learn' THEN 5
  WHEN 'Your unfair advantage: domain expertise' THEN 6
  WHEN 'Side-hustle paths for academics' THEN 7
  WHEN 'Going deeper: technical foundations' THEN 8
  WHEN 'Building responsibly: cost, privacy, students' THEN 9
  WHEN 'What it pays' THEN 10
  WHEN 'Your 90-day roadmap' THEN 11
  ELSE sort_order END
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer');

UPDATE slide_decks
SET description = 'A plain-language talk for educators with little or no AI background: what AI can do for you this week, how it works, why your expertise is the rare skill, side-hustle paths, what it pays, and a 90-day roadmap. 12 slides, about 15 minutes.'
WHERE slug = 'how-to-be-an-ai-engineer';

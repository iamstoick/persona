-- Restore the International and Philippines salary slides after the "What it pays"
-- screenshot slide (the professor retarget had collapsed them into one slide, which
-- then became screenshot-only). Content is the plain-language 011 wording.
-- Deck grows from 12 to 14 slides, still about 15 minutes.
-- Idempotent: guarded so re-running changes nothing.
UPDATE slides SET sort_order = sort_order + 2
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND sort_order >= 11
  AND NOT EXISTS (
    SELECT 1 FROM slides s2
    WHERE s2.deck_id = slides.deck_id AND s2.title = 'Salary Ranges: International'
  );

INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Salary Ranges: International', $slide${"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Approximate yearly pay, 2025–2026. Treat these as orientation, not promises — levels and benefits vary widely."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"United States beginners: "},{"type":"text","text":"around $120,000–$160,000 per year; experienced: $160,000–$220,000; senior experts: $220,000–$300,000 or more."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Top experts at famous AI labs: "},{"type":"text","text":"$300,000–$600,000+ per year including company shares."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Western Europe: "},{"type":"text","text":"typically €60,000–€120,000 per year; London and Berlin pay more at senior levels."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Remote work for American or European companies: "},{"type":"text","text":"commonly $80,000–$180,000 per year."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"The pattern: "},{"type":"text","text":"the highest pay goes to people who finish projects and verify their AI's work."}]}]}]}]}$slide$::jsonb, 'Read one number slowly and let it land — for example, what a senior expert earns. Then caveat cost of living before questions start.', 11
FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer'
AND NOT EXISTS (
  SELECT 1 FROM slides s2
  WHERE s2.deck_id = slide_decks.id AND s2.title = 'Salary Ranges: International'
);

INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Salary Ranges: Philippines', $slide${"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Approximate monthly pay, 2025–2026. Remote work for foreign clients pays the most by far."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Local tech companies: "},{"type":"text","text":"beginners ₱30k–₱60k · experienced ₱60k–₱120k · senior ₱120k–₱200k+ per month."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Remote work for foreign clients: "},{"type":"text","text":"roughly $2,000–$8,000+ per month (₱115,000–₱460,000+)."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Back-office AI support roles: "},{"type":"text","text":"steadier, usually 20–40% below tech-company pay."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Independent consulting: "},{"type":"text","text":"₱50,000–₱300,000+ per project once you can show results."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Fastest way up: "},{"type":"text","text":"finished work to show, strong English, and hours that overlap with clients."}]}]}]}]}$slide$::jsonb, 'Expect the most questions here. Emphasize that domain expertise is a multiplier on every row — exactly what this audience already has.', 12
FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer'
AND NOT EXISTS (
  SELECT 1 FROM slides s2
  WHERE s2.deck_id = slide_decks.id AND s2.title = 'Salary Ranges: Philippines'
);

-- Cover slide and deck description now count 14 slides.
UPDATE slides SET content = $slide${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"What AI can do for you · How it works · Where your expertise fits · What it pays"}]},{"type":"paragraph","content":[{"type":"text","text":"A plain-language talk for educators with little or no AI background. No programming needed to start."}]},{"type":"paragraph","content":[{"type":"text","text":"14 slides · about 15 minutes"}]}]}$slide$::jsonb
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'AI for professors: use it, teach with it, earn from it';

UPDATE slide_decks
SET description = 'A plain-language talk for educators with little or no AI background: what AI can do for you this week, how it works, why your expertise is the rare skill, side-hustle paths, what it pays, and a 90-day roadmap. 14 slides, about 15 minutes.'
WHERE slug = 'how-to-be-an-ai-engineer';

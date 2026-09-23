-- Insert an "AI fields and roles" slide after "What an AI engineer actually does",
-- grounded in the Nexford, Syracuse iSchool, and SSBM 2026 AI jobs guides.
-- Deck grows from 11 to 12 slides, still about 15 minutes.
-- Idempotent: guarded so re-running changes nothing.
UPDATE slides SET sort_order = sort_order + 1
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND sort_order >= 2
  AND NOT EXISTS (
    SELECT 1 FROM slides s2
    WHERE s2.deck_id = slides.deck_id AND s2.title = 'AI fields and roles'
  );

INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'AI fields and roles', $slide${"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"“AI engineer” is one job among many. Industry guides agree these are the main AI fields today."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Machine learning engineer: "},{"type":"text","text":"builds systems that learn from data to make predictions — the closest cousin of the AI engineer."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Data scientist: "},{"type":"text","text":"studies large datasets to find patterns and guide decisions; the analysis-focused path."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Language and vision specialists: "},{"type":"text","text":"teach computers to understand text, voice, and images — chatbots, translation, face and object recognition."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"AI research scientist: "},{"type":"text","text":"invents new AI methods; usually needs a doctorate — the academic path."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"AI product manager and consultant: "},{"type":"text","text":"decide what to build and guide teams; a blend of business sense and technical understanding."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Newer specialist roles: "},{"type":"text","text":"chatbot engineers, robotics engineers, and AI ethics officers who keep systems safe and fair."}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"Role guides: "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://www.nexford.edu/insights/highest-paying-ai-jobs","target":"_blank"}}],"text":"Nexford"},{"type":"text","text":" · "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://ischool.syracuse.edu/highest-paying-ai-jobs/","target":"_blank"}}],"text":"Syracuse iSchool"},{"type":"text","text":" · "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://www.ssbm.ch/top-12-highest-paying-ai-jobs-in-2026-seo-edition/","target":"_blank"}}],"text":"SSBM"}]}]}$slide$::jsonb, 'Name the three sources out loud, since this audience values citations. Note this deck follows the AI engineer path because it is the most reachable without a doctorate. About one minute.', 2
FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer'
AND NOT EXISTS (
  SELECT 1 FROM slides s2
  WHERE s2.deck_id = slide_decks.id AND s2.title = 'AI fields and roles'
);

-- Cover slide and deck description now count 12 slides.
UPDATE slides SET content = $slide${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"What to study · which skills matter · what employers want · what it pays"}]},{"type":"paragraph","content":[{"type":"text","text":"A plain-language map for anyone curious about the AI engineering career — no technical background assumed."}]},{"type":"paragraph","content":[{"type":"text","text":"12 slides · about 15 minutes"}]}]}$slide$::jsonb
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND sort_order = 0;

UPDATE slide_decks
SET description = 'A plain-language guide: what to study, which skills matter, what employers want, and what it pays — internationally and in the Philippines. 12 slides, about 15 minutes.'
WHERE slug = 'how-to-be-an-ai-engineer';

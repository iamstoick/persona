-- Visual companion to the professors deck: 8 slides, one graphic each, under 7 minutes.
-- Graphics are static SVGs in apps/web/public/slides/ai-for-professors-visual/ served same-origin.
-- Idempotent: re-running replaces this deck's slides with the content below.
INSERT INTO slide_decks (slug, title, description, status, sort_order)
VALUES (
  'ai-for-professors-visual',
  'Your expertise × AI (visual edition)',
  'Graphics-first version of the professors talk: what AI does for you this week, how it works, fear versus fact, why your expertise is the rare skill, side hustles, pay, and a 90-day plan. 8 slides, under 7 minutes.',
  'published',
  1
)
ON CONFLICT (slug) DO NOTHING;

DELETE FROM slides WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'ai-for-professors-visual');

-- Slide 1: Your expertise × AI
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Your expertise × AI', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/slides/ai-for-professors-visual/01-cover.svg","alt":"YOU times AI equals the rarest skill in the room"}}]}$slide$::jsonb, 'Let the graphic sit for five seconds. One line: this talk is about what you already have, plus one tool. Under a minute.', 0
FROM slide_decks WHERE slug = 'ai-for-professors-visual';

-- Slide 2: What AI does for you this week
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'What AI does for you this week', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/slides/ai-for-professors-visual/02-this-week.svg","alt":"Four tiles: lecture outline 3 hours to 20 minutes; student Q&A 24/7; 30 papers to 1 page; first-pass rubric checks"}},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Free chatbot account. Your own material. No setup."}]}]}]}]}$slide$::jsonb, 'Point at the tile closest to this room''s discipline. Ask who has tried one already.', 1
FROM slide_decks WHERE slug = 'ai-for-professors-visual';

-- Slide 3: How it works
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'How it works', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/slides/ai-for-professors-visual/03-how-it-works.svg","alt":"Three steps: reads millions of examples, learns patterns not facts, predicts the next word. Give it your notes and it answers from them"}},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"It predicts words, so it can be confidently wrong."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Pointed at your notes, it answers from your material."}]}]}]}]}$slide$::jsonb, 'The bottom banner is the whole technique. Say it twice.', 2
FROM slide_decks WHERE slug = 'ai-for-professors-visual';

-- Slide 4: Fear → fact
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Fear → fact', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/slides/ai-for-professors-visual/04-fear-fact.svg","alt":"Three fears with answers: it makes things up, so give it sources and check; students will cheat, so grade reasoning not recall; it replaces teachers, but it replaces tasks not judgment"}}]}$slide$::jsonb, 'Do not debate. Read the three facts and move on. Offer to return in Q&A.', 3
FROM slide_decks WHERE slug = 'ai-for-professors-visual';

-- Slide 5: The rare skill
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'The rare skill', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/slides/ai-for-professors-visual/05-rare-skill.svg","alt":"Venn diagram: your field, 20 years, overlapping AI fluency, 90 days. The overlap is rare and well paid"}},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"The overlap is small because few experts learn the tool."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"You already own the half that takes twenty years."}]}]}]}]}$slide$::jsonb, 'Emotional center of the talk. Point at the room.', 4
FROM slide_decks WHERE slug = 'ai-for-professors-visual';

-- Slide 6: Earn from it
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Earn from it', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/slides/ai-for-professors-visual/06-earn.svg","alt":"Ladder of four side hustles by effort: sell study guides and courses, run AI workshops for faculty, consult for schools and publishers, build a tutor bot for your course"}},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Three of four need no code at all."}]}]}]}]}$slide$::jsonb, 'Ask which rung the room would try first.', 5
FROM slide_decks WHERE slug = 'ai-for-professors-visual';

-- Slide 7: What it pays
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'What it pays', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/slides/ai-for-professors-visual/07-pay.svg","alt":"Range bars, Philippine pesos per month: local starter 30 to 60 thousand; local senior 120 to 200 thousand; consulting 50 to 300 thousand per project; remote foreign clients 115 to 460 thousand"}},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Remote work for foreign clients is the biggest jump."}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Domain experts charge more than generalist engineers."}]}]}]}]}$slide$::jsonb, 'Read the top bar slowly. Caveat cost of living before questions.', 6
FROM slide_decks WHERE slug = 'ai-for-professors-visual';

-- Slide 8: Your next 90 days
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Your next 90 days', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/slides/ai-for-professors-visual/08-90-days.svg","alt":"Timeline: this week use a chatbot on one real task; day 30 a bot that answers from your notes; day 60 pilot with one class; day 90 make your first offer. You do not need to become an engineer"}},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Do the first stop before Friday."}]}]}]}]}$slide$::jsonb, 'Close with the assignment. Take questions on side hustles first.', 7
FROM slide_decks WHERE slug = 'ai-for-professors-visual';

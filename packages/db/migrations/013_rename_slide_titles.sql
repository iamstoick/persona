-- Rename deck slide titles per author request. Idempotent: each UPDATE matches the
-- old title, so re-running changes nothing.
UPDATE slides SET title = 'Foundations Required'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'Subjects I — computer foundations';

UPDATE slides SET title = 'AI Essentials'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'Subjects II — AI essentials';

UPDATE slides SET title = 'Skills: Working with AI'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'Skills I — working with AI';

UPDATE slides SET title = 'Skills: Building Real Products'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'Skills II — building real products';

UPDATE slides SET title = 'What employers look for: Result'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'What employers look for I';

UPDATE slides SET title = 'What employers look for: Stand Out'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'What employers look for II — stand out';

UPDATE slides SET title = 'Salary Ranges: International'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'Salary ranges — international';

-- Author wrote an em dash here but a colon for the International twin; use the colon
-- for both so the pair is consistent.
UPDATE slides SET title = 'Salary Ranges: Philippines'
WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'how-to-be-an-ai-engineer')
  AND title = 'Salary ranges — Philippines';

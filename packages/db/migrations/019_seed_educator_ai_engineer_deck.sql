-- Second slide deck: "How to Be an AI Engineer in Today's World as an Educator"
-- Converted from The_Educator_AI_Engineer.pdf (10 full-page visuals). Each slide
-- shows the original page image plus a one-line takeaway; speaker notes carry the
-- transcript so the presenter can talk through each visual.
-- Idempotent: re-running replaces this deck's slides with the content below.
INSERT INTO slide_decks (slug, title, description, status, sort_order)
VALUES (
  'the-educator-ai-engineer',
  'How to Be an AI Engineer in Today''s World as an Educator',
  'A 10-slide visual guide for educators: instant classroom AI wins, what AI engineers actually do, pedagogy-as-prompting, guardrails, salaries, and a 60-day roadmap. About 15 minutes.',
  'published',
  1
)
ON CONFLICT (slug) DO NOTHING;

DELETE FROM slides WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'the-educator-ai-engineer');

-- Slide 1: cover
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'How to Be an AI Engineer in Today''s World as an Educator', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-01.jpg","alt":"Cover visual: Educator Profile plus AI Builder Profile equals the modern AI engineer","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Pedagogical wisdom + workflow logic = the modern AI engineer."}]}]}$slide$::jsonb, 'Cover: educators bring domain expertise, instruction design, and evaluation logic; AI builders add agent orchestration, prompt engineering, and workflow chaining. Set the thesis for the whole deck.', 0
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 2: immediate wins
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Immediate Wins: What AI Can Do for Your Classroom This Week', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-02.jpg","alt":"Four classroom AI wins: instant rubrics, differentiated lesson plans, automated feedback, admin email drafting","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Four classroom wins you can ship this week: rubrics, lesson plans, feedback, and admin email."}]}]}$slide$::jsonb, 'Walk the four cards: instant rubric generation (standard-aligned, 2 hours to 2 minutes); differentiated lesson plans (one text at 5th, 8th, 10th grade levels); automated feedback and grading (structural issues to actionable feedback); admin email drafting (bullets to polished parent communication).', 1
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 3: myth vs reality
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'What an AI Engineer Actually Does (It''s Not Calculus)', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-03.jpg","alt":"Myth versus reality: crossed-out calculus and code against a prompt to Claude API to Google Docs workflow","title":null}},{"type":"paragraph","content":[{"type":"text","text":"The myth is calculus and raw syntax. The reality is logic, language, and chaining tools."}]}]}$slide$::jsonb, 'Myth: inventing algorithms, raw syntax from scratch, complex data science. Reality: architecting logic and language workflows (prompt to Claude API to Google Docs); chaining tools like n8n, Make, and Zapier; directing Cursor and Claude Code in plain English.', 2
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 4: fears vs realities
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Addressing the Doubts: Fears vs. Honest Realities', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-04.jpg","alt":"Diagnostic matrix mapping three fears to honest realities to engineering solutions","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Every fear has an honest reality — and an engineering solution."}]}]}$slide$::jsonb, 'Row by row: fake facts (models predict patterns, they do not know facts) is solved by grounding and RAG on a locked textbook. Essay bypassing (the recall era is ending) is solved by testing AI-assisted reasoning and critical evaluation of outputs. Screens replacing teachers (teachers are buried in admin) is solved by automating paperwork to maximize face-to-face time.', 3
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 5: how AI works
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'How AI Works (In Plain English)', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-05.jpg","alt":"Anatomy of an AI brain: tokens, pattern prediction, and context window","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Tokens, pattern prediction, context window — the whole mental model."}]}]}$slide$::jsonb, 'Three ideas only: tokens are chunks of words, the building blocks of language. Models are advanced autocomplete — most probable next token, as in the cat sat on the mat. The context window is short-term memory: how much fits before it forgets page one.', 4
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 6: unfair advantage
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Your Unfair Advantage: Pedagogy is Prompting', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-06.jpg","alt":"Venn diagram: technical mechanics plus educator superpowers equals the unfair advantage","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Grading an essay and evaluating an LLM take the exact same cognitive skill."}]}]}$slide$::jsonb, 'Left circle: prompt engineering, tool chaining, API integrations. Right circle: instruction scaffolding, clear grading rubrics, assessing student output. The punchline: domain experts who can clearly structure logic are the most successful AI builders.', 5
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 7: translation matrix
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'The Teacher''s AI Translation Matrix', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-07.jpg","alt":"AI to teaching translation matrix: system prompt, RAG, APIs, and custom agents","title":null}},{"type":"paragraph","content":[{"type":"text","text":"System prompt = syllabus. RAG = open-book test. APIs = hall pass. Agents = teaching assistants."}]}]}$slide$::jsonb, 'Translate each term: system prompt is the syllabus and rules (tone plus unbreakable rules). RAG is the open-book test (answers from your curriculum, not the open internet). APIs are the hall pass (OpenAI and Google Sheets passing information back and forth). Custom agents are specialized teaching assistants (narrow autonomous tasks).', 6
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 8: guardrails
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Responsible AI: Building Systems with Guardrails', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-08.jpg","alt":"AI core surrounded by student privacy, cost controls, and ethics guardrails","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Privacy, cost controls, and ethics around the AI core."}]}]}$slide$::jsonb, 'Three guardrails: student privacy (FERPA and COPPA compliance, enterprise APIs with zero-data-retention so inputs never train public models); cost controls (hard token limits and rate limits against runaway software costs); ethics and bias mitigation (human-in-the-loop approvals, auditing prompts to prevent structural bias in grading).', 7
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 9: talent war
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'The Global AI Talent War & Compensation Benchmarks', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-09.jpg","alt":"Compensation pyramid: frontier labs, US enterprise, and global remote including the Philippines","title":null}},{"type":"paragraph","content":[{"type":"text","text":"From frontier labs to PH remote — domain-plus-AI commands a 25–45% premium."}]}]}$slide$::jsonb, 'Top of the pyramid: frontier labs (OpenAI, Meta) with $100M–$300M+ retention packages for elite researchers. Middle: US Silicon Valley and enterprise at $140K–$350K+, where LLM and RAG engineers with domain expertise earn a 25–45% premium. Base: global remote and offshore (Philippines) at ₱50K–₱210K+ per month for AI automation specialists running n8n, Make, and Cursor.', 8
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 10: roadmap
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Your 60-Day Roadmap: From Educator to AI Builder', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-10.jpg","alt":"60-day roadmap: Consumer, Automator, Architect, Builder phases","title":null}},{"type":"paragraph","content":[{"type":"text","text":"Consumer to Automator to Architect to Builder in 60 days."}]}]}$slide$::jsonb, 'Days 1–15, the Consumer: advanced prompting with ChatGPT and Claude, automating emails and basic rubrics. Days 16–30, the Automator: first no-code chains in Make or Zapier, Google Form to automated AI email response. Days 31–45, the Architect: RAG concepts, a custom agent grounded strictly in curriculum data. Days 46–60, the Builder: Cursor or Claude Code, deploying a standalone app with plain-English instructions.', 9
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

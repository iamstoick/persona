-- Educator deck correction: slides must carry the PDF content exactly as printed.
-- Removes the paraphrased takeaway captions (slides are now the page image only),
-- restores the slide 7 title separator, and replaces speaker notes with verbatim
-- page transcripts. Deck description is the cover's own thesis line.
UPDATE slide_decks
SET description = 'Pedagogical Wisdom + Workflow Logic = The Modern AI Engineer.',
    updated_at = NOW()
WHERE slug = 'the-educator-ai-engineer';

DELETE FROM slides WHERE deck_id = (SELECT id FROM slide_decks WHERE slug = 'the-educator-ai-engineer');

-- Slide 1: cover
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'How to Be an AI Engineer in Today''s World as an Educator', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-01.jpg","alt":"Cover visual: Educator Profile plus AI Builder Profile equals the modern AI engineer","title":null}}]}$slide$::jsonb, 'Educator Profile: Domain Expertise (Curriculum & Subject); Clear Instruction Design (Scaffolding); Evaluation & Feedback Logic. AI Builder Profile: Agent Orchestration; Prompt Engineering (Instructions); Workflow Chaining. Pedagogical Wisdom + Workflow Logic = The Modern AI Engineer.', 0
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 2: immediate wins
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Immediate Wins: What AI Can Do for Your Classroom This Week', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-02.jpg","alt":"Four classroom AI wins: instant rubrics, differentiated lesson plans, automated feedback, admin email drafting","title":null}}]}$slide$::jsonb, 'Instant Rubric Generation: Instantly generate standard-aligned rubrics tailored to specific project requirements. (2 Hours to 2 Minutes.) Differentiated Lesson Plans: Adapt a single core text into multiple reading levels with one click. (Adjust to 5th Grade, 8th Grade, 10th Grade.) Automated Feedback & Grading: Surface structural writing issues and generate actionable feedback instantly. Admin Email Drafting: Turn bullet-point notes into polished parent communication and administrative reports.', 1
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 3: myth vs reality
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'What an AI Engineer Actually Does (It''s Not Calculus)', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-03.jpg","alt":"Myth versus reality: crossed-out calculus and code against a prompt to Claude API to Google Docs workflow","title":null}}]}$slide$::jsonb, 'The Myth: Inventing algorithms, writing raw syntax from scratch, complex data science. The Reality: Architecting logic and language workflows. Chaining tools (n8n, Make, Zapier). Directing AI coding assistants (Cursor, Claude Code) in plain English. (Natural Language Prompt to Claude API to Google Docs Integration.)', 2
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 4: fears vs realities
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Addressing the Doubts: Fears vs. Honest Realities', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-04.jpg","alt":"Diagnostic matrix mapping three fears to honest realities to engineering solutions","title":null}}]}$slide$::jsonb, 'Diagnostic Matrix. The Fear: The AI confidently makes up fake facts. The Honest Reality: Language models predict patterns; they don''t natively "know" facts. The Engineering Solution: Grounding and RAG (giving the AI a specific, locked textbook to read from). The Fear: Students will use AI to write essays and bypass learning. The Honest Reality: The era of evaluating pure recall is ending. The Engineering Solution: Shift curriculum to test "AI-assisted reasoning" and critical evaluation of model outputs. The Fear: Screens replace teachers. The Honest Reality: Teachers are currently buried in screen-based admin work. The Engineering Solution: Automate the paperwork to maximize face-to-face, empathetic human connection time.', 3
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 5: how AI works
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'How AI Works (In Plain English)', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-05.jpg","alt":"Anatomy of an AI brain: tokens, pattern prediction, and context window","title":null}}]}$slide$::jsonb, 'Anatomy of an AI Brain. Tokens: AI doesn''t read letters; it reads ''tokens'' (chunks of words). Think of them as the fundamental building blocks of language. Pattern Prediction: Models are highly advanced autocomplete engines. They calculate the most mathematically probable next token based on their training. (The cat sat on the… [mat].) Context Window: How much information the AI can hold in its short-term memory at once before it forgets page 1.', 4
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 6: unfair advantage
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Your Unfair Advantage: Pedagogy is Prompting', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-06.jpg","alt":"Venn diagram: technical mechanics plus educator superpowers equals the unfair advantage","title":null}}]}$slide$::jsonb, 'Workflow Canvas. Technical Mechanics: Prompt Engineering; Tool Chaining (Make, Zapier); API Integrations. Educator Superpowers: Instruction Scaffolding; Setting Clear Grading Rubrics; Assessing Student Output. The Unfair Advantage: Grading a student''s essay requires the exact same cognitive skill as evaluating a Large Language Model''s output for accuracy, logic, and tone. Domain experts who can clearly structure logic are the most successful AI builders.', 5
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 7: translation matrix
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'The Teacher''s AI | AI Translation Matrix', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-07.jpg","alt":"AI to teaching translation matrix: system prompt, RAG, APIs, and custom agents","title":null}}]}$slide$::jsonb, 'System Prompt to The Syllabus & Rules: The overarching instructions that tell the AI how to behave, what tone to use, and what rules it cannot break. RAG (Retrieval-Augmented Generation) to The Open-Book Test: Connecting the AI to a specific, trusted database (like your curriculum) so it answers based on your documents, not the open internet. APIs (Application Programming Interfaces) to The Hall Pass: The secure permission slip that allows different software tools (like OpenAi and Google Sheets) to pass information back and forth. Custom Agents to Specialized Teaching Assistants: AI models configured with specific tools to execute narrow, focused tasks autonomously.', 6
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 8: guardrails
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Responsible AI: Building Systems with Guardrails', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-08.jpg","alt":"AI core surrounded by student privacy, cost controls, and ethics guardrails","title":null}}]}$slide$::jsonb, 'AI Core. Student Privacy (Data Protection): FERPA & COPPA compliance. Utilizing enterprise APIs with zero-data-retention policies (ensuring your inputs are never used to train future public models). Cost Controls (Budget Routing): Setting hard token limits. Implementing rate limiting to prevent run-away software costs. Ethics & Bias Mitigation: Designing ''Human-in-the-loop'' approval workflows. Auditing system prompts to prevent structural bias in grading or feedback.', 7
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 9: talent war
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'The Global AI Talent War & Compensation Benchmarks', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-09.jpg","alt":"Compensation pyramid: frontier labs, US enterprise, and global remote including the Philippines","title":null}}]}$slide$::jsonb, 'The Frontier Labs (OpenAI / Meta): $100M–$300M+ retention packages. The elite researchers building the foundational models. (The outliers driving the global talent war). US Silicon Valley & Enterprise: $140K–$350K+ Total Compensation. LLM & RAG Engineers. Domain-plus-AI profiles (experts in education/finance who learn AI) command a 25–45% salary premium and are the hardest to commoditize. Global Remote & Offshore (e.g., Philippines): ₱50K–₱210K+ ($1,200–$2,500/mo) for AI Automation Specialists operating n8n, Make, and Cursor to build daily business workflows.', 8
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

-- Slide 10: roadmap
INSERT INTO slides (deck_id, title, content, notes, sort_order)
SELECT id, 'Your 60-Day Roadmap: From Educator to AI Builder', $slide${"type":"doc","content":[{"type":"image","attrs":{"src":"/images/educator/ai-engineer-educator-10.jpg","alt":"60-day roadmap: Consumer, Automator, Architect, Builder phases","title":null}}]}$slide$::jsonb, 'Days 1–15: The Consumer: Master advanced prompting using ChatGPT and Claude. Automate your daily personal school workflows (emails, basic rubrics). Days 16–30: The Automator: Build your first no-code chains using Make or Zapier. Connect a Google Form to an automated AI email response. Days 31–45: The Architect: Learn basic RAG (Retrieval-Augmented Generation) concepts. Build a custom AI agent grounded strictly in your specific curriculum data. Days 46–60: The Builder: Leverage AI coding assistants like Cursor or Claude Code. Deploy a standalone web app or internal tool using plain English instructions.', 9
FROM slide_decks WHERE slug = 'the-educator-ai-engineer';

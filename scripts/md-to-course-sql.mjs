#!/usr/bin/env node
// md-to-course-sql.mjs — Convert a course Markdown source file into an idempotent
// seed SQL file for courses → course_phases → course_lessons.
//
// Source conventions (see .agents/skills/course-creator/SKILL.md):
//   - YAML frontmatter: suggested_title, meta_description, suggested_slug
//   - "## Phase N: Title" starts a phase; plain-text lines before the first
//     lesson become the phase description
//   - "### Day N: Title" starts a lesson, followed by:
//       <!-- lesson: day=N minutes=M summary="..." -->
//   - Content before the first phase is prepended to lesson 1 (course intro);
//     trailing "## ..." sections after the last lesson are appended to it.
//   - Lesson body blocks: ### / #### headings, paragraphs, fenced code,
//     "- " / "1. " flat lists, "> " quotes, <details> asides, :::tabs panels.
//   - Inline: **bold**, *italic*, `code`, [text](url).
//
// Usage:
//   node scripts/md-to-course-sql.mjs content/my-course.md > content/my-course.sql
//
// Only language/runtime feature used: node >= 18, no dependencies.

import { readFileSync } from 'node:fs';

const srcPath = process.argv[2];
if (!srcPath) {
  console.error('usage: node scripts/md-to-course-sql.mjs <course.md> > <course.sql>');
  process.exit(1);
}
const fail = (msg) => {
  console.error(`error: ${msg}`);
  process.exit(1);
};

// ---------------------------------------------------------------- frontmatter

const raw = readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n');
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
if (!fmMatch) fail('missing YAML frontmatter (--- block at top of file)');
const frontmatter = {};
for (const line of fmMatch[1].split('\n')) {
  const m = line.match(/^(\w+):\s*(?:"([^"]*)"|(.*))$/);
  if (m) frontmatter[m[1]] = (m[2] ?? m[3] ?? '').trim();
}
const slug = frontmatter.suggested_slug;
const title = frontmatter.suggested_title;
const description = frontmatter.meta_description;
if (!slug || !title || !description) {
  fail('frontmatter must define suggested_slug, suggested_title, meta_description');
}
const body = raw.slice(fmMatch[0].length);

// ------------------------------------------------------------- inline parser

const CODEMASK = '\u0000';
// Split text into segments, then apply one regex-based mark to unmarked runs.
function splitSegments(segments, regex, makeMark) {
  const out = [];
  for (const seg of segments) {
    if (seg.done) {
      out.push(seg);
      continue;
    }
    let rest = seg.text;
    let m;
    // fresh regex per segment (regexes passed in have /g)
    regex.lastIndex = 0;
    let lastIndex = 0;
    const parts = [];
    while ((m = regex.exec(rest)) !== null) {
      if (m.index > lastIndex) parts.push({ text: rest.slice(lastIndex, m.index), marks: [...seg.marks] });
      parts.push(makeMark(m, seg.marks));
      lastIndex = m.index + m[0].length;
      if (m[0].length === 0) break;
    }
    if (lastIndex < rest.length) parts.push({ text: rest.slice(lastIndex), marks: [...seg.marks] });
    out.push(...(parts.length ? parts : [seg]));
  }
  return out;
}

function parseInline(text) {
  const codes = [];
  const masked = text.replace(/(`+)([^`]*?)\1/g, (_m, _t, inner) => {
    codes.push(inner);
    return `${CODEMASK}${codes.length - 1}${CODEMASK}`;
  });
  let segs = [{ text: masked, marks: [], done: false }];
  segs = splitSegments(segs, /\[([^\]]+)\]\(([^)\s]+)\)/g, (m, marks) => ({
    text: m[1],
    marks: [...marks, { type: 'link', attrs: { href: m[2] } }],
  }));
  segs = splitSegments(segs, /\*\*([^*\n]+?)\*\*/g, (m, marks) => ({ text: m[1], marks: [...marks, { type: 'bold' }] }));
  segs = splitSegments(segs, /(?<!\*)\*([^*\n]+?)\*(?!\*)/g, (m, marks) => ({ text: m[1], marks: [...marks, { type: 'italic' }] }));
  // Restore code spans, merging outer marks (e.g. bold `code`).
  const nodes = [];
  for (const seg of segs) {
    const parts = seg.text.split(new RegExp(`${CODEMASK}(\\d+)${CODEMASK}`, 'g'));
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        const codeText = codes[Number(parts[i])] ?? '';
        nodes.push({ type: 'text', text: codeText, ...(seg.marks.length || true ? { marks: [...seg.marks, { type: 'code' }] } : {}) });
      } else if (parts[i] !== '') {
        nodes.push({ type: 'text', text: parts[i], ...(seg.marks.length ? { marks: seg.marks } : {}) });
      }
    }
  }
  return nodes.filter((n) => n.text !== '');
}

// -------------------------------------------------------------- block parser

function fenceInfo(line) {
  const m = line.match(/^```(\S*)\s*$/);
  if (!m) return null;
  const [language = '', label = ''] = m[1].split('|');
  return { language: language || null, label: label || null };
}

function codeBlockNode(language, text) {
  return {
    type: 'codeBlock',
    ...(language ? { attrs: { language } } : {}),
    content: [{ type: 'text', text }],
  };
}

function isBlockStart(line) {
  return (
    /^#{1,4}\s/.test(line) ||
    /^```/.test(line) ||
    /^:::tabs\s*$/.test(line) ||
    /^<\/details>\s*$/.test(line) ||
    /^<details>\s*$/.test(line) ||
    /^>\s?/.test(line) ||
    /^-\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^---\s*$/.test(line) ||
    /^<!--/.test(line)
  );
}

function parseBlocks(lines, ctx) {
  const nodes = [];
  let i = 0;
  const guard = (cond, msg) => {
    if (!cond) fail(`${ctx}: ${msg} (near line: ${(lines[i] ?? '').slice(0, 80)})`);
  };
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }
    if (/^<!--/.test(line)) {
      while (i < lines.length && !/-->/.test(lines[i])) i++;
      i++;
      continue;
    }
    if (/^(  |\t)+(-|\d+\.)\s/.test(line)) fail(`${ctx}: nested lists are not supported (flatten the list): ${line.trim().slice(0, 60)}`);
    let m;
    if ((m = line.match(/^####\s+(.+)$/))) {
      nodes.push({ type: 'heading', attrs: { level: 4 }, content: parseInline(m[1]) });
      i++;
      continue;
    }
    if ((m = line.match(/^###\s+(.+)$/))) {
      nodes.push({ type: 'heading', attrs: { level: 3 }, content: parseInline(m[1]) });
      i++;
      continue;
    }
    if ((m = line.match(/^##\s+(.+)$/))) {
      nodes.push({ type: 'heading', attrs: { level: 2 }, content: parseInline(m[1]) });
      i++;
      continue;
    }
    if (/^---\s*$/.test(line)) {
      nodes.push({ type: 'horizontalRule' });
      i++;
      continue;
    }
    const fence = fenceInfo(line);
    if (fence) {
      const code = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      guard(i < lines.length, 'unterminated fenced code block');
      i++;
      nodes.push(codeBlockNode(fence.language, code.join('\n')));
      continue;
    }
    if (/^:::tabs\s*$/.test(line)) {
      const tabs = [];
      i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
        if (/^\s*$/.test(lines[i])) {
          i++;
          continue;
        }
        const f = fenceInfo(lines[i]);
        guard(f, 'expected a fenced code block inside :::tabs');
        const code = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
        guard(i < lines.length, 'unterminated fenced code block inside :::tabs');
        i++;
        const label = f.label || (f.language ? f.language[0].toUpperCase() + f.language.slice(1) : 'Code');
        tabs.push({
          type: 'codeTab',
          attrs: { label, ...(f.language ? { language: f.language } : {}) },
          content: [codeBlockNode(f.language, code.join('\n'))],
        });
      }
      guard(i < lines.length, 'unterminated :::tabs block (missing closing :::)');
      guard(tabs.length > 0, 'empty :::tabs block');
      i++;
      nodes.push({ type: 'codeTabs', content: tabs });
      continue;
    }
    if (/^<details>\s*$/.test(line)) {
      i++;
      while (i < lines.length && /^\s*$/.test(lines[i])) i++;
      const sm = (lines[i] ?? '').match(/^<summary>(.+)<\/summary>\s*$/);
      guard(sm, 'expected <summary>...</summary> as first line of <details>');
      i++;
      const inner = [];
      while (i < lines.length && !/^<\/details>\s*$/.test(lines[i])) inner.push(lines[i++]);
      guard(i < lines.length, 'unterminated <details> block (missing </details>)');
      i++;
      const innerNodes = parseBlocks(inner, `${ctx} > details`);
      guard(innerNodes.length > 0, '<details> must contain at least one block');
      nodes.push({
        type: 'details',
        attrs: { open: false },
        content: [{ type: 'detailsSummary', content: parseInline(sm[1]) }, ...innerNodes],
      });
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      const text = quote.join(' ').trim();
      guard(text !== '', 'empty blockquote');
      nodes.push({ type: 'blockquote', content: [{ type: 'paragraph', content: parseInline(text) }] });
      continue;
    }
    if (/^-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        const inline = parseInline(lines[i++].replace(/^-\s+/, ''));
        guard(inline.length > 0, 'empty list item');
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: inline }] });
      }
      nodes.push({ type: 'bulletList', content: items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const inline = parseInline(lines[i++].replace(/^\d+\.\s+/, ''));
        guard(inline.length > 0, 'empty list item');
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: inline }] });
      }
      nodes.push({ type: 'orderedList', content: items });
      continue;
    }
    // Plain paragraph: gather consecutive normal lines.
    const para = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i])) para.push(lines[i++]);
    const inline = parseInline(para.join(' ').trim());
    guard(inline.length > 0, 'empty paragraph');
    nodes.push({ type: 'paragraph', content: inline });
  }
  return nodes;
}

// ------------------------------------------------------------ course splitter

const introLines = [];
const trailingLines = [];
const phases = [];
let curPhase = null;
let curLesson = null;
let target = introLines;

let inFence = false;
let inDetails = false;
for (const line of body.split('\n')) {
  if (/^```/.test(line)) inFence = !inFence;
  if (/^<details>\s*$/.test(line)) inDetails = true;
  if (/^<\/details>\s*$/.test(line)) inDetails = false;
  const opaque = inFence || inDetails;
  let m;
  if (!opaque && (m = line.match(/^## Phase (\d+):\s*(.+)$/))) {
    curPhase = { num: Number(m[1]), title: m[2].trim(), descLines: [], lessons: [] };
    phases.push(curPhase);
    curLesson = null;
    target = curPhase.descLines;
    continue;
  }
  if (!opaque && (m = line.match(/^### Day (\d+):\s*(.+)$/))) {
    if (!curPhase) fail(`lesson outside any phase: ${line.slice(0, 60)}`);
    curLesson = { day: Number(m[1]), title: m[2].trim(), lines: [], meta: null };
    curPhase.lessons.push(curLesson);
    target = curLesson.lines;
    continue;
  }
  if (!opaque && /^##\s+/.test(line)) {
    if (curPhase) {
      // A level-2 section after lessons started (e.g. closing) belongs to trailing.
      curLesson = null;
      target = trailingLines;
    }
    target.push(line);
    continue;
  }
  if (!opaque && /^#\s+/.test(line)) {
    if (curPhase || phases.length > 0) fail(`unexpected H1 inside course body: ${line.slice(0, 60)}`);
    continue; // course H1: frontmatter already holds it
  }
  target.push(line);
}

if (phases.length === 0) fail('no phases found (expected "## Phase N: Title" headings)');
const lessons = phases.flatMap((p) => p.lessons.map((l) => ({ ...l, phase: p })));
if (lessons.length === 0) fail('no lessons found (expected "### Day N: Title" headings)');

for (const lesson of lessons) {
  const metaLine = lesson.lines.find((l) => /<!--\s*lesson:/.test(l));
  if (!metaLine) fail(`Day ${lesson.day} "${lesson.title}" is missing its <!-- lesson: ... --> meta comment`);
  const day = metaLine.match(/day=(\d+)/);
  const minutes = metaLine.match(/minutes=(\d+)/);
  const summary = metaLine.match(/summary="([^"]*)"/);
  if (!day || !minutes || !summary) fail(`Day ${lesson.day}: malformed lesson meta comment: ${metaLine.trim()}`);
  if (Number(day[1]) !== lesson.day) fail(`Day ${lesson.day}: meta day=${day[1]} does not match heading`);
  lesson.minutes = Number(minutes[1]);
  lesson.summary = summary[1];
  if (lesson.minutes < 1) fail(`Day ${lesson.day}: minutes must be >= 1`);
  if (!lesson.summary) fail(`Day ${lesson.day}: summary must not be empty`);
}
const days = lessons.map((l) => l.day);
if (new Set(days).size !== days.length) fail('duplicate day_number values');
if (days.some((d) => d < 1)) fail('day_number values must be positive integers');

// ------------------------------------------------------------------- convert

function blocksToText(nodes) {
  // Plain-text extraction for TEXT columns (descriptions render unformatted).
  const texts = [];
  const walk = (node) => {
    if (node.type === 'text') {
      texts.push(node.text);
      return;
    }
    for (const child of node.content || []) {
      if (child.type === 'listItem') {
        const before = texts.length;
        walk(child);
        if (texts.length > before) texts[texts.length - 1] += '\n';
      } else {
        walk(child);
      }
    }
    if (['paragraph', 'heading'].includes(node.type)) texts.push('\n\n');
  };
  for (const n of nodes) walk(n);
  return texts.join('').replace(/\n{3,}/g, '\n\n').trim();
}

const INTRO_NOTE = 'course intro (prepended to first lesson)';
const introBlocks = parseBlocks(introLines, INTRO_NOTE);
const trailingBlocks = parseBlocks(trailingLines, 'course closing (appended to last lesson)');

const ALLOWED = new Set([
  'doc',
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'details',
  'detailsSummary',
  'codeTabs',
  'codeTab',
  'text',
]);
function validateNode(node, where) {
  if (!ALLOWED.has(node.type)) fail(`${where}: unsupported node type "${node.type}"`);
  if (node.type === 'details') {
    const [first, ...rest] = node.content || [];
    if (!first || first.type !== 'detailsSummary' || rest.length === 0) {
      fail(`${where}: <details> must hold a summary plus at least one block`);
    }
  }
  if (node.type === 'codeTab') {
    const c = node.content || [];
    if (c.length !== 1 || c[0].type !== 'codeBlock') fail(`${where}: codeTab must wrap exactly one codeBlock`);
  }
  for (const child of node.content || []) validateNode(child, where);
}

lessons.forEach((lesson, idx) => {
  let blocks = parseBlocks(lesson.lines, `Day ${lesson.day}`);
  if (idx === 0) blocks = [...introBlocks, ...blocks];
  if (idx === lessons.length - 1) blocks = [...blocks, ...trailingBlocks];
  if (blocks.length === 0) fail(`Day ${lesson.day}: lesson has no content blocks`);
  lesson.doc = { type: 'doc', content: blocks };
  validateNode(lesson.doc, `Day ${lesson.day}`);
  JSON.parse(JSON.stringify(lesson.doc)); // round-trip sanity
});

const phaseTexts = phases.map((p) => {
  const text = blocksToText(parseBlocks(p.descLines, `Phase ${p.num} description`));
  if (!text) fail(`Phase ${p.num} "${p.title}" has no description text`);
  return text;
});

// ---------------------------------------------------------------------- emit

const sql = (s) => `'${s.replace(/'/g, "''")}'`;
const out = [];
out.push(`-- Import: "${title.replace(/"/g, "'")}"`);
out.push(`-- Generated from ${srcPath} by scripts/md-to-course-sql.mjs — do not hand-edit; re-run the script.`);
out.push(`-- Idempotent: safe to re-run (upserts the course by slug, replaces its phases/lessons).`);
out.push(`-- Creates the course as DRAFT; publish it from the admin panel.`);
out.push(`-- Run against the dev DB once the stack is up:`);
out.push(`--   docker compose -f docker-compose.dev.yml exec -T postgres \\`);
out.push(`--     psql -U gv_user -d gv_db -f - < ${srcPath.replace(/\.md$/, '.sql')}`);
out.push(`BEGIN;`);
out.push(``);
out.push(`INSERT INTO courses (slug, title, description, status, sort_order)`);
out.push(`VALUES (${sql(slug)}, ${sql(title)}, ${sql(description)}, 'draft', 0)`);
out.push(`ON CONFLICT (slug) DO UPDATE SET`);
out.push(`  title = EXCLUDED.title,`);
out.push(`  description = EXCLUDED.description,`);
out.push(`  updated_at = NOW();`);
out.push(``);
out.push(`DELETE FROM course_phases WHERE course_id = (SELECT id FROM courses WHERE slug = ${sql(slug)});`);
out.push(``);
phases.forEach((p, pi) => {
  out.push(`-- Phase ${p.num}: ${p.title.replace(/--/g, '—')}`);
  out.push(`INSERT INTO course_phases (course_id, title, description, sort_order)`);
  out.push(`SELECT id, ${sql(p.title)}, ${sql(phaseTexts[pi])}, ${pi} FROM courses WHERE slug = ${sql(slug)};`);
  out.push(``);
});
let order = 0;
lessons.forEach((lesson) => {
  const json = JSON.stringify(lesson.doc);
  if (json.includes('$lesson$')) fail(`Day ${lesson.day}: content collides with SQL dollar-quote tag (impossible input, refusing)`);
  const phaseOrder = phases.indexOf(lesson.phase);
  out.push(`-- Day ${lesson.day}: ${lesson.title.replace(/--/g, '—')}`);
  out.push(`INSERT INTO course_lessons (phase_id, day_number, title, duration_minutes, summary, content, sort_order)`);
  out.push(
    `SELECT p.id, ${lesson.day}, ${sql(lesson.title)}, ${lesson.minutes}, ${sql(lesson.summary)}, $lesson$${json}$lesson$::jsonb, ${order}` +
      ` FROM course_phases p JOIN courses c ON c.id = p.course_id WHERE c.slug = ${sql(slug)} AND p.sort_order = ${phaseOrder};`
  );
  out.push(``);
  order++;
});
out.push(`COMMIT;`);
console.log(out.join('\n'));
console.error(`ok: ${phases.length} phases, ${lessons.length} lessons, days ${Math.min(...days)}-${Math.max(...days)}`);

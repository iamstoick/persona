#!/usr/bin/env node
// md-to-post-sql.mjs — Convert a blog-post Markdown source file into an idempotent
// seed SQL file for posts (+ categories/tags links).
//
// Source conventions:
//   - YAML frontmatter: suggested_title, meta_description, tags (["a", "b"]),
//     suggested_slug, suggested_category
//   - Body blocks: ## / ### / #### headings, paragraphs, fenced code,
//     "- " / "1. " flat lists, "> " quotes, <details> asides, :::tabs panels,
//     and standalone ![alt](src) images.
//   - Inline: **bold**, *italic*, `code`, [text](url).
//
// Usage:
//   node scripts/md-to-post-sql.mjs content/my-post.md > content/my-post.sql
//
// Only language/runtime feature used: node >= 18, no dependencies.

import { readFileSync } from 'node:fs';

const srcPath = process.argv[2];
if (!srcPath) {
  console.error('usage: node scripts/md-to-post-sql.mjs <post.md> > <post.sql>');
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
const metaDescription = frontmatter.meta_description;
const category = frontmatter.suggested_category;
if (!slug || !title || !metaDescription || !category) {
  fail('frontmatter must define suggested_slug, suggested_title, meta_description, suggested_category');
}
const tags = [...(frontmatter.tags || '').matchAll(/"([^"]+)"/g)].map((m) => m[1]);
if (tags.length === 0) fail('frontmatter must define a non-empty tags: ["a", "b"] list');
const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const tagSlugs = tags.map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
const body = raw.slice(fmMatch[0].length);

// ------------------------------------------------------------- inline parser

const CODEMASK = '\u0000';
function splitSegments(segments, regex, makeMark) {
  const out = [];
  for (const seg of segments) {
    if (seg.done) {
      out.push(seg);
      continue;
    }
    const rest = seg.text;
    regex.lastIndex = 0;
    let lastIndex = 0;
    const parts = [];
    let m;
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
  const nodes = [];
  for (const seg of segs) {
    const parts = seg.text.split(new RegExp(`${CODEMASK}(\\d+)${CODEMASK}`, 'g'));
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        nodes.push({ type: 'text', text: codes[Number(parts[i])] ?? '', marks: [...seg.marks, { type: 'code' }] });
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
    /^!\[.*\]\(.*\)\s*$/.test(line) ||
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
    if (/^#\s+/.test(line)) fail(`${ctx}: unexpected H1 (post title comes from frontmatter): ${line.slice(0, 60)}`);
    if (/^---\s*$/.test(line)) {
      nodes.push({ type: 'horizontalRule' });
      i++;
      continue;
    }
    if ((m = line.match(/^!\[(.*)\]\((.*)\)\s*$/))) {
      guard(m[2].trim() !== '', 'image with empty src');
      nodes.push({ type: 'image', attrs: { src: m[2].trim(), alt: m[1].trim(), title: null } });
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
    const para = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i])) para.push(lines[i++]);
    const inline = parseInline(para.join(' ').trim());
    guard(inline.length > 0, 'empty paragraph');
    nodes.push({ type: 'paragraph', content: inline });
  }
  return nodes;
}

// ------------------------------------------------------------------- convert

// Drop leading blanks and the H1 title line (frontmatter owns it), then parse.
const bodyLines = body.split('\n');
while (bodyLines.length && /^\s*$/.test(bodyLines[0])) bodyLines.shift();
if (bodyLines.length && /^#\s+/.test(bodyLines[0])) {
  bodyLines.shift();
  if (bodyLines.length && /^\s*$/.test(bodyLines[0])) bodyLines.shift();
}
const blocks = parseBlocks(bodyLines, 'post');
if (blocks.length === 0) fail('post has no content blocks');

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
  'image',
  'text',
]);
let imageCount = 0;
function validateNode(node) {
  if (!ALLOWED.has(node.type)) fail(`unsupported node type "${node.type}"`);
  if (node.type === 'details') {
    const [first, ...rest] = node.content || [];
    if (!first || first.type !== 'detailsSummary' || rest.length === 0) fail('<details> must hold a summary plus at least one block');
  }
  if (node.type === 'codeTab') {
    const c = node.content || [];
    if (c.length !== 1 || c[0].type !== 'codeBlock') fail('codeTab must wrap exactly one codeBlock');
  }
  if (node.type === 'image') {
    imageCount++;
    if (!node.attrs?.src) fail('image node with empty src');
  }
  for (const child of node.content || []) validateNode(child);
}
const doc = { type: 'doc', content: blocks };
validateNode(doc);
JSON.parse(JSON.stringify(doc)); // round-trip sanity

// Excerpt: first paragraph's plain text, cut at a word boundary under 300 chars.
function blocksToText(nodes) {
  const texts = [];
  const walk = (node) => {
    if (node.type === 'text') {
      texts.push(node.text);
      return;
    }
    for (const child of node.content || []) walk(child);
    if (['paragraph', 'heading'].includes(node.type)) texts.push('\n\n');
  };
  for (const n of nodes) walk(n);
  return texts.join('').replace(/\n{3,}/g, '\n\n').trim();
}
const firstPara = blocks.find((b) => b.type === 'paragraph');
if (!firstPara) fail('no paragraph found for excerpt');
let excerpt = blocksToText([firstPara]);
if (excerpt.length > 300) excerpt = excerpt.slice(0, 297).replace(/\s+\S*$/, '') + '…';

// ---------------------------------------------------------------------- emit

const sql = (s) => `'${s.replace(/'/g, "''")}'`;
const json = JSON.stringify(doc);
if (json.includes('$post$')) fail('content collides with SQL dollar-quote tag (impossible input, refusing)');
const out = [];
out.push(`-- Import: "${title.replace(/"/g, "'")}"`);
out.push(`-- Generated from ${srcPath} by scripts/md-to-post-sql.mjs — do not hand-edit; re-run the script.`);
out.push(`-- Idempotent: safe to re-run (upserts the post by slug, replaces its category/tags).`);
out.push(`-- Creates the post as DRAFT; publish it from the admin panel.`);
out.push(`-- Upload to the server and run against the prod DB:`);
out.push(`--   docker compose -f docker-compose.prod.yml exec -T postgres \\`);
out.push(`--     sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < /tmp/${srcPath.split('/').pop().replace(/\.md$/, '.sql')}`);
out.push(`BEGIN;`);
out.push(``);
out.push(`INSERT INTO posts (type, status, slug, title, excerpt, content, meta_title, meta_description, author_id, published_at)`);
out.push(`VALUES (`);
out.push(`  'post',`);
out.push(`  'draft',`);
out.push(`  ${sql(slug)},`);
out.push(`  ${sql(title)},`);
out.push(`  ${sql(excerpt)},`);
out.push(`  $post$${json}$post$::jsonb,`);
out.push(`  ${sql(title)},`);
out.push(`  ${sql(metaDescription)},`);
out.push(`  (SELECT id FROM users WHERE email = 'gerald@geraldvillorente.com'),`);
out.push(`  NULL`);
out.push(`)`);
out.push(`ON CONFLICT (slug) DO UPDATE SET`);
out.push(`  title = EXCLUDED.title,`);
out.push(`  excerpt = EXCLUDED.excerpt,`);
out.push(`  content = EXCLUDED.content,`);
out.push(`  meta_title = EXCLUDED.meta_title,`);
out.push(`  meta_description = EXCLUDED.meta_description,`);
out.push(`  author_id = COALESCE(EXCLUDED.author_id, posts.author_id),`);
out.push(`  updated_at = NOW();`);
out.push(``);
out.push(`DELETE FROM post_categories WHERE post_id = (SELECT id FROM posts WHERE slug = ${sql(slug)});`);
out.push(`INSERT INTO categories (name, slug) VALUES (${sql(category)}, ${sql(categorySlug)})`);
out.push(`ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;`);
out.push(`INSERT INTO post_categories (post_id, category_id)`);
out.push(`SELECT p.id, c.id FROM posts p, categories c`);
out.push(`WHERE p.slug = ${sql(slug)} AND c.slug = ${sql(categorySlug)}`);
out.push(`ON CONFLICT DO NOTHING;`);
out.push(``);
out.push(`DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = ${sql(slug)});`);
out.push(`INSERT INTO tags (name, slug) VALUES`);
out.push(tags.map((t, i) => `  (${sql(t)}, ${sql(tagSlugs[i])})`).join(',\n'));
out.push(`ON CONFLICT (slug) DO NOTHING;`);
out.push(`INSERT INTO post_tags (post_id, tag_id)`);
out.push(`SELECT p.id, t.id FROM posts p, tags t`);
out.push(`WHERE p.slug = ${sql(slug)} AND t.slug IN (${tagSlugs.map((s) => sql(s)).join(', ')})`);
out.push(`ON CONFLICT DO NOTHING;`);
out.push(``);
out.push(`COMMIT;`);
console.log(out.join('\n'));
console.error(`ok: post "${slug}" (${blocks.length} blocks, ${imageCount} images, ${tags.length} tags)`);

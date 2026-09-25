-- Speaker notes become Tiptap JSON (same format as slide content) so admins can
-- use paragraphs, bullet lists, and inline marks. Existing plain-text notes are
-- wrapped as a single paragraph with identical text; NULLs stay NULL.
ALTER TABLE slides ALTER COLUMN notes TYPE JSONB USING (
  CASE WHEN notes IS NULL THEN NULL::jsonb
  ELSE jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', notes)
        )
      )
    )
  ) END
);

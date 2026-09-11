CREATE TABLE IF NOT EXISTS media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  filename    VARCHAR(500) NOT NULL,
  url         TEXT        NOT NULL,
  mime_type   VARCHAR(127),
  size_bytes  INTEGER,
  alt_text    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_uploader ON media(uploader_id);

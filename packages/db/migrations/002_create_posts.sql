CREATE TABLE IF NOT EXISTS posts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type                VARCHAR(20) NOT NULL CHECK (type IN ('post', 'page')),
  status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published', 'archived')),
  slug                VARCHAR(500) UNIQUE NOT NULL,
  title               VARCHAR(500) NOT NULL,
  excerpt             TEXT,
  content             JSONB,
  featured_image_url  TEXT,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  author_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  meta_title          VARCHAR(500),
  meta_description    TEXT,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_slug   ON posts(slug);
CREATE INDEX idx_posts_type   ON posts(type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_author ON posts(author_id);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

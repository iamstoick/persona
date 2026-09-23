CREATE TABLE IF NOT EXISTS slide_decks (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(255) UNIQUE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER slide_decks_updated_at
  BEFORE UPDATE ON slide_decks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS slides (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id     UUID         NOT NULL REFERENCES slide_decks(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  content     JSONB,
  notes       TEXT,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slides_deck ON slides(deck_id);

CREATE TRIGGER slides_updated_at
  BEFORE UPDATE ON slides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS menus (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id   UUID        NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  post_id   UUID        REFERENCES posts(id) ON DELETE SET NULL,
  label     VARCHAR(255) NOT NULL,
  url       TEXT,
  target    VARCHAR(20) NOT NULL DEFAULT '_self',
  "order"   INTEGER     NOT NULL DEFAULT 0,
  parent_id UUID        REFERENCES menu_items(id) ON DELETE SET NULL
);

CREATE INDEX idx_menu_items_menu   ON menu_items(menu_id);
CREATE INDEX idx_menu_items_parent ON menu_items(parent_id);

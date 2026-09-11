CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id    VARCHAR(255) UNIQUE NOT NULL,
  email        VARCHAR(320) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  avatar_url   TEXT,
  role         VARCHAR(50)  NOT NULL DEFAULT 'subscriber'
                CHECK (role IN ('subscriber', 'editor', 'admin')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

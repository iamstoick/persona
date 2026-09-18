CREATE TABLE IF NOT EXISTS course_feedback (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating          INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  missing_topics  TEXT,
  improvements    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, user_id)
);

CREATE INDEX idx_course_feedback_course ON course_feedback(course_id);

CREATE TRIGGER course_feedback_updated_at
  BEFORE UPDATE ON course_feedback
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

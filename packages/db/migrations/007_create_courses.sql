CREATE TABLE IF NOT EXISTS courses (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(255) UNIQUE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS course_phases (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_phases_course ON course_phases(course_id);

CREATE TRIGGER course_phases_updated_at
  BEFORE UPDATE ON course_phases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS course_lessons (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id          UUID         NOT NULL REFERENCES course_phases(id) ON DELETE CASCADE,
  day_number        INT          NOT NULL,
  title             VARCHAR(255) NOT NULL,
  duration_minutes  INT          NOT NULL DEFAULT 60,
  summary           TEXT,
  content           JSONB,
  sort_order        INT          NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_lessons_phase ON course_lessons(phase_id);

CREATE TRIGGER course_lessons_updated_at
  BEFORE UPDATE ON course_lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS course_progress (
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id     UUID        NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

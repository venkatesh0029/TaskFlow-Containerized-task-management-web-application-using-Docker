-- TaskFlow relational schema (PostgreSQL-compatible)
-- Run this file to create a local database schema for the app
-- Adjust types or engine-specific syntax if using MySQL/SQLite

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(120),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CATEGORIES (user-scoped)
CREATE TABLE IF NOT EXISTS categories (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(80) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_unique_per_user UNIQUE (user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- TASKS
-- status: todo | in_progress | done
-- priority: low | medium | high | urgent
CREATE TABLE IF NOT EXISTS tasks (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(160) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  priority        VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- TASK <-> CATEGORY (many-to-many)
CREATE TABLE IF NOT EXISTS task_categories (
  task_id         BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  category_id     BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, category_id)
);

-- Helpful view: task counts per status for a user
CREATE OR REPLACE VIEW user_task_status_counts AS
SELECT
  t.user_id,
  t.status,
  COUNT(*) AS task_count
FROM tasks t
GROUP BY t.user_id, t.status;

-- Seed (optional). Uncomment and adjust as needed.
-- INSERT INTO users (email, password_hash, name) VALUES
-- ('demo@example.com', '$2b$10$hash_goes_here', 'Demo');
-- INSERT INTO categories (user_id, name) VALUES
-- (1, 'Work'), (1, 'Personal');
-- INSERT INTO tasks (user_id, title, description, status, priority)
-- VALUES (1, 'Try TaskFlow', 'Explore features', 'in_progress', 'high');



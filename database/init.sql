-- PostgreSQL initialization script for Docker
-- This runs automatically when the database container starts for the first time

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL DEFAULT 1,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  category VARCHAR(80),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Seed default user
INSERT INTO users (email, password_hash, name)
VALUES ('demo@example.com', 'demo', 'Demo User')
ON CONFLICT (email) DO NOTHING;

-- Seed sample tasks
INSERT INTO tasks (user_id, title, description, status, priority, category, due_date)
VALUES
  (1, 'Write project brief', 'Outline scope and deliverables', 'in_progress', 'high', 'Work', NOW() + INTERVAL '2 days'),
  (1, 'Team stand-up', 'Daily sync', 'todo', 'medium', 'Work', NOW() + INTERVAL '1 day'),
  (1, 'Refactor auth flow', 'Cleanup login logic', 'todo', 'low', 'Tech Debt', NULL),
  (1, 'Plan sprint', 'Select backlog items', 'todo', 'high', 'Planning', NOW() + INTERVAL '3 days'),
  (1, 'Pay utilities', 'Electricity and internet', 'todo', 'medium', 'Personal', NOW() - INTERVAL '1 day'),
  (1, 'Release v1.0.1', 'Patch hotfix', 'completed', 'urgent', 'Release', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;


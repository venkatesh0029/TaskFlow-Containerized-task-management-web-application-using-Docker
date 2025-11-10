-- Seed demo data for TaskFlow (PostgreSQL)
-- Assumes schema from database/schema.sql is already applied.

-- Create a demo user
INSERT INTO users (email, password_hash, name)
VALUES ('demo@example.com', '$2b$10$demo_hash_replace', 'Demo User')
ON CONFLICT (email) DO NOTHING;

-- Get the demo user's id
WITH u AS (
  SELECT id FROM users WHERE email = 'demo@example.com'
)
-- Create categories
INSERT INTO categories (user_id, name)
SELECT u.id, c
FROM u, (VALUES ('Work'), ('Personal'), ('Errands')) AS t(c)
ON CONFLICT DO NOTHING;

-- Insert tasks
WITH u AS (
  SELECT id FROM users WHERE email = 'demo@example.com'
)
INSERT INTO tasks (user_id, title, description, status, priority, due_date)
SELECT u.id, t.title, t.description, t.status, t.priority, t.due_date
FROM u,
(
  VALUES
  ('Prepare project brief', 'Outline goals, scope, timeline', 'in_progress', 'high', CURRENT_DATE + INTERVAL '3 days'),
  ('Team stand-up', 'Daily sync on progress', 'todo', 'medium', CURRENT_DATE + INTERVAL '1 day'),
  ('Code review', 'Review PR #42', 'todo', 'low', NULL),
  ('Deploy hotfix', 'Patch production issue', 'completed', 'urgent', CURRENT_DATE - INTERVAL '1 day')
) AS t(title, description, status, priority, due_date);



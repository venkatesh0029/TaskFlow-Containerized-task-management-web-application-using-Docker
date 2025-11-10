# How to Check Stored Data in TaskFlow

This guide explains multiple ways to access and view the data stored in the TaskFlow database.

## Method 1: Using Docker Exec (Recommended)

### Connect to PostgreSQL Container

```bash
# Connect to the database container
docker-compose exec database psql -U taskflow -d taskflow
```

### Useful SQL Commands

Once connected, you can run SQL queries:

```sql
-- View all tasks
SELECT * FROM tasks ORDER BY created_at DESC;

-- View all users
SELECT * FROM users;

-- View all categories
SELECT * FROM categories;

-- Count tasks by status
SELECT status, COUNT(*) as count FROM tasks GROUP BY status;

-- View tasks with user information
SELECT t.id, t.title, t.status, t.priority, t.category, t.due_date, u.name as user_name
FROM tasks t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- View overdue tasks
SELECT * FROM tasks 
WHERE due_date < NOW() 
AND status != 'completed'
ORDER BY due_date;

-- View completed tasks percentage
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as completion_percentage
FROM tasks;

-- Exit psql
\q
```

## Method 2: Using API Endpoints

### Get All Tasks

```bash
# Using curl
curl http://localhost:4000/api/tasks

# Using PowerShell
Invoke-RestMethod -Uri http://localhost:4000/api/tasks -Method Get
```

### Get Specific Task

```bash
# Replace :id with actual task ID
curl http://localhost:4000/api/tasks/1
```

### Get Categories

```bash
curl http://localhost:4000/api/categories
```

## Method 3: Using Database Client Tools

### pgAdmin (GUI Tool)

1. **Install pgAdmin** from https://www.pgadmin.org/download/

2. **Add Server Connection:**
   - Host: `localhost`
   - Port: `5433`
   - Database: `taskflow`
   - Username: `taskflow`
   - Password: `taskflow123`

3. **Browse Data:**
   - Navigate to: Servers → PostgreSQL 15 → Databases → taskflow → Schemas → public → Tables
   - Right-click on `tasks` → View/Edit Data → All Rows

### DBeaver (Universal Database Tool)

1. **Install DBeaver** from https://dbeaver.io/download/

2. **Create New Connection:**
   - Database: PostgreSQL
   - Host: `localhost`
   - Port: `5433`
   - Database: `taskflow`
   - Username: `taskflow`
   - Password: `taskflow123`

3. **Query Data:**
   - Right-click on connection → SQL Editor → New SQL Script
   - Write queries and execute

### VS Code Extension

1. **Install PostgreSQL Extension** in VS Code

2. **Add Connection:**
   - Host: `localhost`
   - Port: `5433`
   - Database: `taskflow`
   - Username: `taskflow`
   - Password: `taskflow123`

## Method 4: Using Command Line (One-liners)

### Quick Data Check

```bash
# View all tasks
docker-compose exec database psql -U taskflow -d taskflow -c "SELECT id, title, status, priority FROM tasks;"

# Count tasks
docker-compose exec database psql -U taskflow -d taskflow -c "SELECT COUNT(*) FROM tasks;"

# View tasks with details
docker-compose exec database psql -U taskflow -d taskflow -c "SELECT * FROM tasks ORDER BY created_at DESC LIMIT 10;"

# View analytics summary
docker-compose exec database psql -U taskflow -d taskflow -c "
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status != 'completed') as in_progress,
  COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue
FROM tasks;"
```

## Method 5: Export Data to CSV

### Export Tasks to CSV

```bash
docker-compose exec database psql -U taskflow -d taskflow -c "
COPY (SELECT * FROM tasks) TO STDOUT WITH CSV HEADER;" > tasks_export.csv
```

### Export with Custom Format

```bash
docker-compose exec database psql -U taskflow -d taskflow -c "
COPY (
  SELECT 
    id,
    title,
    status,
    priority,
    category,
    due_date,
    created_at
  FROM tasks
  ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;" > tasks_export.csv
```

## Method 6: Check Database Size and Stats

```bash
# Connect to database
docker-compose exec database psql -U taskflow -d taskflow

# Then run:
```

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('taskflow'));

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Row counts
SELECT 
  'tasks' as table_name, COUNT(*) as row_count FROM tasks
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories;

-- Index information
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Method 7: View Database Logs

```bash
# View database container logs
docker-compose logs database

# Follow logs in real-time
docker-compose logs -f database

# View last 100 lines
docker-compose logs --tail=100 database
```

## Method 8: Backup and Inspect

### Create Backup

```bash
# Backup entire database
docker-compose exec database pg_dump -U taskflow taskflow > backup.sql

# Backup specific table
docker-compose exec database pg_dump -U taskflow -t tasks taskflow > tasks_backup.sql
```

### Restore from Backup

```bash
# Restore database
docker-compose exec -T database psql -U taskflow taskflow < backup.sql
```

## Quick Reference: Common Queries

```sql
-- All tasks with formatted dates
SELECT 
  id,
  title,
  status,
  priority,
  category,
  TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
FROM tasks
ORDER BY created_at DESC;

-- Tasks by priority
SELECT priority, COUNT(*) as count
FROM tasks
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- Tasks by category
SELECT category, COUNT(*) as count
FROM tasks
WHERE category IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- Recent activity (last 24 hours)
SELECT * FROM tasks
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## Troubleshooting

### Can't Connect to Database

1. **Check if container is running:**
   ```bash
   docker-compose ps
   ```

2. **Check database logs:**
   ```bash
   docker-compose logs database
   ```

3. **Verify port is correct:**
   - Container port: 5432
   - Host port: 5433 (as configured in docker-compose.yml)

### Connection Refused

- Ensure containers are running: `docker-compose up -d`
- Check firewall settings
- Verify port 5433 is not blocked

### Permission Denied

- Verify username: `taskflow`
- Verify password: `taskflow123`
- Verify database name: `taskflow`

---

**Note:** For local SQLite development (when DATABASE_URL is not set), the database file is located at `backend/taskflow.db` and can be opened with any SQLite browser tool.


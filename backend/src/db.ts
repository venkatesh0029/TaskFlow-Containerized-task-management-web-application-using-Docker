import { Pool } from 'pg';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
let db: any = null;
let pool: Pool | null = null;
let usePostgres = false;

if (databaseUrl) {
  // Use PostgreSQL when DATABASE_URL is set (for Docker containers)
  usePostgres = true;
  pool = new Pool({ connectionString: databaseUrl });
  console.log('[db] Using PostgreSQL database');
} else {
  // Use SQLite for local development
  const dbPath = path.join(__dirname, '..', 'taskflow.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  console.log('[db] Using SQLite database');
}

// Initialize schema for SQLite
function initSQLiteSchema() {
  if (!db) return;

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT,
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
  `);

  // Seed data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    db.prepare(`
      INSERT INTO users (email, password_hash, name)
      VALUES (?, ?, ?)
    `).run('demo@example.com', 'demo', 'Demo User');
  }

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
  if (taskCount.count === 0) {
    const now = Date.now();
    const addDays = (d: number) => new Date(now + d * 86400000).toISOString();
    const insert = db.prepare(`
      INSERT INTO tasks (user_id, title, description, status, priority, category, due_date)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `);
    const samples: Array<[string, string | null, string, string, string | null, string | null]> = [
      ['Write project brief', 'Outline scope and deliverables', 'in_progress', 'high', 'Work', addDays(2)],
      ['Team stand-up', 'Daily sync', 'todo', 'medium', 'Work', addDays(1)],
      ['Refactor auth flow', 'Cleanup login logic', 'todo', 'low', 'Tech Debt', null],
      ['Plan sprint', 'Select backlog items', 'todo', 'high', 'Planning', addDays(3)],
      ['Pay utilities', 'Electricity and internet', 'todo', 'medium', 'Personal', addDays(-1)],
      ['Release v1.0.1', 'Patch hotfix', 'completed', 'urgent', 'Release', addDays(-2)],
    ];
    const tx = db.transaction(() => {
      for (const s of samples) insert.run(...s);
    });
    tx();
  }
}

// Initialize schema for PostgreSQL
async function initPostgresSchema() {
  if (!pool) return;

  try {
    const client = await pool.connect();
    try {
      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(120),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Tasks table
      await client.query(`
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
        )
      `);

      // Categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL DEFAULT 1,
          name VARCHAR(80) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, name)
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
      `);

      // Seed data
      const userResult = await client.query('SELECT COUNT(*) as count FROM users');
      if (parseInt(userResult.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO users (email, password_hash, name)
          VALUES ($1, $2, $3)
        `, ['demo@example.com', 'demo', 'Demo User']);
      }

      const taskResult = await client.query('SELECT COUNT(*) as count FROM tasks');
      if (parseInt(taskResult.rows[0].count) === 0) {
        const now = Date.now();
        const addDays = (d: number) => new Date(now + d * 86400000).toISOString();
        const samples = [
          ['Write project brief', 'Outline scope and deliverables', 'in_progress', 'high', 'Work', addDays(2)],
          ['Team stand-up', 'Daily sync', 'todo', 'medium', 'Work', addDays(1)],
          ['Refactor auth flow', 'Cleanup login logic', 'todo', 'low', 'Tech Debt', null],
          ['Plan sprint', 'Select backlog items', 'todo', 'high', 'Planning', addDays(3)],
          ['Pay utilities', 'Electricity and internet', 'todo', 'medium', 'Personal', addDays(-1)],
          ['Release v1.0.1', 'Patch hotfix', 'completed', 'urgent', 'Release', addDays(-2)],
        ];
        for (const [title, description, status, priority, category, due_date] of samples) {
          await client.query(`
            INSERT INTO tasks (user_id, title, description, status, priority, category, due_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [1, title, description, status, priority, category, due_date]);
        }
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[db] Error initializing PostgreSQL schema:', error);
  }
}

// Initialize schema based on database type
if (usePostgres) {
  initPostgresSchema().catch(console.error);
} else {
  initSQLiteSchema();
}

// Query helper that works with both SQLite and PostgreSQL
export async function query<T = unknown>(
  sql: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  if (usePostgres && pool) {
    // PostgreSQL query
    const client = await pool.connect();
    try {
      // Handle RETURNING clause for INSERT/UPDATE
      if (sql.includes('RETURNING *')) {
        const result = await client.query(sql, params);
        return { rows: result.rows as T[] };
      }
      
      // Regular queries
      const result = await client.query(sql, params);
      return { rows: result.rows as T[] };
    } finally {
      client.release();
    }
  } else {
    // SQLite query
    if (!db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      try {
        let sqliteSql = sql;
        const sqliteParams: any[] = [];
        
        if (params) {
          sqliteSql = sql.replace(/\$(\d+)/g, (match, num) => {
            const idx = parseInt(num, 10) - 1;
            if (params[idx] !== undefined) {
              sqliteParams.push(params[idx]);
            }
            return '?';
          });
        }

        if (sqliteSql.includes('RETURNING *')) {
          sqliteSql = sqliteSql.replace(/RETURNING \*/g, '');
          
          if (sqliteSql.trim().toUpperCase().startsWith('INSERT')) {
            const stmt = db.prepare(sqliteSql);
            const result = stmt.run(...sqliteParams);
            const rows = db.prepare('SELECT * FROM tasks WHERE id = ?').all(result.lastInsertRowid) as T[];
            return resolve({ rows });
          }
          
          if (sqliteSql.trim().toUpperCase().startsWith('UPDATE')) {
            const stmt = db.prepare(sqliteSql);
            stmt.run(...sqliteParams);
            const idMatch = sql.match(/WHERE id = \$(\d+)/);
            if (idMatch) {
              const idIdx = parseInt(idMatch[1], 10) - 1;
              const id = params?.[idIdx];
              if (id) {
                const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
                const table = tableMatch?.[1] || 'tasks';
                const rows = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).all(id) as T[];
                return resolve({ rows });
              }
            }
            return resolve({ rows: [] });
          }
        }

        const stmt = db.prepare(sqliteSql);
        if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
          const rows = stmt.all(...sqliteParams) as T[];
          return resolve({ rows });
        }

        stmt.run(...sqliteParams);
        resolve({ rows: [] });
      } catch (error) {
        console.error('[db] Query error:', error);
        console.error('[db] SQL:', sql);
        reject(error);
      }
    });
  }
}

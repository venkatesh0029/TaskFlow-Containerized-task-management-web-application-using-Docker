import { Router, Request, Response } from 'express';
import { query } from './db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = Number(req.query.userId || 1);
  const { rows } = await query(
    `SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  res.json(rows);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = Number(req.body.userId || 1);
  const { title, description, status, priority, due_date, category } = req.body;
  const { rows } = await query(
    `INSERT INTO tasks (user_id, title, description, status, priority, due_date, category)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [userId, title, description ?? null, status ?? 'todo', priority ?? 'medium', due_date ?? null, category ?? null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const fields = ['title','description','status','priority','due_date','category','completed_at'] as const;
  const updates: string[] = [];
  const values: any[] = [];
  fields.forEach((f) => {
    if (f in req.body) {
      updates.push(`${f} = $${updates.length + 1}`);
      values.push((req.body as any)[f]);
    }
  });
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  // Always update updated_at (works for both PostgreSQL and SQLite)
  const nowFunc = process.env.DATABASE_URL ? 'NOW()' : "datetime('now')";
  updates.push(`updated_at = ${nowFunc}`);
  values.push(id);
  const { rows } = await query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
  res.json(rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await query('DELETE FROM tasks WHERE id = $1', [id]);
  res.status(204).end();
});

export default router;



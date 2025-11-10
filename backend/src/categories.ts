import { Router, Request, Response } from 'express';
import { query } from './db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = Number(req.query.userId || 1);
  const { rows } = await query('SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC', [userId]);
  res.json(rows);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = Number(req.body.userId || 1);
  const { name } = req.body;
  const { rows } = await query('INSERT INTO categories (user_id, name) VALUES ($1,$2) RETURNING *', [userId, name]);
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await query('DELETE FROM categories WHERE id = $1', [id]);
  res.status(204).end();
});

export default router;



import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tasksRouter from './tasks';
import categoriesRouter from './categories';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:8080',
    credentials: false,
  })
);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/tasks', tasksRouter);
app.use('/api/categories', categoriesRouter);

app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});



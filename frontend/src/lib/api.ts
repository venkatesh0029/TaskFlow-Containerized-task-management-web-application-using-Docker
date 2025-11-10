export async function healthcheck(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

// Tasks REST helpers (SQL backend)
export type ApiTask = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  category?: string | null;
};

export async function getTasks(): Promise<ApiTask[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) throw new Error('Failed to load tasks');
  return await res.json();
}

export async function createTask(payload: Partial<ApiTask>): Promise<ApiTask> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, userId: 1 }),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return await res.json();
}

export async function updateTask(id: number, payload: Partial<ApiTask>): Promise<ApiTask> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return await res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
}

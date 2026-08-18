import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// ── GET /tasks ───────────────────────────────────────────────────
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    const { data, error } = await query;
    if (error) throw error;

    sendSuccess(res, { tasks: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── GET /tasks/:id ───────────────────────────────────────────────
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) {
      sendError(res, 'Task not found', 404);
      return;
    }

    sendSuccess(res, { task: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── POST /tasks ──────────────────────────────────────────────────
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId, title, description, dueDate, priority, section, completed, reminderDate } = req.body;

    const payload: Record<string, any> = {
      user_id: userId,
      title: title || 'Untitled Task',
      description: description || null,
      due_date: dueDate || new Date().toISOString().split('T')[0],
      priority: priority || 'Medium',
      section: section || 'Today',
      completed: completed || false,
      reminder_date: reminderDate || null,
    };

    if (id) payload.id = id;

    const { data, error } = await supabase.from('tasks').upsert(payload).select().single();
    if (error) throw error;

    sendSuccess(res, { task: data }, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── PUT /tasks/:id ───────────────────────────────────────────────
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    const fieldMap: Record<string, string> = {
      title: 'title', description: 'description', dueDate: 'due_date',
      priority: 'priority', section: 'section', completed: 'completed',
      reminderDate: 'reminder_date',
    };

    for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
      if (req.body[bodyKey] !== undefined) {
        updates[dbKey] = req.body[bodyKey];
      }
    }

    if (Object.keys(updates).length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;

    sendSuccess(res, { task: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── DELETE /tasks/:id ────────────────────────────────────────────
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;

    sendSuccess(res, { message: 'Task deleted' });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

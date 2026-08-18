import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// ── GET /bills ───────────────────────────────────────────────────
export const getBills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('bills').select('*').order('due_date', { ascending: true });

    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    const { data, error } = await query;
    if (error) throw error;

    sendSuccess(res, { bills: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── GET /bills/:id ───────────────────────────────────────────────
export const getBillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('bills').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) {
      sendError(res, 'Bill not found', 404);
      return;
    }

    sendSuccess(res, { bill: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── POST /bills ──────────────────────────────────────────────────
export const createBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId, title, amount, dueDate, recurring, status, category, icon } = req.body;

    const payload: Record<string, any> = {
      user_id: userId,
      title: title || 'Untitled Bill',
      amount: parseFloat(amount) || 0,
      due_date: dueDate || new Date().toISOString().split('T')[0],
      recurring: recurring || false,
      status: status || 'Pending',
    };

    if (id) payload.id = id;
    if (category) payload.category = category;
    if (icon) payload.icon = icon;

    const { data, error } = await supabase.from('bills').upsert(payload).select().single();
    if (error) throw error;

    sendSuccess(res, { bill: data }, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── PUT /bills/:id ───────────────────────────────────────────────
export const updateBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    const fieldMap: Record<string, string> = {
      title: 'title', amount: 'amount', dueDate: 'due_date',
      recurring: 'recurring', status: 'status', category: 'category', icon: 'icon',
    };

    for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
      if (req.body[bodyKey] !== undefined) {
        updates[dbKey] = bodyKey === 'amount' ? parseFloat(req.body[bodyKey]) : req.body[bodyKey];
      }
    }

    if (Object.keys(updates).length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    const { data, error } = await supabase.from('bills').update(updates).eq('id', id).select().single();
    if (error) throw error;

    sendSuccess(res, { bill: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── DELETE /bills/:id ────────────────────────────────────────────
export const deleteBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) throw error;

    sendSuccess(res, { message: 'Bill deleted' });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

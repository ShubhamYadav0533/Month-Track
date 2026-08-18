import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// ── GET /recurring ───────────────────────────────────────────────
export const getRecurring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('recurring_transactions').select('*').order('next_due_date', { ascending: true });

    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    const { data, error } = await query;
    if (error) throw error;

    sendSuccess(res, { recurring: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── GET /recurring/:id ───────────────────────────────────────────
export const getRecurringById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('recurring_transactions').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) {
      sendError(res, 'Recurring transaction not found', 404);
      return;
    }

    sendSuccess(res, { recurring: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── POST /recurring ──────────────────────────────────────────────
export const createRecurring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId, title, amount, category, frequency, nextDueDate, autoDeduct } = req.body;

    const payload: Record<string, any> = {
      user_id: userId,
      title: title || 'Recurring Transaction',
      amount: parseFloat(amount) || 0,
      category: category || 'Bills',
      frequency: frequency || 'monthly',
      next_due_date: nextDueDate || new Date().toISOString().split('T')[0],
      auto_deduct: autoDeduct ?? true,
    };

    if (id) payload.id = id;

    const { data, error } = await supabase.from('recurring_transactions').upsert(payload).select().single();
    if (error) throw error;

    sendSuccess(res, { recurring: data }, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── PUT /recurring/:id ───────────────────────────────────────────
export const updateRecurring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    const fieldMap: Record<string, string> = {
      title: 'title', amount: 'amount', category: 'category',
      frequency: 'frequency', nextDueDate: 'next_due_date', autoDeduct: 'auto_deduct',
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

    const { data, error } = await supabase.from('recurring_transactions').update(updates).eq('id', id).select().single();
    if (error) throw error;

    sendSuccess(res, { recurring: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── DELETE /recurring/:id ────────────────────────────────────────
export const deleteRecurring = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
    if (error) throw error;

    sendSuccess(res, { message: 'Recurring transaction deleted' });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

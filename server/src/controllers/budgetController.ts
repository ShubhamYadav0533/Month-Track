import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// ── GET /budgets ─────────────────────────────────────────────────
export const getBudgets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('budgets').select('*');

    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    const { data, error } = await query;
    if (error) throw error;

    sendSuccess(res, { budgets: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── GET /budgets/:id ─────────────────────────────────────────────
export const getBudgetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('budgets').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) {
      sendError(res, 'Budget not found', 404);
      return;
    }

    sendSuccess(res, { budget: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── POST /budgets ────────────────────────────────────────────────
export const createBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId, category, monthlyLimit } = req.body;

    const payload: Record<string, any> = {
      user_id: userId,
      category: category || 'Others',
      monthly_limit: parseFloat(monthlyLimit) || 0,
    };

    if (id) payload.id = id;

    const { data, error } = await supabase.from('budgets').upsert(payload).select().single();
    if (error) throw error;

    sendSuccess(res, { budget: data }, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── PUT /budgets/:id ─────────────────────────────────────────────
export const updateBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.monthlyLimit !== undefined) updates.monthly_limit = parseFloat(req.body.monthlyLimit);

    if (Object.keys(updates).length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    const { data, error } = await supabase.from('budgets').update(updates).eq('id', id).select().single();
    if (error) throw error;

    sendSuccess(res, { budget: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── DELETE /budgets/:id ──────────────────────────────────────────
export const deleteBudget = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;

    sendSuccess(res, { message: 'Budget deleted' });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

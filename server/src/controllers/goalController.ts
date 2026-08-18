import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// ── GET /goals ───────────────────────────────────────────────────
export const getGoals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('savings_goals').select('*');

    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    const { data, error } = await query;
    if (error) throw error;

    sendSuccess(res, { goals: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── GET /goals/:id ───────────────────────────────────────────────
export const getGoalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('savings_goals').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) {
      sendError(res, 'Goal not found', 404);
      return;
    }

    sendSuccess(res, { goal: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── POST /goals ──────────────────────────────────────────────────
export const createGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId, title, targetAmount, savedAmount, targetDate, icon } = req.body;

    const payload: Record<string, any> = {
      user_id: userId,
      title: title || 'Savings Goal',
      target_amount: parseFloat(targetAmount) || 0,
      saved_amount: parseFloat(savedAmount) || 0,
      target_date: targetDate || null,
      icon: icon || 'target',
    };

    if (id) payload.id = id;

    const { data, error } = await supabase.from('savings_goals').upsert(payload).select().single();
    if (error) throw error;

    sendSuccess(res, { goal: data }, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── PUT /goals/:id ───────────────────────────────────────────────
export const updateGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    const fieldMap: Record<string, string> = {
      title: 'title', targetAmount: 'target_amount', savedAmount: 'saved_amount',
      targetDate: 'target_date', icon: 'icon',
    };

    for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
      if (req.body[bodyKey] !== undefined) {
        updates[dbKey] = (bodyKey === 'targetAmount' || bodyKey === 'savedAmount')
          ? parseFloat(req.body[bodyKey])
          : req.body[bodyKey];
      }
    }

    // Support addAmount — increment saved_amount
    if (req.body.addAmount !== undefined) {
      const { data: existing } = await supabase
        .from('savings_goals').select('saved_amount').eq('id', id).maybeSingle();
      if (existing) {
        updates.saved_amount = (existing.saved_amount || 0) + parseFloat(req.body.addAmount);
      }
    }

    if (Object.keys(updates).length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    const { data, error } = await supabase.from('savings_goals').update(updates).eq('id', id).select().single();
    if (error) throw error;

    sendSuccess(res, { goal: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── DELETE /goals/:id ────────────────────────────────────────────
export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) throw error;

    sendSuccess(res, { message: 'Savings goal deleted' });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// ── GET /accounts ────────────────────────────────────────────────
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('accounts').select('*');

    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    const { data, error } = await query;
    if (error) throw error;

    sendSuccess(res, { accounts: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── GET /accounts/:id ────────────────────────────────────────────
export const getAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) {
      sendError(res, 'Account not found', 404);
      return;
    }

    sendSuccess(res, { account: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── POST /accounts ───────────────────────────────────────────────
export const createOrUpdateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId, name, type, balance, creditLimit } = req.body;

    const payload: Record<string, any> = {
      user_id: userId,
      name: name || 'Account',
      type: type || 'wallet',
      balance: parseFloat(balance) || 0,
      credit_limit: parseFloat(creditLimit) || 0,
    };

    if (id) payload.id = id;

    const { data, error } = await supabase.from('accounts').upsert(payload).select().single();
    if (error) throw error;

    sendSuccess(res, { account: data }, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── PUT /accounts/:id ────────────────────────────────────────────
export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.type !== undefined) updates.type = req.body.type;
    if (req.body.balance !== undefined) updates.balance = parseFloat(req.body.balance);
    if (req.body.creditLimit !== undefined) updates.credit_limit = parseFloat(req.body.creditLimit);

    if (Object.keys(updates).length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    const { data, error } = await supabase.from('accounts').update(updates).eq('id', id).select().single();
    if (error) throw error;

    sendSuccess(res, { account: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── DELETE /accounts/:id ─────────────────────────────────────────
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;

    sendSuccess(res, { message: 'Account deleted' });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

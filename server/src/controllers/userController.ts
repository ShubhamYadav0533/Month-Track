import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

// ── POST /user/setup ─────────────────────────────────────────────
export const setupUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, monthlyIncome, salaryDate, savingsGoal, currency, walletBal, bankBal, upiBal, cardLimit } = req.body;
    const userEmail = email || `user_${Date.now()}@smartfinance.app`;

    // 1. Upsert User
    const { data: user, error: userErr } = await supabase
      .from('users')
      .upsert({
        name: name || 'User',
        email: userEmail,
        monthly_income: parseFloat(monthlyIncome) || 40000,
        salary_date: parseInt(salaryDate, 10) || 1,
        savings_goal: parseFloat(savingsGoal) || 10000,
        currency: currency || '₹',
      }, { onConflict: 'email' })
      .select()
      .single();

    if (userErr) throw userErr;

    // 2. Create default Accounts
    const defaultAccounts = [
      { user_id: user.id, name: 'Wallet Cash', type: 'wallet', balance: parseFloat(walletBal) || 2000 },
      { user_id: user.id, name: 'Bank Balance', type: 'bank', balance: parseFloat(bankBal) || 8000 },
      { user_id: user.id, name: 'UPI Balance', type: 'upi', balance: parseFloat(upiBal) || 1500 },
      { user_id: user.id, name: 'Credit Card', type: 'card', balance: 0, credit_limit: parseFloat(cardLimit) || 50000 },
    ];

    await supabase.from('accounts').delete().eq('user_id', user.id);
    const { data: accounts, error: accErr } = await supabase
      .from('accounts')
      .insert(defaultAccounts)
      .select();

    if (accErr) throw accErr;

    sendSuccess(res, { user, accounts }, 201);
  } catch (error: any) {
    console.error('[UserController] Setup error:', error);
    sendError(res, error.message);
  }
};

// ── GET /user/:userId ────────────────────────────────────────────
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { data: user, error } = await supabase
      .from('users')
      .select('*, accounts(*), transactions(*), budgets(*), savings_goals(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, { user });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── PUT /user/:userId ────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const updates: Record<string, any> = {};

    const fieldMap: Record<string, string> = {
      name: 'name', email: 'email', monthlyIncome: 'monthly_income',
      salaryDate: 'salary_date', savingsGoal: 'savings_goal', currency: 'currency',
    };

    for (const [bodyKey, dbKey] of Object.entries(fieldMap)) {
      if (req.body[bodyKey] !== undefined) {
        if (bodyKey === 'monthlyIncome' || bodyKey === 'savingsGoal') {
          updates[dbKey] = parseFloat(req.body[bodyKey]);
        } else if (bodyKey === 'salaryDate') {
          updates[dbKey] = parseInt(req.body[bodyKey], 10);
        } else {
          updates[dbKey] = req.body[bodyKey];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
    if (error) throw error;

    sendSuccess(res, { user: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

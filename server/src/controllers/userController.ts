import { Request, Response } from 'express';
import { supabase } from '../config/db';

export const setupUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, monthlyIncome, salaryDate, savingsGoal, currency, walletBal, bankBal, upiBal, cardLimit } = req.body;
    const userEmail = email || `user_${Date.now()}@smartfinance.app`;

    // 1. Upsert User in Supabase DB
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

    // 2. Insert Accounts in Supabase DB
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

    res.json({
      success: true,
      user,
      accounts,
    });
  } catch (error: any) {
    console.error('Supabase Setup User Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { data: user, error } = await supabase
      .from('users')
      .select('*, accounts(*), transactions(*), budgets(*), savings_goals(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

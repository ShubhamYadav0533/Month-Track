import { Request, Response } from 'express';
import { supabase } from '../config/db';

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('transactions').select('*').order('transaction_date', { ascending: false });

    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    const { data: expenses, error } = await query;
    if (error) throw error;

    res.json({ success: true, expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, accountId, amount, category, title, description, paymentMethod, location, receiptUrl, transactionDate, expenseDate } = req.body;
    const numAmount = parseFloat(amount);
    const dateStr = transactionDate || expenseDate || new Date().toISOString().split('T')[0];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Find or fallback to a valid user_id
    let validUserId = userId && uuidRegex.test(userId) ? userId : null;
    if (!validUserId) {
      const { data: latestUser } = await supabase.from('users').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();
      validUserId = latestUser?.id || '00000000-0000-4000-a000-000000000001';
    }

    // Ensure user exists
    await supabase.from('users').upsert({
      id: validUserId,
      name: 'User',
      email: `${validUserId}@smartfinance.app`,
      monthly_income: 0,
      salary_date: 1,
      savings_goal: 0,
      currency: '₹',
    });

    // Find or fallback to a valid account_id
    let validAccountId = accountId && uuidRegex.test(accountId) ? accountId : null;
    if (!validAccountId) {
      const { data: latestAcc } = await supabase.from('accounts').select('id').eq('user_id', validUserId).limit(1).maybeSingle();
      validAccountId = latestAcc?.id || '00000000-0000-4000-a000-000000000012';
    }

    // Ensure account exists
    await supabase.from('accounts').upsert({
      id: validAccountId,
      user_id: validUserId,
      name: 'Default Account',
      type: 'upi',
      balance: 0,
      credit_limit: 0,
    });

    const { data: expense, error } = await supabase
      .from('transactions')
      .upsert({
        user_id: validUserId,
        account_id: validAccountId,
        amount: numAmount,
        title: title || description || category,
        type: 'Expense',
        category: category || 'Others',
        payment_method: paymentMethod || 'UPI',
        location,
        attachment: receiptUrl,
        transaction_date: dateStr,
      })
      .select()
      .single();

    if (error) throw error;

    // Deduct amount from Account balance in Supabase
    if (validAccountId) {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', validAccountId).maybeSingle();
      if (acc) {
        await supabase
          .from('accounts')
          .update({ balance: Math.max(0, acc.balance - numAmount) })
          .eq('id', validAccountId);
      }
    }

    res.json({ success: true, expense });
  } catch (error: any) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data: exp } = await supabase.from('transactions').select('account_id, amount').eq('id', id).maybeSingle();

    if (exp && exp.account_id) {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', exp.account_id).maybeSingle();
      if (acc) {
        await supabase
          .from('accounts')
          .update({ balance: acc.balance + exp.amount })
          .eq('id', exp.account_id);
      }
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteMultipleExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.json({ success: true, message: 'No IDs provided' });
      return;
    }
    const { error } = await supabase.from('transactions').delete().in('id', ids);
    if (error) throw error;

    res.json({ success: true, message: `${ids.length} transactions deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

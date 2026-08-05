import { Request, Response } from 'express';
import { supabase } from '../config/db';

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('expenses').select('*').order('expense_date', { ascending: false });

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
    const { userId, accountId, amount, category, description, paymentMethod, location, receiptUrl, expenseDate } = req.body;
    const numAmount = parseFloat(amount);

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        account_id: accountId,
        amount: numAmount,
        category,
        description: description || category,
        payment_method: paymentMethod,
        location,
        receipt_url: receiptUrl,
        expense_date: expenseDate || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    // Deduct amount from Account balance in Supabase
    if (accountId) {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', accountId).single();
      if (acc) {
        await supabase
          .from('accounts')
          .update({ balance: Math.max(0, acc.balance - numAmount) })
          .eq('id', accountId);
      }
    }

    res.json({ success: true, expense });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data: exp } = await supabase.from('expenses').select('account_id, amount').eq('id', id).single();

    if (exp && exp.account_id) {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', exp.account_id).single();
      if (acc) {
        await supabase
          .from('accounts')
          .update({ balance: acc.balance + exp.amount })
          .eq('id', exp.account_id);
      }
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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

    const { data: expense, error } = await supabase
      .from('transactions')
      .upsert({
        user_id: userId,
        account_id: accountId,
        amount: numAmount,
        title: title || description || category,
        type: 'Expense',
        category,
        payment_method: paymentMethod || 'UPI',
        location,
        attachment: receiptUrl,
        transaction_date: dateStr,
      })
      .select()
      .single();

    if (error) throw error;

    // Deduct amount from Account balance in Supabase
    if (accountId) {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', accountId).maybeSingle();
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

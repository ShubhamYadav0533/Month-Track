import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_USER_ID = '00000000-0000-4000-a000-000000000001';
const DEFAULT_ACCOUNT_ID = '00000000-0000-4000-a000-000000000012';

// ── GET /transactions ────────────────────────────────────────────
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    let query = supabase.from('transactions').select('*').order('transaction_date', { ascending: false });

    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    const { data, error } = await query;
    if (error) throw error;

    sendSuccess(res, { transactions: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── GET /transactions/:id ────────────────────────────────────────
export const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('transactions').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) {
      sendError(res, 'Transaction not found', 404);
      return;
    }

    sendSuccess(res, { transaction: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── POST /transactions ───────────────────────────────────────────
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      id: txId, userId, accountId, amount, title, description,
      type, category, subCategory, paymentMethod,
      location, receiptUrl, attachment, transactionDate, expenseDate,
      recurring, notes,
    } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      sendError(res, 'Invalid amount', 400);
      return;
    }

    const dateStr = transactionDate || expenseDate || new Date().toISOString().split('T')[0];
    const txType = type || 'Expense';

    // Resolve valid user ID
    let validUserId = userId && UUID_REGEX.test(userId) ? userId : null;
    if (!validUserId) {
      const { data: latestUser } = await supabase
        .from('users').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();
      validUserId = latestUser?.id || DEFAULT_USER_ID;
    }

    // Ensure user exists
    await supabase.from('users').upsert({
      id: validUserId,
      name: 'User',
      email: `${validUserId}@smartfinance.app`,
      monthly_income: 0, salary_date: 1, savings_goal: 0, currency: '₹',
    });

    // Resolve valid account ID
    let validAccountId = accountId && UUID_REGEX.test(accountId) ? accountId : null;
    if (!validAccountId) {
      const { data: latestAcc } = await supabase
        .from('accounts').select('id').eq('user_id', validUserId).limit(1).maybeSingle();
      validAccountId = latestAcc?.id || DEFAULT_ACCOUNT_ID;
    }

    // Ensure account exists
    await supabase.from('accounts').upsert({
      id: validAccountId,
      user_id: validUserId,
      name: 'Default Account',
      type: 'upi', balance: 0, credit_limit: 0,
    });

    // Build upsert payload
    const payload: Record<string, any> = {
      user_id: validUserId,
      account_id: validAccountId,
      amount: numAmount,
      title: title || description || category || 'Transaction',
      type: txType,
      category: category || 'Others',
      sub_category: subCategory || null,
      payment_method: paymentMethod || 'UPI',
      transaction_date: dateStr,
      recurring: recurring || false,
      notes: notes || null,
      attachment: attachment || receiptUrl || null,
      location: location || null,
    };

    // If a valid UUID id is provided, include it for upsert
    if (txId && UUID_REGEX.test(txId)) {
      payload.id = txId;
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;

    // Update account balance
    if (validAccountId) {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', validAccountId).maybeSingle();
      if (acc) {
        const newBalance = txType === 'Income' || txType === 'Borrow'
          ? acc.balance + numAmount
          : Math.max(0, acc.balance - numAmount);
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', validAccountId);
      }
    }

    sendSuccess(res, { transaction }, 201);
  } catch (error: any) {
    console.error('[TransactionController] Create error:', error);
    sendError(res, error.message);
  }
};

// ── PUT /transactions/:id ────────────────────────────────────────
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: Record<string, any> = {};

    // Map camelCase request body to snake_case DB columns
    const fieldMap: Record<string, string> = {
      title: 'title', amount: 'amount', type: 'type',
      category: 'category', subCategory: 'sub_category',
      paymentMethod: 'payment_method', transactionDate: 'transaction_date',
      recurring: 'recurring', notes: 'notes', attachment: 'attachment',
      location: 'location',
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

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    sendSuccess(res, { transaction: data });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── DELETE /transactions/:id ─────────────────────────────────────
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Restore account balance before deleting
    const { data: tx } = await supabase
      .from('transactions').select('account_id, amount, type').eq('id', id).maybeSingle();

    if (tx && tx.account_id) {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.account_id).maybeSingle();
      if (acc) {
        const restored = tx.type === 'Income' || tx.type === 'Borrow'
          ? Math.max(0, acc.balance - tx.amount)
          : acc.balance + tx.amount;
        await supabase.from('accounts').update({ balance: restored }).eq('id', tx.account_id);
      }
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;

    sendSuccess(res, { message: 'Transaction deleted' });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// ── POST /transactions/delete-batch ──────────────────────────────
export const deleteMultipleTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      sendSuccess(res, { message: 'No IDs provided' });
      return;
    }

    const { error } = await supabase.from('transactions').delete().in('id', ids);
    if (error) throw error;

    sendSuccess(res, { message: `${ids.length} transactions deleted` });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

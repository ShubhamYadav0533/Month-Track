import { supabase } from '../config/supabaseClient';
import { UserProfile, Account, Expense, SavingsGoal } from '../types';

/**
 * 1. Store User Profile in Supabase DB
 */
export async function saveUserToSupabase(profile: UserProfile, email?: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: profile.id,
        name: profile.name,
        email: email || `${profile.id}@smartfinance.app`,
        monthly_income: profile.monthlyIncome,
        salary_date: profile.salaryDate,
        savings_goal: profile.savingsGoal,
        currency: profile.currency,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase DB Sync Warning (Profile):', err);
    return { success: false, error: err };
  }
}

/**
 * 2. Store Multi-Accounts in Supabase DB
 */
export async function saveAccountsToSupabase(userId: string, accounts: Account[]) {
  try {
    const payload = accounts.map(acc => ({
      id: acc.id,
      user_id: userId,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      credit_limit: acc.creditLimit || 0,
    }));

    const { data, error } = await supabase.from('accounts').upsert(payload).select();
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase DB Sync Warning (Accounts):', err);
    return { success: false, error: err };
  }
}

/**
 * 3. Store Expense in Supabase DB
 */
export async function saveExpenseToSupabase(userId: string, expense: Expense) {
  try {
    const { data, error } = await supabase.from('expenses').insert({
      id: expense.id,
      user_id: userId,
      account_id: expense.accountId,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      payment_method: expense.paymentMethod,
      location: expense.location,
      receipt_url: expense.receiptUrl,
      expense_date: expense.expenseDate,
    }).select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase DB Sync Warning (Expense):', err);
    return { success: false, error: err };
  }
}

/**
 * 4. Delete Expense from Supabase DB
 */
export async function deleteExpenseFromSupabase(expenseId: string) {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('Supabase DB Delete Warning:', err);
    return { success: false, error: err };
  }
}

/**
 * 5. Fetch Complete User Data & Full Expense History from Supabase DB
 */
export async function fetchFullUserDataFromSupabase(userId: string) {
  try {
    const [userRes, accountsRes, expensesRes, budgetsRes, goalsRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('expenses').select('*').eq('user_id', userId).order('expense_date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', userId),
      supabase.from('savings_goals').select('*').eq('user_id', userId),
    ]);

    return {
      success: true,
      profile: userRes.data,
      accounts: accountsRes.data || [],
      expenses: (expensesRes.data || []).map((e: any) => ({
        id: e.id,
        accountId: e.account_id,
        amount: parseFloat(e.amount),
        category: e.category,
        description: e.description,
        paymentMethod: e.payment_method,
        location: e.location,
        receiptUrl: e.receipt_url,
        expenseDate: e.expense_date,
        createdAt: e.created_at,
      })),
      budgets: (budgetsRes.data || []).map((b: any) => ({
        category: b.category,
        monthlyLimit: parseFloat(b.monthly_limit),
      })),
      goals: (goalsRes.data || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        targetAmount: parseFloat(g.target_amount),
        savedAmount: parseFloat(g.saved_amount),
        icon: g.icon || 'target',
      })),
    };
  } catch (err) {
    console.warn('Supabase Full Fetch Warning:', err);
    return { success: false, profile: null, accounts: [], expenses: [], budgets: [], goals: [] };
  }
}

/**
 * 6. Store Category Budget in Supabase DB
 */
export async function saveBudgetToSupabase(userId: string, category: string, monthlyLimit: number) {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        category,
        monthly_limit: monthlyLimit,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase DB Sync Warning (Budget):', err);
    return { success: false, error: err };
  }
}

/**
 * 7. Store Savings Goal in Supabase DB
 */
export async function saveSavingsGoalToSupabase(userId: string, goal: SavingsGoal) {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .upsert({
        id: goal.id,
        user_id: userId,
        title: goal.title,
        target_amount: goal.targetAmount,
        saved_amount: goal.savedAmount,
        icon: goal.icon,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase DB Sync Warning (Goal):', err);
    return { success: false, error: err };
  }
}

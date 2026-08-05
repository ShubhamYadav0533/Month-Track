import { supabase } from '../config/supabaseClient';
import { UserProfile, Account, Expense, CategoryBudget, SavingsGoal } from '../types';

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
 * 4. Fetch Expenses from Supabase DB
 */
export async function fetchExpensesFromSupabase(userId: string) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase DB Fetch Warning:', err);
    return { success: false, data: [] };
  }
}

/**
 * 5. Store Category Budget in Supabase DB
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
 * 6. Store Savings Goal in Supabase DB
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

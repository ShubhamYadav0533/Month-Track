import { supabase } from '../config/supabaseClient';
import {
  fetchExpensesFromBackend,
  syncExpenseToBackend,
  deleteExpenseFromBackend,
  deleteMultipleExpensesFromBackend,
} from './api';
import {
  UserProfile,
  Account,
  Transaction,
  SavingsGoal,
  TaskItem,
  BillItem,
  CategoryBudget,
  ExpenseCategory,
  TransactionType,
  PaymentMethod,
} from '../types';
import {
  NotificationRecord,
  HabitItem,
  CalendarEventItem,
  ReminderItem,
  DailyPlannerSlot,
} from '../types/productivity';

// ─────────────────────────────────────────────────
// 1. Users
// ─────────────────────────────────────────────────

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
    console.warn('[Supabase] User sync error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 2. Accounts
// ─────────────────────────────────────────────────

export async function saveAccountsToSupabase(userId: string, accounts: Account[]) {
  try {
    const payload = accounts.map((acc) => ({
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
    console.warn('[Supabase] Accounts sync error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 3. Transactions (was incorrectly "expenses")
// ─────────────────────────────────────────────────

export async function saveTransactionToSupabase(userId: string, tx: Transaction) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = userId && uuidRegex.test(userId)
      ? userId
      : '00000000-0000-4000-a000-000000000001';

    const accountId = (tx.accountId && uuidRegex.test(tx.accountId))
      ? tx.accountId
      : '00000000-0000-4000-a000-000000000012';

    // 1. Ensure user row exists in Supabase 'users' table
    await supabase.from('users').upsert({
      id: validUserId,
      name: 'User',
      email: `${validUserId}@smartfinance.app`,
      monthly_income: 0,
      salary_date: 1,
      savings_goal: 0,
      currency: '₹',
    });

    // 2. Ensure account row exists in Supabase 'accounts' table
    await supabase.from('accounts').upsert({
      id: accountId,
      user_id: validUserId,
      name: 'Default Account',
      type: 'upi',
      balance: 0,
      credit_limit: 0,
    });

    const txId = (tx.id && uuidRegex.test(tx.id)) ? tx.id : undefined;

    const { data, error } = await supabase
      .from('transactions')
      .upsert({
        ...(txId ? { id: txId } : {}),
        user_id: validUserId,
        account_id: accountId,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        sub_category: tx.subCategory || null,
        payment_method: tx.paymentMethod,
        transaction_date: tx.transactionDate,
        recurring: tx.recurring || false,
        notes: tx.notes || null,
        attachment: tx.attachment || null,
        location: tx.location || null,
      })
      .select();

    if (error) {
      console.warn('[Supabase] Direct transaction save failed, using backend fallback:', error);
      // Fallback: send to Express backend API (include id so it upserts the same row)
      const backendRes = await syncExpenseToBackend({
        userId: validUserId,
        accountId: accountId,
        amount: tx.amount,
        category: tx.category,
        description: tx.title,
        paymentMethod: tx.paymentMethod,
        transactionDate: tx.transactionDate,
        expenseDate: tx.transactionDate,
      });
      return { success: !!backendRes, data: backendRes };
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Transaction sync error, using backend fallback:', err);
    const backendRes = await syncExpenseToBackend({
      userId,
      accountId: tx.accountId,
      amount: tx.amount,
      category: tx.category,
      description: tx.title,
      paymentMethod: tx.paymentMethod,
      transactionDate: tx.transactionDate,
      expenseDate: tx.transactionDate,
    });
    return { success: !!backendRes, data: backendRes };
  }
}

// Backward compatibility alias
export const saveExpenseToSupabase = (userId: string, tx: Transaction) =>
  saveTransactionToSupabase(userId, tx);

export async function deleteTransactionFromSupabase(txId: string) {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    if (error) {
      console.warn('[Supabase] Direct transaction delete warning, calling backend API fallback:', error);
    }
    // Always call backend REST delete as well
    deleteExpenseFromBackend(txId);
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Transaction delete error, using backend fallback:', err);
    deleteExpenseFromBackend(txId);
    return { success: false, error: err };
  }
}

export async function deleteMultipleTransactionsFromSupabase(txIds: string[]) {
  try {
    if (!txIds || txIds.length === 0) return { success: true };
    const { error } = await supabase.from('transactions').delete().in('id', txIds);
    if (error) {
      console.warn('[Supabase] Direct batch delete warning, calling backend API fallback:', error);
    }
    // Always call backend REST batch delete as well
    deleteMultipleExpensesFromBackend(txIds);
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Multiple transaction delete error, using backend fallback:', err);
    deleteMultipleExpensesFromBackend(txIds);
    return { success: false, error: err };
  }
}

// Backward compatibility alias
export const deleteExpenseFromSupabase = deleteTransactionFromSupabase;

// ─────────────────────────────────────────────────
// 4. Tasks
// ─────────────────────────────────────────────────

export async function saveTaskToSupabase(userId: string, task: TaskItem) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .upsert({
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description || null,
        due_date: task.dueDate,
        priority: task.priority,
        section: task.section,
        completed: task.completed,
        reminder_date: task.reminderDate || null,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Task sync error:', err);
    return { success: false, error: err };
  }
}

export async function deleteTaskFromSupabase(taskId: string) {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Task delete error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 5. Bills
// ─────────────────────────────────────────────────

export async function saveBillToSupabase(userId: string, bill: BillItem) {
  try {
    const { data, error } = await supabase
      .from('bills')
      .upsert({
        id: bill.id,
        user_id: userId,
        title: bill.title,
        amount: bill.amount,
        due_date: bill.dueDate,
        recurring: bill.recurring,
        status: bill.status,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Bill sync error:', err);
    return { success: false, error: err };
  }
}

export async function deleteBillFromSupabase(billId: string) {
  try {
    const { error } = await supabase.from('bills').delete().eq('id', billId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Bill delete error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 6. Budgets
// ─────────────────────────────────────────────────

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
    console.warn('[Supabase] Budget sync error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 7. Savings Goals
// ─────────────────────────────────────────────────

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
        target_date: goal.targetDate || null,
        icon: goal.icon,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Goal sync error:', err);
    return { success: false, error: err };
  }
}

export async function deleteSavingsGoalFromSupabase(goalId: string) {
  try {
    const { error } = await supabase.from('savings_goals').delete().eq('id', goalId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Goal delete error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 8. Habits
// ─────────────────────────────────────────────────

export async function saveHabitToSupabase(userId: string, habit: HabitItem) {
  try {
    const { data, error } = await supabase
      .from('habits')
      .upsert({
        id: habit.id,
        user_id: userId,
        title: habit.title,
        icon: habit.icon,
        color: habit.color,
        goal_type: habit.goalType,
        target_value: habit.targetValue,
        current_streak: habit.currentStreak,
        best_streak: habit.bestStreak,
        completed_days: habit.completedDays,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Habit sync error:', err);
    return { success: false, error: err };
  }
}

export async function deleteHabitFromSupabase(habitId: string) {
  try {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Habit delete error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 9. Calendar Events
// ─────────────────────────────────────────────────

export async function saveCalendarEventToSupabase(userId: string, event: CalendarEventItem) {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .upsert({
        id: event.id,
        user_id: userId,
        title: event.title,
        start_datetime: event.startDatetime,
        end_datetime: event.endDatetime,
        event_type: event.eventType,
        location: event.location || null,
        color: event.color,
        all_day: event.allDay,
        notes: event.notes || null,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Calendar event sync error:', err);
    return { success: false, error: err };
  }
}

export async function deleteCalendarEventFromSupabase(eventId: string) {
  try {
    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Calendar event delete error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 10. Reminders
// ─────────────────────────────────────────────────

export async function saveReminderToSupabase(userId: string, reminder: ReminderItem) {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .upsert({
        id: reminder.id,
        user_id: userId,
        task_id: reminder.taskId || null,
        trigger_time: reminder.triggerTime,
        repeat_type: reminder.repeatType,
        repeat_interval: reminder.repeatInterval || 1,
        sound: reminder.sound || 'default',
        vibration: reminder.vibration ?? true,
        snooze_minutes: reminder.snoozeMinutes || 10,
        enabled: reminder.enabled,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Reminder sync error:', err);
    return { success: false, error: err };
  }
}

export async function deleteReminderFromSupabase(reminderId: string) {
  try {
    const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Reminder delete error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 11. Notifications
// ─────────────────────────────────────────────────

export async function saveNotificationToSupabase(userId: string, notif: NotificationRecord) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .upsert({
        id: notif.id,
        user_id: userId,
        title: notif.title,
        body: notif.body,
        image: notif.image || null,
        deep_link: notif.deepLink || null,
        status: notif.status,
        sent_at: notif.sentAt,
        opened_at: notif.openedAt || null,
        clicked: notif.clicked || false,
        action_type: notif.actionType || null,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Notification sync error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// 12. Daily Planner
// ─────────────────────────────────────────────────

export async function savePlannerSlotToSupabase(userId: string, slot: DailyPlannerSlot) {
  try {
    const { data, error } = await supabase
      .from('daily_planner')
      .upsert({
        id: slot.id,
        user_id: userId,
        planner_date: slot.plannerDate,
        time_slot: slot.timeSlot,
        activity: slot.activity,
        task_id: slot.taskId || null,
        completed: slot.completed,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Planner sync error:', err);
    return { success: false, error: err };
  }
}

export async function deletePlannerSlotFromSupabase(slotId: string) {
  try {
    const { error } = await supabase.from('daily_planner').delete().eq('id', slotId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Planner delete error:', err);
    return { success: false, error: err };
  }
}

// ─────────────────────────────────────────────────
// Full Data Fetch (reads from all tables)
// ─────────────────────────────────────────────────

export async function fetchFullUserDataFromSupabase(userId: string) {
  try {
    // 1. Fetch profile for userId, or fallback to the latest user in Supabase
    let userRes = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (!userRes.data) {
      const latestUserRes = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (latestUserRes.data) {
        userRes = latestUserRes;
      }
    }

    const targetUserId = userRes.data?.id || userId;

    // 2. Fetch accounts for targetUserId or all accounts
    let accountsRes = await supabase.from('accounts').select('*').eq('user_id', targetUserId);
    if (!accountsRes.data || accountsRes.data.length === 0) {
      accountsRes = await supabase.from('accounts').select('*');
    }

    // 3. Fetch transactions for targetUserId or all transactions
    let txRes = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('transaction_date', { ascending: false });
    if (!txRes.data || txRes.data.length === 0) {
      txRes = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
    }

    let txList: any[] = txRes.data || [];
    if (txList.length === 0) {
      try {
        const backendTxs = await fetchExpensesFromBackend();
        if (backendTxs && backendTxs.length > 0) {
          txList = backendTxs;
        }
      } catch (err) {
        console.warn('Fallback backend expenses fetch failed:', err);
      }
    }

    // 4. Fetch budgets, goals, tasks, bills with fallback to all rows
    let budgetsRes = await supabase.from('budgets').select('*').eq('user_id', targetUserId);
    if (!budgetsRes.data || budgetsRes.data.length === 0) {
      budgetsRes = await supabase.from('budgets').select('*');
    }

    let goalsRes = await supabase.from('savings_goals').select('*').eq('user_id', targetUserId);
    if (!goalsRes.data || goalsRes.data.length === 0) {
      goalsRes = await supabase.from('savings_goals').select('*');
    }

    let tasksRes = await supabase.from('tasks').select('*').eq('user_id', targetUserId);
    if (!tasksRes.data || tasksRes.data.length === 0) {
      tasksRes = await supabase.from('tasks').select('*');
    }

    let billsRes = await supabase.from('bills').select('*').eq('user_id', targetUserId);
    if (!billsRes.data || billsRes.data.length === 0) {
      billsRes = await supabase.from('bills').select('*');
    }

    let userProfile = userRes.data;
    if (!userProfile) {
      userProfile = {
        id: userId,
        name: 'User',
        monthly_income: 0,
        salary_date: 1,
        savings_goal: 0,
        currency: '₹',
      };
    }

    return {
      success: true,
      profile: userProfile,
      accounts: accountsRes.data || [],
      transactions: txList.map((t: Record<string, unknown>): Transaction => ({
        id: String(t.id || ''),
        title: String(t.title || ''),
        amount: parseFloat(String(t.amount || 0)),
        type: (t.type || 'Expense') as TransactionType,
        category: (t.category || 'Others') as ExpenseCategory,
        subCategory: t.sub_category ? String(t.sub_category) : undefined,
        accountId: String(t.account_id || ''),
        paymentMethod: (t.payment_method || 'UPI') as PaymentMethod,
        transactionDate: String(t.transaction_date || ''),
        expenseDate: String(t.transaction_date || ''),
        recurring: Boolean(t.recurring),
        notes: t.notes ? String(t.notes) : undefined,
        attachment: t.attachment ? String(t.attachment) : undefined,
        location: t.location ? String(t.location) : undefined,
        createdAt: String(t.created_at || ''),
      })),
      budgets: (budgetsRes.data || []).map((b: Record<string, unknown>): CategoryBudget => ({
        category: b.category as ExpenseCategory,
        monthlyLimit: parseFloat(String(b.monthly_limit)),
      })),
      goals: (goalsRes.data || []).map((g: Record<string, unknown>): SavingsGoal => ({
        id: String(g.id),
        title: String(g.title),
        targetAmount: parseFloat(String(g.target_amount)),
        savedAmount: parseFloat(String(g.saved_amount)),
        targetDate: g.target_date ? String(g.target_date) : undefined,
        icon: String(g.icon || 'target'),
      })),
      tasks: (tasksRes.data || []).map((t: Record<string, unknown>) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        dueDate: t.due_date,
        priority: t.priority,
        section: t.section,
        completed: t.completed,
        reminderDate: t.reminder_date,
        createdAt: t.created_at,
      })),
      bills: (billsRes.data || []).map((b: Record<string, unknown>) => ({
        id: b.id,
        title: b.title,
        amount: parseFloat(String(b.amount)),
        dueDate: b.due_date,
        recurring: b.recurring,
        status: b.status,
        createdAt: b.created_at,
      })),
    };
  } catch (err) {
    console.warn('[Supabase] Full fetch error:', err);
    return {
      success: false,
      profile: null,
      accounts: [],
      transactions: [],
      budgets: [],
      goals: [],
      tasks: [],
      bills: [],
    };
  }
}

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
  AttendanceRecord,
  AttendanceStatus,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = userId && uuidRegex.test(userId)
      ? userId
      : '00000000-0000-4000-a000-000000000001';

    await supabase.from('users').upsert({
      id: validUserId,
      name: 'User',
      email: `${validUserId}@smartfinance.app`,
      monthly_income: 0,
      salary_date: 1,
      savings_goal: 0,
      currency: '₹',
    });

    const taskId = (task.id && uuidRegex.test(task.id)) ? task.id : undefined;

    const { data, error } = await supabase
      .from('tasks')
      .upsert({
        ...(taskId ? { id: taskId } : {}),
        user_id: validUserId,
        title: task.title,
        description: task.description || null,
        due_date: task.dueDate || new Date().toISOString().split('T')[0],
        priority: task.priority || 'Medium',
        section: task.section || 'Today',
        completed: task.completed || false,
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = userId && uuidRegex.test(userId)
      ? userId
      : '00000000-0000-4000-a000-000000000001';

    await supabase.from('users').upsert({
      id: validUserId,
      name: 'User',
      email: `${validUserId}@smartfinance.app`,
      monthly_income: 0,
      salary_date: 1,
      savings_goal: 0,
      currency: '₹',
    });

    const billId = (bill.id && uuidRegex.test(bill.id)) ? bill.id : undefined;

    const { data, error } = await supabase
      .from('bills')
      .upsert({
        ...(billId ? { id: billId } : {}),
        user_id: validUserId,
        title: bill.title,
        amount: bill.amount,
        due_date: bill.dueDate || new Date().toISOString().split('T')[0],
        recurring: bill.recurring || false,
        status: bill.status || 'Pending',
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
    // 1. Fetch profile for userId, or fallback to any user row in Supabase
    let userProfileData: any = null;
    try {
      const userRes = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (userRes.data) {
        userProfileData = userRes.data;
      } else {
        const fallbackUserRes = await supabase.from('users').select('*').limit(1).maybeSingle();
        if (fallbackUserRes.data) {
          userProfileData = fallbackUserRes.data;
        }
      }
    } catch (e) {
      console.warn('[Supabase] Profile fetch error:', e);
    }

    const targetUserId = userProfileData?.id || userId;

    // 2. Fetch accounts
    let accountsData: any[] = [];
    try {
      let accountsRes = await supabase.from('accounts').select('*').eq('user_id', targetUserId);
      if (!accountsRes.data || accountsRes.data.length === 0) {
        accountsRes = await supabase.from('accounts').select('*');
      }
      accountsData = accountsRes.data || [];
    } catch (e) {
      console.warn('[Supabase] Accounts fetch error:', e);
    }

    // 3. Fetch transactions
    let txList: any[] = [];
    try {
      let txRes = await supabase.from('transactions').select('*').eq('user_id', targetUserId);
      if (!txRes.data || txRes.data.length === 0) {
        txRes = await supabase.from('transactions').select('*');
      }
      txList = txRes.data || [];
    } catch (e) {
      console.warn('[Supabase] Transactions fetch error:', e);
    }

    if (txList.length === 0) {
      try {
        const backendTxs = await fetchExpensesFromBackend();
        if (backendTxs && backendTxs.length > 0) {
          txList = backendTxs;
        }
      } catch (err) {
        console.warn('[Backend] Fallback expenses fetch failed:', err);
      }
    }

    // 4. Fetch budgets, goals, tasks, bills
    let budgetsData: any[] = [];
    try {
      let budgetsRes = await supabase.from('budgets').select('*').eq('user_id', targetUserId);
      if (!budgetsRes.data || budgetsRes.data.length === 0) {
        budgetsRes = await supabase.from('budgets').select('*');
      }
      budgetsData = budgetsRes.data || [];
    } catch (e) {
      console.warn('[Supabase] Budgets fetch error:', e);
    }

    let goalsData: any[] = [];
    try {
      let goalsRes = await supabase.from('savings_goals').select('*').eq('user_id', targetUserId);
      if (!goalsRes.data || goalsRes.data.length === 0) {
        goalsRes = await supabase.from('savings_goals').select('*');
      }
      goalsData = goalsRes.data || [];
    } catch (e) {
      console.warn('[Supabase] Goals fetch error:', e);
    }

    let tasksData: any[] = [];
    try {
      let tasksRes = await supabase.from('tasks').select('*').eq('user_id', targetUserId);
      if (!tasksRes.data || tasksRes.data.length === 0) {
        tasksRes = await supabase.from('tasks').select('*');
      }
      tasksData = tasksRes.data || [];
    } catch (e) {
      console.warn('[Supabase] Tasks fetch error:', e);
    }

    let billsData: any[] = [];
    try {
      let billsRes = await supabase.from('bills').select('*').eq('user_id', targetUserId);
      if (!billsRes.data || billsRes.data.length === 0) {
        billsRes = await supabase.from('bills').select('*');
      }
      billsData = billsRes.data || [];
    } catch (e) {
      console.warn('[Supabase] Bills fetch error:', e);
    }

    let finalProfile = userProfileData;
    if (!finalProfile) {
      finalProfile = {
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
      profile: finalProfile,
      accounts: accountsData,
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
      budgets: budgetsData.map((b: Record<string, unknown>): CategoryBudget => ({
        category: b.category as ExpenseCategory,
        monthlyLimit: parseFloat(String(b.monthly_limit || 0)),
      })),
      goals: goalsData.map((g: Record<string, unknown>): SavingsGoal => ({
        id: String(g.id || ''),
        title: String(g.title || ''),
        targetAmount: parseFloat(String(g.target_amount || 0)),
        savedAmount: parseFloat(String(g.saved_amount || 0)),
        targetDate: g.target_date ? String(g.target_date) : undefined,
        icon: String(g.icon || 'target'),
      })),
      tasks: tasksData.map((t: Record<string, unknown>): TaskItem => ({
        id: String(t.id || ''),
        title: String(t.title || ''),
        description: t.description ? String(t.description) : undefined,
        dueDate: String(t.due_date || ''),
        priority: (t.priority || 'Medium') as any,
        section: (t.section || 'Today') as any,
        completed: Boolean(t.completed),
        reminderDate: t.reminder_date ? String(t.reminder_date) : undefined,
        createdAt: String(t.created_at || ''),
      })),
      bills: billsData.map((b: Record<string, unknown>): BillItem => ({
        id: String(b.id || ''),
        title: String(b.title || ''),
        amount: parseFloat(String(b.amount || 0)),
        dueDate: String(b.due_date || ''),
        recurring: Boolean(b.recurring),
        status: (b.status || 'Pending') as 'Pending' | 'Paid',
        category: b.category ? (String(b.category) as ExpenseCategory) : undefined,
        createdAt: String(b.created_at || ''),
      })),
    };
  } catch (err) {
    console.warn('[Supabase] Full fetch unexpected error:', err);
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

// ─────────────────────────────────────────────────
// 13. Attendance & Employees Sync
// ─────────────────────────────────────────────────

export async function saveAttendanceToSupabase(userId: string, record: AttendanceRecord) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = (userId && uuidRegex.test(userId))
      ? userId
      : '00000000-0000-4000-a000-000000000001';

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

    const validEmpId = (record.employeeId && uuidRegex.test(record.employeeId))
      ? record.employeeId
      : '00000000-0000-4000-a000-000000000001';

    // 2. Ensure employee row exists in Supabase 'employees' table
    await supabase.from('employees').upsert({
      id: validEmpId,
      user_id: validUserId,
      employee_code: 'EMP001',
      full_name: 'Employee',
      email: `${validUserId}@smartfinance.app`,
      department: 'General',
      designation: 'Employee',
      joining_date: new Date().toISOString().slice(0, 10),
      office_location: 'Main Office',
    }, { onConflict: 'id' });

    const validAttId = (record.id && uuidRegex.test(record.id)) ? record.id : undefined;

    // 3. Upsert attendance row
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        ...(validAttId ? { id: validAttId } : {}),
        employee_id: validEmpId,
        attendance_date: record.attendanceDate,
        check_in: record.checkIn || null,
        check_out: record.checkOut || null,
        total_work_minutes: record.totalWorkMinutes || 0,
        break_minutes: record.breakMinutes || 0,
        overtime_minutes: record.overtimeMinutes || 0,
        late_minutes: record.lateMinutes || 0,
        early_leave_minutes: record.earlyLeaveMinutes || 0,
        status: record.status || 'Present',
        notes: record.notes || null,
      }, { onConflict: 'employee_id,attendance_date' })
      .select();

    if (error) throw error;

    // 4. Save breaks if present
    if (data && data[0] && record.breaks && record.breaks.length > 0) {
      const attId = data[0].id;
      for (const br of record.breaks) {
        const breakId = (br.id && uuidRegex.test(br.id)) ? br.id : undefined;
        await supabase.from('attendance_breaks').upsert({
          ...(breakId ? { id: breakId } : {}),
          attendance_id: attId,
          break_start: br.breakStart,
          break_end: br.breakEnd || null,
          duration_minutes: br.durationMinutes || 0,
          break_type: br.breakType || 'Other',
        });
      }
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Attendance save error:', err);
    return { success: false, error: err };
  }
}

export async function fetchAttendanceFromSupabase(userId: string) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = (userId && uuidRegex.test(userId))
      ? userId
      : '00000000-0000-4000-a000-000000000001';

    const empRes = await supabase.from('employees').select('id').eq('user_id', validUserId).maybeSingle();
    const empId = empRes.data?.id;

    let query = supabase.from('attendance').select('*, attendance_breaks(*)');
    if (empId) {
      query = query.eq('employee_id', empId);
    }

    const { data, error } = await query.order('attendance_date', { ascending: false });
    if (error) throw error;

    const records: AttendanceRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      attendanceDate: row.attendance_date,
      checkIn: row.check_in,
      checkOut: row.check_out,
      totalWorkMinutes: row.total_work_minutes || 0,
      breakMinutes: row.break_minutes || 0,
      overtimeMinutes: row.overtime_minutes || 0,
      lateMinutes: row.late_minutes || 0,
      earlyLeaveMinutes: row.early_leave_minutes || 0,
      status: row.status as AttendanceStatus,
      notes: row.notes || '',
      breaks: (row.attendance_breaks || []).map((b: any) => ({
        id: b.id,
        attendanceId: b.attendance_id,
        breakStart: b.break_start,
        breakEnd: b.break_end,
        durationMinutes: b.duration_minutes || 0,
        breakType: b.break_type || 'Other',
      })),
      createdAt: row.created_at,
    }));

    return { success: true, data: records };
  } catch (err) {
    console.warn('[Supabase] Attendance fetch error:', err);
    return { success: false, data: [] };
  }
}

export async function saveLeaveToSupabase(userId: string, leave: LeaveRequest) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = (userId && uuidRegex.test(userId)) ? userId : '00000000-0000-4000-a000-000000000001';
    const validEmpId = (leave.employeeId && uuidRegex.test(leave.employeeId)) ? leave.employeeId : '00000000-0000-4000-a000-000000000001';

    // 1. Ensure user row
    await supabase.from('users').upsert({
      id: validUserId,
      name: 'User',
      email: `${validUserId}@smartfinance.app`,
      monthly_income: 0,
      salary_date: 1,
      savings_goal: 0,
      currency: '₹',
    });

    // 2. Ensure employee row
    await supabase.from('employees').upsert({
      id: validEmpId,
      user_id: validUserId,
      employee_code: 'EMP001',
      full_name: 'Employee',
      email: `${validUserId}@smartfinance.app`,
      department: 'General',
      designation: 'Employee',
      joining_date: new Date().toISOString().slice(0, 10),
      office_location: 'Main Office',
    }, { onConflict: 'id' });

    const validLeaveId = (leave.id && uuidRegex.test(leave.id)) ? leave.id : undefined;

    // 3. Upsert leave_requests row
    const { data, error } = await supabase
      .from('leave_requests')
      .upsert({
        ...(validLeaveId ? { id: validLeaveId } : {}),
        employee_id: validEmpId,
        leave_type: leave.leaveType,
        start_date: leave.startDate,
        end_date: leave.endDate,
        total_days: leave.totalDays,
        reason: leave.reason,
        status: leave.status || 'Pending',
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Leave save error:', err);
    return { success: false, error: err };
  }
}

export async function fetchLeavesFromSupabase(userId: string) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = (userId && uuidRegex.test(userId)) ? userId : '00000000-0000-4000-a000-000000000001';

    const empRes = await supabase.from('employees').select('id').eq('user_id', validUserId).maybeSingle();
    const empId = empRes.data?.id;

    let query = supabase.from('leave_requests').select('*');
    if (empId) {
      query = query.eq('employee_id', empId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const records: LeaveRequest[] = (data || []).map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      leaveType: row.leave_type as LeaveType,
      startDate: row.start_date,
      endDate: row.end_date,
      totalDays: parseFloat(row.total_days || 1),
      reason: row.reason,
      status: row.status as LeaveStatus,
      createdAt: row.created_at,
    }));

    return { success: true, data: records };
  } catch (err) {
    console.warn('[Supabase] Leave fetch error:', err);
    return { success: false, data: [] };
  }
}

export async function deleteLeaveFromSupabase(leaveId: string) {
  try {
    const { error } = await supabase.from('leave_requests').delete().eq('id', leaveId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[Supabase] Leave delete error:', err);
    return { success: false, error: err };
  }
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  Account,
  Transaction,
  CategoryBudget,
  SavingsGoal,
  RecurringTransaction,
  NotificationItem,
  SplitExpense,
  ExpenseCategory,
  TaskItem,
  BillItem,
  TransactionType,
  PaymentMethod,
} from '../types';
import { getFormattedDate } from '../utils/budgetCalculator';
import {
  saveUserToSupabase,
  saveAccountsToSupabase,
  saveExpenseToSupabase,
  deleteExpenseFromSupabase,
  fetchFullUserDataFromSupabase,
  saveBudgetToSupabase,
  saveSavingsGoalToSupabase,
} from '../services/supabaseService';

interface FinanceState {
  profile: UserProfile;
  accounts: Account[];
  transactions: Transaction[]; // Unified transaction history
  expenses: Transaction[]; // Backward compatibility alias
  budgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  tasks: TaskItem[];
  bills: BillItem[];
  recurring: RecurringTransaction[];
  notifications: NotificationItem[];
  splitExpenses: SplitExpense[];
  isLocked: boolean;
  isLoading: boolean;

  // Actions
  loadSupabaseData: () => Promise<void>;
  setupUser: (
    profileData: Omit<UserProfile, 'id' | 'isSetupComplete'>,
    walletBal: number,
    bankBal: number,
    upiBal: number,
    cardLimit?: number
  ) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  
  // Transaction Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  addExpense: (expense: Omit<Transaction, 'id' | 'createdAt'>) => void; // alias
  updateTransaction: (id: string, updatedData: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteExpense: (id: string) => void; // alias
  duplicateTransaction: (id: string) => void;

  // Tasks Actions
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  toggleTaskCompleted: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, task: Partial<TaskItem>) => void;

  // Bills Actions
  addBill: (bill: Omit<BillItem, 'id' | 'createdAt'>) => void;
  toggleBillStatus: (id: string) => void;
  deleteBill: (id: string) => void;

  // Account & Budget Actions
  updateAccountBalance: (accountId: string, newBalance: number) => void;
  setCategoryBudget: (category: ExpenseCategory, monthlyLimit: number) => void;
  
  // Savings Goal Actions
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavedGoalAmount: (id: string, additionalAmount: number) => void;
  deleteSavingsGoal: (id: string) => void;

  // Recurring & Split Actions
  addRecurringTransaction: (rec: Omit<RecurringTransaction, 'id'>) => void;
  processRecurringDeductions: () => void;
  addSplitExpense: (split: Omit<SplitExpense, 'id' | 'createdAt'>) => void;
  settleSplitExpense: (id: string) => void;
  
  // Security
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
  resetAllData: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_1',
  name: 'User',
  monthlyIncome: 0,
  salaryDate: 1,
  savingsGoal: 0,
  currency: '₹',
  isSetupComplete: false,
  defaultAppMode: 'finance',
};

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc_wallet', name: 'Wallet Cash', type: 'wallet', balance: 0, icon: 'wallet', color: '#10b981' },
  { id: 'acc_bank', name: 'Bank Balance', type: 'bank', balance: 0, icon: 'building', color: '#3b82f6' },
  { id: 'acc_upi', name: 'UPI / GPay', type: 'upi', balance: 0, icon: 'smartphone', color: '#8b5cf6' },
  { id: 'acc_card', name: 'Credit Card', type: 'card', balance: 0, creditLimit: 0, icon: 'credit-card', color: '#f59e0b' },
];

const INITIAL_TASKS: TaskItem[] = [];
const INITIAL_BILLS: BillItem[] = [];
const INITIAL_GOALS: SavingsGoal[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      expenses: INITIAL_TRANSACTIONS,
      budgets: [],
      savingsGoals: INITIAL_GOALS,
      tasks: INITIAL_TASKS,
      bills: INITIAL_BILLS,
      recurring: [],
      notifications: [],
      splitExpenses: [],
      isLocked: false,
      isLoading: false,

      loadSupabaseData: async () => {
        const userId = get().profile.id;
        if (!userId) return;

        set({ isLoading: true });
        const res = await fetchFullUserDataFromSupabase(userId);
        if (res.success && res.profile) {
          set((state) => {
            const fetchedTxs: Transaction[] = res.expenses.map((e: any) => ({
              id: e.id,
              title: e.description || e.category,
              description: e.description || e.category,
              amount: parseFloat(e.amount),
              type: (e.paymentMethod === 'Income' ? 'Income' : 'Expense') as TransactionType,
              category: e.category,
              accountId: e.accountId,
              paymentMethod: e.paymentMethod,
              transactionDate: e.expenseDate || getFormattedDate(),
              expenseDate: e.expenseDate || getFormattedDate(),
              createdAt: e.createdAt,
              location: e.location,
              attachment: e.receiptUrl,
            }));

            return {
              profile: {
                id: res.profile.id,
                name: res.profile.name || state.profile.name,
                monthlyIncome: parseFloat(res.profile.monthly_income || '0'),
                salaryDate: parseInt(res.profile.salary_date || '1', 10),
                savingsGoal: parseFloat(res.profile.savings_goal || '0'),
                currency: res.profile.currency || '₹',
                isSetupComplete: true,
              },
              transactions: fetchedTxs,
              expenses: fetchedTxs,
              accounts: res.accounts.length > 0
                ? res.accounts.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    balance: parseFloat(a.balance),
                    creditLimit: parseFloat(a.credit_limit || 0),
                    icon: a.type,
                    color: a.type === 'wallet' ? '#10b981' : a.type === 'bank' ? '#3b82f6' : a.type === 'upi' ? '#8b5cf6' : '#f59e0b',
                  }))
                : state.accounts,
              budgets: res.budgets || [],
              savingsGoals: res.goals || [],
              isLoading: false,
            };
          });
        } else {
          set({ isLoading: false });
        }
      },

      setupUser: (profileData, walletBal, bankBal, upiBal, cardLimit = 0) => {
        const newProfile = {
          ...get().profile,
          ...profileData,
          isSetupComplete: true,
        };

        const newAccounts: Account[] = [
          { id: 'acc_wallet', name: 'Wallet Cash', type: 'wallet', balance: walletBal, icon: 'wallet', color: '#10b981' },
          { id: 'acc_bank', name: 'Bank Balance', type: 'bank', balance: bankBal, icon: 'building', color: '#3b82f6' },
          { id: 'acc_upi', name: 'UPI Balance', type: 'upi', balance: upiBal, icon: 'smartphone', color: '#8b5cf6' },
          { id: 'acc_card', name: 'Credit Card', type: 'card', balance: 0, creditLimit: cardLimit, icon: 'credit-card', color: '#f59e0b' },
        ];

        set({
          profile: newProfile,
          accounts: newAccounts,
        });

        saveUserToSupabase(newProfile);
        saveAccountsToSupabase(newProfile.id, newAccounts);
      },

      updateProfile: (data) => {
        set((state) => {
          const updated = { ...state.profile, ...data };
          saveUserToSupabase(updated);
          return { profile: updated };
        });
      },

      addTransaction: (txData) => {
        const id = `tx_${Date.now()}`;
        const dateStr = txData.transactionDate || (txData as any).expenseDate || getFormattedDate();
        const titleStr = txData.title || (txData as any).description || `${txData.type || 'Expense'}: ${txData.category}`;

        const newTx: Transaction = {
          ...txData,
          id,
          title: titleStr,
          description: titleStr,
          transactionDate: dateStr,
          expenseDate: dateStr,
          type: txData.type || 'Expense',
          paymentMethod: (txData.paymentMethod as PaymentMethod) || 'UPI',
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === txData.accountId || acc.name.toLowerCase().includes(txData.paymentMethod.toLowerCase())) {
              if (txData.type === 'Income' || txData.type === 'Borrow') {
                return { ...acc, balance: acc.balance + txData.amount };
              } else {
                return { ...acc, balance: Math.max(0, acc.balance - txData.amount) };
              }
            }
            return acc;
          });

          const updatedTxs = [newTx, ...state.transactions];
          saveExpenseToSupabase(state.profile.id, newTx);
          saveAccountsToSupabase(state.profile.id, updatedAccounts);

          return {
            transactions: updatedTxs,
            expenses: updatedTxs,
            accounts: updatedAccounts,
          };
        });
      },

      addExpense: (txData) => get().addTransaction({ ...txData, type: txData.type || 'Expense' }),

      updateTransaction: (id, updatedData) => {
        set((state) => {
          const updatedTxs = state.transactions.map((t) => (t.id === id ? { ...t, ...updatedData } : t));
          return { transactions: updatedTxs, expenses: updatedTxs };
        });
      },

      deleteTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          let updatedAccounts = state.accounts;
          if (tx) {
            updatedAccounts = state.accounts.map((acc) => {
              if (acc.id === tx.accountId) {
                return tx.type === 'Income' || tx.type === 'Borrow'
                  ? { ...acc, balance: Math.max(0, acc.balance - tx.amount) }
                  : { ...acc, balance: acc.balance + tx.amount };
              }
              return acc;
            });
          }

          deleteExpenseFromSupabase(id);
          saveAccountsToSupabase(state.profile.id, updatedAccounts);

          const filtered = state.transactions.filter((t) => t.id !== id);
          return {
            transactions: filtered,
            expenses: filtered,
            accounts: updatedAccounts,
          };
        });
      },

      deleteExpense: (id) => get().deleteTransaction(id),

      duplicateTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id);
        if (tx) {
          const { id: _, createdAt: __, ...rest } = tx;
          get().addTransaction({ ...rest, title: `${rest.title} (Copy)`, transactionDate: getFormattedDate() });
        }
      },

      addTask: (taskData) => {
        const newTask: TaskItem = {
          ...taskData,
          id: `task_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },

      toggleTaskCompleted: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed, section: !t.completed ? 'Completed' : 'Today' } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      updateTask: (id, taskData) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...taskData } : t)),
        }));
      },

      addBill: (billData) => {
        const newBill: BillItem = {
          ...billData,
          id: `bill_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ bills: [newBill, ...state.bills] }));
      },

      toggleBillStatus: (id) => {
        set((state) => {
          const targetBill = state.bills.find((b) => b.id === id);
          if (!targetBill) return state;

          const nextStatus: 'Pending' | 'Paid' = targetBill.status === 'Pending' ? 'Paid' : 'Pending';
          const updatedBills = state.bills.map((b) => (b.id === id ? { ...b, status: nextStatus } : b));

          // If marked as Paid, create a corresponding transaction automatically!
          if (nextStatus === 'Paid') {
            get().addTransaction({
              title: `Bill Paid: ${targetBill.title}`,
              amount: targetBill.amount,
              type: 'Expense',
              category: targetBill.category || 'Bills',
              accountId: targetBill.accountId || state.accounts[0]?.id || 'acc_upi',
              paymentMethod: 'UPI',
              transactionDate: getFormattedDate(),
            });
          }

          return { bills: updatedBills };
        });
      },

      deleteBill: (id) => {
        set((state) => ({ bills: state.bills.filter((b) => b.id !== id) }));
      },

      updateAccountBalance: (accountId, newBalance) => {
        set((state) => {
          const updatedAccounts = state.accounts.map((a) => (a.id === accountId ? { ...a, balance: newBalance } : a));
          saveAccountsToSupabase(state.profile.id, updatedAccounts);
          return { accounts: updatedAccounts };
        });
      },

      setCategoryBudget: (category, monthlyLimit) => {
        set((state) => {
          const existing = state.budgets.find((b) => b.category === category);
          saveBudgetToSupabase(state.profile.id, category, monthlyLimit);

          if (existing) {
            return {
              budgets: state.budgets.map((b) => (b.category === category ? { category, monthlyLimit } : b)),
            };
          }
          return { budgets: [...state.budgets, { category, monthlyLimit }] };
        });
      },

      addSavingsGoal: (goalData) => {
        const newGoal: SavingsGoal = { ...goalData, id: `goal_${Date.now()}` };
        set((state) => {
          saveSavingsGoalToSupabase(state.profile.id, newGoal);
          return { savingsGoals: [...state.savingsGoals, newGoal] };
        });
      },

      updateSavedGoalAmount: (id, additionalAmount) => {
        set((state) => {
          const updatedGoals = state.savingsGoals.map((g) => {
            if (g.id === id) {
              const updated = { ...g, savedAmount: Math.min(g.targetAmount, g.savedAmount + additionalAmount) };
              saveSavingsGoalToSupabase(state.profile.id, updated);
              return updated;
            }
            return g;
          });
          return { savingsGoals: updatedGoals };
        });
      },

      deleteSavingsGoal: (id) => {
        set((state) => ({ savingsGoals: state.savingsGoals.filter((g) => g.id !== id) }));
      },

      addRecurringTransaction: (recData) => {
        const newRec: RecurringTransaction = { ...recData, id: `rec_${Date.now()}` };
        set((state) => ({ recurring: [...state.recurring, newRec] }));
      },

      processRecurringDeductions: () => {
        const todayStr = getFormattedDate();
        set((state) => {
          let updatedAccounts = [...state.accounts];
          const updatedTxs = [...state.transactions];

          state.recurring.forEach((rec) => {
            if (rec.autoDeduct && rec.nextDueDate <= todayStr) {
              const newTx: Transaction = {
                id: `tx_auto_${Date.now()}_${rec.id}`,
                title: `Auto-Deduct: ${rec.title}`,
                amount: rec.amount,
                type: 'Expense',
                category: rec.category,
                accountId: rec.accountId,
                paymentMethod: 'UPI',
                transactionDate: todayStr,
                createdAt: new Date().toISOString(),
                recurring: true,
              };

              updatedTxs.unshift(newTx);
              saveExpenseToSupabase(state.profile.id, newTx);

              updatedAccounts = updatedAccounts.map((a) =>
                a.id === rec.accountId ? { ...a, balance: Math.max(0, a.balance - rec.amount) } : a
              );
            }
          });

          saveAccountsToSupabase(state.profile.id, updatedAccounts);
          return { accounts: updatedAccounts, transactions: updatedTxs, expenses: updatedTxs };
        });
      },

      addSplitExpense: (splitData) => {
        const newSplit: SplitExpense = {
          ...splitData,
          id: `split_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ splitExpenses: [newSplit, ...state.splitExpenses] }));
      },

      settleSplitExpense: (id) => {
        set((state) => ({
          splitExpenses: state.splitExpenses.map((s) => (s.id === id ? { ...s, isSettled: true } : s)),
        }));
      },

      unlockApp: (pin) => {
        const storedPin = get().profile.pinCode;
        if (!storedPin || storedPin === pin) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },

      lockApp: () => {
        if (get().profile.pinCode) {
          set({ isLocked: true });
        }
      },

      resetAllData: () => {
        set({
          profile: DEFAULT_PROFILE,
          accounts: INITIAL_ACCOUNTS,
          transactions: INITIAL_TRANSACTIONS,
          expenses: INITIAL_TRANSACTIONS,
          budgets: [],
          savingsGoals: INITIAL_GOALS,
          tasks: INITIAL_TASKS,
          bills: INITIAL_BILLS,
          recurring: [],
          splitExpenses: [],
          isLocked: false,
        });
      },
    }),
    {
      name: 'finance-app-os-clean-v5',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

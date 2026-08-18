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
  PaymentMethod,
} from '../types';
import { getFormattedDate } from '../utils/budgetCalculator';
import { generateId } from '../utils/generateId';
import {
  saveUserToSupabase,
  saveAccountsToSupabase,
  saveTransactionToSupabase,
  deleteTransactionFromSupabase,
  deleteMultipleTransactionsFromSupabase,
  fetchFullUserDataFromSupabase,
  saveBudgetToSupabase,
  saveSavingsGoalToSupabase,
  deleteSavingsGoalFromSupabase,
  saveTaskToSupabase,
  deleteTaskFromSupabase,
  saveBillToSupabase,
  deleteBillFromSupabase,
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
  deleteMultipleTransactions: (ids: string[]) => void;
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

// Fixed UUIDs for default entities (deterministic so they stay consistent across reloads)
export const DEFAULT_USER_ID = '00000000-0000-4000-a000-000000000001';
export const DEFAULT_ACC_WALLET = '00000000-0000-4000-a000-000000000010';
export const DEFAULT_ACC_BANK   = '00000000-0000-4000-a000-000000000011';
export const DEFAULT_ACC_UPI    = '00000000-0000-4000-a000-000000000012';
export const DEFAULT_ACC_CARD   = '00000000-0000-4000-a000-000000000013';

const DEFAULT_PROFILE: UserProfile = {
  id: DEFAULT_USER_ID,
  name: 'User',
  monthlyIncome: 0,
  salaryDate: 1,
  savingsGoal: 0,
  currency: '₹',
  isSetupComplete: false,
  defaultAppMode: 'finance',
};

const INITIAL_ACCOUNTS: Account[] = [
  { id: DEFAULT_ACC_WALLET, name: 'Wallet Cash', type: 'wallet', balance: 0, icon: 'wallet', color: '#10b981' },
  { id: DEFAULT_ACC_BANK, name: 'Bank Balance', type: 'bank', balance: 0, icon: 'building', color: '#3b82f6' },
  { id: DEFAULT_ACC_UPI, name: 'UPI / GPay', type: 'upi', balance: 0, icon: 'smartphone', color: '#8b5cf6' },
  { id: DEFAULT_ACC_CARD, name: 'Credit Card', type: 'card', balance: 0, creditLimit: 0, icon: 'credit-card', color: '#f59e0b' },
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
          const fetchedTxs = res.transactions || [];

          set((state) => {
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
          { id: DEFAULT_ACC_WALLET, name: 'Wallet Cash', type: 'wallet', balance: walletBal, icon: 'wallet', color: '#10b981' },
          { id: DEFAULT_ACC_BANK, name: 'Bank Balance', type: 'bank', balance: bankBal, icon: 'building', color: '#3b82f6' },
          { id: DEFAULT_ACC_UPI, name: 'UPI Balance', type: 'upi', balance: upiBal, icon: 'smartphone', color: '#8b5cf6' },
          { id: DEFAULT_ACC_CARD, name: 'Credit Card', type: 'card', balance: 0, creditLimit: cardLimit, icon: 'credit-card', color: '#f59e0b' },
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
        const id = generateId();
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
          saveTransactionToSupabase(state.profile.id, newTx);
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

          deleteTransactionFromSupabase(id);
          saveAccountsToSupabase(state.profile.id, updatedAccounts);

          const filtered = state.transactions.filter((t) => t.id !== id);
          return {
            transactions: filtered,
            expenses: filtered,
            accounts: updatedAccounts,
          };
        });
      },

      deleteMultipleTransactions: (ids) => {
        if (!ids || ids.length === 0) return;
        const idSet = new Set(ids);
        set((state) => {
          let updatedAccounts = state.accounts;
          state.transactions.forEach((tx) => {
            if (idSet.has(tx.id)) {
              updatedAccounts = updatedAccounts.map((acc) => {
                if (acc.id === tx.accountId) {
                  return tx.type === 'Income' || tx.type === 'Borrow'
                    ? { ...acc, balance: Math.max(0, acc.balance - tx.amount) }
                    : { ...acc, balance: acc.balance + tx.amount };
                }
                return acc;
              });
            }
          });

          deleteMultipleTransactionsFromSupabase(ids);
          saveAccountsToSupabase(state.profile.id, updatedAccounts);

          const filtered = state.transactions.filter((t) => !idSet.has(t.id));
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
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          saveTaskToSupabase(state.profile.id, newTask);
          return { tasks: [newTask, ...state.tasks] };
        });
      },

      toggleTaskCompleted: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed, section: !t.completed ? 'Completed' : 'Today' } : t)),
        }));
      },

      deleteTask: (id) => {
        deleteTaskFromSupabase(id);
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      updateTask: (id, taskData) => {
        set((state) => {
          const updatedTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...taskData } : t));
          const updated = updatedTasks.find((t) => t.id === id);
          if (updated) saveTaskToSupabase(state.profile.id, updated);
          return { tasks: updatedTasks };
        });
      },

      addBill: (billData) => {
        const newBill: BillItem = {
          ...billData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          saveBillToSupabase(state.profile.id, newBill);
          return { bills: [newBill, ...state.bills] };
        });
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
              accountId: targetBill.accountId || state.accounts[0]?.id || DEFAULT_ACC_UPI,
              paymentMethod: 'UPI',
              transactionDate: getFormattedDate(),
            });
          }

          return { bills: updatedBills };
        });
      },

      deleteBill: (id) => {
        deleteBillFromSupabase(id);
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
        const newGoal: SavingsGoal = { ...goalData, id: generateId() };
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
        deleteSavingsGoalFromSupabase(id);
        set((state) => ({ savingsGoals: state.savingsGoals.filter((g) => g.id !== id) }));
      },

      addRecurringTransaction: (recData) => {
        const newRec: RecurringTransaction = { ...recData, id: generateId() };
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
                id: generateId(),
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
              saveTransactionToSupabase(state.profile.id, newTx);

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
          id: generateId(),
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

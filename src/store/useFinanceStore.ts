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
import { useProductivityStore } from './useProductivityStore';
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

let lastTxTime = 0;
let lastTxKey = '';

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
        if (res && res.success) {
          set((state) => {
            // 1. Profile merging
            const remoteHasValidIncome = res.profile && parseFloat(res.profile.monthly_income || '0') > 0;
            const updatedProfile: UserProfile = {
              ...state.profile,
              ...(res.profile
                ? {
                    id: res.profile.id || state.profile.id,
                    name: res.profile.name && res.profile.name !== 'User' ? res.profile.name : state.profile.name,
                    monthlyIncome: remoteHasValidIncome ? parseFloat(res.profile.monthly_income) : state.profile.monthlyIncome,
                    salaryDate: res.profile.salary_date ? parseInt(String(res.profile.salary_date), 10) : state.profile.salaryDate,
                    savingsGoal: res.profile.savings_goal ? parseFloat(String(res.profile.savings_goal)) : state.profile.savingsGoal,
                    currency: res.profile.currency || state.profile.currency,
                  }
                : {}),
              isSetupComplete: state.profile.isSetupComplete || Boolean(res.profile),
            };

            // 2. Transactions merging (deduplicate by id, keep local + remote)
            const txMap = new Map<string, Transaction>();
            state.transactions.forEach((tx) => {
              if (tx && tx.id) txMap.set(tx.id, tx);
            });
            if (Array.isArray(res.transactions)) {
              res.transactions.forEach((tx) => {
                if (tx && tx.id) txMap.set(tx.id, tx);
              });
            }
            const mergedTxs = Array.from(txMap.values()).sort(
              (a, b) => new Date(b.transactionDate || b.createdAt || 0).getTime() - new Date(a.transactionDate || a.createdAt || 0).getTime()
            );

            // 3. Accounts merging
            let mergedAccounts = state.accounts;
            if (Array.isArray(res.accounts) && res.accounts.length > 0) {
              const remoteAccMap = new Map<string, any>();
              res.accounts.forEach((a: any) => {
                if (a && a.id) remoteAccMap.set(a.id, a);
              });
              mergedAccounts = state.accounts.map((acc) => {
                const remote = remoteAccMap.get(acc.id);
                if (remote) {
                  return {
                    ...acc,
                    name: remote.name || acc.name,
                    balance: typeof remote.balance !== 'undefined' ? parseFloat(remote.balance) : acc.balance,
                    creditLimit: typeof remote.credit_limit !== 'undefined' ? parseFloat(remote.credit_limit) : acc.creditLimit,
                  };
                }
                return acc;
              });
            }

            // 4. Budgets merging
            const budgetMap = new Map<string, CategoryBudget>();
            state.budgets.forEach((b) => {
              if (b && b.category) budgetMap.set(b.category, b);
            });
            if (Array.isArray(res.budgets)) {
              res.budgets.forEach((b) => {
                if (b && b.category) budgetMap.set(b.category, b);
              });
            }

            // 5. Savings Goals merging
            const goalMap = new Map<string, SavingsGoal>();
            state.savingsGoals.forEach((g) => {
              if (g && g.id) goalMap.set(g.id, g);
            });
            if (Array.isArray(res.goals)) {
              res.goals.forEach((g) => {
                if (g && g.id) goalMap.set(g.id, g);
              });
            }

            // 6. Tasks merging
            const taskMap = new Map<string, TaskItem>();
            state.tasks.forEach((t) => {
              if (t && t.id) taskMap.set(t.id, t);
            });
            if (Array.isArray(res.tasks)) {
              res.tasks.forEach((t) => {
                if (t && t.id) taskMap.set(t.id, t);
              });
            }

            // 7. Bills merging
            const billMap = new Map<string, BillItem>();
            state.bills.forEach((b) => {
              if (b && b.id) billMap.set(b.id, b);
            });
            if (Array.isArray(res.bills)) {
              res.bills.forEach((b) => {
                if (b && b.id) billMap.set(b.id, b);
              });
            }

            return {
              profile: updatedProfile,
              transactions: mergedTxs,
              expenses: mergedTxs,
              accounts: mergedAccounts,
              budgets: Array.from(budgetMap.values()),
              savingsGoals: Array.from(goalMap.values()),
              tasks: Array.from(taskMap.values()),
              bills: Array.from(billMap.values()),
              isLoading: false,
            };
          });

          // Sync enhancedTasks in Productivity Store
          const currentEnhanced = useProductivityStore.getState().enhancedTasks || [];
          const enhancedMap = new Map(currentEnhanced.map((t) => [t.id, t]));
          if (Array.isArray(res.tasks)) {
            res.tasks.forEach((t: any) => {
              if (t && t.id && !enhancedMap.has(t.id)) {
                enhancedMap.set(t.id, {
                  id: t.id,
                  title: t.title,
                  description: t.description || '',
                  priority: t.priority || 'Medium',
                  status: t.completed ? 'Completed' : 'Pending',
                  category: 'Work',
                  dueDate: t.dueDate || new Date().toISOString().slice(0, 10),
                  repeatType: 'Once' as const,
                  completed: Boolean(t.completed),
                  createdAt: t.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            });
          }
          useProductivityStore.setState({ enhancedTasks: Array.from(enhancedMap.values()) });
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
        const dateStr = txData.transactionDate || (txData as any).expenseDate || getFormattedDate();
        const titleStr = txData.title || (txData as any).description || `${txData.type || 'Expense'}: ${txData.category}`;
        const dedupeKey = `${titleStr}_${txData.amount}_${txData.category}_${dateStr}`;
        const now = Date.now();

        if (now - lastTxTime < 1500 && lastTxKey === dedupeKey) {
          console.warn('[Store] Duplicate transaction submission blocked within 1.5s window:', dedupeKey);
          return;
        }
        lastTxTime = now;
        lastTxKey = dedupeKey;

        const id = generateId();

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
        set((state) => {
          const updatedTasks: TaskItem[] = state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  section: (!t.completed ? 'Completed' : 'Today') as TaskItem['section'],
                }
              : t
          );
          const updated = updatedTasks.find((t) => t.id === id);
          if (updated) {
            saveTaskToSupabase(state.profile.id, updated);
          }
          return { tasks: updatedTasks };
        });
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
          const updatedBill = updatedBills.find((b) => b.id === id);
          if (updatedBill) {
            saveBillToSupabase(state.profile.id, updatedBill);
          }

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
        const p = get().profile;
        if (p.pinCode || p.isBiometricsEnabled) {
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
      onRehydrateStorage: () => (state) => {
        if (state && (state.profile?.pinCode || state.profile?.isBiometricsEnabled)) {
          state.isLocked = true;
        }
      },
    }
  )
);

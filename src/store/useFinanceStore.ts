import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  Account,
  Expense,
  CategoryBudget,
  SavingsGoal,
  RecurringTransaction,
  NotificationItem,
  SplitExpense,
  ExpenseCategory,
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
  expenses: Expense[];
  budgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
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
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  updateAccountBalance: (accountId: string, newBalance: number) => void;
  setCategoryBudget: (category: ExpenseCategory, monthlyLimit: number) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavedGoalAmount: (id: string, additionalAmount: number) => void;
  addRecurringTransaction: (rec: Omit<RecurringTransaction, 'id'>) => void;
  processRecurringDeductions: () => void;
  addSplitExpense: (split: Omit<SplitExpense, 'id' | 'createdAt'>) => void;
  settleSplitExpense: (id: string) => void;
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
  resetAllData: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_1',
  name: 'User',
  monthlyIncome: 40000,
  salaryDate: 1,
  savingsGoal: 10000,
  currency: '₹',
  isSetupComplete: false,
};

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_wallet', name: 'Wallet Cash', type: 'wallet', balance: 2000, icon: 'wallet', color: '#10b981' },
  { id: 'acc_bank', name: 'Bank Balance', type: 'bank', balance: 8000, icon: 'building', color: '#3b82f6' },
  { id: 'acc_upi', name: 'UPI Balance', type: 'upi', balance: 1500, icon: 'smartphone', color: '#8b5cf6' },
  { id: 'acc_card', name: 'Credit Card', type: 'card', balance: 0, creditLimit: 50000, icon: 'credit-card', color: '#f59e0b' },
];

const DEFAULT_BUDGETS: CategoryBudget[] = [
  { category: 'Food', monthlyLimit: 6000 },
  { category: 'Fuel', monthlyLimit: 3000 },
  { category: 'Shopping', monthlyLimit: 5000 },
  { category: 'Medical', monthlyLimit: 2000 },
  { category: 'Recharge', monthlyLimit: 1000 },
  { category: 'Entertainment', monthlyLimit: 3000 },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      accounts: DEFAULT_ACCOUNTS,
      expenses: [], // Pure real user data only - zero mock dummy entries
      budgets: DEFAULT_BUDGETS,
      savingsGoals: [],
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
        if (res.success && res.expenses) {
          set((state) => ({
            expenses: res.expenses.length > 0 ? res.expenses : state.expenses,
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
            isLoading: false,
          }));
        } else {
          set({ isLoading: false });
        }
      },

      setupUser: (profileData, walletBal, bankBal, upiBal, cardLimit = 50000) => {
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
          expenses: [], // Reset to clean slate for new setup
        });

        // Sync to Supabase DB asynchronously
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

      addExpense: (expenseData) => {
        const id = `exp_${Date.now()}`;
        const newExpense: Expense = {
          ...expenseData,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === expenseData.accountId || acc.name.toLowerCase().includes(expenseData.paymentMethod.toLowerCase())) {
              return { ...acc, balance: Math.max(0, acc.balance - expenseData.amount) };
            }
            return acc;
          });

          // Sync to Supabase DB
          saveExpenseToSupabase(state.profile.id, newExpense);
          saveAccountsToSupabase(state.profile.id, updatedAccounts);

          return {
            expenses: [newExpense, ...state.expenses],
            accounts: updatedAccounts,
          };
        });
      },

      deleteExpense: (id) => {
        set((state) => {
          const exp = state.expenses.find((e) => e.id === id);
          let updatedAccounts = state.accounts;
          if (exp) {
            updatedAccounts = state.accounts.map((acc) => {
              if (acc.id === exp.accountId) {
                return { ...acc, balance: acc.balance + exp.amount };
              }
              return acc;
            });
          }

          // Delete from Supabase DB
          deleteExpenseFromSupabase(id);
          saveAccountsToSupabase(state.profile.id, updatedAccounts);

          return {
            expenses: state.expenses.filter((e) => e.id !== id),
            accounts: updatedAccounts,
          };
        });
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

      addRecurringTransaction: (recData) => {
        const newRec: RecurringTransaction = { ...recData, id: `rec_${Date.now()}` };
        set((state) => ({ recurring: [...state.recurring, newRec] }));
      },

      processRecurringDeductions: () => {
        const todayStr = getFormattedDate();
        set((state) => {
          let updatedAccounts = [...state.accounts];
          const updatedExpenses = [...state.expenses];

          state.recurring.forEach((rec) => {
            if (rec.autoDeduct && rec.nextDueDate <= todayStr) {
              const newExp: Expense = {
                id: `exp_auto_${Date.now()}_${rec.id}`,
                accountId: rec.accountId,
                amount: rec.amount,
                category: rec.category,
                description: `Auto-Deduct: ${rec.title}`,
                paymentMethod: 'Auto Debit',
                expenseDate: todayStr,
                createdAt: new Date().toISOString(),
                isRecurring: true,
              };

              updatedExpenses.unshift(newExp);
              saveExpenseToSupabase(state.profile.id, newExp);

              updatedAccounts = updatedAccounts.map((a) =>
                a.id === rec.accountId ? { ...a, balance: Math.max(0, a.balance - rec.amount) } : a
              );
            }
          });

          saveAccountsToSupabase(state.profile.id, updatedAccounts);
          return { accounts: updatedAccounts, expenses: updatedExpenses };
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
          accounts: DEFAULT_ACCOUNTS,
          expenses: [],
          budgets: DEFAULT_BUDGETS,
          savingsGoals: [],
          recurring: [],
          splitExpenses: [],
          isLocked: false,
        });
      },
    }),
    {
      name: 'finance-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

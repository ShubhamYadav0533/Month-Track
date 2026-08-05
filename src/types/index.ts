export type ExpenseCategory =
  | 'Food'
  | 'Fuel'
  | 'Shopping'
  | 'Medical'
  | 'Recharge'
  | 'Travel'
  | 'Entertainment'
  | 'Rent'
  | 'Bills'
  | 'Others';

export type AccountType = 'wallet' | 'bank' | 'upi' | 'card';

export interface UserProfile {
  id: string;
  name: string;
  monthlyIncome: number;
  salaryDate: number; // Day of month e.g. 1
  savingsGoal: number;
  currency: string;
  isSetupComplete: boolean;
  pinCode?: string;
  isBiometricsEnabled?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  accountId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  paymentMethod: string;
  location?: string;
  receiptUrl?: string;
  expenseDate: string; // YYYY-MM-DD
  createdAt: string;
  isRecurring?: boolean;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  monthlyLimit: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  icon: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  frequency: 'monthly' | 'weekly' | 'daily';
  nextDueDate: string;
  autoDeduct: boolean;
  accountId: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isRead: boolean;
  createdAt: string;
}

export interface SplitExpense {
  id: string;
  title: string;
  totalAmount: number;
  myShare: number;
  friendName: string;
  friendShare: number;
  isSettled: boolean;
  createdAt: string;
}

export interface DailyBudgetStats {
  totalMoney: number;
  remainingDays: number;
  safeToSpendDaily: number;
  spentToday: number;
  remainingToday: number;
  carryForward: number;
  effectiveTodayBudget: number;
  velocityPerDay: number;
  predictedDaysUntilDepletion: number;
  monthlySavingsPercentage: number;
}

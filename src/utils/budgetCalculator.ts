import { Account, Expense, UserProfile, DailyBudgetStats } from '../types';

/**
 * Calculates remaining days until the next salary date.
 * Default salary date: 1st of month.
 */
export function getRemainingDays(salaryDateDay: number = 1): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  let nextSalaryDate: Date;
  if (currentDay < salaryDateDay) {
    nextSalaryDate = new Date(currentYear, currentMonth, salaryDateDay);
  } else {
    // Next month's salary date
    nextSalaryDate = new Date(currentYear, currentMonth + 1, salaryDateDay);
  }

  const diffMs = nextSalaryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Get YYYY-MM-DD formatted date string
 */
export function getFormattedDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Core Daily Budget Engine
 */
export function calculateDailyBudgetStats(
  profile: UserProfile,
  accounts: Account[],
  expenses: Expense[]
): DailyBudgetStats {
  // 1. Calculate Total Liquid Balance (Wallet + Bank + UPI)
  const liquidAccounts = accounts.filter(a => a.type !== 'card');
  const totalMoney = liquidAccounts.reduce((acc, curr) => acc + curr.balance, 0);

  // 2. Calculate Days Left until salary date
  const remainingDays = getRemainingDays(profile.salaryDate || 1);

  // 3. Base Safe To Spend Daily (Total Liquid Money / Remaining Days)
  const safeToSpendDaily = Math.max(0, Math.floor(totalMoney / remainingDays));

  // 4. Calculate Spent Today
  const todayStr = getFormattedDate();
  const todayExpenses = expenses.filter(e => e.expenseDate === todayStr);
  const spentToday = todayExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // 5. Calculate Yesterday's Budget vs Spent for Carry Forward Math
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getFormattedDate(yesterday);
  const yesterdayExpenses = expenses.filter(e => e.expenseDate === yesterdayStr);
  const spentYesterday = yesterdayExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Yesterday Carry Forward Difference (SafeDaily - SpentYesterday)
  const carryForward = safeToSpendDaily - spentYesterday;
  const effectiveTodayBudget = Math.max(0, safeToSpendDaily + (spentYesterday > 0 ? carryForward : 0));
  const remainingToday = effectiveTodayBudget - spentToday;

  // 6. Calculate Velocity (Average spend over last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentExpenses = expenses.filter(e => new Date(e.expenseDate) >= sevenDaysAgo);
  const totalRecentSpent = recentExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const velocityPerDay = Math.round(totalRecentSpent / 7) || Math.round(spentToday);

  // 7. Predicted Days Until Depletion
  const predictedDaysUntilDepletion = velocityPerDay > 0
    ? Math.max(1, Math.floor(totalMoney / velocityPerDay))
    : remainingDays;

  // 8. Monthly Savings Percentage Progress
  const savingsTarget = profile.savingsGoal || 1;
  const currentSavedEst = Math.max(0, profile.monthlyIncome - (totalMoney > 0 ? (profile.monthlyIncome - totalMoney) : 0));
  const monthlySavingsPercentage = Math.min(100, Math.round((currentSavedEst / savingsTarget) * 100));

  return {
    totalMoney,
    remainingDays,
    safeToSpendDaily,
    spentToday,
    remainingToday,
    carryForward,
    effectiveTodayBudget,
    velocityPerDay,
    predictedDaysUntilDepletion,
    monthlySavingsPercentage,
  };
}

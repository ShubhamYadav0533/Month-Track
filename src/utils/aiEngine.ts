import { Expense, CategoryBudget, NotificationItem, UserProfile } from '../types';
import { getFormattedDate } from './budgetCalculator';

export interface AISuggestion {
  id: string;
  type: 'warning' | 'tip' | 'praise' | 'prediction';
  title: string;
  message: string;
  timestamp: string;
}

export function generateAISuggestions(
  expenses: Expense[],
  budgets: CategoryBudget[],
  profile: UserProfile,
  remainingDays: number,
  predictedDays: number
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const todayStr = getFormattedDate();

  // 1. Check Depletion Velocity Warning
  if (predictedDays < remainingDays) {
    suggestions.push({
      id: 'pred-warning',
      type: 'warning',
      title: '⚡ Fast Spending Velocity Alert',
      message: `At your current spending rate, you will run out of money in ${predictedDays} days instead of ${remainingDays} days left until salary!`,
      timestamp: todayStr,
    });
  }

  // 2. Compare Food Expenses (This Week vs Last Week)
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(now.getDate() - 14);

  const thisWeekFood = expenses
    .filter(e => e.category === 'Food' && new Date(e.expenseDate) >= oneWeekAgo)
    .reduce((sum, e) => sum + e.amount, 0);

  const lastWeekFood = expenses
    .filter(e => e.category === 'Food' && new Date(e.expenseDate) >= twoWeeksAgo && new Date(e.expenseDate) < oneWeekAgo)
    .reduce((sum, e) => sum + e.amount, 0);

  if (lastWeekFood > 0 && thisWeekFood > lastWeekFood * 1.25) {
    const percentInc = Math.round(((thisWeekFood - lastWeekFood) / lastWeekFood) * 100);
    suggestions.push({
      id: 'food-inc-warning',
      type: 'warning',
      title: '⚠️ Food Spending Spike',
      message: `Food expenses increased ${percentInc}% compared to last week (${profile.currency}${thisWeekFood} vs ${profile.currency}${lastWeekFood}).`,
      timestamp: todayStr,
    });
  }

  // 3. Category Budget Limit Exceeded Warnings
  budgets.forEach(b => {
    const categorySpent = expenses
      .filter(e => e.category === b.category)
      .reduce((sum, e) => sum + e.amount, 0);

    if (categorySpent > b.monthlyLimit) {
      suggestions.push({
        id: `budget-exceeded-${b.category}`,
        type: 'warning',
        title: `⚠️ ${b.category} Budget Exceeded`,
        message: `${b.category} spent (${profile.currency}${categorySpent}) has exceeded your monthly budget of ${profile.currency}${b.monthlyLimit}.`,
        timestamp: todayStr,
      });
    }
  });

  // 4. Saving Praise / Positive Reinforcement
  const thisWeekTotalSpent = expenses
    .filter(e => new Date(e.expenseDate) >= oneWeekAgo)
    .reduce((sum, e) => sum + e.amount, 0);

  const weeklyIncome = Math.round(profile.monthlyIncome / 4);
  if (thisWeekTotalSpent > 0 && thisWeekTotalSpent < weeklyIncome * 0.7) {
    const savedAmount = Math.round(weeklyIncome - thisWeekTotalSpent);
    suggestions.push({
      id: 'weekly-praise',
      type: 'praise',
      title: '🎉 Excellent Savings!',
      message: `You saved ${profile.currency}${savedAmount} this week! Keep up the momentum.`,
      timestamp: todayStr,
    });
  }

  // 5. Intelligent Actionable Tip
  suggestions.push({
    id: 'smart-tip-1',
    type: 'tip',
    title: '💡 Smart AI Tip',
    message: `Setting automated rules for recurring bills (Rent, Wifi, Recharge) prevents unexpected daily budget drops.`,
    timestamp: todayStr,
  });

  return suggestions;
}

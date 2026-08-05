import { Expense, UserProfile, Account } from '../types';

export function exportExpensesToCSV(expenses: Expense[], currency: string = '₹'): string {
  const headers = ['ID', 'Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Location'];
  const rows = expenses.map(e => [
    e.id,
    e.expenseDate,
    `"${e.category}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    `${e.amount}`,
    `"${e.paymentMethod}"`,
    `"${e.location || 'N/A'}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateBackupJSON(profile: UserProfile, accounts: Account[], expenses: Expense[]): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile,
    accounts,
    expenses,
  };
  return JSON.stringify(data, null, 2);
}

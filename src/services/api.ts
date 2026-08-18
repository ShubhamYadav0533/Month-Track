const LOCAL_BACKEND_URL = 'http://localhost:5001/api';
const PROD_BACKEND_URL = 'https://month-track.onrender.com/api';

// In local development (__DEV__ is true), default to local backend URL.
// When building APK / production bundle (__DEV__ is false), automatically use the production URL.
export const API_BASE_URL = __DEV__
  ? process.env.EXPO_PUBLIC_BACKEND_URL || LOCAL_BACKEND_URL
  : PROD_BACKEND_URL;

export interface SyncSetupPayload {
  name: string;
  email?: string;
  monthlyIncome: number;
  salaryDate: number;
  savingsGoal: number;
  currency: string;
  walletBal: number;
  bankBal: number;
  upiBal: number;
  cardLimit?: number;
}

export async function syncUserSetupToBackend(payload: SyncSetupPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/user/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend server offline, saved locally to AsyncStorage:', err);
    return null;
  }
}

export async function syncExpenseToBackend(expense: {
  userId?: string;
  accountId?: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  location?: string;
  receiptUrl?: string;
  expenseDate: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend server offline, saved locally to AsyncStorage:', err);
    return null;
  }
}

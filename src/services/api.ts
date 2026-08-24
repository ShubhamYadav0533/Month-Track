const LOCAL_BACKEND_URL = 'http://localhost:5001/api';
const PROD_BACKEND_URL = 'https://month-track.onrender.com/api';

// In local development (__DEV__ is true), default to local backend URL.
// When building APK / production bundle (__DEV__ is false), automatically use the production URL.
export const API_BASE_URL = __DEV__
  ? process.env.EXPO_PUBLIC_BACKEND_URL || LOCAL_BACKEND_URL
  : PROD_BACKEND_URL;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

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
    const res = await fetchWithTimeout(`${API_BASE_URL}/user/setup`, {
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
  transactionDate?: string;
}) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/expenses`, {
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

export async function fetchExpensesFromBackend() {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/expenses`);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.expenses)) {
      return data.expenses;
    }
    return [];
  } catch (err) {
    console.warn('Backend server offline or fetch error:', err);
    return [];
  }
}

export async function deleteExpenseFromBackend(id: string) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend delete expense error:', err);
    return null;
  }
}

export async function deleteMultipleExpensesFromBackend(ids: string[]) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/expenses/delete-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend batch delete expenses error:', err);
    return null;
  }
}



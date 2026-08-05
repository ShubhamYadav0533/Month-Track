import { ExpenseCategory } from '../types';

export interface ParsedReceipt {
  storeName: string;
  amount: number;
  taxAmount: number;
  date: string;
  category: ExpenseCategory;
  description: string;
}

/**
 * Intelligent Receipt OCR Parser Simulator
 * Extracts store name, total amount, GST, date, and maps category automatically.
 */
export function parseReceiptImage(imageUri: string): Promise<ParsedReceipt> {
  return new Promise((resolve) => {
    // Simulate OCR processing time
    setTimeout(() => {
      const mockStores = [
        { name: 'Star Supermarket', category: 'Food' as ExpenseCategory, amount: 840, tax: 42, desc: 'Groceries & Snacks' },
        { name: 'Indian Oil Fuel Station', category: 'Fuel' as ExpenseCategory, amount: 500, tax: 25, desc: 'Petrol Refill' },
        { name: 'Apollo Pharmacy', category: 'Medical' as ExpenseCategory, amount: 350, tax: 18, desc: 'Medicines & Wellness' },
        { name: 'Zara Clothing', category: 'Shopping' as ExpenseCategory, amount: 2499, tax: 125, desc: 'Apparel & Fashion' },
        { name: 'Cafe Coffee Day', category: 'Food' as ExpenseCategory, amount: 280, tax: 14, desc: 'Coffee & Breakfast' },
      ];

      const randomIndex = Math.floor(Math.random() * mockStores.length);
      const selected = mockStores[randomIndex];

      const today = new Date().toISOString().split('T')[0];

      resolve({
        storeName: selected.name,
        amount: selected.amount,
        taxAmount: selected.tax,
        date: today,
        category: selected.category,
        description: selected.desc,
      });
    }, 1200);
  });
}

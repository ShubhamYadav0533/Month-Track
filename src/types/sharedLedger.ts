export type PersonStatus = 'active' | 'inactive';

export type GroupCategory =
  | 'Room'
  | 'Flat'
  | 'Friends'
  | 'Trip'
  | 'Family'
  | 'Office'
  | 'Custom';

export type SharedExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Internet'
  | 'Water'
  | 'Grocery'
  | 'Food'
  | 'Maintenance'
  | 'Travel'
  | 'Bills'
  | 'Other';

export type SplitType = 'equal' | 'exact' | 'percentage' | 'share';

export type LoanType = 'LEND' | 'BORROW';

export type LoanStatus = 'Pending' | 'Partially Paid' | 'Fully Paid' | 'Overdue';

export type LedgerTransactionType =
  | 'EXPENSE'
  | 'CONTRIBUTION'
  | 'LEND'
  | 'BORROW'
  | 'REPAYMENT'
  | 'ADJUSTMENT'
  | 'SETTLEMENT';

export type LedgerTransactionStatus = 'active' | 'voided' | 'adjusted';

export interface Person {
  id: string;
  userId: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  avatarUrl?: string;
  notes?: string;
  status: PersonStatus;
  createdAt: string;
}

export interface Group {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: GroupCategory;
  currency: string;
  status: PersonStatus;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  personId: string;
  joinedAt: string;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  personId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface SharedExpense {
  id: string;
  groupId: string;
  userId: string;
  category: SharedExpenseCategory;
  description: string;
  totalAmount: number;
  paidByPersonId: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  splitType: SplitType;
  splits: ExpenseSplit[];
  status: LedgerTransactionStatus;
  createdAt: string;
}

export interface Contribution {
  id: string;
  groupId: string;
  expenseId: string;
  personId: string;
  amountPaid: number;
  date: string;
  notes?: string;
}

export interface Loan {
  id: string;
  userId: string;
  personId: string;
  type: LoanType;
  originalAmount: number;
  remainingAmount: number;
  repaidAmount: number;
  date: string;
  dueDate?: string;
  description: string;
  paymentMethod: string;
  status: LoanStatus;
  createdAt: string;
}

export interface Repayment {
  id: string;
  loanId?: string;
  personId: string;
  fromPersonId: string;
  toPersonId: string;
  amount: number;
  date: string;
  notes?: string;
  status: LoanStatus;
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId?: string;
  fromPersonId: string;
  toPersonId: string;
  amount: number;
  month: string;
  date: string;
  notes?: string;
  status: 'Pending' | 'Settled';
  createdAt: string;
}

export interface LedgerTransaction {
  id: string;
  groupId?: string;
  userId: string;
  personId?: string;
  type: LedgerTransactionType;
  amount: number;
  currency: string;
  date: string;
  month: string;
  description: string;
  createdBy: string;
  relatedTransactionId?: string;
  status: LedgerTransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyLedger {
  month: string; // YYYY-MM
  openingBalance: number;
  newExpenses: number;
  userContributions: number;
  moneyLent: number;
  moneyBorrowed: number;
  repaymentsReceived: number;
  repaymentsPaid: number;
  adjustments: number;
  amountReceivable: number;
  amountPayable: number;
  closingBalance: number;
  unsettledAmount: number;
}

export interface MonthlyChartDataPoint {
  month: string; // e.g. "Aug 2026"
  monthKey: string; // "2026-08"
  totalExpenses: number;
  myPaidAmount: number;
  myShare: number;
  netPosition: number;
  lentAmount: number;
  borrowedAmount: number;
}

export interface SettlementTransfer {
  fromPersonId: string;
  fromPersonName: string;
  toPersonId: string;
  toPersonName: string;
  amount: number;
}

export interface PersonBalanceSummary {
  person: Person;
  totalLent: number;
  totalBorrowed: number;
  totalPaid: number;
  totalReceived: number;
  expenseResponsibility: number;
  netBalance: number; // positive = owes me, negative = I owe person
  statusLabel: string;
  lastTransactionDate?: string;
}

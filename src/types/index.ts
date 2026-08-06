export type ExpenseCategory =
  | 'Food'
  | 'Groceries'
  | 'Fuel'
  | 'Rent'
  | 'Electricity'
  | 'Gas'
  | 'Internet'
  | 'Shopping'
  | 'Travel'
  | 'Medical'
  | 'Education'
  | 'Salary'
  | 'Business'
  | 'Investment'
  | 'Entertainment'
  | 'Recharge'
  | 'Insurance'
  | 'EMI'
  | 'Bills'
  | 'Emergency'
  | 'Others';

export type TransactionType =
  | 'Expense'
  | 'Income'
  | 'Transfer'
  | 'Borrow'
  | 'Lend'
  | 'EMI'
  | 'Investment';

export type PaymentMethod = 'Wallet' | 'Bank' | 'UPI' | 'Credit Card' | 'Cash';

export type AccountType = 'wallet' | 'bank' | 'upi' | 'card' | 'cash';

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

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory;
  subCategory?: string;
  accountId: string;
  paymentMethod: PaymentMethod;
  transactionDate: string; // YYYY-MM-DD
  expenseDate?: string; // Optional backward compatibility alias
  description?: string; // Optional backward compatibility alias
  receiptUrl?: string;
  time?: string;
  recurring?: boolean;
  notes?: string;
  attachment?: string;
  location?: string;
  tags?: string[];
  createdAt: string;
}

// Backward compatibility alias for Expense
export type Expense = Transaction;

export interface CategoryBudget {
  category: ExpenseCategory;
  monthlyLimit: number;
  spent?: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  icon: string;
  category?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  priority: 'Low' | 'Medium' | 'High';
  section: 'Today' | 'Upcoming' | 'Important' | 'Completed';
  completed: boolean;
  reminderDate?: string;
  createdAt: string;
}

export interface BillItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  recurring: boolean;
  status: 'Pending' | 'Paid';
  category?: ExpenseCategory;
  accountId?: string;
  createdAt: string;
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

// ─────────────────────────────────────────────────
// HRMS — Attendance Management System Types
// ─────────────────────────────────────────────────

export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'Half Day'
  | 'Absent'
  | 'Holiday'
  | 'Leave'
  | 'Work From Home'
  | 'On Break';

export type LeaveType =
  | 'Casual'
  | 'Sick'
  | 'Paid'
  | 'Unpaid'
  | 'Emergency'
  | 'Half Day'
  | 'Work From Home';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: string;
  shiftId: string;
  officeLocation: string;
  managerName: string;
  avatarUrl?: string;
  isSetupComplete: boolean;
  pinCode?: string;
  isBiometricsEnabled?: boolean;
}

export interface Shift {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  requiredHours: number;
  breakMinutes: number;
  graceMinutes: number;
}

export interface OfficeLocation {
  id: string;
  officeName: string;
  latitude: number;
  longitude: number;
  allowedRadius: number;
}

export interface BreakRecord {
  id: string;
  attendanceId: string;
  breakStart: string;
  breakEnd?: string;
  durationMinutes: number;
  breakType: 'Lunch' | 'Tea/Coffee' | 'Personal' | 'Other';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  totalWorkMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatus;
  notes?: string;
  gpsLocation?: string;
  officeName?: string;
  deviceName?: string;
  networkType?: string;
  batteryPct?: number;
  ipAddress?: string;
  photoUrl?: string;
  breaks?: BreakRecord[];
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachment?: string;
  status: LeaveStatus;
  approvedBy?: string;
  comments?: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  holidayName: string;
  holidayDate: string;
  isOptional: boolean;
}

export interface AttendanceStats {
  monthlyAttendancePct: number;
  totalWorkingHours: number;
  overtimeHours: number;
  lateArrivalsCount: number;
  leavesRemaining: number;
  pendingLeaveRequests: number;
  presentDaysCount: number;
  absentDaysCount: number;
  leaveDaysCount: number;
  averageDailyHours: number;
}

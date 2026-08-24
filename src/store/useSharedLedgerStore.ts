import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Person,
  Group,
  GroupMember,
  SharedExpense,
  SplitType,
  Loan,
  Repayment,
  Settlement,
  LedgerTransaction,
  MonthlyLedger,
  SettlementTransfer,
  PersonBalanceSummary,
  SharedExpenseCategory,
  LoanType,
} from '../types/sharedLedger';
import { generateId } from '../utils/generateId';
import {
  calculateExpenseSplits,
  calculatePersonBalances,
  minimizeSettlementTransfers,
  calculateMonthlyLedger,
  generateMonthlyChartSeries,
  roundMoney,
} from '../services/sharedLedgerEngine';
import {
  savePersonToSupabase,
  saveGroupToSupabase,
  saveSharedExpenseToSupabase,
  saveLoanToSupabase,
  saveRepaymentToSupabase,
  saveSettlementToSupabase,
  fetchFullSharedLedgerFromSupabase,
} from '../services/supabaseSharedLedgerService';

interface SharedLedgerState {
  people: Person[];
  groups: Group[];
  groupMembers: GroupMember[];
  sharedExpenses: SharedExpense[];
  loans: Loan[];
  repayments: Repayment[];
  settlements: Settlement[];
  ledgerTransactions: LedgerTransaction[];
  isLoading: boolean;
  selectedMonth: string; // YYYY-MM

  // People Actions
  addPerson: (data: Omit<Person, 'id' | 'userId' | 'createdAt'>) => string;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  togglePersonStatus: (id: string) => void;
  deletePerson: (id: string) => void;

  // Group Actions
  addGroup: (data: Omit<Group, 'id' | 'userId' | 'createdAt'>, memberPersonIds: string[]) => string;
  updateGroup: (id: string, updates: Partial<Group>, memberPersonIds?: string[]) => void;
  deleteGroup: (id: string) => void;

  // Expense Actions
  addSharedExpense: (expense: {
    groupId: string;
    category: SharedExpenseCategory;
    description: string;
    totalAmount: number;
    paidByPersonId: string;
    date: string;
    month?: string;
    splitType: SplitType;
    customSplits?: { personId: string; value: number }[];
  }) => string;
  voidSharedExpense: (id: string) => void;

  // Loan & Repayment Actions
  addLoan: (loan: {
    personId: string;
    type: LoanType;
    amount: number;
    date: string;
    dueDate?: string;
    description: string;
    paymentMethod: string;
  }) => string;
  recordRepayment: (repayment: {
    loanId?: string;
    personId: string;
    fromPersonId: string;
    toPersonId: string;
    amount: number;
    date: string;
    notes?: string;
  }) => string;

  // Settlement Actions
  recordSettlement: (settlement: {
    groupId?: string;
    fromPersonId: string;
    toPersonId: string;
    amount: number;
    month: string;
    date: string;
    notes?: string;
  }) => void;

  // Month navigation
  setSelectedMonth: (month: string) => void;
  loadSupabaseSharedLedger: (userId: string) => Promise<void>;

  // Getters
  getPersonBalanceSummaries: (monthFilter?: string, groupFilter?: string) => PersonBalanceSummary[];
  getMinimizedSettlements: (monthFilter?: string, groupFilter?: string) => SettlementTransfer[];
  getMonthlyLedgerReport: (month: string) => MonthlyLedger;
  getMonthlyChartSeries: (myPersonId?: string) => ReturnType<typeof generateMonthlyChartSeries>;
}

// Initial seed data for immediate demonstration
const DEFAULT_SHUBHAM_ID = '00000000-0000-4000-p000-000000000001';
const DEFAULT_RAHUL_ID   = '00000000-0000-4000-p000-000000000002';
const DEFAULT_AMIT_ID    = '00000000-0000-4000-p000-000000000003';
const DEFAULT_GROUP_ID   = '00000000-0000-4000-g000-000000000001';

const INITIAL_PEOPLE: Person[] = [
  { id: DEFAULT_SHUBHAM_ID, userId: '00000000-0000-4000-a000-000000000001', name: 'Shubham (Me)', phoneNumber: '+91 9876543210', email: 'shubham@example.com', status: 'active', notes: 'Primary user account', createdAt: new Date().toISOString() },
  { id: DEFAULT_RAHUL_ID, userId: '00000000-0000-4000-a000-000000000001', name: 'Rahul', phoneNumber: '+91 9876543211', email: 'rahul@example.com', status: 'active', notes: 'Flatmate - Room 302', createdAt: new Date().toISOString() },
  { id: DEFAULT_AMIT_ID, userId: '00000000-0000-4000-a000-000000000001', name: 'Amit', phoneNumber: '+91 9876543212', email: 'amit@example.com', status: 'active', notes: 'Flatmate - Room 302', createdAt: new Date().toISOString() },
];

const INITIAL_GROUPS: Group[] = [
  { id: DEFAULT_GROUP_ID, userId: '00000000-0000-4000-a000-000000000001', name: 'Room 302 Flat', description: 'Monthly shared rent, bills, groceries', category: 'Room', currency: '₹', status: 'active', createdAt: new Date().toISOString() },
];

const INITIAL_MEMBERS: GroupMember[] = [
  { id: 'gm_1', groupId: DEFAULT_GROUP_ID, personId: DEFAULT_SHUBHAM_ID, joinedAt: new Date().toISOString() },
  { id: 'gm_2', groupId: DEFAULT_GROUP_ID, personId: DEFAULT_RAHUL_ID, joinedAt: new Date().toISOString() },
  { id: 'gm_3', groupId: DEFAULT_GROUP_ID, personId: DEFAULT_AMIT_ID, joinedAt: new Date().toISOString() },
];

// Initial demo expenses from Section 20 scenario
const INITIAL_EXPENSES: SharedExpense[] = [
  {
    id: 'exp_aug_rent',
    groupId: DEFAULT_GROUP_ID,
    userId: '00000000-0000-4000-a000-000000000001',
    category: 'Rent',
    description: 'August Room Rent',
    totalAmount: 12000,
    paidByPersonId: DEFAULT_SHUBHAM_ID,
    date: '2026-08-01',
    month: '2026-08',
    splitType: 'equal',
    status: 'active',
    createdAt: new Date().toISOString(),
    splits: [
      { id: 'sp_1', expenseId: 'exp_aug_rent', personId: DEFAULT_SHUBHAM_ID, amount: 4000 },
      { id: 'sp_2', expenseId: 'exp_aug_rent', personId: DEFAULT_RAHUL_ID, amount: 4000 },
      { id: 'sp_3', expenseId: 'exp_aug_rent', personId: DEFAULT_AMIT_ID, amount: 4000 },
    ],
  },
  {
    id: 'exp_aug_elec',
    groupId: DEFAULT_GROUP_ID,
    userId: '00000000-0000-4000-a000-000000000001',
    category: 'Electricity',
    description: 'August Electricity Bill',
    totalAmount: 3000,
    paidByPersonId: DEFAULT_RAHUL_ID,
    date: '2026-08-05',
    month: '2026-08',
    splitType: 'equal',
    status: 'active',
    createdAt: new Date().toISOString(),
    splits: [
      { id: 'sp_4', expenseId: 'exp_aug_elec', personId: DEFAULT_SHUBHAM_ID, amount: 1000 },
      { id: 'sp_5', expenseId: 'exp_aug_elec', personId: DEFAULT_RAHUL_ID, amount: 1000 },
      { id: 'sp_6', expenseId: 'exp_aug_elec', personId: DEFAULT_AMIT_ID, amount: 1000 },
    ],
  },
  {
    id: 'exp_aug_wifi',
    groupId: DEFAULT_GROUP_ID,
    userId: '00000000-0000-4000-a000-000000000001',
    category: 'Internet',
    description: 'WiFi Unlimited Plan',
    totalAmount: 1500,
    paidByPersonId: DEFAULT_AMIT_ID,
    date: '2026-08-10',
    month: '2026-08',
    splitType: 'equal',
    status: 'active',
    createdAt: new Date().toISOString(),
    splits: [
      { id: 'sp_7', expenseId: 'exp_aug_wifi', personId: DEFAULT_SHUBHAM_ID, amount: 500 },
      { id: 'sp_8', expenseId: 'exp_aug_wifi', personId: DEFAULT_RAHUL_ID, amount: 500 },
      { id: 'sp_9', expenseId: 'exp_aug_wifi', personId: DEFAULT_AMIT_ID, amount: 500 },
    ],
  },
];

const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan_rahul_1',
    userId: '00000000-0000-4000-a000-000000000001',
    personId: DEFAULT_RAHUL_ID,
    type: 'LEND',
    originalAmount: 5000,
    remainingAmount: 3000,
    repaidAmount: 2000,
    date: '2026-08-15',
    dueDate: '2026-09-01',
    description: 'Emergency Cash Advance',
    paymentMethod: 'UPI',
    status: 'Partially Paid',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_REPAYMENTS: Repayment[] = [
  {
    id: 'rep_rahul_1',
    loanId: 'loan_rahul_1',
    personId: DEFAULT_RAHUL_ID,
    fromPersonId: DEFAULT_RAHUL_ID,
    toPersonId: DEFAULT_SHUBHAM_ID,
    amount: 2000,
    date: '2026-08-20',
    notes: 'GPay Partial Transfer',
    status: 'Partially Paid',
    createdAt: new Date().toISOString(),
  },
];

export const useSharedLedgerStore = create<SharedLedgerState>()(
  persist(
    (set, get) => ({
      people: INITIAL_PEOPLE,
      groups: INITIAL_GROUPS,
      groupMembers: INITIAL_MEMBERS,
      sharedExpenses: INITIAL_EXPENSES,
      loans: INITIAL_LOANS,
      repayments: INITIAL_REPAYMENTS,
      settlements: [],
      ledgerTransactions: [],
      isLoading: false,
      selectedMonth: new Date().toISOString().slice(0, 7),

      setSelectedMonth: (month) => set({ selectedMonth: month }),

      // ── People Actions ──
      addPerson: (data) => {
        const id = generateId();
        const newPerson: Person = {
          ...data,
          id,
          userId: '00000000-0000-4000-a000-000000000001',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ people: [...state.people, newPerson] }));
        savePersonToSupabase(newPerson);
        return id;
      },

      updatePerson: (id, updates) => {
        set((state) => {
          const updated = state.people.map((p) => (p.id === id ? { ...p, ...updates } : p));
          const target = updated.find((p) => p.id === id);
          if (target) savePersonToSupabase(target);
          return { people: updated };
        });
      },

      togglePersonStatus: (id) => {
        set((state) => {
          const updated = state.people.map((p) =>
            p.id === id ? { ...p, status: p.status === 'active' ? ('inactive' as const) : ('active' as const) } : p
          );
          const target = updated.find((p) => p.id === id);
          if (target) savePersonToSupabase(target);
          return { people: updated };
        });
      },

      deletePerson: (id) => {
        set((state) => ({
          people: state.people.filter((p) => p.id !== id),
          groupMembers: state.groupMembers.filter((gm) => gm.personId !== id),
        }));
      },

      // ── Group Actions ──
      addGroup: (data, memberPersonIds) => {
        const groupId = generateId();
        const newGroup: Group = {
          ...data,
          id: groupId,
          userId: '00000000-0000-4000-a000-000000000001',
          createdAt: new Date().toISOString(),
        };

        const newMembers: GroupMember[] = memberPersonIds.map((pId) => ({
          id: generateId(),
          groupId,
          personId: pId,
          joinedAt: new Date().toISOString(),
        }));

        set((state) => ({
          groups: [...state.groups, newGroup],
          groupMembers: [...state.groupMembers, ...newMembers],
        }));

        saveGroupToSupabase(newGroup, memberPersonIds);
        return groupId;
      },

      updateGroup: (id, updates, memberPersonIds) => {
        set((state) => {
          const updatedGroups = state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g));
          let updatedMembers = state.groupMembers;

          if (memberPersonIds) {
            const currentFiltered = state.groupMembers.filter((gm) => gm.groupId !== id);
            const addedMembers: GroupMember[] = memberPersonIds.map((pId) => ({
              id: generateId(),
              groupId: id,
              personId: pId,
              joinedAt: new Date().toISOString(),
            }));
            updatedMembers = [...currentFiltered, ...addedMembers];
          }

          const target = updatedGroups.find((g) => g.id === id);
          if (target) saveGroupToSupabase(target, memberPersonIds || []);

          return { groups: updatedGroups, groupMembers: updatedMembers };
        });
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
          groupMembers: state.groupMembers.filter((gm) => gm.groupId !== id),
          sharedExpenses: state.sharedExpenses.filter((e) => e.groupId !== id),
        }));
      },

      // ── Expense Actions ──
      addSharedExpense: (expData) => {
        const expenseId = generateId();
        const dateStr = expData.date || new Date().toISOString().slice(0, 10);
        const monthStr = expData.month || dateStr.slice(0, 7);

        // Fetch group members for splitting
        const memberIds = get()
          .groupMembers.filter((gm) => gm.groupId === expData.groupId)
          .map((gm) => gm.personId);

        const splits = calculateExpenseSplits(
          expData.totalAmount,
          memberIds.length > 0 ? memberIds : [expData.paidByPersonId],
          expData.splitType,
          expData.customSplits
        );

        const newExpense: SharedExpense = {
          id: expenseId,
          groupId: expData.groupId,
          userId: '00000000-0000-4000-a000-000000000001',
          category: expData.category,
          description: expData.description,
          totalAmount: roundMoney(expData.totalAmount),
          paidByPersonId: expData.paidByPersonId,
          date: dateStr,
          month: monthStr,
          splitType: expData.splitType,
          splits: splits.map((s) => ({ ...s, expenseId })),
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        const auditTx: LedgerTransaction = {
          id: generateId(),
          groupId: expData.groupId,
          userId: '00000000-0000-4000-a000-000000000001',
          personId: expData.paidByPersonId,
          type: 'EXPENSE',
          amount: newExpense.totalAmount,
          currency: '₹',
          date: dateStr,
          month: monthStr,
          description: `Added Expense: ${newExpense.description}`,
          createdBy: 'User',
          relatedTransactionId: expenseId,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          sharedExpenses: [newExpense, ...state.sharedExpenses],
          ledgerTransactions: [auditTx, ...state.ledgerTransactions],
        }));

        saveSharedExpenseToSupabase(newExpense);
        return expenseId;
      },

      voidSharedExpense: (id) => {
        set((state) => {
          const updated = state.sharedExpenses.map((e) =>
            e.id === id ? { ...e, status: 'voided' as const } : e
          );
          const target = updated.find((e) => e.id === id);
          if (target) saveSharedExpenseToSupabase(target);
          return { sharedExpenses: updated };
        });
      },

      // ── Loan & Repayment Actions ──
      addLoan: (loanData) => {
        const loanId = generateId();
        const amt = roundMoney(loanData.amount);

        const newLoan: Loan = {
          id: loanId,
          userId: '00000000-0000-4000-a000-000000000001',
          personId: loanData.personId,
          type: loanData.type,
          originalAmount: amt,
          remainingAmount: amt,
          repaidAmount: 0,
          date: loanData.date,
          dueDate: loanData.dueDate,
          description: loanData.description,
          paymentMethod: loanData.paymentMethod,
          status: 'Pending',
          createdAt: new Date().toISOString(),
        };

        const auditTx: LedgerTransaction = {
          id: generateId(),
          userId: '00000000-0000-4000-a000-000000000001',
          personId: loanData.personId,
          type: loanData.type,
          amount: amt,
          currency: '₹',
          date: loanData.date,
          month: loanData.date.slice(0, 7),
          description: `${loanData.type === 'LEND' ? 'Lent to' : 'Borrowed from'} ${loanData.description}`,
          createdBy: 'User',
          relatedTransactionId: loanId,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          loans: [newLoan, ...state.loans],
          ledgerTransactions: [auditTx, ...state.ledgerTransactions],
        }));

        saveLoanToSupabase(newLoan);
        return loanId;
      },

      recordRepayment: (repData) => {
        const repaymentId = generateId();
        const amt = roundMoney(repData.amount);

        let loanStatus: Loan['status'] = 'Partially Paid';

        set((state) => {
          const updatedLoans = state.loans.map((loan) => {
            if (repData.loanId && loan.id === repData.loanId) {
              const newRepaid = roundMoney(loan.repaidAmount + amt);
              const newRemaining = roundMoney(Math.max(0, loan.originalAmount - newRepaid));
              const status: Loan['status'] =
                newRemaining <= 0 ? 'Fully Paid' : newRepaid > 0 ? 'Partially Paid' : 'Pending';
              loanStatus = status;

              const updatedL = {
                ...loan,
                repaidAmount: newRepaid,
                remainingAmount: newRemaining,
                status,
              };
              saveLoanToSupabase(updatedL);
              return updatedL;
            }
            return loan;
          });

          const newRepayment: Repayment = {
            id: repaymentId,
            loanId: repData.loanId,
            personId: repData.personId,
            fromPersonId: repData.fromPersonId,
            toPersonId: repData.toPersonId,
            amount: amt,
            date: repData.date,
            notes: repData.notes,
            status: loanStatus,
            createdAt: new Date().toISOString(),
          };

          const auditTx: LedgerTransaction = {
            id: generateId(),
            userId: '00000000-0000-4000-a000-000000000001',
            personId: repData.personId,
            type: 'REPAYMENT',
            amount: amt,
            currency: '₹',
            date: repData.date,
            month: repData.date.slice(0, 7),
            description: `Repayment of ₹${amt.toLocaleString()}`,
            createdBy: 'User',
            relatedTransactionId: repaymentId,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          saveRepaymentToSupabase(newRepayment);

          return {
            loans: updatedLoans,
            repayments: [newRepayment, ...state.repayments],
            ledgerTransactions: [auditTx, ...state.ledgerTransactions],
          };
        });

        return repaymentId;
      },

      recordSettlement: (settlementData) => {
        const id = generateId();
        const newSettlement: Settlement = {
          ...settlementData,
          id,
          status: 'Settled',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          settlements: [newSettlement, ...state.settlements],
        }));

        saveSettlementToSupabase(newSettlement);
      },

      loadSupabaseSharedLedger: async (userId) => {
        set({ isLoading: true });
        const res = await fetchFullSharedLedgerFromSupabase(userId);
        if (res && res.success) {
          set((state) => {
            const peopleMap = new Map<string, Person>();
            state.people.forEach((p) => peopleMap.set(p.id, p));
            (res.people || []).forEach((p) => peopleMap.set(p.id, p));

            const groupMap = new Map<string, Group>();
            state.groups.forEach((g) => groupMap.set(g.id, g));
            (res.groups || []).forEach((g) => groupMap.set(g.id, g));

            const expMap = new Map<string, SharedExpense>();
            state.sharedExpenses.forEach((e) => expMap.set(e.id, e));
            (res.expenses || []).forEach((e) => expMap.set(e.id, e));

            const loanMap = new Map<string, Loan>();
            state.loans.forEach((l) => loanMap.set(l.id, l));
            (res.loans || []).forEach((l) => loanMap.set(l.id, l));

            const repMap = new Map<string, Repayment>();
            state.repayments.forEach((r) => repMap.set(r.id, r));
            (res.repayments || []).forEach((r) => repMap.set(r.id, r));

            return {
              people: Array.from(peopleMap.values()),
              groups: Array.from(groupMap.values()),
              sharedExpenses: Array.from(expMap.values()),
              loans: Array.from(loanMap.values()),
              repayments: Array.from(repMap.values()),
              isLoading: false,
            };
          });
        } else {
          set({ isLoading: false });
        }
      },

      // ── Getters ──
      getPersonBalanceSummaries: (monthFilter, groupFilter) => {
        const { people, sharedExpenses, loans, repayments } = get();
        return calculatePersonBalances(people, sharedExpenses, loans, repayments, monthFilter, groupFilter);
      },

      getMinimizedSettlements: (monthFilter, groupFilter) => {
        const { people, sharedExpenses, loans, repayments } = get();
        return minimizeSettlementTransfers(people, sharedExpenses, loans, repayments, monthFilter, groupFilter);
      },

      getMonthlyLedgerReport: (month) => {
        const { sharedExpenses, loans, repayments } = get();
        return calculateMonthlyLedger(sharedExpenses, loans, repayments, month);
      },

      getMonthlyChartSeries: (myPersonId = DEFAULT_SHUBHAM_ID) => {
        const { sharedExpenses, loans, repayments } = get();
        return generateMonthlyChartSeries(sharedExpenses, loans, repayments, myPersonId);
      },
    }),
    {
      name: 'shared-ledger-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

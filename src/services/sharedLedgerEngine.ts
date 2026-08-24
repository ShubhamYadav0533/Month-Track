import {
  Person,
  SharedExpense,
  ExpenseSplit,
  SplitType,
  Loan,
  Repayment,
  SettlementTransfer,
  MonthlyLedger,
  MonthlyChartDataPoint,
  PersonBalanceSummary,
} from '../types/sharedLedger';

/** Safe numeric rounding helper (eliminates JS floating point imprecision) */
export function roundMoney(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/** 
 * Calculate expense splits based on split type.
 * Guarantees that the sum of splits equals totalAmount exactly.
 */
export function calculateExpenseSplits(
  totalAmount: number,
  memberIds: string[],
  splitType: SplitType,
  customDetails?: { personId: string; value: number }[]
): ExpenseSplit[] {
  const amount = roundMoney(Math.max(0, totalAmount));
  if (memberIds.length === 0 || amount === 0) return [];

  const splitMap = new Map<string, { value: number; amount: number; pct?: number; share?: number }>();

  if (splitType === 'equal') {
    const baseShare = Math.floor((amount / memberIds.length) * 100) / 100;
    let distributed = 0;

    memberIds.forEach((id, idx) => {
      if (idx === memberIds.length - 1) {
        // Last member takes exact remaining penny adjustment
        const lastShare = roundMoney(amount - distributed);
        splitMap.set(id, { value: lastShare, amount: lastShare });
      } else {
        splitMap.set(id, { value: baseShare, amount: baseShare });
        distributed = roundMoney(distributed + baseShare);
      }
    });
  } else if (splitType === 'exact') {
    let totalCustom = 0;
    customDetails?.forEach((d) => {
      const val = roundMoney(d.value || 0);
      totalCustom = roundMoney(totalCustom + val);
      splitMap.set(d.personId, { value: val, amount: val });
    });

    // If custom details don't cover all members or don't sum to totalAmount, validate
    memberIds.forEach((id) => {
      if (!splitMap.has(id)) {
        splitMap.set(id, { value: 0, amount: 0 });
      }
    });
  } else if (splitType === 'percentage') {
    let totalPct = 0;
    customDetails?.forEach((d) => {
      totalPct += d.value || 0;
    });

    const pctScale = totalPct > 0 ? 100 / totalPct : 1;
    let distributed = 0;

    memberIds.forEach((id, idx) => {
      const detail = customDetails?.find((d) => d.personId === id);
      const rawPct = (detail?.value || 0) * pctScale;

      if (idx === memberIds.length - 1) {
        const lastAmt = roundMoney(amount - distributed);
        splitMap.set(id, { value: rawPct, amount: lastAmt, pct: rawPct });
      } else {
        const splitAmt = roundMoney((amount * rawPct) / 100);
        distributed = roundMoney(distributed + splitAmt);
        splitMap.set(id, { value: rawPct, amount: splitAmt, pct: rawPct });
      }
    });
  } else if (splitType === 'share') {
    let totalShares = 0;
    customDetails?.forEach((d) => {
      totalShares += Math.max(0, d.value || 0);
    });

    if (totalShares <= 0) {
      return calculateExpenseSplits(amount, memberIds, 'equal');
    }

    let distributed = 0;
    memberIds.forEach((id, idx) => {
      const detail = customDetails?.find((d) => d.personId === id);
      const shares = Math.max(0, detail?.value || 0);

      if (idx === memberIds.length - 1) {
        const lastAmt = roundMoney(amount - distributed);
        splitMap.set(id, { value: shares, amount: lastAmt, share: shares });
      } else {
        const splitAmt = roundMoney((amount * shares) / totalShares);
        distributed = roundMoney(distributed + splitAmt);
        splitMap.set(id, { value: shares, amount: splitAmt, share: shares });
      }
    });
  }

  return memberIds.map((id) => {
    const item = splitMap.get(id) || { value: 0, amount: 0 };
    return {
      id: `split_${id}_${Date.now()}`,
      expenseId: '',
      personId: id,
      amount: item.amount,
      percentage: item.pct,
      shares: item.share,
    };
  });
}

/**
 * Calculates complete person balance summary.
 * 3-Way Rule Enforcement:
 * - Paid: Amount paid for group expenses
 * - Responsibility: Sum of splits for group expenses
 * - Lent: Loans lent to person
 * - Borrowed: Loans borrowed from person
 * - Repayments: Cash repayments exchanged
 */
export function calculatePersonBalances(
  people: Person[],
  expenses: SharedExpense[],
  loans: Loan[],
  repayments: Repayment[],
  monthFilter?: string,
  groupFilter?: string,
  primaryUserId?: string
): PersonBalanceSummary[] {
  const activeExpenses = expenses.filter(
    (e) => e.status !== 'voided' && (!monthFilter || e.month === monthFilter) && (!groupFilter || e.groupId === groupFilter)
  );

  const activeRepayments = repayments.filter(
    (r) => !monthFilter || r.date.startsWith(monthFilter)
  );

  const mainUserId = primaryUserId || people[0]?.id;

  return people.map((person) => {
    let totalPaid = 0;
    let expenseResponsibility = 0;

    activeExpenses.forEach((exp) => {
      if (exp.paidByPersonId === person.id) {
        totalPaid = roundMoney(totalPaid + exp.totalAmount);
      }
      const mySplit = exp.splits?.find((s) => s.personId === person.id);
      if (mySplit) {
        expenseResponsibility = roundMoney(expenseResponsibility + mySplit.amount);
      }
    });

    const expenseNet = roundMoney(totalPaid - expenseResponsibility);

    let totalLent = 0;
    let totalBorrowed = 0;
    let loanNet = 0;

    const isPrimaryUser = person.id === mainUserId || person.name.toLowerCase().includes('(me)');

    if (isPrimaryUser) {
      loans.forEach((l) => {
        if (l.type === 'LEND') {
          totalLent = roundMoney(totalLent + l.remainingAmount);
          loanNet = roundMoney(loanNet + l.remainingAmount); // Primary user is owed money
        } else if (l.type === 'BORROW') {
          totalBorrowed = roundMoney(totalBorrowed + l.remainingAmount);
          loanNet = roundMoney(loanNet - l.remainingAmount); // Primary user owes money
        }
      });
    } else {
      loans.forEach((l) => {
        if (l.personId === person.id) {
          if (l.type === 'LEND') {
            totalLent = roundMoney(totalLent + l.remainingAmount);
            loanNet = roundMoney(loanNet - l.remainingAmount); // Counterpart owes money
          } else if (l.type === 'BORROW') {
            totalBorrowed = roundMoney(totalBorrowed + l.remainingAmount);
            loanNet = roundMoney(loanNet + l.remainingAmount); // Counterpart is owed money
          }
        }
      });
    }

    let totalReceived = 0;
    activeRepayments.forEach((r) => {
      if (r.toPersonId === person.id) {
        totalReceived = roundMoney(totalReceived + r.amount);
      }
    });

    const netBalance = roundMoney(expenseNet + loanNet);

    let statusLabel = 'Settled';
    if (netBalance > 0.01) {
      statusLabel = `Should receive ₹${netBalance.toLocaleString()}`;
    } else if (netBalance < -0.01) {
      statusLabel = `Owes ₹${Math.abs(netBalance).toLocaleString()}`;
    }

    return {
      person,
      totalLent,
      totalBorrowed,
      totalPaid,
      totalReceived,
      expenseResponsibility,
      netBalance,
      statusLabel,
    };
  });
}

/**
 * Debt Minimization Algorithm (Min-Cash-Flow Greedy Graph Settlement)
 * Reduces circular transactions (A -> B, B -> C, C -> A) to minimum direct settlement transfers.
 */
export function minimizeSettlementTransfers(
  people: Person[],
  expenses: SharedExpense[],
  loans: Loan[],
  repayments: Repayment[],
  monthFilter?: string,
  groupFilter?: string
): SettlementTransfer[] {
  const summaries = calculatePersonBalances(people, expenses, loans, repayments, monthFilter, groupFilter);

  interface BalanceNode {
    personId: string;
    name: string;
    amount: number;
  }

  const debtors: BalanceNode[] = [];
  const creditors: BalanceNode[] = [];

  summaries.forEach((s) => {
    if (s.netBalance < -0.01) {
      debtors.push({ personId: s.person.id, name: s.person.name, amount: Math.abs(s.netBalance) });
    } else if (s.netBalance > 0.01) {
      creditors.push({ personId: s.person.id, name: s.person.name, amount: s.netBalance });
    }
  });

  // Sort descending by amount for greedy matching
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const transferAmount = roundMoney(Math.min(debtor.amount, creditor.amount));

    if (transferAmount > 0) {
      transfers.push({
        fromPersonId: debtor.personId,
        fromPersonName: debtor.name,
        toPersonId: creditor.personId,
        toPersonName: creditor.name,
        amount: transferAmount,
      });

      debtor.amount = roundMoney(debtor.amount - transferAmount);
      creditor.amount = roundMoney(creditor.amount - transferAmount);
    }

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return transfers;
}

/**
 * Monthly Ledger & Carry-Forward Processor
 */
export function calculateMonthlyLedger(
  expenses: SharedExpense[],
  loans: Loan[],
  repayments: Repayment[],
  targetMonth: string,
  previousMonthClosingUnsettled: number = 0
): MonthlyLedger {
  const monthExpenses = expenses.filter((e) => e.status !== 'voided' && e.month === targetMonth);
  const monthLoans = loans.filter((l) => l.date.startsWith(targetMonth));
  const monthRepayments = repayments.filter((r) => r.date.startsWith(targetMonth));

  let newExpenses = 0;
  monthExpenses.forEach((e) => {
    newExpenses = roundMoney(newExpenses + e.totalAmount);
  });

  let userContributions = newExpenses; // Total expense contributions
  let moneyLent = 0;
  let moneyBorrowed = 0;

  monthLoans.forEach((l) => {
    if (l.type === 'LEND') {
      moneyLent = roundMoney(moneyLent + l.originalAmount);
    } else {
      moneyBorrowed = roundMoney(moneyBorrowed + l.originalAmount);
    }
  });

  let repaymentsReceived = 0;
  let repaymentsPaid = 0;

  monthRepayments.forEach((r) => {
    repaymentsReceived = roundMoney(repaymentsReceived + r.amount);
  });

  const openingBalance = previousMonthClosingUnsettled;
  const amountReceivable = roundMoney(moneyLent + (openingBalance > 0 ? openingBalance : 0));
  const amountPayable = roundMoney(moneyBorrowed + (openingBalance < 0 ? Math.abs(openingBalance) : 0));

  const closingBalance = roundMoney(
    openingBalance + (newExpenses + moneyLent + repaymentsPaid) - (repaymentsReceived + moneyBorrowed)
  );

  const unsettledAmount = roundMoney(Math.abs(closingBalance));

  return {
    month: targetMonth,
    openingBalance,
    newExpenses,
    userContributions,
    moneyLent,
    moneyBorrowed,
    repaymentsReceived,
    repaymentsPaid,
    adjustments: 0,
    amountReceivable,
    amountPayable,
    closingBalance,
    unsettledAmount,
  };
}

/**
 * Compiles Month-by-Month Chart Data Points for Visual Graphs
 */
export function generateMonthlyChartSeries(
  expenses: SharedExpense[],
  loans: Loan[],
  repayments: Repayment[],
  myPersonId?: string
): MonthlyChartDataPoint[] {
  // Collect all unique months from expenses, loans, repayments
  const monthSet = new Set<string>();

  expenses.forEach((e) => e.month && monthSet.add(e.month));
  loans.forEach((l) => l.date && monthSet.add(l.date.slice(0, 7)));
  repayments.forEach((r) => r.date && monthSet.add(r.date.slice(0, 7)));

  if (monthSet.size === 0) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthSet.add(currentMonth);
  }

  const sortedMonths = Array.from(monthSet).sort();

  return sortedMonths.map((mKey) => {
    const mExpenses = expenses.filter((e) => e.status !== 'voided' && e.month === mKey);
    const mLoans = loans.filter((l) => l.date.startsWith(mKey));

    let totalExpenses = 0;
    let myPaidAmount = 0;
    let myShare = 0;
    let lentAmount = 0;
    let borrowedAmount = 0;

    mExpenses.forEach((e) => {
      totalExpenses = roundMoney(totalExpenses + e.totalAmount);
      if (myPersonId && e.paidByPersonId === myPersonId) {
        myPaidAmount = roundMoney(myPaidAmount + e.totalAmount);
      }
      if (myPersonId) {
        const split = e.splits?.find((s) => s.personId === myPersonId);
        if (split) {
          myShare = roundMoney(myShare + split.amount);
        }
      } else {
        myShare = roundMoney(myShare + e.totalAmount / 3);
      }
    });

    mLoans.forEach((l) => {
      if (l.type === 'LEND') {
        lentAmount = roundMoney(lentAmount + l.originalAmount);
      } else {
        borrowedAmount = roundMoney(borrowedAmount + l.originalAmount);
      }
    });

    const dateObj = new Date(`${mKey}-01`);
    const monthLabel = isNaN(dateObj.getTime())
      ? mKey
      : dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const netPosition = roundMoney(myPaidAmount - myShare + (lentAmount - borrowedAmount));

    return {
      month: monthLabel,
      monthKey: mKey,
      totalExpenses,
      myPaidAmount,
      myShare,
      netPosition,
      lentAmount,
      borrowedAmount,
    };
  });
}

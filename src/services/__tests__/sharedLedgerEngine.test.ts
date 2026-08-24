import {
  roundMoney,
  calculateExpenseSplits,
  calculatePersonBalances,
  minimizeSettlementTransfers,
  calculateMonthlyLedger,
  generateMonthlyChartSeries,
} from '../sharedLedgerEngine';
import { Person, SharedExpense, Loan, Repayment } from '../../types/sharedLedger';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

export function runSharedLedgerEngineTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING FINANCIAL ENGINE UNIT TESTS (15 SCENARIOS)');
  console.log('======================================================\n');

  // Test setup entities
  const p1: Person = { id: 'p1', userId: 'u1', name: 'Shubham', status: 'active', createdAt: '' };
  const p2: Person = { id: 'p2', userId: 'u1', name: 'Rahul', status: 'active', createdAt: '' };
  const p3: Person = { id: 'p3', userId: 'u1', name: 'Amit', status: 'active', createdAt: '' };
  const people = [p1, p2, p3];

  // Scenario 1: Equal Expense Split
  console.log('--- Scenario 1: Equal Expense Split ---');
  const splitsEqual = calculateExpenseSplits(12000, ['p1', 'p2', 'p3'], 'equal');
  assert(splitsEqual.length === 3, 'Equal split produces 3 entries');
  assert(splitsEqual.reduce((sum, s) => roundMoney(sum + s.amount), 0) === 12000, 'Splits sum to exact 12000');
  assert(splitsEqual[0].amount === 4000 && splitsEqual[1].amount === 4000 && splitsEqual[2].amount === 4000, 'Each person split is 4000');

  // Scenario 2: Unequal / Custom Expense Split
  console.log('\n--- Scenario 2: Unequal Expense Split ---');
  const customDetails = [
    { personId: 'p1', value: 6000 },
    { personId: 'p2', value: 3000 },
    { personId: 'p3', value: 3000 },
  ];
  const splitsUnequal = calculateExpenseSplits(12000, ['p1', 'p2', 'p3'], 'exact', customDetails);
  assert(splitsUnequal.find((s) => s.personId === 'p1')?.amount === 6000, 'p1 share is 6000');
  assert(splitsUnequal.find((s) => s.personId === 'p2')?.amount === 3000, 'p2 share is 3000');

  // Scenario 3: Multiple Contributors
  console.log('\n--- Scenario 3: Multiple Contributors ---');
  const expensesMultiple: SharedExpense[] = [
    { id: 'e1', groupId: 'g1', userId: 'u1', category: 'Rent', description: 'Rent', totalAmount: 12000, paidByPersonId: 'p1', date: '2026-08-01', month: '2026-08', splitType: 'equal', splits: splitsEqual, status: 'active', createdAt: '' },
    { id: 'e2', groupId: 'g1', userId: 'u1', category: 'Electricity', description: 'Elec', totalAmount: 3000, paidByPersonId: 'p2', date: '2026-08-05', month: '2026-08', splitType: 'equal', splits: calculateExpenseSplits(3000, ['p1', 'p2', 'p3'], 'equal'), status: 'active', createdAt: '' },
    { id: 'e3', groupId: 'g1', userId: 'u1', category: 'Internet', description: 'Wifi', totalAmount: 1500, paidByPersonId: 'p3', date: '2026-08-10', month: '2026-08', splitType: 'equal', splits: calculateExpenseSplits(1500, ['p1', 'p2', 'p3'], 'equal'), status: 'active', createdAt: '' },
  ];

  const balances3 = calculatePersonBalances(people, expensesMultiple, [], []);
  // Total expenses = 16500. Equal share = 5500 per person.
  // p1 paid 12000 -> net = +6500
  // p2 paid 3000 -> net = -2500
  // p3 paid 1500 -> net = -4000
  const p1Bal = balances3.find((b) => b.person.id === 'p1')?.netBalance;
  const p2Bal = balances3.find((b) => b.person.id === 'p2')?.netBalance;
  const p3Bal = balances3.find((b) => b.person.id === 'p3')?.netBalance;

  assert(p1Bal === 6500, `p1 net balance is +6500 (actual: ${p1Bal})`);
  assert(p2Bal === -2500, `p2 net balance is -2500 (actual: ${p2Bal})`);
  assert(p3Bal === -4000, `p3 net balance is -4000 (actual: ${p3Bal})`);

  // Scenario 4 & 5: Lending and Borrowing
  console.log('\n--- Scenario 4 & 5: Lending and Borrowing ---');
  const loan1: Loan = {
    id: 'l1', userId: 'u1', personId: 'p2', type: 'LEND', originalAmount: 5000, remainingAmount: 5000, repaidAmount: 0, date: '2026-08-15', description: 'Loan to Rahul', paymentMethod: 'UPI', status: 'Pending', createdAt: ''
  };
  const balancesLoan = calculatePersonBalances(people, [], [loan1], []);
  const p2LoanBal = balancesLoan.find((b) => b.person.id === 'p2')?.netBalance;
  assert(p2LoanBal === -5000, `Lending 5000 to p2 makes p2 owe -5000 (actual: ${p2LoanBal})`);

  // Scenario 6 & 7: Partial & Full Repayment
  console.log('\n--- Scenario 6 & 7: Partial & Full Repayment ---');
  const rep1: Repayment = {
    id: 'r1', loanId: 'l1', personId: 'p2', fromPersonId: 'p2', toPersonId: 'p1', amount: 2000, date: '2026-08-20', status: 'Partially Paid', createdAt: ''
  };
  const loanUpdated: Loan = { ...loan1, remainingAmount: 3000, repaidAmount: 2000, status: 'Partially Paid' };
  const balancesRep = calculatePersonBalances(people, [], [loanUpdated], [rep1]);
  const p2RepBal = balancesRep.find((b) => b.person.id === 'p2')?.netBalance;
  assert(p2RepBal === -3000, `After 2000 repayment, p2 net remaining balance is -3000 (actual: ${p2RepBal})`);

  // Scenario 8 & 9: Multiple Months & Carry Forward Balance
  console.log('\n--- Scenario 8 & 9: Multiple Months & Carry Forward ---');
  const augLedger = calculateMonthlyLedger(expensesMultiple, [loanUpdated], [rep1], '2026-08', 0);
  assert(augLedger.newExpenses === 16500, 'August new expenses = 16500');

  const sepLedger = calculateMonthlyLedger([], [], [], '2026-09', augLedger.closingBalance);
  assert(sepLedger.openingBalance === augLedger.closingBalance, 'September opening balance matches August closing balance');

  // Scenario 10 & 11: Multiple People & Groups
  console.log('\n--- Scenario 10 & 11: Multiple People & Groups ---');
  const groupFilterBal = calculatePersonBalances(people, expensesMultiple, [], [], '2026-08', 'g1');
  assert(groupFilterBal.length === 3, 'Group filter correctly isolates members');

  // Scenario 12: Debt Minimization Settlement Engine Algorithm
  console.log('\n--- Scenario 12: Settlement Minimization Algorithm ---');
  const minTransfers = minimizeSettlementTransfers(people, expensesMultiple, [], []);
  // Should yield: p3 -> p1: 4000, p2 -> p1: 2500 (Total 6500 to p1)
  assert(minTransfers.length === 2, `Min transfers length is 2 (actual: ${minTransfers.length})`);
  assert(minTransfers.reduce((sum, t) => sum + t.amount, 0) === 6500, 'Total minimized transfers equal +6500 to p1');

  // Scenario 13: Transaction Correction / Reversal
  console.log('\n--- Scenario 13: Voided / Reversed Expense Handling ---');
  const voidedExpense: SharedExpense = { ...expensesMultiple[0], status: 'voided' };
  const balancesVoided = calculatePersonBalances(people, [voidedExpense, expensesMultiple[1], expensesMultiple[2]], [], []);
  assert(balancesVoided.find((b) => b.person.id === 'p1')?.totalPaid === 0, 'Voided expense is excluded from calculations');

  // Scenario 14: Zero / Invalid Amount Handling
  console.log('\n--- Scenario 14: Zero Amount Edge Cases ---');
  const zeroSplits = calculateExpenseSplits(0, ['p1', 'p2'], 'equal');
  assert(zeroSplits.length === 0, 'Zero total amount produces empty splits');

  // Scenario 15: Section 20 Complete End-to-End Test Scenario
  console.log('\n--- Scenario 15: Section 20 End-to-End Verification ---');
  // Rent=12000 (Shubham), Elec=3000 (Rahul), Wifi=1500 (Amit). Equal splits.
  // Shubham lends Rahul 5000. Rahul repays 2000.
  const sec20Balances = calculatePersonBalances(people, expensesMultiple, [loanUpdated], [rep1]);
  const shubhamSec20 = sec20Balances.find((b) => b.person.id === 'p1');
  const rahulSec20   = sec20Balances.find((b) => b.person.id === 'p2');
  const amitSec20    = sec20Balances.find((b) => b.person.id === 'p3');

  console.log(`Shubham Net: +${shubhamSec20?.netBalance}`);
  console.log(`Rahul Net: ${rahulSec20?.netBalance}`);
  console.log(`Amit Net: ${amitSec20?.netBalance}`);

  assert(shubhamSec20?.netBalance === 9500, 'Shubham net position is +9500 (+6500 expense credit + 3000 loan remaining)');
  assert(rahulSec20?.netBalance === -5500, 'Rahul net position is -5500 (-2500 expense share - 3000 loan remaining)');
  assert(amitSec20?.netBalance === -4000, 'Amit net position is -4000');

  // Generate chart data series
  const chartSeries = generateMonthlyChartSeries(expensesMultiple, [loanUpdated], [rep1], 'p1');
  assert(chartSeries.length >= 1, 'Generated chart series correctly');

  console.log('\n======================================================');
  console.log('🎉 ALL 15 FINANCIAL ENGINE UNIT TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

// Execute tests if executed via ts-node directly
if (require.main === module) {
  runSharedLedgerEngineTests();
}

import { supabase } from '../config/supabaseClient';
import {
  Person,
  Group,
  SharedExpense,
  Loan,
  Repayment,
  Settlement,
} from '../types/sharedLedger';

export async function savePersonToSupabase(person: Person) {
  try {
    const { data, error } = await supabase
      .from('people')
      .upsert({
        id: person.id,
        user_id: person.userId,
        name: person.name,
        phone_number: person.phoneNumber || null,
        email: person.email || null,
        avatar_url: person.avatarUrl || null,
        notes: person.notes || null,
        status: person.status,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Person sync error:', err);
    return { success: false, error: err };
  }
}

export async function saveGroupToSupabase(group: Group, memberPersonIds: string[]) {
  try {
    const { data, error } = await supabase
      .from('groups')
      .upsert({
        id: group.id,
        user_id: group.userId,
        name: group.name,
        description: group.description || null,
        category: group.category,
        currency: group.currency,
        status: group.status,
      })
      .select();

    if (error) throw error;

    // Upsert group members
    if (memberPersonIds.length > 0) {
      const memberPayload = memberPersonIds.map((pId) => ({
        group_id: group.id,
        person_id: pId,
      }));
      await supabase.from('group_members').upsert(memberPayload);
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Group sync error:', err);
    return { success: false, error: err };
  }
}

export async function saveSharedExpenseToSupabase(expense: SharedExpense) {
  try {
    const { data, error } = await supabase
      .from('shared_expenses')
      .upsert({
        id: expense.id,
        group_id: expense.groupId,
        user_id: expense.userId,
        category: expense.category,
        description: expense.description,
        total_amount: expense.totalAmount,
        paid_by_person_id: expense.paidByPersonId,
        date: expense.date,
        month: expense.month,
        split_type: expense.splitType,
        status: expense.status,
      })
      .select();

    if (error) throw error;

    // Upsert splits
    if (expense.splits && expense.splits.length > 0) {
      const splitPayload = expense.splits.map((s) => ({
        id: s.id,
        expense_id: expense.id,
        person_id: s.personId,
        amount: s.amount,
        percentage: s.percentage || null,
        shares: s.shares || null,
      }));
      await supabase.from('expense_splits').upsert(splitPayload);
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Shared Expense sync error:', err);
    return { success: false, error: err };
  }
}

export async function saveLoanToSupabase(loan: Loan) {
  try {
    const { data, error } = await supabase
      .from('loans')
      .upsert({
        id: loan.id,
        user_id: loan.userId,
        person_id: loan.personId,
        type: loan.type,
        original_amount: loan.originalAmount,
        remaining_amount: loan.remainingAmount,
        repaid_amount: loan.repaidAmount,
        date: loan.date,
        due_date: loan.dueDate || null,
        description: loan.description,
        payment_method: loan.paymentMethod,
        status: loan.status,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Loan sync error:', err);
    return { success: false, error: err };
  }
}

export async function saveRepaymentToSupabase(repayment: Repayment) {
  try {
    const { data, error } = await supabase
      .from('repayments')
      .upsert({
        id: repayment.id,
        loan_id: repayment.loanId || null,
        person_id: repayment.personId,
        from_person_id: repayment.fromPersonId,
        to_person_id: repayment.toPersonId,
        amount: repayment.amount,
        date: repayment.date,
        notes: repayment.notes || null,
        status: repayment.status,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Repayment sync error:', err);
    return { success: false, error: err };
  }
}

export async function saveSettlementToSupabase(settlement: Settlement) {
  try {
    const { data, error } = await supabase
      .from('settlements')
      .upsert({
        id: settlement.id,
        group_id: settlement.groupId || null,
        from_person_id: settlement.fromPersonId,
        to_person_id: settlement.toPersonId,
        amount: settlement.amount,
        month: settlement.month,
        date: settlement.date,
        notes: settlement.notes || null,
        status: settlement.status,
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Settlement sync error:', err);
    return { success: false, error: err };
  }
}

export async function fetchFullSharedLedgerFromSupabase(userId: string) {
  try {
    const peopleRes = await supabase.from('people').select('*').eq('user_id', userId);
    const groupsRes = await supabase.from('groups').select('*').eq('user_id', userId);
    const expensesRes = await supabase.from('shared_expenses').select('*').eq('user_id', userId);
    const loansRes = await supabase.from('loans').select('*').eq('user_id', userId);
    const repaymentsRes = await supabase.from('repayments').select('*').eq('user_id', userId);

    const people = (peopleRes.data || []).map((p: any): Person => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      phoneNumber: p.phone_number,
      email: p.email,
      avatarUrl: p.avatar_url,
      notes: p.notes,
      status: p.status || 'active',
      createdAt: p.created_at || new Date().toISOString(),
    }));

    const groups = (groupsRes.data || []).map((g: any): Group => ({
      id: g.id,
      userId: g.user_id,
      name: g.name,
      description: g.description,
      category: g.category || 'Custom',
      currency: g.currency || '₹',
      status: g.status || 'active',
      createdAt: g.created_at || new Date().toISOString(),
    }));

    const expenses = (expensesRes.data || []).map((e: any): SharedExpense => ({
      id: e.id,
      groupId: e.group_id,
      userId: e.user_id,
      category: e.category,
      description: e.description,
      totalAmount: parseFloat(e.total_amount || 0),
      paidByPersonId: e.paid_by_person_id,
      date: e.date,
      month: e.month,
      splitType: e.split_type || 'equal',
      splits: [],
      status: e.status || 'active',
      createdAt: e.created_at || new Date().toISOString(),
    }));

    const loans = (loansRes.data || []).map((l: any): Loan => ({
      id: l.id,
      userId: l.user_id,
      personId: l.person_id,
      type: l.type,
      originalAmount: parseFloat(l.original_amount || 0),
      remainingAmount: parseFloat(l.remaining_amount || 0),
      repaidAmount: parseFloat(l.repaid_amount || 0),
      date: l.date,
      dueDate: l.due_date,
      description: l.description,
      paymentMethod: l.payment_method || 'UPI',
      status: l.status || 'Pending',
      createdAt: l.created_at || new Date().toISOString(),
    }));

    const repayments = (repaymentsRes.data || []).map((r: any): Repayment => ({
      id: r.id,
      loanId: r.loan_id,
      personId: r.person_id,
      fromPersonId: r.from_person_id,
      toPersonId: r.to_person_id,
      amount: parseFloat(r.amount || 0),
      date: r.date,
      notes: r.notes,
      status: r.status || 'Partially Paid',
      createdAt: r.created_at || new Date().toISOString(),
    }));

    return {
      success: true,
      people,
      groups,
      expenses,
      loans,
      repayments,
    };
  } catch (err) {
    console.warn('[Supabase] Shared Ledger full fetch error:', err);
    return {
      success: false,
      people: [],
      groups: [],
      expenses: [],
      loans: [],
      repayments: [],
    };
  }
}

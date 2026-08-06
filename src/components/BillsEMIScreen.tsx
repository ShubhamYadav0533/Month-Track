import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { ExpenseCategory } from '../types';
import { getFormattedDate } from '../utils/budgetCalculator';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  PieChart,
  X,
  Check,
} from 'lucide-react-native';

const CATEGORY_LIST: ExpenseCategory[] = [
  'Food',
  'Groceries',
  'Fuel',
  'Rent',
  'Electricity',
  'Gas',
  'Internet',
  'Shopping',
  'Travel',
  'Medical',
  'Education',
  'Entertainment',
  'Recharge',
  'Insurance',
  'EMI',
  'Others',
];

export function BillsEMIScreen() {
  const { profile, bills, addBill, toggleBillStatus, budgets, transactions, setCategoryBudget } =
    useFinanceStore();

  const [activeTab, setActiveTab] = useState<'bills' | 'budgets'>('bills');
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // New Bill form
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(getFormattedDate());

  // Budget modal states
  const [budCat, setBudCat] = useState<ExpenseCategory>('Food');
  const [budLimit, setBudLimit] = useState('');

  const handleCreateBill = () => {
    const num = parseFloat(billAmount);
    if (!billTitle || isNaN(num)) return;

    addBill({
      title: billTitle,
      amount: num,
      dueDate: billDueDate,
      recurring: true,
      status: 'Pending',
      category: 'Bills',
    });

    setBillTitle('');
    setBillAmount('');
    setIsAddBillOpen(false);
  };

  const handleSaveBudget = () => {
    const num = parseFloat(budLimit);
    if (isNaN(num)) return;
    setCategoryBudget(budCat, num);
    setBudLimit('');
    setIsBudgetModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Bills, EMI & Budgets</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => (activeTab === 'bills' ? setIsAddBillOpen(true) : setIsBudgetModalOpen(true))}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>
              {activeTab === 'bills' ? '+ Bill / EMI' : '+ Set Budget'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Track monthly utility bills, loan EMIs, and category spending limits</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bills' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bills')}
        >
          <CreditCard size={14} color={activeTab === 'bills' ? '#10b981' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'bills' && styles.tabTextActive]}>
            Bills & EMIs ({bills.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'budgets' && styles.tabBtnActive]}
          onPress={() => setActiveTab('budgets')}
        >
          <PieChart size={14} color={activeTab === 'budgets' ? '#10b981' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'budgets' && styles.tabTextActive]}>
            Category Budgets ({budgets.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'bills' ? (
          /* BILLS TABLE VIEW */
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Bill Title</Text>
              <Text style={[styles.th, { flex: 1 }]}>Due Date</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Amount</Text>
              <Text style={[styles.th, { flex: 1 }]}>Status</Text>
            </View>

            {bills.map((b) => {
              const isPaid = b.status === 'Paid';
              return (
                <View key={b.id} style={styles.tr}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.tdTitle}>{b.title}</Text>
                    <Text style={styles.tdSub}>{b.recurring ? 'Auto-Recurring' : 'One-time'}</Text>
                  </View>

                  <Text style={[styles.tdText, { flex: 1 }]}>{b.dueDate}</Text>

                  <Text style={[styles.tdAmount, { flex: 1.2 }]}>
                    {profile.currency}{b.amount.toLocaleString()}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.statusPill,
                      { backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' },
                    ]}
                    onPress={() => toggleBillStatus(b.id)}
                  >
                    {isPaid ? (
                      <CheckCircle2 size={12} color="#10b981" />
                    ) : (
                      <Clock size={12} color="#f59e0b" />
                    )}
                    <Text style={[styles.statusText, { color: isPaid ? '#10b981' : '#f59e0b' }]}>
                      {b.status}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          /* CATEGORY BUDGETS VIEW */
          <View style={styles.budgetList}>
            {budgets.map((b) => {
              // Calculate current spent in this category
              const spent = transactions
                .filter((t) => t.category === b.category && t.type === 'Expense')
                .reduce((sum, t) => sum + t.amount, 0);

              const percent = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));
              const remaining = Math.max(0, b.monthlyLimit - spent);
              const isOver = spent > b.monthlyLimit;

              return (
                <View key={b.category} style={styles.budgetCard}>
                  <View style={styles.budgetTop}>
                    <Text style={styles.budCatTitle}>{b.category}</Text>
                    <Text style={styles.budPercent}>{percent}% Spent</Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: isOver ? '#ef4444' : percent > 80 ? '#f59e0b' : '#10b981',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.budBottom}>
                    <Text style={styles.budMetaText}>
                      Spent: <Text style={{ color: '#f8fafc', fontWeight: '700' }}>{profile.currency}{spent}</Text>
                    </Text>
                    <Text style={styles.budMetaText}>
                      Limit: <Text style={{ color: '#f8fafc', fontWeight: '700' }}>{profile.currency}{b.monthlyLimit}</Text>
                    </Text>
                    <Text style={[styles.budMetaText, { color: isOver ? '#ef4444' : '#10b981' }]}>
                      Rem: {profile.currency}{remaining}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Bill Modal */}
      <Modal visible={isAddBillOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bill / EMI</Text>
              <TouchableOpacity onPress={() => setIsAddBillOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Electricity, Rent, Car EMI"
              placeholderTextColor="#64748b"
              value={billTitle}
              onChangeText={setBillTitle}
            />

            <Text style={styles.label}>Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="1500"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={billAmount}
              onChangeText={setBillAmount}
            />

            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-08-15"
              placeholderTextColor="#64748b"
              value={billDueDate}
              onChangeText={setBillDueDate}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateBill}>
              <Check size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Budget Modal */}
      <Modal visible={isBudgetModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Category Monthly Budget</Text>
              <TouchableOpacity onPress={() => setIsBudgetModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {CATEGORY_LIST.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, budCat === c && styles.catChipActive]}
                  onPress={() => setBudCat(c)}
                >
                  <Text style={[styles.catChipText, budCat === c && styles.catChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Monthly Limit (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="5000"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={budLimit}
              onChangeText={setBudLimit}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBudget}>
              <Check size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginVertical: 10,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  tableCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10,
    marginBottom: 8,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  tdTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  tdSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  tdText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  tdAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  budgetList: {
    gap: 12,
  },
  budgetCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budCatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  budPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budMetaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  catRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catChipActive: {
    backgroundColor: '#10b981',
  },
  catChipText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  catChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

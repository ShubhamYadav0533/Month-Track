import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { calculateDailyBudgetStats, getFormattedDate } from '../utils/budgetCalculator';
import { AddTransactionModal } from './AddTransactionModal';
import { TransactionType } from '../types';
import {
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckSquare,
  Target,
  Sparkles,
  RefreshCw,
  Clock,
  Send,
  Download,
  Upload,
  PieChart,
} from 'lucide-react-native';

export function LiveDashboard() {
  const {
    profile,
    accounts,
    transactions,
    tasks,
    bills,
    savingsGoals,
    loadSupabaseData,
  } = useFinanceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('Expense');

  const todayStr = getFormattedDate();

  // Auto-calculated Metrics
  const todayExpense = transactions
    .filter((t) => t.transactionDate === todayStr && t.type !== 'Income' && t.type !== 'Borrow')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayIncome = transactions
    .filter((t) => t.transactionDate === todayStr && (t.type === 'Income' || t.type === 'Borrow'))
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalGoalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 1);
  const savingsGoalPercent = Math.min(100, Math.round((totalSaved / totalGoalTarget) * 100));

  const stats = calculateDailyBudgetStats(profile, accounts, transactions);
  const remainingBudget = stats.remainingToday;

  const upcomingBillsCount = bills.filter((b) => b.status === 'Pending').length;
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  const monthlyProgressPercent = Math.min(100, Math.round((new Date().getDate() / 31) * 100));

  const handleOpenModal = (type: TransactionType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const accountIconMap: Record<string, React.ReactNode> = {
    wallet: <Wallet size={18} color="#10b981" />,
    bank: <Building2 size={18} color="#3b82f6" />,
    upi: <Smartphone size={18} color="#8b5cf6" />,
    card: <CreditCard size={18} color="#f59e0b" />,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Greeting & Header */}
        <View style={styles.greetingHeader}>
          <View>
            <Text style={styles.greetingSub}>PERSONAL FINANCE OS</Text>
            <Text style={styles.greetingTitle}>Good Morning, {profile.name}</Text>
          </View>
          <TouchableOpacity style={styles.syncBtn} onPress={loadSupabaseData}>
            <RefreshCw size={14} color="#10b981" />
            <Text style={styles.syncBtnText}>Sync DB</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Dashboard KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Today's Spending */}
          <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Today&apos;s Spending</Text>
              <ArrowUpRight size={16} color="#ef4444" />
            </View>
            <Text style={styles.kpiValueMain}>
              {profile.currency}{todayExpense.toLocaleString()}
            </Text>
            <Text style={styles.kpiSubText}>
              Income: +{profile.currency}{todayIncome.toLocaleString()}
            </Text>
          </View>

          {/* Card 2: Remaining Budget */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Remaining Budget</Text>
              <Sparkles size={16} color="#10b981" />
            </View>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>
              {profile.currency}{remainingBudget.toLocaleString()}
            </Text>
            <Text style={styles.kpiSubText}>Safe daily limit</Text>
          </View>

          {/* Card 3: Current Balance */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Current Balance</Text>
              <Wallet size={16} color="#3b82f6" />
            </View>
            <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>
              {profile.currency}{currentBalance.toLocaleString()}
            </Text>
            <Text style={styles.kpiSubText}>Across {accounts.length} accounts</Text>
          </View>

          {/* Card 4: Total Savings */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Savings</Text>
              <Target size={16} color="#8b5cf6" />
            </View>
            <Text style={[styles.kpiValue, { color: '#8b5cf6' }]}>
              {profile.currency}{totalSaved.toLocaleString()}
            </Text>
            <Text style={styles.kpiSubText}>Goal Achieved: {savingsGoalPercent}%</Text>
          </View>
        </View>

        {/* Secondary KPI Bar (Upcoming Bills, Pending Tasks, Progress) */}
        <View style={styles.barCard}>
          <View style={styles.barItem}>
            <Clock size={16} color="#f59e0b" />
            <View>
              <Text style={styles.barVal}>{upcomingBillsCount}</Text>
              <Text style={styles.barLbl}>Upcoming Bills</Text>
            </View>
          </View>
          <View style={styles.barDivider} />

          <View style={styles.barItem}>
            <CheckSquare size={16} color="#3b82f6" />
            <View>
              <Text style={styles.barVal}>{pendingTasksCount}</Text>
              <Text style={styles.barLbl}>Pending Tasks</Text>
            </View>
          </View>
          <View style={styles.barDivider} />

          <View style={styles.barItem}>
            <PieChart size={16} color="#10b981" />
            <View>
              <Text style={styles.barVal}>{monthlyProgressPercent}%</Text>
              <Text style={styles.barLbl}>Monthly Progress</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <Text style={styles.sectionTitle}>Quick Buttons</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleOpenModal('Expense')}>
            <Plus size={16} color="#fff" />
            <Text style={styles.actionBtnText}>+ Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleOpenModal('Income')}>
            <Plus size={16} color="#fff" />
            <Text style={styles.actionBtnText}>+ Income</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => handleOpenModal('Transfer')}>
            <Send size={16} color="#fff" />
            <Text style={styles.actionBtnText}>+ Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => handleOpenModal('Borrow')}>
            <Download size={16} color="#fff" />
            <Text style={styles.actionBtnText}>+ Borrow</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#8b5cf6' }]} onPress={() => handleOpenModal('Lend')}>
            <Upload size={16} color="#fff" />
            <Text style={styles.actionBtnText}>+ Lend</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ec4899' }]} onPress={() => handleOpenModal('EMI')}>
            <CreditCard size={16} color="#fff" />
            <Text style={styles.actionBtnText}>+ EMI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#14b8a6' }]} onPress={() => handleOpenModal('Investment')}>
            <PieChart size={16} color="#fff" />
            <Text style={styles.actionBtnText}>+ Investment</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Accounts Balances Overview Widget */}
        <View style={styles.widgetHeader}>
          <Text style={styles.sectionTitle}>Linked Accounts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsRow}>
          {accounts.map((acc) => (
            <View key={acc.id} style={styles.accCard}>
              <View style={styles.accHeader}>
                {accountIconMap[acc.type] || <Wallet size={18} color="#10b981" />}
                <Text style={styles.accType}>{acc.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.accName}>{acc.name}</Text>
              <Text style={styles.accBalance}>
                {profile.currency}{acc.balance.toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Recent Activity Ledger Widget */}
        <View style={styles.widgetHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
        <View style={styles.recentList}>
          {transactions.slice(0, 5).map((tx) => {
            const isInc = tx.type === 'Income' || tx.type === 'Borrow';
            return (
              <View key={tx.id} style={styles.recentRow}>
                <View style={styles.recentLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isInc ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                    {isInc ? <ArrowDownLeft size={16} color="#10b981" /> : <ArrowUpRight size={16} color="#ef4444" />}
                  </View>
                  <View>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txMeta}>{tx.transactionDate} • {tx.category}</Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: isInc ? '#10b981' : '#f8fafc' }]}>
                  {isInc ? '+' : '-'}{profile.currency}{tx.amount}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Unified Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 14,
  },
  greetingSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.5,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  syncBtnText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiCardHighlight: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  kpiValueMain: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ef4444',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  kpiSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  barCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  barLbl: {
    fontSize: 10,
    color: '#94a3b8',
  },
  barDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 10,
  },
  quickActionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  widgetHeader: {
    marginTop: 6,
  },
  accountsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  accCard: {
    width: 140,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  accType: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
  },
  accName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  accBalance: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 4,
  },
  recentList: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  txMeta: {
    fontSize: 11,
    color: '#94a3b8',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
});

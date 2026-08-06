import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { calculateDailyBudgetStats } from '../utils/budgetCalculator';
import { AddExpenseModal } from './AddExpenseModal';
import {
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  Plus,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Sparkles,
  RefreshCw,
  PiggyBank,
  CheckCircle2,
  Lock,
  Trash2,
  History,
} from 'lucide-react-native';

export function LiveDashboard() {
  const {
    profile,
    accounts,
    expenses,
    lockApp,
    deleteExpense,
    loadSupabaseData,
    isLoading,
  } = useFinanceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  const stats = calculateDailyBudgetStats(profile, accounts, expenses);

  const accountIconMap: Record<string, React.ReactNode> = {
    wallet: <Wallet size={20} color="#10b981" />,
    bank: <Building2 size={20} color="#3b82f6" />,
    upi: <Smartphone size={20} color="#8b5cf6" />,
    card: <CreditCard size={20} color="#f59e0b" />,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hello, {profile.name} 👋</Text>
            <Text style={styles.subtitleText}>Smart Personal Finance Assistant</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconCircle} onPress={loadSupabaseData}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <RefreshCw size={18} color="#10b981" />
              )}
            </TouchableOpacity>
            {profile.pinCode && (
              <TouchableOpacity style={styles.iconCircle} onPress={lockApp}>
                <Lock size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Hero Card - Safe to Spend Today */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.safeBadge}>
              <Sparkles size={14} color="#10b981" />
              <Text style={styles.safeBadgeText}>Safe to Spend Today</Text>
            </View>
            <View style={styles.daysLeftBadge}>
              <Calendar size={13} color="#60a5fa" />
              <Text style={styles.daysLeftText}>{stats.remainingDays} Days Left</Text>
            </View>
          </View>

          <Text style={styles.heroAmount}>
            {profile.currency}
            {stats.remainingToday.toLocaleString()}
          </Text>
          <Text style={styles.heroFormula}>
            Base Formula: {profile.currency}{stats.totalMoney.toLocaleString()} ÷ {stats.remainingDays} days = {profile.currency}{stats.safeToSpendDaily}/day
          </Text>

          {/* Today's Spend Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Spent Today: {profile.currency}{stats.spentToday}
              </Text>
              <Text style={styles.progressLabelRight}>
                Budget: {profile.currency}{stats.effectiveTodayBudget}
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.round((stats.spentToday / Math.max(1, stats.effectiveTodayBudget)) * 100))}%`,
                    backgroundColor: stats.spentToday > stats.effectiveTodayBudget ? '#ef4444' : '#10b981',
                  },
                ]}
              />
            </View>
          </View>

          {/* Quick Metrics Grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Daily Base</Text>
              <Text style={styles.metricVal}>{profile.currency}{stats.safeToSpendDaily}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Spent Today</Text>
              <Text style={[styles.metricVal, { color: '#f87171' }]}>{profile.currency}{stats.spentToday}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Remaining</Text>
              <Text style={[styles.metricVal, { color: '#34d399' }]}>{profile.currency}{stats.remainingToday}</Text>
            </View>
          </View>
        </View>

        {/* Carry Forward Widget */}
        <View style={styles.carryCard}>
          <View style={styles.carryHeader}>
            <TrendingDown size={18} color={stats.carryForward >= 0 ? '#10b981' : '#ef4444'} />
            <Text style={styles.carryTitle}>
              {stats.carryForward >= 0 ? 'Yesterday Savings Carry-Forward' : 'Yesterday Overspent Adjustment'}
            </Text>
          </View>
          <Text style={styles.carryBody}>
            {stats.carryForward >= 0
              ? `You saved ${profile.currency}${stats.carryForward} yesterday! Added to today's budget.`
              : `You overspent by ${profile.currency}${Math.abs(stats.carryForward)} yesterday. Deducted from today's allowance.`}
          </Text>
        </View>

        {/* Depletion Speed Warning */}
        {stats.predictedDaysUntilDepletion < stats.remainingDays && (
          <View style={styles.alertCard}>
            <AlertTriangle size={20} color="#f59e0b" />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.alertTitle}>Smart Velocity Warning</Text>
              <Text style={styles.alertBody}>
                Current speed: {profile.currency}{stats.velocityPerDay}/day. Money will run out in{' '}
                <Text style={styles.alertHighlight}>{stats.predictedDaysUntilDepletion} days</Text> instead of {stats.remainingDays}!
              </Text>
            </View>
          </View>
        )}

        {/* Overview Grid */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Current Balance</Text>
            <Text style={styles.overviewValue}>{profile.currency}{stats.totalMoney.toLocaleString()}</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Monthly Savings Goal</Text>
            <View style={styles.savingsRow}>
              <PiggyBank size={16} color="#10b981" />
              <Text style={styles.overviewValue}>{stats.monthlySavingsPercentage}%</Text>
            </View>
          </View>
        </View>

        {/* Multi-Accounts Breakdown */}
        <Text style={styles.sectionHeader}>Accounts & Balances (Live DB)</Text>
        <View style={styles.accountsGrid}>
          {accounts.map((acc) => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={[styles.accountIconBg, { backgroundColor: `${acc.color}20` }]}>
                  {accountIconMap[acc.type] || <Wallet size={18} color={acc.color} />}
                </View>
                <Text style={styles.accountType}>{acc.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.accountName}>{acc.name}</Text>
              <Text style={styles.accountBalance}>
                {profile.currency}{acc.balance.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Transaction History Header */}
        <View style={styles.historyTitleRow}>
          <View style={styles.historyLeft}>
            <History size={18} color="#10b981" />
            <Text style={styles.sectionHeaderNoMargin}>Expense History ({expenses.length})</Text>
          </View>
        </View>

        {/* Expense History List */}
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle2 size={32} color="#10b981" />
            <Text style={styles.emptyText}>No expenses logged yet. Tap &quot;+ Add Expense&quot; below!</Text>
          </View>
        ) : (
          expenses.map((exp) => (
            <View key={exp.id} style={styles.expenseRow}>
              <View style={styles.expenseLeft}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{exp.category}</Text>
                </View>
                <View style={styles.expenseTextCol}>
                  <Text style={styles.expenseDesc}>{exp.description}</Text>
                  <Text style={styles.expenseMeta}>
                    {exp.paymentMethod} • {exp.expenseDate} {exp.location ? `• 📍 ${exp.location}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>
                  -{profile.currency}{exp.amount}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteExpense(exp.id)}
                >
                  <Trash2 size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#ffffff" />
        <Text style={styles.fabText}>Add Expense</Text>
      </TouchableOpacity>

      <AddExpenseModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitleText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safeBadgeText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 12,
  },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysLeftText: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 12,
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  heroFormula: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  progressLabelRight: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  carryCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  carryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  carryTitle: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  carryBody: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertBody: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 18,
  },
  alertHighlight: {
    color: '#f59e0b',
    fontWeight: '800',
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  sectionHeaderNoMargin: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  historyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  accountCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  accountName: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyState: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  expenseTextCol: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  expenseMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ef4444',
  },
  deleteBtn: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
  },
  fabText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
});

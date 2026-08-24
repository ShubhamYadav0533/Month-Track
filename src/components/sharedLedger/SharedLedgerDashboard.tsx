import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import {
  DollarSign,
  Users,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';

interface SharedLedgerDashboardProps {
  onNavigateTab: (tab: 'people' | 'groups' | 'expenses' | 'loans' | 'settlements' | 'ledger' | 'reports') => void;
  onOpenAddExpense: () => void;
  onOpenLendBorrow: (mode: 'LEND' | 'BORROW') => void;
  onOpenRepayment: () => void;
}

export function SharedLedgerDashboard({
  onNavigateTab,
  onOpenAddExpense,
  onOpenLendBorrow,
  onOpenRepayment,
}: SharedLedgerDashboardProps) {
  const {
    people,
    selectedMonth,
    getPersonBalanceSummaries,
    getMinimizedSettlements,
    getMonthlyChartSeries,
  } = useSharedLedgerStore();

  const summaries = getPersonBalanceSummaries();
  const mySummary = summaries.find((s) => s.person.name.toLowerCase().includes('(me)')) || summaries[0];

  const totalOwedToMe = summaries
    .filter((s) => s.netBalance > 0 && !s.person.name.toLowerCase().includes('(me)'))
    .reduce((acc, s) => acc + s.netBalance, 0);

  const totalIOwe = Math.abs(
    summaries
      .filter((s) => s.netBalance < 0 && !s.person.name.toLowerCase().includes('(me)'))
      .reduce((acc, s) => acc + s.netBalance, 0)
  );

  const chartSeries = getMonthlyChartSeries(mySummary?.person.id);
  const minTransfers = getMinimizedSettlements(selectedMonth);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerBadge}>
          <Sparkles size={14} color="#10b981" />
          <Text style={styles.headerBadgeText}>Financial Ledger & Relationship Settlement</Text>
        </View>
        <Text style={styles.headerTitle}>Shared Money & Lending</Text>
        <Text style={styles.headerSubtitle}>
          Track shared room rent, group bills, contributions, lending, borrowings, and minimum settlements.
        </Text>
      </View>

      {/* Top Financial Overview Metric Cards */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, styles.metricCardCreditor]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Owed to Me</Text>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <ArrowUpRight size={18} color="#10b981" />
            </View>
          </View>
          <Text style={[styles.metricValue, { color: '#10b981' }]}>
            ₹{totalOwedToMe.toLocaleString()}
          </Text>
          <Text style={styles.metricSubtext}>Amount to receive from others</Text>
        </View>

        <View style={[styles.metricCard, styles.metricCardDebtor]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Total I Owe</Text>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(244, 63, 94, 0.2)' }]}>
              <ArrowDownLeft size={18} color="#f43f5e" />
            </View>
          </View>
          <Text style={[styles.metricValue, { color: '#f43f5e' }]}>
            ₹{totalIOwe.toLocaleString()}
          </Text>
          <Text style={styles.metricSubtext}>Amount to pay to others</Text>
        </View>
      </View>

      {/* Net Position Card */}
      <View style={styles.netCard}>
        <View style={styles.netRow}>
          <View>
            <Text style={styles.netLabel}>My Net Financial Position</Text>
            <Text style={styles.netSubtext}>Combined Expenses + Loans Balance</Text>
          </View>
          <Text
            style={[
              styles.netValue,
              { color: (mySummary?.netBalance || 0) >= 0 ? '#10b981' : '#f43f5e' },
            ]}
          >
            {(mySummary?.netBalance || 0) >= 0 ? '+' : ''}₹
            {(mySummary?.netBalance || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Quick Action Floating Bar */}
      <Text style={styles.sectionHeader}>QUICK ACTIONS</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onOpenAddExpense} activeOpacity={0.8}>
          <PlusCircle size={20} color="#10b981" />
          <Text style={styles.actionText}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenLendBorrow('LEND')} activeOpacity={0.8}>
          <ArrowUpRight size={20} color="#3b82f6" />
          <Text style={styles.actionText}>Lend Money</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenLendBorrow('BORROW')} activeOpacity={0.8}>
          <ArrowDownLeft size={20} color="#f59e0b" />
          <Text style={styles.actionText}>Borrow Money</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onOpenRepayment} activeOpacity={0.8}>
          <DollarSign size={20} color="#a855f7" />
          <Text style={styles.actionText}>Repay</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Per-Month Visual Graph */}
      <MonthlyTrendChart dataPoints={chartSeries} />

      {/* Minimal Settlement Engine Preview */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Scale size={18} color="#10b981" />
            <Text style={styles.cardTitle}>Minimum Practical Settlements</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab('settlements')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {minTransfers.length === 0 ? (
          <Text style={styles.emptyCardText}>All group balances are currently settled!</Text>
        ) : (
          minTransfers.map((t, idx) => (
            <View key={idx} style={styles.transferRow}>
              <View style={styles.transferFlow}>
                <Text style={styles.debtorName}>{t.fromPersonName}</Text>
                <ChevronRight size={16} color="#94a3b8" />
                <Text style={styles.creditorName}>{t.toPersonName}</Text>
              </View>
              <Text style={styles.transferAmount}>₹{t.amount.toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>

      {/* People Net Status Summary List */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#3b82f6" />
            <Text style={styles.cardTitle}>People Ledger Summary</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab('people')}>
            <Text style={styles.viewAllText}>Manage People</Text>
          </TouchableOpacity>
        </View>

        {people.map((p) => {
          const sum = summaries.find((s) => s.person.id === p.id);
          const bal = sum?.netBalance || 0;
          return (
            <View key={p.id} style={styles.personSummaryRow}>
              <View style={styles.personAvatarCircle}>
                <Text style={styles.personAvatarText}>{p.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{p.name}</Text>
                <Text style={styles.personSubtext}>
                  Paid: ₹{(sum?.totalPaid || 0).toLocaleString()} | Share: ₹{(sum?.expenseResponsibility || 0).toLocaleString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.personBalText,
                  { color: bal > 0 ? '#10b981' : bal < 0 ? '#f43f5e' : '#94a3b8' },
                ]}
              >
                {bal > 0 ? '+' : ''}₹{bal.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  metricCardCreditor: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  metricCardDebtor: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#64748b',
  },
  netCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  netSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  netValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  emptyCardText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  transferFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  debtorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f43f5e',
  },
  creditorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  transferAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  personSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  personAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  personSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  personBalText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

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
import { PieChart as PieIcon, Sparkles, TrendingUp, TrendingDown, Layers } from 'lucide-react-native';

export function AnalyticsScreen() {
  const { profile, transactions } = useFinanceStore();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Expenses only
  const expenses = transactions.filter((t) => t.type !== 'Income' && t.type !== 'Borrow');
  const incomeList = transactions.filter((t) => t.type === 'Income' || t.type === 'Borrow');

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncomeAmount = incomeList.reduce((sum, i) => sum + i.amount, 0);
  const netCashFlow = totalIncomeAmount - totalExpenseAmount;

  // Real Category Breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const topCategoryName = sortedCategories[0] ? sortedCategories[0][0] : 'None';
  const topCategoryAmount = sortedCategories[0] ? sortedCategories[0][1] : 0;

  // Highest Expense Item
  const highestExpenseItem = [...expenses].sort((a, b) => b.amount - a.amount)[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Excel Reports & Analytics</Text>
        <Text style={styles.subtitle}>Automated charts, cash flow, and spending breakdown</Text>
      </View>

      {/* Period Tabs */}
      <View style={styles.periodTabs}>
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.tab, activeTab === period && styles.tabActive]}
            onPress={() => setActiveTab(period)}
          >
            <Text style={[styles.tabText, activeTab === period && styles.tabTextActive]}>
              {period.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Cash Flow Summary */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <TrendingUp size={16} color="#10b981" />
            <Text style={styles.kpiLabel}>Total Income</Text>
            <Text style={[styles.kpiVal, { color: '#10b981' }]}>
              {profile.currency}{totalIncomeAmount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <TrendingDown size={16} color="#ef4444" />
            <Text style={styles.kpiLabel}>Total Expenses</Text>
            <Text style={[styles.kpiVal, { color: '#ef4444' }]}>
              {profile.currency}{totalExpenseAmount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Layers size={16} color="#3b82f6" />
            <Text style={styles.kpiLabel}>Net Cash Flow</Text>
            <Text style={[styles.kpiVal, { color: netCashFlow >= 0 ? '#3b82f6' : '#ef4444' }]}>
              {netCashFlow >= 0 ? '+' : ''}{profile.currency}{netCashFlow.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Highlights & Top Category */}
        <View style={styles.highlightCard}>
          <View style={styles.hlHeader}>
            <Sparkles size={16} color="#10b981" />
            <Text style={styles.hlTitle}>Key Financial Insights</Text>
          </View>

          <View style={styles.hlRow}>
            <Text style={styles.hlLabel}>Top Category:</Text>
            <Text style={styles.hlVal}>{topCategoryName} ({profile.currency}{topCategoryAmount})</Text>
          </View>

          {highestExpenseItem && (
            <View style={styles.hlRow}>
              <Text style={styles.hlLabel}>Highest Single Expense:</Text>
              <Text style={styles.hlVal}>{highestExpenseItem.title} ({profile.currency}{highestExpenseItem.amount})</Text>
            </View>
          )}
        </View>

        {/* Expenses by Category Breakdown */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <PieIcon size={18} color="#10b981" />
            <Text style={styles.chartCardTitle}>Expenses by Category</Text>
          </View>

          {sortedCategories.length === 0 ? (
            <Text style={styles.emptyText}>No category expenses recorded yet.</Text>
          ) : (
            sortedCategories.map(([cat, amt]) => {
              const pct = totalExpenseAmount > 0 ? Math.round((amt / totalExpenseAmount) * 100) : 0;
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat}</Text>
                    <Text style={styles.catAmt}>
                      {profile.currency}{amt.toLocaleString()} ({pct}%)
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  periodTabs: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginVertical: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  kpiVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  highlightCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  hlTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  hlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  hlLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  hlVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  chartCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
  },
  catRow: {
    marginBottom: 12,
  },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  catAmt: {
    fontSize: 12,
    color: '#94a3b8',
  },
  barBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
});

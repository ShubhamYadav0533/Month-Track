import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { Calendar, ShieldCheck, Layers } from 'lucide-react-native';

export function MonthlyLedgerScreen() {
  const {
    selectedMonth,
    setSelectedMonth,
    getMonthlyLedgerReport,
    getMonthlyChartSeries,
    people,
  } = useSharedLedgerStore();

  const report = getMonthlyLedgerReport(selectedMonth);
  const chartSeries = getMonthlyChartSeries(people[0]?.id);

  // Quick month selector options
  const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Month Selector Header */}
      <View style={styles.monthHeader}>
        <Calendar size={18} color="#10b981" />
        <Text style={styles.monthHeaderTitle}>Monthly Financial Ledger</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
        {months.map((m) => {
          const dateObj = new Date(`${m}-01`);
          const label = isNaN(dateObj.getTime())
            ? m
            : dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

          const isSelected = selectedMonth === m;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.monthChip, isSelected && styles.monthChipActive]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Embedded Auto-Calculated Monthly Graph Chart */}
      <MonthlyTrendChart dataPoints={chartSeries} />

      {/* Complete Monthly Ledger Table */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Layers size={18} color="#3b82f6" />
          <Text style={styles.cardTitle}>{selectedMonth} Financial Statement</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>1. Opening Balance (Carry Forward)</Text>
            <Text style={[styles.tableVal, { color: report.openingBalance >= 0 ? '#10b981' : '#f43f5e' }]}>
              {report.openingBalance >= 0 ? '+' : ''}₹{report.openingBalance.toLocaleString()}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>2. New Group Expenses</Text>
            <Text style={styles.tableVal}>₹{report.newExpenses.toLocaleString()}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>3. User Expense Contributions</Text>
            <Text style={[styles.tableVal, { color: '#10b981' }]}>
              ₹{report.userContributions.toLocaleString()}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>4. Money Lent (I Lent)</Text>
            <Text style={[styles.tableVal, { color: '#3b82f6' }]}>
              ₹{report.moneyLent.toLocaleString()}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>5. Money Borrowed (I Borrowed)</Text>
            <Text style={[styles.tableVal, { color: '#f59e0b' }]}>
              ₹{report.moneyBorrowed.toLocaleString()}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>6. Repayments Received</Text>
            <Text style={[styles.tableVal, { color: '#10b981' }]}>
              ₹{report.repaymentsReceived.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.tableRow, styles.closingRow]}>
            <Text style={styles.closingLabel}>Closing Net Balance</Text>
            <Text
              style={[
                styles.closingVal,
                { color: report.closingBalance >= 0 ? '#10b981' : '#f43f5e' },
              ]}
            >
              {report.closingBalance >= 0 ? '+' : ''}₹{report.closingBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Section 9 Carry-Forward Banner */}
        <View style={styles.carryForwardBanner}>
          <ShieldCheck size={18} color="#60a5fa" />
          <View style={{ flex: 1 }}>
            <Text style={styles.carryForwardTitle}>Automatic Carry Forward Active</Text>
            <Text style={styles.carryForwardText}>
              Unsettled balance of ₹{report.unsettledAmount.toLocaleString()} will automatically carry forward into the next month's opening balance while keeping {selectedMonth} historical records immutable.
            </Text>
          </View>
        </View>
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  monthHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  monthScroll: {
    marginBottom: 16,
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  monthChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  monthChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  monthChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  table: {
    gap: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tableLabel: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  tableVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  closingRow: {
    borderBottomWidth: 0,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  closingLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  closingVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  carryForwardBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  carryForwardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 2,
  },
  carryForwardText: {
    fontSize: 11,
    color: '#93c5fd',
    lineHeight: 16,
  },
});

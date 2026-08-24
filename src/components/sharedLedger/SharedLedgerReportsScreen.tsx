import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { FileText, Filter } from 'lucide-react-native';

type ReportType =
  | 'monthly'
  | 'person'
  | 'group'
  | 'category'
  | 'lending'
  | 'outstanding'
  | 'settlement';

export function SharedLedgerReportsScreen() {
  const {
    groups,
    sharedExpenses,
    loans,
    repayments,
    selectedMonth,
    getPersonBalanceSummaries,
    getMinimizedSettlements,
  } = useSharedLedgerStore();

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');

  const summaries = getPersonBalanceSummaries(
    selectedMonth,
    selectedGroupId === 'ALL' ? undefined : selectedGroupId
  );

  const minTransfers = getMinimizedSettlements(
    selectedMonth,
    selectedGroupId === 'ALL' ? undefined : selectedGroupId
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <FileText size={20} color="#10b981" />
        <Text style={styles.headerTitle}>Financial Reports & Analytics</Text>
      </View>

      {/* Report Type Selector Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        {[
          { id: 'monthly', label: 'Monthly Summary' },
          { id: 'person', label: 'Person-wise Report' },
          { id: 'group', label: 'Group-wise Report' },
          { id: 'category', label: 'Category Breakdown' },
          { id: 'lending', label: 'Lending & Borrowing' },
          { id: 'outstanding', label: 'Outstanding Balances' },
          { id: 'settlement', label: 'Settlement Plan' },
        ].map((rt) => (
          <TouchableOpacity
            key={rt.id}
            style={[styles.pill, reportType === rt.id && styles.pillActive]}
            onPress={() => setReportType(rt.id as ReportType)}
          >
            <Text style={[styles.pillText, reportType === rt.id && styles.pillTextActive]}>
              {rt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Person & Group Filter Bar */}
      <View style={styles.filterBar}>
        <Filter size={16} color="#94a3b8" />
        <Text style={styles.filterLabel}>Filters:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <TouchableOpacity
            style={[styles.filterChip, selectedGroupId === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedGroupId('ALL')}
          >
            <Text style={[styles.filterChipText, selectedGroupId === 'ALL' && styles.filterChipTextActive]}>
              All Groups
            </Text>
          </TouchableOpacity>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.filterChip, selectedGroupId === g.id && styles.filterChipActive]}
              onPress={() => setSelectedGroupId(g.id)}
            >
              <Text style={[styles.filterChipText, selectedGroupId === g.id && styles.filterChipTextActive]}>
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Report Content View */}
      {reportType === 'monthly' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Financial Summary ({selectedMonth})</Text>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Total Shared Expenses</Text>
            <Text style={styles.reportVal}>
              ₹
              {sharedExpenses
                .filter((e) => e.status !== 'voided' && e.month === selectedMonth)
                .reduce((acc, e) => acc + e.totalAmount, 0)
                .toLocaleString()}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Total Loans Issued</Text>
            <Text style={[styles.reportVal, { color: '#3b82f6' }]}>
              ₹
              {loans
                .filter((l) => l.date.startsWith(selectedMonth))
                .reduce((acc, l) => acc + l.originalAmount, 0)
                .toLocaleString()}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Total Repayments Made</Text>
            <Text style={[styles.reportVal, { color: '#10b981' }]}>
              ₹
              {repayments
                .filter((r) => r.date.startsWith(selectedMonth))
                .reduce((acc, r) => acc + r.amount, 0)
                .toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {reportType === 'person' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Person-wise Financial Audit</Text>
          {summaries.map((s) => (
            <View key={s.person.id} style={styles.personReportBox}>
              <Text style={styles.personReportName}>{s.person.name}</Text>
              <View style={styles.reportGrid}>
                <Text style={styles.gridText}>Paid: ₹{s.totalPaid.toLocaleString()}</Text>
                <Text style={styles.gridText}>Share: ₹{s.expenseResponsibility.toLocaleString()}</Text>
                <Text style={styles.gridText}>Lent: ₹{s.totalLent.toLocaleString()}</Text>
                <Text style={styles.gridText}>Borrowed: ₹{s.totalBorrowed.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {reportType === 'outstanding' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Outstanding Balance Ledger</Text>
          {summaries.map((s) => (
            <View key={s.person.id} style={styles.reportRow}>
              <Text style={styles.reportLabel}>{s.person.name}</Text>
              <Text
                style={[
                  styles.reportVal,
                  { color: s.netBalance > 0 ? '#10b981' : s.netBalance < 0 ? '#f43f5e' : '#94a3b8' },
                ]}
              >
                {s.statusLabel}
              </Text>
            </View>
          ))}
        </View>
      )}

      {reportType === 'settlement' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Min-Cash Flow Settlement Plan</Text>
          {minTransfers.map((t, idx) => (
            <View key={idx} style={styles.reportRow}>
              <Text style={styles.reportLabel}>
                {t.fromPersonName} → {t.toPersonName}
              </Text>
              <Text style={[styles.reportVal, { color: '#10b981' }]}>
                ₹{t.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {reportType === 'category' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category Expense Distribution</Text>
          {['Rent', 'Electricity', 'Internet', 'Water', 'Grocery', 'Food', 'Bills', 'Other'].map((cat) => {
            const catTotal = sharedExpenses
              .filter((e) => e.status !== 'voided' && e.category === cat)
              .reduce((acc, e) => acc + e.totalAmount, 0);

            if (catTotal === 0) return null;

            return (
              <View key={cat} style={styles.reportRow}>
                <Text style={styles.reportLabel}>{cat}</Text>
                <Text style={styles.reportVal}>₹{catTotal.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>
      )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  pillScroll: {
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 14,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  reportLabel: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  reportVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  personReportBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  personReportName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});

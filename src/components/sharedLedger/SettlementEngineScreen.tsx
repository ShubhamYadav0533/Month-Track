import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { Scale, ChevronRight, CheckCircle, ShieldCheck, Zap } from 'lucide-react-native';

export function SettlementEngineScreen() {
  const {
    groups,
    selectedMonth,
    recordSettlement,
    getPersonBalanceSummaries,
    getMinimizedSettlements,
  } = useSharedLedgerStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');

  const summaries = getPersonBalanceSummaries(
    selectedMonth,
    selectedGroupId === 'ALL' ? undefined : selectedGroupId
  );

  const minTransfers = getMinimizedSettlements(
    selectedMonth,
    selectedGroupId === 'ALL' ? undefined : selectedGroupId
  );

  const handleSettle = (fromPersonId: string, toPersonId: string, amount: number) => {
    recordSettlement({
      groupId: selectedGroupId === 'ALL' ? undefined : selectedGroupId,
      fromPersonId,
      toPersonId,
      amount,
      month: selectedMonth,
      date: new Date().toISOString().slice(0, 10),
      notes: `Min Cash Flow Settlement - ${selectedMonth}`,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerBadge}>
          <Zap size={14} color="#10b981" />
          <Text style={styles.headerBadgeText}>Greedy Debt Minimization Engine</Text>
        </View>
        <Text style={styles.headerTitle}>Settlement Optimization</Text>
        <Text style={styles.headerSubtitle}>
          Calculates minimum practical transfers to resolve circular debts between group members without unnecessary transfers.
        </Text>
      </View>

      {/* Group Selector Pills */}
      <View style={styles.groupSelectorRow}>
        <TouchableOpacity
          style={[styles.groupChip, selectedGroupId === 'ALL' && styles.groupChipActive]}
          onPress={() => setSelectedGroupId('ALL')}
        >
          <Text style={[styles.groupChipText, selectedGroupId === 'ALL' && styles.groupChipTextActive]}>
            All Groups
          </Text>
        </TouchableOpacity>
        {groups.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[styles.groupChip, selectedGroupId === g.id && styles.groupChipActive]}
            onPress={() => setSelectedGroupId(g.id)}
          >
            <Text style={[styles.groupChipText, selectedGroupId === g.id && styles.groupChipTextActive]}>
              {g.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Min Transfers Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Scale size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Optimized Direct Cash Settlements</Text>
        </View>

        {minTransfers.length === 0 ? (
          <View style={styles.settledBanner}>
            <CheckCircle size={32} color="#10b981" />
            <Text style={styles.settledTitle}>Zero Unsettled Balances!</Text>
            <Text style={styles.settledSubtext}>
              All group members have balanced responsibility and contributions for {selectedMonth}.
            </Text>
          </View>
        ) : (
          minTransfers.map((t, idx) => (
            <View key={idx} style={styles.transferCard}>
              <View style={styles.transferRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.debtorText}>{t.fromPersonName}</Text>
                  <Text style={styles.transferSub}>Debtor (Must Pay)</Text>
                </View>

                <View style={styles.flowBox}>
                  <Text style={styles.amountText}>₹{t.amount.toLocaleString()}</Text>
                  <ChevronRight size={18} color="#10b981" />
                </View>

                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.creditorText}>{t.toPersonName}</Text>
                  <Text style={styles.transferSub}>Creditor (Receives)</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.settleBtn}
                onPress={() => handleSettle(t.fromPersonId, t.toPersonId, t.amount)}
                activeOpacity={0.8}
              >
                <ShieldCheck size={14} color="#ffffff" />
                <Text style={styles.settleBtnText}>Mark Transfer Settled</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Complete Net Balances Table */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Net Member Balance Breakdown</Text>
        <Text style={styles.subtext}>
          Combined expense responsibility, actual paid amounts, and outstanding loans for {selectedMonth}.
        </Text>

        {summaries.map((s) => (
          <View key={s.person.id} style={styles.breakdownRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{s.person.name}</Text>
              <Text style={styles.breakdownMeta}>
                Paid: ₹{s.totalPaid.toLocaleString()} | Share: ₹{s.expenseResponsibility.toLocaleString()}
              </Text>
            </View>

            <Text
              style={[
                styles.netBalVal,
                { color: s.netBalance > 0 ? '#10b981' : s.netBalance < 0 ? '#f43f5e' : '#94a3b8' },
              ]}
            >
              {s.netBalance > 0 ? '+' : ''}₹{s.netBalance.toLocaleString()}
            </Text>
          </View>
        ))}
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
  groupSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  groupChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  groupChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  groupChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  settledBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  settledTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  settledSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  transferCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  transferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debtorText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f43f5e',
  },
  creditorText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  transferSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  flowBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  settleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  breakdownMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  netBalVal: {
    fontSize: 15,
    fontWeight: '800',
  },
});

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Person } from '../../types/sharedLedger';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { X, Phone, Mail, FileText, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react-native';

interface PersonDetailsModalProps {
  visible: boolean;
  person: Person | null;
  onClose: () => void;
}

export function PersonDetailsModal({ visible, person, onClose }: PersonDetailsModalProps) {
  const { sharedExpenses, loans, repayments, getPersonBalanceSummaries } = useSharedLedgerStore();

  if (!person) return null;

  const summaries = getPersonBalanceSummaries();
  const summary = summaries.find((s) => s.person.id === person.id) || {
    person,
    totalLent: 0,
    totalBorrowed: 0,
    totalPaid: 0,
    totalReceived: 0,
    expenseResponsibility: 0,
    netBalance: 0,
    statusLabel: 'Settled',
  };

  // Compile timeline of linked transactions for this person
  const personExpenses = sharedExpenses.filter(
    (e) => e.status !== 'voided' && (e.paidByPersonId === person.id || e.splits?.some((s) => s.personId === person.id))
  );

  const personLoans = loans.filter((l) => l.personId === person.id);

  const personRepayments = repayments.filter(
    (r) => r.personId === person.id || r.fromPersonId === person.id || r.toPersonId === person.id
  );

  // Unified timeline items
  const timeline: {
    id: string;
    title: string;
    typeLabel: string;
    amount: number;
    date: string;
    isPositive: boolean;
  }[] = [];

  personExpenses.forEach((e) => {
    const isPayer = e.paidByPersonId === person.id;
    const split = e.splits?.find((s) => s.personId === person.id);

    if (isPayer) {
      timeline.push({
        id: `exp_paid_${e.id}`,
        title: `${e.description} (Paid Total)`,
        typeLabel: 'Expense Payment',
        amount: e.totalAmount,
        date: e.date,
        isPositive: true,
      });
    }

    if (split) {
      timeline.push({
        id: `exp_split_${e.id}`,
        title: `${e.description} (Responsibility Share)`,
        typeLabel: 'Expense Share',
        amount: split.amount,
        date: e.date,
        isPositive: false,
      });
    }
  });

  personLoans.forEach((l) => {
    timeline.push({
      id: `loan_${l.id}`,
      title: `${l.description} (${l.type})`,
      typeLabel: l.type === 'LEND' ? 'Money Lent' : 'Money Borrowed',
      amount: l.originalAmount,
      date: l.date,
      isPositive: l.type === 'LEND',
    });
  });

  personRepayments.forEach((r) => {
    timeline.push({
      id: `rep_${r.id}`,
      title: `Repayment: ${r.notes || 'Cash Transfer'}`,
      typeLabel: 'Repayment Settlement',
      amount: r.amount,
      date: r.date,
      isPositive: r.toPersonId === person.id,
    });
  });

  // Sort timeline chronologically descending
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Person Details & History</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{person.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.nameText}>{person.name}</Text>

            <View style={[styles.statusBadge, person.status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={[styles.statusText, person.status === 'active' ? styles.statusActiveText : styles.statusInactiveText]}>
                {person.status.toUpperCase()}
              </Text>
            </View>

            {/* Info details */}
            <View style={styles.infoList}>
              {person.phoneNumber && (
                <View style={styles.infoRow}>
                  <Phone size={16} color="#94a3b8" />
                  <Text style={styles.infoText}>{person.phoneNumber}</Text>
                </View>
              )}
              {person.email && (
                <View style={styles.infoRow}>
                  <Mail size={16} color="#94a3b8" />
                  <Text style={styles.infoText}>{person.email}</Text>
                </View>
              )}
              {person.notes && (
                <View style={styles.infoRow}>
                  <FileText size={16} color="#94a3b8" />
                  <Text style={styles.infoText}>{person.notes}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Balance Overview Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Net Balance</Text>
            <Text
              style={[
                styles.balanceValue,
                { color: summary.netBalance >= 0 ? '#10b981' : '#f43f5e' },
              ]}
            >
              {summary.netBalance >= 0 ? '+' : ''}₹{summary.netBalance.toLocaleString()}
            </Text>
            <Text style={styles.balanceStatus}>{summary.statusLabel}</Text>

            {/* Metrics Breakdown Grid */}
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Total Lent</Text>
                <Text style={styles.gridValue}>₹{summary.totalLent.toLocaleString()}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Total Borrowed</Text>
                <Text style={styles.gridValue}>₹{summary.totalBorrowed.toLocaleString()}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Total Paid</Text>
                <Text style={styles.gridValue}>₹{summary.totalPaid.toLocaleString()}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Expense Share</Text>
                <Text style={styles.gridValue}>₹{summary.expenseResponsibility.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Transaction History Timeline */}
          <Text style={styles.sectionHeader}>TRANSACTION TIMELINE</Text>
          {timeline.length === 0 ? (
            <Text style={styles.emptyText}>No linked transactions found for {person.name}.</Text>
          ) : (
            timeline.map((item) => (
              <View key={item.id} style={styles.timelineRow}>
                <View style={styles.timelineIconBox}>
                  {item.isPositive ? (
                    <ArrowUpRight size={18} color="#10b981" />
                  ) : (
                    <ArrowDownLeft size={18} color="#f43f5e" />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <View style={styles.timelineMeta}>
                    <Clock size={12} color="#64748b" />
                    <Text style={styles.timelineDate}>{item.date}</Text>
                    <Text style={styles.timelineTag}>{item.typeLabel}</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.timelineAmount,
                    { color: item.isPositive ? '#10b981' : '#f8fafc' },
                  ]}
                >
                  {item.isPositive ? '+' : '-'}₹{item.amount.toLocaleString()}
                </Text>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 14,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusActiveText: {
    color: '#10b981',
  },
  statusInactiveText: {
    color: '#94a3b8',
  },
  infoList: {
    width: '100%',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 4,
  },
  balanceStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 14,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
  },
  gridLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timelineIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: '#64748b',
  },
  timelineTag: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
});

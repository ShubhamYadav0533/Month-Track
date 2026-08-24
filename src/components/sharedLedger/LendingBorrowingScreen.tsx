import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { Loan, LoanType } from '../../types/sharedLedger';
import { RecordRepaymentModal } from './RecordRepaymentModal';
import { ArrowUpRight, ArrowDownLeft, Plus, X } from 'lucide-react-native';

export function LendingBorrowingScreen() {
  const { loans, people, addLoan } = useSharedLedgerStore();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LEND' | 'BORROW'>('ALL');
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<Loan | null>(null);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);

  // Add Loan Form State
  const [loanType, setLoanType] = useState<LoanType>('LEND');
  const [personId, setPersonId] = useState<string>(people[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod] = useState('UPI');

  const filteredLoans = loans.filter((l) => {
    if (activeFilter === 'ALL') return true;
    return l.type === activeFilter;
  });

  const handleOpenAdd = (type: LoanType = 'LEND') => {
    setLoanType(type);
    setAmount('');
    setDescription('');
    setDueDate('');
    setPersonId(people[0]?.id || '');
    setIsAddLoanModalOpen(true);
  };

  const handleSaveLoan = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !description.trim()) return;

    addLoan({
      personId: personId || people[0]?.id || '',
      type: loanType,
      amount: amt,
      date: new Date().toISOString().slice(0, 10),
      dueDate: dueDate || undefined,
      description: description.trim(),
      paymentMethod,
    });

    setIsAddLoanModalOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <View style={styles.headerBar}>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'ALL' && styles.filterTabTextActive]}>
              All Loans ({loans.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'LEND' && styles.filterTabActive]}
            onPress={() => setActiveFilter('LEND')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'LEND' && styles.filterTabTextActive]}>
              I Lent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'BORROW' && styles.filterTabActive]}
            onPress={() => setActiveFilter('BORROW')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'BORROW' && styles.filterTabTextActive]}>
              I Borrowed
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenAdd('LEND')} activeOpacity={0.8}>
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>New Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Loan List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredLoans.length === 0 ? (
          <Text style={styles.emptyText}>No loans or borrowings recorded under this filter.</Text>
        ) : (
          filteredLoans.map((loan) => {
            const person = people.find((p) => p.id === loan.personId);

            const isFullyPaid = loan.status === 'Fully Paid';
            const progressPct =
              loan.originalAmount > 0
                ? Math.min(100, Math.round((loan.repaidAmount / loan.originalAmount) * 100))
                : 0;

            return (
              <View key={loan.id} style={styles.loanCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.typeBadgeRow}>
                    {loan.type === 'LEND' ? (
                      <View style={[styles.typeBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <ArrowUpRight size={14} color="#10b981" />
                        <Text style={[styles.typeBadgeText, { color: '#10b981' }]}>I LENT</Text>
                      </View>
                    ) : (
                      <View style={[styles.typeBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <ArrowDownLeft size={14} color="#f59e0b" />
                        <Text style={[styles.typeBadgeText, { color: '#f59e0b' }]}>I BORROWED</Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isFullyPaid ? styles.statusPaid : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isFullyPaid ? styles.statusPaidText : styles.statusPendingText,
                      ]}
                    >
                      {loan.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.loanTitle}>{loan.description}</Text>
                <Text style={styles.loanPerson}>Counterpart: {person?.name || 'Unknown'}</Text>

                {/* Amount breakdown */}
                <View style={styles.amountBox}>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Original</Text>
                    <Text style={styles.amountVal}>₹{loan.originalAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Repaid</Text>
                    <Text style={[styles.amountVal, { color: '#10b981' }]}>
                      ₹{loan.repaidAmount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Remaining</Text>
                    <Text style={[styles.amountVal, { color: '#f43f5e' }]}>
                      ₹{loan.remainingAmount.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${progressPct}%` }]} />
                </View>

                {/* Footer action */}
                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    Date: {loan.date} {loan.dueDate ? `| Due: ${loan.dueDate}` : ''}
                  </Text>

                  {!isFullyPaid && (
                    <TouchableOpacity
                      style={styles.repayActionBtn}
                      onPress={() => {
                        setSelectedLoanForRepayment(loan);
                        setIsRepaymentModalOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.repayActionText}>Record Repayment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Record Repayment Modal */}
      <RecordRepaymentModal
        visible={isRepaymentModalOpen}
        loan={selectedLoanForRepayment}
        onClose={() => setIsRepaymentModalOpen(false)}
      />

      {/* Add Loan Modal */}
      <Modal visible={isAddLoanModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Money Lent / Borrowed</Text>
              <TouchableOpacity onPress={() => setIsAddLoanModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[styles.typeToggleBtn, loanType === 'LEND' && styles.typeToggleLend]}
                onPress={() => setLoanType('LEND')}
              >
                <ArrowUpRight size={16} color={loanType === 'LEND' ? '#ffffff' : '#94a3b8'} />
                <Text style={[styles.typeToggleText, loanType === 'LEND' && styles.typeToggleTextActive]}>
                  I Lent (Given)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeToggleBtn, loanType === 'BORROW' && styles.typeToggleBorrow]}
                onPress={() => setLoanType('BORROW')}
              >
                <ArrowDownLeft size={16} color={loanType === 'BORROW' ? '#ffffff' : '#94a3b8'} />
                <Text style={[styles.typeToggleText, loanType === 'BORROW' && styles.typeToggleTextActive]}>
                  I Borrowed (Taken)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Person *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                {people.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, personId === p.id && styles.chipActive]}
                    onPress={() => setPersonId(p.id)}
                  >
                    <Text style={[styles.chipText, personId === p.id && styles.chipTextActive]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="5000"
                placeholderTextColor="#64748b"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description / Purpose *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cash Advance for Emergency / Shopping"
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLoan} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  filterTabs: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 30,
  },
  loanCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadgeRow: {
    flexDirection: 'row',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPaidText: {
    color: '#10b981',
  },
  statusPendingText: {
    color: '#f59e0b',
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  loanPerson: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  amountBox: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  amountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
  },
  repayActionBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  repayActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalPanel: {
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
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeToggleLend: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeToggleBorrow: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  typeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  typeToggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

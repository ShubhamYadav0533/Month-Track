import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { Loan } from '../../types/sharedLedger';
import { X } from 'lucide-react-native';

interface RecordRepaymentModalProps {
  visible: boolean;
  loan?: Loan | null;
  onClose: () => void;
}

export function RecordRepaymentModal({ visible, loan, onClose }: RecordRepaymentModalProps) {
  const { people, recordRepayment } = useSharedLedgerStore();

  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    loan ? loan.personId : people[0]?.id || ''
  );
  const [amount, setAmount] = useState<string>(
    loan ? String(loan.remainingAmount) : ''
  );
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');

  const targetPerson = people.find((p) => p.id === selectedPersonId) || people[0];
  const primaryUser = people.find((p) => p.name.toLowerCase().includes('(me)')) || people[0];

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    // Determine direction: if loan is LEND (I lent to Person), repayment is Person -> Me
    // If loan is BORROW (I borrowed from Person), repayment is Me -> Person
    const isLend = loan ? loan.type === 'LEND' : true;
    const fromPersonId = isLend ? targetPerson.id : primaryUser.id;
    const toPersonId = isLend ? primaryUser.id : targetPerson.id;

    recordRepayment({
      loanId: loan?.id,
      personId: targetPerson.id,
      fromPersonId,
      toPersonId,
      amount: amt,
      date,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Money Repayment</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveHeaderBtn}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loan && (
            <View style={styles.loanContextCard}>
              <Text style={styles.loanContextTitle}>Linked Loan Context</Text>
              <Text style={styles.loanContextText}>
                {loan.description} (Original: ₹{loan.originalAmount.toLocaleString()} | Remaining: ₹{loan.remainingAmount.toLocaleString()})
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.label}>Repayment Amount (₹) *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.prefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor="#64748b"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Select Counterpart Person</Text>
            <View style={styles.personPickerRow}>
              {people.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, selectedPersonId === p.id && styles.chipActive]}
                  onPress={() => setSelectedPersonId(p.id)}
                >
                  <Text style={[styles.chipText, selectedPersonId === p.id && styles.chipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Repayment Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={date}
              onChangeText={setDate}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>Notes / Payment Method (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. GPay UPI transfer / Cash"
              placeholderTextColor="#64748b"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.submitBtnText}>Confirm Repayment Entry</Text>
          </TouchableOpacity>
        </View>
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
  saveHeaderBtn: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  content: {
    padding: 16,
  },
  loanContextCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  loanContextTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 2,
  },
  loanContextText: {
    fontSize: 12,
    color: '#93c5fd',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  prefix: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
  },
  amountInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
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
  personPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
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
  submitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

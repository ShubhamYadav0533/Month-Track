import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { SharedExpenseCategory, SplitType } from '../../types/sharedLedger';
import { X, Check } from 'lucide-react-native';

const CATEGORIES: SharedExpenseCategory[] = [
  'Rent',
  'Electricity',
  'Internet',
  'Water',
  'Grocery',
  'Food',
  'Maintenance',
  'Travel',
  'Bills',
  'Other',
];

const SPLIT_TYPES: { id: SplitType; label: string; desc: string }[] = [
  { id: 'equal', label: 'Equal Split', desc: 'Divided evenly among group members' },
  { id: 'exact', label: 'Custom Amount', desc: 'Specify exact monetary amount for each member' },
  { id: 'percentage', label: 'Percentage %', desc: 'Specify % share for each member (Must equal 100%)' },
  { id: 'share', label: 'Shares (1x, 2x)', desc: 'Specify relative share ratio for each member' },
];

interface AddSharedExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddSharedExpenseModal({ visible, onClose }: AddSharedExpenseModalProps) {
  const { groups, people, groupMembers, addSharedExpense } =
    useSharedLedgerStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups[0]?.id || ''
  );
  const [category, setCategory] = useState<SharedExpenseCategory>('Rent');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidByPersonId, setPaidByPersonId] = useState<string>(
    people[0]?.id || ''
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitType, setSplitType] = useState<SplitType>('equal');

  // Custom Split Details: Map of personId -> string value
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');

  // Get active members for selected group
  const activeMembers = groupMembers
    .filter((gm) => gm.groupId === selectedGroupId)
    .map((gm) => people.find((p) => p.id === gm.personId))
    .filter((p): p is typeof people[0] => Boolean(p));

  const membersToSplit = activeMembers.length > 0 ? activeMembers : people;

  const handleCustomValueChange = (personId: string, val: string) => {
    setCustomValues((prev) => ({ ...prev, [personId]: val }));
  };

  const handleSave = () => {
    setErrorMsg('');
    const amount = parseFloat(totalAmount);

    if (!amount || amount <= 0) {
      setErrorMsg('Please enter a valid expense total amount > 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please enter an expense description.');
      return;
    }

    if (!selectedGroupId) {
      setErrorMsg('Please select a group.');
      return;
    }

    const customDetails = membersToSplit.map((p) => ({
      personId: p.id,
      value: parseFloat(customValues[p.id] || '0') || 0,
    }));

    // Validation for exact / percentage splits
    if (splitType === 'exact') {
      const sum = customDetails.reduce((acc, d) => acc + d.value, 0);
      if (Math.abs(sum - amount) > 0.05) {
        setErrorMsg(
          `Custom split amounts (₹${sum.toLocaleString()}) must equal total expense amount (₹${amount.toLocaleString()}).`
        );
        return;
      }
    } else if (splitType === 'percentage') {
      const sumPct = customDetails.reduce((acc, d) => acc + d.value, 0);
      if (Math.abs(sumPct - 100) > 0.1) {
        setErrorMsg(`Percentage splits (${sumPct}%) must equal 100%.`);
        return;
      }
    }

    const expMonth = date.slice(0, 7);

    addSharedExpense({
      groupId: selectedGroupId,
      category,
      description: description.trim(),
      totalAmount: amount,
      paidByPersonId: paidByPersonId || membersToSplit[0]?.id || '',
      date,
      month: expMonth,
      splitType,
      customSplits: customDetails,
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
          <Text style={styles.headerTitle}>Add Shared Expense</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveHeaderBtn}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Group Selector */}
          <View style={styles.card}>
            <Text style={styles.label}>Select Group *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8 }}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.chip, selectedGroupId === g.id && styles.chipActive]}
                  onPress={() => setSelectedGroupId(g.id)}
                >
                  <Text style={[styles.chipText, selectedGroupId === g.id && styles.chipTextActive]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Amount & Description */}
          <View style={styles.card}>
            <Text style={styles.label}>Total Amount *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.prefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="12000"
                placeholderTextColor="#64748b"
                value={totalAmount}
                onChangeText={setTotalAmount}
              />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Description *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. August Room Rent"
              placeholderTextColor="#64748b"
              value={description}
              onChangeText={setDescription}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Expense Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.card}>
            <Text style={styles.label}>Expense Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Paid By Person Selector */}
          <View style={styles.card}>
            <Text style={styles.label}>Who Actually Paid? *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8 }}>
              {membersToSplit.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, paidByPersonId === p.id && styles.chipActive]}
                  onPress={() => setPaidByPersonId(p.id)}
                >
                  <Text style={[styles.chipText, paidByPersonId === p.id && styles.chipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Split Mode Selector */}
          <View style={styles.card}>
            <Text style={styles.label}>Expense Splitting Mode</Text>
            {SPLIT_TYPES.map((st) => (
              <TouchableOpacity
                key={st.id}
                style={[styles.splitTypeRow, splitType === st.id && styles.splitTypeRowActive]}
                onPress={() => setSplitType(st.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.splitTypeTitle, splitType === st.id && styles.splitTypeTitleActive]}>
                    {st.label}
                  </Text>
                  <Text style={styles.splitTypeDesc}>{st.desc}</Text>
                </View>
                {splitType === st.id && <Check size={18} color="#10b981" />}
              </TouchableOpacity>
            ))}

            {/* Custom inputs if not equal */}
            {splitType !== 'equal' && (
              <View style={styles.customSplitsContainer}>
                <Text style={styles.customHeader}>
                  Enter {splitType === 'exact' ? 'Exact Amount (₹)' : splitType === 'percentage' ? 'Percentage (%)' : 'Share Count (x)'} per member:
                </Text>
                {membersToSplit.map((p) => (
                  <View key={p.id} style={styles.customSplitRow}>
                    <Text style={styles.customPersonName}>{p.name}</Text>
                    <TextInput
                      style={styles.customInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      value={customValues[p.id] || ''}
                      onChangeText={(val) => handleCustomValueChange(p.id, val)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.submitBtnText}>Create Shared Expense</Text>
          </TouchableOpacity>

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
  saveHeaderBtn: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  scrollContent: {
    padding: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
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
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  catChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  catText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  catTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  splitTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  splitTypeRowActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  splitTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  splitTypeTitleActive: {
    color: '#10b981',
  },
  splitTypeDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  customSplitsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  customHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 8,
  },
  customSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customPersonName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  customInput: {
    width: 90,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    height: 36,
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  useFinanceStore,
  DEFAULT_ACC_UPI,
  DEFAULT_ACC_BANK,
  DEFAULT_ACC_WALLET,
  DEFAULT_ACC_CARD,
} from '../store/useFinanceStore';
import { ExpenseCategory, TransactionType, PaymentMethod } from '../types';
import { getFormattedDate } from '../utils/budgetCalculator';
import { parseReceiptImage } from '../utils/ocrParser';
import { X, Sparkles, Check } from 'lucide-react-native';

const CATEGORIES: { name: ExpenseCategory; icon: string; color: string }[] = [
  { name: 'Food', icon: '🍔', color: '#f59e0b' },
  { name: 'Groceries', icon: '🛒', color: '#10b981' },
  { name: 'Fuel', icon: '⛽', color: '#ef4444' },
  { name: 'Rent', icon: '🏠', color: '#14b8a6' },
  { name: 'Electricity', icon: '⚡', color: '#eab308' },
  { name: 'Gas', icon: '🔥', color: '#f97316' },
  { name: 'Internet', icon: '🌐', color: '#06b6d4' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Travel', icon: '✈️', color: '#8b5cf6' },
  { name: 'Medical', icon: '💊', color: '#10b981' },
  { name: 'Education', icon: '📚', color: '#3b82f6' },
  { name: 'Salary', icon: '💰', color: '#22c55e' },
  { name: 'Business', icon: '💼', color: '#6366f1' },
  { name: 'Investment', icon: '📈', color: '#84cc16' },
  { name: 'Entertainment', icon: '🎬', color: '#a855f7' },
  { name: 'Recharge', icon: '📱', color: '#3b82f6' },
  { name: 'Insurance', icon: '🛡️', color: '#64748b' },
  { name: 'EMI', icon: '💳', color: '#f43f5e' },
  { name: 'Others', icon: '📦', color: '#64748b' },
];

const TYPES: { name: TransactionType; color: string }[] = [
  { name: 'Expense', color: '#ef4444' },
  { name: 'Income', color: '#10b981' },
  { name: 'Transfer', color: '#3b82f6' },
  { name: 'Borrow', color: '#f59e0b' },
  { name: 'Lend', color: '#8b5cf6' },
  { name: 'EMI', color: '#ec4899' },
  { name: 'Investment', color: '#14b8a6' },
];

const PAYMENT_METHODS: { name: PaymentMethod; icon: string; accountId: string }[] = [
  { name: 'UPI', icon: '📱', accountId: DEFAULT_ACC_UPI },
  { name: 'Bank', icon: '🏦', accountId: DEFAULT_ACC_BANK },
  { name: 'Wallet', icon: '👛', accountId: DEFAULT_ACC_WALLET },
  { name: 'Credit Card', icon: '💳', accountId: DEFAULT_ACC_CARD },
  { name: 'Cash', icon: '💵', accountId: DEFAULT_ACC_WALLET },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export function AddTransactionModal({ isOpen, onClose, defaultType = 'Expense' }: Props) {
  const { addTransaction, accounts } = useFinanceStore();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [subCategory, setSubCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState(getFormattedDate());
  const [time] = useState('12:00 PM');
  const [recurring] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [tags] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>();
  const [isScanning, setIsScanning] = useState(false);

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const selectedAcc = PAYMENT_METHODS.find((p) => p.name === paymentMethod);
    const accountId = selectedAcc ? selectedAcc.accountId : accounts[0]?.id || 'acc_upi';

    addTransaction({
      title: title || `${type}: ${category}`,
      amount: numAmount,
      type,
      category,
      subCategory,
      accountId,
      paymentMethod,
      transactionDate: date || getFormattedDate(),
      time,
      recurring,
      location,
      notes,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      attachment: receiptUrl,
    });

    // Reset & Close
    setTitle('');
    setAmount('');
    setNotes('');
    setReceiptUrl(undefined);
    onClose();
  };

  const handleSimulateOCR = async () => {
    setIsScanning(true);
    const sampleReceipt = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400';
    const result = await parseReceiptImage(sampleReceipt);

    if (result) {
      setAmount(result.amount.toString());
      setCategory(result.category);
      if (result.storeName) setTitle(result.storeName);
      if (result.date) setDate(result.date);
      setReceiptUrl(sampleReceipt);
    }
    setIsScanning(false);
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Transaction</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Transaction Type Pills */}
            <Text style={styles.label}>Transaction Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.name}
                  style={[
                    styles.typeChip,
                    type === t.name && { backgroundColor: t.color, borderColor: t.color },
                  ]}
                  onPress={() => setType(t.name)}
                >
                  <Text style={[styles.typeText, type === t.name && styles.typeTextActive]}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title & Amount */}
            <View style={styles.rowGroup}>
              <View style={[styles.inputCol, { flex: 2 }]}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dinner, Salary, Fuel"
                  placeholderTextColor="#64748b"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={[styles.inputCol, { flex: 1 }]}>
                <Text style={styles.label}>Amount (₹) *</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0.00"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            {/* AI Receipt Scanner */}
            <TouchableOpacity
              style={styles.ocrBtn}
              onPress={handleSimulateOCR}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <>
                  <Sparkles size={16} color="#10b981" />
                  <Text style={styles.ocrBtnText}>
                    {receiptUrl ? 'Bill Attached (OCR Applied)' : 'AI Scan Receipt Photo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Category Selector */}
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={[
                    styles.catChip,
                    category === c.name && { backgroundColor: c.color, borderColor: c.color },
                  ]}
                  onPress={() => setCategory(c.name)}
                >
                  <Text style={styles.catIcon}>{c.icon}</Text>
                  <Text style={[styles.catText, category === c.name && styles.catTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Payment Method */}
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.pmGrid}>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.name}
                  style={[
                    styles.pmChip,
                    paymentMethod === pm.name && styles.pmChipActive,
                  ]}
                  onPress={() => setPaymentMethod(pm.name)}
                >
                  <Text style={styles.pmIcon}>{pm.icon}</Text>
                  <Text
                    style={[
                      styles.pmText,
                      paymentMethod === pm.name && styles.pmTextActive,
                    ]}
                  >
                    {pm.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sub Category & Location */}
            <View style={styles.rowGroup}>
              <View style={[styles.inputCol, { flex: 1 }]}>
                <Text style={styles.label}>Sub-Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Swiggy, Uber"
                  placeholderTextColor="#64748b"
                  value={subCategory}
                  onChangeText={setSubCategory}
                />
              </View>

              <View style={[styles.inputCol, { flex: 1 }]}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Connaught Place"
                  placeholderTextColor="#64748b"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add optional notes or descriptions..."
              placeholderTextColor="#64748b"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Check size={20} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Transaction</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    flexGrow: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  inputCol: {
    flex: 1,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  amountInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  ocrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  ocrBtnText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 13,
  },
  catRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catIcon: {
    fontSize: 14,
  },
  catText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  catTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  pmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pmChipActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  pmIcon: {
    fontSize: 14,
  },
  pmText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  pmTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

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
  Image,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { ExpenseCategory } from '../types';
import { getFormattedDate } from '../utils/budgetCalculator';
import { parseReceiptImage, ParsedReceipt } from '../utils/ocrParser';
import { X, Camera, MapPin, Tag, CreditCard, Sparkles, Check } from 'lucide-react-native';

const CATEGORIES: { name: ExpenseCategory; icon: string; color: string }[] = [
  { name: 'Food', icon: '🍔', color: '#f59e0b' },
  { name: 'Fuel', icon: '⛽', color: '#ef4444' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Medical', icon: '💊', color: '#10b981' },
  { name: 'Recharge', icon: '📱', color: '#3b82f6' },
  { name: 'Travel', icon: '✈️', color: '#8b5cf6' },
  { name: 'Entertainment', icon: '🎬', color: '#6366f1' },
  { name: 'Rent', icon: '🏠', color: '#14b8a6' },
  { name: 'Bills', icon: '📄', color: '#f97316' },
  { name: 'Others', icon: '📦', color: '#64748b' },
];

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ visible, onClose }: AddExpenseModalProps) {
  const { profile, accounts, addExpense } = useFinanceStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [location, setLocation] = useState('');
  const [expenseDate, setExpenseDate] = useState(getFormattedDate());
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanReceipt = async () => {
    setIsScanning(true);
    try {
      const mockUri = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300';
      const parsed: ParsedReceipt = await parseReceiptImage(mockUri);

      setReceiptUrl(mockUri);
      setAmount(parsed.amount.toString());
      setCategory(parsed.category);
      setDescription(`${parsed.storeName} (${parsed.description})`);
      setExpenseDate(parsed.date);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveExpense = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    const matchedAccount = accounts.find(
      (a) => a.name.toLowerCase().includes(paymentMethod.toLowerCase()) || a.type === paymentMethod.toLowerCase()
    );

    addExpense({
      accountId: matchedAccount ? matchedAccount.id : accounts[0]?.id || 'acc_upi',
      amount: numericAmount,
      category,
      description: description || category,
      paymentMethod,
      location: location || undefined,
      receiptUrl: receiptUrl || undefined,
      expenseDate,
    });

    // Reset and Close
    setAmount('');
    setDescription('');
    setLocation('');
    setReceiptUrl(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Expense</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* OCR Receipt Scanner Button */}
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanReceipt}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <>
                  <Camera size={20} color="#10b981" />
                  <Text style={styles.scanButtonText}>Scan Receipt with OCR AI Auto-Fill</Text>
                  <Sparkles size={16} color="#10b981" />
                </>
              )}
            </TouchableOpacity>

            {receiptUrl && (
              <View style={styles.receiptPreview}>
                <Image source={{ uri: receiptUrl }} style={styles.receiptImage} />
                <Text style={styles.receiptText}>Receipt scanned & details auto-detected!</Text>
              </View>
            )}

            {/* Amount Input */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Amount Spent</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>{profile.currency}</Text>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>
            </View>

            {/* Category Selector Grid */}
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.categoryChip,
                    category === item.name && { backgroundColor: item.color, borderColor: item.color },
                  ]}
                  onPress={() => setCategory(item.name)}
                >
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      category === item.name && styles.categoryTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description & Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Lunch at Cafe"
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location (Optional)</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={18} color="#64748b" />
                <TextInput
                  style={styles.innerInput}
                  placeholder="e.g. Downtown Mall"
                  placeholderTextColor="#64748b"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.methodRow}>
              {['UPI', 'Wallet', 'Bank', 'Credit Card'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodChip,
                    paymentMethod === method && styles.methodChipActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.methodText,
                      paymentMethod === method && styles.methodTextActive,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveExpense}>
              <Check size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Confirm & Deduct Money</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  body: {
    padding: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 13,
  },
  receiptPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  receiptImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  receiptText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  amountCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  amountLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10b981',
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    minWidth: 120,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  innerInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  methodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  methodChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  methodText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#ffffff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

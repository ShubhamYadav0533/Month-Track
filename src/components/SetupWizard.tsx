import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, Building2, Smartphone, CreditCard, PiggyBank, Calendar, ArrowRight, Sparkles } from 'lucide-react-native';

export function SetupWizard() {
  const setupUser = useFinanceStore((state) => state.setupUser);

  const [income, setIncome] = useState('40000');
  const [salaryDate, setSalaryDate] = useState('1');
  const [savingsGoal, setSavingsGoal] = useState('10000');
  const [wallet, setWallet] = useState('2000');
  const [bank, setBank] = useState('8000');
  const [upi, setUpi] = useState('1500');
  const [cardLimit, setCardLimit] = useState('50000');
  const [currency, setCurrency] = useState('₹');

  const walletVal = parseFloat(wallet) || 0;
  const bankVal = parseFloat(bank) || 0;
  const upiVal = parseFloat(upi) || 0;
  const totalBalance = walletVal + bankVal + upiVal;

  const handleFinishSetup = () => {
    setupUser(
      {
        name: 'User',
        monthlyIncome: parseFloat(income) || 40000,
        salaryDate: parseInt(salaryDate, 10) || 1,
        savingsGoal: parseFloat(savingsGoal) || 10000,
        currency: currency || '₹',
      },
      walletVal,
      bankVal,
      upiVal,
      parseFloat(cardLimit) || 50000
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Sparkles size={16} color="#10b981" />
            <Text style={styles.badgeText}>Phase 1 - Personal Setup</Text>
          </View>
          <Text style={styles.title}>Smart Money Calculator</Text>
          <Text style={styles.subtitle}>
            Set up your current accounts & monthly targets to generate your safe daily budget.
          </Text>
        </View>

        {/* Currency selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Currency</Text>
          <View style={styles.currencyRow}>
            {['₹', '$', '€', '£', 'AED'].map((cur) => (
              <TouchableOpacity
                key={cur}
                style={[styles.currencyChip, currency === cur && styles.currencyChipActive]}
                onPress={() => setCurrency(cur)}
              >
                <Text style={[styles.currencyText, currency === cur && styles.currencyTextActive]}>
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Monthly Income & Salary Date */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Income & Target</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Income</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.prefix}>{currency}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={income}
                onChangeText={setIncome}
                placeholder="40000"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Salary Date</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={salaryDate}
                  onChangeText={setSalaryDate}
                  placeholder="1"
                  placeholderTextColor="#64748b"
                />
                <Text style={styles.suffix}>st of month</Text>
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Savings Goal</Text>
              <View style={styles.inputWrapper}>
                <PiggyBank size={18} color="#10b981" />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={savingsGoal}
                  onChangeText={setSavingsGoal}
                  placeholder="10000"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Current Wallet Cash, Bank, UPI */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Balances (Step 1 & 2)</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Wallet Cash</Text>
            <View style={styles.inputWrapper}>
              <Wallet size={18} color="#10b981" />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={wallet}
                onChangeText={setWallet}
                placeholder="2000"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Balance</Text>
            <View style={styles.inputWrapper}>
              <Building2 size={18} color="#3b82f6" />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={bank}
                onChangeText={setBank}
                placeholder="8000"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>UPI Balance</Text>
            <View style={styles.inputWrapper}>
              <Smartphone size={18} color="#8b5cf6" />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={upi}
                onChangeText={setUpi}
                placeholder="1500"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Credit Card Limit (Optional)</Text>
            <View style={styles.inputWrapper}>
              <CreditCard size={18} color="#f59e0b" />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cardLimit}
                onChangeText={setCardLimit}
                placeholder="50000"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          {/* Live Step 2 Sum Banner */}
          <View style={styles.sumBanner}>
            <Text style={styles.sumFormulaText}>
              {walletVal} (Wallet) + {bankVal} (Bank) + {upiVal} (UPI)
            </Text>
            <View style={styles.sumTotalRow}>
              <Text style={styles.sumTotalLabel}>Total Money Available:</Text>
              <Text style={styles.sumTotalValue}>
                {currency}{totalBalance.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleFinishSetup}>
          <Text style={styles.submitButtonText}>Launch Personal Finance Assistant</Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  currencyChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  currencyText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 16,
  },
  currencyTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#cbd5e1',
    marginBottom: 6,
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
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
  },
  suffix: {
    color: '#64748b',
    fontSize: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sumBanner: {
    marginTop: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  sumFormulaText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  sumTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sumTotalLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  sumTotalValue: {
    color: '#60a5fa',
    fontSize: 20,
    fontWeight: '800',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

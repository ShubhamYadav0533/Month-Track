import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { RefreshCw, Plus, Zap, Tv, Wifi } from 'lucide-react-native';

export function RecurringScreen() {
  const { profile, accounts, recurring, addRecurringTransaction, processRecurringDeductions } =
    useFinanceStore();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category] = useState<'Entertainment' | 'Bills' | 'Recharge'>('Entertainment');
  const [autoDeduct, setAutoDeduct] = useState(true);

  const handleAddRecurring = () => {
    const numAmount = parseFloat(amount);
    if (!title || isNaN(numAmount)) return;

    addRecurringTransaction({
      title,
      amount: numAmount,
      category: category as any,
      frequency: 'monthly',
      nextDueDate: new Date().toISOString().split('T')[0],
      autoDeduct,
      accountId: accounts[0]?.id || 'acc_upi',
    });

    setTitle('');
    setAmount('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Recurring Expenses</Text>
            <TouchableOpacity style={styles.triggerBtn} onPress={processRecurringDeductions}>
              <RefreshCw size={14} color="#10b981" />
              <Text style={styles.triggerBtnText}>Run Auto-Deduct</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Subscriptions & monthly bills auto-deducted from daily budget</Text>
        </View>

        {/* List of Recurring Subscriptions */}
        {recurring.map((item) => (
          <View key={item.id} style={styles.recCard}>
            <View style={styles.recLeft}>
              <View style={styles.iconBg}>
                {item.title.toLowerCase().includes('netflix') ? (
                  <Tv size={20} color="#ef4444" />
                ) : item.title.toLowerCase().includes('electricity') ? (
                  <Zap size={20} color="#f59e0b" />
                ) : (
                  <Wifi size={20} color="#3b82f6" />
                )}
              </View>
              <View>
                <Text style={styles.recTitle}>{item.title}</Text>
                <Text style={styles.recMeta}>
                  Every Month • Due: {item.nextDueDate}
                </Text>
              </View>
            </View>
            <View style={styles.recRight}>
              <Text style={styles.recAmount}>
                {profile.currency}{item.amount}
              </Text>
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>
                  {item.autoDeduct ? 'Auto Deduct' : 'Manual'}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Add New Subscription Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add Recurring Bill</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bill Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Gym Membership / Spotify"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="499"
              placeholderTextColor="#64748b"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Auto-deduct on Due Date</Text>
            <Switch
              value={autoDeduct}
              onValueChange={setAutoDeduct}
              trackColor={{ false: '#334155', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddRecurring}>
            <Plus size={18} color="#ffffff" />
            <Text style={styles.addBtnText}>Save Subscription</Text>
          </TouchableOpacity>
        </View>
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
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  triggerBtnText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 12,
  },
  recCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  recMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  recRight: {
    alignItems: 'flex-end',
  },
  recAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  autoBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  autoBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

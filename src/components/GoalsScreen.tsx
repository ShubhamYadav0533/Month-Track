import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Laptop, Bike } from 'lucide-react-native';

export function GoalsScreen() {
  const { profile, savingsGoals, addSavingsGoal, updateSavedGoalAmount } = useFinanceStore();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialSaved, setInitialSaved] = useState('');

  const handleAddGoal = () => {
    const target = parseFloat(targetAmount);
    if (!title || isNaN(target)) return;

    addSavingsGoal({
      title,
      targetAmount: target,
      savedAmount: parseFloat(initialSaved) || 0,
      icon: 'target',
    });

    setTitle('');
    setTargetAmount('');
    setInitialSaved('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Savings Goals</Text>
          <Text style={styles.subtitle}>Set targets for gadgets, vehicles, & long-term savings</Text>
        </View>

        {/* Goals Progress Cards */}
        {savingsGoals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.savedAmount / Math.max(1, goal.targetAmount)) * 100));

          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.iconBg}>
                  {goal.title.toLowerCase().includes('laptop') ? (
                    <Laptop size={20} color="#10b981" />
                  ) : (
                    <Bike size={20} color="#3b82f6" />
                  )}
                </View>
                <View style={styles.goalTitleCol}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalMeta}>
                    {profile.currency}{goal.savedAmount.toLocaleString()} of {profile.currency}
                    {goal.targetAmount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.pctBadge}>
                  <Text style={styles.pctText}>{pct}%</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>

              <TouchableOpacity
                style={styles.addMoneyBtn}
                onPress={() => updateSavedGoalAmount(goal.id, 1000)}
              >
                <Plus size={14} color="#10b981" />
                <Text style={styles.addMoneyText}>Add {profile.currency}1,000</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Create New Goal Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Goal</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. iPhone 16 / Vacation"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Target Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor="#64748b"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Already Saved</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="5000"
                placeholderTextColor="#64748b"
                value={initialSaved}
                onChangeText={setInitialSaved}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={handleAddGoal}>
            <Plus size={18} color="#ffffff" />
            <Text style={styles.createBtnText}>Add Savings Goal</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  goalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitleCol: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  goalMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  pctBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pctText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  addMoneyText: {
    color: '#10b981',
    fontSize: 13,
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
  row: {
    flexDirection: 'row',
    gap: 10,
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
  createBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

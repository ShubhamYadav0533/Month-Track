import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { SavingsGoal } from '../types';
import {
  Target,
  Plus,
  Laptop,
  Bike,
  Shield,
  Plane,
  Home,
  Car,
  Heart,
  X,
  Check,
  TrendingUp,
} from 'lucide-react-native';

export function GoalsScreen() {
  const { profile, savingsGoals, addSavingsGoal, updateSavedGoalAmount } =
    useFinanceStore();

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // New Goal state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialSaved, setInitialSaved] = useState('');
  const [targetDate] = useState('2026-12-31');

  const goalIcons: Record<string, React.ReactNode> = {
    shield: <Shield size={20} color="#10b981" />,
    plane: <Plane size={20} color="#3b82f6" />,
    laptop: <Laptop size={20} color="#8b5cf6" />,
    car: <Car size={20} color="#f59e0b" />,
    home: <Home size={20} color="#ec4899" />,
    bike: <Bike size={20} color="#06b6d4" />,
    wedding: <Heart size={20} color="#f43f5e" />,
  };

  const handleAddGoal = () => {
    const target = parseFloat(targetAmount);
    const saved = parseFloat(initialSaved) || 0;
    if (!title || isNaN(target)) return;

    addSavingsGoal({
      title,
      targetAmount: target,
      savedAmount: saved,
      targetDate: targetDate || '2026-12-31',
      icon: title.toLowerCase().includes('emergency') ? 'shield' : title.toLowerCase().includes('laptop') ? 'laptop' : 'target',
    });

    setTitle('');
    setTargetAmount('');
    setInitialSaved('');
    setIsAddGoalOpen(false);
  };

  const handleAddFunds = () => {
    const amt = parseFloat(depositAmount);
    if (!selectedGoal || isNaN(amt) || amt <= 0) return;

    updateSavedGoalAmount(selectedGoal.id, amt);
    setDepositAmount('');
    setSelectedGoal(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Savings Goals</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddGoalOpen(true)}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>+ New Goal</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Notion-style automated target calculator and tracker</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {savingsGoals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
          const remainingAmount = Math.max(0, goal.targetAmount - goal.savedAmount);
          const monthlyRequired = Math.round(remainingAmount / 5); // 5 months estimated

          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconBg}>{goalIcons[goal.icon] || <Target size={20} color="#10b981" />}</View>
                  <View>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalTargetDate}>Target: {goal.targetDate || '2026-12-31'}</Text>
                  </View>
                </View>
                <Text style={styles.percentText}>{percent}%</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
              </View>

              {/* Calculations Grid */}
              <View style={styles.calcGrid}>
                <View style={styles.calcCol}>
                  <Text style={styles.calcLabel}>Saved</Text>
                  <Text style={[styles.calcValue, { color: '#10b981' }]}>
                    {profile.currency}{goal.savedAmount.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.calcCol}>
                  <Text style={styles.calcLabel}>Remaining</Text>
                  <Text style={[styles.calcValue, { color: '#ef4444' }]}>
                    {profile.currency}{remainingAmount.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.calcCol}>
                  <Text style={styles.calcLabel}>Monthly Req.</Text>
                  <Text style={[styles.calcValue, { color: '#3b82f6' }]}>
                    {profile.currency}{monthlyRequired.toLocaleString()}/mo
                  </Text>
                </View>
              </View>

              {/* Action */}
              <TouchableOpacity
                style={styles.depositBtn}
                onPress={() => setSelectedGoal(goal)}
              >
                <TrendingUp size={16} color="#10b981" />
                <Text style={styles.depositBtnText}>+ Deposit Savings</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={isAddGoalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Savings Goal</Text>
              <TouchableOpacity onPress={() => setIsAddGoalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Goal Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Emergency Fund, Car, House"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Target Amount (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="200000"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            <Text style={styles.label}>Current Saved (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="58000"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={initialSaved}
              onChangeText={setInitialSaved}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddGoal}>
              <Check size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Deposit Funds Modal */}
      {selectedGoal && (
        <Modal visible={!!selectedGoal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Deposit Savings into {selectedGoal.title}</Text>
                <TouchableOpacity onPress={() => setSelectedGoal(null)}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Amount to Add (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="5000"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddFunds}>
                <Check size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 14,
  },
  goalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  goalTargetDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  percentText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  calcGrid: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  calcCol: {
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  depositBtnText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

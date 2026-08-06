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
import { Users, Plus, UserCheck } from 'lucide-react-native';

export function SplitScreen() {
  const { profile, splitExpenses, addSplitExpense, settleSplitExpense } = useFinanceStore();

  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [friendName, setFriendName] = useState('');

  const handleAddSplit = () => {
    const total = parseFloat(totalAmount);
    if (!title || isNaN(total) || !friendName) return;

    const myShare = total / 2;
    const friendShare = total / 2;

    addSplitExpense({
      title,
      totalAmount: total,
      myShare,
      friendName,
      friendShare,
      isSettled: false,
    });

    setTitle('');
    setTotalAmount('');
    setFriendName('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Split & Friends</Text>
          <Text style={styles.subtitle}>Split group expenses & track who owes you money</Text>
        </View>

        {/* List of Split Expenses */}
        {splitExpenses.map((item) => (
          <View key={item.id} style={styles.splitCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBg}>
                <Users size={18} color="#3b82f6" />
              </View>
              <View style={styles.titleCol}>
                <Text style={styles.splitTitle}>{item.title}</Text>
                <Text style={styles.splitMeta}>
                  With {item.friendName} • Total {profile.currency}{item.totalAmount}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.isSettled ? styles.settledBadge : styles.pendingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.isSettled ? styles.settledText : styles.pendingText,
                  ]}
                >
                  {item.isSettled ? 'Settled' : 'Owes You'}
                </Text>
              </View>
            </View>

            <View style={styles.sharesRow}>
              <Text style={styles.shareText}>
                Your Share: {profile.currency}{item.myShare}
              </Text>
              <Text style={styles.shareText}>
                {item.friendName}&apos;s Share: {profile.currency}{item.friendShare}
              </Text>
            </View>

            {!item.isSettled && (
              <TouchableOpacity
                style={styles.settleBtn}
                onPress={() => settleSplitExpense(item.id)}
              >
                <UserCheck size={16} color="#10b981" />
                <Text style={styles.settleBtnText}>Mark as Settled</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Add New Split Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Split a Bill</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bill Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Weekend Dinner / Trip"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Total Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="1200"
                placeholderTextColor="#64748b"
                value={totalAmount}
                onChangeText={setTotalAmount}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Friend&apos;s Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Alex"
                placeholderTextColor="#64748b"
                value={friendName}
                onChangeText={setFriendName}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddSplit}>
            <Plus size={18} color="#ffffff" />
            <Text style={styles.addBtnText}>Add Split Bill</Text>
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
  splitCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleCol: {
    flex: 1,
  },
  splitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  splitMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  settledBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settledText: {
    color: '#10b981',
  },
  pendingText: {
    color: '#3b82f6',
  },
  sharesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  shareText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 8,
    borderRadius: 10,
  },
  settleBtnText: {
    color: '#10b981',
    fontSize: 12,
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
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Clock,
  DollarSign,
  Bell,
  Sparkles,
  Flame,
  AlertCircle,
} from 'lucide-react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAttendanceStore, formatMinutesToHM } from '../store/useAttendanceStore';
import { useProductivityStore } from '../store/useProductivityStore';

export function UnifiedDashboard() {
  const { profile, transactions, bills } = useFinanceStore();
  const { employee, shift, todayRecord, getTodayStatus, getLiveWorkingMinutes } = useAttendanceStore();
  const { enhancedTasks, habits, dailyPlanner, notifications } = useProductivityStore();

  const [timeStr, setTimeStr] = useState('');
  const [liveWorkMins, setLiveWorkMins] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setLiveWorkMins(getLiveWorkingMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [getLiveWorkingMinutes]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning ☀️';
    if (h < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Calculate stats
  const todayExpenses = transactions
    .filter((t) => (t.transactionDate || t.expenseDate) === todayStr && t.type === 'Expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingBills = bills.filter((b) => b.status === 'Pending');
  const todayStatus = getTodayStatus();

  const todayTasksList = enhancedTasks.filter((t) => !t.completed);
  const unreadNotifCount = notifications.filter((n) => n.status === 'unread').length;

  const todayHabits = habits.map((h) => ({
    ...h,
    isCompletedToday: h.completedDays.includes(todayStr),
  }));

  const todaySchedule = dailyPlanner.filter(
    (slot) => slot.plannerDate === todayStr || !slot.plannerDate
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{greeting()}</Text>
            <Text style={styles.userName}>{profile.name || employee.fullName || 'User'}</Text>
            <Text style={styles.dateText}>
              {formattedDate} · <Text style={styles.clockText}>{timeStr}</Text>
            </Text>
          </View>
          {unreadNotifCount > 0 && (
            <View style={styles.notifBadge}>
              <Bell size={18} color="#f59e0b" />
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>{unreadNotifCount}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Highlights Banner */}
        <View style={styles.bannerGrid}>
          {/* Today Expenses (Finance Mode) */}
          {(profile.defaultAppMode || 'finance') === 'finance' && (
            <View style={[styles.bannerCard, { borderLeftColor: '#ef4444' }]}>
              <View style={styles.bannerIconRow}>
                <DollarSign size={18} color="#ef4444" />
                <Text style={styles.bannerLabel}>Today Expenses</Text>
              </View>
              <Text style={[styles.bannerVal, { color: '#ef4444' }]}>₹{todayExpenses.toLocaleString()}</Text>
              <Text style={styles.bannerSub}>{transactions.length} total transactions</Text>
            </View>
          )}

          {/* Today Attendance (HRMS Mode) */}
          {profile.defaultAppMode === 'hrms' && (
            <View style={[styles.bannerCard, { borderLeftColor: '#10b981' }]}>
              <View style={styles.bannerIconRow}>
                <Clock size={18} color="#10b981" />
                <Text style={styles.bannerLabel}>Attendance</Text>
              </View>
              <Text style={[styles.bannerVal, { color: '#10b981' }]}>{todayStatus}</Text>
              <Text style={styles.bannerSub}>
                {todayRecord ? `Worked ${formatMinutesToHM(liveWorkMins)}` : `${shift.startTime} shift`}
              </Text>
            </View>
          )}
        </View>

        {/* Pending Work & Tasks Quick Bar (HRMS Mode) */}
        {profile.defaultAppMode === 'hrms' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✅ Today Tasks</Text>
              <Text style={styles.sectionBadge}>{todayTasksList.length} pending</Text>
            </View>
            {todayTasksList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Sparkles size={28} color="#10b981" />
                <Text style={styles.emptyText}>All caught up! No pending tasks.</Text>
              </View>
            ) : (
              <View style={styles.tasksContainer}>
                {todayTasksList.slice(0, 3).map((task) => (
                  <View key={task.id} style={styles.taskItemRow}>
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor:
                            task.priority === 'Critical'
                              ? '#ef4444'
                              : task.priority === 'High'
                              ? '#f59e0b'
                              : '#3b82f6',
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskMeta}>
                        Due: {task.dueDate} {task.dueTime ? `· ${task.dueTime}` : ''}
                      </Text>
                    </View>
                    <View style={styles.taskCategoryBadge}>
                      <Text style={styles.taskCategoryText}>{task.category || 'General'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Today Schedule Timeline */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Today Schedule</Text>
            </View>
            <View style={styles.scheduleCard}>
              {todaySchedule.slice(0, 4).map((slot) => (
                <View key={slot.id} style={styles.slotRow}>
                  <Text style={styles.slotTime}>{slot.timeSlot}</Text>
                  <View style={[styles.slotDot, slot.completed && styles.slotDotDone]} />
                  <Text style={[styles.slotActivity, slot.completed && styles.slotActivityDone]}>
                    {slot.activity}
                  </Text>
                </View>
              ))}
            </View>

            {/* Habit Streak Tracker */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Habit Tracker</Text>
            </View>
            <View style={styles.habitsGrid}>
              {todayHabits.map((habit) => (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={[styles.habitIconBg, { backgroundColor: habit.color + '20' }]}>
                    <Flame size={18} color={habit.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitTitle}>{habit.title}</Text>
                    <Text style={styles.habitStreak}>{habit.currentStreak} day streak 🔥</Text>
                  </View>
                  <View
                    style={[
                      styles.habitStatusChip,
                      habit.isCompletedToday && { backgroundColor: '#10b981' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.habitStatusText,
                        habit.isCompletedToday && { color: '#ffffff' },
                      ]}
                    >
                      {habit.isCompletedToday ? 'Done ✓' : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Pending Bills & EMI (Finance Mode) */}
        {(profile.defaultAppMode || 'finance') === 'finance' && pendingBills.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💳 Upcoming Bills & EMI</Text>
            </View>
            <View style={styles.billsCard}>
              {pendingBills.slice(0, 2).map((bill) => (
                <View key={bill.id} style={styles.billRow}>
                  <AlertCircle size={18} color="#f59e0b" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billTitle}>{bill.title}</Text>
                    <Text style={styles.billDue}>Due: {bill.dueDate}</Text>
                  </View>
                  <Text style={styles.billAmount}>₹{bill.amount.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  userName: { fontSize: 26, color: '#f8fafc', fontWeight: '900', marginTop: 2 },
  dateText: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  clockText: { color: '#10b981', fontWeight: '700' },

  notifBadge: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDotText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  bannerGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  bannerCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bannerIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  bannerLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  bannerVal: { fontSize: 20, fontWeight: '900' },
  bannerSub: { color: '#64748b', fontSize: 11, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, color: '#f8fafc', fontWeight: '800' },
  sectionBadge: { fontSize: 12, color: '#10b981', fontWeight: '700' },

  emptyCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

  tasksContainer: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155', gap: 12, marginBottom: 20 },
  taskItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  taskMeta: { color: '#94a3b8', fontSize: 12 },
  taskCategoryBadge: { backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  taskCategoryText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },

  scheduleCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 12, marginBottom: 20 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotTime: { color: '#10b981', fontSize: 12, fontWeight: '700', width: 65 },
  slotDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' },
  slotDotDone: { backgroundColor: '#10b981' },
  slotActivity: { color: '#f8fafc', fontSize: 13, flex: 1 },
  slotActivityDone: { color: '#64748b', textDecorationLine: 'line-through' },

  habitsGrid: { gap: 10, marginBottom: 20 },
  habitCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#334155' },
  habitIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  habitTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  habitStreak: { color: '#94a3b8', fontSize: 12 },
  habitStatusChip: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  habitStatusText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },

  billsCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 12, marginBottom: 20 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  billTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  billDue: { color: '#94a3b8', fontSize: 12 },
  billAmount: { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
});

export default UnifiedDashboard;

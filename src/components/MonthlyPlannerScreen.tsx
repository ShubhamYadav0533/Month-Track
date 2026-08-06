import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Calendar as CalendarIcon,
  TrendingDown,
  TrendingUp,
  CheckSquare,
  CreditCard,
} from 'lucide-react-native';

export function MonthlyPlannerScreen() {
  const { profile, transactions, tasks, bills } = useFinanceStore();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // August 2026 calendar days simulation
  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedDateStr = `2026-08-${selectedDay.toString().padStart(2, '0')}`;

  // Filter items for selected day
  const dayTransactions = transactions.filter((t) => t.transactionDate === selectedDateStr);
  const dayExpenses = dayTransactions
    .filter((t) => t.type !== 'Income' && t.type !== 'Borrow')
    .reduce((sum, t) => sum + t.amount, 0);
  const dayIncome = dayTransactions
    .filter((t) => t.type === 'Income' || t.type === 'Borrow')
    .reduce((sum, t) => sum + t.amount, 0);

  const dayTasks = tasks.filter((t) => t.dueDate === selectedDateStr);
  const dayBills = bills.filter((b) => b.dueDate === selectedDateStr);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Monthly Planner</Text>
          <View style={styles.monthPill}>
            <CalendarIcon size={14} color="#10b981" />
            <Text style={styles.monthText}>August 2026</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Calendar schedule of your expenses, income, bills, and tasks</Text>
      </View>

      {/* Calendar Days Grid */}
      <View style={styles.calendarCard}>
        <View style={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
            <Text key={w} style={styles.weekText}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {daysArray.map((day) => {
            const dateStr = `2026-08-${day.toString().padStart(2, '0')}`;
            const hasExp = transactions.some((t) => t.transactionDate === dateStr);
            const hasBill = bills.some((b) => b.dueDate === dateStr);
            const isSelected = selectedDay === day;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                  {day}
                </Text>

                <View style={styles.dotRow}>
                  {hasExp && <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />}
                  {hasBill && <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Day Summary */}
      <ScrollView contentContainerStyle={styles.detailContent}>
        <View style={styles.daySummaryHeader}>
          <Text style={styles.daySummaryTitle}>
            {selectedDay} August 2026 Overview
          </Text>
        </View>

        {/* Daily Metrics Row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <TrendingDown size={18} color="#ef4444" />
            <Text style={styles.kpiLabel}>Expense</Text>
            <Text style={[styles.kpiValue, { color: '#ef4444' }]}>
              {profile.currency}{dayExpenses.toLocaleString()}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <TrendingUp size={18} color="#10b981" />
            <Text style={styles.kpiLabel}>Income</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>
              {profile.currency}{dayIncome.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Scheduled Tasks for Day */}
        <View style={styles.sectionBox}>
          <View style={styles.boxHeader}>
            <CheckSquare size={16} color="#3b82f6" />
            <Text style={styles.boxTitle}>Tasks Scheduled ({dayTasks.length})</Text>
          </View>
          {dayTasks.length === 0 ? (
            <Text style={styles.emptyText}>No financial tasks due on this date.</Text>
          ) : (
            dayTasks.map((t) => (
              <View key={t.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{t.title}</Text>
                <Text style={styles.itemMeta}>{t.priority} Priority</Text>
              </View>
            ))
          )}
        </View>

        {/* Bills & EMIs Due on Day */}
        <View style={styles.sectionBox}>
          <View style={styles.boxHeader}>
            <CreditCard size={16} color="#f59e0b" />
            <Text style={styles.boxTitle}>Bills & EMIs Due ({dayBills.length})</Text>
          </View>
          {dayBills.length === 0 ? (
            <Text style={styles.emptyText}>No bills or EMIs due on this date.</Text>
          ) : (
            dayBills.map((b) => (
              <View key={b.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>{b.title}</Text>
                <Text style={styles.itemMeta}>
                  {profile.currency}{b.amount} ({b.status})
                </Text>
              </View>
            ))
          )}
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
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  monthText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 12,
  },
  calendarCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: 18,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 4,
  },
  dayCell: {
    width: 36,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#10b981',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  dayNumberSelected: {
    color: '#ffffff',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  detailContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  daySummaryHeader: {
    marginVertical: 10,
  },
  daySummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  itemTitle: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
  },
});

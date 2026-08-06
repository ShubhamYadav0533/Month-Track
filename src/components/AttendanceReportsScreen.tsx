import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { TrendingUp, Clock, AlertTriangle, Award } from 'lucide-react-native';
import { useAttendanceStore } from '../store/useAttendanceStore';

export function AttendanceReportsScreen() {
  const { getStats } = useAttendanceStore();
  const [period, setPeriod] = useState<'Month' | 'Year'>('Month');
  const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>📊 Attendance Reports</Text>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(['Month', 'Year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.pBtn, period === p && styles.pBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.pBtnText, period === p && styles.pBtnTextActive]}>
                This {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Performance Indicators */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCardBig}>
            <TrendingUp size={24} color="#10b981" />
            <Text style={styles.kpiBigVal}>{stats.monthlyAttendancePct}%</Text>
            <Text style={styles.kpiBigLabel}>Overall Attendance Rate</Text>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Clock size={18} color="#3b82f6" />
              <Text style={styles.kpiVal}>{stats.totalWorkingHours} hrs</Text>
              <Text style={styles.kpiLabel}>Total Worked</Text>
            </View>

            <View style={styles.kpiCard}>
              <Award size={18} color="#8b5cf6" />
              <Text style={styles.kpiVal}>{stats.averageDailyHours} hrs</Text>
              <Text style={styles.kpiLabel}>Daily Average</Text>
            </View>

            <View style={styles.kpiCard}>
              <TrendingUp size={18} color="#06b6d4" />
              <Text style={styles.kpiVal}>{stats.overtimeHours} hrs</Text>
              <Text style={styles.kpiLabel}>Overtime</Text>
            </View>

            <View style={styles.kpiCard}>
              <AlertTriangle size={18} color="#f59e0b" />
              <Text style={styles.kpiVal}>{stats.lateArrivalsCount} times</Text>
              <Text style={styles.kpiLabel}>Late Arrivals</Text>
            </View>
          </View>
        </View>

        {/* Days Breakdown */}
        <Text style={styles.sectionTitle}>📈 Days Breakdown</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.bRow}>
            <View style={styles.bLabelCol}>
              <View style={[styles.bDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.bText}>Present Days</Text>
            </View>
            <Text style={styles.bValue}>{stats.presentDaysCount} days</Text>
          </View>

          <View style={styles.bRow}>
            <View style={styles.bLabelCol}>
              <View style={[styles.bDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.bText}>Absent Days</Text>
            </View>
            <Text style={styles.bValue}>{stats.absentDaysCount} days</Text>
          </View>

          <View style={styles.bRow}>
            <View style={styles.bLabelCol}>
              <View style={[styles.bDot, { backgroundColor: '#8b5cf6' }]} />
              <Text style={styles.bText}>Leave Days</Text>
            </View>
            <Text style={styles.bValue}>{stats.leaveDaysCount} days</Text>
          </View>

          <View style={styles.bRow}>
            <View style={styles.bLabelCol}>
              <View style={[styles.bDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.bText}>Late Days</Text>
            </View>
            <Text style={styles.bValue}>{stats.lateArrivalsCount} days</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, color: '#f8fafc', fontWeight: '800', marginBottom: 16 },

  periodRow: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 4, borderRadius: 12, marginBottom: 20 },
  pBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  pBtnActive: { backgroundColor: '#10b981' },
  pBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  pBtnTextActive: { color: '#fff', fontWeight: '700' },

  kpiContainer: { gap: 12, marginBottom: 24 },
  kpiCardBig: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155', gap: 6 },
  kpiBigVal: { fontSize: 40, color: '#10b981', fontWeight: '900' },
  kpiBigLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 6 },
  kpiVal: { fontSize: 18, color: '#f8fafc', fontWeight: '800' },
  kpiLabel: { fontSize: 12, color: '#94a3b8' },

  sectionTitle: { fontSize: 16, color: '#f8fafc', fontWeight: '800', marginBottom: 12 },
  breakdownCard: { backgroundColor: '#1e293b', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#334155', gap: 14 },
  bRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bLabelCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bDot: { width: 10, height: 10, borderRadius: 5 },
  bText: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  bValue: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
});

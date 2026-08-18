import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Clock,
  Coffee,
  LogIn,
  LogOut,
  Play,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Timer,
  Briefcase,
  MapPin,
  FileText,
  Award,
} from 'lucide-react-native';
import { useAttendanceStore, formatMinutesToHM } from '../store/useAttendanceStore';

export function AttendanceDashboard() {
  const {
    employee,
    shift,
    todayRecord,
    activeBreak,
    checkIn,
    startBreak,
    resumeWork,
    checkOut,
    loadAttendanceFromSupabase,
    getStats,
    getTodayStatus,
    getLiveWorkingMinutes,
    getLiveBreakMinutes,
    leaveBalances,
  } = useAttendanceStore();

  const [liveWorkMins, setLiveWorkMins] = useState(0);
  const [liveBreakMins, setLiveBreakMins] = useState(0);
  const stats = getStats();
  const todayStatus = getTodayStatus();

  useEffect(() => {
    loadAttendanceFromSupabase();
  }, [loadAttendanceFromSupabase]);

  // Live timer — updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveWorkMins(getLiveWorkingMinutes());
      setLiveBreakMins(getLiveBreakMinutes());
    }, 1000);
    return () => clearInterval(interval);
  }, [todayRecord, activeBreak, getLiveWorkingMinutes, getLiveBreakMinutes]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const statusColor: Record<string, string> = {
    Present: '#10b981',
    Late: '#f59e0b',
    'On Break': '#6366f1',
    'Half Day': '#f97316',
    Absent: '#ef4444',
    Holiday: '#3b82f6',
    Leave: '#8b5cf6',
    'Work From Home': '#06b6d4',
  };

  const isCheckedIn = !!todayRecord;
  const isOnBreak = !!activeBreak;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{employee.fullName || 'Employee'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (statusColor[todayStatus] || '#64748b') + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor[todayStatus] || '#64748b' }]} />
            <Text style={[styles.statusText, { color: statusColor[todayStatus] || '#64748b' }]}>
              {todayStatus}
            </Text>
          </View>
        </View>

        {/* Live Timer Card */}
        <View style={styles.timerCard}>
          <View style={styles.timerGlow} />
          <Text style={styles.timerLabel}>
            {isOnBreak ? '☕ Break Time' : isCheckedIn ? '⏱️ Working Time' : '🕐 Shift Time'}
          </Text>
          <Text style={styles.timerValue}>
            {isCheckedIn
              ? isOnBreak
                ? formatMinutesToHM(liveBreakMins)
                : formatMinutesToHM(liveWorkMins)
              : `${shift.startTime} – ${shift.endTime}`}
          </Text>
          {isCheckedIn && (
            <Text style={styles.timerSub}>
              {isOnBreak ? `Work: ${formatMinutesToHM(liveWorkMins)}` : `Break: ${formatMinutesToHM(liveBreakMins)}`}
            </Text>
          )}
          <View style={styles.shiftInfo}>
            <Briefcase size={14} color="#94a3b8" />
            <Text style={styles.shiftInfoText}>
              {shift.shiftName} · {shift.requiredHours}h required
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {!isCheckedIn ? (
            <TouchableOpacity style={[styles.actionBtn, styles.checkInBtn]} onPress={() => checkIn()}>
              <LogIn size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Check In</Text>
            </TouchableOpacity>
          ) : (
            <>
              {!isOnBreak ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.breakBtn]}
                  onPress={() => startBreak('Lunch')}
                >
                  <Coffee size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Break</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.resumeBtn]}
                  onPress={resumeWork}
                >
                  <Play size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Resume</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, styles.checkOutBtn]}
                onPress={() => checkOut()}
              >
                <LogOut size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Check Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>📊 This Month</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <TrendingUp size={18} color="#10b981" />
            <Text style={styles.statValue}>{stats.monthlyAttendancePct}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={18} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.totalWorkingHours}h</Text>
            <Text style={styles.statLabel}>Work Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Timer size={18} color="#8b5cf6" />
            <Text style={styles.statValue}>{stats.overtimeHours}h</Text>
            <Text style={styles.statLabel}>Overtime</Text>
          </View>
          <View style={styles.statCard}>
            <AlertTriangle size={18} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.lateArrivalsCount}</Text>
            <Text style={styles.statLabel}>Late Arrivals</Text>
          </View>
          <View style={styles.statCard}>
            <CalendarDays size={18} color="#06b6d4" />
            <Text style={styles.statValue}>{stats.presentDaysCount}</Text>
            <Text style={styles.statLabel}>Present Days</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={18} color="#f97316" />
            <Text style={styles.statValue}>{stats.averageDailyHours}h</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
          </View>
        </View>

        {/* Leave Balance */}
        <Text style={styles.sectionTitle}>🏖️ Leave Balance</Text>
        <View style={styles.leaveRow}>
          {[
            { label: 'Casual', value: leaveBalances.casual, color: '#10b981' },
            { label: 'Sick', value: leaveBalances.sick, color: '#f59e0b' },
            { label: 'Paid', value: leaveBalances.paid, color: '#3b82f6' },
          ].map((lb) => (
            <View key={lb.label} style={[styles.leaveCard, { borderLeftColor: lb.color }]}>
              <Text style={[styles.leaveValue, { color: lb.color }]}>{lb.value}</Text>
              <Text style={styles.leaveLabel}>{lb.label}</Text>
            </View>
          ))}
        </View>

        {/* Check-in details if active */}
        {isCheckedIn && todayRecord?.checkIn && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>📍 Check-in Details</Text>
            <View style={styles.detailRow}>
              <Clock size={14} color="#94a3b8" />
              <Text style={styles.detailText}>
                Checked in at {new Date(todayRecord.checkIn).toLocaleTimeString()}
              </Text>
            </View>
            {todayRecord.lateMinutes > 0 && (
              <View style={styles.detailRow}>
                <AlertTriangle size={14} color="#f59e0b" />
                <Text style={[styles.detailText, { color: '#f59e0b' }]}>
                  Late by {todayRecord.lateMinutes} minutes
                </Text>
              </View>
            )}
            {todayRecord.officeName && (
              <View style={styles.detailRow}>
                <MapPin size={14} color="#94a3b8" />
                <Text style={styles.detailText}>{todayRecord.officeName}</Text>
              </View>
            )}
            {todayRecord.notes ? (
              <View style={styles.detailRow}>
                <FileText size={14} color="#94a3b8" />
                <Text style={styles.detailText}>{todayRecord.notes}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  name: { fontSize: 26, color: '#f8fafc', fontWeight: '800', marginTop: 2 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },

  timerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  timerGlow: {
    position: 'absolute',
    top: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  timerLabel: { fontSize: 14, color: '#94a3b8', fontWeight: '600', marginBottom: 8 },
  timerValue: { fontSize: 42, color: '#f8fafc', fontWeight: '900', letterSpacing: 1 },
  timerSub: { fontSize: 13, color: '#64748b', marginTop: 6 },
  shiftInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  shiftInfoText: { fontSize: 12, color: '#94a3b8' },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  checkInBtn: { backgroundColor: '#10b981' },
  breakBtn: { backgroundColor: '#6366f1' },
  resumeBtn: { backgroundColor: '#06b6d4' },
  checkOutBtn: { backgroundColor: '#ef4444' },

  sectionTitle: { fontSize: 17, color: '#f8fafc', fontWeight: '800', marginBottom: 14 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: { fontSize: 20, color: '#f8fafc', fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  leaveRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  leaveCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  leaveValue: { fontSize: 24, fontWeight: '900' },
  leaveLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 4 },

  detailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  detailsTitle: { fontSize: 15, color: '#f8fafc', fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: '#cbd5e1' },
});

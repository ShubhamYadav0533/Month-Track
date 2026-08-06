import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Clock,
  Briefcase,
  Timer,
  Coffee,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react-native';
import { useAttendanceStore, formatMinutesToHM } from '../store/useAttendanceStore';

export function TodayShiftScreen() {
  const {
    shift,
    todayRecord,
    activeBreak,
    attendanceHistory,
    getLiveWorkingMinutes,
    getLiveBreakMinutes,
  } = useAttendanceStore();

  const [liveWorkMins, setLiveWorkMins] = useState(0);
  const [liveBreakMins, setLiveBreakMins] = useState(0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const completedToday = attendanceHistory.find((r) => r.attendanceDate === todayStr);
  const activeRecord = todayRecord || completedToday;

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveWorkMins(getLiveWorkingMinutes());
      setLiveBreakMins(getLiveBreakMinutes());
    }, 1000);
    return () => clearInterval(interval);
  }, [todayRecord, activeBreak, getLiveWorkingMinutes, getLiveBreakMinutes]);

  const requiredMins = shift.requiredHours * 60;
  const remainingMins = Math.max(0, requiredMins - liveWorkMins);
  const progressPct = Math.min(100, (liveWorkMins / requiredMins) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>🕒 Today Shift</Text>

        {/* Shift Card */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Briefcase size={20} color="#6366f1" />
            <Text style={styles.shiftName}>{shift.shiftName}</Text>
          </View>
          <View style={styles.shiftTimings}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Start</Text>
              <Text style={styles.timeValue}>{shift.startTime}</Text>
            </View>
            <View style={styles.timeDivider}>
              <Text style={styles.timeDividerText}>→</Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>End</Text>
              <Text style={styles.timeValue}>{shift.endTime}</Text>
            </View>
          </View>
          <View style={styles.shiftMeta}>
            <Text style={styles.metaText}>⏱ {shift.requiredHours}h required</Text>
            <Text style={styles.metaText}>☕ {shift.breakMinutes}m break</Text>
            <Text style={styles.metaText}>🕐 {shift.graceMinutes}m grace</Text>
          </View>
        </View>

        {/* Live Progress */}
        {todayRecord && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>⏱️ Live Working Progress</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {formatMinutesToHM(liveWorkMins)} / {formatMinutesToHM(requiredMins)}
              </Text>
              <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
            </View>
            <View style={styles.progressStats}>
              <View style={styles.pStatItem}>
                <Timer size={14} color="#10b981" />
                <Text style={styles.pStatText}>Remaining: {formatMinutesToHM(remainingMins)}</Text>
              </View>
              <View style={styles.pStatItem}>
                <Coffee size={14} color="#6366f1" />
                <Text style={styles.pStatText}>Breaks: {formatMinutesToHM(liveBreakMins)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Details */}
        {activeRecord && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>📋 Today Details</Text>

            <View style={styles.detailItem}>
              <Clock size={16} color="#10b981" />
              <Text style={styles.detailLabel}>Check In</Text>
              <Text style={styles.detailValue}>
                {activeRecord.checkIn ? new Date(activeRecord.checkIn).toLocaleTimeString() : '—'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Clock size={16} color="#ef4444" />
              <Text style={styles.detailLabel}>Check Out</Text>
              <Text style={styles.detailValue}>
                {activeRecord.checkOut ? new Date(activeRecord.checkOut).toLocaleTimeString() : '—'}
              </Text>
            </View>

            {(activeRecord.lateMinutes || 0) > 0 && (
              <View style={styles.detailItem}>
                <AlertTriangle size={16} color="#f59e0b" />
                <Text style={styles.detailLabel}>Late</Text>
                <Text style={[styles.detailValue, { color: '#f59e0b' }]}>
                  {activeRecord.lateMinutes} mins
                </Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <CheckCircle size={16} color="#6366f1" />
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{activeRecord.status}</Text>
            </View>

            {completedToday && (
              <>
                <View style={styles.detailItem}>
                  <Timer size={16} color="#3b82f6" />
                  <Text style={styles.detailLabel}>Total Work</Text>
                  <Text style={styles.detailValue}>
                    {formatMinutesToHM(completedToday.totalWorkMinutes)}
                  </Text>
                </View>
                {completedToday.overtimeMinutes > 0 && (
                  <View style={styles.detailItem}>
                    <TrendingUp size={16} color="#8b5cf6" />
                    <Text style={styles.detailLabel}>Overtime</Text>
                    <Text style={[styles.detailValue, { color: '#8b5cf6' }]}>
                      {formatMinutesToHM(completedToday.overtimeMinutes)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Break History */}
        {activeRecord?.breaks && activeRecord.breaks.length > 0 && (
          <View style={styles.breaksCard}>
            <Text style={styles.detailsTitle}>☕ Break History</Text>
            {activeRecord.breaks.map((br) => (
              <View key={br.id} style={styles.breakItem}>
                <View style={styles.breakDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakType}>{br.breakType}</Text>
                  <Text style={styles.breakTime}>
                    {new Date(br.breakStart).toLocaleTimeString()}
                    {br.breakEnd ? ` → ${new Date(br.breakEnd).toLocaleTimeString()}` : ' (active)'}
                  </Text>
                </View>
                <Text style={styles.breakDuration}>{br.durationMinutes}m</Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!activeRecord && (
          <View style={styles.emptyCard}>
            <Clock size={40} color="#334155" />
            <Text style={styles.emptyText}>Not checked in yet today</Text>
            <Text style={styles.emptySubText}>Check in from the Dashboard to start tracking</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, color: '#f8fafc', fontWeight: '800', marginBottom: 20 },

  shiftCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  shiftHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  shiftName: { fontSize: 18, color: '#f8fafc', fontWeight: '700' },
  shiftTimings: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  timeBlock: { alignItems: 'center' },
  timeLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 4 },
  timeValue: { fontSize: 22, color: '#f8fafc', fontWeight: '900' },
  timeDivider: { paddingHorizontal: 8 },
  timeDividerText: { fontSize: 20, color: '#475569' },
  shiftMeta: { flexDirection: 'row', justifyContent: 'space-around' },
  metaText: { fontSize: 12, color: '#94a3b8' },

  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  progressTitle: { fontSize: 15, color: '#f8fafc', fontWeight: '700', marginBottom: 14 },
  progressBarBg: {
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: { height: 10, backgroundColor: '#10b981', borderRadius: 5 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 13, color: '#cbd5e1', fontWeight: '600' },
  progressPct: { fontSize: 13, color: '#10b981', fontWeight: '800' },
  progressStats: { flexDirection: 'row', gap: 20, marginTop: 12 },
  pStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pStatText: { fontSize: 12, color: '#94a3b8' },

  detailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    gap: 14,
  },
  detailsTitle: { fontSize: 15, color: '#f8fafc', fontWeight: '700' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 13, color: '#94a3b8', width: 80 },
  detailValue: { fontSize: 14, color: '#f8fafc', fontWeight: '600', flex: 1, textAlign: 'right' },

  breaksCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    gap: 12,
  },
  breakItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1' },
  breakType: { fontSize: 13, color: '#f8fafc', fontWeight: '600' },
  breakTime: { fontSize: 11, color: '#94a3b8' },
  breakDuration: { fontSize: 14, color: '#6366f1', fontWeight: '700' },

  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: { fontSize: 16, color: '#64748b', fontWeight: '700' },
  emptySubText: { fontSize: 13, color: '#475569', textAlign: 'center' },
});

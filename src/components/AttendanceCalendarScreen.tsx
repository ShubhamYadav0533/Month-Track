import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useAttendanceStore, formatMinutesToHM } from '../store/useAttendanceStore';
import { AttendanceRecord } from '../types';

export function AttendanceCalendarScreen() {
  const { attendanceHistory } = useAttendanceStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayRecord, setSelectedDayRecord] = useState<AttendanceRecord | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getRecordForDay = (dayNum: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return attendanceHistory.find((r) => r.attendanceDate === formattedDate);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Present': return '#10b981';
      case 'Late': return '#f59e0b';
      case 'Half Day': return '#f97316';
      case 'Absent': return '#ef4444';
      case 'Leave': return '#8b5cf6';
      case 'Work From Home': return '#06b6d4';
      default: return 'transparent';
    }
  };

  const daysGrid = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📆 Attendance Calendar</Text>
      </View>

      {/* Month Selector */}
      <View style={styles.monthHeader}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
          <ChevronLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {monthNames[month]} {year}
        </Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
          <ChevronRight size={20} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.weekDaysRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
          <Text key={wd} style={styles.weekDayText}>
            {wd}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView contentContainerStyle={styles.calendarGrid}>
        <View style={styles.gridContainer}>
          {daysGrid.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
            }
            const record = getRecordForDay(day);
            const statusColor = getStatusColor(record?.status);

            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={[
                  styles.dayCell,
                  record && { borderColor: statusColor, borderWidth: 1 }
                ]}
                onPress={() => record && setSelectedDayRecord(record)}
              >
                <Text style={styles.dayNumber}>{day}</Text>
                {record && (
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Status Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Late</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
              <Text style={styles.legendText}>Half Day</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
              <Text style={styles.legendText}>Leave</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#06b6d4' }]} />
              <Text style={styles.legendText}>WFH</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal for Day Detail */}
      <Modal visible={!!selectedDayRecord} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Overview</Text>
              <TouchableOpacity onPress={() => setSelectedDayRecord(null)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedDayRecord && (
              <View style={{ gap: 12 }}>
                <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '700' }}>
                  {selectedDayRecord.attendanceDate}
                </Text>
                <Text style={{ color: getStatusColor(selectedDayRecord.status), fontSize: 14, fontWeight: '700' }}>
                  Status: {selectedDayRecord.status}
                </Text>
                <Text style={{ color: '#cbd5e1' }}>
                  Work Time: {formatMinutesToHM(selectedDayRecord.totalWorkMinutes)}
                </Text>
                <Text style={{ color: '#cbd5e1' }}>
                  Break Time: {formatMinutesToHM(selectedDayRecord.breakMinutes)}
                </Text>
                <Text style={{ color: '#cbd5e1' }}>
                  Overtime: {formatMinutesToHM(selectedDayRecord.overtimeMinutes)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, color: '#f8fafc', fontWeight: '800' },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  monthText: { fontSize: 18, color: '#f8fafc', fontWeight: '700' },
  navBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 10 },

  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  weekDayText: { color: '#94a3b8', fontWeight: '600', fontSize: 13, width: 40, textAlign: 'center' },

  calendarGrid: { padding: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayCellEmpty: { width: '13%', height: 46 },
  dayCell: {
    width: '13%',
    height: 46,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumber: { color: '#f8fafc', fontWeight: '600', fontSize: 14 },
  statusDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 4 },

  legendContainer: { marginTop: 24, backgroundColor: '#1e293b', padding: 16, borderRadius: 16 },
  legendTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '30%' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#cbd5e1', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: '#f8fafc', fontWeight: '800' },
});

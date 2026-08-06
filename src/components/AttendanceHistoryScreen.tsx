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
import {
  Search,
  Calendar,
  Clock,
  X,
} from 'lucide-react-native';
import { useAttendanceStore, formatMinutesToHM } from '../store/useAttendanceStore';
import { AttendanceRecord, AttendanceStatus } from '../types';

export function AttendanceHistoryScreen() {
  const { attendanceHistory } = useAttendanceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const filterStatuses = ['All', 'Present', 'Late', 'Half Day', 'Absent', 'Leave', 'Work From Home'];

  const filteredHistory = attendanceHistory.filter((rec) => {
    const matchesSearch =
      rec.attendanceDate.includes(searchQuery) ||
      rec.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'All' || rec.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present': return '#10b981';
      case 'Late': return '#f59e0b';
      case 'Half Day': return '#f97316';
      case 'Absent': return '#ef4444';
      case 'Leave': return '#8b5cf6';
      case 'Work From Home': return '#06b6d4';
      default: return '#64748b';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Attendance Logs</Text>
        <Text style={styles.subtitle}>Total Records: {attendanceHistory.length}</Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date (YYYY-MM-DD), status..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {filterStatuses.map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.chip, selectedStatus === st && styles.chipActive]}
            onPress={() => setSelectedStatus(st)}
          >
            <Text style={[styles.chipText, selectedStatus === st && styles.chipTextActive]}>
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* History List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={40} color="#334155" />
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        ) : (
          filteredHistory.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              style={styles.recordCard}
              onPress={() => setSelectedRecord(rec)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.dateBlock}>
                  <Calendar size={16} color="#94a3b8" />
                  <Text style={styles.dateText}>{rec.attendanceDate}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rec.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(rec.status) }]}>
                    {rec.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeMetaLabel}>In Time</Text>
                  <Text style={styles.timeMetaVal}>
                    {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </Text>
                </View>

                <View style={styles.timeCol}>
                  <Text style={styles.timeMetaLabel}>Out Time</Text>
                  <Text style={styles.timeMetaVal}>
                    {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </Text>
                </View>

                <View style={styles.timeCol}>
                  <Text style={styles.timeMetaLabel}>Duration</Text>
                  <Text style={styles.durationVal}>
                    {formatMinutesToHM(rec.totalWorkMinutes)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selectedRecord} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attendance Details</Text>
              <TouchableOpacity onPress={() => setSelectedRecord(null)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {selectedRecord && (
              <ScrollView style={{ gap: 14 }}>
                <View style={styles.detailRow}>
                  <Text style={styles.dLabel}>Date:</Text>
                  <Text style={styles.dVal}>{selectedRecord.attendanceDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.dLabel}>Status:</Text>
                  <Text style={[styles.dVal, { color: getStatusColor(selectedRecord.status) }]}>
                    {selectedRecord.status}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.dLabel}>Check In:</Text>
                  <Text style={styles.dVal}>
                    {selectedRecord.checkIn ? new Date(selectedRecord.checkIn).toLocaleString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.dLabel}>Check Out:</Text>
                  <Text style={styles.dVal}>
                    {selectedRecord.checkOut ? new Date(selectedRecord.checkOut).toLocaleString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.dLabel}>Total Working Hours:</Text>
                  <Text style={styles.dVal}>{formatMinutesToHM(selectedRecord.totalWorkMinutes)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.dLabel}>Break Duration:</Text>
                  <Text style={styles.dVal}>{formatMinutesToHM(selectedRecord.breakMinutes)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.dLabel}>Overtime:</Text>
                  <Text style={styles.dVal}>{formatMinutesToHM(selectedRecord.overtimeMinutes)}</Text>
                </View>
                {selectedRecord.lateMinutes > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Late By:</Text>
                    <Text style={[styles.dVal, { color: '#f59e0b' }]}>{selectedRecord.lateMinutes} mins</Text>
                  </View>
                )}
                {selectedRecord.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.dLabel}>Notes:</Text>
                    <Text style={styles.dVal}>{selectedRecord.notes}</Text>
                  </View>
                )}
              </ScrollView>
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
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 44, color: '#f8fafc', fontSize: 14 },

  filterScroll: { paddingHorizontal: 20, gap: 8, paddingBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#10b981' },
  chipText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  listContent: { padding: 20, gap: 12 },
  emptyCard: { backgroundColor: '#1e293b', padding: 40, borderRadius: 16, alignItems: 'center', gap: 10 },
  emptyText: { color: '#64748b', fontSize: 15, fontWeight: '600' },

  recordCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 14, color: '#f8fafc', fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  timeCol: { gap: 2 },
  timeMetaLabel: { fontSize: 11, color: '#64748b' },
  timeMetaVal: { fontSize: 13, color: '#cbd5e1', fontWeight: '600' },
  durationVal: { fontSize: 13, color: '#10b981', fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: '#f8fafc', fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  dLabel: { color: '#94a3b8', fontSize: 14 },
  dVal: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
});

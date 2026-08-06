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
import { Plus, Clock, X } from 'lucide-react-native';
import { useAttendanceStore } from '../store/useAttendanceStore';
import { LeaveType } from '../types';

export function LeaveManagementScreen() {
  const { leaveRequests, leaveBalances, applyLeave, cancelLeave } = useAttendanceStore();
  const [modalVisible, setModalVisible] = useState(false);

  const [leaveType, setLeaveType] = useState<LeaveType>('Casual');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalDays, setTotalDays] = useState('1');
  const [reason, setReason] = useState('');

  const handleApply = () => {
    if (!reason.trim()) return;
    applyLeave({
      leaveType,
      startDate,
      endDate,
      totalDays: parseFloat(totalDays) || 1,
      reason,
    });
    setModalVisible(false);
    setReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#10b981';
      case 'Rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏖️ Leave Management</Text>
        <TouchableOpacity style={styles.applyBtn} onPress={() => setModalVisible(true)}>
          <Plus size={18} color="#fff" />
          <Text style={styles.applyBtnText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Leave Balances Grid */}
      <View style={styles.balanceGrid}>
        <View style={[styles.balanceCard, { borderLeftColor: '#10b981' }]}>
          <Text style={[styles.bVal, { color: '#10b981' }]}>{leaveBalances.casual}</Text>
          <Text style={styles.bLabel}>Casual Leave</Text>
        </View>
        <View style={[styles.balanceCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={[styles.bVal, { color: '#f59e0b' }]}>{leaveBalances.sick}</Text>
          <Text style={styles.bLabel}>Sick Leave</Text>
        </View>
        <View style={[styles.balanceCard, { borderLeftColor: '#3b82f6' }]}>
          <Text style={[styles.bVal, { color: '#3b82f6' }]}>{leaveBalances.paid}</Text>
          <Text style={styles.bLabel}>Paid Leave</Text>
        </View>
      </View>

      {/* Requests List */}
      <Text style={styles.sectionTitle}>📋 Leave Requests</Text>
      <ScrollView contentContainerStyle={styles.listContent}>
        {leaveRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={40} color="#334155" />
            <Text style={styles.emptyText}>No leave requests submitted yet</Text>
          </View>
        ) : (
          leaveRequests.map((req) => (
            <View key={req.id} style={styles.reqCard}>
              <View style={styles.reqHeader}>
                <Text style={styles.reqType}>{req.leaveType} Leave</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(req.status) + '20' }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(req.status) }]}>
                    {req.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.reqDates}>
                🗓 {req.startDate} to {req.endDate} ({req.totalDays} day{req.totalDays > 1 ? 's' : ''})
              </Text>

              <Text style={styles.reqReason}>{`"${req.reason}"`}</Text>

              {req.status === 'Pending' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelLeave(req.id)}>
                  <Text style={styles.cancelBtnText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Apply Leave Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply For Leave</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <Text style={styles.inputLabel}>Leave Type</Text>
              <View style={styles.typesRow}>
                {(['Casual', 'Sick', 'Paid', 'Emergency', 'Work From Home'] as LeaveType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tChip, leaveType === t && styles.tChipActive]}
                    onPress={() => setLeaveType(t)}
                  >
                    <Text style={[styles.tChipText, leaveType === t && styles.tChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.inputLabel}>Total Days</Text>
              <TextInput
                style={styles.input}
                value={totalDays}
                onChangeText={setTotalDays}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={reason}
                onChangeText={setReason}
                multiline
                placeholder="Reason for leave..."
                placeholderTextColor="#64748b"
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleApply}>
                <Text style={styles.submitBtnText}>Submit Leave Application</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, color: '#f8fafc', fontWeight: '800' },
  applyBtn: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  balanceGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  balanceCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  bVal: { fontSize: 22, fontWeight: '900' },
  bLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 16, color: '#f8fafc', fontWeight: '800', marginHorizontal: 20, marginBottom: 12 },
  listContent: { paddingHorizontal: 20, gap: 12, paddingBottom: 30 },
  emptyCard: { backgroundColor: '#1e293b', padding: 30, borderRadius: 16, alignItems: 'center', gap: 10 },
  emptyText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

  reqCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155', gap: 8 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqType: { color: '#f8fafc', fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  reqDates: { color: '#cbd5e1', fontSize: 13 },
  reqReason: { color: '#94a3b8', fontSize: 13 },
  cancelBtn: { alignSelf: 'flex-start', marginTop: 4 },
  cancelBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: '#f8fafc', fontWeight: '800' },

  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  typesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tChip: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  tChipActive: { backgroundColor: '#10b981' },
  tChipText: { color: '#94a3b8', fontSize: 12 },
  tChipTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

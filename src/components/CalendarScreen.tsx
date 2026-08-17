import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
} from 'lucide-react-native';
import { useProductivityStore } from '../store/useProductivityStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAttendanceStore } from '../store/useAttendanceStore';
import { EventType } from '../types/productivity';

export function CalendarScreen() {
  const { calendarEvents, addCalendarEvent } = useProductivityStore();
  const { transactions, bills } = useFinanceStore();
  const { attendanceHistory } = useAttendanceStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState(new Date().toISOString().slice(0, 10));
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('Event');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

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

  // Gather items for selected date
  const selectedEvents = calendarEvents.filter(
    (e) => e.startDatetime.slice(0, 10) === selectedDayStr
  );
  const selectedExpenses = transactions.filter(
    (t) => (t.transactionDate || t.expenseDate) === selectedDayStr
  );
  const selectedBills = bills.filter((b) => b.dueDate === selectedDayStr);
  const selectedAttendance = attendanceHistory.find((a) => a.attendanceDate === selectedDayStr);

  const daysGrid = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  const handleCreateEvent = () => {
    if (!title.trim()) return;

    addCalendarEvent({
      title,
      startDatetime: `${selectedDayStr}T09:00:00.000Z`,
      endDatetime: `${selectedDayStr}T10:00:00.000Z`,
      eventType,
      location,
      notes,
      color: eventType === 'Meeting' ? '#3b82f6' : eventType === 'Birthday' ? '#ec4899' : '#10b981',
      allDay: false,
    });

    setTitle('');
    setLocation('');
    setNotes('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📅 Life Calendar</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Plus size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Event</Text>
          </TouchableOpacity>
        </View>

        {/* Month Navigation */}
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
        <View style={styles.calendarGrid}>
          <View style={styles.gridContainer}>
            {daysGrid.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
              }

              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = formattedDate === selectedDayStr;

              const hasEvents = calendarEvents.some((e) => e.startDatetime.slice(0, 10) === formattedDate);
              const hasExpenses = transactions.some((t) => (t.transactionDate || t.expenseDate) === formattedDate);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDayStr(formattedDate)}
                >
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                    {day}
                  </Text>
                  <View style={styles.dotsRow}>
                    {hasEvents ? <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} /> : null}
                    {hasExpenses ? <View style={[styles.dot, { backgroundColor: '#ef4444' }]} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Agenda for Selected Date */}
        <View style={styles.agendaHeader}>
          <Text style={styles.agendaTitle}>Agenda for {selectedDayStr}</Text>
        </View>

        <View style={styles.agendaList}>
          {selectedAttendance ? (
            <View style={styles.agendaItem}>
              <View style={[styles.agendaBar, { backgroundColor: '#10b981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Work Attendance: {selectedAttendance.status}</Text>
                <Text style={styles.itemMeta}>Work Time: {selectedAttendance.totalWorkMinutes} mins</Text>
              </View>
            </View>
          ) : null}

          {selectedExpenses.map((exp) => (
            <View key={exp.id} style={styles.agendaItem}>
              <View style={[styles.agendaBar, { backgroundColor: '#ef4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Expense: {exp.title}</Text>
                <Text style={styles.itemMeta}>{exp.category} · ₹{exp.amount}</Text>
              </View>
            </View>
          ))}

          {selectedBills.map((bill) => (
            <View key={bill.id} style={styles.agendaItem}>
              <View style={[styles.agendaBar, { backgroundColor: '#f59e0b' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Bill Due: {bill.title}</Text>
                <Text style={styles.itemMeta}>Amount: ₹{bill.amount}</Text>
              </View>
            </View>
          ))}

          {selectedEvents.map((evt) => (
            <View key={evt.id} style={styles.agendaItem}>
              <View style={[styles.agendaBar, { backgroundColor: evt.color || '#3b82f6' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{evt.title}</Text>
                <Text style={styles.itemMeta}>{evt.eventType} {evt.location ? `· ${evt.location}` : ''}</Text>
              </View>
            </View>
          ))}

          {!selectedAttendance &&
            selectedExpenses.length === 0 &&
            selectedBills.length === 0 &&
            selectedEvents.length === 0 && (
              <View style={styles.emptyAgenda}>
                <Clock size={32} color="#334155" />
                <Text style={styles.emptyText}>No events or expenses scheduled for this date.</Text>
              </View>
            )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Calendar Event</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <Text style={styles.inputLabel}>Event Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Team Meeting, Doctor Appointment..."
                placeholderTextColor="#64748b"
              />

              <Text style={styles.inputLabel}>Event Type</Text>
              <View style={styles.typeRow}>
                {(['Meeting', 'Birthday', 'Event', 'Note'] as EventType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, eventType === t && styles.typeChipActive]}
                    onPress={() => setEventType(t)}
                  >
                    <Text style={[styles.typeChipText, eventType === t && styles.typeChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Location (Optional)</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Office, Zoom, Home..."
                placeholderTextColor="#64748b"
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Additional details..."
                placeholderTextColor="#64748b"
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateEvent}>
                <Text style={styles.submitBtnText}>Add Event to Calendar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { paddingBottom: 60 },
  header: { padding: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 22, color: '#f8fafc', fontWeight: '800' },
  addBtn: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 10 },
  monthText: { fontSize: 18, color: '#f8fafc', fontWeight: '700' },
  navBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 10 },

  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  weekDayText: { color: '#94a3b8', fontWeight: '600', fontSize: 13, width: 40, textAlign: 'center' },

  calendarGrid: { paddingHorizontal: 16, paddingTop: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayCellEmpty: { width: '13%', height: 44 },
  dayCell: { width: '13%', height: 44, backgroundColor: '#1e293b', borderRadius: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dayCellSelected: { backgroundColor: '#10b981' },
  dayNumber: { color: '#f8fafc', fontWeight: '600', fontSize: 13 },
  dayNumberSelected: { color: '#fff', fontWeight: '900' },
  dotsRow: { flexDirection: 'row', gap: 3, position: 'absolute', bottom: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  agendaHeader: { paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  agendaTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800' },
  agendaList: { paddingHorizontal: 20, gap: 10, paddingBottom: 40 },
  agendaItem: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#334155' },
  agendaBar: { width: 4, height: '100%', borderRadius: 2 },
  itemTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  itemMeta: { color: '#94a3b8', fontSize: 12 },

  emptyAgenda: { backgroundColor: '#1e293b', padding: 24, borderRadius: 14, alignItems: 'center', gap: 8 },
  emptyText: { color: '#64748b', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: '#f8fafc', fontWeight: '800' },

  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  typeChipActive: { backgroundColor: '#10b981' },
  typeChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  typeChipTextActive: { color: '#fff', fontWeight: '800' },
  submitBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

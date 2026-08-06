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
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  X,
  Clock,
  ListTodo,
  RotateCw,
} from 'lucide-react-native';
import { useProductivityStore } from '../store/useProductivityStore';
import { TaskPriority, RepeatType } from '../types/productivity';

export function EnhancedTasksScreen() {
  const {
    enhancedTasks,
    addEnhancedTask,
    deleteEnhancedTask,
    toggleTaskComplete,
  } = useProductivityStore();

  const [filterSection, setFilterSection] = useState<'Today' | 'Upcoming' | 'Important' | 'Completed' | 'All'>('Today');
  const [modalVisible, setModalVisible] = useState(false);

  // Task Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [category, setCategory] = useState('Work');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueTime, setDueTime] = useState('06:00 PM');
  const [repeatType, setRepeatType] = useState<RepeatType>('Once');

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredTasks = enhancedTasks.filter((task) => {
    if (filterSection === 'Today') return !task.completed && (task.dueDate === todayStr || !task.dueDate);
    if (filterSection === 'Upcoming') return !task.completed && task.dueDate > todayStr;
    if (filterSection === 'Important') return !task.completed && (task.priority === 'Critical' || task.priority === 'High');
    if (filterSection === 'Completed') return task.completed;
    return true;
  });

  const handleCreateTask = async () => {
    if (!title.trim()) return;

    await addEnhancedTask({
      title,
      description,
      priority,
      status: 'Pending',
      category,
      dueDate,
      dueTime,
      repeatType,
      completed: false,
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setPriority('High');
    setModalVisible(false);
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f59e0b';
      case 'Medium': return '#3b82f6';
      case 'Low': return '#10b981';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>✅ Task Management</Text>
          <Text style={styles.subtitle}>Organize your daily tasks, reminders & priorities</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {(['Today', 'Upcoming', 'Important', 'Completed', 'All'] as const).map((sec) => (
          <TouchableOpacity
            key={sec}
            style={[styles.chip, filterSection === sec && styles.chipActive]}
            onPress={() => setFilterSection(sec)}
          >
            <Text style={[styles.chipText, filterSection === sec && styles.chipTextActive]}>
              {sec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tasks List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <ListTodo size={40} color="#334155" />
            <Text style={styles.emptyText}>{`No tasks found in "${filterSection}"`}</Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <TouchableOpacity onPress={() => toggleTaskComplete(task.id)} style={styles.checkBtn}>
                {task.completed ? (
                  <CheckSquare size={22} color="#10b981" />
                ) : (
                  <Square size={22} color="#64748b" />
                )}
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
                  {task.title}
                </Text>
                {task.description ? (
                  <Text style={styles.taskDesc}>{task.description}</Text>
                ) : null}

                <View style={styles.taskMetaRow}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                      {task.priority}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <CalendarIcon size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>{task.dueDate}</Text>
                  </View>

                  {task.dueTime ? (
                    <View style={styles.metaItem}>
                      <Clock size={12} color="#94a3b8" />
                      <Text style={styles.metaText}>{task.dueTime}</Text>
                    </View>
                  ) : null}

                  {task.repeatType !== 'Once' ? (
                    <View style={styles.metaItem}>
                      <RotateCw size={12} color="#6366f1" />
                      <Text style={styles.metaText}>{task.repeatType}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity onPress={() => deleteEnhancedTask(task.id)} style={{ padding: 4 }}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <Text style={styles.inputLabel}>Task Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Pay Internet Bill / Client Meeting"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Add extra details..."
                placeholderTextColor="#64748b"
              />

              <Text style={styles.inputLabel}>Priority Level</Text>
              <View style={styles.priorityRow}>
                {(['Critical', 'High', 'Medium', 'Low'] as TaskPriority[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pChip, priority === p && { backgroundColor: getPriorityColor(p) }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.pChipText, priority === p && { color: '#fff', fontWeight: '800' }]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="Work, Personal, Health, Finance..."
                placeholderTextColor="#64748b"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Due Date</Text>
                  <TextInput
                    style={styles.input}
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Due Time</Text>
                  <TextInput
                    style={styles.input}
                    value={dueTime}
                    onChangeText={setDueTime}
                    placeholder="06:00 PM"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Repeat Frequency</Text>
              <View style={styles.priorityRow}>
                {(['Once', 'Daily', 'Weekly', 'Monthly'] as RepeatType[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.pChip, repeatType === r && styles.pChipActive]}
                    onPress={() => setRepeatType(r)}
                  >
                    <Text style={[styles.pChipText, repeatType === r && styles.pChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTask}>
                <Text style={styles.submitBtnText}>Create Task & Schedule Reminder</Text>
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
  header: { padding: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, color: '#f8fafc', fontWeight: '800' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  addBtn: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  filterScroll: { paddingHorizontal: 20, gap: 8, paddingBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#10b981' },
  chipText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '800' },

  listContent: { padding: 20, gap: 12, paddingBottom: 40 },
  emptyCard: { backgroundColor: '#1e293b', padding: 40, borderRadius: 16, alignItems: 'center', gap: 10 },
  emptyText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

  taskCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155', flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkBtn: { padding: 2 },
  taskTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '700' },
  taskTitleDone: { color: '#64748b', textDecorationLine: 'line-through' },
  taskDesc: { color: '#94a3b8', fontSize: 13 },

  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '800' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#94a3b8', fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: '#f8fafc', fontWeight: '800' },

  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  pChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  pChipActive: { backgroundColor: '#10b981' },
  pChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  pChipTextActive: { color: '#fff', fontWeight: '800' },

  row: { flexDirection: 'row', gap: 10 },
  submitBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

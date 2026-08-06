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
import { useFinanceStore } from '../store/useFinanceStore';
import { getFormattedDate } from '../utils/budgetCalculator';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  X,
  CheckCircle,
} from 'lucide-react-native';

type TaskSection = 'Today' | 'Upcoming' | 'Important' | 'Completed';

export function TodayTasksScreen() {
  const { tasks, addTask, toggleTaskCompleted, deleteTask } = useFinanceStore();

  const [activeSection, setActiveSection] = useState<TaskSection>('Today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('High');

  const filteredTasks = tasks.filter((t) => {
    if (activeSection === 'Today') return !t.completed && t.section === 'Today';
    if (activeSection === 'Upcoming') return !t.completed && t.section === 'Upcoming';
    if (activeSection === 'Important') return !t.completed && t.priority === 'High';
    if (activeSection === 'Completed') return t.completed;
    return true;
  });

  const handleCreateTask = () => {
    if (!newTitle.trim()) return;

    addTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      dueDate: getFormattedDate(),
      priority,
      section: activeSection === 'Completed' ? 'Today' : activeSection,
      completed: false,
    });

    setNewTitle('');
    setNewDesc('');
    setIsAddModalOpen(false);
  };

  const getPriorityColor = (p: 'Low' | 'Medium' | 'High') => {
    if (p === 'High') return '#ef4444';
    if (p === 'Medium') return '#f59e0b';
    return '#10b981';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Today&apos;s Financial Tasks</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>+ Task</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Microsoft To-Do style smart reminders and finance tasks</Text>
      </View>

      {/* Sections Row */}
      <View style={styles.sectionRow}>
        {(['Today', 'Upcoming', 'Important', 'Completed'] as TaskSection[]).map((section) => {
          const count = tasks.filter((t) => {
            if (section === 'Today') return !t.completed && t.section === 'Today';
            if (section === 'Upcoming') return !t.completed && t.section === 'Upcoming';
            if (section === 'Important') return !t.completed && t.priority === 'High';
            if (section === 'Completed') return t.completed;
            return false;
          }).length;

          return (
            <TouchableOpacity
              key={section}
              style={[styles.sectionChip, activeSection === section && styles.sectionChipActive]}
              onPress={() => setActiveSection(section)}
            >
              <Text style={[styles.sectionText, activeSection === section && styles.sectionTextActive]}>
                {section} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Task List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={32} color="#10b981" />
            <Text style={styles.emptyText}>No tasks in {activeSection}. All caught up!</Text>
          </View>
        ) : (
          filteredTasks.map((t) => (
            <View key={t.id} style={styles.taskCard}>
              <TouchableOpacity
                style={styles.checkArea}
                onPress={() => toggleTaskCompleted(t.id)}
              >
                {t.completed ? (
                  <CheckSquare size={22} color="#10b981" />
                ) : (
                  <Square size={22} color="#64748b" />
                )}
              </TouchableOpacity>

              <View style={styles.taskBody}>
                <Text style={[styles.taskTitle, t.completed && styles.taskTitleCompleted]}>
                  {t.title}
                </Text>
                {t.description ? <Text style={styles.taskDesc}>{t.description}</Text> : null}

                <View style={styles.taskMetaRow}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: `${getPriorityColor(t.priority)}20` },
                    ]}
                  >
                    <Text style={[styles.priorityText, { color: getPriorityColor(t.priority) }]}>
                      {t.priority} Priority
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <CalendarIcon size={12} color="#94a3b8" />
                    <Text style={styles.metaText}>{t.dueDate}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(t.id)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Financial Task</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pay Electricity Bill, Buy Groceries"
              placeholderTextColor="#64748b"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.descInput]}
              placeholder="Optional notes or details..."
              placeholderTextColor="#64748b"
              multiline
              value={newDesc}
              onChangeText={setNewDesc}
            />

            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.priorityRow}>
              {(['Low', 'Medium', 'High'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    priority === p && { backgroundColor: getPriorityColor(p) },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      priority === p && styles.priorityChipTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateTask}>
              <Plus size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginVertical: 10,
    gap: 8,
  },
  sectionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1e293b',
  },
  sectionChipActive: {
    backgroundColor: '#10b981',
  },
  sectionText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  sectionTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkArea: {
    paddingRight: 12,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  taskDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  deleteBtn: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  descInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  priorityChipText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13,
  },
  priorityChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

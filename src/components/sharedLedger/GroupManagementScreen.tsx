import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { Group, GroupCategory } from '../../types/sharedLedger';
import { Plus, Edit3, Trash2, Check, X, Folder } from 'lucide-react-native';

const CATEGORIES: GroupCategory[] = [
  'Room',
  'Flat',
  'Friends',
  'Trip',
  'Family',
  'Office',
  'Custom',
];

export function GroupManagementScreen() {
  const { groups, people, groupMembers, addGroup, updateGroup, deleteGroup, sharedExpenses } =
    useSharedLedgerStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('Room');
  const [currency, setCurrency] = useState('₹');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setName('');
    setDescription('');
    setCategory('Room');
    setCurrency('₹');
    setSelectedPersonIds(people.map((p) => p.id));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setCategory(group.category);
    setCurrency(group.currency);

    const currentMemberIds = groupMembers
      .filter((gm) => gm.groupId === group.id)
      .map((gm) => gm.personId);
    setSelectedPersonIds(currentMemberIds);
    setIsModalOpen(true);
  };

  const handleToggleMember = (pId: string) => {
    if (selectedPersonIds.includes(pId)) {
      setSelectedPersonIds(selectedPersonIds.filter((id) => id !== pId));
    } else {
      setSelectedPersonIds([...selectedPersonIds, pId]);
    }
  };

  const handleSaveGroup = () => {
    if (!name.trim()) return;

    if (editingGroup) {
      updateGroup(
        editingGroup.id,
        {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          currency,
        },
        selectedPersonIds
      );
    } else {
      addGroup(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          currency,
          status: 'active',
        },
        selectedPersonIds
      );
    }
    setIsModalOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.sectionTitle}>Groups ({groups.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>New Group</Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {groups.map((group) => {
          const members = groupMembers
            .filter((gm) => gm.groupId === group.id)
            .map((gm) => people.find((p) => p.id === gm.personId))
            .filter(Boolean);

          const groupTotalExpenses = sharedExpenses
            .filter((e) => e.status !== 'voided' && e.groupId === group.id)
            .reduce((sum, e) => sum + e.totalAmount, 0);

          return (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.categoryBadge}>
                  <Folder size={12} color="#10b981" />
                  <Text style={styles.categoryBadgeText}>{group.category}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={() => handleOpenEdit(group)}>
                    <Edit3 size={16} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteGroup(group.id)}>
                    <Trash2 size={16} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.groupName}>{group.name}</Text>
              {group.description && <Text style={styles.groupDesc}>{group.description}</Text>}

              {/* Expense stats banner */}
              <View style={styles.statsBanner}>
                <Text style={styles.statsLabel}>Total Group Expenses:</Text>
                <Text style={styles.statsValue}>
                  {group.currency}{groupTotalExpenses.toLocaleString()}
                </Text>
              </View>

              {/* Members Chips */}
              <Text style={styles.membersHeader}>MEMBERS ({members.length}):</Text>
              <View style={styles.membersRow}>
                {members.map((m) => (
                  <View key={m?.id} style={styles.memberChip}>
                    <Text style={styles.memberChipText}>{m?.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Group Modal */}
      <Modal visible={isModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Group Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Room 302 Flatmates"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, category === cat && styles.catChipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rent, internet, water & electricity"
                  placeholderTextColor="#64748b"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Group Members</Text>
                {people.map((p) => {
                  const isSelected = selectedPersonIds.includes(p.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.memberSelectRow, isSelected && styles.memberSelectRowActive]}
                      onPress={() => handleToggleMember(p.id)}
                    >
                      <Text style={styles.memberSelectName}>{p.name}</Text>
                      {isSelected && <Check size={16} color="#10b981" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGroup} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>
                {editingGroup ? 'Update Group' : 'Create Group'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  groupCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  groupDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statsValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#60a5fa',
  },
  membersHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberChip: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalPanel: {
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
    fontWeight: '800',
    color: '#ffffff',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  catChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  catText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  catTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  memberSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  memberSelectRowActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  memberSelectName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

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
import { Person } from '../../types/sharedLedger';
import { PersonDetailsModal } from './PersonDetailsModal';
import { UserPlus, Search, Edit3, Power, X } from 'lucide-react-native';

export function PeopleManagementScreen() {
  const { people, addPerson, updatePerson, togglePersonStatus, getPersonBalanceSummaries } =
    useSharedLedgerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const summaries = getPersonBalanceSummaries();

  const filteredPeople = people.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phoneNumber && p.phoneNumber.includes(searchQuery)) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (p: Person) => {
    setEditingPerson(p);
    setName(p.name);
    setPhone(p.phoneNumber || '');
    setEmail(p.email || '');
    setNotes(p.notes || '');
    setIsAddEditModalOpen(true);
  };

  const handleSavePerson = () => {
    if (!name.trim()) return;

    if (editingPerson) {
      updatePerson(editingPerson.id, {
        name: name.trim(),
        phoneNumber: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addPerson({
        name: name.trim(),
        phoneNumber: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'active',
      });
    }
    setIsAddEditModalOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar & Search */}
      <View style={styles.headerBar}>
        <View style={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search person by name or phone..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <UserPlus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Person</Text>
        </TouchableOpacity>
      </View>

      {/* People List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredPeople.map((person) => {
          const sum = summaries.find((s) => s.person.id === person.id);
          const net = sum?.netBalance || 0;

          return (
            <TouchableOpacity
              key={person.id}
              style={[styles.personCard, person.status === 'inactive' && styles.cardInactive]}
              onPress={() => {
                setSelectedPerson(person);
                setIsDetailsModalOpen(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.personRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{person.name.charAt(0).toUpperCase()}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.personName}>{person.name}</Text>
                    {person.status === 'inactive' && (
                      <View style={styles.inactiveTag}>
                        <Text style={styles.inactiveTagText}>Inactive</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.personMeta}>
                    {person.phoneNumber ? `📞 ${person.phoneNumber}` : 'No phone saved'}
                  </Text>
                </View>

                {/* Net balance readout */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.netBalanceText,
                      { color: net > 0 ? '#10b981' : net < 0 ? '#f43f5e' : '#94a3b8' },
                    ]}
                  >
                    {net > 0 ? '+' : ''}₹{net.toLocaleString()}
                  </Text>
                  <Text style={styles.statusSubtext}>{sum?.statusLabel}</Text>
                </View>
              </View>

              {/* Action buttons footer */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(person);
                  }}
                >
                  <Edit3 size={14} color="#3b82f6" />
                  <Text style={styles.cardActionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    togglePersonStatus(person.id);
                  }}
                >
                  <Power size={14} color={person.status === 'active' ? '#f43f5e' : '#10b981'} />
                  <Text style={styles.cardActionText}>
                    {person.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />
                <Text style={styles.detailsLink}>View Details →</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Person Details Modal */}
      <PersonDetailsModal
        visible={isDetailsModalOpen}
        person={selectedPerson}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      {/* Add / Edit Person Modal */}
      <Modal visible={isAddEditModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPerson ? 'Edit Person Details' : 'Add New Person'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddEditModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                placeholder="e.g. rahul@example.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes / Description</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                multiline
                placeholder="e.g. Flatmate, Room 302"
                placeholderTextColor="#64748b"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePerson} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>
                {editingPerson ? 'Update Person' : 'Save Person'}
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
    gap: 10,
    marginBottom: 16,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
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
  personCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardInactive: {
    opacity: 0.6,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  personMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  inactiveTag: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveTagText: {
    fontSize: 10,
    color: '#f43f5e',
    fontWeight: '700',
  },
  netBalanceText: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusSubtext: {
    fontSize: 10,
    color: '#64748b',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  detailsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
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

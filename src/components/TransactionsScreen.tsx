import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { Transaction } from '../types';
import { getFormattedDate } from '../utils/budgetCalculator';
import { AddTransactionModal } from './AddTransactionModal';
import {
  Search,
  Plus,
  Trash2,
  Copy,
  FileText,
  X,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';

type DateFilter = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'All';

export function TransactionsScreen() {
  const { profile, transactions, deleteTransaction, duplicateTransaction } = useFinanceStore();

  const [dateFilter, setDateFilter] = useState<DateFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory] = useState<string>('All');
  const [selectedPaymentMethod] = useState<string>('All');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const todayStr = getFormattedDate();

  // Filtering Logic
  const filteredTransactions = transactions.filter((tx) => {
    // Search query
    const matchSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.location && tx.location.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filter
    const matchCategory = selectedCategory === 'All' || tx.category === selectedCategory;

    // Payment method filter
    const matchPayment = selectedPaymentMethod === 'All' || tx.paymentMethod === selectedPaymentMethod;

    // Date Filter
    let matchDate = true;
    if (dateFilter === 'Today') {
      matchDate = tx.transactionDate === todayStr;
    } else if (dateFilter === 'This Month') {
      matchDate = tx.transactionDate.substring(0, 7) === todayStr.substring(0, 7);
    }

    return matchSearch && matchCategory && matchPayment && matchDate;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Transactions History</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Detailed Google Pay + Excel style ledger of your activity</Text>
      </View>

      {/* Date Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginVertical: 10 }}
        contentContainerStyle={styles.filterTabsRow}
      >
        {(['Today', 'Yesterday', 'This Week', 'This Month', 'All'] as DateFilter[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, dateFilter === tab && styles.filterTabActive]}
            onPress={() => setDateFilter(tab)}
          >
            <Text style={[styles.filterTabText, dateFilter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search & Sub-filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, category, notes..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions found for current filter.</Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'Income' || tx.type === 'Borrow';
            return (
              <TouchableOpacity
                key={tx.id}
                style={styles.txRow}
                onPress={() => setSelectedTx(tx)}
              >
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                    ]}
                  >
                    {isIncome ? (
                      <ArrowDownLeft size={18} color="#10b981" />
                    ) : (
                      <ArrowUpRight size={18} color="#ef4444" />
                    )}
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txMeta}>
                      {tx.transactionDate} • {tx.category} • {tx.paymentMethod}
                    </Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isIncome ? '#10b981' : '#f8fafc' }]}>
                    {isIncome ? '+' : '-'}{profile.currency}{tx.amount.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Details & Options Modal */}
      {selectedTx && (
        <Modal visible={!!selectedTx} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedTx.title}</Text>
                <TouchableOpacity onPress={() => setSelectedTx(null)}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailAmount}>
                {selectedTx.type === 'Income' ? '+' : '-'}{profile.currency}{selectedTx.amount}
              </Text>

              <View style={styles.detailGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Category</Text>
                  <Text style={styles.gridValue}>{selectedTx.category}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Payment Method</Text>
                  <Text style={styles.gridValue}>{selectedTx.paymentMethod}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Date</Text>
                  <Text style={styles.gridValue}>{selectedTx.transactionDate}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Type</Text>
                  <Text style={styles.gridValue}>{selectedTx.type}</Text>
                </View>
              </View>

              {selectedTx.notes && (
                <View style={styles.notesBox}>
                  <FileText size={14} color="#94a3b8" />
                  <Text style={styles.notesText}>{selectedTx.notes}</Text>
                </View>
              )}

              {selectedTx.attachment && (
                <View style={styles.attachmentBox}>
                  <Text style={styles.gridLabel}>Attached Receipt</Text>
                  <Image source={{ uri: selectedTx.attachment }} style={styles.receiptImg} />
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    duplicateTransaction(selectedTx.id);
                    setSelectedTx(null);
                  }}
                >
                  <Copy size={16} color="#3b82f6" />
                  <Text style={[styles.actionText, { color: '#3b82f6' }]}>Duplicate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => {
                    deleteTransaction(selectedTx.id);
                    setSelectedTx(null);
                  }}
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </View>
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
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    flexShrink: 1,
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
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#10b981',
  },
  filterTabText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {},
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  txMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  detailAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10b981',
    marginVertical: 14,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  gridItem: {
    width: '45%',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 2,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  notesText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  attachmentBox: {
    marginBottom: 14,
  },
  receiptImg: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionText: {
    fontWeight: '700',
    fontSize: 14,
  },
});

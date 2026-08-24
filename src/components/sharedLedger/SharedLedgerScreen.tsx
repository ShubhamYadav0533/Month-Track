import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useSharedLedgerStore } from '../../store/useSharedLedgerStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { SharedLedgerDashboard } from './SharedLedgerDashboard';
import { PeopleManagementScreen } from './PeopleManagementScreen';
import { GroupManagementScreen } from './GroupManagementScreen';
import { AddSharedExpenseModal } from './AddSharedExpenseModal';
import { LendingBorrowingScreen } from './LendingBorrowingScreen';
import { RecordRepaymentModal } from './RecordRepaymentModal';
import { SettlementEngineScreen } from './SettlementEngineScreen';
import { MonthlyLedgerScreen } from './MonthlyLedgerScreen';
import { SharedLedgerReportsScreen } from './SharedLedgerReportsScreen';
import {
  LayoutDashboard,
  Users,
  Folder,
  ArrowUpRight,
  Scale,
  Calendar,
  FileText,
} from 'lucide-react-native';

export type SharedLedgerTab =
  | 'overview'
  | 'people'
  | 'groups'
  | 'loans'
  | 'settlements'
  | 'ledger'
  | 'reports';

export function SharedLedgerScreen() {
  const [activeTab, setActiveTab] = useState<SharedLedgerTab>('overview');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);

  const { loadSupabaseSharedLedger } = useSharedLedgerStore();
  const userId = useFinanceStore((state) => state.profile.id);

  useEffect(() => {
    if (userId) {
      loadSupabaseSharedLedger(userId);
    }
  }, [userId, loadSupabaseSharedLedger]);

  const tabs: { id: SharedLedgerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'people', label: 'People', icon: <Users size={16} /> },
    { id: 'groups', label: 'Groups', icon: <Folder size={16} /> },
    { id: 'loans', label: 'Lend & Borrow', icon: <ArrowUpRight size={16} /> },
    { id: 'settlements', label: 'Settlements', icon: <Scale size={16} /> },
    { id: 'ledger', label: 'Monthly Ledger', icon: <Calendar size={16} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Module Sub-Navigation Bar */}
      <View style={styles.topNavContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNavScroll}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.topTabBtn, isActive && styles.topTabBtnActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                {React.cloneElement(tab.icon as React.ReactElement, {
                  color: isActive ? '#ffffff' : '#94a3b8',
                })}
                <Text style={[styles.topTabText, isActive && styles.topTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Tab Screen Render */}
      <View style={styles.content}>
        {activeTab === 'overview' && (
          <SharedLedgerDashboard
            onNavigateTab={(t) => {
              if (t === 'expenses') {
                setIsAddExpenseModalOpen(true);
              } else {
                setActiveTab(t as SharedLedgerTab);
              }
            }}
            onOpenAddExpense={() => setIsAddExpenseModalOpen(true)}
            onOpenLendBorrow={() => setActiveTab('loans')}
            onOpenRepayment={() => setIsRepaymentModalOpen(true)}
          />
        )}
        {activeTab === 'people' && <PeopleManagementScreen />}
        {activeTab === 'groups' && <GroupManagementScreen />}
        {activeTab === 'loans' && <LendingBorrowingScreen />}
        {activeTab === 'settlements' && <SettlementEngineScreen />}
        {activeTab === 'ledger' && <MonthlyLedgerScreen />}
        {activeTab === 'reports' && <SharedLedgerReportsScreen />}
      </View>

      {/* Modals */}
      <AddSharedExpenseModal
        visible={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
      />

      <RecordRepaymentModal
        visible={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topNavContainer: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 8,
  },
  topNavScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  topTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f172a',
  },
  topTabBtnActive: {
    backgroundColor: '#10b981',
  },
  topTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  topTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});

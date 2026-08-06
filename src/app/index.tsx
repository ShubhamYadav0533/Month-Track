import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { SecurityLockScreen } from '../components/SecurityLockScreen';
import { SetupWizard } from '../components/SetupWizard';

import { LiveDashboard } from '../components/LiveDashboard';
import { TransactionsScreen } from '../components/TransactionsScreen';
import { TodayTasksScreen } from '../components/TodayTasksScreen';
import { MonthlyPlannerScreen } from '../components/MonthlyPlannerScreen';
import { GoalsScreen } from '../components/GoalsScreen';
import { BillsEMIScreen } from '../components/BillsEMIScreen';
import { AnalyticsScreen } from '../components/AnalyticsScreen';
import { SettingsExportScreen } from '../components/SettingsExportScreen';

import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Calendar,
  Target,
  CreditCard,
  BarChart3,
  User,
} from 'lucide-react-native';

type OSTab =
  | 'dashboard'
  | 'transactions'
  | 'tasks'
  | 'planner'
  | 'goals'
  | 'bills'
  | 'reports'
  | 'profile';

export default function MainApp() {
  const { profile, isLocked } = useFinanceStore();
  const [currentTab, setCurrentTab] = useState<OSTab>('dashboard');

  // Guard 1: Passcode Security Lock
  if (isLocked) {
    return <SecurityLockScreen />;
  }

  // Guard 2: First-time Onboarding Setup
  if (!profile.isSetupComplete) {
    return <SetupWizard />;
  }

  const tabs: { id: OSTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} color={currentTab === 'dashboard' ? '#10b981' : '#64748b'} /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt size={20} color={currentTab === 'transactions' ? '#10b981' : '#64748b'} /> },
    { id: 'tasks', label: "Today's Tasks", icon: <CheckSquare size={20} color={currentTab === 'tasks' ? '#10b981' : '#64748b'} /> },
    { id: 'planner', label: 'Planner', icon: <Calendar size={20} color={currentTab === 'planner' ? '#10b981' : '#64748b'} /> },
    { id: 'goals', label: 'Goals', icon: <Target size={20} color={currentTab === 'goals' ? '#10b981' : '#64748b'} /> },
    { id: 'bills', label: 'Bills & EMI', icon: <CreditCard size={20} color={currentTab === 'bills' ? '#10b981' : '#64748b'} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} color={currentTab === 'reports' ? '#10b981' : '#64748b'} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} color={currentTab === 'profile' ? '#10b981' : '#64748b'} /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Screen Content Render */}
      <View style={styles.content}>
        {currentTab === 'dashboard' && <LiveDashboard />}
        {currentTab === 'transactions' && <TransactionsScreen />}
        {currentTab === 'tasks' && <TodayTasksScreen />}
        {currentTab === 'planner' && <MonthlyPlannerScreen />}
        {currentTab === 'goals' && <GoalsScreen />}
        {currentTab === 'bills' && <BillsEMIScreen />}
        {currentTab === 'reports' && <AnalyticsScreen />}
        {currentTab === 'profile' && <SettingsExportScreen />}
      </View>

      {/* Primary OS Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavScroll}
        >
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.navItem, currentTab === t.id && styles.navItemActive]}
              onPress={() => setCurrentTab(t.id)}
            >
              {t.icon}
              <Text style={[styles.navText, currentTab === t.id && styles.navTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
  },
  bottomNavContainer: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
  },
  bottomNavScroll: {
    paddingHorizontal: 12,
    gap: 6,
    alignItems: 'center',
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
  },
  navItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  navText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  navTextActive: {
    color: '#10b981',
    fontWeight: '800',
  },
});

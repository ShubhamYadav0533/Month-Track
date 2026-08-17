import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { SecurityLockScreen } from '../components/SecurityLockScreen';
import { SetupWizard } from '../components/SetupWizard';

// Productivity OS Components
import { UnifiedDashboard } from '../components/UnifiedDashboard';
import { EnhancedTasksScreen } from '../components/EnhancedTasksScreen';
import { TransactionsScreen } from '../components/TransactionsScreen';
import { AttendanceDashboard } from '../components/AttendanceDashboard';
import { CalendarScreen } from '../components/CalendarScreen';
import { NotificationsScreen } from '../components/NotificationsScreen';
import { SettingsExportScreen } from '../components/SettingsExportScreen';

import {
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Clock,
  Calendar as CalendarIcon,
  Bell,
  User,
} from 'lucide-react-native';

type UnifiedTab =
  | 'dashboard'
  | 'tasks'
  | 'expenses'
  | 'attendance'
  | 'calendar'
  | 'notifications'
  | 'profile';

export default function MainApp() {
  const { profile, isLocked } = useFinanceStore();
  const [currentTab, setCurrentTab] = useState<UnifiedTab>('dashboard');

  const appMode = profile.defaultAppMode || 'finance';

  const allTabs: { id: UnifiedTab; label: string; icon: React.ReactNode; mode?: 'finance' | 'hrms' | 'all' }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} color={currentTab === 'dashboard' ? '#10b981' : '#64748b'} />, mode: 'all' },
    { id: 'expenses', label: 'Expenses', icon: <DollarSign size={20} color={currentTab === 'expenses' ? '#10b981' : '#64748b'} />, mode: 'finance' },
    { id: 'attendance', label: 'Attendance', icon: <Clock size={20} color={currentTab === 'attendance' ? '#10b981' : '#64748b'} />, mode: 'hrms' },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} color={currentTab === 'tasks' ? '#10b981' : '#64748b'} />, mode: 'hrms' },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={20} color={currentTab === 'calendar' ? '#10b981' : '#64748b'} />, mode: 'all' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} color={currentTab === 'notifications' ? '#10b981' : '#64748b'} />, mode: 'all' },
    { id: 'profile', label: 'Profile', icon: <User size={20} color={currentTab === 'profile' ? '#10b981' : '#64748b'} />, mode: 'all' },
  ];

  const unifiedTabs = allTabs.filter(t => t.mode === 'all' || t.mode === appMode);

  useEffect(() => {
    if (!unifiedTabs.some(t => t.id === currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [appMode]);

  // Guard 1: Passcode Security Lock
  if (isLocked) {
    return <SecurityLockScreen />;
  }

  // Guard 2: First-time Onboarding Setup
  if (!profile.isSetupComplete) {
    return <SetupWizard />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Screen Content Render */}
      <View style={styles.content}>
        {currentTab === 'dashboard' && <UnifiedDashboard />}
        {currentTab === 'tasks' && <EnhancedTasksScreen />}
        {currentTab === 'expenses' && <TransactionsScreen />}
        {currentTab === 'attendance' && <AttendanceDashboard />}
        {currentTab === 'calendar' && <CalendarScreen />}
        {currentTab === 'notifications' && <NotificationsScreen />}
        {currentTab === 'profile' && <SettingsExportScreen />}
      </View>

      {/* Primary OS Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavScroll}
        >
          {unifiedTabs.map((t) => (
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

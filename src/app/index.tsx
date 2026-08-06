import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { SecurityLockScreen } from '../components/SecurityLockScreen';
import { SetupWizard } from '../components/SetupWizard';

// Finance Components
import { LiveDashboard } from '../components/LiveDashboard';
import { TransactionsScreen } from '../components/TransactionsScreen';
import { TodayTasksScreen } from '../components/TodayTasksScreen';
import { MonthlyPlannerScreen } from '../components/MonthlyPlannerScreen';
import { GoalsScreen } from '../components/GoalsScreen';
import { BillsEMIScreen } from '../components/BillsEMIScreen';
import { AnalyticsScreen } from '../components/AnalyticsScreen';
import { SettingsExportScreen } from '../components/SettingsExportScreen';

// HRMS Components
import { AttendanceDashboard } from '../components/AttendanceDashboard';
import { TodayShiftScreen } from '../components/TodayShiftScreen';
import { AttendanceHistoryScreen } from '../components/AttendanceHistoryScreen';
import { AttendanceCalendarScreen } from '../components/AttendanceCalendarScreen';
import { LeaveManagementScreen } from '../components/LeaveManagementScreen';
import { AttendanceReportsScreen } from '../components/AttendanceReportsScreen';
import { EmployeeProfileScreen } from '../components/EmployeeProfileScreen';

import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Calendar,
  Target,
  CreditCard,
  BarChart3,
  User,
  Clock,
  Briefcase,
  Palmtree,
} from 'lucide-react-native';

type AppMode = 'finance' | 'hrms';

type FinanceTab =
  | 'dashboard'
  | 'transactions'
  | 'tasks'
  | 'planner'
  | 'goals'
  | 'bills'
  | 'reports'
  | 'profile';

type HrmsTab =
  | 'hrms_dashboard'
  | 'hrms_shift'
  | 'hrms_history'
  | 'hrms_calendar'
  | 'hrms_leave'
  | 'hrms_reports'
  | 'hrms_profile';

export default function MainApp() {
  const { profile, isLocked } = useFinanceStore();
  const [appMode, setAppMode] = useState<AppMode>('hrms');
  const [financeTab, setFinanceTab] = useState<FinanceTab>('dashboard');
  const [hrmsTab, setHrmsTab] = useState<HrmsTab>('hrms_dashboard');

  // Guard 1: Passcode Security Lock
  if (isLocked) {
    return <SecurityLockScreen />;
  }

  // Guard 2: First-time Onboarding Setup
  if (!profile.isSetupComplete) {
    return <SetupWizard />;
  }

  const financeTabs: { id: FinanceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} color={financeTab === 'dashboard' ? '#10b981' : '#64748b'} /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt size={20} color={financeTab === 'transactions' ? '#10b981' : '#64748b'} /> },
    { id: 'tasks', label: "Today's Tasks", icon: <CheckSquare size={20} color={financeTab === 'tasks' ? '#10b981' : '#64748b'} /> },
    { id: 'planner', label: 'Planner', icon: <Calendar size={20} color={financeTab === 'planner' ? '#10b981' : '#64748b'} /> },
    { id: 'goals', label: 'Goals', icon: <Target size={20} color={financeTab === 'goals' ? '#10b981' : '#64748b'} /> },
    { id: 'bills', label: 'Bills & EMI', icon: <CreditCard size={20} color={financeTab === 'bills' ? '#10b981' : '#64748b'} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} color={financeTab === 'reports' ? '#10b981' : '#64748b'} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} color={financeTab === 'profile' ? '#10b981' : '#64748b'} /> },
  ];

  const hrmsTabs: { id: HrmsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'hrms_dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} color={hrmsTab === 'hrms_dashboard' ? '#10b981' : '#64748b'} /> },
    { id: 'hrms_shift', label: "Today's Shift", icon: <Briefcase size={20} color={hrmsTab === 'hrms_shift' ? '#10b981' : '#64748b'} /> },
    { id: 'hrms_history', label: 'Attendance Logs', icon: <Clock size={20} color={hrmsTab === 'hrms_history' ? '#10b981' : '#64748b'} /> },
    { id: 'hrms_calendar', label: 'Calendar', icon: <Calendar size={20} color={hrmsTab === 'hrms_calendar' ? '#10b981' : '#64748b'} /> },
    { id: 'hrms_leave', label: 'Leave Manager', icon: <Palmtree size={20} color={hrmsTab === 'hrms_leave' ? '#10b981' : '#64748b'} /> },
    { id: 'hrms_reports', label: 'Reports', icon: <BarChart3 size={20} color={hrmsTab === 'hrms_reports' ? '#10b981' : '#64748b'} /> },
    { id: 'hrms_profile', label: 'Profile', icon: <User size={20} color={hrmsTab === 'hrms_profile' ? '#10b981' : '#64748b'} /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top App Mode Toggle Bar */}
      <View style={styles.modeToggleBar}>
        <TouchableOpacity
          style={[styles.modeTab, appMode === 'hrms' && styles.modeTabActive]}
          onPress={() => setAppMode('hrms')}
        >
          <Text style={[styles.modeTabText, appMode === 'hrms' && styles.modeTabTextActive]}>
            📋 HRMS Attendance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, appMode === 'finance' && styles.modeTabActive]}
          onPress={() => setAppMode('finance')}
        >
          <Text style={[styles.modeTabText, appMode === 'finance' && styles.modeTabTextActive]}>
            💰 Finance OS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content Render */}
      <View style={styles.content}>
        {appMode === 'finance' ? (
          <>
            {financeTab === 'dashboard' && <LiveDashboard />}
            {financeTab === 'transactions' && <TransactionsScreen />}
            {financeTab === 'tasks' && <TodayTasksScreen />}
            {financeTab === 'planner' && <MonthlyPlannerScreen />}
            {financeTab === 'goals' && <GoalsScreen />}
            {financeTab === 'bills' && <BillsEMIScreen />}
            {financeTab === 'reports' && <AnalyticsScreen />}
            {financeTab === 'profile' && <SettingsExportScreen />}
          </>
        ) : (
          <>
            {hrmsTab === 'hrms_dashboard' && <AttendanceDashboard />}
            {hrmsTab === 'hrms_shift' && <TodayShiftScreen />}
            {hrmsTab === 'hrms_history' && <AttendanceHistoryScreen />}
            {hrmsTab === 'hrms_calendar' && <AttendanceCalendarScreen />}
            {hrmsTab === 'hrms_leave' && <LeaveManagementScreen />}
            {hrmsTab === 'hrms_reports' && <AttendanceReportsScreen />}
            {hrmsTab === 'hrms_profile' && <EmployeeProfileScreen />}
          </>
        )}
      </View>

      {/* Primary OS Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavScroll}
        >
          {appMode === 'finance'
            ? financeTabs.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.navItem, financeTab === t.id && styles.navItemActive]}
                  onPress={() => setFinanceTab(t.id)}
                >
                  {t.icon}
                  <Text style={[styles.navText, financeTab === t.id && styles.navTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))
            : hrmsTabs.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.navItem, hrmsTab === t.id && styles.navItemActive]}
                  onPress={() => setHrmsTab(t.id)}
                >
                  {t.icon}
                  <Text style={[styles.navText, hrmsTab === t.id && styles.navTextActive]}>
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
  modeToggleBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#10b981',
  },
  modeTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
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

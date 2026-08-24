import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { LeaveManagementScreen } from '../components/LeaveManagementScreen';

import {
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Clock,
  Calendar as CalendarIcon,
  Bell,
  User,
  Palmtree,
  Menu,
  X,
  ChevronRight,
  Shield,
  Sparkles,
  Lock,
} from 'lucide-react-native';

type UnifiedTab =
  | 'dashboard'
  | 'tasks'
  | 'expenses'
  | 'attendance'
  | 'leaves'
  | 'calendar'
  | 'notifications'
  | 'profile';

export default function MainApp() {
  const { profile, isLocked, loadSupabaseData, updateProfile, lockApp } = useFinanceStore();
  const [currentTab, setCurrentTab] = useState<UnifiedTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  const appMode = profile.defaultAppMode || 'finance';

  // All available navigation items in the app
  const allNavigationItems: {
    id: UnifiedTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    mode?: 'finance' | 'hrms' | 'all';
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Overview & metrics',
      icon: <LayoutDashboard size={22} color="#10b981" />,
      mode: 'all',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      description: 'Money & budget tracking',
      icon: <DollarSign size={22} color="#3b82f6" />,
      mode: 'finance',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      description: 'Clock-in & work logs',
      icon: <Clock size={22} color="#8b5cf6" />,
      mode: 'hrms',
    },
    {
      id: 'leaves',
      label: 'Leave Management',
      description: 'Request & track leaves',
      icon: <Palmtree size={22} color="#f59e0b" />,
      mode: 'hrms',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      description: 'To-dos & priorities',
      icon: <CheckSquare size={22} color="#06b6d4" />,
      mode: 'all',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      description: 'Events & reminders',
      icon: <CalendarIcon size={22} color="#ec4899" />,
      mode: 'all',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Alerts & updates',
      icon: <Bell size={22} color="#eab308" />,
      mode: 'all',
    },
    {
      id: 'profile',
      label: 'Profile & Settings',
      description: 'Preferences & security',
      icon: <User size={22} color="#a855f7" />,
      mode: 'all',
    },
  ];

  // 4 Primary Bottom Navigation Bar Items depending on App Mode
  const bottomNavItems: {
    id: UnifiedTab | 'menu';
    label: string;
    icon: (isActive: boolean) => React.ReactNode;
  }[] = appMode === 'hrms'
    ? [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: (active) => <LayoutDashboard size={20} color={active ? '#10b981' : '#64748b'} />,
        },
        {
          id: 'attendance',
          label: 'Attendance',
          icon: (active) => <Clock size={20} color={active ? '#10b981' : '#64748b'} />,
        },
        {
          id: 'tasks',
          label: 'Tasks',
          icon: (active) => <CheckSquare size={20} color={active ? '#10b981' : '#64748b'} />,
        },
        {
          id: 'menu',
          label: 'Menu',
          icon: (active) => <Menu size={20} color={active ? '#10b981' : '#64748b'} />,
        },
      ]
    : [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: (active) => <LayoutDashboard size={20} color={active ? '#10b981' : '#64748b'} />,
        },
        {
          id: 'expenses',
          label: 'Expenses',
          icon: (active) => <DollarSign size={20} color={active ? '#10b981' : '#64748b'} />,
        },
        {
          id: 'calendar',
          label: 'Calendar',
          icon: (active) => <CalendarIcon size={20} color={active ? '#10b981' : '#64748b'} />,
        },
        {
          id: 'menu',
          label: 'Menu',
          icon: (active) => <Menu size={20} color={active ? '#10b981' : '#64748b'} />,
        },
      ];

  // Guard 1: Passcode Security Lock
  if (isLocked) {
    return <SecurityLockScreen />;
  }

  // Guard 2: First-time Onboarding Setup
  if (!profile.isSetupComplete) {
    return <SetupWizard />;
  }

  const isMenuTabActive = isSidebarOpen || !bottomNavItems.some(item => item.id === currentTab);

  const handleTabPress = (itemId: UnifiedTab | 'menu') => {
    if (itemId === 'menu') {
      setIsSidebarOpen(true);
    } else {
      setCurrentTab(itemId as UnifiedTab);
      setIsSidebarOpen(false);
    }
  };

  const toggleAppMode = () => {
    const nextMode = appMode === 'finance' ? 'hrms' : 'finance';
    updateProfile({ defaultAppMode: nextMode });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Screen Content Render */}
      <View style={styles.content}>
        {currentTab === 'dashboard' && <UnifiedDashboard />}
        {currentTab === 'tasks' && <EnhancedTasksScreen />}
        {currentTab === 'expenses' && <TransactionsScreen />}
        {currentTab === 'attendance' && <AttendanceDashboard />}
        {currentTab === 'leaves' && <LeaveManagementScreen />}
        {currentTab === 'calendar' && <CalendarScreen />}
        {currentTab === 'notifications' && <NotificationsScreen />}
        {currentTab === 'profile' && <SettingsExportScreen />}
      </View>

      {/* Primary OS 4-Item Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        {bottomNavItems.map((item) => {
          const isActive =
            item.id === 'menu' ? isMenuTabActive : currentTab === item.id && !isSidebarOpen;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => handleTabPress(item.id)}
              activeOpacity={0.7}
            >
              {item.icon(isActive)}
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sidebar Drawer Menu Modal */}
      <Modal
        visible={isSidebarOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSidebarOpen(false)}
      >
        <View style={styles.drawerOverlayContainer}>
          {/* Backdrop (Touch outside to close) */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Main Content */}
          <View style={styles.drawerPanel}>
            <SafeAreaView style={{ flex: 1 }}>
              {/* Drawer Header */}
              <View style={styles.drawerHeader}>
                <View style={styles.userInfoRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {profile.name || 'User'}
                    </Text>
                    <View style={styles.modeBadge}>
                      <Sparkles size={12} color="#10b981" />
                      <Text style={styles.modeBadgeText}>
                        {appMode === 'hrms' ? 'HRMS OS' : 'Finance OS'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setIsSidebarOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Mode Switch Card */}
              <View style={styles.modeSwitchCard}>
                <View style={styles.modeHeaderRow}>
                  <Text style={styles.modeSwitchLabel}>Current Active OS:</Text>
                  <View style={[styles.activeModePill, appMode === 'hrms' ? styles.activeModeHrms : styles.activeModeFinance]}>
                    <Sparkles size={12} color={appMode === 'hrms' ? '#8b5cf6' : '#10b981'} />
                    <Text style={[styles.activeModePillText, appMode === 'hrms' ? styles.activeModeHrmsText : styles.activeModeFinanceText]}>
                      {appMode === 'hrms' ? 'HRMS OS' : 'Finance OS'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modeToggleBtn}
                  onPress={() => {
                    toggleAppMode();
                    setCurrentTab('dashboard');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modeToggleText}>
                    Switch to {appMode === 'finance' ? 'HRMS OS' : 'Finance OS'}
                  </Text>
                  <ChevronRight size={16} color="#10b981" />
                </TouchableOpacity>
              </View>

              {/* Navigation Items List */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeader}>ALL MODULES & FEATURES</Text>

                {allNavigationItems.map((nav) => {
                  const isSelected = currentTab === nav.id;

                  return (
                    <TouchableOpacity
                      key={nav.id}
                      style={[styles.menuItem, isSelected && styles.menuItemActive]}
                      onPress={() => {
                        setCurrentTab(nav.id);
                        setIsSidebarOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuIconBox}>{nav.icon}</View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.menuTitle, isSelected && styles.menuTitleActive]}>
                          {nav.label}
                        </Text>
                        <Text style={styles.menuDesc}>{nav.description}</Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.activeDot} />
                      ) : (
                        <ChevronRight size={16} color="#475569" />
                      )}
                    </TouchableOpacity>
                  );
                })}

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Drawer Footer */}
              <View style={styles.drawerFooter}>
                <TouchableOpacity
                  style={styles.lockAppBtn}
                  onPress={() => {
                    setIsSidebarOpen(false);
                    lockApp();
                  }}
                  activeOpacity={0.8}
                >
                  <Lock size={16} color="#f43f5e" />
                  <Text style={styles.lockAppText}>Lock Security Passcode</Text>
                </TouchableOpacity>
                <Text style={styles.appVersionText}>TrackAll OS v1.0.0</Text>
              </View>
            </SafeAreaView>
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
  content: {
    flex: 1,
  },

  /* Bottom Navigation Styles */
  bottomNavContainer: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 12,
  },
  navText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  navTextActive: {
    color: '#10b981',
    fontWeight: '800',
  },

  /* Sidebar Drawer Modal Styles */
  drawerOverlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawerPanel: {
    width: '82%',
    maxWidth: 320,
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },

  /* Mode Switcher Card */
  modeSwitchCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginVertical: 14,
  },
  modeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modeSwitchLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  activeModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeModeFinance: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  activeModeHrms: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  activeModePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  activeModeFinanceText: {
    color: '#10b981',
  },
  activeModeHrmsText: {
    color: '#a855f7',
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },

  /* Menu Items */
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  menuTitleActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  menuDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },

  /* Footer */
  drawerFooter: {
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    gap: 10,
  },
  lockAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  lockAppText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f43f5e',
  },
  appVersionText: {
    fontSize: 10,
    color: '#475569',
  },
});


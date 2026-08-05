import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { SecurityLockScreen } from '../components/SecurityLockScreen';
import { SetupWizard } from '../components/SetupWizard';
import { LiveDashboard } from '../components/LiveDashboard';
import { AnalyticsScreen } from '../components/AnalyticsScreen';
import { AIInsightsScreen } from '../components/AIInsightsScreen';
import { GoalsScreen } from '../components/GoalsScreen';
import { RecurringScreen } from '../components/RecurringScreen';
import { SplitScreen } from '../components/SplitScreen';
import { SettingsExportScreen } from '../components/SettingsExportScreen';

import { LayoutDashboard, PieChart, Bot, Target, Settings, RefreshCw, Users } from 'lucide-react-native';

export default function MainApp() {
  const { profile, isLocked } = useFinanceStore();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'analytics' | 'ai' | 'goals' | 'recurring' | 'split' | 'settings'>('dashboard');

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
        {currentTab === 'dashboard' && <LiveDashboard />}
        {currentTab === 'analytics' && <AnalyticsScreen />}
        {currentTab === 'ai' && <AIInsightsScreen />}
        {currentTab === 'goals' && <GoalsScreen />}
        {currentTab === 'recurring' && <RecurringScreen />}
        {currentTab === 'split' && <SplitScreen />}
        {currentTab === 'settings' && <SettingsExportScreen />}
      </View>

      {/* Sub-navigation bar for Goals / Recurring / Split */}
      {(currentTab === 'goals' || currentTab === 'recurring' || currentTab === 'split') && (
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTabBtn, currentTab === 'goals' && styles.subTabBtnActive]}
            onPress={() => setCurrentTab('goals')}
          >
            <Target size={14} color={currentTab === 'goals' ? '#10b981' : '#94a3b8'} />
            <Text style={[styles.subTabText, currentTab === 'goals' && styles.subTabTextActive]}>
              Goals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabBtn, currentTab === 'recurring' && styles.subTabBtnActive]}
            onPress={() => setCurrentTab('recurring')}
          >
            <RefreshCw size={14} color={currentTab === 'recurring' ? '#10b981' : '#94a3b8'} />
            <Text style={[styles.subTabText, currentTab === 'recurring' && styles.subTabTextActive]}>
              Recurring Bills
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabBtn, currentTab === 'split' && styles.subTabBtnActive]}
            onPress={() => setCurrentTab('split')}
          >
            <Users size={14} color={currentTab === 'split' ? '#10b981' : '#94a3b8'} />
            <Text style={[styles.subTabText, currentTab === 'split' && styles.subTabTextActive]}>
              Split Bills
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Primary Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('dashboard')}
        >
          <LayoutDashboard
            size={22}
            color={currentTab === 'dashboard' ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.navText,
              currentTab === 'dashboard' && styles.navTextActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('analytics')}
        >
          <PieChart
            size={22}
            color={currentTab === 'analytics' ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.navText,
              currentTab === 'analytics' && styles.navTextActive,
            ]}
          >
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('ai')}
        >
          <Bot
            size={22}
            color={currentTab === 'ai' ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.navText,
              currentTab === 'ai' && styles.navTextActive,
            ]}
          >
            AI Engine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('goals')}
        >
          <Target
            size={22}
            color={
              currentTab === 'goals' || currentTab === 'recurring' || currentTab === 'split'
                ? '#10b981'
                : '#64748b'
            }
          />
          <Text
            style={[
              styles.navText,
              (currentTab === 'goals' || currentTab === 'recurring' || currentTab === 'split') &&
                styles.navTextActive,
            ]}
          >
            Goals & Bills
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('settings')}
        >
          <Settings
            size={22}
            color={currentTab === 'settings' ? '#10b981' : '#64748b'}
          />
          <Text
            style={[
              styles.navText,
              currentTab === 'settings' && styles.navTextActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
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
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  subTabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  subTabText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
});

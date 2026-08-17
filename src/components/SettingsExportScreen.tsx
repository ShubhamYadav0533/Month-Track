import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFinanceStore } from '../store/useFinanceStore';
import { exportExpensesToCSV, generateBackupJSON } from '../utils/exportUtils';
import { Download, Shield, Trash2, FileSpreadsheet, Lock, User, Save } from 'lucide-react-native';

export function SettingsExportScreen() {
  const { profile, accounts, transactions, updateProfile, resetAllData, lockApp } = useFinanceStore();

  const [name, setName] = useState(profile.name);
  const [monthlyIncome, setMonthlyIncome] = useState(profile.monthlyIncome.toString());
  const [salaryDate, setSalaryDate] = useState(profile.salaryDate.toString());
  const [currency, setCurrency] = useState(profile.currency);
  const [pinInput, setPinInput] = useState(profile.pinCode || '');
  const [darkMode, setDarkMode] = useState(profile.isDarkMode ?? true);
  const [bioEnabled, setBioEnabled] = useState(profile.isBiometricsEnabled || false);

  const handleToggleDarkMode = (val: boolean) => {
    setDarkMode(val);
    updateProfile({ isDarkMode: val });
  };

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const res = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Confirm Fingerprint / Biometrics to enable unlock',
          });

          if (res.success) {
            setBioEnabled(true);
            updateProfile({ isBiometricsEnabled: true });
          } else {
            Alert.alert('Authentication Failed', 'Fingerprint verification failed.');
          }
        } else {
          setBioEnabled(true);
          updateProfile({ isBiometricsEnabled: true });
        }
      } catch {
        setBioEnabled(true);
        updateProfile({ isBiometricsEnabled: true });
      }
    } else {
      setBioEnabled(false);
      updateProfile({ isBiometricsEnabled: false });
    }
  };

  const handleSaveProfile = () => {
    const inc = parseFloat(monthlyIncome);
    const salDay = parseInt(salaryDate, 10);

    updateProfile({
      name,
      monthlyIncome: isNaN(inc) ? profile.monthlyIncome : inc,
      salaryDate: isNaN(salDay) ? profile.salaryDate : salDay,
      currency,
      pinCode: pinInput || undefined,
      isBiometricsEnabled: bioEnabled,
      isDarkMode: darkMode,
    });
    Alert.alert('Profile Saved', 'Your preferences and security settings have been saved successfully.');
  };

  const handleExportCSV = async () => {
    await exportExpensesToCSV(transactions);
  };

  const handleExportJSON = async () => {
    await generateBackupJSON(profile, accounts, transactions);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>Customize your Personal Finance OS preferences, export & security</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={18} color="#10b981" />
            <Text style={styles.cardTitle}>Personal Profile</Text>
          </View>

          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Shubham"
            placeholderTextColor="#64748b"
          />

          <View style={styles.row}>
            <View style={[styles.col, { flex: 1 }]}>
              <Text style={styles.label}>Monthly Income (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                placeholder="65000"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={[styles.col, { flex: 1 }]}>
              <Text style={styles.label}>Salary Day (1-31)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={salaryDate}
                onChangeText={setSalaryDate}
                placeholder="1"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <Text style={styles.label}>Currency Symbol</Text>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            placeholder="₹"
            placeholderTextColor="#64748b"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
            <Save size={16} color="#ffffff" />
            <Text style={styles.saveBtnText}>Save Profile Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Security & App Options */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Shield size={18} color="#3b82f6" />
            <Text style={styles.cardTitle}>App Preferences & Security</Text>
          </View>

          <Text style={styles.label}>Default Landing View</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 12,
                backgroundColor: (profile.defaultAppMode || 'finance') === 'finance' ? '#10b981' : '#0f172a',
                borderWidth: 1,
                borderColor: '#334155',
                alignItems: 'center',
              }}
              onPress={() => updateProfile({ defaultAppMode: 'finance' })}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: (profile.defaultAppMode || 'finance') === 'finance' ? '#ffffff' : '#94a3b8' }}>
                💰 Finance OS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 12,
                backgroundColor: profile.defaultAppMode === 'hrms' ? '#10b981' : '#0f172a',
                borderWidth: 1,
                borderColor: '#334155',
                alignItems: 'center',
              }}
              onPress={() => updateProfile({ defaultAppMode: 'hrms' })}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: profile.defaultAppMode === 'hrms' ? '#ffffff' : '#94a3b8' }}>
                📋 HRMS System
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Dark Mode (Default)</Text>
            <Switch value={darkMode} onValueChange={handleToggleDarkMode} trackColor={{ false: '#334155', true: '#10b981' }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Biometric / Fingerprint Unlock</Text>
            <Switch value={bioEnabled} onValueChange={handleToggleBiometrics} trackColor={{ false: '#334155', true: '#10b981' }} />
          </View>

          <Text style={styles.label}>Security Passcode PIN (4 digits)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            value={pinInput}
            onChangeText={setPinInput}
            placeholder="Set 4-digit PIN"
            placeholderTextColor="#64748b"
          />

          {profile.pinCode && (
            <TouchableOpacity style={styles.lockBtn} onPress={lockApp}>
              <Lock size={16} color="#3b82f6" />
              <Text style={styles.lockBtnText}>Lock App Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Export & Data Backup */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Download size={18} color="#f59e0b" />
            <Text style={styles.cardTitle}>Data Export & Backup</Text>
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
            <FileSpreadsheet size={18} color="#10b981" />
            <Text style={styles.exportBtnText}>Export Transactions to CSV / Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.exportBtn, { marginTop: 10 }]} onPress={handleExportJSON}>
            <Download size={18} color="#3b82f6" />
            <Text style={[styles.exportBtnText, { color: '#3b82f6' }]}>Backup Data to JSON File</Text>
          </TouchableOpacity>
        </View>

        {/* Reset All Data */}
        <TouchableOpacity style={styles.resetBtn} onPress={resetAllData}>
          <Trash2 size={16} color="#ef4444" />
          <Text style={styles.resetBtnText}>Reset All Data to Default</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  lockBtnText: {
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: 13,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exportBtnText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resetBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
});

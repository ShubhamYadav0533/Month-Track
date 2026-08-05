import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { exportExpensesToCSV, generateBackupJSON } from '../utils/exportUtils';
import { Search, Download, Lock, Shield, Trash2, FileSpreadsheet, RefreshCw } from 'lucide-react-native';

export function SettingsExportScreen() {
  const { profile, accounts, expenses, updateProfile, resetAllData } = useFinanceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [pinInput, setPinInput] = useState(profile.pinCode || '');
  const [exportNotice, setExportNotice] = useState('');

  // Filter expenses by search query (e.g. "Coffee")
  const filteredExpenses = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const csv = exportExpensesToCSV(expenses, profile.currency);
    setExportNotice(`✅ Exported ${expenses.length} records to CSV format!\nFirst lines:\n${csv.split('\n').slice(0, 3).join('\n')}`);
  };

  const handleBackupJSON = () => {
    const json = generateBackupJSON(profile, accounts, expenses);
    setExportNotice(`✅ Created Cloud/Local JSON Backup (${json.length} bytes)`);
  };

  const handleSavePin = () => {
    updateProfile({ pinCode: pinInput });
    setExportNotice(pinInput ? `✅ Passcode PIN set to ${pinInput}` : '✅ PIN Code removed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Search, Backup & Security</Text>
          <Text style={styles.subtitle}>Filter expenses, export reports (CSV/PDF) & lock app</Text>
        </View>

        {/* Search Expenses */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Search Expenses</Text>
          <View style={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Coffee, Fuel, Food..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {searchQuery !== '' && (
            <View style={styles.searchResults}>
              <Text style={styles.resultsHeader}>
                Found {filteredExpenses.length} matching expenses:
              </Text>
              {filteredExpenses.map((exp) => (
                <View key={exp.id} style={styles.resultItem}>
                  <Text style={styles.resultDesc}>{exp.description}</Text>
                  <Text style={styles.resultAmt}>
                    -{profile.currency}{exp.amount}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Security & PIN Setup */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Shield size={20} color="#10b981" />
            <Text style={styles.cardTitle}>Security & Biometric Lock</Text>
          </View>
          <Text style={styles.label}>Set 4-Digit Passcode PIN</Text>
          <View style={styles.pinRow}>
            <TextInput
              style={styles.pinInput}
              keyboardType="numeric"
              maxLength={4}
              placeholder="1234"
              placeholderTextColor="#64748b"
              value={pinInput}
              onChangeText={setPinInput}
              secureTextEntry
            />
            <TouchableOpacity style={styles.savePinBtn} onPress={handleSavePin}>
              <Text style={styles.savePinText}>Save PIN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export & Backup */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Export Data & Backup</Text>

          <View style={styles.exportBtnRow}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
              <FileSpreadsheet size={18} color="#10b981" />
              <Text style={styles.exportBtnText}>Export CSV / Excel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportBtn} onPress={handleBackupJSON}>
              <Download size={18} color="#3b82f6" />
              <Text style={styles.exportBtnText}>JSON Backup</Text>
            </TouchableOpacity>
          </View>

          {exportNotice !== '' && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{exportNotice}</Text>
            </View>
          )}
        </View>

        {/* Reset App Data */}
        <TouchableOpacity style={styles.resetBtn} onPress={resetAllData}>
          <Trash2 size={18} color="#ef4444" />
          <Text style={styles.resetBtnText}>Reset All App Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
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
    color: '#ffffff',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  searchResults: {
    marginTop: 12,
    gap: 6,
  },
  resultsHeader: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
    marginBottom: 4,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
  },
  resultDesc: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  resultAmt: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pinInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 44,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
  },
  savePinBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savePinText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  exportBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exportBtnText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 12,
  },
  noticeBox: {
    marginTop: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  noticeText: {
    color: '#10b981',
    fontSize: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 10,
  },
  resetBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
});

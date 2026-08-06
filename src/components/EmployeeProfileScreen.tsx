import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Shield, Save } from 'lucide-react-native';
import { useAttendanceStore } from '../store/useAttendanceStore';

export function EmployeeProfileScreen() {
  const { employee, updateEmployeeProfile } = useAttendanceStore();

  const [fullName, setFullName] = useState(employee.fullName);
  const [email, setEmail] = useState(employee.email);
  const [department, setDepartment] = useState(employee.department);
  const [designation, setDesignation] = useState(employee.designation);
  const [managerName, setManagerName] = useState(employee.managerName);
  const [officeLocation, setOfficeLocation] = useState(employee.officeLocation);

  const [isBiometrics, setIsBiometrics] = useState(employee.isBiometricsEnabled || false);

  const handleSave = () => {
    updateEmployeeProfile({
      fullName,
      email,
      department,
      designation,
      managerName,
      officeLocation,
      isBiometricsEnabled: isBiometrics,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>👤 Employee Profile</Text>

        {/* Profile Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{fullName ? fullName[0].toUpperCase() : 'E'}</Text>
          </View>
          <Text style={styles.empName}>{fullName || 'Employee Name'}</Text>
          <Text style={styles.empCode}>{employee.employeeCode || 'EMP001'}</Text>
          <Text style={styles.empSub}>{designation || 'Software Engineer'} · {department || 'Engineering'}</Text>
        </View>

        {/* Details Form */}
        <Text style={styles.sectionTitle}>📋 Personal & Work Details</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@company.com"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Department</Text>
          <TextInput
            style={styles.input}
            value={department}
            onChangeText={setDepartment}
            placeholder="Engineering, Sales, HR..."
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Designation</Text>
          <TextInput
            style={styles.input}
            value={designation}
            onChangeText={setDesignation}
            placeholder="Software Developer..."
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Reporting Manager</Text>
          <TextInput
            style={styles.input}
            value={managerName}
            onChangeText={setManagerName}
            placeholder="Manager Name"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Office Location</Text>
          <TextInput
            style={styles.input}
            value={officeLocation}
            onChangeText={setOfficeLocation}
            placeholder="Head Office, Remote..."
            placeholderTextColor="#64748b"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Save size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Security Settings */}
        <Text style={styles.sectionTitle}>🔒 Security & Biometrics</Text>
        <View style={styles.securityCard}>
          <View style={styles.secRow}>
            <Shield size={20} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.secTitle}>Biometric Check-in</Text>
              <Text style={styles.secSub}>Require Fingerprint / Face ID for check-in</Text>
            </View>
            <Switch
              value={isBiometrics}
              onValueChange={setIsBiometrics}
              trackColor={{ false: '#334155', true: '#10b981' }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 24, color: '#f8fafc', fontWeight: '800', marginBottom: 16 },

  avatarCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '900' },
  empName: { fontSize: 20, color: '#f8fafc', fontWeight: '800' },
  empCode: { fontSize: 13, color: '#10b981', fontWeight: '700', marginTop: 2 },
  empSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  sectionTitle: { fontSize: 16, color: '#f8fafc', fontWeight: '800', marginBottom: 12 },
  formCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155', gap: 10, marginBottom: 20 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  saveBtn: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  securityCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155' },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  secTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  secSub: { color: '#94a3b8', fontSize: 12 },
});

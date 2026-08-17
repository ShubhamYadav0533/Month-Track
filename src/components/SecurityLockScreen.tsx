import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFinanceStore } from '../store/useFinanceStore';
import { Fingerprint, Lock, Delete } from 'lucide-react-native';

export function SecurityLockScreen() {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { profile, unlockApp } = useFinanceStore();

  const handleBiometricAuth = async () => {
    try {
      if (Platform.OS === 'web') {
        // Fallback for Web browser testing
        useFinanceStore.setState({ isLocked: false });
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Personal OS with Fingerprint / Face ID',
          fallbackLabel: 'Use 4-Digit PIN',
          cancelLabel: 'Cancel',
        });

        if (result.success) {
          useFinanceStore.setState({ isLocked: false });
        } else {
          setErrorMsg('Fingerprint authentication cancelled or failed.');
        }
      } else {
        // Fallback if device has no biometric hardware enrolled
        useFinanceStore.setState({ isLocked: false });
      }
    } catch (err) {
      console.warn('Biometric unlock error:', err);
      useFinanceStore.setState({ isLocked: false });
    }
  };

  useEffect(() => {
    if (profile.isBiometricsEnabled) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [profile.isBiometricsEnabled]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');

      if (newPin.length === 4) {
        const success = unlockApp(newPin);
        if (!success) {
          setErrorMsg('Incorrect 4-Digit PIN. Please try again.');
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Lock size={36} color="#10b981" />
        </View>

        <Text style={styles.title}>Personal OS Locked</Text>
        <Text style={styles.subtitle}>Enter your 4-digit security PIN or scan fingerprint</Text>

        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((idx) => (
            <View
              key={idx}
              style={[styles.dot, pin.length > idx && styles.dotFilled]}
            />
          ))}
        </View>

        {errorMsg !== '' && <Text style={styles.errorText}>{errorMsg}</Text>}

        <View style={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.keyButton}
              onPress={() => handleKeyPress(num)}
            >
              <Text style={styles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.keyButton} onPress={handleBiometricAuth}>
            <Fingerprint size={26} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyButton} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyButton} onPress={handleDelete}>
            <Delete size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 16,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    width: 260,
  },
  keyButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  keyText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
});

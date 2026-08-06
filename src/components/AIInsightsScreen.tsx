import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { generateAISuggestions } from '../utils/aiEngine';
import { calculateDailyBudgetStats } from '../utils/budgetCalculator';
import { Bot, Mic, Sparkles, AlertTriangle, Lightbulb, PartyPopper, ArrowRight } from 'lucide-react-native';

export function AIInsightsScreen() {
  const { profile, accounts, expenses, budgets, addExpense } = useFinanceStore();
  const [voiceQuery, setVoiceQuery] = useState('Spent ₹250 on lunch using UPI');
  const [parsedMsg, setParsedMsg] = useState('');

  const stats = calculateDailyBudgetStats(profile, accounts, expenses);
  const suggestions = generateAISuggestions(
    expenses,
    budgets,
    profile,
    stats.remainingDays,
    stats.predictedDaysUntilDepletion
  );

  const handleProcessVoiceInput = () => {
    // Parse phrase like "Spent ₹250 on lunch using UPI"
    const matchAmount = voiceQuery.match(/(\d+)/);
    const amount = matchAmount ? parseFloat(matchAmount[0]) : 250;

    let category = 'Food';
    if (voiceQuery.toLowerCase().includes('fuel') || voiceQuery.toLowerCase().includes('petrol')) category = 'Fuel';
    if (voiceQuery.toLowerCase().includes('shopping') || voiceQuery.toLowerCase().includes('clothes')) category = 'Shopping';
    if (voiceQuery.toLowerCase().includes('bill') || voiceQuery.toLowerCase().includes('wifi')) category = 'Bills';

    addExpense({
      title: `Voice Entry: ${voiceQuery}`,
      type: 'Expense',
      transactionDate: new Date().toISOString().split('T')[0],
      accountId: accounts.find(a => a.type === 'upi')?.id || accounts[0].id,
      amount,
      category: category as any,
      description: `Voice Entry: ${voiceQuery}`,
      paymentMethod: 'UPI',
      expenseDate: new Date().toISOString().split('T')[0],
    });

    setParsedMsg(`✅ Successfully processed: Deducted ${profile.currency}${amount} for ${category}!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Bot size={16} color="#10b981" />
            <Text style={styles.badgeText}>Smart AI Assistant</Text>
          </View>
          <Text style={styles.title}>AI Warnings & Suggestions</Text>
          <Text style={styles.subtitle}>Personalized financial intelligence & spending speed alerts</Text>
        </View>

        {/* Phase 3: Voice Expense Entry */}
        <View style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <Mic size={20} color="#10b981" />
            <Text style={styles.voiceTitle}>Voice & Natural Language Expense Entry</Text>
          </View>
          <Text style={styles.voiceSubtitle}>
            Type or speak expense phrases like &quot;Spent ₹250 on lunch&quot; or &quot;Spent ₹800 petrol&quot;:
          </Text>
          <View style={styles.voiceInputRow}>
            <TextInput
              style={styles.voiceInput}
              value={voiceQuery}
              onChangeText={setVoiceQuery}
              placeholder="Spent ₹250 on lunch..."
              placeholderTextColor="#64748b"
            />
            <TouchableOpacity style={styles.voiceProcessBtn} onPress={handleProcessVoiceInput}>
              <ArrowRight size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          {parsedMsg !== '' && <Text style={styles.parsedText}>{parsedMsg}</Text>}
        </View>

        {/* AI Warnings & Recommendations Feed */}
        <Text style={styles.sectionHeader}>Smart Notifications & Feed</Text>
        {suggestions.map((item) => (
          <View
            key={item.id}
            style={[
              styles.suggestionCard,
              item.type === 'warning' && styles.warningBorder,
              item.type === 'praise' && styles.praiseBorder,
            ]}
          >
            <View style={styles.cardTop}>
              {item.type === 'warning' && <AlertTriangle size={20} color="#ef4444" />}
              {item.type === 'praise' && <PartyPopper size={20} color="#10b981" />}
              {item.type === 'tip' && <Lightbulb size={20} color="#f59e0b" />}
              {item.type === 'prediction' && <Sparkles size={20} color="#8b5cf6" />}
              <Text style={styles.itemTitle}>{item.title}</Text>
            </View>
            <Text style={styles.itemMessage}>{item.message}</Text>
          </View>
        ))}
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 12,
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
  voiceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  voiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  voiceSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  voiceInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 44,
    color: '#ffffff',
    fontSize: 14,
  },
  voiceProcessBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parsedText: {
    marginTop: 10,
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 14,
  },
  suggestionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  warningBorder: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  praiseBorder: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  itemMessage: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
} from 'react-native';
import {
  Bell,
  Check,
  Volume2,
  Vibrate,
  Moon,
  X,
} from 'lucide-react-native';
import { useProductivityStore } from '../store/useProductivityStore';
import { scheduleLocalNotification } from '../services/notificationService';

export function NotificationsScreen() {
  const {
    notifications,
    config,
    addNotificationRecord,
    markNotificationRead,
    dismissNotification,
    clearAllNotifications,
    updateConfig,
  } = useProductivityStore();

  const [activeTab, setActiveTab] = useState<'Inbox' | 'Settings'>('Inbox');
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');

  const handleSendTestNotification = async () => {
    const title = 'Test Notification 🔔';
    const body = 'Your Personal OS notification system is working perfectly!';
    addNotificationRecord({
      title,
      body,
      status: 'unread',
    });
    await scheduleLocalNotification(title, body, new Date(Date.now() + 1000));
  };

  const filteredNotifs = notifications.filter((n) => {
    if (n.status === 'dismissed') return false;
    if (filter === 'Unread') return n.status === 'unread';
    return true;
  });

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔔 Notification Center</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </Text>
        </View>
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'Inbox' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('Inbox')}
          >
            <Text style={[styles.toggleText, activeTab === 'Inbox' && styles.toggleTextActive]}>
              Inbox
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'Settings' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('Settings')}
          >
            <Text style={[styles.toggleText, activeTab === 'Settings' && styles.toggleTextActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'Inbox' ? (
        <>
          {/* Action Row */}
          <View style={styles.actionRow}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.filterChip, filter === 'All' && styles.filterChipActive]}
                onPress={() => setFilter('All')}
              >
                <Text style={[styles.filterText, filter === 'All' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, filter === 'Unread' && styles.filterChipActive]}
                onPress={() => setFilter('Unread')}
              >
                <Text style={[styles.filterText, filter === 'Unread' && styles.filterTextActive]}>Unread</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity style={styles.testBtn} onPress={handleSendTestNotification}>
                <Bell size={13} color="#10b981" />
                <Text style={styles.testBtnText}>Test Alert</Text>
              </TouchableOpacity>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={clearAllNotifications}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredNotifs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Bell size={40} color="#334155" />
                <Text style={styles.emptyText}>No notifications found</Text>
              </View>
            ) : (
              filteredNotifs.map((notif) => (
                <View
                  key={notif.id}
                  style={[
                    styles.notifCard,
                    notif.status === 'unread' && styles.notifCardUnread,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifTime}>
                      {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  <Text style={styles.notifBody}>{notif.body}</Text>

                  {/* WhatsApp-style Action Buttons */}
                  <View style={styles.actionsContainer}>
                    {notif.status === 'unread' && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => markNotificationRead(notif.id)}
                      >
                        <Check size={14} color="#10b981" />
                        <Text style={[styles.actionBtnText, { color: '#10b981' }]}>Mark Read</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => dismissNotification(notif.id)}
                    >
                      <X size={14} color="#ef4444" />
                      <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </>
      ) : (
        /* Settings Tab */
        <ScrollView contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>⚙️ Notification Preferences</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Volume2 size={20} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <Text style={styles.settingSub}>Play sound on notification trigger</Text>
              </View>
              <Switch
                value={config.soundEnabled}
                onValueChange={(val) => updateConfig({ soundEnabled: val })}
                trackColor={{ false: '#334155', true: '#10b981' }}
              />
            </View>

            <View style={styles.settingRow}>
              <Vibrate size={20} color="#3b82f6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <Text style={styles.settingSub}>Vibrate device on alert</Text>
              </View>
              <Switch
                value={config.vibrationEnabled}
                onValueChange={(val) => updateConfig({ vibrationEnabled: val })}
                trackColor={{ false: '#334155', true: '#10b981' }}
              />
            </View>

            <View style={styles.settingRow}>
              <Moon size={20} color="#8b5cf6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Quiet Hours (Do Not Disturb)</Text>
                <Text style={styles.settingSub}>Silence notifications from 10 PM to 7 AM</Text>
              </View>
              <Switch
                value={config.quietHoursEnabled}
                onValueChange={(val) => updateConfig({ quietHoursEnabled: val })}
                trackColor={{ false: '#334155', true: '#10b981' }}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 22, color: '#f8fafc', fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  tabToggle: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 4, borderRadius: 12, marginTop: 14 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#10b981' },
  toggleText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#fff', fontWeight: '800' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 10 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#10b981' },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: '800' },
  clearText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b98120',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  testBtnText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },

  listContent: { padding: 20, gap: 12, paddingBottom: 40 },
  emptyCard: { backgroundColor: '#1e293b', padding: 40, borderRadius: 16, alignItems: 'center', gap: 10 },
  emptyText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

  notifCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', gap: 8 },
  notifCardUnread: { borderColor: '#10b981', backgroundColor: '#1e293b' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800' },
  notifTime: { color: '#94a3b8', fontSize: 11 },
  notifBody: { color: '#cbd5e1', fontSize: 13 },

  actionsContainer: { flexDirection: 'row', gap: 12, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  settingsContent: { padding: 20, gap: 14 },
  sectionTitle: { fontSize: 16, color: '#f8fafc', fontWeight: '800' },
  settingCard: { backgroundColor: '#1e293b', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#334155', gap: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  settingSub: { color: '#94a3b8', fontSize: 12 },
});

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EnhancedTask,
  ReminderItem,
  HabitItem,
  CalendarEventItem,
  DailyPlannerSlot,
  NotificationRecord,
  NotificationConfig,
} from '../types/productivity';
import {
  scheduleLocalNotification,
  cancelScheduledNotification,
} from '../services/notificationService';
import { generateId } from '../utils/generateId';
import { useFinanceStore } from './useFinanceStore';
import {
  saveHabitToSupabase,
  deleteHabitFromSupabase,
  saveCalendarEventToSupabase,
  deleteCalendarEventFromSupabase,
  saveReminderToSupabase,
  deleteReminderFromSupabase,
  saveNotificationToSupabase,
  savePlannerSlotToSupabase,
  deletePlannerSlotFromSupabase,
} from '../services/supabaseService';

interface ProductivityState {
  enhancedTasks: EnhancedTask[];
  reminders: ReminderItem[];
  habits: HabitItem[];
  calendarEvents: CalendarEventItem[];
  dailyPlanner: DailyPlannerSlot[];
  notifications: NotificationRecord[];
  config: NotificationConfig;

  // Task Actions
  addEnhancedTask: (task: Omit<EnhancedTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEnhancedTask: (id: string, updates: Partial<EnhancedTask>) => void;
  deleteEnhancedTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;

  // Reminder Actions
  addReminder: (reminder: Omit<ReminderItem, 'id'>) => Promise<void>;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;

  // Habit Actions
  addHabit: (habit: Omit<HabitItem, 'id' | 'currentStreak' | 'bestStreak' | 'completedDays' | 'createdAt'>) => void;
  toggleHabitForDate: (habitId: string, dateStr: string) => void;
  deleteHabit: (habitId: string) => void;

  // Calendar Event Actions
  addCalendarEvent: (event: Omit<CalendarEventItem, 'id' | 'createdAt'>) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEventItem>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Daily Planner Actions
  addPlannerSlot: (slot: Omit<DailyPlannerSlot, 'id'>) => void;
  togglePlannerSlotComplete: (id: string) => void;
  deletePlannerSlot: (id: string) => void;

  // Notification Actions
  addNotificationRecord: (notif: Omit<NotificationRecord, 'id' | 'sentAt'>) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateConfig: (updates: Partial<NotificationConfig>) => void;
}

const INITIAL_CONFIG: NotificationConfig = {
  soundEnabled: true,
  vibrationEnabled: true,
  snoozeDurationMinutes: 10,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

const INITIAL_HABITS: HabitItem[] = [
  {
    id: '00000000-0000-4000-b000-000000000001',
    title: 'Drink 3L Water',
    icon: 'droplet',
    color: '#06b6d4',
    goalType: 'Daily',
    targetValue: 1,
    currentStreak: 4,
    bestStreak: 12,
    completedDays: [
      new Date().toISOString().slice(0, 10),
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-4000-b000-000000000002',
    title: 'Morning Walk / Exercise',
    icon: 'activity',
    color: '#10b981',
    goalType: 'Daily',
    targetValue: 1,
    currentStreak: 2,
    bestStreak: 7,
    completedDays: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-4000-b000-000000000003',
    title: 'Read Book 20 mins',
    icon: 'book',
    color: '#8b5cf6',
    goalType: 'Daily',
    targetValue: 1,
    currentStreak: 5,
    bestStreak: 15,
    completedDays: [],
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_PLANNER: DailyPlannerSlot[] = [
  { id: '00000000-0000-4000-c000-000000000001', plannerDate: new Date().toISOString().slice(0, 10), timeSlot: '06:00 AM', activity: 'Morning Walk & Refreshments', completed: true },
  { id: '00000000-0000-4000-c000-000000000002', plannerDate: new Date().toISOString().slice(0, 10), timeSlot: '08:00 AM', activity: 'Healthy Breakfast & News', completed: true },
  { id: '00000000-0000-4000-c000-000000000003', plannerDate: new Date().toISOString().slice(0, 10), timeSlot: '09:00 AM', activity: 'Office Work / Deep Coding Session', completed: false },
  { id: '00000000-0000-4000-c000-000000000004', plannerDate: new Date().toISOString().slice(0, 10), timeSlot: '01:00 PM', activity: 'Lunch Break', completed: false },
  { id: '00000000-0000-4000-c000-000000000005', plannerDate: new Date().toISOString().slice(0, 10), timeSlot: '06:00 PM', activity: 'Evening Gym / Fitness Session', completed: false },
  { id: '00000000-0000-4000-c000-000000000006', plannerDate: new Date().toISOString().slice(0, 10), timeSlot: '09:00 PM', activity: 'Dinner & Relaxation', completed: false },
  { id: '00000000-0000-4000-c000-000000000007', plannerDate: new Date().toISOString().slice(0, 10), timeSlot: '11:00 PM', activity: 'Sleep', completed: false },
];

export const useProductivityStore = create<ProductivityState>()(
  persist(
    (set, get) => ({
      enhancedTasks: [],
      reminders: [],
      habits: INITIAL_HABITS,
      calendarEvents: [],
      dailyPlanner: INITIAL_PLANNER,
      notifications: [
        {
          id: '00000000-0000-4000-d000-000000000001',
          title: '💰 Expense Reminder',
          body: 'Pay Internet Bill ₹899 due today',
          status: 'unread',
          sentAt: new Date().toISOString(),
          actionType: 'Mark Paid',
        },
      ],
      config: INITIAL_CONFIG,

      // Task Actions
      addEnhancedTask: async (taskData) => {
        const id = generateId();
        const now = new Date().toISOString();

        let notifId: string | undefined;
        if (taskData.reminderTime) {
          const triggerDate = new Date(taskData.reminderTime);
          notifId = await scheduleLocalNotification(
            `🔔 Task Reminder: ${taskData.title}`,
            taskData.description || `Due at ${taskData.dueTime || taskData.dueDate}`,
            triggerDate,
            { taskId: id }
          );
        }

        const newTask: EnhancedTask = {
          ...taskData,
          id,
          completed: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          enhancedTasks: [newTask, ...state.enhancedTasks],
        }));

        if (notifId && taskData.reminderTime) {
          get().addReminder({
            taskId: id,
            title: taskData.title,
            triggerTime: taskData.reminderTime,
            repeatType: taskData.repeatType,
            repeatInterval: taskData.repeatInterval,
            enabled: true,
            notificationId: notifId,
          });
        }
      },

      updateEnhancedTask: (id, updates) => {
        set((state) => ({
          enhancedTasks: state.enhancedTasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteEnhancedTask: (id) => {
        set((state) => ({
          enhancedTasks: state.enhancedTasks.filter((t) => t.id !== id),
          reminders: state.reminders.filter((r) => r.taskId !== id),
        }));
      },

      toggleTaskComplete: (id) => {
        set((state) => ({
          enhancedTasks: state.enhancedTasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  status: !t.completed ? 'Completed' : 'Pending',
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      toggleChecklistItem: (taskId, itemId) => {
        set((state) => ({
          enhancedTasks: state.enhancedTasks.map((t) => {
            if (t.id !== taskId || !t.checklist) return t;
            return {
              ...t,
              checklist: t.checklist.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            };
          }),
        }));
      },

      // Reminder Actions
      addReminder: async (reminderData) => {
        const id = generateId();
        const newReminder = { ...reminderData, id };
        const userId = useFinanceStore.getState().profile.id;
        saveReminderToSupabase(userId, newReminder);
        set((state) => ({
          reminders: [newReminder, ...state.reminders],
        }));
      },

      deleteReminder: async (id) => {
        const rem = get().reminders.find((r) => r.id === id);
        if (rem?.notificationId) {
          await cancelScheduledNotification(rem.notificationId);
        }
        deleteReminderFromSupabase(id);
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }));
      },

      toggleReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      // Habit Actions
      addHabit: (habitData) => {
        const id = generateId();
        const newHabit: HabitItem = {
          ...habitData,
          id,
          currentStreak: 0,
          bestStreak: 0,
          completedDays: [],
          createdAt: new Date().toISOString(),
        };
        const userId = useFinanceStore.getState().profile.id;
        saveHabitToSupabase(userId, newHabit);
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      toggleHabitForDate: (habitId, dateStr) => {
        set((state) => {
          const updatedHabits = state.habits.map((h) => {
            if (h.id !== habitId) return h;
            const exists = h.completedDays.includes(dateStr);
            const updatedDays = exists
              ? h.completedDays.filter((d) => d !== dateStr)
              : [...h.completedDays, dateStr];

            const currentStreak = exists ? Math.max(0, h.currentStreak - 1) : h.currentStreak + 1;
            const bestStreak = Math.max(h.bestStreak, currentStreak);

            return {
              ...h,
              completedDays: updatedDays,
              currentStreak,
              bestStreak,
            };
          });
          const updated = updatedHabits.find((h) => h.id === habitId);
          if (updated) {
            const userId = useFinanceStore.getState().profile.id;
            saveHabitToSupabase(userId, updated);
          }
          return { habits: updatedHabits };
        });
      },

      deleteHabit: (habitId) => {
        deleteHabitFromSupabase(habitId);
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
        }));
      },

      // Calendar Event Actions
      addCalendarEvent: (eventData) => {
        const id = generateId();
        const newEvt: CalendarEventItem = {
          ...eventData,
          id,
          createdAt: new Date().toISOString(),
        };
        const userId = useFinanceStore.getState().profile.id;
        saveCalendarEventToSupabase(userId, newEvt);
        set((state) => ({
          calendarEvents: [...state.calendarEvents, newEvt],
        }));
      },

      updateCalendarEvent: (id, updates) => {
        set((state) => {
          const updatedEvents = state.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          );
          const updated = updatedEvents.find((e) => e.id === id);
          if (updated) {
            const userId = useFinanceStore.getState().profile.id;
            saveCalendarEventToSupabase(userId, updated);
          }
          return { calendarEvents: updatedEvents };
        });
      },

      deleteCalendarEvent: (id) => {
        deleteCalendarEventFromSupabase(id);
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
        }));
      },

      // Daily Planner Actions
      addPlannerSlot: (slotData) => {
        const id = generateId();
        const newSlot = { ...slotData, id };
        const userId = useFinanceStore.getState().profile.id;
        savePlannerSlotToSupabase(userId, newSlot);
        set((state) => ({
          dailyPlanner: [...state.dailyPlanner, newSlot],
        }));
      },

      togglePlannerSlotComplete: (id) => {
        set((state) => ({
          dailyPlanner: state.dailyPlanner.map((s) =>
            s.id === id ? { ...s, completed: !s.completed } : s
          ),
        }));
      },

      deletePlannerSlot: (id) => {
        deletePlannerSlotFromSupabase(id);
        set((state) => ({
          dailyPlanner: state.dailyPlanner.filter((s) => s.id !== id),
        }));
      },

      // Notification Actions
      addNotificationRecord: (notifData) => {
        const id = generateId();
        const newNotif: NotificationRecord = {
          ...notifData,
          id,
          sentAt: new Date().toISOString(),
        };
        const userId = useFinanceStore.getState().profile.id;
        saveNotificationToSupabase(userId, newNotif);
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, status: 'read', openedAt: new Date().toISOString() } : n
          ),
        }));
      },

      dismissNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, status: 'dismissed' } : n
          ),
        }));
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      updateConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },
    }),
    {
      name: 'productivity-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

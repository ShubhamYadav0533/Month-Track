export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export type RepeatType =
  | 'Once'
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Yearly'
  | 'Weekdays'
  | 'Weekends'
  | 'Every Hour'
  | 'Custom';

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface ReminderItem {
  id: string;
  taskId?: string;
  title: string;
  triggerTime: string; // ISO string
  repeatType: RepeatType;
  repeatInterval?: number;
  sound?: string;
  vibration?: boolean;
  snoozeMinutes?: number;
  enabled: boolean;
  notificationId?: string;
}

export interface EnhancedTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  color?: string;
  startDate?: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM AM/PM
  reminderTime?: string; // ISO String
  repeatType: RepeatType;
  repeatInterval?: number;
  location?: string;
  attachments?: string[];
  voiceNoteUrl?: string;
  checklist?: TaskChecklistItem[];
  tags?: string[];
  notes?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  goalType: 'Daily' | 'Weekly';
  targetValue: number;
  currentStreak: number;
  bestStreak: number;
  completedDays: string[]; // List of YYYY-MM-DD dates
  createdAt: string;
}

export type EventType =
  | 'Task'
  | 'Meeting'
  | 'Bill'
  | 'Attendance'
  | 'Expense'
  | 'Note'
  | 'Birthday'
  | 'Event';

export interface CalendarEventItem {
  id: string;
  title: string;
  startDatetime: string; // ISO string
  endDatetime: string; // ISO string
  eventType: EventType;
  location?: string;
  color: string;
  allDay: boolean;
  notes?: string;
  createdAt: string;
}

export interface DailyPlannerSlot {
  id: string;
  plannerDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "06:00 AM"
  activity: string;
  taskId?: string;
  eventId?: string;
  completed: boolean;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  image?: string;
  deepLink?: string;
  status: 'unread' | 'read' | 'dismissed';
  sentAt: string;
  openedAt?: string;
  clicked?: boolean;
  actionType?: string;
}

export interface NotificationConfig {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeDurationMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "07:00"
}

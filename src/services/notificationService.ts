import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a local notification based on trigger date
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, unknown>
): Promise<string | undefined> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission && Platform.OS !== 'web') return undefined;

    const secondsUntilTrigger = Math.max(1, Math.floor((triggerDate.getTime() - Date.now()) / 1000));

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
      },
    });

    return notificationId;
  } catch (err) {
    console.warn('[NotificationService] Schedule error:', err);
    return undefined;
  }
}

/**
 * Cancel a scheduled local notification by ID
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('[NotificationService] Cancel error:', err);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('[NotificationService] Cancel all error:', err);
  }
}

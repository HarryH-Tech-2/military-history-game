// Daily-reminder notification scheduling. Uses expo-notifications.
// We schedule a single repeating local notification at 19:00 each day; cancelling
// removes any pending reminders.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_ID = 'mhg-daily-reminder';
const HOUR = 19;
const MINUTE = 0;

const REMINDER_TITLES = [
  'Time for today\'s battle',
  'A new front awaits',
  'History calls — 5 minutes?',
  'Sharpen your strategy',
];

function pickTitle(): string {
  return REMINDER_TITLES[Math.floor(Math.random() * REMINDER_TITLES.length)];
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return true;
  if (!status.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function scheduleDailyReminder(): Promise<void> {
  await cancelDailyReminder();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: pickTitle(),
      body: 'Pick up where you left off in Military History.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: HOUR,
      minute: MINUTE,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  } catch {
    // Ignore if it wasn't scheduled.
  }
}

import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { resolveHabitIcon, HABIT_DEFAULT_ICONS, hashString } from '../lib/habitColors.js';
import { formatHabitTarget, formatDuration, normalizeDurationToMinutes } from '../lib/formatDuration.js';

const D1NativeNotifications = registerPlugin('D1NativeNotifications');

export const REMINDER_NOTIFICATION_ID = 1001;
export const TEST_NOTIFICATION_ID = 1002;
export const SNOOZE_NOTIFICATION_ID = 1003;
export const REMINDER_CHANNEL_ID = 'd1_habit_reminders';

const DEFAULT_SETTINGS = {
  enabled: false,
  bedtime: '22:00', // 10:00 PM
  offsetMinutes: 15  // 15 minutes before bedtime (9:45 PM)
};

let isInitialized = false;
let webReminderTimer = null;

/**
 * Check if the app is currently running as an installed PWA (standalone) or native app
 */
export function isPwaOrNative() {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Format 24h time string (e.g. "22:00") into friendly 12h display (e.g. "10:00 PM")
 */
export function formatTimeDisplay(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '10:00 PM';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

/**
 * Calculate reminder trigger time (e.g. 15 min before bedtime)
 */
export function calculateReminderTime(bedtimeStr = '22:00', offsetMinutes = 15) {
  const parts = (bedtimeStr || '22:00').split(':');
  const parsedH = parseInt(parts[0], 10);
  const parsedM = parseInt(parts[1], 10);
  let bedH = isNaN(parsedH) ? 22 : parsedH;
  let bedM = isNaN(parsedM) ? 0 : parsedM;

  let totalMinutes = bedH * 60 + bedM - offsetMinutes;
  if (totalMinutes < 0) totalMinutes += 24 * 60; // handle midnight wrap

  const remH = Math.floor(totalMinutes / 60) % 24;
  const remM = totalMinutes % 60;
  const remTimeStr = `${String(remH).padStart(2, '0')}:${String(remM).padStart(2, '0')}`;
  return {
    reminderTimeStr: remTimeStr,
    displayStr: formatTimeDisplay(remTimeStr),
    hours: remH,
    minutes: remM
  };
}

/**
 * Initialize Notification channels, action types, and tap handlers
 */
export async function initNotifications() {
  if (isInitialized) return;
  if (!Capacitor.isNativePlatform()) {
    isInitialized = true;
    return;
  }

  try {
    // 1. Create Android Notification Channel
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Habit Reminders',
      description: 'Daily reminders for remaining habits before bedtime',
      importance: 5, // High: heads-up notification
      visibility: 1, // Public on lockscreen
      vibration: true,
      lights: true,
      lightColor: '#10B981'
    });

    // 2. Register Interactive Action Types (Open Today, Snooze)
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'HABIT_REMINDER_ACTIONS',
          actions: [
            {
              id: 'open_today',
              title: 'Open Today',
              foreground: true
            },
            {
              id: 'snooze',
              title: 'Snooze',
              foreground: false
            }
          ]
        }
      ]
    });

    // 3. Listen for notification action / tap
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      const actionId = notification.actionId;
      const extra = notification.notification?.extra;

      if (actionId === 'snooze') {
        snoozeReminder(15);
        return;
      }

      // If user tapped notification body or "Open Today" button
      if (actionId === 'open_today' || extra?.route === 'open_today' || !actionId || actionId === 'tap') {
        navigateToToday();
      }
    });

    isInitialized = true;
  } catch (err) {
    console.warn('[NotificationService] Initialization warning:', err);
  }
}

/**
 * Navigate to Today view cleanly
 */
export function navigateToToday() {
  try {
    if (window.location.hash !== '#/' && window.location.hash !== '') {
      window.location.hash = '#/';
    }
  } catch (err) {
    console.warn('[NotificationService] Navigation error:', err);
  }
}

/**
 * Request runtime notification permission (Android 13+ POST_NOTIFICATIONS / Web Notification)
 */
export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  }
  try {
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  } catch (err) {
    console.warn('[NotificationService] Request permission error:', err);
    return false;
  }
}

/**
 * Check if notification permission is currently granted
 */
export async function checkNotificationPermission() {
  if (!Capacitor.isNativePlatform()) {
    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }
  try {
    const status = await LocalNotifications.checkPermissions();
    return status.display === 'granted';
  } catch (err) {
    return false;
  }
}

/**
 * Read saved reminder settings from localStorage
 */
export function getReminderSettings() {
  try {
    const raw = localStorage.getItem('d1_reminder_settings');
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {}
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save reminder settings locally and sync to Firestore user doc if logged in
 */
export async function saveReminderSettings(settings, user) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  try {
    localStorage.setItem('d1_reminder_settings', JSON.stringify(merged));
  } catch (err) {}

  if (user?.uid) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase.js');
      await updateDoc(doc(db, 'users', user.uid), {
        reminderSettings: merged
      });
    } catch (err) {
      console.warn('[NotificationService] Failed to sync reminder settings to Firestore:', err);
    }
  }

  // Update schedule accordingly
  if (merged.enabled) {
    await scheduleDailyReminder(merged, user);
  } else {
    await cancelDailyReminder();
  }

  return merged;
}

/**
 * Cancel the scheduled reminder
 */
export async function cancelDailyReminder() {
  if (webReminderTimer) {
    clearTimeout(webReminderTimer);
    webReminderTimer = null;
  }

  if (!Capacitor.isNativePlatform()) return;
  try {
    try {
      await D1NativeNotifications.cancelHabitReminder();
    } catch (_) {}
    await LocalNotifications.cancel({
      notifications: [
        { id: REMINDER_NOTIFICATION_ID },
        { id: SNOOZE_NOTIFICATION_ID },
        { id: TEST_NOTIFICATION_ID }
      ]
    });
  } catch (err) {
    console.warn('[NotificationService] Cancel reminder error:', err);
  }
}

/**
 * Calculate incomplete habits for the current authenticated user
 */
export function getIncompleteHabits(user) {
  const uid = user?.uid;
  if (!uid) return [];

  try {
    // 1. Get active habits from local storage
    const rawHabits = localStorage.getItem('habits_' + uid);
    if (!rawHabits) return [];
    const habits = JSON.parse(rawHabits);
    const activeHabits = Array.isArray(habits) ? habits.filter(h => h.status !== 'deleted') : [];
    if (activeHabits.length === 0) return [];

    // 2. Get today's completed habit IDs
    const todayStr = new Date().toISOString().split('T')[0];
    const completedSet = new Set();

    const rawEntries = localStorage.getItem(`entries_${uid}_${todayStr}`);
    if (rawEntries) {
      try {
        const entries = JSON.parse(rawEntries);
        entries.forEach(e => {
          if ((e.computedScore && e.computedScore > 0) || e.completed || (e.rawValue !== undefined && e.rawValue !== null)) {
            completedSet.add(e.habitId);
          }
        });
      } catch (_) {}
    }

    const rawSummaries = localStorage.getItem('summaries_' + uid);
    if (rawSummaries) {
      try {
        const summaries = JSON.parse(rawSummaries);
        const todaySum = summaries.find(s => s.id === todayStr);
        if (todaySum?.habitScores) {
          Object.entries(todaySum.habitScores).forEach(([hId, score]) => {
            if (score > 0) completedSet.add(hId);
          });
        }
      } catch (_) {}
    }

    return activeHabits.filter(h => !completedSet.has(h.id));
  } catch (err) {
    console.warn('[NotificationService] Error getting incomplete habits:', err);
    return [];
  }
}

/**
 * Resolves the canonical Android drawable resource for habit(s) to show as the largeIcon
 */
export function getHabitDrawable(habits = [], index = 0) {
  if (!habits || habits.length === 0) return 'ic_habit_default';

  // If multiple habits passed as composite (e.g. for largeIcon preview)
  if (habits.length > 1) {
    return 'ic_habit_multi';
  }

  const h = habits[0];
  const raw = ((h.iconId || h.icon || h.id || h.habitId || '') + '').toLowerCase().trim();
  const name = (h.name || '').toLowerCase().trim();

  // 1. Precise semantic keyword matching
  if (raw.includes('water') || raw.includes('drop') || name.includes('water') || name.includes('hydrat')) return 'ic_habit_water';
  if (raw.includes('alcohol') || raw.includes('wine') || raw.includes('beer') || raw.includes('drink') || raw.includes('sober') || name.includes('alcohol') || name.includes('wine') || name.includes('beer') || name.includes('sober')) return 'ic_habit_wine';
  if (raw.includes('target') || raw.includes('goal') || raw.includes('aim') || name.includes('target') || name.includes('goal') || name.includes('aim')) return 'ic_habit_target';
  if (raw.includes('flame') || raw.includes('fire') || raw.includes('burn') || raw.includes('streak') || name.includes('flame') || name.includes('fire') || name.includes('burn') || name.includes('streak')) return 'ic_habit_flame';
  if (raw.includes('trophy') || raw.includes('award') || raw.includes('win') || raw.includes('crown') || name.includes('trophy') || name.includes('award') || name.includes('win') || name.includes('milestone')) return 'ic_habit_trophy';
  if (raw.includes('sleep_duration') || raw.includes('hourglass') || name.includes('sleep duration')) return 'ic_habit_sleep_duration';
  if (raw.includes('sleep') || raw.includes('bedtime') || raw.includes('moon') || raw.includes('rest') || name.includes('sleep') || name.includes('rest')) return 'ic_habit_sleep';
  if (raw.includes('workout') || raw.includes('fitness') || raw.includes('barbell') || raw.includes('gym') || name.includes('workout') || name.includes('gym') || name.includes('exercise')) return 'ic_habit_workout';
  if (raw.includes('reading') || raw.includes('menu_book') || raw.includes('book') || name.includes('read') || name.includes('book') || name.includes('study')) return 'ic_habit_reading';
  if (raw.includes('meditation') || raw.includes('self_improvement') || raw.includes('yoga') || name.includes('meditat') || name.includes('yoga') || name.includes('mindful')) return 'ic_habit_meditation';
  if (raw.includes('deepwork') || raw.includes('psychology') || raw.includes('brain') || raw.includes('focus') || name.includes('deep') || name.includes('focus') || name.includes('work')) return 'ic_habit_deepwork';
  if (raw.includes('wakeup') || raw.includes('alarm') || raw.includes('early') || name.includes('wake') || name.includes('alarm') || name.includes('morning')) return 'ic_habit_wakeup';
  if (raw.includes('walking') || raw.includes('directions_walk') || raw.includes('footprints') || raw.includes('step') || name.includes('walk') || name.includes('step')) return 'ic_habit_walking';
  if (raw.includes('protein') || raw.includes('restaurant') || raw.includes('forkknife') || raw.includes('diet') || raw.includes('meal') || name.includes('protein') || name.includes('diet') || name.includes('food') || name.includes('meal')) return 'ic_habit_protein';
  if (raw.includes('coldshower') || raw.includes('ac_unit') || raw.includes('snowflake') || raw.includes('shower') || name.includes('shower') || name.includes('cold')) return 'ic_habit_coldshower';
  if (raw.includes('journal') || raw.includes('edit_note') || raw.includes('notepencil') || raw.includes('pencil') || raw.includes('writing') || name.includes('journal') || name.includes('write') || name.includes('note')) return 'ic_habit_journal';
  if (raw.includes('energy') || raw.includes('bolt') || raw.includes('lightning') || name.includes('energy')) return 'ic_habit_energy';
  if (raw.includes('screentime') || raw.includes('smartphone') || raw.includes('devicemobile') || raw.includes('phone') || name.includes('screen') || name.includes('phone')) return 'ic_habit_screentime';
  if (raw.includes('sunlight') || raw.includes('sun') || name.includes('sun') || name.includes('outdoor')) return 'ic_habit_sunlight';
  if (raw.includes('heart') || raw.includes('health') || raw.includes('cardio') || name.includes('heart') || name.includes('health')) return 'ic_habit_heart';
  if (raw.includes('coffee') || raw.includes('caffeine') || raw.includes('tea') || name.includes('coffee') || name.includes('tea')) return 'ic_habit_coffee';
  if (raw.includes('drink') || name.includes('drink')) return 'ic_habit_wine';

  // 2. Deterministic diverse rotation for unknown / short custom habits (e.g. "Hi", "X3", "E3")
  // Ensures every habit gets a unique, beautiful icon rather than identical stars
  const DIVERSE_FALLBACKS = [
    'ic_habit_rocket',
    'ic_habit_target',
    'ic_habit_flame',
    'ic_habit_trophy',
    'ic_habit_lightning',
    'ic_habit_brain',
    'ic_habit_heart',
    'ic_habit_workout'
  ];

  const str = (h.id || h.name || 'habit') + '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const fallbackIdx = Math.abs(hash + index) % DIVERSE_FALLBACKS.length;
  return DIVERSE_FALLBACKS[fallbackIdx];
}

/**
 * Build rich notification content based on incomplete habits
 * Strictly NO emojis: Uses clean, elegant typography, canonical habit badges,
 * and universal target formatting (e.g. "8 hours 30 minutes", "2 hours", never "120 minutes" or "1920 minutes").
 */
export function buildNotificationContent(incompleteHabits = [], bedtimeStr = '22:00') {
  const count = incompleteHabits.length;
  const bedtimeDisplay = formatTimeDisplay(bedtimeStr);

  const title = `${count} ${count === 1 ? 'Habit' : 'Habits'} Remaining`;
  const summaryText = `${count} ${count === 1 ? 'habit' : 'habits'} left`;
  const body = `Complete your day before ${bedtimeDisplay}.`;

  // Clean bullet list of habits with targets formatted cleanly
  const lines = [
    `Complete your day before ${bedtimeDisplay}.`,
    ''
  ];

  const previewHabits = incompleteHabits.slice(0, 4);
  previewHabits.forEach(h => {
    const formattedTarget = formatHabitTarget(h, 'long');
    lines.push(`• ${h.name} (${formattedTarget})`);
  });

  if (incompleteHabits.length > 4) {
    lines.push(`• +${incompleteHabits.length - 4} more habits`);
  }

  const largeBody = lines.join('\n');
  const largeIcon = getHabitDrawable(incompleteHabits);

  return {
    title,
    body,
    largeBody: largeBody || body,
    summaryText,
    largeIcon
  };
}

/**
 * Display persistent web notification via ServiceWorker (for PWA) or standard Notification API
 */
export async function showWebNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
  }

  // Primary for PWA: Use ServiceWorker showNotification with action buttons & badge
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/favicon-32x32.png',
          tag: 'd1_bedtime_reminder',
          renotify: true,
          data: { route: 'open_today', url: '/#/' },
          actions: [
            { action: 'open_today', title: 'Open Today' }
          ],
          ...options
        });
        return true;
      }
    } catch (swErr) {
      console.warn('[NotificationService] ServiceWorker showNotification error, falling back:', swErr);
    }
  }

  // Fallback to standard Window Notification API
  try {
    const notif = new Notification(title, {
      icon: '/pwa-192x192.png',
      ...options
    });
    notif.onclick = () => {
      window.focus();
      navigateToToday();
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('[NotificationService] Window Notification failed:', err);
    return false;
  }
}

/**
 * Schedule the daily bedtime reminder
 */
export async function scheduleDailyReminder(settings, user) {
  await initNotifications();

  const cfg = settings || getReminderSettings();
  if (!cfg.enabled) {
    await cancelDailyReminder();
    return;
  }

  // Permission check
  const hasPerm = await checkNotificationPermission();
  if (!hasPerm) {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  // Cancel any existing reminder before scheduling a new one
  await cancelDailyReminder();

  // Incomplete habits
  const incompleteHabits = getIncompleteHabits(user);
  const sampleHabits = incompleteHabits.length > 0 
    ? incompleteHabits 
    : [
        { id: 'sleep_duration', name: 'Sleep Duration', icon: 'hourglass', target100: 510, unit: 'minutes' },
        { id: 'water', name: 'Water Intake', icon: 'water_drop', target100: 8, unit: 'glasses' }
      ];

  const content = buildNotificationContent(sampleHabits, cfg.bedtime);

  // Compute trigger time for today or tomorrow
  const { hours, minutes } = calculateReminderTime(cfg.bedtime, cfg.offsetMinutes || 15);
  const now = new Date();
  const triggerDate = new Date();
  triggerDate.setHours(hours, minutes, 0, 0);

  // If time has already passed today, schedule for tomorrow
  if (triggerDate.getTime() <= now.getTime()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  const habitItems = sampleHabits.slice(0, 4).map((h, idx) => ({
    name: h.name || 'Habit',
    target: formatHabitTarget(h, 'long'),
    drawable: getHabitDrawable([h], idx)
  }));

  // 1. Android Native Platform scheduling via custom RemoteViews or LocalNotifications
  if (Capacitor.isNativePlatform()) {
    try {
      await D1NativeNotifications.scheduleHabitReminder({
        triggerAtMillis: triggerDate.getTime(),
        title: content.title,
        subtitle: `Complete your day before ${formatTimeDisplay(cfg.bedtime)}.`,
        habits: habitItems
      });
      return;
    } catch (nativeSchedErr) {
      console.warn('[NotificationService] Native schedule fallback to LocalNotifications:', nativeSchedErr);
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: REMINDER_NOTIFICATION_ID,
              title: content.title,
              body: content.body,
              largeBody: content.largeBody,
              summaryText: content.summaryText,
              channelId: REMINDER_CHANNEL_ID,
              actionTypeId: 'HABIT_REMINDER_ACTIONS',
              smallIcon: 'ic_stat_d1',
              schedule: {
                at: triggerDate,
                allowWhileIdle: true,
                repeats: true,
                every: 'day'
              },
              extra: {
                route: 'open_today'
              }
            }
          ]
        });
      } catch (err) {
        console.error('[NotificationService] Failed to schedule reminder:', err);
      }
      return;
    }
  }

  // 2. Web / PWA scheduling
  const delayMs = triggerDate.getTime() - now.getTime();
  if (delayMs > 0 && delayMs < 2147483647) {
    webReminderTimer = setTimeout(async () => {
      const liveHabits = getIncompleteHabits(user);
      const habitsToRemind = liveHabits.length > 0 ? liveHabits : sampleHabits;
      const liveContent = buildNotificationContent(habitsToRemind, cfg.bedtime);
      const habitDetails = habitsToRemind.slice(0, 4).map(h => `• ${h.name} (${formatHabitTarget(h, 'long')})`).join('\n');

      await showWebNotification(liveContent.title, {
        body: `${liveContent.body}\n\n${habitDetails}`
      });

      // Automatically schedule for the next day
      scheduleDailyReminder(cfg, user);
    }, delayMs);
  }
}

/**
 * Snooze the reminder by X minutes
 */
export async function snoozeReminder(minutes = 15) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: SNOOZE_NOTIFICATION_ID,
          title: 'Habit Reminder (Snoozed)',
          body: '15 minutes are up! Time to complete your habits.',
          channelId: REMINDER_CHANNEL_ID,
          actionTypeId: 'HABIT_REMINDER_ACTIONS',
          smallIcon: 'ic_stat_d1',
          largeIcon: 'ic_habit_default',
          schedule: {
            at: snoozeDate,
            allowWhileIdle: true
          },
          extra: {
            route: 'open_today'
          }
        }
      ]
    });
  } catch (err) {
    console.warn('[NotificationService] Snooze error:', err);
  }
}

/**
 * Send an immediate Test Notification so the user can preview it directly on their device (Android or PWA)
 */
export async function sendTestNotification(bedtimeStr = '22:00', user = null) {
  await initNotifications();

  const hasPerm = await checkNotificationPermission();
  if (!hasPerm) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      alert('Please allow notification permission in your browser/device settings to preview notifications.');
      return false;
    }
  }

  // Get real incomplete habits or mock demo habits with authentic icons & targets
  let incomplete = getIncompleteHabits(user);
  if (incomplete.length === 0) {
    incomplete = [
      { id: 'sleep_duration', name: 'Sleep Duration', icon: 'hourglass', target100: 510, unit: 'minutes' },
      { id: 'water', name: 'Water Intake', icon: 'water_drop', target100: 8, unit: 'glasses' }
    ];
  }

  const count = incomplete.length;
  const bedtimeDisplay = formatTimeDisplay(bedtimeStr);
  const title = `${count} ${count === 1 ? 'Habit' : 'Habits'} Remaining`;
  const subtitle = `Complete your day before ${bedtimeDisplay}.`;

  const habitItems = incomplete.slice(0, 4).map((h, idx) => ({
    name: h.name || 'Habit',
    target: formatHabitTarget(h, 'long'),
    drawable: getHabitDrawable([h], idx)
  }));

  const content = buildNotificationContent(incomplete, bedtimeStr);

  // 1. Android Native Execution
  if (Capacitor.isNativePlatform()) {
    try {
      await D1NativeNotifications.showHabitNotification({
        title,
        subtitle,
        habits: habitItems
      });
      return true;
    } catch (err) {
      console.warn('[NotificationService] Native showHabitNotification error, falling back:', err);
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: TEST_NOTIFICATION_ID,
              title: content.title,
              body: content.body,
              largeBody: content.largeBody,
              summaryText: content.summaryText,
              channelId: REMINDER_CHANNEL_ID,
              actionTypeId: 'HABIT_REMINDER_ACTIONS',
              smallIcon: 'ic_stat_d1',
              extra: {
                route: 'open_today'
              }
            }
          ]
        });
        return true;
      } catch (fallbackErr) {
        console.error('[NotificationService] Fallback notification error:', fallbackErr);
        return false;
      }
    }
  }

  // 2. Web / PWA Execution
  const habitDetails = habitItems.map(h => `• ${h.name} (${h.target})`).join('\n');
  return await showWebNotification(content.title, {
    body: `${content.body}\n\n${habitDetails}`
  });
}

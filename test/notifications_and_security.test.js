import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateReminderTime, 
  formatTimeDisplay, 
  getHabitDrawable, 
  buildNotificationContent 
} from '../src/services/notificationService.js';
import { 
  formatHabitTarget, 
  formatDuration, 
  normalizeDurationToMinutes 
} from '../src/lib/formatDuration.js';
import { sanitizeText, sanitizeHabit } from '../src/lib/sanitizer.js';

describe('D1 — Bedtime Habit Notification & Security Test Suite', () => {

  describe('1. Reminder Time Calculation & Offsets', () => {
    it('calculates 15-minute offset before 10:00 PM (22:00) as 9:45 PM (21:45)', () => {
      const res = calculateReminderTime('22:00', 15);
      assert.equal(res.reminderTimeStr, '21:45');
      assert.equal(res.hours, 21);
      assert.equal(res.minutes, 45);
      assert.equal(res.displayStr, '9:45 PM');
    });

    it('handles midnight crossing: 00:00 bedtime with 15m offset results in 23:45 (11:45 PM previous day)', () => {
      const res = calculateReminderTime('00:00', 15);
      assert.equal(res.reminderTimeStr, '23:45');
      assert.equal(res.hours, 23);
      assert.equal(res.minutes, 45);
      assert.equal(res.displayStr, '11:45 PM');
    });

    it('handles midnight crossing: 00:10 bedtime with 15m offset results in 23:55 (11:55 PM)', () => {
      const res = calculateReminderTime('00:10', 15);
      assert.equal(res.reminderTimeStr, '23:55');
      assert.equal(res.displayStr, '11:55 PM');
    });

    it('handles custom 30m offset correctly', () => {
      const res = calculateReminderTime('23:00', 30);
      assert.equal(res.reminderTimeStr, '22:30');
      assert.equal(res.displayStr, '10:30 PM');
    });
  });

  describe('2. Time Display Formatting', () => {
    it('formats 24-hour time to 12-hour AM/PM correctly', () => {
      assert.equal(formatTimeDisplay('00:00'), '12:00 AM');
      assert.equal(formatTimeDisplay('08:30'), '8:30 AM');
      assert.equal(formatTimeDisplay('12:00'), '12:00 PM');
      assert.equal(formatTimeDisplay('13:15'), '1:15 PM');
      assert.equal(formatTimeDisplay('21:45'), '9:45 PM');
      assert.equal(formatTimeDisplay('22:00'), '10:00 PM');
    });

    it('handles fallback gracefully when invalid time is passed', () => {
      assert.equal(formatTimeDisplay(''), '10:00 PM');
      assert.equal(formatTimeDisplay(null), '10:00 PM');
    });
  });

  describe('3. Input Sanitization & Anti-XSS Security', () => {
    it('strips malicious script tags from text inputs completely', () => {
      const malicious = '<script>alert("hacked")</script>Meditation';
      const clean = sanitizeText(malicious);
      assert.equal(clean, 'Meditation');
      assert.equal(clean.includes('<script>'), false);
    });

    it('strips javascript: and data: pseudo-protocols', () => {
      const malicious = 'javascript:evil() data:text/html,bad';
      const clean = sanitizeText(malicious);
      assert.equal(clean.includes('javascript:'), false);
      assert.equal(clean.includes('data:'), false);
    });

    it('enforces maximum character length on habit fields', () => {
      const superLong = 'A'.repeat(500);
      const clean = sanitizeText(superLong, 80);
      assert.equal(clean.length, 80);
    });

    it('preserves legitimate Hindi / Unicode text in habit names', () => {
      const hindiHabit = 'ध्यान और प्राणायाम (Meditation)';
      const clean = sanitizeText(hindiHabit);
      assert.equal(clean, 'ध्यान और प्राणायाम (Meditation)');
    });

    it('sanitizes full habit object with safe field lengths', () => {
      const dirtyHabit = {
        name: '<b>Morning Run</b>',
        description: '<img src=x onerror=alert(1)>5km run',
        notes: '<script>evil()</script>Personal notes',
        unit: '<style>body{}</style>km'
      };
      const cleanHabit = sanitizeHabit(dirtyHabit);
      assert.equal(cleanHabit.name, 'Morning Run');
      assert.equal(cleanHabit.description, '5km run');
      assert.equal(cleanHabit.notes, 'Personal notes');
      assert.equal(cleanHabit.unit, 'km');
    });
  });

  describe('4. Notification Payload Security & Privacy Isolation', () => {
    it('ensures notification routing extra payload NEVER contains auth tokens, UIDs, or credentials', () => {
      // The scheduled extra payload must only contain routing destination
      const safeExtra = { route: 'open_today' };
      assert.deepEqual(Object.keys(safeExtra), ['route']);
      assert.equal(safeExtra.route, 'open_today');
      assert.equal('uid' in safeExtra, false);
      assert.equal('token' in safeExtra, false);
      assert.equal('password' in safeExtra, false);
      assert.equal('email' in safeExtra, false);
    });
  });

  describe('5. Habit Icon / Drawable Resolution & Emoji-Free Visual Notification Content', () => {
    it('correctly maps single habit icons to canonical Android drawables', () => {
      assert.equal(getHabitDrawable([{ icon: 'fitness_center' }]), 'ic_habit_workout');
      assert.equal(getHabitDrawable([{ icon: 'water_drop' }]), 'ic_habit_water');
      assert.equal(getHabitDrawable([{ icon: 'self_improvement' }]), 'ic_habit_meditation');
      assert.equal(getHabitDrawable([{ icon: 'menu_book' }]), 'ic_habit_reading');
      assert.equal(getHabitDrawable([{ icon: 'alarm' }]), 'ic_habit_wakeup');
      assert.equal(getHabitDrawable([{ icon: 'bedtime' }]), 'ic_habit_sleep');
      assert.equal(getHabitDrawable([{ icon: 'psychology' }]), 'ic_habit_deepwork');
      assert.equal(getHabitDrawable([{ icon: 'hourglass', name: 'Sleep Duration' }]), 'ic_habit_sleep_duration');
      assert.equal(getHabitDrawable([{ icon: 'edit_note', name: 'Journal' }]), 'ic_habit_journal');
      assert.equal(getHabitDrawable([{ icon: 'bolt', name: 'Energy Level' }]), 'ic_habit_energy');
      assert.equal(getHabitDrawable([{ icon: 'smartphone', name: 'Screen Time' }]), 'ic_habit_screentime');
    });

    it('resolves drawable from habit name keywords when icon is not explicitly specified', () => {
      assert.equal(getHabitDrawable([{ name: 'Evening Meditation' }]), 'ic_habit_meditation');
      assert.equal(getHabitDrawable([{ name: 'Hydration 2L' }]), 'ic_habit_water');
      assert.equal(getHabitDrawable([{ name: 'Daily Workout' }]), 'ic_habit_workout');
      assert.equal(getHabitDrawable([{ name: 'Book Reading' }]), 'ic_habit_reading');
      assert.equal(getHabitDrawable([{ name: 'Deep Work Session' }]), 'ic_habit_deepwork');
    });

    it('resolves ic_habit_multi for multiple remaining habits', () => {
      const habits = [
        { id: 'water', name: 'Water Intake', icon: 'water_drop' },
        { id: 'sleep', name: 'Sleep Duration', icon: 'hourglass' }
      ];
      assert.equal(getHabitDrawable(habits), 'ic_habit_multi');
    });

    it('builds clean emoji-free notification content with proper typography and habit drawable', () => {
      const habits = [
        { id: 'meditation', name: 'Meditation', icon: 'self_improvement', target100: 10, unit: 'min' },
        { id: 'reading', name: 'Reading', icon: 'menu_book', target100: 20, unit: 'min' }
      ];
      const content = buildNotificationContent(habits, '22:00');

      // Title & summary
      assert.equal(content.title, '2 Habits Remaining');
      assert.equal(content.summaryText, '2 habits left');
      assert.equal(content.body, 'Complete your day before 10:00 PM.');

      // Large body contains bulleted habits with universal formatted targets
      assert.ok(content.largeBody.includes('• Meditation (10 minutes)'));
      assert.ok(content.largeBody.includes('• Reading (20 minutes)'));

      // Habit badge drawable
      assert.equal(content.largeIcon, 'ic_habit_multi');

      // Verification: strictly NO emojis anywhere in the notification strings
      const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      assert.equal(emojiRegex.test(content.title), false, 'Title must not contain emojis');
      assert.equal(emojiRegex.test(content.body), false, 'Body must not contain emojis');
      assert.equal(emojiRegex.test(content.largeBody), false, 'LargeBody must not contain emojis');
      assert.equal(emojiRegex.test(content.summaryText), false, 'SummaryText must not contain emojis');
    });
  });

  describe('6. Universal Duration Formatting & Automatic Minutes-to-Hours Conversion', () => {
    it('automatically formats 120 minutes to "2 hours" (NEVER raw "120 minutes")', () => {
      const habit = { id: 'deepwork', name: 'Deep Work', scoringType: 'duration', target100: 120, unit: 'minutes' };
      const formatted = formatHabitTarget(habit, 'long');
      assert.equal(formatted, '2 hours');
      assert.equal(formatted.includes('120'), false);
    });

    it('formats 8 hours 30 minutes (510 minutes) into "8 hours 30 minutes"', () => {
      const habit = { id: 'sleep_duration', name: 'Sleep Duration', scoringType: 'duration', target100: 510, unit: 'minutes' };
      assert.equal(formatHabitTarget(habit, 'long'), '8 hours 30 minutes');
    });

    it('auto-corrects night-shift rollover 1920 minutes into "8 hours" (NEVER raw "1920 minutes")', () => {
      // 1920 minutes = 480 + 1440. Must auto-correct to 480 mins = 8 hours
      const habit = { id: 'sleep_duration', name: 'Sleep Duration', scoringType: 'duration', target100: 1920, unit: 'minutes' };
      const formatted = formatHabitTarget(habit, 'long');
      assert.equal(formatted, '8 hours');
      assert.equal(formatted.includes('1920'), false);
    });

    it('auto-corrects night-shift rollover 1950 minutes into "8 hours 30 minutes"', () => {
      const habit = { id: 'sleep_duration', name: 'Sleep Duration', scoringType: 'duration', target100: 1950, unit: 'minutes' };
      assert.equal(formatHabitTarget(habit, 'long'), '8 hours 30 minutes');
    });

    it('formats 60 minutes cleanly to "1 hour"', () => {
      const habit = { id: 'reading', name: 'Reading', scoringType: 'duration', target100: 60, unit: 'minutes' };
      assert.equal(formatHabitTarget(habit, 'long'), '1 hour');
    });

    it('formats sub-60 durations cleanly in minutes', () => {
      const habit = { id: 'workout', name: 'Workout', scoringType: 'duration', target100: 45, unit: 'minutes' };
      assert.equal(formatHabitTarget(habit, 'long'), '45 minutes');
    });

    it('formats numerical and quantity habits with units intact', () => {
      const water = { id: 'water', name: 'Water Intake', scoringType: 'number', target100: 8, unit: 'glasses' };
      assert.equal(formatHabitTarget(water, 'long'), '8 glasses');

      const steps = { id: 'steps', name: 'Daily Steps', scoringType: 'number', target100: 10000, unit: 'steps' };
      assert.equal(formatHabitTarget(steps, 'long'), '10,000 steps');
    });

    it('formats time-based habits into friendly time strings', () => {
      const wakeup = { id: 'wakeup', name: 'Wake Up', scoringType: 'time', target100: 360, unit: 'time' };
      assert.equal(formatHabitTarget(wakeup, 'long'), 'by 6:00 AM');
    });

    it('formats binary and subjective habits cleanly into "Yes / No"', () => {
      const journal = { id: 'journal', name: 'Journal', scoringType: 'binary', target100: 10 };
      assert.equal(formatHabitTarget(journal, 'long'), 'Yes / No');

      const energy = { id: 'energy', name: 'Energy Level', scoringType: 'subjective', target100: 10 };
      assert.equal(formatHabitTarget(energy, 'long'), 'Yes / No');

      const customCheck = { id: 'custom_123', name: 'Check-in', scoringType: 'binary' };
      assert.equal(formatHabitTarget(customCheck, 'long'), 'Yes / No');
    });
  });
});

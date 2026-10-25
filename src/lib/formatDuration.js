/**
 * src/lib/formatDuration.js
 * Universal helper for formatting and normalizing duration values across the application.
 *
 * Rules:
 * - If hours > 0 and minutes > 0: Display BOTH (e.g. "8 hours 30 minutes" or "8 hr 30 mins")
 * - If hours > 0 and minutes === 0: Display HOURS ONLY (e.g. "2 hours" or "8 hours") — NEVER "120 minutes"
 * - If minutes > 0 and hours === 0: Display MINUTES ONLY (e.g. "45 minutes" or "45 mins")
 * - If both are 0: Display "0 minutes" or "0 mins"
 * - Auto-corrects any legacy 1440-minute night-shift artifacts (e.g. 1920 min -> 480 min = 8 hours)
 */

import { formatTimeVal } from './timeFormat.js';

export function normalizeDurationToMinutes(val, unit = '') {
  if (val === null || val === undefined || isNaN(val)) return 0;
  const num = Number(val);
  const u = (unit || '').toLowerCase().trim();

  // If stored as small hours (<= 24) and labeled as hours, convert to minutes
  let mins = 0;
  if (num > 0 && num <= 24 && (u === 'hours' || u === 'hrs' || u === 'hour' || u === 'h')) {
    mins = Math.round(num * 60);
  } else {
    mins = Math.round(num);
  }

  // Auto-correct any legacy day-wrap / night-habit rollover shift (+1440 mins)
  // e.g. 1920 mins = 480 + 1440 -> 480 mins (8 hours)
  // e.g. 1950 mins = 510 + 1440 -> 510 mins (8 hours 30 minutes)
  if (mins >= 1440 && mins < 2880) {
    mins -= 1440;
  }

  return Math.max(0, mins);
}

export function formatDuration(totalMins, format = 'standard') {
  if (totalMins === null || totalMins === undefined || isNaN(totalMins)) return '';
  let mins = Math.round(Number(totalMins));
  if (mins < 0) mins = 0;

  // Auto-correct 1440 wrap-around if passed raw
  if (mins >= 1440 && mins < 2880) {
    mins -= 1440;
  }

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (format === 'long') {
    if (h > 0 && m > 0) return `${h} ${h === 1 ? 'hour' : 'hours'} ${m} ${m === 1 ? 'minute' : 'minutes'}`;
    if (h > 0) return `${h} ${h === 1 ? 'hour' : 'hours'}`;
    return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  }

  if (format === 'short') {
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  // 'standard' (default)
  if (h > 0 && m > 0) return `${h} hr ${m} min${m > 1 ? 's' : ''}`;
  if (h > 0) return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  return `${m} ${m === 1 ? 'min' : 'mins'}`;
}

export function isDurationHabit(habit) {
  if (!habit) return false;
  if (habit.scoringType === 'duration' || habit.type === 'duration') return true;
  const unit = (habit.unit || habit.defaultUnit || '').toLowerCase();
  if (unit === 'hours' || unit === 'hrs' || unit === 'hour' || unit === 'h' || unit === 'minutes' || unit === 'mins' || unit === 'min') return true;
  const name = (habit.name || '').toLowerCase();
  if (
    name.includes('sleep duration') ||
    name.includes('screentime') ||
    name.includes('screen time') ||
    name.includes('workout') ||
    name.includes('deep work') ||
    name.includes('deepwork') ||
    name.includes('reading') ||
    name.includes('study') ||
    name.includes('meditat') ||
    name.includes('pomodoro') ||
    name.includes('duration')
  ) {
    return true;
  }
  return false;
}

/**
 * Universal Habit Target Formatter
 * Formats any habit target cleanly:
 * - Duration: Automatically converts >= 60 min to hours & minutes (e.g. 510 -> "8 hours 30 minutes", 120 -> "2 hours")
 * - Time: Formats target time (e.g. "by 6:00 AM", "by 10:30 PM")
 * - Quantity: Formats count and unit (e.g. "8 glasses", "3 Liters")
 * - Binary: "Complete" / "Avoid"
 */
export function formatHabitTarget(habit, format = 'long') {
  if (!habit) return 'Goal';

  // 1. Time-based habit (Wakeup, Bedtime, etc.)
  const name = (habit.name || '').toLowerCase();
  const isTime = habit.scoringType === 'time' || 
    habit.unit === 'Time' || 
    habit.unit === 'time' || 
    habit.id === 'wakeup' || 
    (name.includes('wake') && !name.includes('duration')) ||
    (name.includes('sleep') && !name.includes('duration'));

  if (isTime) {
    const rawTime = habit.target100 !== undefined && habit.target100 !== null 
      ? habit.target100 
      : (habit.userTarget100 !== undefined && habit.userTarget100 !== null ? habit.userTarget100 : (habit.targetTime || habit.target));
    if (rawTime !== undefined && rawTime !== null && rawTime !== '') {
      const formatted = formatTimeVal(rawTime);
      if (formatted) return `by ${formatted}`;
    }
    if (name.includes('wake')) return 'by 6:00 AM';
    if (name.includes('sleep')) return 'by 11:00 PM';
    return 'Daily Goal';
  }

  // 2. Binary / Check-off habits
  const isBinaryOrCheckoff = 
    habit.scoringType === 'binary' || 
    habit.scoringType === 'yn' || 
    habit.scoringType === 'subjective' ||
    habit.id === 'journal' || 
    habit.id === 'coldshower' || 
    habit.id === 'energy' || 
    habit.id === 'mood' || 
    habit.id === 'alcoholfree' || 
    habit.id === 'smokingfree' ||
    (habit.unit && (habit.unit.toLowerCase().includes('yes') || habit.unit.toLowerCase().includes('y/n')));

  if (isBinaryOrCheckoff) {
    if (habit.direction === 'lower_is_better') return 'Avoid';
    return 'Yes / No';
  }

  // 3. Optimal Range
  if (habit.scoringType === 'optimal_range' || habit.direction === 'optimal_range') {
    const min = habit.target100 !== undefined && habit.target100 !== null 
      ? habit.target100 
      : (habit.userTarget100 !== undefined ? habit.userTarget100 : (habit.targetMin || 0));
    const max = habit.targetMax || habit.userTargetMax || habit.max || (Number(min) + 1);
    const u = habit.unit || habit.defaultUnit || '';
    return `${min} - ${max}${u ? ' ' + u : ''}`;
  }

  // 4. Extract raw target value
  let rawVal = habit.target100 !== undefined && habit.target100 !== null
    ? habit.target100
    : (habit.userTarget100 !== undefined && habit.userTarget100 !== null
      ? habit.userTarget100
      : (habit.target !== undefined && habit.target !== null ? habit.target : habit.goal));

  const unit = (habit.unit || habit.defaultUnit || '').toLowerCase().trim();

  // If already formatted friendly string (e.g. "8 hours 30 minutes" or "2 hours"), check if it needs parsing
  if (typeof rawVal === 'string' && isNaN(Number(rawVal))) {
    const matchMin = rawVal.match(/^(\d+)\s*(?:min|minutes|m)$/i);
    if (matchMin) {
      rawVal = Number(matchMin[1]);
    } else {
      return rawVal;
    }
  }

  const numVal = Number(rawVal);
  const isDuration = isDurationHabit(habit) || 
    unit === 'minutes' || 
    unit === 'mins' || 
    unit === 'min' || 
    unit === 'hours' || 
    unit === 'hrs' || 
    unit === 'hr';

  if (isDuration && !isNaN(numVal)) {
    const mins = normalizeDurationToMinutes(numVal, unit);
    const formatted = formatDuration(mins, format);
    if (habit.direction === 'lower_is_better') return `≤ ${formatted}`;
    return formatted;
  }

  // 5. Numerical habit (e.g. 8 glasses, 10,000 steps)
  if (!isNaN(numVal)) {
    const formattedNum = numVal.toLocaleString();
    const u = habit.unit || habit.defaultUnit || '';
    const prefix = habit.direction === 'lower_is_better' ? '≤ ' : '';
    return u ? `${prefix}${formattedNum} ${u}`.trim() : `${prefix}${formattedNum}`;
  }

  return habit.unit ? `Target in ${habit.unit}` : 'Daily Target';
}

/**
 * src/lib/formatDuration.js
 * Universal helper for formatting and normalizing duration values across the application.
 *
 * Rules:
 * - If hours > 0 and minutes > 0: Display BOTH (e.g. "1 hr 30 mins" or "1 hour 30 minutes")
 * - If hours > 0 and minutes === 0: Display HOURS ONLY (e.g. "8 hours" or "8 hrs")
 * - If minutes > 0 and hours === 0: Display MINUTES ONLY (e.g. "45 mins" or "45 minutes")
 * - If both are 0: Display "0 mins"
 */

export function formatDuration(totalMins, format = 'standard') {
  if (totalMins === null || totalMins === undefined || isNaN(totalMins)) return '';
  let mins = Math.round(Number(totalMins));
  if (mins < 0) mins = 0;

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

export function normalizeDurationToMinutes(val, unit = '') {
  if (val === null || val === undefined || isNaN(val)) return 0;
  const num = Number(val);
  const u = (unit || '').toLowerCase().trim();
  // If stored as small hours (<= 24) and labeled as hours, convert to minutes
  if (num > 0 && num <= 24 && (u === 'hours' || u === 'hrs' || u === 'hour' || u === 'h')) {
    return Math.round(num * 60);
  }
  return Math.round(num);
}

export function isDurationHabit(habit) {
  if (!habit) return false;
  if (habit.scoringType === 'duration' || habit.type === 'duration') return true;
  const unit = (habit.unit || habit.defaultUnit || '').toLowerCase();
  if (unit === 'hours' || unit === 'hrs' || unit === 'minutes' || unit === 'mins') return true;
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
    name.includes('pomodoro')
  ) {
    return true;
  }
  return false;
}

// timeFormat.js - Centralized time formatting utility respecting user's 12h / 24h preference

export function getTimeFormatPreference() {
  try {
    const saved = localStorage.getItem('preference_time_format');
    if (saved === '24h' || saved === '12h') return saved;
  } catch (e) {}
  return '12h';
}

export function formatTimeVal(val, overrideFormat) {
  if (val === null || val === undefined || val === '') return '';
  const format = overrideFormat || getTimeFormatPreference();

  let minutes = null;

  if (typeof val === 'number') {
    minutes = val;
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.includes(':')) {
      const parts = trimmed.split(/[:\s]+/);
      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const ampm = (parts[2] || '').toUpperCase();
      if (!isNaN(h) && !isNaN(m)) {
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        minutes = h * 60 + m;
      }
    } else {
      const num = Number(trimmed);
      if (!isNaN(num)) minutes = num;
    }
  }

  if (minutes === null || isNaN(minutes)) return String(val);

  const totalMins = (Math.round(minutes) % 1440 + 1440) % 1440;
  const rawH = Math.floor(totalMins / 60);
  const m = totalMins % 60;

  if (format === '24h') {
    return `${rawH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  const ampm = rawH >= 12 ? 'PM' : 'AM';
  const h12 = rawH % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export const formatTime = formatTimeVal;
export const formatTimeString = formatTimeVal;
export const formatTimeMinutes = formatTimeVal;
export const formatTimeAmPm = formatTimeVal;

// Unified Master Source of Truth for Habit Icons and Colors across the Entire Website
// D1 Architecture: Global Habit Icon Consistency Rule

export const HABIT_DEFAULT_ICONS = {
  "wakeup": "alarm",
  "sleep": "bedtime",
  "sleep_duration": "hourglass_empty",
  "workout": "fitness_center",
  "walking": "directions_walk",
  "water": "water_drop",
  "protein": "restaurant",
  "calories": "local_dining",
  "deepwork": "psychology",
  "pomodoro": "timer",
  "reading": "menu_book",
  "study": "school",
  "screentime": "smartphone",
  "meditation": "self_improvement",
  "journal": "edit_note",
  "coldshower": "ac_unit",
  "mood": "mood",
  "energy": "bolt",
  "alcoholfree": "no_drinks",
  "smokingfree": "smoke_free"
};

export const HABIT_DEFAULT_COLORS = {
  "water": "#0ea5e9",         // Water Drop Cyan
  "protein": "#10b981",       // Protein Emerald Green
  "calories": "#f97316",      // Calories Flame Orange
  "wakeup": "#f59e0b",        // Wakeup Sunrise Gold
  "sleep": "#8b5cf6",         // Sleep Night Violet
  "sleep_duration": "#6366f1", // Sleep Duration Indigo
  "workout": "#ec4899",       // Workout Vibrant Pink
  "walking": "#14b8a6",       // Walking Teal
  "deepwork": "#ef4444",      // Deep Work Crimson
  "pomodoro": "#f43f5e",      // Pomodoro Rose Red
  "reading": "#eab308",       // Reading Amber Gold
  "study": "#3b82f6",         // Study Academic Blue
  "screentime": "#f43f5e",    // Screen Time Alert Red
  "meditation": "#a855f7",    // Meditation Zen Purple
  "journal": "#0284c7",       // Journal Sky Blue
  "coldshower": "#06b6d4",    // Cold Shower Ice Cyan
  "alcoholfree": "#10b981",   // Alcohol Free Fresh Green
  "smokingfree": "#059669",   // Smoking Free Forest Green
  "mood": "#fbbf24",          // Mood Happy Yellow
  "energy": "#eab308"         // Energy Lightning Gold
};

export const PALETTE = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#0ea5e9', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#ef4444'  // Red
];

export function hashString(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getDeterministicHabitColor(key) {
  const colorIndex = hashString(String(key || 'habit')) % PALETTE.length;
  return PALETTE[colorIndex];
}

// Helper: Darken overly bright / neon colors so foreground icon pops with high contrast
export function getReadableIconColor(hexColor) {
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) return hexColor || '#10b981';
  let hex = hexColor.trim();
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (hex.length !== 7) return hexColor;
  
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  if (lum < 0.15) {
    return '#38bdf8';
  }

  if (lum > 0.58) {
    const factor = 0.65;
    const darkR = Math.max(0, Math.min(255, Math.round(r * factor)));
    const darkG = Math.max(0, Math.min(255, Math.round(g * factor)));
    const darkB = Math.max(0, Math.min(255, Math.round(b * factor)));
    return `rgb(${darkR}, ${darkG}, ${darkB})`;
  }
  
  return hexColor;
}

// Compute canonical tinted background & border colors for any hex color
export function getCanonicalRgbaColors(hexColor) {
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) {
    return {
      r: 16,
      g: 185,
      b: 129,
      bgRgba: 'rgba(16, 185, 129, 0.09)',
      borderRgba: 'rgba(16, 185, 129, 0.22)'
    };
  }
  let hex = hexColor.trim();
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  const r = parseInt(hex.slice(1, 3), 16) || 16;
  const g = parseInt(hex.slice(3, 5), 16) || 185;
  const b = parseInt(hex.slice(5, 7), 16) || 129;
  return {
    r,
    g,
    b,
    bgRgba: `rgba(${r}, ${g}, ${b}, 0.09)`,
    borderRgba: `rgba(${r}, ${g}, ${b}, 0.22)`
  };
}

export function resolveHabitColor(habit) {
  if (!habit) return '#10b981';
  
  // 1. If user custom color is set and valid hex, ALWAYS take top priority!
  const customColor = habit.iconColor || habit.color || habit.userColor;
  if (customColor && typeof customColor === 'string' && customColor.startsWith('#')) {
    return customColor;
  }

  const id = (habit.id || habit.habitId || '').toLowerCase().trim();
  
  // 2. If it is a known predefined habit without custom color, use canonical color
  if (id && HABIT_DEFAULT_COLORS[id]) {
    return HABIT_DEFAULT_COLORS[id];
  }
  
  // 3. If icon matches known habit color
  const icon = (habit.iconId || habit.icon || '').toLowerCase().trim();
  if (icon && HABIT_DEFAULT_COLORS[icon]) {
    return HABIT_DEFAULT_COLORS[icon];
  }
  
  // 4. Deterministic hash for custom habits (CRITICAL: habit name must NEVER alter color if id exists)
  const key = id || icon || 'habit';
  return getDeterministicHabitColor(key);
}

export function resolveHabitIcon(habit) {
  if (!habit) return 'star';
  // 1. Saved icon configuration always takes absolute priority!
  if (habit.iconId) return habit.iconId;
  if (habit.icon) return habit.icon;

  // 2. Predefined habit library match
  const id = (habit.id || habit.habitId || '').toLowerCase().trim();
  if (id && HABIT_DEFAULT_ICONS[id]) return HABIT_DEFAULT_ICONS[id];

  // 3. Safe fallback (CRITICAL: never guess from habit name!)
  return 'star';
}

/**
 * Single Source of Truth:
 * Resolves the immutable canonical icon configuration for any habit or props object.
 */
export function getCanonicalHabitIconConfig(habitOrProps) {
  if (!habitOrProps) {
    const { bgRgba, borderRgba } = getCanonicalRgbaColors('#10b981');
    return {
      iconId: 'star',
      icon: 'star',
      iconColor: '#10b981',
      color: '#10b981',
      iconBackgroundColor: bgRgba,
      borderColor: borderRgba,
      iconStyle: 'circle'
    };
  }

  const iconId = resolveHabitIcon(habitOrProps);
  const iconColor = resolveHabitColor(habitOrProps);
  const iconStyle = habitOrProps.iconStyle || 'circle';

  const { r, g, b, bgRgba, borderRgba } = getCanonicalRgbaColors(iconColor);
  const rgbPattern = `${r}, ${g}, ${b}`;
  const bgMatches = habitOrProps.iconBackgroundColor && habitOrProps.iconBackgroundColor.includes(rgbPattern);
  const iconBackgroundColor = bgMatches ? habitOrProps.iconBackgroundColor : bgRgba;

  const borderMatches = habitOrProps.borderColor && habitOrProps.borderColor.includes(rgbPattern);
  const borderColor = borderMatches ? habitOrProps.borderColor : borderRgba;

  return {
    iconId,
    icon: iconId,
    iconColor,
    color: iconColor,
    iconBackgroundColor,
    borderColor,
    iconStyle
  };
}

/**
 * Normalizes any habit entity so it permanently contains the complete
 * canonical icon configuration fields in the local model and for Firebase sync.
 */
export function canonicalizeHabit(habit) {
  if (!habit || typeof habit !== 'object') return habit;
  const config = getCanonicalHabitIconConfig(habit);
  return {
    ...habit,
    icon: config.icon,
    iconId: config.iconId,
    color: config.color,
    iconColor: config.iconColor,
    iconBackgroundColor: config.iconBackgroundColor,
    borderColor: config.borderColor,
    iconStyle: config.iconStyle
  };
}

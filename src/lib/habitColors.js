// Unified Master Source of Truth for Habit Icons and Colors across the Entire Website

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

export function resolveHabitColor(habit) {
  if (!habit) return '#10b981';
  
  // 1. If user custom color is set and valid hex, ALWAYS take top priority!
  const customColor = habit.color || habit.userColor;
  if (customColor && typeof customColor === 'string' && customColor.startsWith('#')) {
    return customColor;
  }

  const id = (habit.id || '').toLowerCase().trim();
  
  // 2. If it is a known predefined habit without custom color, use canonical color
  if (id && HABIT_DEFAULT_COLORS[id]) {
    return HABIT_DEFAULT_COLORS[id];
  }
  
  // 3. If icon matches known habit color
  const icon = (habit.icon || '').toLowerCase().trim();
  if (icon && HABIT_DEFAULT_COLORS[icon]) {
    return HABIT_DEFAULT_COLORS[icon];
  }
  
  // 4. Deterministic hash for custom habits
  const key = id || habit.name || icon || 'habit';
  return getDeterministicHabitColor(key);
}

export function resolveHabitIcon(habit) {
  if (!habit) return 'star';
  if (habit.icon) return habit.icon;
  const id = (habit.id || '').toLowerCase().trim();
  if (id && HABIT_DEFAULT_ICONS[id]) return HABIT_DEFAULT_ICONS[id];
  return 'star';
}

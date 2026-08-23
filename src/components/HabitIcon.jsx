import React from 'react';
import {
  Barbell,
  FlowerLotus,
  Drop,
  PersonSimpleRun,
  Fire,
  Timer,
  ForkKnife,
  BookOpenText,
  Brain,
  Moon,
  Snowflake,
  Smiley,
  Lightning,
  Wine,
  DropSlash,
  CigaretteSlash,
  User,
  House,
  ChartBar,
  Star,
  SquaresFour,
  PencilSimple,
  Trophy,
  CheckCircle,
  XCircle,
  Trash,
  SignOut,
  Tray,
  TrendDown,
  TrendUp,
  ArrowRight,
  ArrowLeft,
  CalendarBlank,
  RocketLaunch,
  Plus,
  Checks,
  Medal,
  Clock,
  Eye,
  EyeSlash,
  WarningCircle,
  ArrowsClockwise,
  Alarm,
  DeviceMobile,
  GraduationCap,
  Hourglass
} from '@phosphor-icons/react';

// Maps old Material Symbol names to Phosphor React components
const ICON_MAP = {
  'fitness_center': Barbell,
  'self_improvement': FlowerLotus,
  'water_drop': Drop,
  'directions_run': PersonSimpleRun,
  'directions_walk': PersonSimpleRun,
  'local_fire_department': Fire,
  'schedule': Clock,
  'schedule_filled': Clock,
  'timer': Timer,
  'restaurant': ForkKnife,
  'local_dining': ForkKnife,
  'menu_book': BookOpenText,
  'psychology': Brain,
  'bedtime': Moon,
  'ac_unit': Snowflake,
  'mood': Smiley,
  'bolt': Lightning,
  'no_drinks': DropSlash,
  'smoke_free': CigaretteSlash,
  'person': User,
  'home': House,
  'home_filled': House,
  'home_outlined': House,
  'insert_chart_filled': ChartBar,
  'insert_chart_outlined': ChartBar,
  'bar_chart': ChartBar,
  'star': Star,
  'edit': PencilSimple,
  'edit_note': PencilSimple,
  'emoji_events': Trophy,
  'workspace_premium': Medal,
  'check': CheckCircle,
  'done_all': Checks,
  'close': XCircle,
  'delete': Trash,
  'logout': SignOut,
  'inbox': Tray,
  'trending_down': TrendDown,
  'trending_up': TrendUp,
  'arrow_forward': ArrowRight,
  'arrow_back': ArrowLeft,
  'calendar_today': CalendarBlank,
  'rocket_launch': RocketLaunch,
  'add': Plus,
  'event_upcoming': CalendarBlank,
  'event_busy': XCircle,
  'visibility': Eye,
  'visibility_off': EyeSlash,
  'error': WarningCircle,
  'sync': ArrowsClockwise,
  'grid_view': SquaresFour,
  'alarm': Alarm,
  'smartphone': DeviceMobile,
  'school': GraduationCap,
  'hourglass_empty': Hourglass
};

// Distinct, vibrant colors per habit
const HABIT_COLORS = {
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

const PALETTE = [
  '#ec4899', '#8b5cf6', '#3b82f6', '#0ea5e9', '#14b8a6',
  '#10b981', '#f59e0b', '#f97316', '#ef4444'
];

function hashString(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const HABIT_DEFAULT_ICONS = {
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

export default function HabitIcon({ name, habitId, boxed = false, size = 20, className = '', color }) {
  const iconName = name || (habitId ? HABIT_DEFAULT_ICONS[habitId] : '') || 'star';
  const IconComponent = ICON_MAP[iconName] || Star;
  
  let hexColor = color;
  if (!hexColor) {
    if (habitId === 'overall') {
      hexColor = '#f43f5e';
    } else if (habitId && HABIT_COLORS[habitId]) {
      hexColor = HABIT_COLORS[habitId];
    } else if (iconName && HABIT_COLORS[iconName]) {
      hexColor = HABIT_COLORS[iconName];
    } else {
      const key = habitId || iconName || name || 'habit';
      const colorIndex = hashString(key) % PALETTE.length;
      hexColor = PALETTE[colorIndex];
    }
  }

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const bgRgba = `rgba(${r}, ${g}, ${b}, 0.2)`;

  if (boxed) {
    return (
      <div 
        className={`flex items-center justify-center shrink-0 rounded-full ${className}`}
        style={{
          width: size + 14,
          height: size + 14,
          backgroundColor: bgRgba,
          color: hexColor,
        }}
      >
        <IconComponent size={size} weight="fill" />
      </div>
    );
  }

  const hasTextColor = className && (className.includes('text-white') || className.includes('text-slate') || className.includes('text-primary'));

  return (
    <IconComponent 
      size={size} 
      weight="fill" 
      style={color ? { color } : (hasTextColor ? undefined : { color: hexColor })} 
      className={className} 
    />
  );
}


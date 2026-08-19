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
  'event_busy': XCircle, // Fallback
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

// Nice vibrant colors for the duotone/squircle effect
const PALETTE = [
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#0ea5e9', // sky
  '#14b8a6', // teal
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
];

// Helper to hash a string to a number
function hashString(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Hardcoded color distribution for predefined habits
const PREDEFINED_COLORS = {
  "wakeup": 0, "sleep": 1, "sleep_duration": 2, "workout": 3,
  "walking": 4, "water": 5, "protein": 6, "calories": 7,
  "deepwork": 8, "pomodoro": 0, "reading": 1, "study": 2,
  "screentime": 3, "meditation": 4, "journal": 5, "coldshower": 6,
  "mood": 7, "energy": 8, "alcoholfree": 0, "smokingfree": 1
};

/**
 * HabitIcon renders a premium, solid (or duotone) icon inside a colored squircle.
 * @param {string} name - Legacy material symbol name
 * @param {string} habitId - Used to stably pick a color from the palette
 * @param {boolean} boxed - If true, renders the full colored squircle background (default). If false, just renders the colored icon.
 * @param {number} size - Icon size in px (default 20)
 * @param {string} className - Extra classes for the wrapper
 */
export default function HabitIcon({ name, habitId, boxed = true, size = 20, className = '' }) {
  const IconComponent = ICON_MAP[name] || Star;
  
  // Stably pick a color based on habitId (fallback to a default if undefined)
  let hexColor = '#9ca3af'; // default gray
  if (habitId === 'overall') {
    hexColor = '#f43f5e'; // Rose for overall
  } else if (habitId) {
    if (PREDEFINED_COLORS[habitId] !== undefined) {
      hexColor = PALETTE[PREDEFINED_COLORS[habitId]];
    } else {
      const colorIndex = hashString(habitId) % PALETTE.length;
      hexColor = PALETTE[colorIndex];
    }
  }

  // Convert hex to rgba for the 15% opacity background
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const bgRgba = `rgba(${r}, ${g}, ${b}, 0.2)`;

  if (boxed) {
    return (
      <div 
        className={`flex items-center justify-center shrink-0 rounded-[10px] ${className}`}
        style={{
          width: size + 16, // Add padding around icon
          height: size + 16,
          backgroundColor: bgRgba,
          color: hexColor,
        }}
      >
        <IconComponent size={size} weight="fill" />
      </div>
    );
  }

  return (
    <IconComponent 
      size={size} 
      weight="fill" 
      style={{ color: hexColor }} 
      className={className} 
    />
  );
}

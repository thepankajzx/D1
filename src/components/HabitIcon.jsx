import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';

// Maps old Material Symbol names and custom icon IDs to Phosphor React components
const ICON_MAP = {
  'fitness_center': PhosphorIcons.Barbell,
  'self_improvement': PhosphorIcons.FlowerLotus,
  'water_drop': PhosphorIcons.Drop,
  'directions_run': PhosphorIcons.PersonSimpleRun,
  'directions_walk': PhosphorIcons.PersonSimpleWalk,
  'bicycle': PhosphorIcons.PersonSimpleBike,
  'swimming': PhosphorIcons.PersonSimpleSwim,
  'sneaker': PhosphorIcons.SneakerMove,
  'heartbeat': PhosphorIcons.Heartbeat,
  'local_fire_department': PhosphorIcons.Fire,
  'target': PhosphorIcons.Target,
  'schedule': PhosphorIcons.Clock,
  'schedule_filled': PhosphorIcons.Clock,
  'timer': PhosphorIcons.Timer,
  'restaurant': PhosphorIcons.ForkKnife,
  'local_dining': PhosphorIcons.ForkKnife,
  'menu_book': PhosphorIcons.BookOpenText,
  'book_bookmark': PhosphorIcons.BookBookmark,
  'psychology': PhosphorIcons.Brain,
  'bedtime': PhosphorIcons.Moon,
  'bed': PhosphorIcons.Bed,
  'sun': PhosphorIcons.Sun,
  'ac_unit': PhosphorIcons.Snowflake,
  'mood': PhosphorIcons.Smiley,
  'peace': PhosphorIcons.Peace,
  'sparkle': PhosphorIcons.Sparkle,
  'feather': PhosphorIcons.Feather,
  'leaf': PhosphorIcons.Leaf,
  'pill': PhosphorIcons.Pill,
  'shield_plus': PhosphorIcons.ShieldPlus,
  'heart': PhosphorIcons.Heart,
  'bolt': PhosphorIcons.Lightning,
  'no_drinks': PhosphorIcons.DropSlash,
  'smoke_free': PhosphorIcons.CigaretteSlash,
  'coffee': PhosphorIcons.Coffee,
  'egg': PhosphorIcons.Egg,
  'apple': PhosphorIcons.AppleLogo,
  'person': PhosphorIcons.User,
  'home': PhosphorIcons.House,
  'home_filled': PhosphorIcons.House,
  'home_outlined': PhosphorIcons.House,
  'insert_chart_filled': PhosphorIcons.ChartBar,
  'insert_chart_outlined': PhosphorIcons.ChartBar,
  'bar_chart': PhosphorIcons.ChartBar,
  'star': PhosphorIcons.Star,
  'crown': PhosphorIcons.Crown,
  'edit': PhosphorIcons.PencilSimple,
  'edit_note': PhosphorIcons.PencilSimple,
  'emoji_events': PhosphorIcons.Trophy,
  'trophy': PhosphorIcons.Trophy,
  'workspace_premium': PhosphorIcons.Medal,
  'medal': PhosphorIcons.Medal,
  'check': PhosphorIcons.CheckCircle,
  'check_circle': PhosphorIcons.CheckCircle,
  'done_all': PhosphorIcons.Checks,
  'checks': PhosphorIcons.Checks,
  'list_checks': PhosphorIcons.ListChecks,
  'laptop': PhosphorIcons.Laptop,
  'code': PhosphorIcons.Code,
  'briefcase': PhosphorIcons.Briefcase,
  'calendar': PhosphorIcons.CalendarBlank,
  'close': PhosphorIcons.XCircle,
  'delete': PhosphorIcons.Trash,
  'logout': PhosphorIcons.SignOut,
  'inbox': PhosphorIcons.Tray,
  'trending_down': PhosphorIcons.TrendDown,
  'trending_up': PhosphorIcons.TrendUp,
  'arrow_forward': PhosphorIcons.ArrowRight,
  'arrow_back': PhosphorIcons.ArrowLeft,
  'calendar_today': PhosphorIcons.CalendarBlank,
  'rocket_launch': PhosphorIcons.RocketLaunch,
  'add': PhosphorIcons.Plus,
  'event_upcoming': PhosphorIcons.CalendarBlank,
  'event_busy': PhosphorIcons.XCircle,
  'visibility': PhosphorIcons.Eye,
  'visibility_off': PhosphorIcons.EyeSlash,
  'error': PhosphorIcons.WarningCircle,
  'sync': PhosphorIcons.ArrowsClockwise,
  'grid_view': PhosphorIcons.SquaresFour,
  'alarm': PhosphorIcons.Alarm,
  'smartphone': PhosphorIcons.DeviceMobile,
  'school': PhosphorIcons.GraduationCap,
  'hourglass_empty': PhosphorIcons.Hourglass,
  'hourglass': PhosphorIcons.Hourglass,
  'palette': PhosphorIcons.Palette,
  'music_notes': PhosphorIcons.MusicNotes,
  'headphones': PhosphorIcons.Headphones,
  'globe': PhosphorIcons.Globe,
  'pen_nib': PhosphorIcons.PenNib,
  'camera': PhosphorIcons.Camera,
  'game': PhosphorIcons.GameController,
  'plane': PhosphorIcons.Airplane,
  'car': PhosphorIcons.Car,
  'tree': PhosphorIcons.Tree,
  'pet_dog': PhosphorIcons.Dog,
  'pet_cat': PhosphorIcons.Cat,
  'handshake': PhosphorIcons.Handshake,
  'currency_dollar': PhosphorIcons.CurrencyDollar,
  'piggy_bank': PhosphorIcons.PiggyBank,
  'coins': PhosphorIcons.Coins,
  'wallet': PhosphorIcons.Wallet,
  'basketball': PhosphorIcons.Basketball,
  'football': PhosphorIcons.Football,
  'soccer': PhosphorIcons.SoccerBall,
  'tennis': PhosphorIcons.TennisBall,
  'hands_praying': PhosphorIcons.HandsPraying,
  'yin_yang': PhosphorIcons.YinYang,
  'sun_horizon': PhosphorIcons.SunHorizon,
  'shower': PhosphorIcons.Shower,
  'tooth': PhosphorIcons.Tooth,
  'terminal': PhosphorIcons.Terminal,
  'push_pin': PhosphorIcons.PushPin,
  'flag': PhosphorIcons.Flag,
  'shield_check': PhosphorIcons.ShieldCheck,
  'paint_brush': PhosphorIcons.PaintBrush,
  'guitar': PhosphorIcons.Guitar,
  'microphone': PhosphorIcons.Microphone,
  'carrot': PhosphorIcons.Carrot,
  'fish': PhosphorIcons.Fish,
  'cookie': PhosphorIcons.Cookie,
  'broom': PhosphorIcons.Broom,
  'shirt_folded': PhosphorIcons.ShirtFolded,
  'plant': PhosphorIcons.Plant,
  'gift': PhosphorIcons.Gift,
  'confetti': PhosphorIcons.Confetti
};

export const getPhosphorIcon = (iconName) => {
  if (!iconName) return PhosphorIcons.Star;
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];
  if (PhosphorIcons[iconName]) return PhosphorIcons[iconName];
  // Check PascalCase
  const pascal = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  if (PhosphorIcons[pascal]) return PhosphorIcons[pascal];
  return PhosphorIcons.Star;
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
  
  // Perceived relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If color is excessively bright / washed out neon (e.g. bright green, yellow, neon cyan)
  if (lum > 0.58) {
    // Darken by 35% for the foreground icon so the inner shape is crisp & punchy
    const factor = 0.65;
    const darkR = Math.max(0, Math.min(255, Math.round(r * factor)));
    const darkG = Math.max(0, Math.min(255, Math.round(g * factor)));
    const darkB = Math.max(0, Math.min(255, Math.round(b * factor)));
    return `rgb(${darkR}, ${darkG}, ${darkB})`;
  }
  
  return hexColor;
}

export default function HabitIcon({ name, habitId, boxed = false, size = 20, className = '', color }) {
  const iconName = name || (habitId ? HABIT_DEFAULT_ICONS[habitId] : '') || 'star';
  const IconComponent = getPhosphorIcon(iconName);
  
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

  const cleanHex = hexColor && hexColor.startsWith('#') && hexColor.length === 7 ? hexColor : '#10b981';
  const r = parseInt(cleanHex.slice(1, 3), 16) || 16;
  const g = parseInt(cleanHex.slice(3, 5), 16) || 185;
  const b = parseInt(cleanHex.slice(5, 7), 16) || 129;
  
  // Ultra-soft airy tint (9%) + subtle crisp border (22%)
  const bgRgba = `rgba(${r}, ${g}, ${b}, 0.09)`;
  const borderRgba = `rgba(${r}, ${g}, ${b}, 0.22)`;
  const iconColor = getReadableIconColor(cleanHex);

  if (boxed) {
    return (
      <div 
        className={`flex items-center justify-center shrink-0 rounded-full ${className}`}
        style={{
          width: size + 14,
          height: size + 14,
          backgroundColor: bgRgba,
          border: `1px solid ${borderRgba}`,
          color: iconColor,
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
      style={color ? { color: iconColor } : (hasTextColor ? undefined : { color: iconColor })} 
      className={className} 
    />
  );
}


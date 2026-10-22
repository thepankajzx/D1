import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { 
  resolveHabitColor, 
  resolveHabitIcon, 
  getCanonicalHabitIconConfig,
  getReadableIconColor,
  getCanonicalRgbaColors,
  HABIT_DEFAULT_COLORS, 
  HABIT_DEFAULT_ICONS, 
  PALETTE, 
  hashString 
} from '../lib/habitColors';

export { 
  getReadableIconColor,
  getCanonicalRgbaColors,
  getCanonicalHabitIconConfig,
  HABIT_DEFAULT_COLORS, 
  HABIT_DEFAULT_ICONS, 
  PALETTE, 
  hashString 
};

// Map Google Material icon names to Phosphor Icon Components
const ICON_MAP = {
  // Existing common habit icons
  'fitness_center': PhosphorIcons.Barbell,
  'alarm': PhosphorIcons.Alarm,
  'bedtime': PhosphorIcons.Moon,
  'hourglass_empty': PhosphorIcons.HourglassSimple,
  'directions_walk': PhosphorIcons.Footprints,
  'water_drop': PhosphorIcons.Drop,
  'restaurant': PhosphorIcons.ForkKnife,
  'local_dining': PhosphorIcons.CookingPot,
  'psychology': PhosphorIcons.Brain,
  'timer': PhosphorIcons.Timer,
  'menu_book': PhosphorIcons.BookOpen,
  'school': PhosphorIcons.GraduationCap,
  'smartphone': PhosphorIcons.DeviceMobile,
  'self_improvement': PhosphorIcons.PersonSimpleWalk,
  'edit_note': PhosphorIcons.NotePencil,
  'ac_unit': PhosphorIcons.Snowflake,
  'mood': PhosphorIcons.Smiley,
  'bolt': PhosphorIcons.Lightning,
  'no_drinks': PhosphorIcons.Wine,
  'smoke_free': PhosphorIcons.CigaretteSlash,
  
  // Extra mapping
  'star': PhosphorIcons.Star,
  'shield': PhosphorIcons.Shield,
  'shield_check': PhosphorIcons.ShieldCheck,
  'target': PhosphorIcons.Target,
  'heart': PhosphorIcons.Heart,
  'coffee': PhosphorIcons.Coffee,
  'bicycle': PhosphorIcons.Bicycle,
  'music': PhosphorIcons.MusicNote,
  'sun': PhosphorIcons.Sun,
  'cat': PhosphorIcons.Cat,
  'dog': PhosphorIcons.Dog,
  'paw': PhosphorIcons.PawPrint,
  'rocket_launch': PhosphorIcons.RocketLaunch,
  'trophy': PhosphorIcons.Trophy,
  'crown': PhosphorIcons.Crown,
  'money': PhosphorIcons.CurrencyDollar,
  'check': PhosphorIcons.Check,
  'flame': PhosphorIcons.Flame,
  'sparkle': PhosphorIcons.Sparkle,
  'confetti': PhosphorIcons.Confetti
};

export const getPhosphorIcon = (iconName) => {
  if (!iconName) return PhosphorIcons.Star;
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];
  if (PhosphorIcons[iconName]) return PhosphorIcons[iconName];
  const pascal = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  if (PhosphorIcons[pascal]) return PhosphorIcons[pascal];
  return PhosphorIcons.Star;
};

/**
 * ONE GLOBAL HABIT ICON COMPONENT
 * Implements D1 Global Habit Icon Consistency Rule.
 * Renders the habit's immutable canonical visual identity:
 * - Canonical Icon (Phosphor / Material identifier)
 * - Canonical Icon Color (high-contrast readable foreground)
 * - Canonical Wrapper / Background Color & Border
 * - Canonical Wrapper Shape (circle / rounded-square)
 *
 * Screen-specific recoloring (e.g. text-white, !bg-rose-100) is strictly disallowed
 * so that habits maintain identical visual identity across every screen.
 */
export default function HabitIcon({ 
  habit, 
  name, 
  icon, 
  iconId, 
  habitId, 
  id, 
  color, 
  iconColor, 
  backgroundColor, 
  iconBackgroundColor, 
  iconStyle, 
  boxed = true, 
  size = 24, 
  className = '', 
  style = {},
  weight = 'fill'
}) {
  // 1. Resolve canonical configuration from habit object or direct props
  const targetObj = habit || {
    id: id || habitId,
    habitId: habitId || id,
    icon: icon || iconId || name,
    iconId: iconId || icon || name,
    color: color || iconColor,
    iconColor: iconColor || color,
    iconBackgroundColor: iconBackgroundColor || backgroundColor,
    iconStyle
  };

  const config = getCanonicalHabitIconConfig(targetObj);
  const IconComponent = getPhosphorIcon(config.iconId);
  const readableIconColor = getReadableIconColor(config.iconColor);

  // Filter out any screen-specific recoloring classes that attempt to override identity
  // e.g. text-white, text-slate-*, bg-rose-*, text-rose-*, bg-emerald-*, text-emerald-*
  const sanitizedClassName = className
    ? className
        .replace(/(!?text-(white|slate-\d+|rose-\d+|emerald-\d+|amber-\d+|primary|blue-\d+))/g, '')
        .replace(/(!?bg-(rose-\d+|emerald-\d+|amber-\d+|slate-\d+|blue-\d+))/g, '')
        .trim()
    : '';

  // 2. Unboxed mode (explicitly requested naked glyph)
  if (boxed === false) {
    return (
      <IconComponent 
        size={size} 
        weight={weight} 
        style={{ ...style, color: readableIconColor }} 
        className={sanitizedClassName} 
      />
    );
  }

  // 3. Boxed / Badge mode (Default Canonical Representation)
  // Calculate proportional dimensions
  let badgeSize = size;
  let glyphSize = Math.max(10, Math.round(size * 0.54));

  // If size passed was the small glyph dimension (legacy callers passing size <= 20)
  if (size <= 22) {
    badgeSize = size + 12;
    glyphSize = size;
  }

  const isSquare = config.iconStyle === 'rounded-square';
  const shapeClass = isSquare ? 'rounded-xl' : 'rounded-full';

  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 ${shapeClass} ${sanitizedClassName}`}
      style={{
        width: badgeSize,
        height: badgeSize,
        minWidth: badgeSize,
        minHeight: badgeSize,
        backgroundColor: config.iconBackgroundColor,
        border: `1px solid ${config.borderColor}`,
        color: readableIconColor,
        ...style
      }}
    >
      <IconComponent size={glyphSize} weight={weight} style={{ color: readableIconColor }} />
    </div>
  );
}

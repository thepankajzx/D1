import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import {
  Barbell, Alarm, Moon, HourglassSimple, Footprints, Drop, ForkKnife,
  CookingPot, Brain, Timer, BookOpen, GraduationCap, DeviceMobile,
  PersonSimpleWalk, NotePencil, Snowflake, Smiley, Lightning, Wine,
  CigaretteSlash, Star, Shield, ShieldCheck, Target, Heart, Coffee,
  Bicycle, MusicNote, Sun, Cat, Dog, PawPrint, RocketLaunch, Trophy,
  Crown, CurrencyDollar, Check, Flame, Sparkle, Confetti, CheckCircle,
  Clock, Compass, Eye, Gear, Leaf, Pencil, PottedPlant, Question,
  Tree, User, Wallet, Wrench, Bed, Pill, Waves, Feather, Bookmarks,
  PenNib, Briefcase, Laptop, Desktop, ChartLineUp, Bell, Heartbeat, FirstAid
} from '@phosphor-icons/react';
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

const ICON_COMPONENTS = {
  Barbell, Alarm, Moon, HourglassSimple, Footprints, Drop, ForkKnife,
  CookingPot, Brain, Timer, BookOpen, GraduationCap, DeviceMobile,
  PersonSimpleWalk, NotePencil, Snowflake, Smiley, Lightning, Wine,
  CigaretteSlash, Star, Shield, ShieldCheck, Target, Heart, Coffee,
  Bicycle, MusicNote, Sun, Cat, Dog, PawPrint, RocketLaunch, Trophy,
  Crown, CurrencyDollar, Check, Flame, Sparkle, Confetti, CheckCircle,
  Clock, Compass, Eye, Gear, Leaf, Pencil, PottedPlant, Question,
  Tree, User, Wallet, Wrench, Bed, Pill, Waves, Feather, Bookmarks,
  PenNib, Briefcase, Laptop, Desktop, ChartLineUp, Bell, Heartbeat, FirstAid
};

// Map Google Material icon names to Phosphor Icon Components
const ICON_MAP = {
  // Existing common habit icons
  'fitness_center': Barbell,
  'alarm': Alarm,
  'bedtime': Moon,
  'hourglass_empty': HourglassSimple,
  'directions_walk': Footprints,
  'water_drop': Drop,
  'restaurant': ForkKnife,
  'local_dining': CookingPot,
  'psychology': Brain,
  'timer': Timer,
  'menu_book': BookOpen,
  'school': GraduationCap,
  'smartphone': DeviceMobile,
  'self_improvement': PersonSimpleWalk,
  'edit_note': NotePencil,
  'ac_unit': Snowflake,
  'mood': Smiley,
  'bolt': Lightning,
  'no_drinks': Wine,
  'smoke_free': CigaretteSlash,
  
  // Extra mapping
  'star': Star,
  'shield': Shield,
  'shield_check': ShieldCheck,
  'target': Target,
  'heart': Heart,
  'coffee': Coffee,
  'bicycle': Bicycle,
  'music': MusicNote,
  'sun': Sun,
  'cat': Cat,
  'dog': Dog,
  'paw': PawPrint,
  'rocket_launch': RocketLaunch,
  'trophy': Trophy,
  'crown': Crown,
  'money': CurrencyDollar,
  'check': Check,
  'flame': Flame,
  'sparkle': Sparkle,
  'confetti': Confetti
};

export const getPhosphorIcon = (iconName) => {
  if (!iconName) return PhosphorIcons.Star || Star;
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];
  if (ICON_COMPONENTS[iconName]) return ICON_COMPONENTS[iconName];
  if (PhosphorIcons[iconName]) return PhosphorIcons[iconName];

  // Try PascalCase transformation (e.g. 'rocket_launch' -> 'RocketLaunch', 'barbell' -> 'Barbell')
  const pascal = iconName.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  if (ICON_COMPONENTS[pascal]) return ICON_COMPONENTS[pascal];
  if (PhosphorIcons[pascal]) return PhosphorIcons[pascal];

  // Try PascalCase without lowering remaining chars (e.g. 'DeviceMobile' -> 'DeviceMobile')
  const directPascal = iconName.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  if (PhosphorIcons[directPascal]) return PhosphorIcons[directPascal];

  // Case-insensitive lookup against PhosphorIcons keys
  const clean = iconName.toLowerCase().replace(/[-_\s]/g, '');
  const matchedKey = Object.keys(PhosphorIcons).find(k => k.toLowerCase() === clean);
  if (matchedKey && PhosphorIcons[matchedKey]) {
    return PhosphorIcons[matchedKey];
  }

  return PhosphorIcons.Star || Star;
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

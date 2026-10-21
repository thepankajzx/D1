import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { resolveHabitColor, resolveHabitIcon, HABIT_DEFAULT_COLORS, HABIT_DEFAULT_ICONS, PALETTE, hashString } from '../lib/habitColors';

export { HABIT_DEFAULT_COLORS, HABIT_DEFAULT_ICONS, PALETTE, hashString };

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
  
  if (lum > 0.58) {
    const factor = 0.65;
    const darkR = Math.max(0, Math.min(255, Math.round(r * factor)));
    const darkG = Math.max(0, Math.min(255, Math.round(g * factor)));
    const darkB = Math.max(0, Math.min(255, Math.round(b * factor)));
    return `rgb(${darkR}, ${darkG}, ${darkB})`;
  }
  
  return hexColor;
}

export default function HabitIcon({ name, habitId, boxed = false, size = 20, className = '', color }) {
  const iconName = resolveHabitIcon({ id: habitId, icon: name });
  const IconComponent = getPhosphorIcon(iconName);
  const cleanHex = resolveHabitColor({ id: habitId, icon: iconName, color });

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

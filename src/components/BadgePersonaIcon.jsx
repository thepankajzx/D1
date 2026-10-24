// src/components/BadgePersonaIcon.jsx
import React from 'react';
import {
  Compass,
  Plant,
  Sparkle,
  Sword,
  Target,
  Crown,
  ShieldStar,
  ArrowsCounterClockwise,
  Flame,
  Lightning,
  RocketLaunch,
  Trophy,
  ShieldCheck,
  CheckCircle,
  Crosshair,
  Prohibit,
  CircleDashed,
  BatteryCharging,
  TrendUp,
  Cube,
  Waves,
  ShieldChevron,
  Brain,
  Diamond,
  Anchor,
  Fire,
  Lock
} from '@phosphor-icons/react';

const ICON_MAP = {
  Compass,
  Plant,
  Sparkle,
  Sword,
  Target,
  Crown,
  ShieldStar,
  ArrowsCounterClockwise,
  Flame,
  Lightning,
  RocketLaunch,
  Trophy,
  ShieldCheck,
  CheckCircle,
  Crosshair,
  Prohibit,
  CircleDashed,
  BatteryCharging,
  TrendUp,
  Cube,
  Waves,
  ShieldChevron,
  Brain,
  Diamond,
  Anchor,
  Fire,
  Lock
};

export default function BadgePersonaIcon({ 
  iconName = 'Crown', 
  size = 16, 
  weight = 'fill', 
  className = '' 
}) {
  const Component = ICON_MAP[iconName] || Trophy;
  return <Component size={size} weight={weight} className={className} />;
}

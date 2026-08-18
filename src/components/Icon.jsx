import React from 'react';
import {
  PencilSimple, Star, Fire, Heart, Trophy, PersonSimpleRun, Clock,
  WarningCircle, ArrowsClockwise, CalendarBlank, ChartBar, ArrowRight,
  CalendarStar, X, EyeSlash, Eye, CornersOut, Prohibit, TrendDown, TrendUp,
  RocketLaunch, Plus, Checks, Crown, ArrowLeft, Check, SignOut, Tray, Trash,
  Alarm, Moon, Hourglass, Barbell, PersonSimpleWalk, Drop, ForkKnife, Brain,
  Timer, BookOpen, GraduationCap, DeviceMobile, Person, NotePencil, Snowflake,
  Smiley, Lightning, House
} from '@phosphor-icons/react';

const ICON_MAP = {
  'edit': PencilSimple,
  'star': Star,
  'local_fire_department': Fire,
  'favorite': Heart,
  'emoji_events': Trophy,
  'directions_run': PersonSimpleRun,
  'schedule': Clock,
  'schedule_filled': Clock,
  'error': WarningCircle,
  'sync': ArrowsClockwise,
  'calendar_today': CalendarBlank,
  'bar_chart': ChartBar,
  'arrow_forward': ArrowRight,
  'event_upcoming': CalendarStar,
  'close': X,
  'visibility_off': EyeSlash,
  'visibility': Eye,
  'fullscreen': CornersOut,
  'event_busy': Prohibit,
  'trending_down': TrendDown,
  'trending_up': TrendUp,
  'rocket_launch': RocketLaunch,
  'add': Plus,
  'done_all': Checks,
  'workspace_premium': Crown,
  'arrow_back': ArrowLeft,
  'check': Check,
  'logout': SignOut,
  'inbox': Tray,
  'delete': Trash,
  'alarm': Alarm,
  'bedtime': Moon,
  'hourglass_empty': Hourglass,
  'fitness_center': Barbell,
  'directions_walk': PersonSimpleWalk,
  'water_drop': Drop,
  'restaurant': ForkKnife,
  'local_dining': ForkKnife,
  'psychology': Brain,
  'timer': Timer,
  'menu_book': BookOpen,
  'school': GraduationCap,
  'smartphone': DeviceMobile,
  'self_improvement': Person,
  'edit_note': NotePencil,
  'ac_unit': Snowflake,
  'mood': Smiley,
  'bolt': Lightning,
  'no_drinks': Prohibit,
  'smoke_free': Prohibit,
  'person': Person,
  'home': House,
  'home_filled': House,
  'home_outlined': House,
  'insert_chart_filled': ChartBar,
  'insert_chart_outlined': ChartBar,
};

export default function Icon({ name, className = '', style = {}, filled = false }) {
  const IconComponent = ICON_MAP[name];
  
  if (!IconComponent) {
    console.warn(`Icon ${name} not mapped to Phosphor Icon`);
    // Fallback to a default icon
    const FallbackIcon = Star;
    return <FallbackIcon className={className} style={{ ...style, width: '1em', height: '1em', display: 'inline-block', verticalAlign: 'middle' }} weight="duotone" />;
  }
  
  return (
    <IconComponent 
      className={className} 
      style={{
        width: '1em',
        height: '1em',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }} 
      weight="duotone"
    />
  );
}

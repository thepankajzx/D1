import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateStreakData } from '../lib/streakEngine';
import { evaluateUserBadges } from '../lib/badgeEngine';
import HabitIcon from './HabitIcon';
import BadgePersonaIcon from './BadgePersonaIcon';
import { Lightning, CheckCircle, Target, Flame, ChartLineUp, Sparkle } from '@phosphor-icons/react';

export const DEFAULT_HEADER_PILLS_CONFIG = {
  enabled: true,
  pill1: 'persona_badge', // 'persona_badge' | 'weekly_avg' | 'streak' | 'monthly_avg' | 'perfect_days' | 'today_done' | 'focus_habit' | 'none'
  pill2: 'today_done',
  pill3: 'weekly_avg',
  focusHabitId: '',
  selectedBadgeId: ''
};

export function getHeaderPillsConfig() {
  try {
    const raw = localStorage.getItem('d1_header_pills_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy 'resilience' pill to 'weekly_avg'
      if (parsed.pill1 === 'resilience') parsed.pill1 = 'persona_badge';
      if (parsed.pill2 === 'resilience') parsed.pill2 = 'today_done';
      if (parsed.pill3 === 'resilience') parsed.pill3 = 'weekly_avg';
      return { ...DEFAULT_HEADER_PILLS_CONFIG, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_HEADER_PILLS_CONFIG;
}

export function saveHeaderPillsConfig(newConfig) {
  try {
    localStorage.setItem('d1_header_pills_config', JSON.stringify(newConfig));
    window.dispatchEvent(new Event('d1_header_pills_updated'));
  } catch (e) {}
}

export default function HeaderPillWidgets({ forceShow = false }) {
  const navigate = useNavigate();
  const { isHinglish } = useLanguage();
  const { allSummaries = [], habits = [], streakTrackingEnabled = false } = useData();
  const [config, setConfig] = useState(getHeaderPillsConfig);
  const [expandedSlot, setExpandedSlot] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setConfig(getHeaderPillsConfig());
    window.addEventListener('d1_header_pills_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('d1_header_pills_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Auto-collapse when scrolling, touching anywhere outside, or idle
  useEffect(() => {
    if (!expandedSlot) return;

    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExpandedSlot(null);
      }
    };

    const handleScroll = () => {
      setExpandedSlot(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });

    const bindTimer = setTimeout(() => {
      document.addEventListener('click', handleOutside);
      document.addEventListener('touchstart', handleOutside, { passive: true });
    }, 100);

    const autoCloseTimer = setTimeout(() => {
      setExpandedSlot(null);
    }, 4500);

    return () => {
      clearTimeout(bindTimer);
      clearTimeout(autoCloseTimer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      document.removeEventListener('click', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [expandedSlot]);

  // Evaluate user badges
  const badgeState = useMemo(() => {
    return evaluateUserBadges(allSummaries, habits, streakTrackingEnabled);
  }, [allSummaries, habits, streakTrackingEnabled]);

  // Compute live data for each metric
  const metrics = useMemo(() => {
    // Current Local Date String (YYYY-MM-DD)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Weekly Average (last 7 valid recorded days)
    const validRecent = (allSummaries || []).filter(s => typeof s.overallScore === 'number' && s.overallScore !== null).slice(0, 7);
    const weeklyAvg = validRecent.length > 0 
      ? Math.round(validRecent.reduce((acc, s) => acc + s.overallScore, 0) / validRecent.length)
      : 0;

    // 2. Monthly Consistency (last 30 valid recorded days)
    const validMonth = (allSummaries || []).filter(s => typeof s.overallScore === 'number' && s.overallScore !== null).slice(0, 30);
    const monthlyAvg = validMonth.length > 0 
      ? Math.round(validMonth.reduce((acc, s) => acc + s.overallScore, 0) / validMonth.length)
      : 0;

    // 3. Perfect 100% Days (Total flawless days recorded)
    const perfectDaysCount = (allSummaries || []).filter(s => Number(s.overallScore) >= 100).length;

    // 4. Composite Streak (only if enabled)
    let currentStreak = 0;
    if (streakTrackingEnabled) {
      try {
        const streakData = calculateStreakData('all', allSummaries || []);
        currentStreak = streakData.currentStreak || 0;
      } catch (e) {}
    }

    // 5. Today's Completed Habits (STRICT MATCH with todayStr — NEVER fall back to yesterday)
    const todaySavedSummary = (allSummaries || []).find(s => s.id === todayStr || s.date === todayStr);
    
    // Also check live uncommitted cache for today's active entries
    let liveTodayCount = 0;
    try {
      const uid = localStorage.getItem('d1_current_uid') || '';
      const cached = localStorage.getItem(`entries_${uid}_${todayStr}`) || localStorage.getItem(`entries_${todayStr}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) liveTodayCount = parsed.length;
      }
    } catch (e) {}

    const todayCompleted = todaySavedSummary ? (todaySavedSummary.habitsCompleted ?? liveTodayCount) : liveTodayCount;
    const todayTotal = todaySavedSummary?.habitsTotal || habits?.length || (todayCompleted > 0 ? todayCompleted : 0);
    const todayPct = todayTotal > 0 ? Math.min(100, Math.round((todayCompleted / todayTotal) * 100)) : 0;

    // 6. Focus / Specific Habit
    const focusHabit = (config.focusHabitId && habits.find(h => h.id === config.focusHabitId)) || habits[0];
    const focusStreak = (focusHabit && streakTrackingEnabled) 
      ? calculateStreakData(focusHabit.id, allSummaries || []).currentStreak 
      : 0;
    const focusScore = todaySavedSummary?.habitScores?.[focusHabit?.id];
    const focusVal = focusScore !== undefined 
      ? `${focusScore}%` 
      : (focusStreak > 0 ? `${focusStreak}d` : (focusHabit ? (focusHabit.name.length > 8 ? focusHabit.name.slice(0, 8) + '…' : focusHabit.name) : ''));

    // 7. Active Persona Badge / Title
    const activeBadge = (config.selectedBadgeId && badgeState.allBadges.find(b => b.id === config.selectedBadgeId))
      || badgeState.topBadge
      || badgeState.allBadges[0];
    const personaTitle = activeBadge 
      ? (isHinglish ? (activeBadge.hindiTitle || activeBadge.persona) : activeBadge.persona) 
      : 'Genesis';

    return {
      persona_badge: {
        id: 'persona_badge',
        shortName: isHinglish ? 'बैज' : 'Badge',
        value: personaTitle,
        fullLabel: `${isHinglish ? 'बैज' : 'Badge'}: ${personaTitle}`,
        renderIcon: (isExpanded) => (
          <BadgePersonaIcon
            iconName={activeBadge?.iconName || 'Crown'}
            size={15}
            weight="fill"
            className={`${activeBadge?.colorText || 'text-amber-500'} shrink-0`}
          />
        ),
        route: '/streak-milestones',
        colorBorder: activeBadge?.borderColor ? `${activeBadge.borderColor} ring-amber-400/30` : 'border-amber-400/50 dark:border-amber-500/40 ring-amber-400/30'
      },
      today_done: {
        id: 'today_done',
        shortName: isHinglish ? 'आज' : 'Today',
        value: `${todayPct}%`,
        fullLabel: `${isHinglish ? 'आज की प्रगति' : "Today's Completion"}: ${todayCompleted}/${todayTotal} (${todayPct}%)`,
        renderIcon: (isExpanded) => (
          <CheckCircle size={15} weight="fill" className="text-blue-500 shrink-0" />
        ),
        route: '/',
        colorBorder: 'border-blue-400/50 dark:border-blue-500/40 ring-blue-400/30'
      },
      weekly_avg: {
        id: 'weekly_avg',
        shortName: isHinglish ? 'साप्ताहिक' : 'Weekly',
        value: `${weeklyAvg}%`,
        fullLabel: `${isHinglish ? 'साप्ताहिक औसत' : 'Weekly Avg'}: ${weeklyAvg}%`,
        renderIcon: (isExpanded) => (
          <Lightning size={15} weight="fill" className="text-amber-500 shrink-0" />
        ),
        route: '/analytics',
        colorBorder: 'border-amber-400/50 dark:border-amber-500/40 ring-amber-400/30'
      },
      monthly_avg: {
        id: 'monthly_avg',
        shortName: isHinglish ? 'मासिक' : 'Monthly',
        value: `${monthlyAvg}%`,
        fullLabel: `${isHinglish ? '30-दिन औसत' : '30-Day Avg'}: ${monthlyAvg}%`,
        renderIcon: (isExpanded) => (
          <ChartLineUp size={15} weight="fill" className="text-indigo-500 shrink-0" />
        ),
        route: '/analytics',
        colorBorder: 'border-indigo-400/50 dark:border-indigo-500/40 ring-indigo-400/30'
      },
      perfect_days: {
        id: 'perfect_days',
        shortName: isHinglish ? 'परफेक्ट' : 'Perfect',
        value: `${perfectDaysCount}d`,
        fullLabel: `${isHinglish ? 'शत-प्रतिशत दिन' : '100% Days'}: ${perfectDaysCount}d`,
        renderIcon: (isExpanded) => (
          <Sparkle size={15} weight="fill" className="text-teal-500 shrink-0" />
        ),
        route: '/streaks',
        colorBorder: 'border-teal-400/50 dark:border-teal-500/40 ring-teal-400/30'
      },
      streak: {
        id: 'streak',
        shortName: isHinglish ? 'स्ट्रीक' : 'Streak',
        value: `${currentStreak}d`,
        fullLabel: `${isHinglish ? 'सक्रिय स्ट्रीक' : 'Active Streak'}: ${currentStreak}d`,
        renderIcon: (isExpanded) => (
          <span className="text-[14px] leading-none select-none shrink-0" role="img" aria-label="streak">🔥</span>
        ),
        route: '/streaks',
        colorBorder: 'border-orange-400/50 dark:border-orange-500/40 ring-orange-400/30'
      },
      focus_habit: {
        id: 'focus_habit',
        shortName: isHinglish ? 'फोकस' : 'Focus',
        value: focusVal,
        fullLabel: `${isHinglish ? 'फोकस हैबिट' : 'Focus Habit'}: ${focusHabit ? focusHabit.name : 'Habit'}`,
        renderIcon: (isExpanded) => (
          focusHabit ? (
            <HabitIcon habit={focusHabit} size={15} boxed={false} weight="fill" />
          ) : (
            <Target size={15} weight="bold" className="text-rose-500 shrink-0" />
          )
        ),
        route: focusHabit ? `/analytics/deep-dive?habitId=${focusHabit.id}` : '/deep-dive',
        colorBorder: 'border-rose-400/50 dark:border-rose-500/40 ring-rose-400/30'
      }
    };
  }, [allSummaries, habits, config.focusHabitId, config.selectedBadgeId, badgeState, streakTrackingEnabled, isHinglish]);

  if (!config.enabled && !forceShow) return null;

  // Active pill slots from user settings
  const slots = [
    { slotId: 'pill1', type: config.pill1 },
    { slotId: 'pill2', type: config.pill2 },
    { slotId: 'pill3', type: config.pill3 }
  ].filter(s => {
    if (!s.type || s.type === 'none') return false;
    // Hide streak slot completely if streak tracking is disabled
    if (s.type === 'streak' && !streakTrackingEnabled) return false;
    return Boolean(metrics[s.type]);
  });

  if (slots.length === 0) return null;

  const handlePillClick = (e, slotId, type) => {
    e.stopPropagation();
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}

    if (expandedSlot !== slotId) {
      // 1st Tap: Expand this specific slot into pill revealing its label
      setExpandedSlot(slotId);
    } else {
      // 2nd Tap: Navigate to destination
      const item = metrics[type];
      if (item?.route) {
        navigate(item.route);
      }
      setExpandedSlot(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 select-none pointer-events-auto"
      style={{ zIndex: 10 }}
    >
      {slots.map(({ slotId, type }) => {
        const item = metrics[type];
        if (!item) return null;
        const isExpanded = expandedSlot === slotId;
        const iconElement = item.renderIcon(isExpanded);

        return (
          <button
            key={slotId}
            type="button"
            onClick={(e) => handlePillClick(e, slotId, type)}
            className={`h-[28px] rounded-full flex items-center transition-all duration-300 ease-out cursor-pointer select-none shadow-2xs active:scale-95 ${
              isExpanded 
                ? `px-2.5 gap-1.5 bg-white dark:bg-[#1a2130] text-slate-900 dark:text-white border ${item.colorBorder} ring-1`
                : `w-[28px] justify-center p-0 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-[#131722] dark:hover:bg-[#181e2b] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800`
            }`}
            title={item.fullLabel || item.shortName}
          >
            {iconElement}
            <div
              className={`flex items-center gap-1 leading-none whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
                isExpanded ? 'max-w-[160px] opacity-100 ml-0.5' : 'max-w-0 opacity-0 ml-0'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {item.shortName}
              </span>
              {item.value && (
                <span className="text-[11px] font-black text-slate-900 dark:text-white">
                  {item.value}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

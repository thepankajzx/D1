import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { calculateRecoveryScore } from '../lib/recoveryAnalytics';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import ProModal from '../components/ProModal';
import {
  ShieldCheck, Flame, Trophy, Star, CheckCircle,
  XCircle, HourglassSimple, Sparkle, ArrowRight,
  Info, CalendarCheck, TrendUp, TrendDown, ArrowLeft,
  CaretDown, CaretUp, CaretRight, X, Warning, Calendar,
  Lightning, Books, Target, LinkSimple, ArrowsLeftRight,
  Check, Lock, Crown, Lightbulb, Article, Play, Heartbeat
} from '@phosphor-icons/react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Global helper to format all numbers, percentages, and averages
 * strictly to at most 1 decimal place without floating point artifacts.
 * e.g., 60 -> "60", 60.8333 -> "60.8", -3.600000000014 -> "-3.6"
 */
function formatNum1(val, fallback = '0') {
  if (val === null || val === undefined || isNaN(val)) return String(fallback);
  const n = Number(val);
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const SAMPLE_WORKOUT_HABIT = {
  id: 'sample_workout', name: 'Daily Workout', icon: 'fitness_center', category: 'Fitness',
  scoringType: 'numeric', direction: 'higher_is_better', targetValue: 45, target0: 10,
  userTarget100: 45, userTarget0: 10, unit: 'minutes', defaultUnit: 'minutes', priorityRank: 1,
  color: '#3b82f6'
};

export default function HabitDiagnostics() {
  const query = useQuery();
  const habitIdParam = query.get('habitId');
  const navigate = useNavigate();
  const { habits, allSummaries, userDoc } = useData();
  const { isHinglish } = useLanguage();

  const [periodDays, setPeriodDays] = useState(30);
  const [showHabitPicker, setShowHabitPicker] = useState(false);
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [activeArticleModal, setActiveArticleModal] = useState(null);
  const [showDiagnosticGuide, setShowDiagnosticGuide] = useState(false);
  const [guideTab, setGuideTab] = useState('friction'); // 'friction' | 'ripple' | 'timing'
  const [expandedMisses, setExpandedMisses] = useState([]);
  const [isLogDropdownOpen, setIsLogDropdownOpen] = useState(false);

  // Always start at top of page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [habitIdParam]);

  // Tier 2 (14 Days) Unlock Check
  const trackedDaysCount = (allSummaries || []).length;
  const isLocked = trackedDaysCount < 14;
  const daysRemaining = Math.max(0, 14 - trackedDaysCount);

  // Active user habits
  const activeHabits = useMemo(() => {
    return (habits || []).filter(h => !h.archived);
  }, [habits]);

  // Determine current active habit (defaults to first habit if none provided)
  const isSamplePreview = habitIdParam === 'sample_workout' || String(habitIdParam || '').startsWith('sample_');
  
  const habit = useMemo(() => {
    if (isSamplePreview || (isLocked && !habitIdParam && activeHabits.length === 0)) {
      return SAMPLE_WORKOUT_HABIT;
    }
    if (habitIdParam) {
      const found = (habits || []).find(h => h.id === habitIdParam);
      if (found) return found;
      const seedFound = (HABITS_SEED_DATA || []).find(h => h.id === habitIdParam);
      if (seedFound) return seedFound;
    }
    return activeHabits[0] || (HABITS_SEED_DATA || [])[0] || SAMPLE_WORKOUT_HABIT;
  }, [habits, habitIdParam, isSamplePreview, isLocked, activeHabits]);

  // Handle habit switch
  const handleSelectHabit = (hId) => {
    if (navigator.vibrate) navigator.vibrate(30);
    navigate(`/analytics/diagnose?habitId=${hId}`);
    setShowHabitPicker(false);
  };

  // Resolved summaries
  // Check if real tracking entries exist for this habit
  const hasRealData = useMemo(() => {
    if (isSamplePreview || !allSummaries || allSummaries.length === 0 || !habit?.id) return false;
    return allSummaries.some(s => s.habitScores && s.habitScores[habit.id] !== undefined);
  }, [allSummaries, habit, isSamplePreview]);

  // Resolved summaries
  const resolvedSummaries = useMemo(() => {
    if (!hasRealData) {
      const today = new Date();
      const vals = [45,45,50,0,45,0,0,45,50,55,45,50,60,45,50,55,45,60,50,45,35,45,50,60,0,45,50,55,60,45];
      const hId = habit?.id || 'sample_workout';
      return vals.map((val, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (vals.length - 1 - i));
        const dateStr = d.toISOString().split('T')[0];
        const score = val >= 45 ? 100 : val <= 0 ? 0 : Math.round(((val) / 45) * 100);
        return {
          id: dateStr,
          date: dateStr,
          overallScore: score,
          habitScores: { [hId]: score },
          scores: { [hId]: score },
          habitValues: { [hId]: val },
          values: { [hId]: val },
          habitsCompleted: score >= 60 ? 1 : 0,
          habitsTotal: 1
        };
      });
    }
    return allSummaries;
  }, [hasRealData, allSummaries, habit]);

  // Date series for timeframe
  const dateSeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [periodDays]);

  // Summary map
  const summaryMap = useMemo(() => {
    const map = new Map();
    (resolvedSummaries || []).forEach(s => {
      if (s?.date || s?.id) map.set(s.date || s.id, s);
    });
    return map;
  }, [resolvedSummaries]);

  // Recovery & Resilience Stats
  const recoveryData = useMemo(() => {
    if (!habit || !resolvedSummaries) return {};
    return calculateRecoveryScore(resolvedSummaries, habit.id, 7, periodDays, 70, habit.createdAt);
  }, [habit, resolvedSummaries, periodDays]);

  const { recoveryScore = (hasRealData ? 100 : 85), totalMisses = (hasRealData ? (recoveryData.totalMisses || 0) : 4), misses = [] } = recoveryData;

  // Previous period recovery score to calculate live resilience delta (clean 1-decimal)
  const resilienceDelta = useMemo(() => {
    if (!hasRealData || !habit) return 6;
    const prevData = calculateRecoveryScore(resolvedSummaries, habit.id, 7, periodDays * 2, 70, habit.createdAt);
    const prevScore = prevData?.recoveryScore ?? recoveryScore;
    const rawDiff = (recoveryScore || 0) - (prevScore || 0);
    return Math.round(rawDiff * 10) / 10;
  }, [hasRealData, habit, resolvedSummaries, periodDays, recoveryScore]);

  // 1. TIMING ANALYSIS (Best Day, Vulnerable Day, Weekday vs Weekend)
  const timingAnalysis = useMemo(() => {
    const dayStats = [
      { day: 0, name: 'Sunday', short: 'Sun', count: 0, totalScore: 0, misses: 0 },
      { day: 1, name: 'Monday', short: 'Mon', count: 0, totalScore: 0, misses: 0 },
      { day: 2, name: 'Tuesday', short: 'Tue', count: 0, totalScore: 0, misses: 0 },
      { day: 3, name: 'Wednesday', short: 'Wed', count: 0, totalScore: 0, misses: 0 },
      { day: 4, name: 'Thursday', short: 'Thu', count: 0, totalScore: 0, misses: 0 },
      { day: 5, name: 'Friday', short: 'Fri', count: 0, totalScore: 0, misses: 0 },
      { day: 6, name: 'Saturday', short: 'Sat', count: 0, totalScore: 0, misses: 0 },
    ];

    let weekdayScores = [];
    let weekendScores = [];
    let totalTracked = 0;
    let completedDays = 0;

    dateSeries.forEach(dStr => {
      const dObj = new Date(dStr + 'T00:00:00');
      const dIdx = dObj.getDay();
      const sum = summaryMap.get(dStr);
      const score = sum?.habitScores?.[habit?.id] ?? (sum?.scores?.[habit?.id] ?? 0);
      
      dayStats[dIdx].count++;
      dayStats[dIdx].totalScore += score;
      if (score === 0 || score < 60) dayStats[dIdx].misses++;
      if (score >= 60) completedDays++;
      totalTracked++;

      if (dIdx >= 1 && dIdx <= 5) {
        weekdayScores.push(score);
      } else {
        weekendScores.push(score);
      }
    });

    const orderedDays = dayStats.map(d => ({
      ...d,
      avg: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
      missRate: d.count > 0 ? Math.round((d.misses / d.count) * 100) : 0
    }));

    const sortedBest = [...orderedDays].sort((a, b) => b.avg - a.avg);
    const bestDay = sortedBest[0] || orderedDays[2];

    const sortedWorst = [...orderedDays].sort((a, b) => b.misses - a.misses || a.avg - b.avg);
    const vulnerableDay = sortedWorst[0] || orderedDays[0];

    const weekdayAvg = weekdayScores.length > 0
      ? Math.round(weekdayScores.reduce((a, b) => a + b, 0) / weekdayScores.length)
      : 0;
    const weekendAvg = weekendScores.length > 0
      ? Math.round(weekendScores.reduce((a, b) => a + b, 0) / weekendScores.length)
      : 0;

    const completionRate = totalTracked > 0 ? Math.round((completedDays / totalTracked) * 100) : 0;

    return {
      orderedDays,
      bestDay,
      vulnerableDay,
      weekdayAvg,
      weekendAvg,
      completionRate,
      totalTracked,
      completedDays
    };
  }, [dateSeries, summaryMap, habit]);

  // 2. STREAK BREAKS & GAPS TIMELINE
  const streakGapsData = useMemo(() => {
    let currentStreak = 0;
    let longestStreak = 0;
    let gaps = [];
    let currentGapLength = 0;
    let lastMissDate = null;

    dateSeries.forEach((dStr) => {
      const sum = summaryMap.get(dStr);
      const score = sum?.habitScores?.[habit?.id] ?? (sum?.scores?.[habit?.id] ?? 0);
      const isSuccess = score >= 60;

      if (isSuccess) {
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        if (currentGapLength > 0) {
          gaps.push({
            startDate: lastMissDate,
            endDate: dStr,
            duration: currentGapLength,
            recovered: true
          });
          currentGapLength = 0;
          lastMissDate = null;
        }
      } else {
        currentStreak = 0;
        currentGapLength++;
        if (!lastMissDate) lastMissDate = dStr;
      }
    });

    if (currentGapLength > 0) {
      gaps.push({
        startDate: lastMissDate,
        endDate: dateSeries[dateSeries.length - 1],
        duration: currentGapLength,
        recovered: false
      });
    }

    const avgGapDays = gaps.length > 0
      ? (gaps.reduce((acc, g) => acc + g.duration, 0) / gaps.length).toFixed(1)
      : '0.0';

    return {
      currentStreak,
      longestStreak,
      gaps,
      avgGapDays
    };
  }, [dateSeries, summaryMap, habit]);

  // 3. CROSS-HABIT IMPACT & CORRELATION MATRIX
  const crossHabitImpact = useMemo(() => {
    const otherHabits = (activeHabits || []).filter(h => h.id !== habit?.id);
    const correlations = [];

    otherHabits.forEach(otherH => {
      let otherDoneCount = 0;
      let bothDoneCount = 0;
      let targetMissedCount = 0;
      let otherAlsoMissedCount = 0;

      dateSeries.forEach(dStr => {
        const sum = summaryMap.get(dStr);
        const thisScore = sum?.habitScores?.[habit?.id] ?? (sum?.scores?.[habit?.id] ?? 0);
        const otherScore = sum?.habitScores?.[otherH.id] ?? (sum?.scores?.[otherH.id] ?? 0);

        const thisDone = thisScore >= 60;
        const otherDone = otherScore >= 60;

        if (otherDone) {
          otherDoneCount++;
          if (thisDone) bothDoneCount++;
        }

        if (!thisDone) {
          targetMissedCount++;
          if (!otherDone) otherAlsoMissedCount++;
        }
      });

      const catalystBoost = otherDoneCount > 0
        ? Math.round((bothDoneCount / otherDoneCount) * 100)
        : 0;

      const dominoRiskRate = targetMissedCount > 0
        ? Math.round((otherAlsoMissedCount / targetMissedCount) * 100)
        : 0;

      if (otherDoneCount > 0 || targetMissedCount > 0) {
        correlations.push({
          habit: otherH,
          catalystBoost,
          dominoRiskRate,
          sharedDays: otherDoneCount
        });
      }
    });

    const catalysts = [...correlations]
      .filter(c => c.catalystBoost >= 30)
      .sort((a, b) => b.catalystBoost - a.catalystBoost)
      .slice(0, 2);

    const dominoRisks = [...correlations]
      .filter(c => c.dominoRiskRate >= 20)
      .sort((a, b) => b.dominoRiskRate - a.dominoRiskRate)
      .slice(0, 2);

    // If no correlations found (e.g. single habit or low data), provide sample archetype preview
    if (catalysts.length === 0 && dominoRisks.length === 0) {
      return {
        catalysts: [
          { habit: { id: 'sample_meditation', name: 'Morning Meditation', icon: 'self_improvement', color: '#8b5cf6' }, catalystBoost: 78, sharedDays: 14 },
          { habit: { id: 'sample_water', name: 'Hydration Routine', icon: 'water_drop', color: '#06b6d4' }, catalystBoost: 64, sharedDays: 12 }
        ],
        dominoRisks: [
          { habit: { id: 'sample_reading', name: 'Evening Reading', icon: 'menu_book', color: '#ec4899' }, dominoRiskRate: 58, sharedDays: 10 },
          { habit: { id: 'sample_stretch', name: 'Night Stretching', icon: 'accessibility_new', color: '#f59e0b' }, dominoRiskRate: 46, sharedDays: 8 }
        ]
      };
    }

    return { catalysts, dominoRisks };
  }, [activeHabits, habit, dateSeries, summaryMap]);

  // Display Misses List (Real user misses if available, otherwise sample template)
  const displayMisses = useMemo(() => {
    if (misses && misses.length > 0) {
      return misses;
    }
    
    // Sample misses template if 0 recorded misses exist
    const today = new Date();
    const d1 = new Date(today); d1.setDate(d1.getDate() - 4);
    const d2 = new Date(today); d2.setDate(d2.getDate() - 11);
    const d3 = new Date(today); d3.setDate(d3.getDate() - 18);
    const d4 = new Date(today); d4.setDate(d4.getDate() - 25);

    const d1Str = d1.toISOString().split('T')[0];
    const d2Str = d2.toISOString().split('T')[0];
    const d3Str = d3.toISOString().split('T')[0];
    const d4Str = d4.toISOString().split('T')[0];

    return [
      { date: d1Str, missDate: d1Str, endDate: today.toISOString().split('T')[0], recovered: true, recoveredDays: 6, recoveryRate: 85, isInProgress: false },
      { date: d2Str, missDate: d2Str, endDate: d1Str, recovered: true, recoveredDays: 5, recoveryRate: 71, isInProgress: false },
      { date: d3Str, missDate: d3Str, endDate: d2Str, recovered: false, recoveredDays: 3, recoveryRate: 42, isInProgress: false },
      { date: d4Str, missDate: d4Str, endDate: d3Str, recovered: true, recoveredDays: 5, recoveryRate: 71, isInProgress: false },
    ];
  }, [misses]);

  // 4. PINPOINT ROOT CAUSE ENGINE
  const rootCauseDiagnosis = useMemo(() => {
    const { weekdayAvg, weekendAvg, completionRate } = timingAnalysis;
    const { avgGapDays } = streakGapsData;

    if (weekendAvg < weekdayAvg - 20) {
      return {
        key: 'weekend_disconnect',
        severity: 'High',
        title: isHinglish ? 'वीकेंड रूटीन डिस्कनेक्ट' : 'Weekend Routine Disconnect',
        summary: isHinglish
          ? `शनिवार-रविवार को आपका स्कोर ${weekendAvg}% तक गिर जाता है, जबकि हफ़्ते के दिनों में यह ${weekdayAvg}% रहता है।`
          : `Your execution plummets to ${weekendAvg}% on weekends compared to ${weekdayAvg}% on weekdays.`,
        fix: isHinglish
          ? 'वीकेंड पर समय या जगह बदलते ही आदत छूटती है। एक आसान "वीकेंड मिनिमम वर्जन" सेट करें।'
          : 'Anchor this habit to a fixed weekend morning ritual with a reduced 2-minute minimum.'
      };
    }

    if (Number(avgGapDays) >= 2.5) {
      return {
        key: 'relapse_trap',
        severity: 'High',
        title: isHinglish ? 'पोस्ट-मिस रिलैप्स ट्रैप' : 'Multi-Day Relapse Trap',
        summary: isHinglish
          ? `एक दिन छूटने के बाद वापसी करने में औसतन ${avgGapDays} दिन लग रहे हैं।`
          : `When you miss a single day, the drop lasts an average of ${avgGapDays} consecutive days.`,
        fix: isHinglish
          ? '"Never Miss Twice" नियम लागू करें। 24 घंटे के अंदर 1 मिनट का टास्क करके लूप रीस्टार्ट करें।'
          : 'Apply the "Never Miss Twice" rule: complete an emergency 60-second version within 24 hours.'
      };
    }

    if (completionRate < 50) {
      return {
        key: 'high_friction',
        severity: 'Critical',
        title: isHinglish ? 'शुरुआती रुकावट व बड़ा टारगेट' : 'High Initiation Friction',
        summary: isHinglish
          ? `इस आदत की कुल कंसिस्टेंसी सिर्फ़ ${completionRate}% है। टारगेट या समय में बाधा आ रही है।`
          : `Overall consistency is low (${completionRate}%). The current threshold has high behavioral friction.`,
        fix: isHinglish
          ? 'आदत के शुरुआती कदम को इतना आसान बनाएं कि छोड़ना नामुमकिन लगे।'
          : 'Shrink the starting bar by 50% to rebuild automaticity without willpower fatigue.'
      };
    }

    return {
      key: 'stable_rhythm',
      severity: 'Minor',
      title: isHinglish ? 'मजबूत रिदम व निरंतरता' : 'Stable Habit Rhythm',
      summary: isHinglish
        ? `आपकी आदत ${completionRate}% कंसिस्टेंसी के साथ अच्छी स्थिति में चल रही है।`
        : `Execution is healthy (${completionRate}% consistency) with low friction.`,
      fix: isHinglish
        ? 'इसे किसी दूसरी आदत के साथ स्टैक करके और मजबूत बनाएं।'
        : 'Stack this habit onto your anchor routines to achieve a 90%+ master streak.'
    };
  }, [timingAnalysis, streakGapsData, isHinglish]);

  const toggleMissExpand = (key) => {
    setExpandedMisses(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <div className="max-w-[1000px] mx-auto w-full space-y-4 md:space-y-6 px-1.5 sm:px-3 md:px-0 pb-20 animate-in fade-in duration-200">
      
      {/* ── 1. TOP NAVIGATION & CONTROLS ── */}
      <nav className="flex items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(30);
            navigate('/analytics');
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft size={15} weight="bold" />
          <span>{isHinglish ? 'वापस (Stats)' : 'Back to Stats'}</span>
        </button>

        {/* Right Controls: Habit Switcher & Timeframe Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* In-App Habit Switcher */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(30);
              setShowHabitPicker(true);
            }}
            className="flex items-center gap-1.5 px-2.5 h-[32px] rounded-full bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs cursor-pointer text-xs font-black text-slate-900 dark:text-white max-w-[130px] xs:max-w-[160px] select-none group"
            title="Switch Habit"
          >
            <div 
              className="w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
              style={{ backgroundColor: habit?.color || '#3b82f6' }}
            >
              <HabitIcon name={habit?.icon} size={9} className="text-white" />
            </div>
            <span className="truncate">{habit?.name}</span>
            <CaretDown size={11} weight="bold" className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5 shrink-0" />
          </button>

          {/* Timeframe Selector Pill */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(30);
              setShowTimeframeModal(true);
            }}
            className="flex items-center justify-center gap-1 px-2.5 h-[32px] rounded-full bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[11px] font-black text-slate-700 dark:text-slate-300 cursor-pointer select-none group"
            title="Change Window"
          >
            <span>{periodDays}d</span>
            <CaretDown size={10} weight="bold" className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5 shrink-0" />
          </button>
        </div>
      </nav>

      {/* ── 2. TIER 2 (14-DAY) LOCK BANNER IF TRACKED < 14 DAYS (OPTIMIZED FOR MOBILE) ── */}
      {isLocked && (
        <div className="p-2.5 sm:p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock size={14} weight="fill" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-nowrap">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 whitespace-nowrap">
                  {isHinglish ? 'सैंपल प्रीव्यू' : 'Sample Preview'}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 whitespace-nowrap shrink-0">
                  14d Tier
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                {isHinglish 
                  ? `अनलॉक करने के लिए ${daysRemaining} दिन और ट्रैक करें`
                  : `${daysRemaining} days left to unlock live diagnostics`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(30);
              navigate('/analytics/roadmap');
            }}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
          >
            {isHinglish ? 'रोडमैप' : 'Roadmap'}
          </button>
        </div>
      )}

      {/* ── 3. HERO DIAGNOSTIC CARD (COMPACT & MATCHING USER REFERENCE DESIGN) ── */}
      <div className="space-y-2.5">
        {/* Top Header Row: Section Heading on Left + Dynamic Severity Pill on Right */}
        <div className="flex items-center justify-between px-1 gap-2 flex-nowrap">
          {/* Permanent Non-pill Section Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <Heartbeat size={13} weight="bold" />
            </div>
            <h2 className="text-xs sm:text-sm font-black tracking-widest uppercase text-slate-800 dark:text-slate-200 truncate">
              {isHinglish ? 'हैबिट डायग्नोस्टिक्स' : 'Habit Diagnostics'}
            </h2>
          </div>

          {/* Dynamic Severity Status Pill */}
          <span className={`text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            rootCauseDiagnosis.severity === 'Critical' 
              ? 'bg-rose-950/90 text-rose-400 border-rose-500/40 shadow-[0_0_14px_rgba(244,63,94,0.3)]'
              : rootCauseDiagnosis.severity === 'High'
              ? 'bg-amber-950/90 text-amber-400 border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.3)]'
              : 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.3)]'
          }`}>
            <Lightning size={12} weight="fill" />
            <span>{rootCauseDiagnosis.severity.toUpperCase()} FRICTION</span>
          </span>
        </div>

        <section className="bg-gradient-to-b from-[#0e1424] via-[#090d18] to-[#060913] text-white rounded-[28px] p-4 sm:p-5 md:p-6 border border-[#1c263c] shadow-2xl relative overflow-hidden space-y-3.5">
          {/* Glow ambient */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

          {/* Top Habit Row */}
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* Habit Standard Boxed Icon */}
              <HabitIcon 
                name={habit?.icon} 
                habitId={habit?.id} 
                boxed={true} 
                size={30} 
                className="!w-14 !h-14 sm:!w-16 sm:!h-16 !rounded-2xl shrink-0 shadow-lg border border-white/10" 
              />

              <div className="min-w-0 flex-1">
                {/* Title & Subtitle */}
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate leading-tight">
                  {habit?.name}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  {habit?.category ? `${habit.category} Focus • Consistency Diagnostics` : 'Stay Consistent. Stay Resilient.'}
                </p>
              </div>
            </div>

            {/* Info (i) Button positioned on top-right of the card */}
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                setShowDiagnosticGuide(true);
              }}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
              title="Habit Diagnostics Guide"
            >
              <Info size={16} weight="bold" />
            </button>
          </div>

        {/* Middle Row: Combined Consistency & Resilience Capsule Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#090d19]/90 border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex items-center justify-between gap-3 relative z-10">
          
          {/* Left: Consistency Circular Progress & Stats */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mini Progress Ring */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  strokeDasharray={`${timingAnalysis.completionRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-black text-white">
                {formatNum1(timingAnalysis.completionRate)}%
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-[10.5px] font-bold text-slate-400 block uppercase tracking-wider">
                {isHinglish ? 'कंसिस्टेंसी' : 'Consistency'}
              </span>
              <span className="text-sm sm:text-base font-black text-white truncate block">
                {timingAnalysis.completedDays}/{timingAnalysis.totalTracked} days
              </span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-[1px] h-9 bg-slate-800/80 shadow-[0_0_8px_rgba(56,189,248,0.3)] shrink-0" />

          {/* Right: Resilience Big Score & Delta */}
          <div className="text-right shrink-0">
            <span className="text-[10.5px] font-bold text-slate-400 block uppercase tracking-wider">
              {isHinglish ? 'रेज़िलिएंस' : 'Resilience'}
            </span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-indigo-400 leading-none">
                {formatNum1(recoveryScore)}%
              </span>
              <span className={`text-[10px] font-extrabold flex items-center px-1.5 py-0.5 rounded-md ${
                resilienceDelta >= 0
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}>
                {resilienceDelta >= 0 ? `↗ +${formatNum1(resilienceDelta)}%` : `↘ ${formatNum1(resilienceDelta)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom 2x2 Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5 relative z-10">
          
          {/* Card 1: Current Streak */}
          <div className="p-3 rounded-2xl bg-[#0d1322]/80 border border-slate-800/90 flex items-center gap-2.5 shadow-2xs hover:border-slate-700 transition-all">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Calendar size={16} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 block truncate uppercase tracking-wider">
                {isHinglish ? 'सक्रिय स्ट्रीक' : 'Current Streak'}
              </span>
              <span className="text-xs sm:text-sm font-black text-white block mt-0.5 truncate">
                {formatNum1(streakGapsData.currentStreak)} {isHinglish ? 'दिन' : 'days'}
              </span>
            </div>
          </div>

          {/* Card 2: Best Streak */}
          <div className="p-3 rounded-2xl bg-[#0d1322]/80 border border-slate-800/90 flex items-center gap-2.5 shadow-2xs hover:border-slate-700 transition-all">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Trophy size={16} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 block truncate uppercase tracking-wider">
                {isHinglish ? 'बेस्ट स्ट्रीक' : 'Best Streak'}
              </span>
              <span className="text-xs sm:text-sm font-black text-white block mt-0.5 truncate">
                {formatNum1(streakGapsData.longestStreak)} {isHinglish ? 'दिन' : 'days'}
              </span>
            </div>
          </div>

          {/* Card 3: Average Gap */}
          <div className="p-3 rounded-2xl bg-[#0d1322]/80 border border-slate-800/90 flex items-center gap-2.5 shadow-2xs hover:border-slate-700 transition-all">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
              <Target size={16} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 block truncate uppercase tracking-wider">
                {isHinglish ? 'औसत गैप' : 'Average Gap'}
              </span>
              <span className="text-xs sm:text-sm font-black text-rose-400 block mt-0.5 truncate">
                {formatNum1(streakGapsData.avgGapDays)} {isHinglish ? 'दिन' : 'days'}
              </span>
            </div>
          </div>

          {/* Card 4: Total Misses */}
          <div className="p-3 rounded-2xl bg-[#0d1322]/80 border border-slate-800/90 flex items-center gap-2.5 shadow-2xs hover:border-slate-700 transition-all">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
              <HourglassSimple size={16} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 block truncate uppercase tracking-wider">
                {isHinglish ? 'कुल मिस्ड दिन' : 'Total Misses'}
              </span>
              <span className="text-xs sm:text-sm font-black text-white block mt-0.5 truncate">
                {formatNum1(totalMisses)} {isHinglish ? 'दिन' : 'days'}
              </span>
            </div>
          </div>

        </div>
      </section>
      </div>

      {/* ── 4. PINPOINT ROOT CAUSE DIAGNOSTIC CARD (समस्या कहाँ है) ── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Warning size={16} weight="fill" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {isHinglish ? 'रूट कॉज़ डायग्नोसिस (समस्या कहाँ है)' : 'Root Cause Pinpoint Diagnostic'}
            </h3>
            <span className="text-[10.5px] font-medium text-slate-400">
              {isHinglish ? 'व्यवहार और डेटा विश्लेषण से निकली मुख्य रुकावट' : 'Identified behavioral friction point'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md inline-block mb-1">
                {isHinglish ? 'मुख्य समस्या' : 'Primary Breakdown Trigger'}
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {rootCauseDiagnosis.title}
              </h4>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
              {rootCauseDiagnosis.severity} Friction
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {rootCauseDiagnosis.summary}
          </p>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
            <Lightbulb size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="block font-black text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                {isHinglish ? 'सुझाया गया समाधान' : 'Prescribed Actionable Fix'}
              </span>
              <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-snug mt-0.5 block font-normal">
                {rootCauseDiagnosis.fix}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. TIMING & WEEKLY RHYTHM DIAGNOSTICS (BEST DAY / VULNERABLE DAY / WEEKDAY VS WEEKEND) ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Calendar size={16} weight="bold" className="text-indigo-500 shrink-0" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            {isHinglish ? 'साप्ताहिक लय और समय का प्रभाव' : 'Timing & Weekly Rhythm Diagnostic'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Best Day */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Star size={14} weight="fill" />
                <span className="text-[10.5px] font-black uppercase tracking-wider">
                  {isHinglish ? 'सर्वश्रेष्ठ दिन' : 'Best Performing Day'}
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {timingAnalysis.bestDay.name} ({formatNum1(timingAnalysis.bestDay.avg)}%)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {isHinglish
                  ? `आप ${timingAnalysis.bestDay.name} को इस आदत में सबसे अधिक ऊर्जा और समय देते हैं।`
                  : `Peak execution occurs on ${timingAnalysis.bestDay.name}s.`}
              </p>
            </div>

            {/* Mon-Sun Day Bars */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-1.5 h-12">
              {timingAnalysis.orderedDays.map((d, i) => {
                const isTop = d.day === timingAnalysis.bestDay.day;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isTop ? 'bg-emerald-500 shadow-xs' : 'bg-emerald-500/20'
                      }`}
                      style={{ height: `${Math.max(15, d.avg)}%` }}
                    />
                    <span className={`text-[9px] ${isTop ? 'font-black text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {d.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Vulnerable Day */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <Warning size={14} weight="fill" />
                <span className="text-[10.5px] font-black uppercase tracking-wider">
                  {isHinglish ? 'संवेदनशील दिन (ड्रॉपआउट)' : 'Vulnerable Drop Day'}
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {timingAnalysis.vulnerableDay.name} ({formatNum1(timingAnalysis.vulnerableDay.missRate)}% Miss Rate)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {isHinglish
                  ? `आप ${timingAnalysis.vulnerableDay.name} को सबसे ज़्यादा यह आदत मिस करते हैं।`
                  : `Friction spikes on ${timingAnalysis.vulnerableDay.name}s with highest misses.`}
              </p>
            </div>

            {/* Mon-Sun Day Miss Bars */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-1.5 h-12">
              {timingAnalysis.orderedDays.map((d, i) => {
                const isVuln = d.day === timingAnalysis.vulnerableDay.day;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isVuln ? 'bg-rose-500 shadow-xs' : 'bg-rose-500/20'
                      }`}
                      style={{ height: `${Math.max(15, d.missRate)}%` }}
                    />
                    <span className={`text-[9px] ${isVuln ? 'font-black text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                      {d.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Weekday vs Weekend */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <CalendarCheck size={14} weight="fill" />
                <span className="text-[10.5px] font-black uppercase tracking-wider">
                  {isHinglish ? 'वीकडे बनाम वीकेंड' : 'Weekday vs Weekend'}
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {timingAnalysis.weekdayAvg >= timingAnalysis.weekendAvg ? 'Weekday Focused' : 'Weekend Strong'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {isHinglish
                  ? `हफ़्ते के दिनों में ${formatNum1(timingAnalysis.weekdayAvg)}% और वीकेंड पर ${formatNum1(timingAnalysis.weekendAvg)}% स्कोर रहा।`
                  : `Executes at ${formatNum1(timingAnalysis.weekdayAvg)}% on Mon-Fri vs ${formatNum1(timingAnalysis.weekendAvg)}% on Sat-Sun.`}
              </p>
            </div>

            {/* Comparison Bars */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-3 h-12">
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full rounded-t-md bg-indigo-600 transition-all"
                  style={{ height: `${Math.max(15, timingAnalysis.weekdayAvg)}%` }}
                />
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 truncate">
                  Mon–Fri ({formatNum1(timingAnalysis.weekdayAvg)}%)
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full rounded-t-md bg-amber-500 transition-all"
                  style={{ height: `${Math.max(15, timingAnalysis.weekendAvg)}%` }}
                />
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 truncate">
                  Sat–Sun ({formatNum1(timingAnalysis.weekendAvg)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CROSS-HABIT IMPACT & CORRELATION MATRIX (दूसरों पे क्या impact, दूसरों का इस habit पे impact) ── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ArrowsLeftRight size={16} weight="bold" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {isHinglish ? 'क्रॉस-हैबिट प्रभाव (Cross-Habit Ripple Impact)' : 'Cross-Habit Impact & Correlation Matrix'}
            </h3>
            <span className="text-[10.5px] font-medium text-slate-400">
              {isHinglish ? 'अन्य आदतों के साथ आपसी तालमेल और डोमिनो इफ़ेक्ट' : 'How this habit interacts with the rest of your daily routine'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Box 1: Positive Catalysts */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <Sparkle size={14} weight="fill" className="text-emerald-500" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                {isHinglish ? 'पॉजिटिव कैटालिस्ट आदतें (Boosters)' : 'Positive Catalyst Habits'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              {isHinglish
                ? `जब आप ये आदतें पूरी करते हैं, तो ${habit.name} के पूरा होने की संभावना बढ़ जाती है:`
                : `Completing these habits strongly triggers success for ${habit.name}:`}
            </p>

            <div className="space-y-1.5 pt-1">
              {crossHabitImpact.catalysts.map(c => (
                <div key={c.habit.id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0" style={{ backgroundColor: c.habit.color }}>
                      <HabitIcon name={c.habit.icon} size={11} />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">{c.habit.name}</span>
                  </div>
                  <span className="text-[10.5px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">
                    +{formatNum1(c.catalystBoost)}% Success
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Box 2: Domino Risks */}
          <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
              <Lightning size={14} weight="fill" className="text-rose-500" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                {isHinglish ? 'डोमिनो रिस्क (चेन रिएक्शन)' : 'Domino Risk Chain Reaction'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              {isHinglish
                ? `जब ${habit.name} मिस होती है, तो इन आदतों के भी छूटने का ख़तरा रहता है:`
                : `When ${habit.name} is missed, these habits also tend to fail on the same day:`}
            </p>

            <div className="space-y-1.5 pt-1">
              {crossHabitImpact.dominoRisks.map(c => (
                <div key={c.habit.id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0" style={{ backgroundColor: c.habit.color }}>
                      <HabitIcon name={c.habit.icon} size={11} />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">{c.habit.name}</span>
                  </div>
                  <span className="text-[10.5px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md shrink-0">
                    {formatNum1(c.dominoRiskRate)}% Domino Miss
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. RECENT GAPS & RECOVERY TIMELINE (DROPDOWN ACCORDION) ── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 transition-all">
        
        {/* Dropdown Header Trigger */}
        <div 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(25);
            setIsLogDropdownOpen(prev => !prev);
          }}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <HourglassSimple size={18} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-nowrap">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
                  {isHinglish ? 'गैप और रिकवरी टाइमलाइन' : 'Streak Breaks & Recovery Log'}
                </h3>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 whitespace-nowrap">
                  {displayMisses.length} {isHinglish ? 'लॉग्स' : 'Logs'}
                </span>
              </div>
              <span className="text-[10.5px] font-medium text-slate-400 block truncate mt-0.5">
                {isHinglish ? 'कहाँ आदत छूटी और वापसी में कितना समय लगा' : 'Chronological record of recent drops and comebacks'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-all shrink-0 ml-2"
          >
            <CaretDown 
              size={15} 
              weight="bold" 
              className={`transition-transform duration-200 ${isLogDropdownOpen ? 'rotate-180 text-amber-500' : ''}`} 
            />
          </button>
        </div>

        {/* Dropdown Content */}
        {isLogDropdownOpen && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {displayMisses.slice(0, 10).map((m, idx) => {
              const missKey = m.date || m.missDate || `m_${idx}`;
              const isExpanded = expandedMisses.includes(missKey);
              return (
                <div
                  key={missKey}
                  onClick={() => toggleMissExpand(missKey)}
                  className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col gap-2 cursor-pointer transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 font-black text-[10px]">
                        <XCircle size={14} weight="fill" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block leading-none">
                          {formatDateShort(m.missDate || m.date)} ({getDayOfWeek(m.missDate || m.date)})
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                          {m.recovered ? 'Bounce-Back Successful' : m.isInProgress ? 'Recovery Window Active' : 'Relapse Drop'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {m.recovered ? (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check size={11} weight="bold" /> Recovered
                        </span>
                      ) : m.isInProgress ? (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <HourglassSimple size={11} weight="bold" /> In Progress
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                          Unrecovered
                        </span>
                      )}
                      <CaretDown size={12} weight="bold" className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <p>• 7-Day Window Completion: <strong className="text-slate-900 dark:text-white">{m.recoveredDays || 0}/7 days</strong> (Threshold: 5/7 days).</p>
                      <p className="text-[10px] text-slate-400">Window Period: {formatDateShort(m.missDate || m.date)} to {formatDateShort(m.endDate)}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Collapse Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(25);
                  setIsLogDropdownOpen(false);
                }}
                className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <CaretUp size={13} weight="bold" />
                <span>{isHinglish ? 'लॉग्स बंद करें (Collapse)' : 'Close Logs'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 8. ACTIONABLE KNOWLEDGE HUB & PRO RESET PLAN (CLEAN & HIGH CONTRAST) ── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Books size={18} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                  {isHinglish ? 'नॉलेज हब और एक्शन प्रोटोकॉल' : 'Knowledge Hub & Reset Protocol'}
                </h3>
                <span className="text-[9.5px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full">
                  Science-Backed
                </span>
              </div>
              <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                {isHinglish ? 'आदत विज्ञान पर आधारित गाइड्स और स्टेप-बाय-स्टेप एक्शन प्लान' : 'Evidence-based behavioral guides & targeted comeback blueprints'}
              </p>
            </div>
          </div>
        </div>

        {/* 2 High-Contrast Interactive Cards: Free Science Guide & Pro Action Plan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Card 1: Free Science Article */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 flex flex-col justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  Free Guide
                </span>
                <span className="text-[10px] font-bold text-slate-400">3 Min Read</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                {isHinglish
                  ? 'इलास्टिक कंसिस्टेंसी: मुश्किल दिनों में आदत कैसे बचाएं'
                  : 'Elastic Consistency: How to Maintain Habits on Chaotic Days'}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {isHinglish
                  ? 'परफेक्शनिज़्म छोड़ने और 24 घंटे के अंदर 2-मिनट मिनिमम रूल से कमबैक करने की साइंटिफिक तकनीक।'
                  : 'Learn how elite performers drop perfectionism and use 2-minute micro-habits to stay resilient.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                setActiveArticleModal('elastic_consistency');
              }}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              <Article size={14} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
              <span>{isHinglish ? 'पूरा आर्टिकल पढ़ें' : 'Read Free Guide'}</span>
            </button>
          </div>

          {/* Card 2: Pro Level Actionable Protocol Plan */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#151928] to-[#101420] text-white border border-slate-800 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1.5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Crown size={11} weight="fill" className="text-amber-400" /> Pro Protocol
                </span>
                <span className="text-[10px] font-bold text-indigo-300">Action Blueprint</span>
              </div>
              <h4 className="text-sm font-black text-white leading-snug">
                {isHinglish
                  ? '2-डे हैबिट रीसेट व ट्रिगर स्टैकिंग प्रोटोकॉल'
                  : 'The 2-Day Habit Reset & Trigger Stacking Protocol'}
              </h4>
              <p className="text-[11px] text-slate-300 leading-snug">
                {isHinglish
                  ? 'कमजोरी वाले दिन के लिए ऑटोमैटिक बैकअप ट्रिगर और स्टेप-बाय-स्टेप एक्शन चेकलिस्ट।'
                  : 'A structured blueprint to eliminate dropout friction and automate your comeback loop.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                if (!userDoc?.isPro) {
                  setShowProUpgradeModal(true);
                } else {
                  setActiveArticleModal('pro_protocol');
                }
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer relative z-10"
            >
              {!userDoc?.isPro && <Lock size={13} weight="fill" className="text-amber-300" />}
              <span>{userDoc?.isPro ? (isHinglish ? 'एक्शन प्लान खोलें' : 'Open Action Plan') : (isHinglish ? 'अनलॉक प्रो प्लान' : 'Unlock Pro Action Plan')}</span>
            </button>
          </div>

        </div>
      </section>

      {/* ── MODAL: HABIT DIAGNOSTICS & SCORING GUIDE (DASHED LEADER LINES, COMPACT) ── */}
      {showDiagnosticGuide && (
        <div 
          className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowDiagnosticGuide(false)}
        >
          <div 
            className="w-full max-w-[480px] max-h-[85vh] bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-4 sm:p-5 shadow-2xl space-y-3.5 flex flex-col animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Info size={16} weight="bold" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {isHinglish ? 'हैबिट डायग्नोसिस गाइड' : 'Habit Diagnostics Guide'}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {isHinglish ? 'मैट्रिक्स और संकेतों का आसान विवरण' : 'Definitions & Metric Breakdowns'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowDiagnosticGuide(false)} 
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* 3 Tab Switcher Pills */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setGuideTab('friction');
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  guideTab === 'friction'
                    ? 'bg-white dark:bg-[#181d2a] text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Warning size={13} weight="fill" />
                <span className="truncate">{isHinglish ? 'रूट कॉज़' : 'Friction'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setGuideTab('ripple');
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  guideTab === 'ripple'
                    ? 'bg-white dark:bg-[#181d2a] text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ArrowsLeftRight size={13} weight="bold" />
                <span className="truncate">{isHinglish ? 'रिपल असर' : 'Ripple'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setGuideTab('timing');
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  guideTab === 'timing'
                    ? 'bg-white dark:bg-[#181d2a] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CalendarCheck size={13} weight="fill" />
                <span className="truncate">{isHinglish ? 'समय व लय' : 'Timing'}</span>
              </button>
            </div>

            {/* Modal Body with Rich Tab Content */}
            <div className="overflow-y-auto space-y-3 pr-1 text-xs text-slate-600 dark:text-slate-300">
              
              {/* TAB 1: FRICTION & ROOT CAUSES */}
              {guideTab === 'friction' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  
                  {/* High Initiation Friction */}
                  <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-black text-xs">
                        <Lightning size={14} weight="fill" className="text-rose-500" />
                        <span>High Initiation Friction</span>
                      </div>
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-rose-200/70 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200">
                        {isHinglish ? 'बड़ा टारगेट' : 'High Barrier'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {isHinglish
                        ? 'जब किसी आदत को शुरू करने में बहुत आलस या भारीपन महसूस हो (जैसे 45 मिनट का बड़ा वर्कआउट)। इसका समाधान टारगेट को 2-मिनट के आसान वर्जन में सिकोड़ना है।'
                        : 'When a habit demands too much cognitive willpower or effort to start. The fix is shrinking the initial bar into a 2-minute micro-version to regain automaticity.'}
                    </p>
                  </div>

                  {/* Weekend Disconnect */}
                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-black text-xs">
                        <Calendar size={14} weight="bold" className="text-amber-500" />
                        <span>Weekend Disconnect</span>
                      </div>
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                        {isHinglish ? 'Sat-Sun ड्रॉप' : 'Routine Shift'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {isHinglish
                        ? 'सोमवार से शुक्रवार तो आदत सही चलती है, लेकिन शनिवार-रविवार को रूटीन बदलते ही स्कोर 20-40% गिर जाता है।'
                        : 'Execution drops steeply on weekends because weekday environment cues disappear. The fix is a dedicated weekend morning anchor.'}
                    </p>
                  </div>

                  {/* Relapse Trap */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black text-xs">
                        <Warning size={14} weight="fill" className="text-rose-500" />
                        <span>Multi-Day Relapse Trap</span>
                      </div>
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {isHinglish ? '>2 दिन गैप' : 'Chain Slip'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {isHinglish
                        ? '1 दिन छूटने के बाद यूज़र लगातार 2-3 दिन मिस कर देता है। "Never Miss Twice" नियम लागू करके 24 घंटे में रीस्टार्ट करें।'
                        : 'Missing a single day causes a consecutive multi-day gap. Applying the "Never Miss Twice" rule protects neural habit wiring.'}
                    </p>
                  </div>

                </div>
              )}

              {/* TAB 2: CROSS-HABIT RIPPLE IMPACT */}
              {guideTab === 'ripple' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  
                  {/* Positive Catalyst */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-black text-xs">
                        <Sparkle size={14} weight="fill" className="text-emerald-500" />
                        <span>Positive Catalyst Habits</span>
                      </div>
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                        +X% Success
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {isHinglish
                        ? 'ऐसी सहायक आदतें जिन्हें पूरा करने पर आपकी यह वाली आदत भी 70-80% पूरी हो जाती है (जैसे Meditation करने पर Workout की संभावना बढ़ जाती है)।'
                        : 'Anchor habits that act as natural triggers. Completing Habit A significantly boosts the completion rate of this habit on the same day.'}
                    </p>
                  </div>

                  {/* Domino Risk Chain Reaction */}
                  <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-black text-xs">
                        <Lightning size={14} weight="fill" className="text-rose-500" />
                        <span>Domino Risk Chain Reaction</span>
                      </div>
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-rose-200/70 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200">
                        {isHinglish ? 'ताश के पत्ते' : 'Collateral Drop'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {isHinglish
                        ? 'जब यह आदत छूटती है, तो आलस में आकर आपकी दूसरी कौन सी आदतें भी उसी दिन छूट जाती हैं — एक गिरी तो दूसरी भी गिरी।'
                        : 'When this habit fails, dependent secondary habits tend to collapse on the same day like falling dominoes.'}
                    </p>
                  </div>

                </div>
              )}

              {/* TAB 3: TIMING & RESILIENCE */}
              {guideTab === 'timing' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  
                  {/* Best Day & Vulnerable Day */}
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-black text-xs">
                        <Star size={14} weight="fill" className="text-indigo-500" />
                        <span>Best vs Vulnerable Days</span>
                      </div>
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-indigo-200/70 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200">
                        Weekly Rhythm
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {isHinglish
                        ? 'हफ़्ते के किस दिन आपकी सबसे ज़्यादा ऊर्जा होती है (Best Day) और किस दिन सबसे ज़्यादा मिस होने का ख़तरा रहता है (Vulnerable Day)।'
                        : 'Pinpoints peak execution days (e.g. Tuesday) versus high friction drop days (e.g. Sunday) so you can plan backup triggers.'}
                    </p>
                  </div>

                  {/* Resilience & Average Gap */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-black text-xs">
                        <ShieldCheck size={14} weight="fill" className="text-emerald-500" />
                        <span>Resilience & Average Gap</span>
                      </div>
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                        Comeback Rate
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {isHinglish
                        ? 'आदत छूटने के बाद वापस पटरी पर लौटने में औसतन कितने दिन लगते हैं (Average Gap) और अगले 7 दिनों में बाउंस-बैक करने की सफलता दर (Resilience %)।'
                        : 'Average Gap measures the days taken to bounce back after a drop. Resilience calculates your 7-day post-miss recovery success percentage.'}
                    </p>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Bottom Close */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowDiagnosticGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer shadow-xs active:scale-98"
              >
                {isHinglish ? 'समझ आ गया' : 'Got It'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HABIT PICKER ── */}
      {showHabitPicker && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowHabitPicker(false)}
        >
          <div 
            className="w-full max-w-[340px] bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {isHinglish ? 'डायग्नोसिस हेतु आदत चुनें' : 'Select Habit to Diagnose'}
              </h4>
              <button onClick={() => setShowHabitPicker(false)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5">
              {activeHabits.map(h => {
                const isSelected = h.id === habit.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleSelectHabit(h.id)}
                    className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: h.color }}>
                        <HabitIcon name={h.icon} size={13} />
                      </div>
                      <span className="text-xs truncate">{h.name}</span>
                    </div>
                    {isSelected && <Check size={14} weight="bold" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TIMEFRAME SELECTOR (7, 14, 30, 90 DAYS) ── */}
      {showTimeframeModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowTimeframeModal(false)}
        >
          <div 
            className="w-full max-w-[340px] bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isHinglish ? 'डायग्नोस्टिक अवधि चुनें' : 'Select Timeframe Window'}
              </h3>
              <button onClick={() => setShowTimeframeModal(false)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 7, label: isHinglish ? '7 Din' : '7 Days', desc: 'Weekly Sprint' },
                { key: 14, label: isHinglish ? '14 Din' : '14 Days', desc: 'Two-Week Focus' },
                { key: 30, label: isHinglish ? '30 Din' : '30 Days', desc: 'Monthly Review' },
                { key: 90, label: isHinglish ? '90 Din' : '90 Days', desc: 'Quarterly Trend' }
              ].map(opt => {
                const isSelected = periodDays === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      setPeriodDays(opt.key);
                      setShowTimeframeModal(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ARTICLE READER / PRO PROTOCOL READER ── */}
      {activeArticleModal && (
        <div 
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveArticleModal(null)}
        >
          <div 
            className="w-full max-w-[460px] max-h-[85vh] bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-5 shadow-2xl space-y-3.5 flex flex-col animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Article size={16} weight="bold" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {activeArticleModal === 'elastic_consistency'
                    ? (isHinglish ? 'इलास्टिक कंसिस्टेंसी गाइड' : 'Elastic Consistency Guide')
                    : (isHinglish ? 'प्रो रीसेट प्रोटोकॉल' : 'Pro Reset Protocol')}
                </h4>
              </div>
              <button onClick={() => setActiveArticleModal(null)} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeArticleModal === 'elastic_consistency' ? (
                <>
                  <p>
                    <strong className="text-slate-900 dark:text-white">1. The Problem with Perfectionism:</strong> Most habit trackers make users feel guilty for a single missed day. This triggers the "What-The-Hell" cognitive bias, where missing one day leads to quitting entirely.
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">2. The 2-Minute Safety Valve:</strong> On busy or chaotic days, never aim for a 100% full workout or study session. Instead, perform the 2-minute minimum version (e.g. 5 push-ups or 1 page reading).
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">3. Elastic Resilience:</strong> A habit is not broken until you miss two consecutive days. Recovering within 24–48 hours keeps neural plasticity intact.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Step 1: Emergency Backup Trigger</strong><br />
                    Attach a designated backup time on your calendar for vulnerable days ({timingAnalysis.vulnerableDay.name}).
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Step 2: Habit Pairing Fix</strong><br />
                    Stack this habit immediately after your strongest catalyst routine ({crossHabitImpact.catalysts[0]?.habit?.name || 'Anchor habit'}).
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Step 3: The 48-Hour Recovery Check</strong><br />
                    Whenever a slip occurs, log an emergency check-in within 48 hours to preserve your Recovery Streak.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveArticleModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer shadow-xs"
              >
                {isHinglish ? 'समझ आ गया' : 'Close Guide'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Modal */}
      <ProModal isOpen={showProUpgradeModal} onClose={() => setShowProUpgradeModal(false)} />
    </div>
  );
}
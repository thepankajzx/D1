import React, { useMemo, useState } from 'react';
import { TrendUp } from '@phosphor-icons/react/dist/icons/TrendUp';
import { TrendDown } from '@phosphor-icons/react/dist/icons/TrendDown';
import { ShieldCheck } from '@phosphor-icons/react/dist/icons/ShieldCheck';
import { Sparkle } from '@phosphor-icons/react/dist/icons/Sparkle';
import { Info } from '@phosphor-icons/react/dist/icons/Info';
import { X } from '@phosphor-icons/react/dist/icons/X';
import { CheckCircle } from '@phosphor-icons/react/dist/icons/CheckCircle';
import { CaretDown } from '@phosphor-icons/react/dist/icons/CaretDown';
import { Check } from '@phosphor-icons/react/dist/icons/Check';
import { Calendar } from '@phosphor-icons/react/dist/icons/Calendar';
import { Lightbulb } from '@phosphor-icons/react/dist/icons/Lightbulb';
import { Lightning } from '@phosphor-icons/react/dist/icons/Lightning';
import { Target } from '@phosphor-icons/react/dist/icons/Target';
import { CalendarCheck } from '@phosphor-icons/react/dist/icons/CalendarCheck';
import { ChartBar } from '@phosphor-icons/react/dist/icons/ChartBar';

const CURVE_STAGES = [
  {
    id: 'dip',
    shortName: 'Bad Day (Dip)',
    icon: TrendDown,
    title: '1. Score on Bad Day (Dip)',
    tag: 'Start of Window',
    gradient: 'from-rose-500 to-red-600',
    bgLight: 'bg-rose-50/70 dark:bg-rose-950/20',
    borderLight: 'border-rose-200/80 dark:border-rose-900/40',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
    activeTabClass: 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/20',
    inactiveTabClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200',
    coreConcept: 'The lowest dip point when your habit dropped below target. This anchor day triggers your 7-day bounce-back window.',
    rule: 'Any day where your habit score drops below 50% is recorded as an Off-Target (Dip) day.',
    strategy: 'Never miss twice. Treat the slip as a temporary dip and focus on immediately rebounding tomorrow.'
  },
  {
    id: 'window',
    shortName: '7-Day Window',
    icon: TrendUp,
    title: '2. The 7-Day Recovery Window',
    tag: '5 of 7 Days Rule',
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    borderLight: 'border-emerald-200/80 dark:border-emerald-900/40',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    activeTabClass: 'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-600/20',
    inactiveTabClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200',
    coreConcept: 'Following the dip, Days 1 through 7 track your comeback velocity and habit reinforcement.',
    rule: 'Achieving a score of ≥70% on at least 5 out of 7 days marks this off-target event as successfully Recovered.',
    strategy: 'Stack consecutive daily wins right after the dip to cement lifelong discipline and protect your streak.'
  },
  {
    id: 'upcoming',
    shortName: 'Upcoming Days',
    icon: CalendarCheck,
    title: '3. Upcoming Days (In Progress)',
    tag: 'Dotted Outlines',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50/70 dark:bg-amber-950/20',
    borderLight: 'border-amber-200/80 dark:border-amber-900/40',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    activeTabClass: 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20',
    inactiveTabClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200',
    coreConcept: 'Days in your active 7-day window that have not occurred yet appear as dashed outline capsules.',
    rule: 'As each day arrives and you log your habit, the outline transforms into your real performance score.',
    strategy: 'Plan ahead for upcoming days to remove friction and complete your habit with minimal willpower resistance.'
  },
  {
    id: 'scores',
    shortName: 'Daily Scores',
    icon: ChartBar,
    title: '4. Exact Scores & Colors',
    tag: 'Visual Metrics',
    gradient: 'from-indigo-500 to-blue-600',
    bgLight: 'bg-indigo-50/70 dark:bg-indigo-950/20',
    borderLight: 'border-indigo-200/80 dark:border-indigo-900/40',
    badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800',
    activeTabClass: 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-600/20',
    inactiveTabClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200',
    coreConcept: 'Every bar shows the exact percentage score achieved directly above the column.',
    rule: 'Green indicates ≥70% score, Amber is 50-69% (partial), and Red denotes <50% (slip/dip).',
    strategy: 'Aim for ≥70% on all recovery days to maintain high habit resilience and grow your bounce-back win rate.'
  }
];

function toDateKey(date) {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function getDayOfWeekShort(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  } catch (e) {
    return '';
  }
}

function getDayAndMonthShort(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.getDate() + ' ' + d.toLocaleDateString('en-US', { month: 'short' });
    }
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.getDate() + ' ' + d.toLocaleDateString('en-US', { month: 'short' });
  } catch (e) {
    return '';
  }
}

// Fallback archetype curve: Dip + 7 days
const ARCHETYPE_CYCLE = [
  { dayOffset: 0, dayName: 'Dip', dateLabel: 'Dip Day', score: 0, isLogged: true, status: 'dip' },
  { dayOffset: 1, dayName: 'Day 1', dateLabel: 'Day 1', score: 40, isLogged: true, status: 'rebound' },
  { dayOffset: 2, dayName: 'Day 2', dateLabel: 'Day 2', score: 65, isLogged: true, status: 'rebound' },
  { dayOffset: 3, dayName: 'Day 3', dateLabel: 'Day 3', score: 75, isLogged: true, status: 'rebound' },
  { dayOffset: 4, dayName: 'Day 4', dateLabel: 'Day 4', score: 85, isLogged: true, status: 'rebound' },
  { dayOffset: 5, dayName: 'Day 5', dateLabel: 'Day 5', score: 90, isLogged: true, status: 'rebound' },
  { dayOffset: 6, dayName: 'Day 6', dateLabel: 'Day 6', score: 95, isLogged: true, status: 'rebound' },
  { dayOffset: 7, dayName: 'Day 7', dateLabel: 'Day 7', score: 100, isLogged: true, status: 'rebound' }
];

export default function RecoveryBounceBackCurve({
  habit,
  summaries = [],
  misses = [],
  isHinglish = false
}) {
  const [selectedMissIndex, setSelectedMissIndex] = useState(0);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideIdx, setActiveGuideIdx] = useState(0);
  const [showEventPicker, setShowEventPicker] = useState(false);

  // Build summary lookup map safely
  const summaryMap = useMemo(() => {
    const map = {};
    if (Array.isArray(summaries)) {
      summaries.forEach(s => {
        if (!s) return;
        const d = s.date || s.id;
        if (d) map[d] = s;
      });
    }
    return map;
  }, [summaries]);

  // Helper to extract exact score for a date
  const getDayScore = (dateStr) => {
    if (!dateStr || !habit?.id) return null;
    const s = summaryMap[dateStr];
    if (!s) return null;
    if (s.habitScores && s.habitScores[habit.id] !== undefined && s.habitScores[habit.id] !== null) {
      return Number(s.habitScores[habit.id]);
    }
    if (s.scores && s.scores[habit.id] !== undefined && s.scores[habit.id] !== null) {
      return Number(s.scores[habit.id]);
    }
    if (s.habits && s.habits[habit.id] !== undefined) {
      const h = s.habits[habit.id];
      if (typeof h === 'number') return h;
      if (typeof h === 'object' && h !== null && typeof h.score === 'number') return h.score;
      if (h === true) return 100;
      if (h === false) return 0;
    }
    return null;
  };

  // Helper to extract actual value for a date
  const getDayValue = (dateStr) => {
    if (!dateStr || !habit?.id) return null;
    const s = summaryMap[dateStr];
    if (!s) return null;
    if (s.habitValues && s.habitValues[habit.id] !== undefined) return s.habitValues[habit.id];
    if (s.values && s.values[habit.id] !== undefined) return s.values[habit.id];
    if (s.actuals && s.actuals[habit.id] !== undefined) return s.actuals[habit.id];
    return null;
  };

  // Sort valid misses with newest first (current / most recent active window first)
  const validMisses = useMemo(() => {
    if (!Array.isArray(misses)) return [];
    const list = misses
      .filter(m => Boolean(m && (m.date || m.missDate)))
      .map(m => ({
        ...m,
        date: m.date || m.missDate
      }));

    // Sort descending by date so index 0 is the most recent
    return list.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [misses]);

  const activeMiss = useMemo(() => {
    if (validMisses.length === 0) return null;
    const idx = Math.max(0, Math.min(selectedMissIndex, validMisses.length - 1));
    return validMisses[idx] || validMisses[0];
  }, [validMisses, selectedMissIndex]);

  // Generate 7-Day Window (Dip Day at offset 0 + Day 1 through Day 7)
  const chartData = useMemo(() => {
    try {
      if (!activeMiss || !activeMiss.date) {
        return ARCHETYPE_CYCLE.map(item => ({
          ...item,
          dateStr: null,
          value: null
        }));
      }

      const dipParts = String(activeMiss.date).split('-');
      let dipDate;
      if (dipParts.length === 3) {
        dipDate = new Date(parseInt(dipParts[0], 10), parseInt(dipParts[1], 10) - 1, parseInt(dipParts[2], 10));
      } else {
        dipDate = new Date(activeMiss.date + 'T00:00:00');
      }

      if (isNaN(dipDate.getTime())) {
        return ARCHETYPE_CYCLE.map(item => ({
          ...item,
          dateStr: null,
          value: null
        }));
      }

      const points = [];
      const todayStr = toDateKey(new Date());

      // Dip Day (Day 0) - Reference anchor
      const dipScoreRaw = getDayScore(activeMiss.date);
      const isDipLogged = dipScoreRaw !== null;
      const dipScore = isDipLogged ? Math.max(0, Math.min(100, Math.round(dipScoreRaw))) : 0;

      points.push({
        dayOffset: 0,
        dayNumberLabel: 'Dip',
        dateStr: activeMiss.date,
        dayName: getDayOfWeekShort(activeMiss.date) || 'Dip',
        dateLabel: getDayAndMonthShort(activeMiss.date),
        score: dipScore,
        value: getDayValue(activeMiss.date),
        isLogged: isDipLogged,
        isFuture: false,
        status: 'dip'
      });

      // Day 1 to Day 7 (The 7-Day Recovery Window)
      for (let i = 1; i <= 7; i++) {
        const d = new Date(dipDate.getFullYear(), dipDate.getMonth(), dipDate.getDate() + i);
        const dateStr = toDateKey(d);
        const rawScore = getDayScore(dateStr);
        const isFuture = dateStr > todayStr;
        const isLogged = rawScore !== null;

        let score = null;
        if (!isFuture) {
          score = isLogged ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0;
        }

        points.push({
          dayOffset: i,
          dayNumberLabel: `Day ${i}`,
          dateStr,
          dayName: getDayOfWeekShort(dateStr) || `D${i}`,
          dateLabel: getDayAndMonthShort(dateStr),
          score,
          value: getDayValue(dateStr),
          isLogged,
          isFuture,
          status: 'rebound'
        });
      }

      return points;
    } catch (e) {
      console.error('Error generating Recovery chartData:', e);
      return ARCHETYPE_CYCLE.map(item => ({
        ...item,
        dateStr: null,
        value: null
      }));
    }
  }, [activeMiss, summaryMap, habit]);

  // Compute prior baseline (Your Usual Score) from the 6 days before the dip date
  const priorBaseline = useMemo(() => {
    if (!activeMiss || !activeMiss.date) return 75;
    try {
      const dipDate = new Date(activeMiss.date + 'T00:00:00');
      if (isNaN(dipDate.getTime())) return 75;
      const scores = [];
      for (let i = 1; i <= 6; i++) {
        const d = new Date(dipDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const s = getDayScore(dateStr);
        if (s !== null) scores.push(Number(s));
      }
      if (scores.length > 0) {
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
      return 75;
    } catch (e) {
      return 75;
    }
  }, [activeMiss, summaryMap, habit]);

  // Simplified KPI Stats
  const stats = useMemo(() => {
    const dipScore = chartData.find(d => d.dayOffset === 0)?.score ?? 0;
    const postDipScores = chartData
      .filter(d => d.dayOffset > 0 && d.score !== null && !d.isFuture)
      .map(d => d.score);

    const bestAfter = postDipScores.length > 0 ? Math.max(...postDipScores) : null;
    const scoreRecovery = bestAfter !== null ? Math.max(0, bestAfter - dipScore) : 0;

    return {
      usualScore: priorBaseline,
      badDayScore: dipScore,
      bestAfter: bestAfter !== null ? bestAfter : 0,
      scoreRecovery
    };
  }, [chartData, priorBaseline]);

  // Narrative summary strip info
  const narrativeInfo = useMemo(() => {
    if (!activeMiss || !activeMiss.date) {
      return {
        dateFormatted: 'Sample Cycle',
        dipScore: stats.badDayScore,
        recoveredDays: 5,
        isInProgress: false,
        recovered: true
      };
    }
    const dateFormatted = formatDateShort(activeMiss.date);
    const recoveredDaysCount = chartData.filter(d => d.dayOffset > 0 && d.score !== null && d.score >= 70).length;
    return {
      dateFormatted,
      dipScore: stats.badDayScore,
      recoveredDays: recoveredDaysCount,
      isInProgress: activeMiss.isInProgress,
      recovered: activeMiss.recovered
    };
  }, [activeMiss, stats.badDayScore, chartData]);

  // SVG Geometry Constants (8 columns: 1 Dip + 7 Recovery Days) - Mobile First Chunky Bars
  const svgWidth = 360;
  const svgHeight = 155;
  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 22;
  const paddingBottom = 34;

  const chartAreaWidth = Math.max(100, svgWidth - paddingLeft - paddingRight); // 344
  const chartAreaHeight = Math.max(40, svgHeight - paddingTop - paddingBottom); // 99
  const numBars = Math.max(1, chartData.length);
  const slotWidth = chartAreaWidth / numBars; // 43
  const barWidth = 28; // chunky, wide, close-together bars

  // Compute coordinates for bars
  const barCoords = useMemo(() => {
    return chartData.map((d, i) => {
      const xCenter = paddingLeft + (i + 0.5) * slotWidth;
      const xLeft = xCenter - barWidth / 2;
      const displayScore = d.score !== null && !isNaN(d.score) ? d.score : 0;
      // Flat 4px base line when score is 0 or upcoming, otherwise proportional height
      const barH = (!d.isFuture && displayScore > 0)
        ? Math.max(6, (displayScore / 100) * chartAreaHeight)
        : 4;
      const yTop = paddingTop + (chartAreaHeight - barH);
      return {
        ...d,
        xCenter: isNaN(xCenter) ? 0 : xCenter,
        xLeft: isNaN(xLeft) ? 0 : xLeft,
        yTop: isNaN(yTop) ? 0 : yTop,
        barH: isNaN(barH) ? 4 : barH,
        displayScore
      };
    });
  }, [chartData, slotWidth, barWidth, chartAreaHeight]);

  const hoveredBar = (hoveredBarIndex !== null && barCoords[hoveredBarIndex]) ? barCoords[hoveredBarIndex] : null;

  return (
    <div className="w-full bg-white dark:bg-[#131722] rounded-2xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">

      {/* ── 1. TOP HEADER (TITLE + LIVE/RECOVERED BADGE + TOP RIGHT (i) BUTTON) ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendUp size={17} weight="bold" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
              7-Day Bounce-Back Curve
            </h3>
            {activeMiss?.isInProgress ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE
              </span>
            ) : narrativeInfo.recovered ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                <CheckCircle size={10} weight="bold" /> Recovered
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                Cycle
              </span>
            )}
          </div>
        </div>

        {/* Top-Right (i) Button */}
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
          title="How this curve works"
        >
          <Info size={15} weight="bold" />
        </button>
      </div>

      {/* ── 1.5. CONTEXT & EVENT SELECTOR SUB-ROW ── */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-1 truncate">
          <span>📍 Slip on <strong className="text-rose-600 dark:text-rose-400 font-black">{narrativeInfo.dateFormatted}</strong> ({narrativeInfo.dipScore}%)</span>
        </div>

        {validMisses.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Event:</span>
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setShowEventPicker(true);
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10.5px] font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              title="Select event cycle"
            >
              <span>{formatDateShort(activeMiss?.date)}</span>
              {activeMiss?.isInProgress ? (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              ) : activeMiss?.recovered ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              )}
              <CaretDown size={11} weight="bold" className="text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. DASH-SEPARATED 4 KPI METRICS (NO SOLID BOX BACKGROUNDS) ── */}
      <div className="grid grid-cols-4 py-2 border-y border-dashed border-slate-200 dark:border-slate-800 w-full">
        <div className="text-center px-0.5 border-r border-dashed border-slate-200 dark:border-slate-800">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block truncate">
            Usual
          </span>
          <div className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">
            {stats.usualScore}%
          </div>
        </div>

        <div className="text-center px-0.5 border-r border-dashed border-slate-200 dark:border-slate-800">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block truncate">
            Bad Day
          </span>
          <div className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {stats.badDayScore}%
          </div>
        </div>

        <div className="text-center px-0.5 border-r border-dashed border-slate-200 dark:border-slate-800">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">
            Best Peak
          </span>
          <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.bestAfter}%
          </div>
        </div>

        <div className="text-center px-0.5">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">
            Regained
          </span>
          <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
            +{stats.scoreRecovery}%
          </div>
        </div>
      </div>

      {/* ── 3. CHUNKY & WIDE 8-DAY BAR CHART (HIGH-CONTRAST SCORES) ── */}
      <div className="w-full bg-slate-50/70 dark:bg-[#0B0F19]/40 rounded-xl p-2 sm:p-3 border border-slate-100 dark:border-slate-800/60">
        <div className="w-full flex items-center justify-center">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Target 70% threshold line */}
            <line 
              x1={paddingLeft} 
              y1={paddingTop + chartAreaHeight * 0.3} 
              x2={svgWidth - paddingRight} 
              y2={paddingTop + chartAreaHeight * 0.3} 
              stroke="currentColor" 
              className="text-emerald-500/35 dark:text-emerald-500/30" 
              strokeWidth="1" 
              strokeDasharray="3 3"
            />
            <text
              x={svgWidth - paddingRight}
              y={paddingTop + chartAreaHeight * 0.3 - 3}
              textAnchor="end"
              className="text-[9px] font-black fill-emerald-600/80 dark:fill-emerald-400/80"
            >
              70% Target
            </text>

            {/* Baseline bottom line */}
            <line 
              x1={paddingLeft} 
              y1={paddingTop + chartAreaHeight} 
              x2={svgWidth - paddingRight} 
              y2={paddingTop + chartAreaHeight} 
              stroke="currentColor" 
              className="text-slate-300 dark:text-slate-700" 
              strokeWidth="1.2" 
            />

            {/* 8 Bars: 1 Dip + Day 1 to Day 7 */}
            {barCoords.map((bar, i) => {
              const isHovered = hoveredBarIndex === i;
              const isDip = bar.dayOffset === 0;
              const isFuture = bar.isFuture;

              let barColor = '#64748B';
              if (isDip) {
                barColor = '#E11D48'; // Dip Red
              } else if (isFuture) {
                barColor = 'transparent';
              } else if (bar.score >= 70) {
                barColor = '#10B981'; // Green (Recovered)
              } else if (bar.score >= 50) {
                barColor = '#F59E0B'; // Amber (Partial)
              } else if (bar.score !== null) {
                barColor = '#F43F5E'; // Low / missed
              }

              return (
                <g 
                  key={i} 
                  className="cursor-pointer transition-all duration-150"
                  onClick={() => setHoveredBarIndex(hoveredBarIndex === i ? null : i)}
                  onMouseEnter={() => setHoveredBarIndex(i)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Upcoming Day Dotted Track Outline */}
                  {isFuture && (
                    <rect
                      x={bar.xLeft}
                      y={paddingTop}
                      width={barWidth}
                      height={chartAreaHeight}
                      rx="4"
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.4)"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                  )}

                  {/* Active Fill Bar */}
                  {!isFuture && (
                    <rect
                      x={bar.xLeft}
                      y={bar.yTop}
                      width={barWidth}
                      height={bar.barH}
                      rx="4"
                      fill={barColor}
                      opacity={isHovered ? 1 : 0.95}
                      className="transition-all duration-150"
                    />
                  )}

                  {/* Prominent Top Score */}
                  <text
                    x={bar.xCenter}
                    y={bar.yTop - 4}
                    textAnchor="middle"
                    className={`transition-all ${
                      isDip
                        ? 'text-[11.5px] font-black fill-rose-600 dark:fill-rose-400'
                        : isFuture
                        ? 'text-[9px] font-semibold fill-slate-400 dark:fill-slate-500'
                        : bar.score >= 70
                        ? 'text-[11px] font-black fill-emerald-600 dark:fill-emerald-400'
                        : bar.score !== null
                        ? 'text-[11px] font-black fill-slate-800 dark:fill-slate-200'
                        : 'text-[9.5px] font-bold fill-slate-400'
                    }`}
                  >
                    {isFuture ? '...' : bar.score !== null ? `${bar.score}%` : '0%'}
                  </text>

                  {/* Day Label (Dip, D1..D7) */}
                  <text
                    x={bar.xCenter}
                    y={svgHeight - paddingBottom + 13}
                    textAnchor="middle"
                    className={`text-[10px] ${
                      isDip 
                        ? 'font-black fill-rose-600 dark:fill-rose-400' 
                        : 'font-extrabold fill-slate-700 dark:fill-slate-300'
                    }`}
                  >
                    {isDip ? 'Dip' : `D${bar.dayOffset}`}
                  </text>

                  {/* Date Sub-label */}
                  <text
                    x={bar.xCenter}
                    y={svgHeight - paddingBottom + 25}
                    textAnchor="middle"
                    className={`text-[8.5px] ${
                      isDip 
                        ? 'font-bold fill-rose-600/90' 
                        : 'font-semibold fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {bar.dateLabel || bar.dayName}
                  </text>

                  {/* Hover / Tap Outline */}
                  {isHovered && !isFuture && (
                    <rect
                      x={bar.xLeft - 1.5}
                      y={bar.yTop - 1.5}
                      width={barWidth + 3}
                      height={bar.barH + 3}
                      rx="4"
                      fill="none"
                      stroke={barColor}
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Micro Tap Inspector & Legend Strip */}
        <div className="mt-1.5 pt-1.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5 truncate text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">
              {hoveredBar ? (
                <>
                  <strong className={hoveredBar.dayOffset === 0 ? 'text-rose-600 font-bold' : hoveredBar.score >= 70 ? 'text-emerald-600 font-bold' : 'text-slate-900 dark:text-white font-bold'}>
                    {hoveredBar.dayNumberLabel} ({hoveredBar.dateLabel}):
                  </strong>{' '}
                  {hoveredBar.isFuture
                    ? 'Upcoming day'
                    : `Score ${hoveredBar.score !== null ? `${hoveredBar.score}%` : '0%'}`}
                  {hoveredBar.value !== null && hoveredBar.value !== undefined && ` (${hoveredBar.value} ${habit?.unit || ''})`}
                </>
              ) : (
                'Tap bar to inspect'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold shrink-0">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]"/>Dip</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/>50-69%</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"/>≥70%</span>
          </div>
        </div>
      </div>

      {/* ── 6. HOW THIS CURVE WORKS INTERACTIVE SHOWCASE MODAL ── */}
      {showGuideModal && (() => {
        const currentStage = CURVE_STAGES[activeGuideIdx] || CURVE_STAGES[0];
        const StageIcon = currentStage.icon;

        const handlePrevGuide = () => {
          if (navigator.vibrate) navigator.vibrate(15);
          setActiveGuideIdx(prev => (prev === 0 ? CURVE_STAGES.length - 1 : prev - 1));
        };

        const handleNextGuide = () => {
          if (navigator.vibrate) navigator.vibrate(15);
          setActiveGuideIdx(prev => (prev === CURVE_STAGES.length - 1 ? 0 : prev + 1));
        };

        return (
          <div 
            className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowGuideModal(false)}
          >
            <div 
              className="relative w-full max-w-[460px] bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white"
              onClick={e => e.stopPropagation()}
            >
              {/* Top Header Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    <Sparkle size={17} weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                      How the 7-Day Curve Works
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                      Toggle through all 4 recovery stages
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowGuideModal(false)} 
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              {/* Interactive Toggle Pills (Horizontal Scroll) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1">
                {CURVE_STAGES.map((stage, idx) => {
                  const IconComp = stage.icon;
                  const isActive = activeGuideIdx === idx;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(15);
                        setActiveGuideIdx(idx);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 border cursor-pointer ${
                        isActive ? stage.activeTabClass : stage.inactiveTabClass
                      }`}
                    >
                      <IconComp size={13} weight={isActive ? "fill" : "bold"} />
                      <span className="whitespace-nowrap">{stage.shortName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Spotlight Showcase Card */}
              <div className={`p-4 rounded-2xl ${currentStage.bgLight} border ${currentStage.borderLight} space-y-3 transition-all duration-200 relative overflow-hidden`}>
                {/* Card Top Title & Tag */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentStage.gradient} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                      <StageIcon size={20} weight="bold" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {currentStage.title}
                      </h5>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[9.5px] font-extrabold border mt-0.5 ${currentStage.badgeClass}`}>
                        {currentStage.tag}
                      </span>
                    </div>
                  </div>

                  {/* Step Counter Badge */}
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-black/30 px-2 py-1 rounded-lg shrink-0">
                    {activeGuideIdx + 1} / {CURVE_STAGES.length}
                  </span>
                </div>

                {/* 3 Structured Highlight Points */}
                <div className="space-y-2 text-xs">
                  {/* 1. Core Concept */}
                  <div className="flex items-start gap-2.5 bg-white/85 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Lightbulb size={14} weight="fill" />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-slate-900 dark:text-white font-bold block text-[11px]">
                        Core Concept:
                      </strong>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug mt-0.5">
                        {currentStage.coreConcept}
                      </p>
                    </div>
                  </div>

                  {/* 2. Calculation Rule */}
                  <div className="flex items-start gap-2.5 bg-white/85 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Lightning size={14} weight="fill" />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-slate-900 dark:text-white font-bold block text-[11px]">
                        Calculation Rule:
                      </strong>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug mt-0.5">
                        {currentStage.rule}
                      </p>
                    </div>
                  </div>

                  {/* 3. Champion Strategy */}
                  <div className="flex items-start gap-2.5 bg-white/85 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Target size={14} weight="fill" />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-slate-900 dark:text-white font-bold block text-[11px]">
                        Champion Strategy:
                      </strong>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug mt-0.5">
                        {currentStage.strategy}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Prev / Next Navigator Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handlePrevGuide}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all shadow-2xs"
                  >
                    <span>← Previous</span>
                  </button>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-1">
                    {CURVE_STAGES.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(15);
                          setActiveGuideIdx(i);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          activeGuideIdx === i ? 'w-4 bg-slate-800 dark:bg-white' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextGuide}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all shadow-2xs"
                  >
                    <span>Next →</span>
                  </button>
                </div>
              </div>

              {/* Footer Button */}
              <div className="pt-1 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowGuideModal(false)} 
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  Got it, Let's Explore
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 7. CUSTOM IN-APP EVENT PICKER MODAL (WEBSITE NATIVE & COMPACT) ── */}
      {showEventPicker && (
        <div 
          className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowEventPicker(false)}
        >
          <div 
            className="relative w-full max-w-sm bg-white dark:bg-[#131722] border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150 text-slate-900 dark:text-white max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Calendar size={15} weight="bold" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                    Select Event Cycle
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {validMisses.length} recorded off-target cycles
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEventPicker(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Event List */}
            <div className="space-y-1.5 overflow-y-auto pr-0.5 max-h-[50vh]">
              {validMisses.map((m, idx) => {
                const isSelected = (selectedMissIndex === idx);
                return (
                  <button
                    key={m.date || idx}
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setSelectedMissIndex(idx);
                      setShowEventPicker(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-950 dark:text-orange-200 shadow-2xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-orange-500 text-white font-black'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 font-bold'
                      }`}>
                        <span className="text-[10px]">{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block truncate">
                          {formatDateShort(m.date)}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-medium block">
                          Slip Day (Dip)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {m.isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[9.5px] font-black border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          LIVE
                        </span>
                      ) : m.recovered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-black border border-emerald-500/30">
                          <CheckCircle size={10} weight="bold" />
                          Recovered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9.5px] font-bold border border-slate-200 dark:border-slate-600">
                          Missed
                        </span>
                      )}

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                          <Check size={11} weight="bold" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Dismiss */}
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowEventPicker(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

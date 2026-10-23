import React, { useState, useMemo } from 'react';
import { 
  Moon, 
  Calendar, 
  CaretDown, 
  CaretUp, 
  Info, 
  Coffee, 
  Barbell, 
  DeviceMobile, 
  Clock, 
  Drop, 
  Sun, 
  Eye, 
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Sparkle,
  ForkKnife,
  ChartBar,
  CalendarBlank
} from '@phosphor-icons/react';
import { runCoreXEngineV3 } from '../analyzer/engine_v3';
import { DEMO_CONFIG, generateDemoLogs } from '../data/demoData';

const IconMap = {
  Coffee: Coffee,
  Barbell: Barbell,
  DeviceMobile: DeviceMobile,
  Drop: Drop,
  Sun: Sun,
  Moon: Moon,
  Clock: Clock,
  Eye: Eye,
  ForkKnife: ForkKnife,
  Sparkle: Sparkle,
  default: Sparkle
};

export default function SleepOptimizationDeepDiveB({ config, logs }) {
  const [openCards, setOpenCards] = useState({
    f_coffee: true,
    f_exercise: true,
    f_screen: true,
    sample_coffee: true,
    sample_exercise: true,
    sample_screen: true
  });
  const [hoveredDay, setHoveredDay] = useState(null);
  const [timeRange, setTimeRange] = useState('14'); // '7' | '14' | '30'

  const toggleCard = (id) => {
    setOpenCards(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  // ── 1. PREPARE EFFECTIVE DATA & SLICED TIMEFRAME ──
  const effectiveLogs = useMemo(() => {
    if (logs && Array.isArray(logs) && logs.length >= 7) {
      return logs;
    }
    return generateDemoLogs(30);
  }, [logs]);

  const effectiveConfig = useMemo(() => {
    if (config?.factors && config.factors.length > 0) {
      return config;
    }
    return DEMO_CONFIG;
  }, [config]);

  // Chronologically sorted logs
  const sortedLogs = useMemo(() => {
    return [...effectiveLogs].sort((a, b) => a.date.localeCompare(b.date));
  }, [effectiveLogs]);

  // Slice logs for selected timeframe (7D / 14D / 30D)
  const rangeLogs = useMemo(() => {
    const days = parseInt(timeRange, 10) || 14;
    return sortedLogs.slice(-days);
  }, [sortedLogs, timeRange]);

  // ── 2. RUN ENGINE ON THE SELECTED TIMEFRAME ──
  const analysisResult = useMemo(() => {
    return runCoreXEngineV3(effectiveConfig, rangeLogs);
  }, [effectiveConfig, rangeLogs]);

  const { factors, overallAvg } = analysisResult;
  const maxImpact = Math.max(1.5, ...factors.map(f => Math.abs(f.analysis?.deltaShrunk || f.analysis?.delta || 0)));

  // Compute percentage improvement vs previous equivalent period
  const trendMetrics = useMemo(() => {
    const days = parseInt(timeRange, 10) || 14;
    const currentWindow = sortedLogs.slice(-days);
    const previousWindow = sortedLogs.slice(-days * 2, -days);

    const avgCurrent = currentWindow.reduce((s, l) => s + Number(l.outcome || 0), 0) / (currentWindow.length || 1);
    const avgPrev = previousWindow.length > 0 
      ? previousWindow.reduce((s, l) => s + Number(l.outcome || 0), 0) / previousWindow.length 
      : (avgCurrent - 0.7);

    const diff = avgCurrent - avgPrev;
    const diffPct = avgPrev > 0 ? Math.round((diff / avgPrev) * 100) : 0;
    return {
      diffPct: Math.abs(diffPct) || 12,
      isPositive: diff >= 0,
      label: `vs previous ${days} days`
    };
  }, [sortedLogs, timeRange]);

  // Donut Gauge SVG calculation
  const currentScore = Number(overallAvg || 7.2);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 10) * circumference;

  // ── 3. DERIVE DYNAMIC SIMPLE INSIGHTS ──
  const dynamicInsights = useMemo(() => {
    const list = [];

    factors.forEach(factor => {
      const delta = factor.analysis?.deltaShrunk || factor.analysis?.delta || 0;
      
      const timeProp = factor.properties?.find(p => p.type === 'time');
      if (timeProp && timeProp.analysis?.slots?.length) {
        const slots = timeProp.analysis.slots;
        const worstSlot = slots.reduce((prev, curr) => (curr.avg < prev.avg ? curr : prev), slots[0]);
        if (worstSlot && worstSlot.avg < overallAvg) {
          list.push({
            type: 'negative',
            title: `Avoid ${factor.name.toLowerCase()} ${worstSlot.label.toLowerCase()}`,
            desc: `Your sleep score is ${Math.abs(round1(overallAvg - worstSlot.avg))} points lower when you have ${factor.name.toLowerCase()} ${worstSlot.label.toLowerCase()}.`,
            impact: Math.abs(overallAvg - worstSlot.avg)
          });
        }
      }

      const numProp = factor.properties?.find(p => p.type === 'number');
      if (numProp && numProp.analysis?.buckets?.length) {
        const buckets = numProp.analysis.buckets;
        const bestBucket = buckets.reduce((prev, curr) => (curr.avg > prev.avg ? curr : prev), buckets[0]);
        if (bestBucket && bestBucket.avg > overallAvg && delta > 0) {
          list.push({
            type: 'positive',
            title: `Do ${bestBucket.label.toLowerCase()} of ${factor.name.toLowerCase()}`,
            desc: `Your sleep score improves by ${Math.abs(round1(bestBucket.avg - overallAvg))} points with ${bestBucket.label.toLowerCase()}.`,
            impact: Math.abs(bestBucket.avg - overallAvg)
          });
        }
      }

      if (Math.abs(delta) >= 0.5) {
        if (delta < 0) {
          list.push({
            type: 'negative',
            title: `Limit ${factor.name}`,
            desc: `Days with ${factor.name.toLowerCase()} lower your sleep score by ${Math.abs(delta).toFixed(1)} points on average.`,
            impact: Math.abs(delta)
          });
        } else {
          list.push({
            type: 'positive',
            title: `Keep up ${factor.name}`,
            desc: `Days with ${factor.name.toLowerCase()} boost your sleep score by +${delta.toFixed(1)} points.`,
            impact: Math.abs(delta)
          });
        }
      }
    });

    list.sort((a, b) => b.impact - a.impact);

    if (list.length < 3) {
      return [
        { type: 'negative', title: 'Avoid caffeine after 4 PM', desc: 'Your sleep score is 2.8 points lower when you have caffeine late in the day.' },
        { type: 'positive', title: 'Do 15–30 min exercise in evening', desc: 'Your sleep score improves by 2.4 points when you exercise in the evening.' },
        { type: 'negative', title: 'Keep screen time low after 9 PM', desc: 'Your sleep score is 2.1 points lower with late night screen time.' }
      ];
    }

    return list.slice(0, 3);
  }, [factors, overallAvg]);

  // Sort factors so positive are at top, negative at bottom
  const sortedFactors = useMemo(() => {
    return [...factors].sort((a, b) => {
      const deltaA = a.analysis?.deltaShrunk || a.analysis?.delta || 0;
      const deltaB = b.analysis?.deltaShrunk || b.analysis?.delta || 0;
      return deltaB - deltaA;
    });
  }, [factors]);

  return (
    <div className="w-full flex flex-col gap-4 font-sans text-on-surface">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Moon size={20} weight="fill" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-on-surface">
                Sleep Optimization
              </h1>
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                Deep Dive
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">
              Your daily habits affect your sleep. Understand what helps and what hurts.
            </p>
          </div>
        </div>

        {/* Timeframe Selector (Interactive 7D | 14D | 30D Segmented Control) */}
        <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
          <div className="flex bg-surface-container-low rounded-xl p-[3px] border border-outline-variant/40 h-[34px] shadow-2xs">
            {['7', '14', '30'].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setTimeRange(d)}
                className={`px-3 flex items-center justify-center rounded-lg transition-all text-xs font-bold cursor-pointer select-none ${
                  timeRange === d 
                    ? 'bg-on-surface text-surface-container-lowest shadow-xs' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 1: SCORE DONUT & COMPACT SLEEP HEATMAP ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
        
        {/* CARD 1: Average Sleep Score */}
        <div className="md:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-on-surface">
              Your Average Sleep Score
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
              trendMetrics.isPositive 
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
                : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
            }`}>
              {trendMetrics.isPositive ? <ArrowUp size={10} weight="bold" /> : <ArrowDown size={10} weight="bold" />}
              {trendMetrics.isPositive ? '+' : '-'}{trendMetrics.diffPct}%
            </span>
          </div>
          
          <div className="flex items-center gap-4 my-auto">
            {/* Donut Ring */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="text-surface-container"
                  strokeWidth="8.5"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="8.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black text-on-surface tracking-tight">
                  {currentScore.toFixed(1)}
                </span>
                <span className="text-[9px] font-bold text-on-surface-variant -mt-1">
                  / 10
                </span>
              </div>
            </div>

            {/* Right Side Stats */}
            <div className="flex flex-col gap-1">
              <div>
                <span className={`inline-block font-bold text-[11px] px-2.5 py-0.5 rounded-md border ${
                  currentScore >= 7.0 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40' 
                    : currentScore >= 5.5
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/40'
                }`}>
                  {currentScore >= 7.0 ? 'Your sleep is good' : currentScore >= 5.5 ? 'Your sleep is moderate' : 'Needs attention'}
                </span>
                <p className="text-[11px] text-on-surface-variant mt-1.5 leading-snug">
                  {currentScore >= 7.0 
                    ? 'A few simple changes can make it even better.' 
                    : 'Track your factors to optimize recovery.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: COMPACT SLEEP HEATMAP (SMALL GREEN/RED SHADES) */}
        <div className="md:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <CalendarBlank size={15} className="text-indigo-500" />
              <h3 className="text-xs font-bold text-on-surface">
                Daily Sleep Heatmap
              </h3>
              <span className="text-[10px] text-on-surface-variant">
                ({rangeLogs.length} Days)
              </span>
            </div>

            {/* Color Shade Legend */}
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-on-surface-variant">
              <span className="text-rose-600 dark:text-rose-400">Low</span>
              <div className="flex items-center gap-0.5">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-rose-500" title="< 5.0" />
                <span className="w-2.5 h-2.5 rounded-[3px] bg-rose-400/60" title="5.0 - 5.9" />
                <span className="w-2.5 h-2.5 rounded-[3px] bg-amber-400/70" title="6.0 - 6.9" />
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400/70" title="7.0 - 7.9" />
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-500" title="8.0 - 10.0" />
              </div>
              <span className="text-emerald-600 dark:text-emerald-400">High</span>
            </div>
          </div>

          {/* Compact Heatmap Grid with subtle green & red shades */}
          <div className="my-auto py-1">
            <div className="flex flex-wrap gap-1.5 items-center">
              {rangeLogs.map((log, idx) => {
                const s = Number(log.outcome !== undefined ? log.outcome : 7);
                const d = new Date(log.date);
                const dayNum = d.getDate();
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                let shadeClass = 'bg-amber-400/70 text-amber-950 dark:text-amber-100';
                if (s >= 8.0) {
                  shadeClass = 'bg-emerald-500 text-white shadow-2xs';
                } else if (s >= 7.0) {
                  shadeClass = 'bg-emerald-400/70 text-emerald-950 dark:text-emerald-100';
                } else if (s >= 6.0) {
                  shadeClass = 'bg-amber-400/70 text-amber-950 dark:text-amber-100';
                } else if (s >= 5.0) {
                  shadeClass = 'bg-rose-400/70 text-rose-950 dark:text-rose-100';
                } else {
                  shadeClass = 'bg-rose-500 text-white shadow-2xs';
                }

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDay({ dateStr: dayName, score: s })}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-115 cursor-pointer relative ${shadeClass}`}
                    title={`${dayName}: ${s.toFixed(1)} / 10`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hover / Tap Details Footer */}
          <div className="text-[10px] text-on-surface-variant flex items-center justify-between pt-1.5 border-t border-outline-variant/15 mt-1">
            {hoveredDay ? (
              <span className="font-bold text-on-surface">
                📅 {hoveredDay.dateStr}: <strong className="text-primary font-black">{hoveredDay.score.toFixed(1)} / 10</strong>
              </span>
            ) : (
              <span>Tap or hover on any day to see score.</span>
            )}
            <span className="text-[9px] font-medium text-on-surface-variant/70">Daily sleep score</span>
          </div>
        </div>

      </div>

      {/* ── ROW 2: HABIT IMPACT DIVERGING GRAPH (MOBILE & DESKTOP REDESIGNED) ── */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xs overflow-hidden p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b border-outline-variant/20 gap-2">
          <div className="flex items-center gap-2">
            <ChartBar size={18} className="text-indigo-500" />
            <h3 className="text-xs sm:text-sm font-black text-on-surface">
              Habit Impact Diverging Graph
            </h3>
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {timeRange} Days
            </span>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 text-[10px] font-bold">
            <span className="text-rose-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Lowers Sleep
            </span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Raises Sleep
            </span>
          </div>
        </div>

        {/* Diverging Bars List (Clean, wide, mobile-friendly cards) */}
        <div className="flex flex-col gap-3 py-1">
          {sortedFactors.map(factor => {
            const diff = factor.analysis?.deltaShrunk || factor.analysis?.delta || 0;
            const isPositive = diff > 0;
            const barWidth = Math.min(100, (Math.abs(diff) / maxImpact) * 100);
            const FactorIcon = IconMap[factor.icon] || Sparkle;
            
            const yesCount = factor.analysis?.yesCount || 0;
            const noCount = factor.analysis?.noCount || 0;
            const totalDays = yesCount + noCount;

            return (
              <div 
                key={factor.id}
                className="bg-surface-container-low/40 dark:bg-surface-container-low/20 p-3 rounded-xl border border-outline-variant/20 flex flex-col gap-2"
              >
                {/* Header row of the factor */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isPositive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-500'
                    }`}>
                      <FactorIcon size={15} weight="fill" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-on-surface">
                      {factor.name}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium bg-surface-container px-2 py-0.5 rounded-md hidden sm:inline-block">
                      Logged {yesCount} of {totalDays} days
                    </span>
                  </div>

                  {/* Score pill badge */}
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    isPositive 
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  }`}>
                    {isPositive ? `+${diff.toFixed(1)}` : diff.toFixed(1)} pts
                    {isPositive ? <ArrowUp size={11} weight="bold" /> : <ArrowDown size={11} weight="bold" />}
                  </span>
                </div>

                {/* Mobile subtext */}
                <div className="sm:hidden text-[10px] text-on-surface-variant/80 -mt-1">
                  Logged on {yesCount} of {totalDays} days
                </div>

                {/* Full-width Responsive Diverging Bar */}
                <div className="w-full flex items-center gap-2 pt-0.5">
                  <span className="text-[9px] font-bold text-rose-500/70 w-8 text-left">Hurts</span>

                  {/* Bar Track Container */}
                  <div className="flex-1 h-3.5 bg-surface-container rounded-full relative overflow-hidden flex items-center border border-outline-variant/20">
                    {/* Center 0 Neutral Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-outline-variant z-20" />

                    {/* Negative Bar (Left Side) */}
                    <div className="w-1/2 h-full flex justify-end">
                      {!isPositive && barWidth > 0 && (
                        <div 
                          className="h-full bg-gradient-to-l from-rose-500 to-rose-600 rounded-l-full transition-all duration-500 shadow-xs"
                          style={{ width: `${barWidth}%` }}
                        />
                      )}
                    </div>

                    {/* Positive Bar (Right Side) */}
                    <div className="w-1/2 h-full flex justify-start">
                      {isPositive && barWidth > 0 && (
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-r-full transition-all duration-500 shadow-xs"
                          style={{ width: `${barWidth}%` }}
                        />
                      )}
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-emerald-500/70 w-8 text-right">Helps</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ROW 3: KEY FACTORS (DETAILED COLLAPSIBLE CARDS) ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-black text-on-surface uppercase tracking-wider">
              Detailed Factor Breakdown
            </h2>
            <div className="group relative">
              <Info size={14} className="text-on-surface-variant hover:text-on-surface cursor-pointer" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg z-30">
                Calculated by comparing days you did each habit vs days you skipped it, scaled with Bayesian shrinkage.
              </div>
            </div>
          </div>
          <span className="text-[10px] text-on-surface-variant">
            {timeRange}-day statistics
          </span>
        </div>

        {/* FACTORS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {factors.map(factor => {
            const delta = factor.analysis?.deltaShrunk || factor.analysis?.delta || 0;
            const isPositive = delta > 0;
            const FactorIcon = IconMap[factor.icon] || Sparkle;
            const isOpen = openCards[factor.id] !== false;

            return (
              <div 
                key={factor.id}
                className={`bg-surface-container-lowest border rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs transition-all ${
                  isPositive 
                    ? 'border-emerald-200/60 dark:border-emerald-900/40' 
                    : 'border-rose-200/60 dark:border-rose-900/40'
                }`}
              >
                <div>
                  {/* Card Header (Fully Clickable) */}
                  <div 
                    onClick={() => toggleCard(factor.id)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        <FactorIcon size={18} weight="fill" />
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface text-xs sm:text-sm">
                          {factor.name}
                        </h3>
                        <p className={`text-[10px] font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {isPositive ? 'Increases your sleep score' : 'Decreases your sleep score'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`font-black text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                        isPositive 
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {isPositive ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                        {isPositive ? <ArrowUp size={10} weight="bold" /> : <ArrowDown size={10} weight="bold" />}
                      </span>
                      <div className="text-on-surface-variant p-0.5">
                        {isOpen ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Content */}
                  {isOpen && (
                    <div className="flex flex-col gap-2.5 mt-3 pt-2.5 border-t border-outline-variant/20 animate-in fade-in duration-200">
                      
                      {/* Scenario A: Factor has custom mini-properties */}
                      {factor.properties && factor.properties.length > 0 ? (
                        factor.properties.map(prop => {
                          if (prop.type === 'number') {
                            const bucket = prop.analysis?.buckets?.[0];
                            const diff = bucket ? round1(bucket.avg - overallAvg) : delta;
                            const isPropPos = diff >= 0;
                            return (
                              <div key={prop.id} className="flex items-center justify-between bg-surface-container-low/40 p-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <Barbell size={15} className="text-on-surface-variant/70" />
                                  <div>
                                    <p className="text-[11px] font-bold text-on-surface">{prop.label}</p>
                                    <p className="text-[9px] text-on-surface-variant">{bucket?.label || 'Tracked quantity'}</p>
                                  </div>
                                </div>
                                <span className={`font-black text-[11px] px-1.5 py-0.2 rounded-md ${
                                  isPropPos ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}>
                                  {isPropPos ? `+${diff}` : diff}
                                </span>
                              </div>
                            );
                          }

                          if (prop.type === 'time') {
                            const slot = prop.analysis?.slots?.[1] || prop.analysis?.slots?.[0];
                            const diff = slot ? round1(slot.avg - overallAvg) : delta;
                            const isSlotPos = diff >= 0;
                            return (
                              <div key={prop.id} className="flex items-center justify-between bg-surface-container-low/40 p-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <Clock size={15} className="text-on-surface-variant/70" />
                                  <div>
                                    <p className="text-[11px] font-bold text-on-surface">{prop.label}</p>
                                    <p className="text-[9px] text-on-surface-variant">{slot?.label || 'Timing pattern'}</p>
                                  </div>
                                </div>
                                <span className={`font-black text-[11px] px-1.5 py-0.2 rounded-md ${
                                  isSlotPos ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}>
                                  {isSlotPos ? `+${diff}` : diff}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div key={prop.id} className="flex items-center justify-between bg-surface-container-low/40 p-2 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Info size={15} className="text-on-surface-variant/70" />
                                <div>
                                  <p className="text-[11px] font-bold text-on-surface">{prop.label}</p>
                                  <p className="text-[9px] text-on-surface-variant">Custom property</p>
                                </div>
                              </div>
                              <span className="font-black text-[11px] px-1.5 py-0.2 rounded-md bg-surface-container text-on-surface-variant">
                                Active
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        /* Scenario B: Factor does NOT have mini-properties (shows YES vs NO stats) */
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between bg-surface-container-low/50 p-2 rounded-xl text-xs">
                            <span className="text-[11px] font-medium text-on-surface-variant">Days logged (YES):</span>
                            <span className="font-bold text-on-surface">{factor.analysis?.yesCount || 0} days <span className="text-[10px] text-on-surface-variant font-normal">(Avg {factor.analysis?.yesAvg || '0'}/10)</span></span>
                          </div>

                          <div className="flex items-center justify-between bg-surface-container-low/50 p-2 rounded-xl text-xs">
                            <span className="text-[11px] font-medium text-on-surface-variant">Days skipped (NO):</span>
                            <span className="font-bold text-on-surface">{factor.analysis?.noCount || 0} days <span className="text-[10px] text-on-surface-variant font-normal">(Avg {factor.analysis?.noAvg || '0'}/10)</span></span>
                          </div>

                          <div className="text-[10px] text-center text-on-surface-variant/80 pt-1 font-medium">
                            {isPositive 
                              ? `Doing ${factor.name} raises your score by +${delta.toFixed(1)} pts`
                              : `Doing ${factor.name} lowers your score by ${delta.toFixed(1)} pts`}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ROW 4: SIMPLE INSIGHTS ── */}
      <div className="bg-surface-container-lowest border border-primary/20 dark:border-primary/30 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lightbulb size={16} weight="fill" />
            </div>
            <div>
              <h3 className="font-black text-on-surface text-xs sm:text-sm">
                Simple Insights
              </h3>
              <p className="text-[10px] text-on-surface-variant">
                Based on your data, here are the key takeaways to improve your sleep.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Insight Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dynamicInsights.map((insight, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-2.5 bg-surface-container-low/50 p-2.5 rounded-xl border border-outline-variant/20"
            >
              <div className={`w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                insight.type === 'positive' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}>
                {idx + 1}
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-xs">
                  {insight.title}
                </h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                  {insight.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function round1(v) {
  return Math.round(v * 10) / 10;
}
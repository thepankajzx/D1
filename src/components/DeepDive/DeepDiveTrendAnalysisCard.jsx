import React, { useState } from 'react';
import Icon from '../Icon';
import { 
  Eye, 
  X, 
  TrendUp, 
  TrendDown, 
  Clock, 
  CheckCircle, 
  Info, 
  Sparkle,
  Hourglass,
  Gauge,
  Check
} from '@phosphor-icons/react';

export default function DeepDiveTrendAnalysisCard({
  trend,
  unit = '',
  fmtVal,
  periodDays = 30,
  dateRange,
  direction = 'higher_is_better',
  habit = null
}) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const days = periodDays || (dateRange ? Math.round((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24)) + 1 : 30);

  const hasPrev = trend && trend.prevAvg !== null && trend.prevAvg !== undefined;
  
  // Determine effective scoring direction
  const effectiveDirection = habit?.direction || direction;
  const isLowerBetter = effectiveDirection === 'lower_is_better';
  const isEarlierBetter = effectiveDirection === 'earlier_is_better' || (habit?.scoringType === 'time' && isLowerBetter);
  const isLaterBetter = effectiveDirection === 'later_is_better' || (habit?.scoringType === 'time' && effectiveDirection === 'higher_is_better');

  const isTimeHabit = isEarlierBetter || isLaterBetter || habit?.scoringType === 'time' || unit === 'Time' || (() => {
    try {
      const sample = fmtVal ? fmtVal(60) : '';
      return typeof sample === 'string' && (sample.includes('AM') || sample.includes('PM'));
    } catch (e) {
      return false;
    }
  })();

  // Evaluate whether the trend is positive (Improvement) or negative (Decline)
  let isPositiveChange = false;
  let isNoChange = !trend || trend.change === 0;

  if (isEarlierBetter) {
    // For earlier is better: negative change means earlier time (IMPROVEMENT)
    isPositiveChange = trend?.change < 0;
  } else if (isLaterBetter) {
    // For later is better: positive change means later time (IMPROVEMENT)
    isPositiveChange = trend?.change > 0;
  } else if (isLowerBetter) {
    // For lower is better (screen time, calories): negative change means reduction (IMPROVEMENT)
    isPositiveChange = trend?.change < 0;
  } else {
    // For higher is better / binary: positive change means increase (IMPROVEMENT)
    isPositiveChange = trend?.change > 0;
  }

  const changeColor = isNoChange 
    ? 'text-slate-700 dark:text-slate-300'
    : (isPositiveChange ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400');

  // Format time differences in human-readable hours and minutes (e.g. "35m", "1h 15m")
  const formatTimeDiff = (mins) => {
    const absMins = Math.abs(mins || 0);
    const h = Math.floor(absMins / 60);
    const m = Math.round(absMins % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const formatNumericDiff = (val) => {
    const absVal = Math.abs(val || 0);
    if (fmtVal) {
      try {
        const formatted = fmtVal(absVal);
        if (typeof formatted === 'string' && !formatted.includes('NaN')) return formatted;
      } catch (e) {
        // fallback
      }
    }
    const unitStr = unit ? ` ${unit}` : '';
    return `${absVal}${unitStr}`;
  };

  const getTrendSummary = () => {
    if (isNoChange) return 'No Change';
    
    if (isTimeHabit) {
      const diffStr = formatTimeDiff(trend?.change);
      if (isEarlierBetter) {
        return isPositiveChange ? `${diffStr} earlier (Improved)` : `${diffStr} later (Delayed)`;
      } else if (isLaterBetter) {
        return isPositiveChange ? `${diffStr} later (Improved)` : `${diffStr} earlier (Dropped)`;
      }
      return trend?.change < 0 ? `${diffStr} earlier` : `${diffStr} later`;
    }

    if (isLowerBetter) {
      const diffStr = formatNumericDiff(trend?.change);
      return isPositiveChange ? `-${diffStr} reduction (Improved)` : `+${diffStr} increase (Exceeded)`;
    }

    const diffStr = formatNumericDiff(trend?.change);
    return isPositiveChange ? `+${diffStr} increase (Improved)` : `-${diffStr} drop (Declined)`;
  };

  // Compute accurate bar heights (from score if present, else normalized ratio)
  let curHeight = 40;
  let prevHeight = 40;

  if (trend?.currentScore !== undefined && trend?.prevScore !== undefined && trend.currentScore !== null && trend.prevScore !== null) {
    curHeight = Math.max(14, Math.min(56, Math.round((trend.currentScore / 100) * 56)));
    prevHeight = Math.max(14, Math.min(56, Math.round((trend.prevScore / 100) * 56)));
  } else if (hasPrev) {
    if (isTimeHabit) {
      // If improved, current bar is taller
      curHeight = isPositiveChange ? 52 : 28;
      prevHeight = isPositiveChange ? 34 : 48;
    } else {
      const maxVal = Math.max(trend?.currentAvg || 0, trend?.prevAvg || 0, 0.001);
      if (isLowerBetter) {
        // For lower is better, lower value = better performance
        curHeight = isPositiveChange ? 52 : Math.max(14, Math.round(((trend?.currentAvg || 0) / maxVal) * 45));
        prevHeight = isPositiveChange ? Math.max(14, Math.round(((trend?.currentAvg || 0) / maxVal) * 45)) : 52;
      } else {
        curHeight = Math.max(14, Math.round(((trend?.currentAvg || 0) / maxVal) * 56));
        prevHeight = Math.max(14, Math.round(((trend?.prevAvg || 0) / maxVal) * 56));
      }
    }
  }

  // Chart coordinate math
  const y1 = 80 - prevHeight;
  const y2 = 80 - curHeight;
  const lineColor = isNoChange ? '#94a3b8' : (isPositiveChange ? '#10b981' : '#ef4444');

  const isPercentage = unit === '%' || (fmtVal && typeof fmtVal(100) === 'string' && fmtVal(100).includes('%'));
  const valueLabel = isTimeHabit ? 'average time' : isPercentage ? 'completion rate' : (habit?.name ? `average ${habit.name}` : 'average value');

  const renderDescription = () => {
    if (!hasPrev) {
      return (
        <>
          Your {valueLabel} for the last {days} days is <strong className="text-slate-800 dark:text-white">{fmtVal(trend?.currentAvg)}</strong>.
          <span className="text-slate-500 ml-1 block mt-1">Track more days to unlock prior {days}-day period comparison.</span>
        </>
      );
    }

    if (isTimeHabit) {
      const timeDiff = formatTimeDiff(trend?.change);
      if (isEarlierBetter) {
        if (isPositiveChange) {
          return (
            <>
              Your average time improved from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>.
              <span className="block mt-1">That's <strong className="text-emerald-600 dark:text-emerald-400">{timeDiff} earlier (Improved)</strong> this period.</span>
            </>
          );
        } else {
          return (
            <>
              Your average time shifted later from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>.
              <span className="block mt-1">That's <strong className="text-red-500 dark:text-red-400">{timeDiff} later (Delayed)</strong> this period.</span>
            </>
          );
        }
      } else {
        if (isPositiveChange) {
          return (
            <>
              Your average time improved from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>.
              <span className="block mt-1">That's <strong className="text-emerald-600 dark:text-emerald-400">{timeDiff} later (Improved)</strong> this period.</span>
            </>
          );
        } else {
          return (
            <>
              Your average time dropped earlier from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>.
              <span className="block mt-1">That's <strong className="text-red-500 dark:text-red-400">{timeDiff} earlier (Declined)</strong> this period.</span>
            </>
          );
        }
      }
    }

    if (isLowerBetter) {
      const numDiff = formatNumericDiff(trend?.change);
      if (isPositiveChange) {
        return (
          <>
            Your {valueLabel} reduced from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>.
            <span className="block mt-1">That's a <strong className="text-emerald-600 dark:text-emerald-400">-{numDiff} reduction (Improved)</strong> this period.</span>
          </>
        );
      } else {
        return (
          <>
            Your {valueLabel} increased from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>.
            <span className="block mt-1">That's a <strong className="text-red-500 dark:text-red-400">+{numDiff} increase (Exceeded Target)</strong> this period.</span>
          </>
        );
      }
    }

    // Higher is better / Binary
    const numDiff = formatNumericDiff(trend?.change);
    if (isPositiveChange) {
      return (
        <>
          Your {valueLabel} increased from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>.
          <span className="block mt-1">That's a <strong className="text-emerald-600 dark:text-emerald-400">+{numDiff} increase (Improved)</strong> this period.</span>
        </>
      );
    } else if (!isNoChange) {
      return (
        <>
          Your {valueLabel} decreased from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>.
          <span className="block mt-1">That's a <strong className="text-red-500 dark:text-red-400">-{numDiff} drop (Declined)</strong> this period.</span>
        </>
      );
    } else {
      return (
        <>
          Your {valueLabel} remained steady at <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> across both periods.
        </>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
      {/* Top Header with Calendar Timeframe Badge & Eye Info Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon name="trending_up" className="text-emerald-500 text-[18px]" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Trend Analysis</h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.vibrate) navigator.vibrate(25);
              setShowHelpModal(true);
            }}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs ml-0.5"
            title="How Trend Analysis Works"
            aria-label="How Trend Analysis Works"
          >
            <Eye size={13} weight="bold" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <Icon name="calendar_today" className="text-[13px] text-slate-500" />
          <span>Last {days}d vs Prior {days}d</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
        {/* Description text */}
        <div className="flex-1">
          <p className="text-[12px] md:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {renderDescription()}
          </p>
        </div>

        {/* Visual Bar Comparison with connecting trend line */}
        <div className="relative w-40 h-28 shrink-0 self-center md:self-auto">
          {hasPrev && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 160 112" style={{ zIndex: 0 }}>
              {/* Connecting Dashed Trend Line between Top of Bar 1 and Top of Bar 2 */}
              <line 
                x1="24" 
                y1={y1} 
                x2="136" 
                y2={y2} 
                stroke={lineColor} 
                strokeWidth="2" 
                strokeDasharray="4 3" 
              />
              {/* Arrow head pointing at the current bar */}
              {!isNoChange && (
                <polygon 
                  points={
                    y2 > y1 
                      ? "132," + (y2 - 6) + " 136," + (y2 + 1) + " 140," + (y2 - 6)  // Downward slope arrow pointing down
                      : "132," + (y2 + 6) + " 136," + (y2 - 1) + " 140," + (y2 + 6)  // Upward slope arrow pointing up
                  }
                  fill={lineColor}
                />
              )}
            </svg>
          )}

          {/* Bars Row */}
          <div className="absolute inset-0 flex items-end justify-between px-1">
            {hasPrev && (
              <div className="w-11 flex flex-col items-center gap-1 z-10">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-800/90 px-1 rounded shadow-2xs">
                  {fmtVal(trend.prevAvg)}
                </span>
                <div 
                  className="w-10 bg-slate-200 dark:bg-slate-700 rounded-t-lg transition-all" 
                  style={{ height: `${prevHeight}px` }}
                />
                <div className="flex flex-col items-center text-center leading-tight">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Prior {days}d</span>
                  <span className="text-[8px] text-slate-400 font-medium">Previous</span>
                </div>
              </div>
            )}

            <div className="w-11 flex flex-col items-center gap-1 z-10 ml-auto">
              <span className={`text-[10px] font-bold bg-white/90 dark:bg-slate-800/90 px-1 rounded shadow-2xs ${changeColor}`}>
                {fmtVal(trend.currentAvg)}
              </span>
              <div 
                className={`w-10 rounded-t-lg border-t border-x shadow-xs transition-all ${
                  isNoChange 
                    ? 'bg-slate-400 border-slate-300' 
                    : (isPositiveChange 
                        ? 'bg-emerald-500 border-emerald-400 dark:bg-emerald-500 dark:border-emerald-400' 
                        : 'bg-red-500 border-red-400 dark:bg-red-500 dark:border-red-400')
                }`}
                style={{ height: `${curHeight}px` }}
              />
              <div className="flex flex-col items-center text-center leading-tight">
                <span className="text-[10px] font-bold text-slate-800 dark:text-white">Last {days}d</span>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold">Current</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── SLEEK ULTRA-COMPACT CENTERED HELP MODAL ── */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-white dark:bg-[#151a26] rounded-2xl w-full max-w-[360px] overflow-hidden shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shadow-2xs">
                  <TrendUp size={14} weight="bold" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  Trend Analysis Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Compact Top Tab Bar */}
            <div className="px-3 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-1">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'time', label: 'Time' },
                { key: 'quantity', label: 'Qty/Dur' },
                { key: 'binary', label: 'Yes/No' }
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setActiveTab(tab.key);
                    }}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center select-none ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Compact Body Content */}
            <div className="p-3.5 space-y-2.5 text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-2 animate-in fade-in duration-100">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Compares your selected period (e.g. <strong>Last 30d</strong>) vs the exact previous period (<strong>Prior 30d</strong>).
                  </p>
                  
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-300 text-[11px] block">Green Bar (Victory):</strong>
                      <span className="text-[10.5px] text-emerald-900/80 dark:text-emerald-200/80">Performance improved or limits maintained.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <strong className="text-rose-700 dark:text-rose-300 text-[11px] block">Red Bar (Decline):</strong>
                      <span className="text-[10.5px] text-rose-900/80 dark:text-rose-200/80">Performance dropped or schedule delayed.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TIME HABITS */}
              {activeTab === 'time' && (
                <div className="space-y-2 animate-in fade-in duration-100">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                    <strong className="text-slate-900 dark:text-white text-[11px] block">Earlier is Better (Wake / Sleep):</strong>
                    <div className="text-[10.5px] space-y-1">
                      <p>• <strong>Shifted Pehle:</strong> 8:30 ➔ 7:45 = <span className="text-emerald-600 font-bold">45m earlier 🟢</span></p>
                      <p>• <strong>Shifted Late:</strong> 7:45 ➔ 8:30 = <span className="text-rose-500 font-bold">45m later 🔴</span></p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    * Midnight bedtimes (11:30 PM & 12:30 AM) are calculated with 24-hr circular continuous averaging.
                  </p>
                </div>
              )}

              {/* TAB 3: QUANTITY & DURATION */}
              {activeTab === 'quantity' && (
                <div className="space-y-2 animate-in fade-in duration-100">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                    <strong className="text-slate-900 dark:text-white text-[11px] block">Higher is Better (Workout, Steps, Water):</strong>
                    <p className="text-[10.5px]">• More volume = <span className="text-emerald-600 font-bold">+15m (Improved) 🟢</span></p>
                    <p className="text-[10.5px]">• Less volume = <span className="text-rose-500 font-bold">-15m (Declined) 🔴</span></p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                    <strong className="text-slate-900 dark:text-white text-[11px] block">Lower is Better (Screen Time, Calories):</strong>
                    <p className="text-[10.5px]">• Reduced = <span className="text-emerald-600 font-bold">-1.5h (Improved) 🟢</span></p>
                    <p className="text-[10.5px]">• Exceeded = <span className="text-rose-500 font-bold">+2.0h (Exceeded) 🔴</span></p>
                  </div>
                </div>
              )}

              {/* TAB 4: YES / NO */}
              {activeTab === 'binary' && (
                <div className="space-y-2 animate-in fade-in duration-100">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                    <strong className="text-slate-900 dark:text-white text-[11px] block">Completion Rate %:</strong>
                    <p className="text-[10.5px]">• Rate Improved: 60% ➔ 85% = <span className="text-emerald-600 font-bold">+25% 🟢</span></p>
                    <p className="text-[10.5px]">• Rate Dropped: 80% ➔ 50% = <span className="text-rose-500 font-bold">-30% 🔴</span></p>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    * Right (✓) is always a win (100%), Wrong (✕) is missed (0%).
                  </p>
                </div>
              )}

            </div>

            {/* Compact Footer */}
            <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs text-center"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

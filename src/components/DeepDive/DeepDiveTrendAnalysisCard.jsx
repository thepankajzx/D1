import React from 'react';
import Icon from '../Icon';

export default function DeepDiveTrendAnalysisCard({
  trend,
  unit = '',
  fmtVal,
  periodDays = 30,
  dateRange,
  direction = 'higher_is_better'
}) {
  const days = periodDays || (dateRange ? Math.round((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24)) + 1 : 30);

  const hasPrev = trend && trend.prevAvg !== null && trend.prevAvg !== undefined;
  const isLowerBetter = direction === 'lower_is_better';
  
  // For lower is better: decrease in value is an improvement!
  const isPositiveChange = isLowerBetter 
    ? (trend?.change < 0)
    : (trend?.change > 0);

  const changeSign = trend?.change > 0 ? '+' : '';
  const changeWord = isPositiveChange ? 'improvement' : (trend?.change === 0 ? 'no change' : 'decrease');
  const changeColor = isPositiveChange ? 'text-emerald-600 dark:text-emerald-400' : (trend?.change === 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-500 dark:text-red-400');

  const formatChange = (val) => {
    const absVal = Math.abs(val);
    try {
      const testFormat = fmtVal(absVal);
      if (testFormat && (testFormat.includes('AM') || testFormat.includes('PM'))) {
        const h = Math.floor(absVal / 60);
        const m = Math.round(absVal % 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
      }
    } catch(e) {}
    return fmtVal(absVal);
  };

  // Compute nice bar heights
  const maxVal = Math.max(trend?.currentAvg || 0, trend?.prevAvg || 0, 0.001);
  const curHeight = Math.max(14, Math.round(((trend?.currentAvg || 0) / maxVal) * 56));
  const prevHeight = hasPrev ? Math.max(14, Math.round(((trend?.prevAvg || 0) / maxVal) * 56)) : 0;

  // Chart coordinate math
  // Container: width 160px, height 112px (h-28)
  // Bar 1 center: x = 24px
  // Bar 2 center: x = 136px
  // Baseline (bottom of bars): y = 80px
  const y1 = 80 - prevHeight;
  const y2 = 80 - curHeight;
  const lineColor = isPositiveChange ? '#10b981' : (trend?.change === 0 ? '#94a3b8' : '#ef4444');

  return (
    <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
      {/* Top Header with Calendar Timeframe Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon name="trending_up" className="text-emerald-500 text-[18px]" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Trend Analysis</h3>
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
            {hasPrev ? (
              <>
                Your average value changed from <strong className="text-slate-800 dark:text-white">{fmtVal(trend.prevAvg)}</strong> <span className="text-slate-400 text-xs">(prior {days} days)</span> to <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong> <span className="text-slate-400 text-xs">(last {days} days)</span>. 
                That's a <strong className={changeColor}> {changeSign}{formatChange(trend.change)} {changeWord}</strong> this period.
              </>
            ) : (
              <>
                Your average for the last {days} days is <strong className="text-slate-800 dark:text-white">{fmtVal(trend.currentAvg)}</strong>.
                <span className="text-slate-500 ml-1 block mt-1">Track more days to unlock prior {days}-day period comparison.</span>
              </>
            )}
          </p>
        </div>

        {/* Visual Bar Comparison with perfectly aligned connecting line */}
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
              {trend?.change !== 0 && (
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
                  isPositiveChange 
                    ? 'bg-emerald-500 border-emerald-400 dark:bg-emerald-500 dark:border-emerald-400' 
                    : (trend?.change === 0 ? 'bg-slate-400 border-slate-300' : 'bg-red-500 border-red-400 dark:bg-red-500 dark:border-red-400')
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
    </div>
  );
}

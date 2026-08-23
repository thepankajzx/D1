import React, { useState } from 'react';
import Icon from '../Icon';

export default function DeepDiveKPIStrip({ 
  habit, 
  summary, 
  targetValue, 
  unit = '', 
  improvement, 
  bestDay, 
  fmtVal, 
  formatDate,
  streaks,
  currentStreak,
  bestStreak,
  recoveryScore,
  recoveryStreak,
  resilienceSummary
}) {
  const [activeInfo, setActiveInfo] = useState(null);
  
  const isBinary = habit?.scoringType === 'binary' || habit?.scoringType === 'yn';
  const isTime = habit?.scoringType === 'time';
  const isOptimal = habit?.scoringType === 'optimal_range' || habit?.direction === 'optimal_range';
  const improveSign = improvement > 0 ? '+' : '';

  const curStreakVal = currentStreak !== undefined ? currentStreak : (streaks?.current ?? 0);
  const bestStreakVal = bestStreak !== undefined ? bestStreak : (streaks?.best ?? 0);
  const recScoreVal = recoveryScore !== undefined ? recoveryScore : (streaks?.recoveryScore ?? 100);
  const recStreakVal = recoveryStreak !== undefined ? recoveryStreak : (streaks?.recoveryStreak ?? 0);
  const resSumVal = resilienceSummary || streaks?.resilienceSummary || 'High Resilience';

  const resolvedUnit = (unit && unit !== 'Time' && unit !== 'time') 
    ? unit 
    : ((habit?.unit || habit?.defaultUnit || habit?.customUnit || habit?.targetUnit || '') !== 'Time' && (habit?.unit || habit?.defaultUnit || habit?.customUnit || habit?.targetUnit || '') !== 'time' 
      ? (habit?.unit || habit?.defaultUnit || habit?.customUnit || habit?.targetUnit || '') 
      : '');

  // Format Target display
  const targetDisplay = (() => {
    if (isBinary) {
      return <span>Yes (100%)</span>;
    }

    const val = targetValue || habit?.userTarget100 || habit?.target100 || habit?.targetValue || habit?.target;
    if (!val || val === 'Not Set' || val <= 0) {
      if (isTime) {
        const timeVal = habit?.userTarget100 || habit?.target100 || 360;
        return fmtVal ? fmtVal(timeVal) : `${timeVal}`;
      }
      return 'Not Set';
    }

    if (isTime) return fmtVal ? fmtVal(val) : val;

    // Range handling
    let displayVal = val;
    if (isOptimal) {
      const minVal = habit?.target100 || habit?.userTarget100 || val;
      const maxVal = habit?.targetMax || habit?.userTargetMax || (Number(minVal) + 2);
      displayVal = `${minVal} - ${maxVal}`;
    } else if (typeof val === 'string' && val.includes('-')) {
      const parts = val.split('-').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
      if (parts.length === 2) {
        const [min, max] = [Math.min(parts[0], parts[1]), Math.max(parts[0], parts[1])];
        displayVal = min === max ? `${min}` : `${min} - ${max}`;
      }
    }

    const directionPrefix = (!isOptimal && habit?.direction === 'higher_is_better') ? '≥ ' : (!isOptimal && habit?.direction === 'lower_is_better') ? '≤ ' : '';

    return (
      <span className="flex items-baseline gap-1">
        <span>{directionPrefix}{displayVal}</span>
        {resolvedUnit && <span className="text-xs md:text-sm font-semibold text-slate-500">{resolvedUnit}</span>}
      </span>
    );
  })();

  // Format Avg Value display
  const avgDisplay = (() => {
    if (!summary || summary.avgValue === undefined || summary.avgValue === null) return 'N/A';
    if (isTime) return fmtVal ? fmtVal(summary.avgValue) : summary.avgValue;
    return (
      <span className="flex items-baseline gap-1">
        <span>{typeof summary.avgValue === 'number' ? Math.round(summary.avgValue * 10) / 10 : summary.avgValue}</span>
        {resolvedUnit && <span className="text-xs md:text-sm font-semibold text-blue-600">{resolvedUnit}</span>}
      </span>
    );
  })();

  // Format Best Day display
  const bestDayDisplay = (() => {
    if (!bestDay || bestDay.value === undefined || bestDay.value === null) return 'N/A';
    if (isTime) return fmtVal ? fmtVal(bestDay.value) : bestDay.value;
    return (
      <span className="flex items-baseline gap-1">
        <span>{typeof bestDay.value === 'number' ? Math.round(bestDay.value * 10) / 10 : bestDay.value}</span>
        {resolvedUnit && <span className="text-xs md:text-sm font-semibold text-amber-600">{resolvedUnit}</span>}
      </span>
    );
  })();

  const cards = [
    {
      id: 'bestStreak',
      label: 'Best Streak',
      value: (
        <span className="flex items-baseline gap-1">
          <span>{bestStreakVal}</span>
          <span className="text-xs font-semibold text-slate-500">Days</span>
        </span>
      ),
      subtitle: 'Personal Record',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/40',
      iconName: 'whatshot',
      infoText: 'Your longest continuous streak of completing this habit without missing a day.',
    },
    {
      id: 'bestDay',
      label: 'Best Day',
      value: bestDayDisplay,
      subtitle: (bestDay?.date && formatDate) ? formatDate(bestDay.date) : 'Peak performance',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40',
      iconName: 'emoji_events',
      infoText: 'The single day where you achieved the optimal value for this habit.',
    },
    {
      id: 'avgValue',
      label: 'Avg Value',
      value: avgDisplay,
      subtitle: 'Average pace',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40',
      iconName: 'bar_chart',
      infoText: 'Your average performance per day across the current time period.',
    },
    {
      id: 'improvement',
      label: 'Improvement',
      value: improvement !== null && improvement !== undefined ? (
        <span className={`text-2xl md:text-3xl font-black ${improvement > 0 ? 'text-emerald-500' : improvement < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
          {improveSign}{improvement}%
        </span>
      ) : (
        <span className="text-2xl md:text-3xl font-black text-slate-400">N/A</span>
      ),
      subtitle: 'vs prior period',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40',
      iconName: 'trending_up',
      infoText: 'Percentage change in your performance compared to the previous time period.',
    },
    {
      id: 'target',
      label: 'Target',
      value: targetDisplay,
      subtitle: 'Configured goal',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40',
      iconName: 'my_location',
      infoText: 'The specific goal or threshold you have set for this habit.',
    }
  ];

  return (
    <div className="flex overflow-x-auto gap-2.5 pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 snap-x hide-scrollbar md:grid md:grid-cols-5 md:gap-3 w-full">
      {cards.map((card) => (
        <div 
          key={card.id} 
          className="snap-start flex-shrink-0 w-[135px] sm:w-[145px] md:w-auto bg-white dark:bg-[#151a26] rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all min-h-[100px] md:min-h-[115px]"
        >
          {/* Top row: Icon badge + Info icon */}
          <div className="flex items-center justify-between mb-2">
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
              <Icon name={card.iconName} className="text-[15px] md:text-[17px]" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveInfo(activeInfo === card.id ? null : card.id)}
                className={`p-1 rounded-full transition-colors flex items-center justify-center ${activeInfo === card.id ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon name="info" className="text-[14px]" />
              </button>
              
              {activeInfo === card.id && (
                <>
                  {/* Backdrop for click-away */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setActiveInfo(null); }}
                  />
                  {/* Tooltip Bubble */}
                  <div className="absolute right-0 top-full mt-1 w-44 md:w-48 bg-slate-800 text-white text-[11px] font-medium leading-relaxed p-2.5 rounded-lg shadow-xl z-50">
                    {card.infoText}
                    {/* Little pointer triangle */}
                    <div className="absolute -top-1 right-1.5 w-2.5 h-2.5 bg-slate-800 rotate-45" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom section: Label + Big Value + Subtitle */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] md:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {card.label}
            </span>
            <div className="text-lg md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {card.value}
            </div>
            {card.subtitle && (
              <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                {card.subtitle}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

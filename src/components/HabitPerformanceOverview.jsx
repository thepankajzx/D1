import React from 'react';
import HabitIcon from './HabitIcon';
import { 
  Star, 
  Target, 
  TrendUp, 
  TrendDown, 
  Funnel, 
  X 
} from '@phosphor-icons/react';

export default function HabitPerformanceOverview({
  habitStats = [],
  overallAverage = 0,
  rangeOption = '30',
  isHinglish = false,
  selectedHabitId = 'all',
  onSelectHabit
}) {
  if (!habitStats || habitStats.length === 0) return null;

  // Rank all active habits descending by average score
  const sortedHabits = [...habitStats].sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
  const count = sortedHabits.length;
  const focusThreshold = 25;

  // Timeframe text
  const timeframeLabel = rangeOption === 'custom' 
    ? (isHinglish ? 'कस्टम' : 'Custom') 
    : `${rangeOption || 30} ${isHinglish ? 'दिन' : 'Days'}`;

  const selectedHabit = habitStats.find(h => h.id === selectedHabitId);

  // Constants for vertical bar height
  const maxUsableHeight = 130; // px
  const minBarHeight = 6; // px

  return (
    <section className="w-full bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-3 sm:p-5 shadow-xs transition-all self-start space-y-2.5 overflow-hidden isolate relative">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {isHinglish ? 'हैबिट परफॉरमेंस ओवरव्यू' : 'Habit Performance Overview'}
            </h2>
            <span className="text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              {timeframeLabel}
            </span>
          </div>
          <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isHinglish 
              ? 'सभी आदतें एक नज़र में औसत स्कोर के अनुसार' 
              : 'All habits at a glance ranked by average score'}
          </p>
        </div>

        {/* Right side: Overall Avg Pill + Filter Reset */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedHabitId !== 'all' && selectedHabit ? (
            <button
              onClick={() => onSelectHabit && onSelectHabit('all')}
              className="flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/80 transition-all cursor-pointer shadow-2xs"
            >
              <Funnel size={11} weight="fill" />
              <span>{isHinglish ? `फ़िल्टर: ${selectedHabit.name}` : `Filtered: ${selectedHabit.name}`}</span>
              <X size={11} weight="bold" className="ml-0.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-[10.5px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-2xs">
              <span>{isHinglish ? 'कुल औसत:' : 'Overall Avg:'}</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-black">{overallAverage}%</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── VERTICAL BARS CHART CONTAINER (100% WIDTH, NO HORIZONTAL SCROLL) ── */}
      <div className="relative w-full h-[250px] sm:h-[265px] select-none pt-2">
        
        {/* BASELINE AXIS */}
        <div className="absolute left-0 right-10 sm:right-12 bottom-[74px] sm:bottom-[78px] h-[1px] bg-slate-200 dark:bg-slate-800 z-10" />

        {/* OVERALL AVERAGE DASHED LINE */}
        {(() => {
          const bottomOffset = 74; // px
          const topPercent = Math.min(100, Math.max(0, overallAverage));
          const lineBottomPx = bottomOffset + (topPercent / 100) * (maxUsableHeight);

          return (
            <div
              className="absolute left-0 right-10 sm:right-12 z-20 pointer-events-none border-t border-dashed border-indigo-400 dark:border-indigo-500 transition-all duration-300"
              style={{ bottom: `${lineBottomPx}px` }}
            >
              <div className="absolute right-[-40px] sm:right-[-46px] top-[-9px] flex items-center gap-0.5 text-[9px] sm:text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap bg-white dark:bg-[#131722] px-1 py-0.2 rounded border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
                <span>Avg</span>
                <strong className="text-[10px] sm:text-[11px] font-black">{overallAverage}%</strong>
              </div>
            </div>
          );
        })()}

        {/* HABIT COLUMNS GRID (FITS ALL HABITS ACROSS 100% WIDTH) */}
        <div 
          className="absolute left-0 right-10 sm:right-12 top-0 bottom-0 grid gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        >
          {sortedHabits.map((habit, idx) => {
            const score = Math.min(100, Math.max(0, habit.avgScore || 0));
            const isFocus = score <= focusThreshold || (idx === count - 1 && score < 30);
            const isTopAchiever = idx === 0 && score >= 50;
            const barHeightPx = Math.max(minBarHeight, (score / 100) * maxUsableHeight);
            const color = habit.color || "#10b981";
            const delta = habit.delta || 0;
            const isPositiveDelta = delta >= 0;
            const isSelected = selectedHabitId === habit.id;

            return (
              <div 
                key={habit.id}
                onClick={() => onSelectHabit && onSelectHabit(isSelected ? 'all' : habit.id)}
                className={`relative h-full flex flex-col items-center cursor-pointer transition-all group ${
                  isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30 rounded-xl' : ''
                }`}
                title={`${habit.name}: ${score}% (Click to filter)`}
              >
                {/* COMPACT FOCUS INDICATOR (Mini dot / badge - never collides horizontally!) */}
                {isFocus && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                    <span 
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs text-[8px]"
                      title="Focus Area"
                    >
                      <Target size={9} weight="fill" />
                    </span>
                  </div>
                )}

                {/* VERTICAL BAR AREA */}
                <div className="absolute top-4 left-0 right-0 bottom-[74px] sm:bottom-[78px] flex items-end justify-center z-10">
                  <div 
                    className={`relative w-[70%] max-w-[24px] min-w-[8px] rounded-t-md sm:rounded-t-lg transition-all duration-300 shadow-2xs group-hover:brightness-110 ${
                      isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#131722]' : ''
                    }`}
                    style={{
                      height: `${barHeightPx}px`,
                      backgroundColor: color
                    }}
                  >
                    {/* SCORE LABEL ON TOP OF BAR */}
                    <div className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 text-[8.5px] sm:text-[10.5px] font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {score}%
                    </div>

                    {/* TOP ACHIEVER STAR */}
                    {isTopAchiever && (
                      <div className="absolute -top-2 -right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 text-amber-500 flex items-center justify-center z-20 shadow-xs">
                        <Star size={8} weight="fill" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── BELOW THE BAR: CIRCULAR HABIT SYMBOL + NAME + DELTA ── */}
                <div className="absolute left-0 right-0 bottom-0 h-[70px] sm:h-[74px] flex flex-col items-center justify-start z-20 px-0.5 pt-1.5">
                  
                  {/* ROUND HABIT SYMBOL (Canonical HabitIcon) */}
                  <div className="shrink-0 transition-transform group-hover:scale-110 mb-0.5">
                    <HabitIcon habit={habit} size={22} />
                  </div>

                  {/* HABIT NAME (Compact & Truncated with full tooltip) */}
                  <span 
                    className={`w-full text-center text-[8px] sm:text-[10px] font-bold truncate leading-tight transition-colors px-0.5 max-w-full ${
                      isSelected 
                        ? 'text-indigo-600 dark:text-indigo-400 font-black' 
                        : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  >
                    {habit.name}
                  </span>

                  {/* DELTA MOVEMENT BADGE */}
                  <div className={`mt-0.5 px-1 py-0.2 rounded-full inline-flex items-center justify-center gap-0.5 text-[7px] sm:text-[8.5px] font-black whitespace-nowrap ${
                    isPositiveDelta
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60'
                      : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60'
                  }`}>
                    {isPositiveDelta ? (
                      <TrendUp size={7} weight="bold" />
                    ) : (
                      <TrendDown size={7} weight="bold" />
                    )}
                    <span>{Math.abs(delta)}%</span>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ── BOTTOM LEGEND ── */}
      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[8.5px] sm:text-[9.5px] font-extrabold">
        <span className="text-emerald-600 dark:text-emerald-400 shrink-0">
          {isHinglish ? 'उत्कृष्ट' : 'Great'}
        </span>
        
        <div className="flex-1 h-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 opacity-80" />
        
        <span className="text-amber-500 shrink-0">
          {isHinglish ? 'औसत' : 'Avg'}
        </span>

        <div className="flex-1 h-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 opacity-80" />

        <span className="text-rose-500 shrink-0">
          {isHinglish ? 'फोकस' : 'Focus'}
        </span>
      </div>

    </section>
  );
}

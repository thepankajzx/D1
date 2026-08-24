import React, { useState, useMemo } from 'react';
import Icon from '../Icon';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  CaretDown, Sparkle, CaretRight, X, CalendarCheck
} from '@phosphor-icons/react';

export default function DeepDiveAdvancedHeatmap({
  habit,
  allSummaries = [],
  onDayClick,
  className = ''
}) {
  const { isHinglish } = useLanguage();

  // Timeframe state (7d, 14d, 30d, 90d, 365d, all)
  const [timeframe, setTimeframe] = useState('30d');
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);

  // Heatmap controls & filter state
  const [heatmapFilter, setHeatmapFilter] = useState('all'); // 'all', 'elite_90', 'target_80', 'passing_50', 'struggle_below_50', 'critical_below_30', 'skipped'
  const [dayTypeFilter, setDayTypeFilter] = useState('all'); // 'all', 'weekdays', 'weekends'
  const [heatmapLayout, setHeatmapLayout] = useState('continuous'); // 'continuous' | 'month_blocks'
  const [heatmapGranularity, setHeatmapGranularity] = useState('day'); // 'day', 'week', 'month'
  const [showPercentages, setShowPercentages] = useState(false);
  const [showHeatmapControlModal, setShowHeatmapControlModal] = useState(false);

  // Timeframe date computation
  const { startDateStr, endDateStr, timeframeDays, timeframeLabel } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endStr = today.toISOString().split('T')[0];

    let days = 30;
    let label = '30D';
    if (timeframe === '7d') { days = 7; label = '7D'; }
    else if (timeframe === '14d') { days = 14; label = '14D'; }
    else if (timeframe === '30d') { days = 30; label = '30D'; }
    else if (timeframe === '90d') { days = 90; label = '90D'; }
    else if (timeframe === '1y') { days = 365; label = '1Y'; }
    else if (timeframe === 'all') { days = 365; label = 'ALL'; }

    const startObj = new Date(today);
    startObj.setDate(startObj.getDate() - (days - 1));
    const startStr = startObj.toISOString().split('T')[0];

    return {
      startDateStr: startStr,
      endDateStr: endStr,
      timeframeDays: days,
      timeframeLabel: label
    };
  }, [timeframe]);

  // Map summaries by date for fast lookup
  const summaryMap = useMemo(() => {
    const map = new Map();
    if (!allSummaries || !allSummaries.length) return map;
    allSummaries.forEach(s => {
      if (s && s.date) map.set(s.date, s);
    });
    return map;
  }, [allSummaries]);

  // List of all dates in the selected timeframe
  const datesList = useMemo(() => {
    const arr = [];
    const curr = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');

    while (curr <= end) {
      arr.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return arr;
  }, [startDateStr, endDateStr]);

  // Compute Average Score & Trend Change in this period
  const { currentAvgScore, scoreChange } = useMemo(() => {
    if (!datesList.length) return { currentAvgScore: 0, scoreChange: 0 };
    
    let totalScore = 0;
    let loggedCount = 0;

    datesList.forEach(dStr => {
      const sum = summaryMap.get(dStr);
      const score = habit?.id ? (sum?.habitScores?.[habit.id] ?? 0) : (sum?.overallScore ?? 0);
      if (score > 0) {
        totalScore += score;
        loggedCount++;
      }
    });

    const currentAvg = loggedCount > 0 ? Math.round(totalScore / loggedCount) : 0;

    // Prior period average for trend delta
    let priorTotal = 0;
    let priorCount = 0;
    const priorEnd = new Date(startDateStr + 'T00:00:00');
    priorEnd.setDate(priorEnd.getDate() - 1);
    const priorStart = new Date(priorEnd);
    priorStart.setDate(priorStart.getDate() - (timeframeDays - 1));

    const pCurr = new Date(priorStart);
    while (pCurr <= priorEnd) {
      const dStr = pCurr.toISOString().split('T')[0];
      const sum = summaryMap.get(dStr);
      const score = habit?.id ? (sum?.habitScores?.[habit.id] ?? 0) : (sum?.overallScore ?? 0);
      if (score > 0) {
        priorTotal += score;
        priorCount++;
      }
      pCurr.setDate(pCurr.getDate() + 1);
    }

    const priorAvg = priorCount > 0 ? Math.round(priorTotal / priorCount) : currentAvg;
    const change = currentAvg - priorAvg;

    return {
      currentAvgScore: currentAvg,
      scoreChange: change
    };
  }, [datesList, summaryMap, habit, timeframeDays, startDateStr]);

  // Color gradient helper for score bands
  const getPerfBandClass = (score) => {
    if (score === null || score === undefined) return 'bg-slate-100 dark:bg-slate-800/60 text-slate-400';
    if (score <= 10) return 'bg-red-800 text-white';
    if (score <= 20) return 'bg-rose-600 text-white';
    if (score <= 35) return 'bg-rose-400 text-white';
    if (score <= 50) return 'bg-emerald-300 dark:bg-emerald-400/80 text-emerald-950';
    if (score <= 65) return 'bg-emerald-500 text-white';
    if (score <= 80) return 'bg-emerald-600 text-white';
    return 'bg-emerald-700 text-white';
  };

  // Month-blocks grouping
  const monthBlocksData = useMemo(() => {
    if (heatmapLayout !== 'month_blocks') return [];
    const monthsMap = new Map();

    datesList.forEach(dStr => {
      const dObj = new Date(dStr + 'T00:00:00');
      const mKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}`;
      if (!monthsMap.has(mKey)) {
        monthsMap.set(mKey, {
          monthKey: mKey,
          monthFullLabel: dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          dates: []
        });
      }
      monthsMap.get(mKey).dates.push(dStr);
    });

    const result = [];
    monthsMap.forEach((mObj) => {
      const firstDate = new Date(mObj.dates[0] + 'T00:00:00');
      const jsDay = firstDate.getDay();
      const padCount = jsDay === 0 ? 6 : jsDay - 1;

      const cells = [];
      for (let i = 0; i < padCount; i++) {
        cells.push({ id: `pad-start-${mObj.monthKey}-${i}`, isPad: true });
      }
      mObj.dates.forEach(dStr => {
        cells.push({ id: dStr, isPad: false, dStr });
      });

      result.push({
        monthKey: mObj.monthKey,
        monthFullLabel: mObj.monthFullLabel,
        dates: mObj.dates,
        cells
      });
    });

    return result;
  }, [datesList, heatmapLayout]);

  const habitName = habit?.name || 'Overall';

  return (
    <div className={`bg-white dark:bg-[#151a26] p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 w-full ${className}`}>
      
      {/* ── TOP HEADER PILL BAR (Exact Layout from Design) ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        
        {/* Left: Habit / Scope Pill + Score KPI Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 select-none shadow-2xs">
            <Sparkle size={14} weight="fill" className="text-emerald-500 shrink-0" />
            <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">
              {habitName}
            </span>
          </div>

          {/* Score & Delta KPI Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 select-none shadow-2xs font-mono text-xs">
            <span className="font-black text-slate-900 dark:text-white">
              {currentAvgScore}%
            </span>
            {scoreChange !== 0 && (
              <span className={`font-black flex items-center gap-0.5 text-[11px] ${scoreChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {scoreChange > 0 ? '↗ +' : '↘ '}{scoreChange}%
              </span>
            )}
          </div>
        </div>

        {/* Right: Timeframe Dropdown Pill + Filter Trigger Icon Button */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Timeframe selector button */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              setShowTimeframeModal(true);
            }}
            className="flex items-center justify-center gap-1 px-3 h-[32px] rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs select-none text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide cursor-pointer transition-all active:scale-95 group"
            title="Change Timeframe"
          >
            <span>{timeframeLabel}</span>
            <CaretDown size={10} weight="bold" className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5 shrink-0" />
          </button>

          {/* Advanced Filter Settings Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(25);
                setShowHeatmapControlModal(true);
              }}
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border shadow-2xs bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              title="Heatmap Settings & Filters"
            >
              <Icon name="tune" className="text-[14px]" />
            </button>

            {/* Filter Active Badge Indicator */}
            {(heatmapFilter !== 'all' || dayTypeFilter !== 'all') && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131722] pointer-events-none" />
            )}
          </div>
        </div>

      </div>

      {/* ── HEATMAP GRID (CONTINUOUS / MONTH BLOCKS) ── */}
      <div className="pt-1 select-none">
        {heatmapLayout === 'month_blocks' ? (
          <div className="space-y-4">
            {monthBlocksData.map(m => (
              <div key={m.monthKey} className="space-y-2 p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/35 border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {m.monthFullLabel}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 py-0.5">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {m.cells.map(cell => {
                    if (cell.isPad) return <div key={cell.id} className="h-8 sm:h-9 rounded-md bg-transparent" />;
                    const dStr = cell.dStr;
                    const sum = summaryMap.get(dStr);
                    const isLogged = sum != null && (habit?.id ? sum?.habitScores?.[habit.id] !== undefined : sum?.overallScore !== undefined);
                    const score = isLogged ? (habit?.id ? (sum?.habitScores?.[habit.id] ?? 0) : (sum?.overallScore ?? 0)) : null;
                    const bgClass = getPerfBandClass(score);

                    return (
                      <div
                        key={dStr}
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(30);
                          onDayClick?.(dStr);
                        }}
                        className={`h-8 sm:h-9 rounded-md sm:rounded-lg ${bgClass} border border-black/5 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 relative shadow-2xs`}
                      >
                        {!isLogged && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />}
                        {showPercentages && isLogged && (
                          <span className={`text-[9.5px] font-black leading-none ${(score <= 35 || score >= 60) ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {Math.round(score)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Continuous 7-Column Grid */
          <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-10 gap-1.5 sm:gap-2">
            {datesList.map(dStr => {
              const sum = summaryMap.get(dStr);
              const isLogged = sum != null && (habit?.id ? sum?.habitScores?.[habit.id] !== undefined : sum?.overallScore !== undefined);
              const score = isLogged ? (habit?.id ? (sum?.habitScores?.[habit.id] ?? 0) : (sum?.overallScore ?? 0)) : null;
              const bgClass = getPerfBandClass(score);

              // Filter match
              let isScoreMatch = true;
              if (heatmapFilter === 'elite_90') isScoreMatch = score >= 90;
              else if (heatmapFilter === 'target_80') isScoreMatch = score >= 80;
              else if (heatmapFilter === 'passing_50') isScoreMatch = score >= 50;
              else if (heatmapFilter === 'struggle_below_50') isScoreMatch = score !== null && score < 50;
              else if (heatmapFilter === 'critical_below_30') isScoreMatch = score !== null && score < 30;
              else if (heatmapFilter === 'skipped') isScoreMatch = !isLogged || score === 0;

              const isAnyFilterActive = heatmapFilter !== 'all' || dayTypeFilter !== 'all';
              const filterEffectClass = isScoreMatch ? 'opacity-100' : 'opacity-15 grayscale scale-95';

              return (
                <div
                  key={dStr}
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    onDayClick?.(dStr);
                  }}
                  className={`h-9 sm:h-11 rounded-lg sm:rounded-xl ${bgClass} ${isAnyFilterActive ? filterEffectClass : ''} border border-black/5 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 relative shadow-2xs`}
                >
                  {!isLogged && <span className="w-1.5 h-1.5 rounded-full bg-slate-400/80 dark:bg-slate-500" />}
                  {showPercentages && isLogged && (
                    <span className={`text-[10px] font-black leading-none ${(score <= 35 || score >= 60) ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {Math.round(score)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── HEATMAP LEGEND (Exact Design from Image) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
        
        {/* Left: Less [🔴🔴🟠🟢🟢] More Scale */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 dark:text-slate-500">Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-red-800 block shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-[3px] bg-rose-500 block shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-[3px] bg-rose-400 block shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400 block shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-700 block shadow-2xs" />
          </div>
          <span className="text-slate-400 dark:text-slate-500">More</span>
        </div>

        {/* Right: Partial & No Data dots */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
            <span>Partial</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span>No Data</span>
          </div>
        </div>

      </div>

      {/* ── TIMEFRAME SELECTOR MODAL ── */}
      {showTimeframeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white dark:bg-[#151a26] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                {isHinglish ? 'टाइमफ़्रेम चुनें' : 'Select Timeframe'}
              </h4>
              <button 
                onClick={() => setShowTimeframeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                { id: '7d', label: '7 Days', desc: 'Last 1 Week' },
                { id: '14d', label: '14 Days', desc: 'Last 2 Weeks' },
                { id: '30d', label: '30 Days', desc: 'Last 1 Month (Recommended)' },
                { id: '90d', label: '90 Days', desc: 'Last Quarter' },
                { id: '1y', label: '1 Year', desc: 'Full Year Grid' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTimeframe(opt.id);
                    setShowTimeframeModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    timeframe === opt.id 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs' 
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HEATMAP CONTROLS MODAL ── */}
      {showHeatmapControlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                {isHinglish ? 'हीटमैप सेटिंग्स और फ़िल्टर्स' : 'Heatmap Settings & Filters'}
              </h4>
              <button 
                onClick={() => setShowHeatmapControlModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Score Filters */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isHinglish ? 'परफॉर्मेंस फ़िल्टर' : 'Score Highlights'}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'All Days' },
                  { id: 'elite_90', label: 'Elite (90%+)' },
                  { id: 'target_80', label: 'Target (80%+)' },
                  { id: 'passing_50', label: 'Passing (50%+)' },
                  { id: 'struggle_below_50', label: 'Struggle (<50%)' },
                  { id: 'skipped', label: 'Skipped / 0%' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHeatmapFilter(f.id)}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      heatmapFilter === f.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Options */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isHinglish ? 'लेआउट मोड' : 'Grid Layout'}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setHeatmapLayout('continuous')}
                  className={`p-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                    heatmapLayout === 'continuous'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Continuous
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapLayout('month_blocks')}
                  className={`p-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                    heatmapLayout === 'month_blocks'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Month Blocks
                </button>
              </div>
            </div>

            {/* Toggle Percentages inside cells */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isHinglish ? 'सेल्स में % दिखाएं' : 'Show Percentages in Cells'}
              </span>
              <button
                type="button"
                onClick={() => setShowPercentages(!showPercentages)}
                className={`w-10 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${showPercentages ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showPercentages ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHeatmapControlModal(false)}
                className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black cursor-pointer"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

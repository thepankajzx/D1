import DeepDiveAdvancedHeatmap from './DeepDiveAdvancedHeatmap';
import { useMemo, useState } from 'react';
import { getEarlierIsBetterAnalytics } from '../../lib/earlierIsBetterAnalytics';
import { generateHeatmapGrid } from '../../lib/analytics';
import Icon from '../Icon';
import HabitIcon from '../HabitIcon';
import DeepDiveTrendChart from './DeepDiveTrendChart';
import DeepDivePerformanceDonut from './DeepDivePerformanceDonut';
import DeepDiveKPIStrip from './DeepDiveKPIStrip';
import DeepDiveTrendAnalysisCard from './DeepDiveTrendAnalysisCard';
import DeepDiveInsights from './DeepDiveInsights';
import DeepDiveStreakRecoveryBanner from './DeepDiveStreakRecoveryBanner';

import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
import PriorityIcon from '../PriorityIcon';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, PieChart, GridComponent, TooltipComponent, CanvasRenderer]);


export default function EarlierIsBetterTemplate({ habit, allSummaries, habits, dateRange }) {
  const data = useMemo(() => {
    return getEarlierIsBetterAnalytics(habit, allSummaries, dateRange);
  }, [habit, allSummaries, dateRange]);

  const heatmapGrid = useMemo(() => {
    if (!allSummaries || !allSummaries.length) return [];
    return generateHeatmapGrid(allSummaries, 'habit', habit.id, dateRange.start, dateRange.end);
  }, [allSummaries, habit.id, dateRange]);

  const [showPercentages, setShowPercentages] = useState(false);
  const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(false);
  const [isChartsExpanded, setIsChartsExpanded] = useState(false);
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  
  const [binaryLegendPopup, setBinaryLegendPopup] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  if (!data) return null;
  const consistencyRate = data.summary?.totalDays > 0 ? Math.round(((data.summary.trackedDays ?? data.summary.daysOnTarget ?? 0) / data.summary.totalDays) * 100) : 0;

  const { summary, targetValue, target0, unit, formatVal, fmtVal: rawFmtVal, bestDay, improvement, weekdayPattern, maxWeekdayAvg, dailyDetails, personalBests, trend, insights, weakestDay } = data;

  const fmtVal = (typeof data.fmtVal === 'function' ? data.fmtVal : (typeof data.formatVal === 'function' ? data.formatVal : ((v) => v != null ? String(v) : '—')));

  
      function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const improveSign = improvement > 0 ? '+' : '';

  return (
    <div className="flex flex-col gap-3 md:gap-5 w-full pb-10">

      {/* ── 1. HABIT HEADER ──────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#151a26] rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col w-full">
        <div className="p-3.5 md:p-5 flex items-start gap-4 w-full">
          <HabitIcon name={habit.icon} habitId={habit.id} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 w-full mb-1">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight truncate flex items-center gap-2">
                {habit.name}
                
              </h2>
              <button 
                onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setShowScoringInfo(!showScoringInfo); }}
                className={`px-2.5 py-1.5 text-[10px] md:text-xs font-bold rounded-lg whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer border ${showScoringInfo ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
              >
                <span>Scoring</span>
                <Icon name={showScoringInfo ? "expand_less" : "expand_more"} className="text-[14px] ml-0.5" />
              </button>
            </div>
            <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-medium leading-snug">
              Target: <span className="text-slate-700 dark:text-slate-200">≤ {targetValue > 0 ? fmtVal(targetValue) : 'Set in habit config'}</span>
              <span className="hidden md:inline"> &nbsp;·&nbsp; </span>
              <br className="md:hidden" />
              Scoring: <span className="text-slate-700 dark:text-slate-200">Earlier Is Better</span>
            </p>
          </div>
        </div>

        {/* Scoring Info Popdown */}
        {showScoringInfo && (
          <div className="px-3.5 md:px-5 pb-3.5 md:pb-5">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40 p-3 md:p-4 text-[11px] md:text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-800 dark:text-white">How your score works: </strong>
              Before <strong className="text-emerald-600">{targetValue > 0 ? fmtVal(targetValue) : 'Ideal Time'} = 100 points</strong>. 
              After that, score decreases. 
              <span className="text-rose-500 font-semibold ml-1">At Late Limit = 0 points.</span>
            
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                        Completing the habit earlier means better performance. Staying at or below your target keeps you at 100 points. Going above it gradually reduces your score.
                    </p>
                    <div className="mt-1 p-2 bg-indigo-50/50 rounded-lg text-center text-[10px] font-bold text-indigo-700 border border-indigo-100/50">
                        Move DOWN ? ? Score goes UP
                    </div>
                </div>
              </div>
            </div>
          )}
        

        {/* KPIs Separator */}
        <div className="border-t border-dashed border-slate-200 dark:border-slate-800"></div>

        {/* KPIs */}
        <div className="grid grid-cols-4 w-full p-2.5 sm:p-3.5 md:p-4 divide-x divide-dashed divide-slate-200 dark:divide-slate-800">
          <div className="flex flex-col items-center justify-center px-0.5 text-center">
            <span className="text-[10px] sm:text-[11px] md:text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 truncate max-w-full">
              Score
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-emerald-600 leading-none">
              {summary.overallScore}%
            </span>
          </div>
          <div className="flex flex-col items-center justify-center px-0.5 text-center">
            <span className="text-[10px] sm:text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate max-w-full">
              Streak
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-orange-500 leading-none flex items-baseline gap-0.5 justify-center">
              {data.currentStreak ?? 0}<span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">d</span>
            </span>
          </div>
          <div className="flex flex-col items-center justify-center px-0.5 text-center">
            <span className="text-[10px] sm:text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate max-w-full">
              Consist.
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-teal-600 leading-none">
              {consistencyRate}%
            </span>
          </div>
          <div className="flex flex-col items-center justify-center px-0.5 text-center">
            <span className="text-[10px] sm:text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate max-w-full">
              Days
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-indigo-600 leading-none flex items-baseline gap-0.5 justify-center">
              {summary.daysOnTarget}<span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">/{summary.totalDays}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── 2. RECOVERY STREAK PREMIUM HERO CARD ──────────────────────────── */}
      <DeepDiveStreakRecoveryBanner 
        habit={habit}
        recoveryData={data.recoveryData || {}}
        currentStreak={data.currentStreak ?? 0}
        bestStreak={data.personalBests?.bestStreak?.value ?? data.bestStreak ?? 0}
      />

      {/* ── 3. KPI STRIP ────────────────────────────────────────────────── */}
      <DeepDiveKPIStrip 
        habit={habit}
        summary={summary}
        targetValue={targetValue || (data && (data.target100 || data.targetValue))}
        unit={unit}
        improvement={improvement}
        bestDay={bestDay}
        fmtVal={fmtVal}
        formatDate={formatDate}
        streaks={data.streaks}
        currentStreak={data.currentStreak}
        bestStreak={data.bestStreak}
        recoveryScore={data.recoveryScore}
        recoveryStreak={data.recoveryStreak}
        resilienceSummary={data.resilienceSummary}
      />

      {/* ── 3. SCORE CHART + DONUT ──────────────────────────────────────── */}
      <div id="deep-dive-charts-section-earlier" className="w-full flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-base font-bold text-slate-900">Performance & Trend Analytics</h3>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">• Score Trend & Distribution</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 w-full">
          {/* Trend Chart - Expandable */}
          <div className={isChartsExpanded ? "fixed inset-0 z-[100] bg-background overflow-y-auto p-4 sm:p-6 md:p-10 flex flex-col custom-scrollbar" : "md:col-span-3 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm flex flex-col relative w-full overflow-hidden"}>
            <div className={`flex flex-col h-full ${isChartsExpanded ? 'max-w-[1400px] mx-auto w-full flex-1' : 'flex-1'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Success Over Time</h3>
                  <span className="text-xs font-semibold text-slate-400">Score Trend</span>
                </div>
                <button
                  type="button"
                  onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setIsChartsExpanded(!isChartsExpanded); }}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title={isChartsExpanded ? "Exit Fullscreen" : "Fullscreen View"}
                >
                  <Icon name={isChartsExpanded ? "fullscreen_exit" : "fullscreen"} className="text-[15px]" />
                  <span>{isChartsExpanded ? "Exit Fullscreen" : "Fullscreen"}</span>
                </button>
              </div>
              <div className={`relative w-full ${isChartsExpanded ? 'flex-1 min-h-[400px]' : 'flex-1 min-h-[180px]'}`}>
                <DeepDiveTrendChart habit={habit} allSummaries={allSummaries} dateRange={dateRange} />
              </div>
            </div>
          </div>

          {/* Performance Zone - Stationary */}
          <div className="md:col-span-2 bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Performance Zone</h3>
              <span className="text-xs font-semibold text-slate-400">Distribution</span>
            </div>
            <DeepDivePerformanceDonut habit={habit} allSummaries={allSummaries} dateRange={dateRange} data={data} />
          </div>
        </div>
      </div>

      {/* ── 4. HEATMAP + WEEKDAY PATTERN ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">

        {/* Heatmap */}
        <DeepDiveAdvancedHeatmap 
          habit={habit} 
          allSummaries={allSummaries} 
          onDayClick={(dStr) => {
            if (navigator.vibrate) navigator.vibrate(40);
            setSelectedDay(dStr);
          }} 
        />

        
        <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col w-full">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Usage Pattern</h3>
          <p className="text-[10px] md:text-[11px] text-slate-400 mb-4">Average daily usage by day of week</p>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {weekdayPattern.map((w, i) => (
              <div key={i} className="grid items-center gap-2 text-[10px] md:text-[11px]" style={{gridTemplateColumns: '72px 1fr 56px'}}>
                <span className="text-slate-600 dark:text-slate-400 font-medium">{w.day.slice(0,3)}</span>
                <div className="h-[7px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{width: maxWeekdayAvg > 0 ? `${(w.avg / maxWeekdayAvg) * 100}%` : '0%'}}></div>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-right">{w.count > 0 ? fmtVal(w.avg) : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. TREND + EXPLANATION ────────────────────────────────────────── */}
      <div className="w-full flex flex-col">
          <DeepDiveTrendAnalysisCard 
          trend={trend}
          unit={unit}
          fmtVal={fmtVal}
          dateRange={dateRange}
          direction={habit.direction}
        />

        
      </div>

      {/* ── 6. DAILY DETAILS + PERSONAL BESTS + INSIGHTS ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
        <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="fact_check" className="text-indigo-500 text-[18px]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Daily Details</h3>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {dailyDetails.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] md:text-xs font-medium">
                <div className="flex items-center gap-2 w-20 md:w-24">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${d.score !== null && d.score >= 100 ? 'bg-emerald-500' : d.score !== null ? 'bg-red-400' : 'bg-slate-300'}`}></div>
                  <span className="text-slate-600 dark:text-slate-400">{formatDate(d.date)}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold">{d.value !== null ? fmtVal(d.value) : '—'}</span>
                <span className={`px-2 py-1 border rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wide w-14 md:w-16 text-center ${d.score !== null && d.score >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : d.score !== null ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  {d.score !== null ? Math.round(d.score) + '%' : 'No data'}
                </span>
              </div>
            ))}
            {dailyDetails.length === 0 && <div className="text-xs text-slate-400 text-center py-4">No recent records.</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="emoji_events" className="text-amber-500 text-[18px]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Bests</h3>
          </div>
          <div className="flex flex-col gap-4 flex-1 pt-1">
            {[
              { label: 'Earliest Time', value: personalBests.bestValue !== null ? fmtVal(personalBests.bestValue) + (personalBests.bestDate ? ' · ' + formatDate(personalBests.bestDate) : '') : 'N/A' },
              { label: 'Best Week Avg', value: personalBests.bestWeekAvg !== null ? fmtVal(personalBests.bestWeekAvg) : 'N/A' },
              { label: 'Most Consistent Day', value: personalBests.mostConsistentDay },
              { label: 'Longest On-Target Streak', value: personalBests.longestStreak > 0 ? personalBests.longestStreak + ' Days' : 'N/A' },
            ].map((pb, i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="flex items-start gap-2.5">
                  <Icon name="done_all" className="text-indigo-400 text-[16px] mt-0.5" />
                  <p className="text-xs md:text-[13px] font-bold text-slate-700 dark:text-slate-300">{pb.label}</p>
                </div>
                <span className="text-[13px] md:text-sm font-bold text-emerald-500">{pb.value}</span>
              </div>
            ))}
          </div>
        </div>

        <DeepDiveInsights 
          habit={habit}
          summary={summary}
          weakestDay={weakestDay}
          improvement={improvement}
          weekdayPattern={weekdayPattern}
        />
      </div>

      {/* ── Bottom note ───────────────────────────────────────────────────── */}
      <div className="p-3 md:p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-center text-[11px] md:text-[12px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
        With Earlier Is Better, progress means moving down. Every value below your limit is a win.
      </div>

      {/* ── Day Details Modal ─────────────────────────────────────────────── */}
      {selectedDay && (() => {
        const dateObj = new Date(selectedDay + 'T00:00:00');
        const daySummary = allSummaries.find(s => s.id === selectedDay);
        const score = daySummary?.habitScores?.[habit.id];
        const hasData = score !== undefined && score !== null;
        const scoreVal = hasData ? score : 0;
        const mainBand = Math.max(1, Math.ceil(scoreVal / 10));

        return (
          <div
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setSelectedDay(null); }}
          >
            <div
              className="bg-surface-container-lowest rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container">
                <div>
                  <h3 className="text-[20px] font-bold text-on-surface leading-tight">
                    {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-on-surface-variant text-[13px] font-medium mt-1">Daily Performance</p>
                </div>
                <button
                  onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setSelectedDay(null); }}
                  className="w-10 h-10 rounded-full bg-surface-variant/30 text-on-surface-variant flex items-center justify-center hover:bg-surface-variant/50 hover:text-on-surface transition-colors"
                >
                  <Icon name="close" className="text-[22px]" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto custom-scrollbar flex-grow bg-surface-container-lowest">
                {!hasData ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                      <Icon name="event_busy" className="text-[28px] text-on-surface-variant/40" />
                    </div>
                    <p className="text-on-surface font-semibold text-[16px]">No Data Recorded</p>
                    <p className="text-on-surface-variant text-[14px] mt-1">You didn't log this habit on this day.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-[16px] border border-primary/10">
                      <span className="text-[15px] font-bold text-on-surface">{habit.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[24px] font-black text-perf-${mainBand}`}>
                          {Math.round(score)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

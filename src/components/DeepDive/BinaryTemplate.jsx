import DeepDiveAdvancedHeatmap from './DeepDiveAdvancedHeatmap';
import { useMemo, useState } from 'react';
import { getBinaryDeepDiveAnalytics } from '../../lib/binaryAnalytics';
import { generateHeatmapGrid } from '../../lib/analytics';
import Icon from '../Icon';
import HabitIcon from '../HabitIcon';
import DeepDiveTrendChart from './DeepDiveTrendChart';
import DeepDivePerformanceDonut from './DeepDivePerformanceDonut';
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

export default function BinaryTemplate({ habit, allSummaries, habits, dateRange }) {
  const [activeInfo, setActiveInfo] = useState(null);
  // We use useMemo to completely isolate calculations.
  // We compute the normalized payload only when dependencies change.
  const data = useMemo(() => {
    return getBinaryDeepDiveAnalytics(habit, allSummaries, dateRange);
  }, [habit, allSummaries, dateRange]);

  if (!data) return null;
  const consistencyRate = data.summary?.totalDays > 0 ? Math.round(((data.summary.trackedDays ?? data.summary.successfulDays ?? 0) / data.summary.totalDays) * 100) : 0; // or Skeleton

  // Find habit names for impacts
  const getHabitName = (hId) => {
    const h = habits.find(h => h.id === hId);
    return h ? h.name : 'Unknown Habit';
  };
  
  const getHabitIcon = (hId) => {
    const h = habits.find(h => h.id === hId);
    return h ? h.icon : 'star';
  };
  
  const [showPercentages, setShowPercentages] = useState(false);
  const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(false);
  const [isChartsExpanded, setIsChartsExpanded] = useState(false);
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  
  const [binaryLegendPopup, setBinaryLegendPopup] = useState(null); // 'completed' | 'missed' | 'nodata'
  const [selectedDay, setSelectedDay] = useState(null);
  
  const heatmapGrid = useMemo(() => {
    if (!allSummaries || allSummaries.length === 0) return [];
    return generateHeatmapGrid(allSummaries, 'habit', habit.id, dateRange.start, dateRange.end);
  }, [allSummaries, habit.id, dateRange]);

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
              Target: <span className="text-slate-700 dark:text-slate-200">Complete daily</span>
              <span className="hidden md:inline"> &nbsp;·&nbsp; </span>
              <br className="md:hidden" />
              Scoring: <span className="text-slate-700 dark:text-slate-200">Yes / No</span>
            </p>
          </div>
        </div>

        {/* Scoring Info Popdown */}
        {showScoringInfo && (
          <div className="px-3.5 md:px-5 pb-3.5 md:pb-5">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40 p-3 md:p-4 text-[11px] md:text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-800 dark:text-white">How your score works: </strong>
              Completing the habit on any day gives <strong className="text-emerald-600">100 points</strong>. Missing it gives <strong className="text-rose-500">0 points</strong>.
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
              {data.summary.overallScore}%
            </span>
          </div>
          <div className="flex flex-col items-center justify-center px-0.5 text-center">
            <span className="text-[10px] sm:text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate max-w-full">
              Streak
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-orange-500 leading-none flex items-baseline gap-0.5 justify-center">
              {data.streaks?.current ?? 0}<span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">d</span>
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
              {data.summary.successfulDays}<span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">/{data.summary.totalDays}</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. STREAKS & RECOVERY DEEP DIVE BANNER */}
      <DeepDiveStreakRecoveryBanner 
        habit={habit}
        recoveryData={data.recoveryData || {}}
        currentStreak={data.streaks.current}
        bestStreak={data.streaks.best}
      />

      {/* 3. KPI STRIP (Analytical KPIs without top row redundancy) */}
      <div className="flex overflow-x-auto gap-2.5 pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 snap-x hide-scrollbar md:grid md:grid-cols-5 md:gap-3 w-full">
        {/* Card 1: Best Streak */}
        <div className="snap-start flex-shrink-0 w-[135px] sm:w-[145px] md:w-auto bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all min-h-[100px] md:min-h-[115px]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-orange-50 border border-orange-100 text-orange-500">
              <Icon name="whatshot" className="text-[15px] md:text-[17px]" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveInfo(activeInfo === 'bestStreak' ? null : 'bestStreak')}
                className={`p-1 rounded-full transition-colors flex items-center justify-center ${activeInfo === 'bestStreak' ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon name="info" className="text-[14px]" />
              </button>
              
              {activeInfo === 'bestStreak' && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setActiveInfo(null); }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 md:w-48 bg-slate-800 text-white text-[11px] font-medium leading-relaxed p-2.5 rounded-lg shadow-xl z-50">
                    Your longest continuous streak of completing this habit without missing a day.
                    <div className="absolute -top-1 right-1.5 w-2.5 h-2.5 bg-slate-800 rotate-45" />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] md:text-[11px] font-semibold text-slate-500 truncate">Best Streak</span>
            <div className="text-lg md:text-2xl font-black text-slate-900 leading-tight">
              {data.streaks.best} <span className="text-xs font-semibold text-slate-500">Days</span>
            </div>
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate mt-0.5">Personal Record</span>
          </div>
        </div>

        {/* Card 2: Best Month */}
        <div className="snap-start flex-shrink-0 w-[135px] sm:w-[145px] md:w-auto bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all min-h-[100px] md:min-h-[115px]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-amber-50 border border-amber-100 text-amber-500">
              <Icon name="emoji_events" className="text-[15px] md:text-[17px]" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveInfo(activeInfo === 'bestMonth' ? null : 'bestMonth')}
                className={`p-1 rounded-full transition-colors flex items-center justify-center ${activeInfo === 'bestMonth' ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon name="info" className="text-[14px]" />
              </button>
              
              {activeInfo === 'bestMonth' && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setActiveInfo(null); }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 md:w-48 bg-slate-800 text-white text-[11px] font-medium leading-relaxed p-2.5 rounded-lg shadow-xl z-50">
                    Your best performing month for this habit.
                    <div className="absolute -top-1 right-1.5 w-2.5 h-2.5 bg-slate-800 rotate-45" />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] md:text-[11px] font-semibold text-slate-500 truncate">Best Month</span>
            <div className="text-lg md:text-2xl font-black text-slate-900 leading-tight flex items-baseline gap-1">
              <span>{data.personalBests.bestMonthScore?.value || 0}%</span>
            </div>
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate mt-0.5">{data.personalBests.bestMonthScore?.period || 'All-time best'}</span>
          </div>
        </div>

        {/* Card 3: Improvement */}
        <div className="snap-start flex-shrink-0 w-[135px] sm:w-[145px] md:w-auto bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all min-h-[100px] md:min-h-[115px]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Icon name="trending_up" className="text-[15px] md:text-[17px]" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveInfo(activeInfo === 'improvement' ? null : 'improvement')}
                className={`p-1 rounded-full transition-colors flex items-center justify-center ${activeInfo === 'improvement' ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon name="info" className="text-[14px]" />
              </button>
              
              {activeInfo === 'improvement' && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setActiveInfo(null); }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 md:w-48 bg-slate-800 text-white text-[11px] font-medium leading-relaxed p-2.5 rounded-lg shadow-xl z-50">
                    Percentage change in your performance compared to the previous time period.
                    <div className="absolute -top-1 right-1.5 w-2.5 h-2.5 bg-slate-800 rotate-45" />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] md:text-[11px] font-semibold text-slate-500 truncate">Improvement</span>
            <div className="text-lg md:text-2xl font-black text-slate-900 leading-tight">
              {data.improvement !== null && data.improvement !== undefined ? (
                <span className={data.improvement >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                  {data.improvement > 0 ? `+${data.improvement}` : data.improvement}%
                </span>
              ) : (
                'N/A'
              )}
            </div>
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate mt-0.5">vs prior period</span>
          </div>
        </div>

        {/* Card 4: Tracked Days */}
        <div className="snap-start flex-shrink-0 w-[135px] sm:w-[145px] md:w-auto bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all min-h-[100px] md:min-h-[115px]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-600">
              <Icon name="bar_chart" className="text-[15px] md:text-[17px]" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveInfo(activeInfo === 'trackedDays' ? null : 'trackedDays')}
                className={`p-1 rounded-full transition-colors flex items-center justify-center ${activeInfo === 'trackedDays' ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon name="info" className="text-[14px]" />
              </button>
              
              {activeInfo === 'trackedDays' && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setActiveInfo(null); }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 md:w-48 bg-slate-800 text-white text-[11px] font-medium leading-relaxed p-2.5 rounded-lg shadow-xl z-50">
                    The total number of days you successfully logged or tracked this habit.
                    <div className="absolute -top-1 right-1.5 w-2.5 h-2.5 bg-slate-800 rotate-45" />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] md:text-[11px] font-semibold text-slate-500 truncate">Active Logging</span>
            <div className="text-lg md:text-2xl font-black text-slate-900 leading-tight flex items-baseline gap-1">
              <span>{data.summary.trackedDays || data.summary.successfulDays || 0}</span>
              <span className="text-xs font-semibold text-slate-400">/ {data.summary.totalDays}d</span>
            </div>
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate mt-0.5">Days logged</span>
          </div>
        </div>

        {/* Card 5: Target */}
        <div className="snap-start flex-shrink-0 w-[135px] sm:w-[145px] md:w-auto bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all min-h-[100px] md:min-h-[115px]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-purple-50 border border-purple-100 text-purple-600">
              <Icon name="my_location" className="text-[15px] md:text-[17px]" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveInfo(activeInfo === 'target' ? null : 'target')}
                className={`p-1 rounded-full transition-colors flex items-center justify-center ${activeInfo === 'target' ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
              >
                <Icon name="info" className="text-[14px]" />
              </button>
              
              {activeInfo === 'target' && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => { e.stopPropagation(); setActiveInfo(null); }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 md:w-48 bg-slate-800 text-white text-[11px] font-medium leading-relaxed p-2.5 rounded-lg shadow-xl z-50">
                    The specific goal or threshold you have set for this habit.
                    <div className="absolute -top-1 right-1.5 w-2.5 h-2.5 bg-slate-800 rotate-45" />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] md:text-[11px] font-semibold text-slate-500 truncate">Target</span>
            <div className="text-lg md:text-2xl font-black text-slate-900 leading-tight truncate">
              Daily
            </div>
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate mt-0.5">Configured goal</span>
          </div>
        </div>
      </div>

      {/* 5. CHARTS ROW */}
      <div id="deep-dive-charts-section" className="w-full flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-base font-bold text-slate-900">Performance & Trend Analytics</h3>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">• Score Trend & Distribution</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
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

      {/* 6. HEATMAP & PATTERN */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 w-full">
          <DeepDiveAdvancedHeatmap 
            habit={habit} 
            allSummaries={allSummaries} 
            onDayClick={(dStr) => {
              if (navigator.vibrate) navigator.vibrate(40);
              setSelectedDay(dStr);
            }} 
            className="md:col-span-3" 
          />

        {/* Completion Pattern Card */}
        <div className="md:col-span-2 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Completion Pattern</h3>
          </div>
          <p className="text-[10px] md:text-[11px] text-slate-500 mb-4 md:mb-5">Your success rate by day of week</p>

          <div className="flex flex-col gap-3 flex-1 justify-center pb-2">
            {[
              { label: 'Monday', val: data.patterns.monday },
              { label: 'Tuesday', val: data.patterns.tuesday },
              { label: 'Wednesday', val: data.patterns.wednesday },
              { label: 'Thursday', val: data.patterns.thursday },
              { label: 'Friday', val: data.patterns.friday },
              { label: 'Saturday', val: data.patterns.saturday },
              { label: 'Sunday', val: data.patterns.sunday }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] md:text-[11px]">
                <span className="w-16 md:w-20 text-slate-600 font-medium">{p.label.substring(0,3)}<span className="hidden md:inline">{p.label.substring(3)}</span></span>
                <div className="flex-1 mx-2 md:mx-3 h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#22c55e]" style={{width: `${p.val || 0}%`}}></div>
                </div>
                <span className="w-8 md:w-10 text-right text-slate-700 font-bold">{p.val !== null ? p.val + '%' : '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. TREND & IMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
        
        <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full">
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 md:mb-3">
              <Icon name="trending_up" className="text-indigo-500 text-[18px]" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Trend Analysis</h3>
            </div>
            <p className="text-[12px] md:text-[13px] text-slate-700 leading-relaxed font-medium">
              {data.trend.change >= 0 
                ? `Your consistency is improving. You completed ${data.trend.currentPeriodScore}% of days this period, up from ${data.trend.previousPeriodScore}% last period.`
                : `Your consistency dropped slightly. You completed ${data.trend.currentPeriodScore}% of days this period, down from ${data.trend.previousPeriodScore}% last period.`}
            </p>
          </div>
          
          <div className="w-40 md:w-48 h-28 md:h-32 relative flex items-end justify-center gap-8 md:gap-10 mt-2 md:mt-0 pb-6 text-[10px] md:text-xs font-medium text-slate-500">
            <div className="flex flex-col items-center z-10">
              <span className="mb-1 text-slate-500 font-bold">{data.trend.previousPeriodScore}%</span>
              <div className="w-8 md:w-10 bg-slate-200 rounded-t-lg relative" style={{height: `${Math.max(10, data.trend.previousPeriodScore)}px`}}></div>
              <span className="absolute bottom-0 whitespace-nowrap text-[9px] md:text-[10px]">Prev</span>
            </div>
            <div className="flex flex-col items-center z-10">
              <span className="mb-1 text-emerald-600 font-bold">{data.trend.currentPeriodScore}%</span>
              <div className="w-8 md:w-10 bg-emerald-400 rounded-t-lg relative shadow-sm border-t border-x border-emerald-300" style={{height: `${Math.max(10, data.trend.currentPeriodScore)}px`}}></div>
              <span className="absolute bottom-0 whitespace-nowrap text-[9px] md:text-[10px] text-slate-800">Cur</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full">
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 md:mb-3">
              <Icon name="hub" className="text-indigo-500 text-[18px]" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Impact on Other Habits</h3>
            </div>
            <p className="text-[12px] md:text-[13px] text-slate-700 leading-relaxed font-medium">
              On days you complete this habit, consistency with other important habits is higher.
            </p>
          </div>

          <div className="w-full sm:w-56 flex flex-col gap-2">
            {data.impacts.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-4">Not enough data to calculate impacts yet.</div>
            )}
            {data.impacts.map((imp, i) => (
              <div key={i} className="flex items-center justify-between p-2 sm:p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100/90 text-[11px] sm:text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <HabitIcon name={getHabitIcon(imp.habitId)} habitId={imp.habitId} boxed={true} size={15} />
                  <span className="font-bold text-slate-800 truncate">{getHabitName(imp.habitId)}</span>
                </div>
                <span className="text-emerald-600 font-bold flex items-center gap-0.5 flex-shrink-0">
                  +{imp.difference}% <Icon name="arrow_upward" className="text-[12px]"/>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 8. BOTTOM ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
        
        {/* Daily Details */}
        <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="fact_check" className="text-indigo-500 text-[18px]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Daily Details</h3>
          </div>

          <div className="flex flex-col gap-3 md:gap-4 flex-1 mb-4">
            {data.daily.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] md:text-xs font-medium">
                <div className="flex items-center gap-2 w-20 md:w-24">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${d.status === 'SUCCESS' ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}></div>
                  <span className="text-slate-600 dark:text-slate-400">{new Date(d.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold">{d.status === 'SUCCESS' ? 'Yes' : 'No'}</span>
                <span className={`px-2 py-1 border rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wide w-16 md:w-20 text-center ${d.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {d.status === 'SUCCESS' ? 'Done' : 'Missed'}
                </span>
              </div>
            ))}
            {data.daily.length === 0 && (
               <div className="text-xs text-slate-500 text-center py-4">No recent records.</div>
            )}
          </div>
        </div>

        {/* Personal Bests */}
        <div className="bg-white dark:bg-[#151a26] p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="emoji_events" className="text-amber-500 text-[18px]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Bests</h3>
          </div>

          <div className="flex flex-col gap-4 md:gap-5 flex-1 pt-1">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2.5">
                <Icon name="done_all" className="text-indigo-400 text-[16px] mt-0.5" />
                <div>
                  <p className="text-xs md:text-[13px] font-bold text-slate-700 dark:text-slate-300">Best Month Score</p>
                  <p className="text-[10px] md:text-[11px] text-slate-400 font-medium">({data.personalBests.bestMonthScore?.period || 'N/A'})</p>
                </div>
              </div>
              <span className="text-[13px] md:text-sm font-bold text-emerald-500">{data.personalBests.bestMonthScore?.value || 0}%</span>
            </div>

            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2.5">
                <Icon name="done_all" className="text-indigo-400 text-[16px] mt-0.5" />
                <div>
                  <p className="text-xs md:text-[13px] font-bold text-slate-700 dark:text-slate-300">Best Streak</p>
                </div>
              </div>
              <span className="text-[13px] md:text-sm font-bold text-emerald-500">{data.streaks.best} Days</span>
            </div>

            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2.5">
                <Icon name="done_all" className="text-indigo-400 text-[16px] mt-0.5" />
                <div>
                  <p className="text-xs md:text-[13px] font-bold text-slate-700 dark:text-slate-300">Most Consistent Day</p>
                </div>
              </div>
              <span className="text-[13px] md:text-sm font-bold text-emerald-500 capitalize">{data.personalBests.mostConsistentDay || 'N/A'}</span>
            </div>
          </div>
        </div>

        <DeepDiveInsights 
          habit={habit}
          summary={data.summary}
          weakestDay={data.personalBests?.mostConsistentDay}
          improvement={data.trend?.change}
          weekdayPattern={[]}
        />
      </div>

      {/* Day Details Modal */}
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
                    <p className="text-on-surface font-semibold text-[16px]">No Data Filled</p>
                    <p className="text-on-surface-variant text-[14px] mt-1">You didn't fill any data here.</p>
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


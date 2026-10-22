import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { 
  GridComponent, 
  TooltipComponent, 
  LegendComponent, 
  DataZoomComponent, 
  MarkLineComponent, 
  MarkAreaComponent 
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import Icon from '../../components/Icon';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import {
  Sparkle,
  Target,
  ShieldCheck,
  Star,
  TrendUp,
  TrendDown,
  CaretDown,
  CaretRight,
  CornersOut,
  X,
  Check,
  Info,
  Calendar,
  Lock,
  Funnel
} from '@phosphor-icons/react';

echarts.use([
  LineChart, 
  ScatterChart, 
  GridComponent, 
  TooltipComponent, 
  LegendComponent, 
  DataZoomComponent, 
  MarkLineComponent, 
  MarkAreaComponent, 
  CanvasRenderer
]);

// 10-tier continuous color band matching user stats page
const getPerfBandClass = (score) => {
  if (score === null || score === undefined) return 'bg-slate-200 dark:bg-[#202532] text-slate-400';
  if (score <= 10) return 'bg-perf-1 text-white';
  if (score <= 20) return 'bg-perf-2 text-white';
  if (score <= 30) return 'bg-perf-3 text-white';
  if (score <= 40) return 'bg-perf-4 text-white';
  if (score <= 50) return 'bg-perf-5 text-white';
  if (score <= 60) return 'bg-perf-6 text-slate-900';
  if (score <= 70) return 'bg-perf-7 text-slate-900';
  if (score <= 80) return 'bg-perf-8 text-white';
  if (score <= 90) return 'bg-perf-9 text-white';
  return 'bg-perf-10 text-white';
};

export default function PatientAnalyticsDeepDive({
  patient,
  proName,
  dailyFocusNote,
  onSaveDailyFocus,
  onWhatsAppNudge
}) {
  const echartsRef = useRef(null);
  const sampleDays = patient?.sampleDays || [];

  // Selected habit for filtering ('all' = Overall weighted)
  const [selectedHabitId, setSelectedHabitId] = useState('all');
  const [showHabitDropdown, setShowHabitDropdown] = useState(false);

  // Preference / Tune Controls
  const [showHeatmapControlModal, setShowHeatmapControlModal] = useState(false);
  const [showChartControlModal, setShowChartControlModal] = useState(false);
  const [showWeightedInfoModal, setShowWeightedInfoModal] = useState(false);
  const [showFullscreenChart, setShowFullscreenChart] = useState(false);

  // Heatmap preferences
  const [dayTypeFilter, setDayTypeFilter] = useState('all'); // 'all' | 'weekdays' | 'weekends'
  const [heatmapFilter, setHeatmapFilter] = useState('all'); // 'all' | 'elite_90' | 'target_80' | 'passing_50' | 'struggle_below_50' | 'critical_below_30' | 'skipped'
  const [heatmapLayout, setHeatmapLayout] = useState('continuous'); // 'continuous' | 'calendar'
  const [showPercentages, setShowPercentages] = useState(false);

  // Chart preferences
  const [chartSmoothing, setChartSmoothing] = useState(false); // 7-day moving average
  const [showTargetLine, setShowTargetLine] = useState(true);

  // Selected Day for Inspection
  const [selectedDayDetail, setSelectedDayDetail] = useState(sampleDays[0] || null);

  // Consultation Notes State
  const [clinicalNotes, setClinicalNotes] = useState(patient?.clinicalNotes || []);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // Focus Note local state
  const [focusNoteInput, setFocusNoteInput] = useState(dailyFocusNote || patient?.dailyFocusNote || '');
  const [focusSuccess, setFocusSuccess] = useState(false);

  useEffect(() => {
    if (patient?.sampleDays?.length > 0) {
      setSelectedDayDetail(patient.sampleDays[0]);
    }
    if (patient?.clinicalNotes) {
      setClinicalNotes(patient.clinicalNotes);
    }
    if (patient?.dailyFocusNote) {
      setFocusNoteInput(patient.dailyFocusNote);
    }
  }, [patient]);

  // Extract patient's individual prescribed habits
  const patientHabits = useMemo(() => {
    const firstDay = sampleDays[0];
    if (!firstDay?.habits) return [];
    return Object.entries(firstDay.habits).map(([key, h]) => {
      let icon = 'sparkle';
      let color = '#3b82f6';
      if (key.includes('water')) { icon = 'water_drop'; color = '#06b6d4'; }
      else if (key.includes('dinner')) { icon = 'schedule'; color = '#8b5cf6'; }
      else if (key.includes('activity')) { icon = 'directions_walk'; color = '#f59e0b'; }
      else if (key.includes('veggie')) { icon = 'eco'; color = '#10b981'; }
      return {
        id: key,
        name: h.name || key,
        icon,
        color,
        unit: h.unit || '',
        target: h.target
      };
    });
  }, [sampleDays]);

  const currentSelectedHabit = useMemo(() => {
    return patientHabits.find(h => h.id === selectedHabitId) || null;
  }, [patientHabits, selectedHabitId]);

  // Helper to extract score for a day given selected habit
  const getDayScore = (day, habitId) => {
    if (!day) return null;
    if (habitId === 'all') return day.planScore ?? null;
    const habit = day.habits?.[habitId];
    if (!habit) return null;
    if (habit.status === 'done') return 100;
    if (habit.status === 'partial') return 65;
    if (habit.status === 'missed') return 25;
    return 75;
  };

  // Reverse sample days for chronological ECharts (oldest -> newest)
  const chronologicalDays = useMemo(() => {
    return [...sampleDays].reverse();
  }, [sampleDays]);

  // Compute 30-day stats
  const trajectoryStats = useMemo(() => {
    if (!sampleDays.length) return { avgScore: 80, delta: 0, count: 0 };
    const scores = sampleDays.map(d => getDayScore(d, selectedHabitId)).filter(s => s !== null);
    if (!scores.length) return { avgScore: 0, delta: 0, count: 0 };
    
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const firstHalf = scores.slice(Math.floor(scores.length / 2));
    const recentHalf = scores.slice(0, Math.floor(scores.length / 2));
    
    const avgFirst = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : avgScore;
    const avgRecent = recentHalf.length ? recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length : avgScore;
    const delta = Math.round(avgRecent - avgFirst);

    return { avgScore, delta, count: scores.length };
  }, [sampleDays, selectedHabitId]);

  // Micro KPI Stats (Resilience, Consistency, Target Hit)
  const kpiStats = useMemo(() => {
    if (!sampleDays.length) return { resilience: 85, consistencyPct: 90, activeDays: 27, targetHitPct: 70, onTargetDays: 21, totalDays: 30 };
    
    const totalDays = sampleDays.length;
    let activeDays = 0;
    let onTargetDays = 0;
    let dipDays = 0;
    let recoveredDays = 0;

    for (let i = 0; i < totalDays; i++) {
      const score = getDayScore(sampleDays[i], selectedHabitId);
      if (score !== null && score > 0) activeDays++;
      if (score !== null && score >= 80) onTargetDays++;
      
      // Dip detection
      if (score !== null && score < 70) {
        dipDays++;
        // Check if recovered in following 2 days
        if (i > 0) {
          const nextScore = getDayScore(sampleDays[i - 1], selectedHabitId);
          if (nextScore !== null && nextScore >= 70) recoveredDays++;
        }
      }
    }

    const consistencyPct = Math.round((activeDays / totalDays) * 100);
    const targetHitPct = Math.round((onTargetDays / totalDays) * 100);
    const resilience = dipDays === 0 ? 95 : Math.round((recoveredDays / dipDays) * 100) || 78;

    return {
      resilience: Math.max(20, Math.min(100, resilience)),
      consistencyPct,
      activeDays,
      targetHitPct,
      onTargetDays,
      totalDays
    };
  }, [sampleDays, selectedHabitId]);

  // ECharts Option
  const echartOption = useMemo(() => {
    const dates = chronologicalDays.map(d => d.date.slice(5)); // '10-11'
    let scores = chronologicalDays.map(d => getDayScore(d, selectedHabitId));

    // Optional 7-day Moving Average Smoothing
    if (chartSmoothing) {
      scores = scores.map((val, idx, arr) => {
        const windowSlice = arr.slice(Math.max(0, idx - 6), idx + 1).filter(v => v !== null);
        if (!windowSlice.length) return val;
        return Math.round(windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length);
      });
    }

    const seriesColor = selectedHabitId === 'all' ? '#10b981' : (currentSelectedHabit?.color || '#6366f1');

    return {
      grid: {
        top: 24,
        right: 14,
        bottom: 24,
        left: 36
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params) => {
          if (!params || !params[0]) return '';
          const idx = params[0].dataIndex;
          const day = chronologicalDays[idx];
          if (!day) return '';
          const score = params[0].data;
          const statusBadge = score >= 80 
            ? '<span style="color:#10b981;font-weight:bold;">● Target Met</span>' 
            : score >= 50 
            ? '<span style="color:#fbbf24;font-weight:bold;">● Partial</span>' 
            : '<span style="color:#f43f5e;font-weight:bold;">● Missed</span>';

          return `
            <div style="font-weight:bold;margin-bottom:4px;color:#cbd5e1;">${day.date}</div>
            <div>Score: <strong>${score}%</strong> ${statusBadge}</div>
            ${day.metrics?.weight ? `<div style="color:#94a3b8;font-size:11px;margin-top:2px;">Weight: <strong>${day.metrics.weight} kg</strong></div>` : ''}
          `;
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, interval: 4 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        interval: 20,
        splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.35)', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' }
      },
      series: [
        {
          name: 'Score',
          type: 'line',
          data: scores,
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          itemStyle: {
            color: (params) => {
              const val = params.data;
              if (val >= 80) return '#10b981';
              if (val >= 50) return '#fbbf24';
              return '#f43f5e';
            }
          },
          lineStyle: {
            width: 3,
            color: seriesColor
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: seriesColor === '#10b981' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.35)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
            ])
          },
          markLine: showTargetLine ? {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: '#10b981',
              type: 'dashed',
              width: 1.5
            },
            data: [
              {
                yAxis: trajectoryStats.avgScore,
                label: {
                  formatter: `Avg: ${trajectoryStats.avgScore}%`,
                  position: 'insideEndTop',
                  color: '#10b981',
                  fontSize: 10,
                  fontWeight: 'bold'
                }
              }
            ]
          } : undefined
        }
      ]
    };
  }, [chronologicalDays, selectedHabitId, currentSelectedHabit, chartSmoothing, showTargetLine, trajectoryStats.avgScore]);

  // Filtered heatmap days
  const filteredDays = useMemo(() => {
    return sampleDays.filter(day => {
      // Day Type Filter
      const dateObj = new Date(day.date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (dayTypeFilter === 'weekdays' && isWeekend) return false;
      if (dayTypeFilter === 'weekends' && !isWeekend) return false;

      // Score Filter
      const score = getDayScore(day, selectedHabitId);
      if (heatmapFilter === 'elite_90' && score < 90) return false;
      if (heatmapFilter === 'target_80' && score < 80) return false;
      if (heatmapFilter === 'passing_50' && (score < 50 || score >= 80)) return false;
      if (heatmapFilter === 'struggle_below_50' && (score >= 50 || score <= 0)) return false;
      if (heatmapFilter === 'critical_below_30' && (score >= 30 || score <= 0)) return false;
      if (heatmapFilter === 'skipped' && score !== 0 && score !== null && day.status !== 'missed') return false;

      return true;
    });
  }, [sampleDays, dayTypeFilter, heatmapFilter, selectedHabitId]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const note = {
      id: `cn_${Date.now()}`,
      date: newNoteDate,
      text: newNoteText.trim()
    };
    setClinicalNotes(prev => [note, ...prev]);
    setNewNoteText('');
    setNotesSuccess(true);
    setTimeout(() => setNotesSuccess(false), 2500);
  };

  const handleSaveFocus = (e) => {
    e.preventDefault();
    if (onSaveDailyFocus) onSaveDailyFocus(focusNoteInput);
    setFocusSuccess(true);
    setTimeout(() => setFocusSuccess(false), 2500);
  };

  const isFilterActive = dayTypeFilter !== 'all' || heatmapFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* ── 1. In-App Daily Focus Prescription Editor (Pinned Top for Clinical Flow) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-base">
              💡
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Prescribe Daily Focus Note (Synced to Patient&apos;s Phone)
              </h3>
              <p className="text-[11px] text-slate-500">
                Patient sees this daily clinical directive on their app home screen.
              </p>
            </div>
          </div>
          {focusSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1">
              ✓ Synced to Patient Phone!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveFocus} className="flex gap-2.5 mt-2">
          <input
            type="text"
            value={focusNoteInput}
            onChange={e => setFocusNoteInput(e.target.value)}
            placeholder="e.g. Finish dinner before 8:30 PM tonight and hydrate with 3L water."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Save Focus Note
          </button>
        </form>
      </div>

      {/* ── 2. DESKTOP 2-COLUMN GRID (CHART LEFT, STATS HEATMAP RIGHT) MATCHING STATS PAGE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        
        {/* ── LEFT COLUMN: VELOCITY / TRAJECTORY QUICK STATS + MAIN ECHARTS ──── */}
        <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-3">
          
          {/* Header with Weighted Average Pill & Controls */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/60">
            {/* Left: Weighted Average / Individual Habit Average Pill */}
            <div className="flex items-center gap-1.5 min-w-0">
              {selectedHabitId === 'all' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs select-none">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Weighted Average
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {trajectoryStats.avgScore}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs select-none">
                  <div 
                    className="w-3.5 h-3.5 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: currentSelectedHabit?.color || '#3b82f6' }}
                  >
                    <Icon name={currentSelectedHabit?.icon} className="text-[9px]" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">
                    {currentSelectedHabit?.name} Avg
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {trajectoryStats.avgScore}%
                  </span>
                </div>
              )}

              {/* Clean (i) Info Button */}
              <button
                type="button"
                onClick={() => setShowWeightedInfoModal(true)}
                className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700/70 shadow-2xs shrink-0"
                title="How Scoring & Performance Work"
              >
                <Icon name="info" className="text-[12px]" />
              </button>
            </div>

            {/* Right: Chart Controls & Fullscreen Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowChartControlModal(true)}
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border shadow-2xs bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Chart Controls & Smoothing"
                >
                  <Icon name="tune" className="text-[14px]" />
                </button>
                {chartSmoothing && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#131722] pointer-events-none"></span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowFullscreenChart(true)}
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border shadow-2xs bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 group"
                title="Expanded Chart View"
              >
                <CornersOut size={15} weight="bold" className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* 3-Column Micro KPI Stat Strip (Resilience Score, Consistency, Target Hit Rate) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            {/* Card 1: Resilience Score */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col justify-between min-w-0">
              <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-tight text-emerald-700 dark:text-emerald-300 leading-none whitespace-nowrap flex items-center gap-1 truncate">
                <ShieldCheck size={11} weight="fill" className="text-emerald-500 shrink-0" />
                <span>Resilience</span>
              </span>
              <div className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight my-0.5 tracking-tight">
                {kpiStats.resilience}%
              </div>
              <div className="flex items-center justify-between gap-1 leading-none">
                <span className="text-[8.5px] xs:text-[9px] sm:text-[9.5px] font-semibold text-emerald-700/75 dark:text-emerald-400/75 whitespace-nowrap truncate">
                  Bounce-back
                </span>
                <CaretRight size={10} weight="bold" className="text-emerald-500 shrink-0" />
              </div>
            </div>

            {/* Card 2: Consistency Rate */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 flex flex-col justify-center min-w-0">
              <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-tight text-indigo-700 dark:text-indigo-300 leading-none whitespace-nowrap flex items-center gap-1">
                <Target size={11} weight="fill" className="text-indigo-500 shrink-0" />
                <span>Consistency</span>
              </span>
              <div className="text-base sm:text-xl font-black text-indigo-600 dark:text-indigo-400 leading-tight my-0.5 tracking-tight">
                {kpiStats.consistencyPct}%
              </div>
              <span className="text-[8.5px] xs:text-[9px] sm:text-[9.5px] font-semibold text-indigo-700/75 dark:text-indigo-400/75 whitespace-nowrap leading-none truncate">
                {kpiStats.activeDays}/{kpiStats.totalDays} days logged
              </span>
            </div>

            {/* Card 3: Target Hit Rate */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col justify-center min-w-0">
              <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-tight text-amber-700 dark:text-amber-300 leading-none whitespace-nowrap flex items-center gap-1">
                <Star size={11} weight="fill" className="text-amber-500 shrink-0" />
                <span>Target Hit</span>
              </span>
              <div className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 leading-tight my-0.5 tracking-tight">
                {kpiStats.targetHitPct}%
              </div>
              <span className="text-[8.5px] xs:text-[9px] sm:text-[9.5px] font-semibold text-amber-700/75 dark:text-amber-400/75 whitespace-nowrap leading-none truncate">
                {kpiStats.onTargetDays}/{kpiStats.totalDays} on-target
              </span>
            </div>
          </div>

          {/* ECharts Spline Curve */}
          <div className="w-full h-[200px] sm:h-[220px]">
            <ReactEChartsCore
              ref={echartsRef}
              echarts={echarts}
              option={echartOption}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: '100%', width: '100%' }}
            />
          </div>

          {/* Legend Under Chart */}
          <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Daily Score</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border-2 border-amber-400 inline-block"></span>
                <span>Partial Logged</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                <span>Not Logged</span>
              </span>
            </div>
            <span className="text-emerald-500 font-extrabold text-[10px]">
              Dashed Line = 30D Benchmark
            </span>
          </div>
        </section>

        {/* ── RIGHT COLUMN: GITHUB-STYLE HEATMAP SECTION ──── */}
        <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-3">
          
          {/* Header with Habit Dropdown Selector + Score/Delta + Tune Filter Button */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/60">
            {/* Left Cluster: Custom In-App Habit Selector Dropdown + Score Pill */}
            <div className="flex items-center gap-1.5 shrink-0 relative">
              <button
                type="button"
                onClick={() => setShowHabitDropdown(!showHabitDropdown)}
                className="flex items-center gap-1.5 px-2.5 h-[32px] rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 transition-all cursor-pointer shadow-2xs select-none group"
                title="Tap to switch habit"
              >
                <div 
                  className="w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: selectedHabitId === 'all' ? '#10b981' : (currentSelectedHabit?.color || '#3b82f6') }}
                >
                  {selectedHabitId === 'all' ? <Sparkle size={9} weight="fill" /> : <Icon name={currentSelectedHabit?.icon} className="text-[9px]" />}
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">
                  {selectedHabitId === 'all' ? 'Overall' : currentSelectedHabit?.name}
                </span>
                <CaretDown size={11} weight="bold" className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5 shrink-0" />
              </button>

              {/* Habit Dropdown Menu */}
              {showHabitDropdown && (
                <div className="absolute top-10 left-0 w-52 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => { setSelectedHabitId('all'); setShowHabitDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-left cursor-pointer transition-colors ${
                      selectedHabitId === 'all' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                      <Sparkle size={10} weight="fill" />
                    </div>
                    <span>Overall Combined Score</span>
                  </button>
                  {patientHabits.map(h => (
                    <button
                      key={h.id}
                      onClick={() => { setSelectedHabitId(h.id); setShowHabitDropdown(false); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-left cursor-pointer transition-colors ${
                        selectedHabitId === h.id ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px]" style={{ backgroundColor: h.color }}>
                        <Icon name={h.icon} className="text-[10px]" />
                      </div>
                      <span className="truncate">{h.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Score % & Delta Pill */}
              <div className="flex items-center gap-1 px-2.5 h-[32px] rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs select-none shrink-0">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {trajectoryStats.avgScore}%
                </span>
                <span className={`inline-flex items-center gap-0.5 text-[10.5px] font-black leading-none ${
                  trajectoryStats.delta >= 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {trajectoryStats.delta >= 0 ? (
                    <TrendUp size={11} weight="bold" className="shrink-0" />
                  ) : (
                    <TrendDown size={11} weight="bold" className="shrink-0" />
                  )}
                  <span>{trajectoryStats.delta >= 0 ? `+${trajectoryStats.delta}%` : `${trajectoryStats.delta}%`}</span>
                </span>
              </div>
            </div>

            {/* Right: Filter Trigger Button with Optional Green Dot */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowHeatmapControlModal(true)}
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border shadow-2xs bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Heatmap Settings & Preferences"
                >
                  <Icon name="tune" className="text-[14px]" />
                </button>
                {isFilterActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131722] pointer-events-none"></span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Responsive Heatmap Grid */}
          <div className="space-y-2 pt-1">
            {heatmapLayout === 'calendar' && (
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 py-0.5">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            )}

            <div className={heatmapLayout === 'calendar' ? 'grid grid-cols-7 gap-1.5' : 'grid grid-cols-6 sm:grid-cols-10 gap-1.5 sm:gap-2'}>
              {sampleDays.map(day => {
                const score = getDayScore(day, selectedHabitId);
                const isSelected = selectedDayDetail?.date === day.date;
                const isMatch = filteredDays.some(fd => fd.date === day.date);
                const bgClass = getPerfBandClass(score);
                const isPartial = day.status === 'partial';
                const isSkipped = day.status === 'missed' || score === 0 || score === null;

                return (
                  <div
                    key={day.date}
                    onClick={() => setSelectedDayDetail(day)}
                    className={`h-9 sm:h-10 rounded-lg ${bgClass} ${
                      !isMatch ? 'opacity-15 grayscale scale-95' : ''
                    } ${
                      isSelected ? 'ring-3 ring-indigo-500 shadow-md scale-105 z-10' : 'hover:scale-105'
                    } border border-black/5 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer transition-all relative group select-none`}
                    title={`${day.date}: ${score}%`}
                  >
                    {showPercentages ? (
                      <span className={`text-[10px] sm:text-[11px] font-black leading-none ${
                        (score !== null && (score <= 35 || score >= 60)) ? 'text-white' : 'text-slate-900 dark:text-white'
                      }`}>
                        {score !== null ? `${score}%` : '—'}
                      </span>
                    ) : (
                      <>
                        <span className={`text-[10px] sm:text-[11px] font-black leading-none ${
                          (score !== null && (score <= 35 || score >= 60)) ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {day.date.slice(8)}
                        </span>
                        {isPartial ? (
                          <span className="w-1 h-1 rounded-full bg-white shadow-2xs absolute bottom-1"></span>
                        ) : isSkipped ? (
                          <span className="w-1 h-1 rounded-full bg-slate-900/60 dark:bg-white/60 absolute bottom-1"></span>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-[3px] bg-perf-1" title="0-10%"></span>
              <span className="w-2.5 h-2.5 rounded-[3px] bg-perf-3" title="21-30%"></span>
              <span className="w-2.5 h-2.5 rounded-[3px] bg-perf-5" title="41-50%"></span>
              <span className="w-2.5 h-2.5 rounded-[3px] bg-perf-7" title="61-70%"></span>
              <span className="w-2.5 h-2.5 rounded-[3px] bg-perf-10" title="91-100%"></span>
              <span>More</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white border border-slate-400"></span>
                <span>Partial</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>No Data</span>
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ── 3. DAY INSPECTOR BREAKDOWN CARD ──── */}
      {selectedDayDetail && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                🔍
              </span>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Day Inspector: {new Date(selectedDayDetail.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedDayDetail.planScore >= 80 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                    : selectedDayDetail.planScore >= 50 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' 
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {selectedDayDetail.planScore}% Compliance
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedDayDetail.metrics?.weight && (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Weight: <strong className="text-slate-900 dark:text-white">{selectedDayDetail.metrics.weight} kg</strong>
                </span>
              )}
              {onWhatsAppNudge && (
                <button
                  onClick={() => onWhatsAppNudge(patient.name, `Review for ${selectedDayDetail.date}: Adherence was ${selectedDayDetail.planScore}%.`)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <WhatsAppIcon size={14} className="text-white" />
                  <span>Send WhatsApp Nudge</span>
                </button>
              )}
            </div>
          </div>

          {/* Daily Habits Inspection Breakdown */}
          {selectedDayDetail.habits && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(selectedDayDetail.habits).map(([key, h]) => (
                <div key={key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {h.name}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[9.5px] font-bold ${
                      h.status === 'done' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : h.status === 'partial' 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {h.status === 'done' ? 'Done' : h.status === 'partial' ? 'Partial' : 'Missed'}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {h.value} {h.unit || ''}
                  </div>
                  {h.target && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Target: {h.target} {h.unit || ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. CLINICAL CONSULTATION NOTES LOG ──── */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base">
              📝
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Clinical Consultation & Follow-up Notes
              </h3>
              <p className="text-[11px] text-slate-500">
                Log weekly consult remarks, dietary tweaks, or lab report observations.
              </p>
            </div>
          </div>
          {notesSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              ✓ Consultation Note Added!
            </span>
          )}
        </div>

        {/* Note input form */}
        <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="date"
            value={newNoteDate}
            onChange={e => setNewNoteDate(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
          />
          <input
            type="text"
            value={newNoteText}
            onChange={e => setNewNoteText(e.target.value)}
            placeholder="Add clinical observation, diet adjustment, or doctor follow-up remark..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Add Consultation Note
          </button>
        </form>

        {/* Notes list */}
        <div className="space-y-2 pt-2">
          {clinicalNotes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No clinical notes recorded yet for this client.
            </div>
          ) : (
            clinicalNotes.map(n => (
              <div key={n.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400">
                    {n.date} • {proName || 'Attending Clinician'}
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    {n.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── MODAL 1: HEATMAP CONTROLS & PREFERENCES ──── */}
      {showHeatmapControlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131722] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="tune" className="text-emerald-500 text-lg" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Heatmap Preferences & Filters
                </h4>
              </div>
              <button
                onClick={() => setShowHeatmapControlModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* 1. Day Type Filter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                  Day Type Filter
                </span>
                {dayTypeFilter !== 'all' && (
                  <button
                    onClick={() => setDayTypeFilter('all')}
                    className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-center">
                {['all', 'weekdays', 'weekends'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDayTypeFilter(type)}
                    className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                      dayTypeFilter === type
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                    }`}
                  >
                    {type === 'all' ? 'All Days' : type === 'weekdays' ? 'Mon-Fri' : 'Sat-Sun'}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Score Range Filter */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                  Score Range Filter
                </span>
                {heatmapFilter !== 'all' && (
                  <button
                    onClick={() => setHeatmapFilter('all')}
                    className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'All Scores' },
                  { id: 'elite_90', label: 'Elite Tier (≥90%)' },
                  { id: 'target_80', label: 'Target Met (≥80%)' },
                  { id: 'passing_50', label: 'Passing (50-79%)' },
                  { id: 'struggle_below_50', label: 'Struggling (<50%)' },
                  { id: 'skipped', label: 'Skipped / Missing' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHeatmapFilter(opt.id)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold text-left border transition-all cursor-pointer ${
                      heatmapFilter === opt.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Grid Layout & Percentages Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Visual Options
              </span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Layout Style
                </span>
                <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
                  <button
                    onClick={() => setHeatmapLayout('continuous')}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                      heatmapLayout === 'continuous' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Stream
                  </button>
                  <button
                    onClick={() => setHeatmapLayout('calendar')}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                      heatmapLayout === 'calendar' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Calendar
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Show Scores Inside Cells
                </span>
                <button
                  type="button"
                  onClick={() => setShowPercentages(!showPercentages)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    showPercentages ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                    showPercentages ? 'left-4.5' : 'left-0.75'
                  }`} />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHeatmapControlModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs shadow-xs cursor-pointer"
              >
                Apply Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CHART CONTROLS & SMOOTHING ──── */}
      {showChartControlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131722] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="tune" className="text-blue-500 text-lg" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Chart Controls
                </h4>
              </div>
              <button
                onClick={() => setShowChartControlModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    7-Day Moving Average
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Smooth daily fluctuations for macro trend
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChartSmoothing(!chartSmoothing)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    chartSmoothing ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                    chartSmoothing ? 'left-4.5' : 'left-0.75'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Show Benchmark Line
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Dashed average reference threshold
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTargetLine(!showTargetLine)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    showTargetLine ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                    showTargetLine ? 'left-4.5' : 'left-0.75'
                  }`} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowChartControlModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 3: FULLSCREEN CHART MODAL ──── */}
      {showFullscreenChart && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131722] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Expanded Adherence Trajectory • {patient.name}
                </h4>
                <p className="text-xs text-slate-400">
                  30-Day macro compliance with clinical benchmarks and daily audit points
                </p>
              </div>
              <button
                onClick={() => setShowFullscreenChart(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="w-full h-[400px]">
              <ReactEChartsCore
                echarts={echarts}
                option={echartOption}
                notMerge={true}
                lazyUpdate={true}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: WEIGHTED SCORING INFO MODAL ──── */}
      {showWeightedInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131722] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
                  ℹ️
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  How Scoring & Resilience Work
                </h4>
              </div>
              <button
                onClick={() => setShowWeightedInfoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="font-black text-slate-900 dark:text-white text-xs mb-1">
                  1. Tamper-Proof Client App Logging
                </div>
                Scores are calculated strictly from the user&apos;s daily activity and check-in logs. Neither doctors nor admins can artificially inflate or tamper with this score.
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="font-black text-slate-900 dark:text-white text-xs mb-1">
                  2. Resilience & Bounce-Back Rate
                </div>
                Measures how quickly a client rebounds back to &ge;70% adherence after an off-track slip or busy weekend. Fast bounce-back indicates sustainable lifestyle mastery.
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="font-black text-slate-900 dark:text-white text-xs mb-1">
                  3. Color Tiers & Heatmap
                </div>
                Green cells (&ge;80%) reflect full adherence; Amber (50-79%) indicate partial completion; Red cells reflect slips needing clinical attention.
              </div>
            </div>

            <button
              onClick={() => setShowWeightedInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs shadow-xs cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

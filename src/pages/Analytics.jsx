import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { 
  computeKPIs, 
  generateHeatmapGrid, 
  computeHabitBreakdown, 
  identifyAreasToImprove 
} from '../lib/analytics';
import ReactECharts from 'echarts-for-react';
import { Link } from 'react-router-dom';
import RadialGauge from '../components/RadialGauge';

const getPerfBandClass = (score) => {
  if (score === null || score === undefined) return '';
  if (score <= 10) return 'bg-perf-1';
  if (score <= 20) return 'bg-perf-2';
  if (score <= 30) return 'bg-perf-3';
  if (score <= 40) return 'bg-perf-4';
  if (score <= 50) return 'bg-perf-5';
  if (score <= 60) return 'bg-perf-6';
  if (score <= 70) return 'bg-perf-7';
  if (score <= 80) return 'bg-perf-8';
  if (score <= 90) return 'bg-perf-9';
  return 'bg-perf-10';
};

const getPerfTextColorClass = (score) => {
  if (score === null || score === undefined) return 'text-on-surface-variant';
  if (score <= 10) return 'text-perf-1';
  if (score <= 20) return 'text-perf-2';
  if (score <= 30) return 'text-perf-3';
  if (score <= 40) return 'text-perf-4';
  if (score <= 50) return 'text-perf-5';
  if (score <= 60) return 'text-perf-6';
  if (score <= 70) return 'text-perf-7';
  if (score <= 80) return 'text-perf-8';
  if (score <= 90) return 'text-perf-9';
  return 'text-perf-10';
};

export default function Analytics() {
  const { currentUser: user } = useAuth();
  const { habits, allSummaries, userDoc, loadingData } = useData();
  
  // Date Range State
  const [rangeOption, setRangeOption] = useState('7'); // '7', '30', '90', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [appliedCustomStart, setAppliedCustomStart] = useState('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('');
  const [isCustomDropdownOpen, setIsCustomDropdownOpen] = useState(false);
  const dateSelectorRef = useRef(null);
  

  // Filter States
  const [selectedHabits, setSelectedHabits] = useState([]); // Array of habit IDs
  const [chartMode, setChartMode] = useState('combined'); // 'combined' or 'separate'
  const [viewMode, setViewMode] = useState('charts'); // 'charts' or 'heatmap'
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Heatmap State
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [showPercentages, setShowPercentages] = useState(false);
  
  // Data States
  const [summaries, setSummaries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Compute actual start/end based on option
  const { startDate, endDate, isFutureOnly } = useMemo(() => {
    const today = new Date();
    const tzoffset = today.getTimezoneOffset() * 60000;
    const end = new Date(today.getTime() - tzoffset).toISOString().split('T')[0];
    
    if (rangeOption === 'custom' && appliedCustomStart && appliedCustomEnd) {
      const futureOnly = appliedCustomStart > end;
      const cappedEnd = appliedCustomEnd > end ? end : appliedCustomEnd;
      return { startDate: appliedCustomStart, endDate: cappedEnd, isFutureOnly: futureOnly };
    }
    
    // Default fallback if custom is selected but not applied yet
    if (rangeOption === 'custom') {
      let days = 7;
      const startObj = new Date();
      startObj.setDate(startObj.getDate() - days + 1);
      return {
        startDate: startObj.toISOString().split('T')[0],
        endDate: end,
        isFutureOnly: false
      };
    }
    
    let days = parseInt(rangeOption) || 30;
    const startObj = new Date();
    startObj.setDate(startObj.getDate() - days + 1); // +1 because inclusive of today
    
    return {
      startDate: startObj.toISOString().split('T')[0],
      endDate: end,
      isFutureOnly: false
    };
  }, [rangeOption, appliedCustomStart, appliedCustomEnd]);

  // Fetch entries when date range changes
  useEffect(() => {
    if (!user || !startDate || !endDate || loadingData) return;
    
    async function loadRangeData() {
      setLoadingEntries(true);
      try {
        // Filter summaries from global context for backwards compat
        const rangeSummaries = allSummaries.filter(s => s.id >= startDate && s.id <= endDate);
        setSummaries(rangeSummaries);
        
        // Fetch entries ONLY for the selected date range to prevent main-thread freeze
        const entriesSnap = await getDocs(
          query(
            collection(db, `users/${user.uid}/entries`),
            where('entryDate', '>=', startDate),
            where('entryDate', '<=', endDate)
          )
        );
        setEntries(entriesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to load range data", e);
      } finally {
        setLoadingEntries(false);
      }
    }
    loadRangeData();
  }, [user, startDate, endDate, allSummaries, loadingData]);

  // Computations
  const kpis = useMemo(() => computeKPIs(summaries, startDate, endDate), [summaries, startDate, endDate]);
  const heatmapGrid = useMemo(() => {
      const activeHabitId = selectedHabits.length === 1 ? selectedHabits[0] : 'overall';
      return generateHeatmapGrid(summaries, entries, activeHabitId === 'overall' ? 'overall' : 'habit', activeHabitId, startDate, endDate);
  }, [summaries, entries, selectedHabits, startDate, endDate]);
  const breakdown = useMemo(() => computeHabitBreakdown(habits, entries, startDate, endDate), [habits, entries, startDate, endDate]);
  const areasToImprove = useMemo(() => identifyAreasToImprove(breakdown), [breakdown]);

  // Determine effective start date for chart/heatmap visualization based on first logged entry
  const effectiveStartDate = useMemo(() => {
    const firstLogDate = allSummaries.length > 0 
      ? allSummaries.reduce((min, s) => s.id < min ? s.id : min, allSummaries[0].id) 
      : null;
    return firstLogDate && firstLogDate > startDate ? firstLogDate : startDate;
  }, [startDate, allSummaries]);

  // Chart Data Prep
  const chartData = useMemo(() => {
    // Generate dates array starting from effectiveStartDate
    const dates = [];
    let current = new Date(effectiveStartDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates.map(dateStr => {
      const dataPoint = { date: dateStr };
      
      // Overall
      const summary = summaries.find(s => s.id === dateStr);
      dataPoint.overallScore = summary?.overallScore || 0;
      
      // Habits
      habits.forEach(h => {
        const entry = entries.find(e => e.entryDate === dateStr && e.habitId === h.id);
        dataPoint[h.id] = entry?.computedScore !== undefined && entry?.computedScore !== null ? entry.computedScore : 0;
      });
      
      return dataPoint;
    });
  }, [startDate, endDate, summaries, entries, habits]);

  // ECharts Options Generator
  const getEChartOption = (habitIds) => {
    // habitIds is an array. If empty, show overall.
    const isOverall = habitIds.length === 0;
    
    const series = isOverall
      ? [{
          name: 'Overall Score',
          type: 'line',
          data: chartData.map(d => d.overallScore),
          itemStyle: { color: '#d0bcff' },
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(208,188,255,0.4)' },
                { offset: 1, color: 'rgba(208,188,255,0.02)' }
              ]
            }
          },
          showSymbol: false,
          smooth: true
        }]
      : habitIds.map((id) => {
          const habit = habits.find(h => h.id === id);
          // Use global habit index for persistent color assignment
          const globalIndex = habits.findIndex(h => h.id === id);
          const colors = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
          const color = colors[globalIndex % colors.length];
          return {
            name: habit?.name || id,
            type: 'line',
            data: chartData.map(d => d[id]),
            connectNulls: true,
            itemStyle: { color },
            lineStyle: { width: 3 },
            areaStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: color + '55' },
                  { offset: 1, color: color + '05' }
                ]
              }
            },
            showSymbol: false,
            smooth: true
          };
        });

    return {

      tooltip: {
        trigger: 'axis',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        shadowColor: 'transparent',
        formatter: function (params) {
          if (!params || !params.length) return '';
          
          const dataIndex = params[0].dataIndex;
          const pointData = chartData[dataIndex];
          const dateObj = new Date(pointData.date + 'T00:00:00');
          const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          
          if (params.length > 1) {
            // Combined Chart - Compact List View
            let html = `<div style="background: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); padding: 8px 12px; min-width: 140px; font-family: 'Inter', sans-serif; border: 1px solid #e5e7eb;">`;
            html += `<div style="font-size: 10px; color: #6b7280; margin-bottom: 8px; font-weight: 500; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px;">${dateStr}</div>`;
            
            params.forEach(param => {
              const seriesName = param.seriesName;
              const score = param.value !== undefined && param.value !== null && param.value !== '-' ? Math.round(param.value) : 0;
              const color = param.color || '#3b82f6';
              const finalColor = seriesName === 'Overall Score' ? '#8b5cf6' : color;
              
              html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: ${finalColor};"></div>
                    <div style="font-size: 11px; font-weight: 500; color: #374151;">${seriesName}</div>
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: #111827;">${score}%</div>
                </div>
              `;
            });
            html += `</div>`;
            return html;
          } else {
            // Individual Chart - Detailed View (Compact for Mobile)
            let html = `<div style="background: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); padding: 10px; min-width: 160px; max-width: 200px; font-family: 'Inter', sans-serif; border: 1px solid #e5e7eb;">`;
            
            const param = params[0];
            const seriesName = param.seriesName;
            const score = param.value !== undefined && param.value !== null && param.value !== '-' ? Math.round(param.value) : 0;
            const isOverall = seriesName === 'Overall Score';
            
            if (isOverall) {
              html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div style="font-weight: 600; font-size: 12px; color: #111827;">Overall Score</div>
                  <div style="background: #ecfdf5; color: #10b981; padding: 2px 4px; border-radius: 4px; font-weight: 600; font-size: 10px; border: 1px solid #d1fae5;">${score}%</div>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; color: #4b5563; font-size: 9px;">
                  <span class="material-symbols-outlined" style="font-size: 10px;">calendar_today</span>
                  <span>${dateStr}</span>
                </div>
              `;
            } else {
              const habit = habits.find(h => h.name === seriesName);
              const icon = habit?.icon || 'check_circle';
              const color = param.color || '#3b82f6';
              
              html += `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="background: ${color}; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white;">
                      <span class="material-symbols-outlined" style="font-size: 14px;">${icon}</span>
                    </div>
                    <div>
                      <div style="font-weight: 600; font-size: 11px; color: #111827; line-height: 1.2; margin-bottom: 4px;">${seriesName}</div>
                      <div style="display: flex; align-items: center; gap: 4px; color: #4b5563; font-size: 9px;">
                        <span class="material-symbols-outlined" style="font-size: 10px;">calendar_today</span>
                        <span>${dateStr}</span>
                      </div>
                    </div>
                  </div>
                  <div style="background: #ecfdf5; color: #10b981; padding: 2px 4px; border-radius: 4px; font-weight: 600; font-size: 9px; border: 1px solid #d1fae5;">
                    ${score}%
                  </div>
                </div>
              `;
            }
            html += `</div>`;
            return html;
          }
        }
      },
      legend: {
        show: true,
        textStyle: { color: 'var(--on-surface-variant)' },
        bottom: 0
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        axisLabel: { color: '#868381', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: '#868381', fontSize: 10 },
        splitLine: { lineStyle: { type: 'dashed', color: '#eeedf3' } }
      },
      series: series
    };
  };

  if (loadingData) {
    return (
      <div className="flex flex-col gap-8 w-full animate-pulse">
        <div className="h-12 bg-surface-container-high rounded-lg w-48 mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-container-high rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-surface-container-high rounded-2xl w-full mt-8"></div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-5xl text-primary">bar_chart</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">No Data Available</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          Your analytics will appear here once you start tracking habits. 
        </p>
        <Link 
          to="/onboarding/select" 
          className="mt-4 bg-primary text-on-primary px-6 py-3 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
        >
          Add a Habit
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header & Date Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Performance Analytics</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Analyze your habit consistency and intensity over time.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2" ref={dateSelectorRef}>
          <div className="flex items-center gap-0.5 bg-surface-container/60 backdrop-blur-md rounded-full p-[3px] border border-outline-variant/40 shadow-sm">
            {['7', '30', '90'].map(val => (
              <button 
                key={val}
                onClick={() => {
                  setRangeOption(val);
                  setIsCustomDropdownOpen(false);
                }}
                className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all duration-200 ${rangeOption === val ? 'bg-on-surface text-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'}`}
              >
                {val} Days
              </button>
            ))}
            <button 
              onClick={() => {
                setRangeOption('custom');
                setIsCustomDropdownOpen(true);
              }}
              className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all duration-200 flex items-center gap-1.5 ${rangeOption === 'custom' ? 'bg-on-surface text-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'}`}
            >
              Custom <span className="material-symbols-outlined text-[15px]">calendar_today</span>
            </button>
          </div>
          
          {/* Inline custom date panel */}
          {isCustomDropdownOpen && (
            <div className="w-full md:w-auto bg-surface-container/60 backdrop-blur-xl border border-outline-variant/40 rounded-[20px] p-3 flex flex-col sm:flex-row gap-3 items-end sm:items-center shadow-md animate-in fade-in slide-in-from-top-2 duration-200 z-10 relative">
              <button 
                onClick={() => {
                  setIsCustomDropdownOpen(false);
                  setRangeOption('7');
                }}
                className="absolute -top-2 -right-2 bg-surface border border-outline-variant rounded-full p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant shadow-sm transition-colors z-20 flex items-center justify-center"
                aria-label="Close custom date selector"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
              <div className="flex flex-col gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant pl-1">From</label>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-sm rounded-xl p-2.5 bg-surface border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary w-full shadow-sm" />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant pl-1">To</label>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-sm rounded-xl p-2.5 bg-surface border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary w-full shadow-sm" />
              </div>
              <button 
                onClick={() => {
                   if(customStart && customEnd) {
                      setAppliedCustomStart(customStart);
                      setAppliedCustomEnd(customEnd);
                   } else {
                      alert("Please select both start and end dates.");
                   }
                }}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label-md hover:opacity-90 transition-opacity w-full sm:w-auto whitespace-nowrap shadow-sm"
              >
                Show Results
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col gap-2 transition-transform hover:-translate-y-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Avg Score</span>
          <div className="flex items-baseline gap-2">
            <span className={`font-headline-lg text-headline-lg ${getPerfTextColorClass(kpis.averageScore)}`}>{kpis.averageScore}</span>
            <span className="font-mono-data text-mono-data text-on-surface-variant">/100</span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col gap-2 transition-transform hover:-translate-y-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Best Day</span>
          <span className="font-headline-lg text-headline-lg text-primary">{kpis.bestDayScore || '--'}</span>
          <span className="font-body-md text-body-md text-on-surface-variant mt-auto">{kpis.bestDay || 'N/A'}</span>
        </div>
        <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col gap-2 transition-transform hover:-translate-y-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Consistency</span>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-lg text-headline-lg text-primary">{kpis.consistency}</span>
            <span className="font-headline-md text-headline-md text-primary">%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full mt-auto overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${kpis.consistency}%` }}></div>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col gap-2 transition-transform hover:-translate-y-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Current Streak</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{userDoc?.currentStreak || 0}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">days</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant mt-auto">Record: {userDoc?.longestStreak || 0} days</span>
        </div>
        <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col gap-2 col-span-2 md:col-span-1 transition-transform hover:-translate-y-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Tracked Days</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary">{kpis.trackedDays}</span>
            <span className="font-mono-data text-mono-data text-on-surface-variant">/{kpis.totalDays}</span>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant shadow-sm">
          <button 
            onClick={() => setViewMode('charts')}
            className={`px-6 py-2 rounded-full font-label-md text-label-md transition-all duration-300 ${viewMode === 'charts' ? 'bg-on-surface text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            Charts
          </button>
          <button 
            onClick={() => setViewMode('heatmap')}
            className={`px-6 py-2 rounded-full font-label-md text-label-md transition-all duration-300 ${viewMode === 'heatmap' ? 'bg-on-surface text-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            Heatmap
          </button>
        </div>
      </div>

      {/* Main Chart & Heatmap */}
      {isFutureOnly ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface border border-outline-variant rounded-2xl shadow-sm text-center mb-8">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">event_upcoming</span>
            <h3 className="font-headline-md text-on-surface mb-2">Future Date Selected</h3>
            <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
              Ye data abhi aana baaki hai. Future ki dates mein koi habit tracking data nahi hai. Please past ya current date select karein.
            </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
        
        {/* Trend Line Chart */}
        {viewMode === 'charts' && (
        <div className="w-full bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col">
          <div className="flex flex-col mb-6 gap-4">
            <div className="flex justify-between items-center">
                <h2 className="font-headline-md text-headline-md text-on-surface">Score Trend</h2>
                {selectedHabits.length > 1 && (
                    <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant">
                        <button 
                          onClick={() => setChartMode('combined')}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${chartMode === 'combined' ? 'bg-black text-white shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
                        >
                          Combined
                        </button>
                        <button 
                          onClick={() => setChartMode('separate')}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${chartMode === 'separate' ? 'bg-black text-white shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
                        >
                          Separate
                        </button>
                    </div>
                )}
            </div>
            
            {/* Pill Selectors */}
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => setSelectedHabits([])}
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${selectedHabits.length === 0 ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant'}`}
                >
                    Overall
                </button>
                {habits.map(h => {
                    const isSelected = selectedHabits.includes(h.id);
                    return (
                        <button
                            key={h.id}
                            onClick={() => {
                                if (isSelected) {
                                    setSelectedHabits(selectedHabits.filter(id => id !== h.id));
                                } else {
                                    setSelectedHabits([...selectedHabits, h.id]);
                                }
                            }}
                            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${isSelected ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant'}`}
                        >
                            {h.name}
                        </button>
                    );
                })}
            </div>
          </div>


          
          <div className="flex-grow w-full flex flex-col gap-8 min-h-[300px]">
          {viewMode === 'charts' && (
            (() => {
              // Determine which habits to show in the top grid
              let habitsToShow = [];
              if (selectedHabits.length === 0) {
                  habitsToShow = habits.map(h => h.id);
              } else if (chartMode === 'combined' || selectedHabits.length <= 1) {
                  habitsToShow = selectedHabits;
              }

              if (habitsToShow.length === 0) return null;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {habitsToShow.map(habitId => {
                    const habit = habits.find(h => h.id === habitId);
                    
                    const currentPeriodScores = summaries
                      .filter(s => s.habitScores && s.habitScores[habitId] !== undefined)
                      .map(s => s.habitScores[habitId]);
                    const currentAvg = currentPeriodScores.length > 0 ? Math.round(currentPeriodScores.reduce((sum, score) => sum + score, 0) / currentPeriodScores.length) : 0;
                    
                    let timeframeLabel = 'All-Time';
                    if (rangeOption !== 'all' && rangeOption !== 'custom') {
                        const days = parseInt(rangeOption) || 30;
                        timeframeLabel = `${days} Days`;
                    } else if (rangeOption === 'custom') {
                        timeframeLabel = 'Custom';
                    }
                    
                    return (
                      <RadialGauge 
                        key={`gauge-top-${habitId}`} 
                        habitName={habit?.name || 'Unknown'} 
                        percentage={currentAvg} 
                        timeframeLabel={timeframeLabel}
                      />
                    );
                  })}
                </div>
              );
            })()
          )}
            {chartMode === 'combined' || selectedHabits.length <= 1 ? (
              <ReactECharts option={getEChartOption(selectedHabits)} style={{ height: '350px', width: '100%' }} />
            ) : (
              selectedHabits.map(habitId => {
                const habit = habits.find(h => h.id === habitId);
                const globalIndex = habits.findIndex(h => h.id === habitId);
                const colors = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
                const color = colors[globalIndex % colors.length];
                
                const currentPeriodScores = summaries
                  .filter(s => s.habitScores && s.habitScores[habitId] !== undefined)
                  .map(s => s.habitScores[habitId]);
                const currentAvg = currentPeriodScores.length > 0 ? Math.round(currentPeriodScores.reduce((sum, score) => sum + score, 0) / currentPeriodScores.length) : 0;
                
                let timeframeLabel = 'All-Time';
                if (rangeOption !== 'all' && rangeOption !== 'custom') {
                    const days = parseInt(rangeOption) || 30;
                    timeframeLabel = `${days} Days`;
                } else if (rangeOption === 'custom') {
                    timeframeLabel = 'Custom';
                }

                return (
                  <div key={habitId} className="flex flex-col bg-surface-container-low rounded-xl border border-outline-variant/50 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 ml-1">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                        <h3 className="text-base font-semibold text-on-surface">{habit?.name || 'Unknown'}</h3>
                      </div>
                      <div className="w-full sm:w-[150px]">
                        <RadialGauge 
                          habitName={habit?.name || 'Unknown'} 
                          percentage={currentAvg} 
                          timeframeLabel={timeframeLabel}
                        />
                      </div>
                    </div>
                    <ReactECharts option={getEChartOption([habitId])} style={{ height: '250px', width: '100%' }} />
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {/* Heatmap */}
        {viewMode === 'heatmap' && (
        <div className={isZoomedOut ? 'fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col p-4 sm:p-8 overflow-hidden' : 'w-full'}>
          {isZoomedOut && (
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-[10000]">
              <button 
                onClick={() => setIsZoomedOut(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition-colors shadow-lg"
                title="Close Zoom"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
          <div className={isZoomedOut ? 'flex-1 flex flex-col items-center justify-center overflow-hidden w-full relative' : 'w-full'}>
            <div className={`bg-surface flex flex-col ${isZoomedOut ? 'w-full max-w-7xl max-h-full overflow-auto border border-outline-variant shadow-sm rounded-2xl p-6' : 'w-full border border-outline-variant shadow-sm rounded-2xl p-6'}`}>
          <div className="flex justify-between items-center mb-6 shrink-0 gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface whitespace-nowrap overflow-hidden text-ellipsis">Consistency Map</h2>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                  onClick={() => setShowPercentages(!showPercentages)}
                  className={`flex items-center gap-1 h-7 sm:h-8 rounded-[10px] border border-outline-variant/50 p-1 transition-all shadow-sm ${showPercentages ? 'bg-primary-container/50 text-on-primary-container border-primary/30' : 'bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant'}`}
                  title={showPercentages ? 'Hide %' : 'Show %'}
              >
                  <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-sm border border-outline-variant/30 ${showPercentages ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[12px] sm:text-[14px]">{showPercentages ? 'visibility_off' : 'visibility'}</span>
                  </div>
                  <div className={`w-[1px] h-3 ${showPercentages ? 'bg-on-primary-container/30' : 'bg-outline-variant/50'}`}></div>
                  <span className="text-[10px] sm:text-[11px] font-bold pr-1 sm:pr-1.5 leading-none self-center">%</span>
              </button>
              
              {!isZoomedOut && (
              <button 
                  onClick={() => setIsZoomedOut(true)}
                  className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] border border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low transition-all shadow-sm text-on-surface-variant hover:text-on-surface"
                  title="Zoom Out"
              >
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">fullscreen</span>
              </button>
              )}
            </div>
          </div>
          
          {/* All-Time Average Widget (Single Selection - Heatmap) */}
          <div className="mb-6 flex shrink-0">
            <div className="flex flex-col bg-surface-container-low border border-outline-variant rounded-xl p-3 px-5">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">
                {selectedHabits.length === 1 ? habits.find(h => h.id === selectedHabits[0])?.name + " (All-Time Avg)" : "Overall (All-Time Avg)"}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-headline-md text-primary">
                  {(() => {
                    if (selectedHabits.length === 1) {
                      const habitId = selectedHabits[0];
                      const habitScores = allSummaries
                        .filter(s => s.habitScores && s.habitScores[habitId] !== undefined)
                        .map(s => s.habitScores[habitId]);
                      return habitScores.length > 0 ? Math.round(habitScores.reduce((sum, score) => sum + score, 0) / habitScores.length) : 0;
                    } else {
                      const validSummaries = allSummaries.filter(s => s.overallScore !== undefined);
                      return validSummaries.length > 0 ? Math.round(validSummaries.reduce((sum, s) => sum + s.overallScore, 0) / validSummaries.length) : 0;
                    }
                  })()}
                </span>
                <span className="text-xs text-on-surface-variant">/100</span>
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col overflow-x-auto pb-4 custom-scrollbar">
            <div className={`flex ${isZoomedOut ? 'flex-wrap justify-center items-start gap-x-12 gap-y-12' : 'gap-8'} w-full`}>
              {heatmapGrid.map((monthData, mIndex) => (
                <div key={mIndex} className="flex gap-2">
                  {(isZoomedOut || mIndex === 0) && (
                    <div className="flex flex-col justify-between py-[2px] pr-2 font-mono-data text-[10px] text-on-surface-variant shrink-0 mt-[20px]" style={{ height: '154px' }}>
                      <span className="leading-tight">Mon</span>
                      <span className="leading-tight">Tue</span>
                      <span className="leading-tight">Wed</span>
                      <span className="leading-tight">Thu</span>
                      <span className="leading-tight">Fri</span>
                      <span className="leading-tight">Sat</span>
                      <span className="leading-tight">Sun</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1 text-center">
                      {monthData.monthLabel}
                    </span>
                    <div className="grid-heatmap" style={{ gap: '4px', height: '154px' }}>
                      {monthData.cells.map((cell, i) => (
                        <div 
                          key={i} 
                          onClick={() => { if (!cell.isPad) setSelectedDay(cell.date); }}
                          title={!cell.isPad && cell.score !== null ? `${cell.date}: ${cell.score}%` : ''}
                          className={`transition-colors relative flex items-center justify-center font-mono-data font-bold heatmap-cell ${
                            cell.isPad ? 'bg-transparent cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-primary/50'
                          } ${
                            !cell.isPad && cell.score === null ? 'bg-surface-container' : !cell.isPad ? 'bg-perf-' + cell.perfBand : ''
                          }`}
                        >
                          {!cell.isPad && cell.score !== null && (
                            <span className={`absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] text-white drop-shadow-md pointer-events-none transition-opacity duration-200 ${showPercentages ? 'opacity-100' : 'opacity-0'}`}>
                              {cell.score}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Day Details Modal */}
          {selectedDay && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-container-highest/80 px-4">
              <div className="w-full max-w-sm p-6 rounded-3xl bg-surface border border-outline-variant shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline-sm font-bold text-on-surface">
                    {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <button onClick={() => setSelectedDay(null)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                
                <div className="w-full h-px bg-outline-variant/50 mb-6"></div>
                
                <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const daySummary = summaries.find(s => s.id === selectedDay);
                    const dayEntries = entries.filter(e => e.entryDate === selectedDay);
                    
                    if (!daySummary && dayEntries.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant">
                          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
                          <p className="font-body-md text-center">No data recorded for this day.</p>
                        </div>
                      );
                    }
                    
                    const overallScore = daySummary?.overallScore ?? 0;
                    const strokeDasharray = `${overallScore}, 100`;
                    
                    return (
                      <>
                        {/* Overall Score Section */}
                        <div className="flex justify-between items-center bg-surface p-2 rounded-2xl">
                          <div className="flex flex-col gap-1">
                            <span className="font-label-sm font-bold uppercase tracking-wide text-on-surface-variant">Overall Score</span>
                            <span className="font-display-sm font-bold text-on-surface">{overallScore}%</span>
                          </div>
                          
                          {/* SVG Donut Chart */}
                          <div className="relative w-16 h-16">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                              <path
                                className="text-outline-variant/40 stroke-current"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                strokeWidth="3.5"
                              />
                              <path
                                className={`stroke-current ${getPerfTextColorClass(overallScore)}`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeDasharray={strokeDasharray}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="font-label-sm font-bold text-on-surface">{overallScore}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Habit Breakdown */}
                        <div className="flex flex-col gap-3">
                          <h4 className="font-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Habit Breakdown</h4>
                          {habits.map(habit => {
                            const entry = dayEntries.find(e => e.habitId === habit.id);
                            if (!entry) return null;
                            const score = entry.computedScore ?? 0;
                            const perfBg = getPerfBandClass(score);
                            const perfText = getPerfTextColorClass(score);
                            
                            return (
                              <div key={habit.id} className="flex items-center gap-4 bg-surface p-2 rounded-2xl">
                                {/* Icon Box */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${perfBg} shadow-sm`}>
                                  <span className="font-headline-sm font-bold text-white uppercase">{habit.name.charAt(0)}</span>
                                </div>
                                
                                {/* Name and Progress Bar */}
                                <div className="flex flex-col flex-grow justify-center gap-2">
                                  <span className="font-label-md font-bold text-on-surface">{habit.name}</span>
                                  <div className="w-full h-2 bg-outline-variant/40 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${perfBg}`}
                                      style={{ width: `${score}%`, transition: 'width 0.4s ease' }}
                                    ></div>
                                  </div>
                                </div>
                                
                                {/* Percentage Badge */}
                                <div className={`px-2 py-1 rounded-md border ${perfText.replace('text-', 'border-')}/30 bg-surface flex items-center justify-center min-w-[3rem]`}>
                                  <span className={`font-label-md font-bold ${perfText}`}>{score}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* Footer */}
                <div className="w-full h-px bg-outline-variant/50 mt-6 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span className="text-[10px] max-w-[150px] leading-tight">Daily data is calculated based on your habit targets.</span>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="flex items-center gap-1 text-[10px] font-bold text-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors">
                    View Full Analytics <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
                
              </div>
            </div>
          )}
          
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Habit Performance Table */}
      {viewMode === 'charts' && (
      <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl overflow-hidden mb-8">
        <div className="p-6 border-b border-outline-variant">
          <h2 className="font-headline-md text-headline-md text-on-surface">Habit Breakdown</h2>
        </div>
        <div className="w-full overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="font-label-sm text-[10px] md:text-xs text-on-surface-variant bg-surface-container-lowest border-b border-outline-variant uppercase tracking-wider">
                <th className="px-3 py-4 font-medium rounded-tl-lg">Habit</th>
                <th className="px-3 py-4 font-medium text-right whitespace-nowrap">Avg Score</th>
                <th className="px-3 py-4 font-medium text-right hidden sm:table-cell">Consistency</th>
                <th className="px-3 py-4 font-medium text-right rounded-tr-lg whitespace-nowrap">Best/Worst</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-xs md:text-sm text-on-surface">
              {breakdown.map((b) => (
                <tr key={b.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                  <td className="px-3 py-4 flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${getPerfBandClass(b.avgScore)} opacity-80 group-hover:scale-125 transition-transform shrink-0`}></div>
                    <span className="font-medium truncate max-w-[100px] md:max-w-[200px]">{b.name}</span>
                  </td>
                  <td className={`px-3 py-4 text-right font-mono-data font-semibold ${getPerfTextColorClass(b.avgScore)}`}>{Math.round(b.avgScore)}</td>
                  <td className="px-3 py-4 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono-data text-xs">{b.consistency}%</span>
                      <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden inline-block shrink-0">
                        <div className="h-full bg-primary" style={{ width: `${b.consistency}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right font-mono-data text-on-surface-variant whitespace-nowrap text-[10px] md:text-xs">
                    {b.bestScore ?? '--'} / {b.lowestScore ?? '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Areas to Improve */}
        {areasToImprove.length > 0 && (
          <div className="p-6 bg-error-container/20 text-on-surface text-sm border-t border-outline-variant">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-error">
              <span className="material-symbols-outlined text-lg">trending_down</span>
              Areas to Improve
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
              {areasToImprove.map(h => (
                <li key={h.id}>
                  <strong className="text-on-surface">{h.name}</strong> has averaged <strong className={getPerfTextColorClass(h.avgScore)}>{Math.round(h.avgScore)}%</strong> this {rangeOption === 'custom' ? 'period' : `${rangeOption} days`}.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}
      </>
      )}
    </div>
  );
}

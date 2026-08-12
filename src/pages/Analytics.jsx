import { useState, useEffect, useMemo } from 'react';
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
  const [rangeOption, setRangeOption] = useState('30'); // '7', '30', '90', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [appliedCustomStart, setAppliedCustomStart] = useState('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('');
  const [isCustomDropdownOpen, setIsCustomDropdownOpen] = useState(false);
  
  // Filter States
  const [selectedHabits, setSelectedHabits] = useState([]); // Array of habit IDs
  const [chartMode, setChartMode] = useState('combined'); // 'combined' or 'separate'
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Heatmap State
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  
  // Data States
  const [summaries, setSummaries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Compute actual start/end based on option
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    
    if (rangeOption === 'custom' && appliedCustomStart && appliedCustomEnd) {
      return { startDate: appliedCustomStart, endDate: appliedCustomEnd };
    }
    
    // Default fallback if custom is selected but not applied yet
    if (rangeOption === 'custom') {
      let days = 30;
      const startObj = new Date();
      startObj.setDate(startObj.getDate() - days + 1);
      return {
        startDate: startObj.toISOString().split('T')[0],
        endDate: end
      };
    }
    
    let days = parseInt(rangeOption) || 30;
    const startObj = new Date();
    startObj.setDate(startObj.getDate() - days + 1); // +1 because inclusive of today
    
    return {
      startDate: startObj.toISOString().split('T')[0],
      endDate: end
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
          itemStyle: { color: '#d0bcff' }, // var(--primary) fallback, echarts handles hex better
          lineStyle: { width: 3 },
          showSymbol: false,
          smooth: true
        }]
      : habitIds.map((id, index) => {
          const habit = habits.find(h => h.id === id);
          // simple color palette for multiple lines
          const colors = ['#d0bcff', '#4ade80', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];
          return {
            name: habit?.name || id,
            type: 'line',
            data: chartData.map(d => d[id]),
            connectNulls: true,
            itemStyle: { color: colors[index % colors.length] },
            lineStyle: { width: 3 },
            showSymbol: false,
            smooth: true
          };
        });

    return {

      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--surface-container-high)',
        borderColor: 'var(--outline-variant)',
        textStyle: { color: 'var(--on-surface)' },
        valueFormatter: (value) => value !== '-' ? `${value}%` : 'N/A'
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
        
        <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1 border border-outline-variant shadow-sm">
          {['7', '30', '90'].map(val => (
            <button 
              key={val}
              onClick={() => setRangeOption(val)}
              className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors ${rangeOption === val ? 'bg-surface shadow-sm border border-outline-variant text-on-surface' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              {val} Days
            </button>
          ))}
          <div className="relative group">
            <button 
              onClick={() => {
                setRangeOption('custom');
                setIsCustomDropdownOpen(!isCustomDropdownOpen);
              }}
              className={`px-3 py-1.5 rounded-md font-label-sm text-label-sm transition-colors flex items-center gap-1 ${rangeOption === 'custom' ? 'bg-surface shadow-sm border border-outline-variant text-on-surface' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              Custom <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            </button>
            {isCustomDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 bg-surface border border-outline-variant rounded-xl p-3 flex flex-col gap-3 z-20 shadow-lg min-w-[200px]">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant">Start Date</label>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-sm rounded-md p-2 bg-surface-container border border-outline-variant text-on-surface" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant">End Date</label>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-sm rounded-md p-2 bg-surface-container border border-outline-variant text-on-surface" />
                </div>
                <button 
                  onClick={() => {
                     if(customStart && customEnd) {
                        setAppliedCustomStart(customStart);
                        setAppliedCustomEnd(customEnd);
                        setIsCustomDropdownOpen(false);
                     } else {
                        alert("Please select both start and end dates.");
                     }
                  }}
                  className="w-full bg-primary text-on-primary py-2 rounded-md font-label-sm mt-1 hover:opacity-90"
                >
                  Show Analytics
                </button>
              </div>
            )}
          </div>
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

      {/* Main Chart & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col">
          <div className="flex flex-col mb-6 gap-4">
            <div className="flex justify-between items-center">
                <h2 className="font-headline-md text-headline-md text-on-surface">Score Trend</h2>
                {selectedHabits.length > 1 && (
                    <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
                        <button 
                          onClick={() => setChartMode('combined')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartMode === 'combined' ? 'bg-surface shadow text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                        >
                          Combined
                        </button>
                        <button 
                          onClick={() => setChartMode('separate')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartMode === 'separate' ? 'bg-surface shadow text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
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

          {/* All-Time Average Widgets (Multi-Selection) */}
          {selectedHabits.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-6">
              {selectedHabits.map(habitId => {
                const habit = habits.find(h => h.id === habitId);
                const habitScores = allSummaries
                  .filter(s => s.habitScores && s.habitScores[habitId] !== undefined)
                  .map(s => s.habitScores[habitId]);
                const avg = habitScores.length > 0 ? Math.round(habitScores.reduce((sum, score) => sum + score, 0) / habitScores.length) : 0;
                
                return (
                  <div key={`avg-${habitId}`} className="flex flex-col bg-surface-container-low border border-outline-variant rounded-xl p-3 px-4 min-w-[120px]">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium truncate max-w-[100px]">{habit?.name}</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`font-headline-md ${getPerfTextColorClass(avg)}`}>{avg}</span>
                      <span className="text-xs text-on-surface-variant">All-Time Avg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex-grow w-full flex flex-col gap-8 min-h-[300px]">
            {chartMode === 'combined' || selectedHabits.length <= 1 ? (
              <ReactECharts option={getEChartOption(selectedHabits)} style={{ height: '350px', width: '100%' }} />
            ) : (
              selectedHabits.map(habitId => (
                <div key={habitId} className="flex flex-col">
                  <h3 className="text-sm font-medium text-on-surface-variant ml-4 mb-2">{habits.find(h=>h.id === habitId)?.name}</h3>
                  <ReactECharts option={getEChartOption([habitId])} style={{ height: '250px', width: '100%' }} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Consistency Map</h2>
            <button 
                onClick={() => setIsZoomedOut(!isZoomedOut)}
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium"
            >
                <span className="material-symbols-outlined text-[16px]">{isZoomedOut ? 'zoom_in' : 'zoom_out'}</span>
                {isZoomedOut ? 'Zoom In' : 'Zoom Out'}
            </button>
          </div>
          
          {/* All-Time Average Widget (Single Selection - Heatmap) */}
          <div className="mb-6 flex">
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

          <div className={`flex-grow flex flex-col overflow-x-auto pb-2 scrollbar-hide`}>
            <div className={`flex gap-3 ${isZoomedOut ? 'w-full' : ''}`}>
              <div className="flex flex-col justify-between py-[2px] pr-2 font-mono-data text-[10px] text-on-surface-variant shrink-0" style={{ height: '164px' }}>
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
              <div className={`grid-heatmap ${isZoomedOut ? 'w-full' : ''}`} style={{ gap: isZoomedOut ? '2px' : '4px' }}>
                {heatmapGrid.map((cell, i) => (
                  <div 
                    key={i} 
                    onClick={() => { if (!cell.isPad) setSelectedDay(cell.date); }}
                    title={!cell.isPad && cell.score !== null ? `${cell.date}: ${cell.score}%` : ''}
                    className={`heatmap-cell transition-colors hover:ring-2 hover:ring-primary/50 ${cell.isPad ? 'bg-transparent cursor-default' : 'cursor-pointer'} ${!cell.isPad && cell.score === null ? 'bg-surface-container' : !cell.isPad ? `bg-perf-${cell.perfBand}` : ''}`}
                    style={isZoomedOut ? { width: '100%', minWidth: '4px', height: 'auto', aspectRatio: '1/1' } : {}}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Day Details Modal */}
          {selectedDay && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-container-highest/80 px-4">
              <div className="w-full max-w-sm p-6 rounded-2xl bg-surface border border-outline-variant shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-4">
                  <h3 className="font-headline-sm text-on-surface">
                    {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <button onClick={() => setSelectedDay(null)} className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
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
                    
                    return (
                      <>
                        <div className="relative overflow-hidden flex justify-between items-center bg-primary-container p-4 rounded-xl border border-primary/20">
                          {daySummary?.overallScore !== undefined && (
                            <div 
                              className={`absolute top-0 left-0 h-full opacity-40 ${getPerfBandClass(daySummary.overallScore)}`}
                              style={{ width: `${daySummary.overallScore}%` }}
                            ></div>
                          )}
                          <span className="relative z-10 font-label-md text-on-primary-container font-bold uppercase tracking-wide">Overall Score</span>
                          <span className="relative z-10 font-headline-sm font-bold text-on-primary-container">{daySummary?.overallScore ?? '--'}%</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          <h4 className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1 mt-2">Habit Breakdown</h4>
                          {habits.map(habit => {
                            const entry = dayEntries.find(e => e.habitId === habit.id);
                            if (!entry) return null;
                            
                            return (
                              <div key={habit.id} className="relative overflow-hidden flex justify-between items-center p-3 rounded-lg bg-surface-container border border-outline-variant hover:bg-surface-variant transition-colors">
                                {entry.computedScore !== null && (
                                  <div 
                                    className={`absolute top-0 left-0 h-full opacity-30 ${getPerfBandClass(entry.computedScore)}`}
                                    style={{ width: `${entry.computedScore}%` }}
                                  ></div>
                                )}
                                <span className="relative z-10 font-body-md text-on-surface">{habit.name}</span>
                                <span className="relative z-10 font-mono-data font-bold text-on-surface">
                                  {entry.computedScore !== null ? `${entry.computedScore}%` : 'Logged'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-6 font-mono-data text-[10px] text-on-surface-variant">
            <span>0-10</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-[2px] bg-perf-1" title="0-10"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-2" title="11-20"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-3" title="21-30"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-4" title="31-40"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-5" title="41-50"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-6" title="51-60"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-7" title="61-70"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-8" title="71-80"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-9" title="81-90"></div>
              <div className="w-3 h-3 rounded-[2px] bg-perf-10" title="91-100"></div>
            </div>
            <span>90-100</span>
          </div>
        </div>
      </div>

      {/* Habit Performance Table */}
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
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { 
  computeKPIs, 
  generateHeatmapGrid, 
  computeHabitBreakdown, 
  identifyAreasToImprove 
} from '../lib/analytics';
import { renderToString } from 'react-dom/server';
import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);
import { Link, useSearchParams } from 'react-router-dom';
import RadialGauge from '../components/RadialGauge';
import Icon from '../components/Icon';
import ProModal from '../components/ProModal';
import ProCustomDateModal from '../components/ProCustomDateModal';

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
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const dateSelectorRef = useRef(null);
  

  const [searchParams] = useSearchParams();
  // Filter States
  const [selectedHabit, setSelectedHabit] = useState(() => searchParams.get('habit') || 'overall'); // 'overall' or habit ID
  const [chartMode, setChartMode] = useState('combined'); // 'combined' or 'separate'
  const [viewMode, setViewMode] = useState('charts'); // 'charts' or 'heatmap'
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Heatmap State
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [showPercentages, setShowPercentages] = useState(false);
  const [heatmapPeriod, setHeatmapPeriod] = useState('day'); // 'day', 'week', 'month'
  
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

  // Fetch summaries for the date range
  useEffect(() => {
    if (!user || !startDate || !endDate || loadingData) return;
    
    async function loadRangeData() {
      try {
        // Fetch summaries for the date range to cover BOTH current and comparison periods.
        // We fetch from previousStartDate to endDate to completely eliminate the need for entries fetching!
        const days = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
        const prevStartObj = new Date(startDate);
        prevStartObj.setDate(prevStartObj.getDate() - days);
        const previousStartDate = prevStartObj.toISOString().split('T')[0];

        const summariesSnap = await getDocs(
          query(
            collection(db, `users/${user.uid}/dailySummaries`),
            where(documentId(), '>=', previousStartDate),
            where(documentId(), '<=', endDate)
          )
        );
        const rangeSummaries = summariesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSummaries(rangeSummaries);
      } catch (e) {
        console.error("Failed to load analytics summaries:", e);
      }
    }
    loadRangeData();
  }, [user, startDate, endDate, loadingData]);

  // Computations
  const baseKpis = useMemo(() => computeKPIs(summaries, startDate, endDate, allSummaries), [summaries, startDate, endDate, allSummaries]);
  const breakdown = useMemo(() => computeHabitBreakdown(habits, summaries, startDate, endDate, allSummaries), [habits, summaries, startDate, endDate, allSummaries]);
  const kpis = useMemo(() => {
    if (selectedHabit === 'overall') return baseKpis;
    const hb = breakdown.find(b => b.id === selectedHabit);
    if (!hb) return baseKpis;
    return {
        ...baseKpis,
        averageScore: Math.round(hb.avgScore),
        bestDayScore: hb.bestScore,
        lowestDayScore: hb.lowestScore,
        consistency: hb.consistency,
        currentStreak: hb.currentStreak,
        bestStreak: hb.bestStreak,
        bestDay: 'Selected Habit'
    };
  }, [baseKpis, breakdown, selectedHabit]);

  const heatmapGrid = useMemo(() => {
      if (summaries.length === 0) return [];
      return generateHeatmapGrid(summaries, selectedHabit === 'overall' ? 'overall' : 'habit', selectedHabit, startDate, endDate);
  }, [summaries, selectedHabit, startDate, endDate]);

  const areasToImprove = useMemo(() => identifyAreasToImprove(breakdown), [breakdown]);

  const effectiveStartDate = useMemo(() => {
    const firstLogDate = allSummaries.length > 0 
      ? allSummaries.reduce((min, s) => s.id < min ? s.id : min, allSummaries[0].id) 
      : null;
    return firstLogDate && firstLogDate > startDate ? firstLogDate : startDate;
  }, [startDate, allSummaries]);

  // Chart Data Prep
  const chartData = useMemo(() => {
    const dates = [];
    let current = new Date(effectiveStartDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const todayDate = new Date();
    const todayStr = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    return dates.map(dateStr => {
      const dataPoint = { date: dateStr };
      const summary = summaries.find(s => s.id === dateStr);
      
      if (dateStr > todayStr || (dateStr === todayStr && !summary)) {
        dataPoint.overallScore = null;
      } else {
        dataPoint.overallScore = summary?.overallScore || 0;
      }
      
      habits.forEach(h => {
        if (dateStr > todayStr || (dateStr === todayStr && summary?.habitScores?.[h.id] === undefined)) {
          dataPoint[h.id] = null;
        } else {
          dataPoint[h.id] = summary?.habitScores?.[h.id] !== undefined ? summary.habitScores[h.id] : 0;
        }
      });
      
      return dataPoint;
    });  }, [startDate, endDate, summaries, habits]);

  const dailyDataForHeatmap = useMemo(() => {
    return chartData.map(d => ({
        date: d.date,
        score: selectedHabit === 'overall' ? d.overallScore : (d[selectedHabit] !== undefined ? d[selectedHabit] : null)
    })).filter(d => d.score !== null);
  }, [chartData, selectedHabit]);

  const getWeekStart = (dateStr) => {
    const result = new Date(dateStr);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    return result.toISOString().split('T')[0];
  };

  const aggregatedHeatmapData = useMemo(() => {
    if (heatmapPeriod === 'day') return null;
    const groups = new Map();
    dailyDataForHeatmap.forEach(item => {
        const date = new Date(item.date);
        let key, label;
        if (heatmapPeriod === 'week') {
            key = getWeekStart(item.date);
            const start = new Date(key);
            const end = new Date(start); end.setDate(end.getDate() + 6);
            const format = (d) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" }).toUpperCase();
            label = `${format(start)} – ${format(end)}`;
        } else if (heatmapPeriod === 'month') {
            key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
            label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
        }
        if (!groups.has(key)) groups.set(key, { keyDate: new Date(key), label, scores: [] });
        if (item.score !== null && item.score !== undefined) groups.get(key).scores.push(item.score);
    });
    return Array.from(groups.values()).sort((a, b) => a.keyDate - b.keyDate).map(group => ({
        label: group.label,
        average: group.scores.length ? Math.round(group.scores.reduce((a, b) => a + b, 0) / group.scores.length) : 0
    }));
  }, [dailyDataForHeatmap, heatmapPeriod]);

  // ECharts Options Generator
  const getEChartOption = (habitId) => {
    const isOverall = habitId === 'overall';
    const series = isOverall
      ? (() => {
          const rawData = chartData.map(d => d.overallScore);
          let lastIdx = -1;
          for (let i = rawData.length - 1; i >= 0; i--) {
            if (rawData[i] !== null) { lastIdx = i; break; }
          }
          const formattedData = rawData.map((val, idx) => {
            if (idx === lastIdx) return { value: val, symbol: 'circle', symbolSize: 8 };
            return val;
          });
          return [{
            name: 'Overall Score',
            type: 'line',
            data: formattedData,
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
            showSymbol: true,
            symbol: 'none',
            smooth: true
          }];
        })()
      : [habitId].map((id) => {
          const habit = habits.find(h => h.id === id);
          const globalIndex = habits.findIndex(h => h.id === id);
          const colors = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
          const color = colors[globalIndex % colors.length];
          
          const rawData = chartData.map(d => d[id]);
          let lastIdx = -1;
          for (let i = rawData.length - 1; i >= 0; i--) {
            if (rawData[i] !== null) { lastIdx = i; break; }
          }
          const formattedData = rawData.map((val, idx) => {
            if (idx === lastIdx) return { value: val, symbol: 'circle', symbolSize: 8 };
            return val;
          });

          return {
            name: habit?.name || id,
            type: 'line',
            data: formattedData,
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
            showSymbol: true,
            symbol: 'none',
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
              const calendarIconHtml = renderToString(<Icon name="calendar_today" style={{ fontSize: '10px', width: '10px', height: '10px', fill: 'currentColor' }} />);
              html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div style="font-weight: 600; font-size: 12px; color: #111827;">Overall Score</div>
                  <div style="background: #ecfdf5; color: #10b981; padding: 2px 4px; border-radius: 4px; font-weight: 600; font-size: 10px; border: 1px solid #d1fae5;">${score}%</div>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; color: #4b5563; font-size: 9px;">
                  ${calendarIconHtml}
                  <span>${dateStr}</span>
                </div>
              `;
            } else {
              const habit = habits.find(h => h.name === seriesName);
              const icon = habit?.icon || 'check_circle';
              const color = param.color || '#3b82f6';
              const calendarIconHtml = renderToString(<Icon name="calendar_today" style={{ fontSize: '10px', width: '10px', height: '10px', fill: 'currentColor' }} />);
              const habitIconHtml = renderToString(<Icon name={icon} style={{ fontSize: '14px', width: '14px', height: '14px', fill: 'currentColor' }} />);
              
              html += `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="background: ${color}; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white;">
                      ${habitIconHtml}
                    </div>
                    <div>
                      <div style="font-weight: 600; font-size: 11px; color: #111827; line-height: 1.2; margin-bottom: 4px;">${seriesName}</div>
                      <div style="display: flex; align-items: center; gap: 4px; color: #4b5563; font-size: 9px;">
                        ${calendarIconHtml}
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
        textStyle: { color: '#747985' },
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

  if (!loadingData && habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
          <Icon name="bar_chart" className=" text-5xl text-primary" />
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

  const trendData = useMemo(() => {
    const isOverall = selectedHabit === 'overall';
    let diff = 0;
    let label = 'vs prev';

    if (rangeOption !== 'all' && rangeOption !== 'custom') {
        const days = parseInt(rangeOption) || 30;
        const prevStartObj = new Date(startDate);
        prevStartObj.setDate(prevStartObj.getDate() - days);
        const previousStartDate = prevStartObj.toISOString().split('T')[0];
        const previousEndDateObj = new Date(startDate);
        previousEndDateObj.setDate(previousEndDateObj.getDate() - 1);
        const previousEndDate = previousEndDateObj.toISOString().split('T')[0];
        
        let prevSum = 0;
        let prevCount = 0;
        
        if (isOverall) {
            allSummaries.forEach(s => {
                if (s.id >= previousStartDate && s.id <= previousEndDate) {
                    if (s.overallScore !== undefined) {
                        prevSum += s.overallScore;
                        prevCount++;
                    }
                }
            });
        } else {
            allSummaries.forEach(s => {
                if (s.id >= previousStartDate && s.id <= previousEndDate) {
                    if (s.habitScores && s.habitScores[selectedHabit] !== undefined) {
                        prevSum += s.habitScores[selectedHabit];
                        prevCount++;
                    }
                }
            });
        }
        
        const prevAvg = prevCount > 0 ? prevSum / prevCount : 0;
        const currentAvg = kpis.averageScore || 0;
        
        diff = Math.round(currentAvg) - Math.round(prevAvg);
        label = `vs last ${days} days`;
    } else {
        const validScores = chartData.map(d => isOverall ? d.overallScore : (d[selectedHabit] !== undefined ? d[selectedHabit] : 0)).filter(s => s !== null && s > 0);
        const latestScore = validScores.length > 0 ? validScores[validScores.length - 1] : 0;
        const prevScore = validScores.length > 1 ? validScores[validScores.length - 2] : 0;
        diff = Math.round(latestScore) - Math.round(prevScore);
        label = `vs prev day`;
    }
    
    return {
        diff,
        isUp: diff >= 0,
        text: `${diff >= 0 ? '↑' : '↓'} ${Math.abs(diff)}%`,
        label
    };
  }, [rangeOption, startDate, allSummaries, selectedHabit, kpis, chartData]);

  return (
    <div className="flex flex-col gap-4 w-full -mt-2">
      {/* 1. Header & Date Controls */}
      <div className="flex flex-row justify-between items-center gap-2 w-full mt-2 px-1">
        <h1 className="text-[22px] sm:text-[28px] font-bold text-[#15171c] truncate tracking-tight">Analytics</h1>
        
        {/* Timeframe Selector Dropdown */}
        <div className="relative shrink-0 z-20">
          <select 
            value={rangeOption}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'custom' && !userDoc?.isPro) {
                setShowProUpgradeModal(true);
                return;
              }
              setRangeOption(val);
              if (val === 'custom') {
                setIsCustomDropdownOpen(true);
              } else {
                setIsCustomDropdownOpen(false);
              }
            }}
            className="appearance-none bg-white border border-[#e6e7eb] text-[#15171c] font-semibold text-[13px] rounded-full pl-3 pr-8 py-1.5 shadow-sm focus:outline-none hover:bg-[#f9fafb] transition-colors cursor-pointer"
          >
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="custom">Custom{userDoc?.isPro ? '' : ' (PRO)'}</option>
          </select>
          <Icon name="keyboard_arrow_down" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747985] pointer-events-none text-[18px]" />
          
          {/* Inline custom date panel */}
          {isCustomDropdownOpen && rangeOption === 'custom' && (
            <div className="absolute top-full right-0 mt-2 bg-surface border border-outline-variant/40 rounded-[16px] p-2 flex flex-col sm:flex-row items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 z-50 w-max max-w-[calc(100vw-32px)]">
              <div className="relative flex-1 min-w-0 sm:w-[130px] border border-outline-variant/40 rounded-full px-2 bg-surface-container-lowest">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full text-xs py-1.5 bg-transparent border-none text-on-surface focus:outline-none appearance-none" />
              </div>
              <span className="text-on-surface-variant text-xs font-bold">TO</span>
              <div className="relative flex-1 min-w-0 sm:w-[130px] border border-outline-variant/40 rounded-full px-2 bg-surface-container-lowest">
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full text-xs py-1.5 bg-transparent border-none text-on-surface focus:outline-none appearance-none" />
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
                className="h-7 px-3 rounded-full bg-[#151515] text-white text-xs font-bold hover:bg-[#2a2a2a] transition-colors shadow-sm"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Content */}
      {loadingData ? (
        <div className="flex flex-col gap-8 w-full animate-pulse mt-4">
          <div className="h-64 bg-surface-container-high rounded-2xl w-full"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-[120px] bg-surface-container-high rounded-2xl"></div>)}
          </div>
        </div>
      ) : (
      <div className="flex flex-col gap-5 w-full animate-in fade-in duration-500 mt-2">
      
        {/* Chart/Heatmap Toggle & Habit Selector Row */}
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Chart/Heatmap Toggle */}
          <div className="flex bg-surface-container rounded-full p-[3px] border border-outline-variant/50 shadow-sm shrink-0">
            <button 
              onClick={() => setViewMode('charts')}
              className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${viewMode === 'charts' ? 'bg-white text-[#15171c] shadow-sm border border-outline-variant/30' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              Chart
            </button>
            <button 
              onClick={() => setViewMode('heatmap')}
              className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${viewMode === 'heatmap' ? 'bg-white text-[#15171c] shadow-sm border border-outline-variant/30' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              Heatmap
            </button>
          </div>
          
          {/* Habit Selector Dropdown */}
          <div className="relative shrink-0 flex-1 max-w-[160px] group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              {selectedHabit === 'overall' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#747985] group-hover:text-[#15171c] transition-colors">
                  <rect width="7" height="7" x="3" y="3" rx="1"/>
                  <rect width="7" height="7" x="14" y="3" rx="1"/>
                  <rect width="7" height="7" x="14" y="14" rx="1"/>
                  <rect width="7" height="7" x="3" y="14" rx="1"/>
                </svg>
              ) : (
                <span className="text-[14px] leading-none">{habits.find(h => h.id === selectedHabit)?.icon || '✨'}</span>
              )}
            </div>
            <select 
              value={selectedHabit} 
              onChange={e => setSelectedHabit(e.target.value)}
              className="w-full bg-white text-[#15171c] border border-[#e6e7eb] hover:bg-[#f9fafb] font-semibold text-[13px] rounded-[10px] pl-9 pr-8 py-[7px] appearance-none focus:outline-none shadow-[0_2px_8px_rgba(0,0,0,0.02)] truncate cursor-pointer transition-colors"
            >
              <option value="overall">All Habits</option>
              {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747985] pointer-events-none">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>

        {/* Hero Performance Card */}
        {isFutureOnly ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-[#e6e7eb] rounded-[18px] shadow-sm text-center">
              <Icon name="event_upcoming" className="text-5xl text-on-surface-variant mb-4" />
              <h3 className="font-headline-md text-on-surface mb-2">Future Date Selected</h3>
              <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
                No data available for future dates. Please select a valid past or current date range.
              </p>
          </div>
        ) : (
          <div className="bg-white rounded-[18px] border border-[#f0f0f0] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col pt-5 pb-2 overflow-hidden relative">
            <div className="px-5 flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <span className="text-[#15171c] font-bold text-[14px]">Overall Performance</span>
                <span className="text-[44px] font-black text-[#4f7cff] leading-[1.1] tracking-tight">{Math.round(kpis.averageScore || 0)}%</span>
              </div>
              
              <div className="flex flex-col items-end">
                <span 
                  className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-bold leading-none mb-1 gap-0.5"
                  style={{
                    color: trendData.isUp ? '#18a56c' : '#ef4444',
                    backgroundColor: trendData.isUp ? 'rgba(24, 165, 108, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                  }}
                >
                  {trendData.text}
                </span>
                <span className="text-[#a0a5b1] text-[11px] font-medium">{trendData.label}</span>
              </div>
            </div>

            
            {/* ECharts Instance or Heatmap */}
            <div className="w-full flex-grow min-h-[180px] -mb-2">
              {viewMode === 'charts' ? (
                <ReactEChartsCore echarts={echarts} option={getEChartOption(selectedHabit)} style={{ height: '180px', width: '100%' }} />
              ) : (
                <div className="flex flex-col px-5 pb-5">
                  <div className="flex items-center gap-2 mb-4 shrink-0 flex-wrap">
                    <div className="flex bg-[#f9fafb] rounded-full p-1 border border-[#e6e7eb] shadow-sm">
                      <button onClick={() => setHeatmapPeriod('day')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${heatmapPeriod === 'day' ? 'bg-[#151515] text-white' : 'text-[#747985]'}`}>Day</button>
                      <button onClick={() => setHeatmapPeriod('week')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${heatmapPeriod === 'week' ? 'bg-[#151515] text-white' : 'text-[#747985]'}`}>Week</button>
                      <button onClick={() => setHeatmapPeriod('month')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${heatmapPeriod === 'month' ? 'bg-[#151515] text-white' : 'text-[#747985]'}`}>Month</button>
                    </div>
                  </div>
                  <div className="flex-grow flex flex-col overflow-x-auto pb-2 custom-scrollbar">
                    {heatmapPeriod === 'day' ? (
                      <div className="flex gap-4 w-full">
                        {heatmapGrid.map((monthData, mIndex) => (
                          <div key={mIndex} className="flex gap-2">
                            {(mIndex === 0) && (
                              <div className="flex flex-col justify-between py-[2px] pr-2 font-mono-data text-[10px] text-[#747985] shrink-0 mt-[20px]" style={{ height: '154px' }}>
                                <span className="leading-tight">Mon</span><span className="leading-tight">Tue</span><span className="leading-tight">Wed</span><span className="leading-tight">Thu</span><span className="leading-tight">Fri</span><span className="leading-tight">Sat</span><span className="leading-tight">Sun</span>
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-[#747985] uppercase tracking-wider mb-1 ml-1 text-center">{monthData.monthLabel}</span>
                              <div className="grid-heatmap" style={{ gap: '4px', height: '154px' }}>
                                {monthData.cells.map((cell, i) => (
                                  <div 
                                    key={i} 
                                    onClick={() => { if (!cell.isPad) setSelectedDay(cell.date); }}
                                    className={`transition-colors relative flex items-center justify-center font-mono-data heatmap-cell ${cell.isPad ? 'bg-transparent cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-primary/50'} ${!cell.isPad && cell.score === null ? 'bg-[#f3f4f6]' : !cell.isPad ? 'bg-perf-' + cell.perfBand : ''}`}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-3 w-max">
                        {aggregatedHeatmapData.map((period, i) => (
                          <div key={i} className={`flex flex-col items-center justify-center rounded-[14px] p-4 min-w-[90px] ${getPerfBandClass(period.average)} shadow-sm border border-outline-variant/20`}>
                            <span className="text-[11px] font-bold text-white/90 text-center leading-tight mb-2 uppercase tracking-widest">{period.label}</span>
                            <span className="text-3xl font-black text-white">{period.average}</span>
                            <span className="text-[10px] font-bold text-white/70 uppercase mt-1">/100</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact KPI Grid (2x2) */}
        {!isFutureOnly && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {/* KPI 1: Average */}
            <div className="bg-white rounded-[16px] border border-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#f0f4ff] text-[#4f7cff] flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-4"/></svg>
              </div>
              <span className="text-[24px] font-black text-[#4f7cff] leading-none mb-1">{Math.round(kpis.averageScore || 0)}%</span>
              <span className="text-[#747985] text-[11px] font-semibold leading-tight max-w-[80%]">Average<br/>Performance</span>
            </div>
            
            {/* KPI 2: Consistency */}
            <div className="bg-white rounded-[16px] border border-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <span className="text-[24px] font-black text-[#10b981] leading-none mb-1">{kpis.consistency || 0}%</span>
              <span className="text-[#747985] text-[11px] font-semibold leading-tight max-w-[80%]">Consistency<br/>Rate</span>
            </div>

            {/* KPI 3: Current Streak */}
            <div className="bg-white rounded-[16px] border border-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#fffbeb] text-[#f59e0b] flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <span className="text-[24px] font-black text-[#f59e0b] leading-none mb-1">{kpis.currentStreak || 0}</span>
              <span className="text-[#747985] text-[11px] font-semibold leading-tight max-w-[80%]">Current Streak<br/>Days</span>
            </div>

            {/* KPI 4: Best Streak */}
            <div className="bg-white rounded-[16px] border border-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#fdf4ff] text-[#d946ef] flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
              </div>
              <span className="text-[24px] font-black text-[#d946ef] leading-none mb-1">{kpis.bestStreak || 0}</span>
              <span className="text-[#747985] text-[11px] font-semibold leading-tight max-w-[80%]">Best Streak<br/>Days</span>
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {!isFutureOnly && (
          <div className="flex flex-col gap-3 mt-2 mb-8">
            <h2 className="text-[15px] font-bold text-[#15171c] ml-1">Performance Insights</h2>
            
            <div className="bg-white rounded-[16px] border border-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
              {/* Insight 1: Best Day */}
              <div className="flex items-center justify-between p-4 border-b border-[#f0f0f0] hover:bg-[#f9fafb] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#ecfdf5] text-[#10b981] flex items-center justify-center shrink-0">
                    <Icon name="emoji_events" className="text-[18px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#15171c] text-[14px] font-bold leading-tight">Best Day</span>
                    <span className="text-[#747985] text-[12px] font-medium mt-0.5">
                      {kpis.bestDay && kpis.bestDay !== 'N/A' ? new Date(kpis.bestDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-black text-[#10b981]">{kpis.bestDayScore || 0}%</span>
                  <Icon name="chevron_right" className="text-[#d1d5db] text-[18px]" />
                </div>
              </div>

              {/* Insight 2: Needs Attention */}
              <div className="flex items-center justify-between p-4 border-b border-[#f0f0f0] hover:bg-[#f9fafb] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#fef2f2] text-[#ef4444] flex items-center justify-center shrink-0">
                    <Icon name="error" className="text-[18px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#15171c] text-[14px] font-bold leading-tight">Needs Attention</span>
                    <span className="text-[#747985] text-[12px] font-medium mt-0.5">
                      {kpis.lowestDay && kpis.lowestDay !== 'N/A' ? new Date(kpis.lowestDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-black text-[#ef4444]">{kpis.lowestDayScore || 0}%</span>
                  <Icon name="chevron_right" className="text-[#d1d5db] text-[18px]" />
                </div>
              </div>

              {/* Insight 3: Tracked Days */}
              <div className="flex items-center justify-between p-4 hover:bg-[#f9fafb] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
                    <Icon name="calendar_today" className="text-[18px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#15171c] text-[14px] font-bold leading-tight">Tracked Days</span>
                    <span className="text-[#747985] text-[12px] font-medium mt-0.5">
                      out of {kpis.totalDays || 0} days
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-black text-[#3b82f6]">{kpis.trackedDays || 0}/{kpis.totalDays || 0}</span>
                  <Icon name="chevron_right" className="text-[#d1d5db] text-[18px]" />
                </div>
              </div>
            </div>
          </div>
        )}

              </div>
      )}
      
      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#f0f0f0] flex justify-between items-center bg-[#f9fafb]">
              <div>
                <h3 className="text-[20px] font-bold text-[#15171c] leading-tight">
                  {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-[#747985] text-[13px] font-medium mt-1">Daily Performance</p>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="w-10 h-10 rounded-full bg-[#f0f0f0] text-[#747985] flex items-center justify-center hover:bg-[#e6e7eb] hover:text-[#15171c] transition-colors"
              >
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex-grow bg-white">
              {(() => {
                const daySummary = summaries.find(s => s.id === selectedDay);
                if (!daySummary) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#f9fafb] flex items-center justify-center mb-4">
                        <Icon name="block" className="text-[28px] text-[#d1d5db]" />
                      </div>
                      <p className="text-[#15171c] font-semibold text-[16px]">No Activity Tracked</p>
                      <p className="text-[#747985] text-[14px] mt-1">You didn't track any habits on this day.</p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between p-4 bg-[#f4f7ff] rounded-[16px] border border-[#e0e7ff]">
                      <span className="text-[15px] font-bold text-[#15171c]">Overall Score</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[24px] font-black text-perf-${getPerformanceBand(daySummary.overallScore).id}`}>
                          {daySummary.overallScore}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[12px] font-bold text-[#747985] uppercase tracking-wider mb-3 ml-1">Habit Breakdown</h4>
                      <div className="flex flex-col gap-2">
                        {habits.map(h => {
                          const score = daySummary.habitScores?.[h.id];
                          if (score === undefined) return null;
                          const band = getPerformanceBand(score).id;
                          return (
                            <div key={h.id} className="flex items-center justify-between p-3.5 bg-white border border-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-[14px]">
                              <div className="flex items-center gap-3">
                                <span className="text-[18px]">{h.icon}</span>
                                <span className="text-[14px] font-semibold text-[#15171c]">{h.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
                                  <div className={`h-full bg-perf-${band} rounded-full`} style={{ width: `${score}%` }}></div>
                                </div>
                                <span className={`text-[14px] font-bold text-perf-${band} w-10 text-right`}>{score}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <ProModal 
        isOpen={showProUpgradeModal} 
        onClose={() => setShowProUpgradeModal(false)} 
        source="custom_analytics" 
      />
    </div>
  );

}

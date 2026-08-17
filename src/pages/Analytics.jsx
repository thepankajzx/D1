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
  const baseKpis = useMemo(() => computeKPIs(summaries, startDate, endDate), [summaries, startDate, endDate]);
  const breakdown = useMemo(() => computeHabitBreakdown(habits, summaries, startDate, endDate), [habits, summaries, startDate, endDate]);
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

    return dates.map(dateStr => {
      const dataPoint = { date: dateStr };
      const summary = summaries.find(s => s.id === dateStr);
      dataPoint.overallScore = summary?.overallScore || 0;
      
      habits.forEach(h => {
        dataPoint[h.id] = summary?.habitScores?.[h.id] !== undefined ? summary.habitScores[h.id] : null;
      });
      
      return dataPoint;
    });
  }, [startDate, endDate, summaries, habits]);

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
      : [habitId].map((id) => {
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

  const renderCustomKPIHeader = (habitId) => {
    const isOverall = habitId === 'overall';
    const breakdownHabit = isOverall ? {
      id: 'overall',
      name: 'Overall',
      avgScore: kpis.averageScore,
      consistency: kpis.consistency,
      bestScore: kpis.bestDayScore,
      bestDate: kpis.bestDay,
      lowestScore: kpis.lowestDayScore,
      lowestDate: kpis.lowestDay,
      trackedDays: kpis.trackedDays
    } : breakdown.find(b => b.id === habitId) || {};

    const habitDataPoints = chartData.map(d => ({ date: d.date, score: isOverall ? d.overallScore : (d[habitId] || 0) }));
    const segments = habitDataPoints.slice(-30);
    
    let diff = 0;
    
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
                    prevSum += s.overallScore;
                    prevCount++;
                }
            });
        } else {
            summaries.forEach(s => {
                if (s.id >= previousStartDate && s.id <= previousEndDate) {
                    if (s.habitScores && s.habitScores[habitId] !== undefined) {
                        prevSum += s.habitScores[habitId];
                        prevCount++;
                    }
                }
            });
        }
        
        const prevAvg = prevCount > 0 ? prevSum / prevCount : 0;
        const currentAvg = breakdownHabit.avgScore || 0;
        
        diff = Math.round(currentAvg) - Math.round(prevAvg);
    } else {
        const validScores = habitDataPoints.filter(d => d.score > 0).map(d => d.score);
        const latestScore = validScores.length > 0 ? validScores[validScores.length - 1] : 0;
        const prevScore = validScores.length > 1 ? validScores[validScores.length - 2] : 0;
        diff = latestScore - prevScore;
    }
    
    const isUp = diff >= 0;
    const diffText = `${isUp ? '↑' : '↓'} ${Math.abs(diff)}%`;

    let displayBestScore = breakdownHabit.bestScore;
    let displayLowestScore = breakdownHabit.lowestScore;
    let displayBestDate = breakdownHabit.bestDate;
    let displayLowestDate = breakdownHabit.lowestDate;
    let bestLabel = 'Best Day';
    let worstLabel = 'Worst Day';

    if (viewMode === 'heatmap' && heatmapPeriod !== 'day' && aggregatedHeatmapData && aggregatedHeatmapData.length > 0) {
        bestLabel = heatmapPeriod === 'week' ? 'Best Week' : 'Best Month';
        worstLabel = heatmapPeriod === 'week' ? 'Worst Week' : 'Worst Month';
        
        let best = aggregatedHeatmapData[0];
        let worst = aggregatedHeatmapData[0];
        
        aggregatedHeatmapData.forEach(d => {
            if (d.average > best.average) best = d;
            if (d.average < worst.average) worst = d;
        });
        
        displayBestScore = best.average;
        displayBestDate = best.label;
        displayLowestScore = worst.average;
        displayLowestDate = worst.label;
    }

    let timeframeLabel = 'All-Time';
    if (rangeOption !== 'all' && rangeOption !== 'custom') {
        timeframeLabel = `${parseInt(rangeOption) || 30} Days`;
    } else if (rangeOption === 'custom') {
        timeframeLabel = 'Custom';
    }

    const colors = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
    const globalIndex = habits.findIndex(h => h.id === habitId);
    const color = isOverall ? '#17b8c8' : colors[globalIndex % colors.length];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full shrink-0">
        <div className="flex flex-col p-4 bg-surface border border-outline-variant rounded-2xl shadow-sm hover:border-outline-variant/80 transition-colors">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Average Score</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-display-sm font-bold text-on-surface leading-none">{Math.round(breakdownHabit.avgScore) || 0}%</span>
            <span className={`text-[11px] font-bold mb-1 ${isUp ? 'text-perf-10' : 'text-error'}`}>{diffText}</span>
          </div>
        </div>
        <div className="flex flex-col p-4 bg-surface border border-outline-variant rounded-2xl shadow-sm hover:border-outline-variant/80 transition-colors">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">{bestLabel}</span>
          <span className="text-3xl font-display-sm font-bold text-perf-10 leading-none">{displayBestScore || 0}%</span>
          <span className="text-[11px] text-on-surface-variant mt-1 truncate">
            {(viewMode === 'heatmap' && heatmapPeriod !== 'day') ? (displayBestDate || 'N/A') : (displayBestDate && displayBestDate !== 'N/A' && displayBestDate !== 'Selected Habit' ? new Date(displayBestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'N/A')}
          </span>
        </div>
        <div className="flex flex-col p-4 bg-surface border border-outline-variant rounded-2xl shadow-sm hover:border-outline-variant/80 transition-colors">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">{worstLabel}</span>
          <span className="text-3xl font-display-sm font-bold text-error leading-none">{displayLowestScore || 0}%</span>
          <span className="text-[11px] text-on-surface-variant mt-1 truncate">
            {(viewMode === 'heatmap' && heatmapPeriod !== 'day') ? (displayLowestDate || 'N/A') : (displayLowestDate && displayLowestDate !== 'N/A' && displayLowestDate !== 'Selected Habit' ? new Date(displayLowestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'N/A')}
          </span>
        </div>
        <div className="flex flex-col p-4 bg-surface border border-outline-variant rounded-2xl shadow-sm hover:border-outline-variant/80 transition-colors">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Tracked</span>
          <span className="text-3xl font-display-sm font-bold text-primary leading-none">{breakdownHabit.trackedDays || 0}</span>
          <span className="text-[11px] text-on-surface-variant mt-1 uppercase">Days</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header & Date Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Performance Analytics</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Analyze your habit consistency and intensity over time.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2 relative z-20" ref={dateSelectorRef}>
          <div className="flex items-center bg-surface-container-lowest backdrop-blur-md rounded-full p-1 border border-outline-variant/50 shadow-sm w-fit">
            {['7', '30', '90', 'custom'].map((val) => {
              const isActive = rangeOption === val;
              const isCustom = val === 'custom';
              const label = isCustom ? 'Custom' : `${val} Days`;
              return (
                <button
                  key={val}
                  onClick={() => {
                    if (isCustom && !userDoc?.isPro) {
                      setShowProUpgradeModal(true);
                      return;
                    }
                    setRangeOption(val);
                    if (isCustom) {
                      setIsCustomDropdownOpen(true);
                    } else {
                      setIsCustomDropdownOpen(false);
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 h-8 sm:h-9 px-3 sm:px-5 rounded-full text-[11px] sm:text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-on-surface text-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'}`}
                >
                  {isCustom && <Icon name="calendar_today" className=" text-[14px] sm:text-[16px]" />}
                  {label}
                  {isCustom && !userDoc?.isPro && <span className="pro-badge" style={{ padding: '2px 6px', fontSize: '9px', lineHeight: 1, height: '18px', marginLeft: '2px' }}>PRO</span>}
                </button>
              );
            })}
          </div>
          
          {/* Inline custom date panel */}
          {isCustomDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 bg-surface border border-outline-variant/40 rounded-full p-1.5 flex flex-row items-center shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 z-50 w-max max-w-[calc(100vw-32px)] overflow-hidden">
              <div className="relative flex-1 min-w-0 sm:w-[140px]">
                <Icon name="calendar_today" className=" absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none" />
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full text-xs sm:text-sm rounded-full py-2 pl-8 pr-2 bg-transparent border-none text-on-surface focus:outline-none focus:bg-surface-variant/30 transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
              </div>
              
              <div className="w-[1px] h-6 bg-outline-variant/40 mx-1 shrink-0"></div>
              
              <div className="relative flex-1 min-w-0 sm:w-[140px]">
                <Icon name="calendar_today" className=" absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none" />
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full text-xs sm:text-sm rounded-full py-2 pl-8 pr-2 bg-transparent border-none text-on-surface focus:outline-none focus:bg-surface-variant/30 transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
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
                className="h-9 w-9 ml-1 shrink-0 rounded-full bg-on-surface text-surface flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
              >
                <Icon name="arrow_forward" className=" text-[18px]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Content */}
      {loadingData ? (
        <div className="flex flex-col gap-8 w-full animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-[120px] bg-surface-container-high rounded-2xl"></div>)}
          </div>
          <div className="h-64 bg-surface-container-high rounded-2xl w-full mt-4"></div>
        </div>
      ) : (
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
        
        {/* ROW 2: Sleek Horizontal Habit Selector Tab Bar + View Toggle */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2 mb-2">
          {/* Horizontal Scrollable Tabs */}
          <div className="flex w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0 items-center gap-2">
             <button 
                onClick={() => setSelectedHabit('overall')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedHabit === 'overall' ? 'bg-on-surface text-surface shadow-md' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
             >
                Overall
             </button>
             {habits.map(h => (
                <button
                    key={h.id}
                    onClick={() => setSelectedHabit(h.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedHabit === h.id ? 'bg-on-surface text-surface shadow-md' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
                >
                    {h.name}
                </button>
             ))}
          </div>

          {/* View Toggle Icon Buttons */}
          <div className="flex shrink-0 bg-surface border border-outline-variant rounded-full p-1 shadow-sm">
             <button
                onClick={() => setViewMode('charts')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-colors ${viewMode === 'charts' ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
             >
                <Icon name="show_chart" className="text-sm" /> Chart
             </button>
             <button
                onClick={() => setViewMode('heatmap')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-colors ${viewMode === 'heatmap' ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
             >
                <Icon name="grid_view" className="text-sm" /> Heatmap
             </button>
          </div>
        </div>

        {/* Main Chart & Heatmap */}
        {isFutureOnly ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface border border-outline-variant rounded-2xl shadow-sm text-center">
              <Icon name="event_upcoming" className=" text-5xl text-on-surface-variant mb-4" />
              <h3 className="font-headline-md text-on-surface mb-2">Future Date Selected</h3>
              <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
                Ye data abhi aana baaki hai. Future ki dates mein koi habit tracking data nahi hai. Please past ya current date select karein.
              </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
            
              {/* ROW 3: KPIs */}
              {renderCustomKPIHeader(selectedHabit)}
          
              {/* Trend Line Chart */}
              {viewMode === 'charts' && (
                <div className="w-full flex flex-col pt-2">
                  <div className="flex-grow w-full flex flex-col min-h-[300px]">
                    <div className="sm:bg-surface sm:border sm:border-outline-variant/50 sm:rounded-[24px] sm:p-5 sm:shadow-sm">
                      <ReactEChartsCore echarts={echarts} option={getEChartOption(selectedHabit)} style={{ height: '350px', width: '100%' }} />
                    </div>
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
                <Icon name="close" className="" />
              </button>
            </div>
          )}
          <div className={isZoomedOut ? 'flex-1 flex flex-col items-center justify-center overflow-hidden w-full relative' : 'w-full'}>
            <div className={`flex flex-col ${isZoomedOut ? 'bg-surface w-full max-w-7xl max-h-full overflow-auto border border-outline-variant shadow-sm rounded-2xl p-6' : 'w-full flex flex-col pt-4'}`}>
          <div className="flex justify-between items-center mb-6 shrink-0 gap-2 flex-wrap">
            <h2 className="font-headline-md text-headline-md text-on-surface whitespace-nowrap overflow-hidden text-ellipsis">Consistency Map</h2>
            
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {/* Heatmap Period Toggle */}
              <div className="flex bg-surface-container-lowest rounded-full p-1 border border-outline-variant/50 shadow-sm mr-2">
                 <button
                    onClick={() => setHeatmapPeriod('day')}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-colors ${heatmapPeriod === 'day' ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'}`}
                 >
                    Day
                 </button>
                 <button
                    onClick={() => setHeatmapPeriod('week')}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-colors ${heatmapPeriod === 'week' ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'}`}
                 >
                    Week
                 </button>
                 <button
                    onClick={() => setHeatmapPeriod('month')}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-colors ${heatmapPeriod === 'month' ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'}`}
                 >
                    Month
                 </button>
              </div>

              {heatmapPeriod === 'day' && (
                <button 
                    onClick={() => setShowPercentages(!showPercentages)}
                    className="flex items-center gap-1 h-7 sm:h-8 rounded-[10px] border border-outline-variant/50 p-1 transition-all shadow-sm bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant"
                    title={showPercentages ? 'Hide %' : 'Show %'}
                >
                    <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-sm border border-outline-variant/30 transition-colors ${showPercentages ? 'bg-[#151515] text-white' : 'bg-surface text-on-surface-variant'}`}>
                      <Icon name={showPercentages ? 'visibility_off' : 'visibility'} className=" text-[12px] sm:text-[14px]" />
                    </div>
                    <div className="w-[1px] h-3 bg-outline-variant/50"></div>
                    <span className="text-[10px] sm:text-[11px] font-bold pr-1 sm:pr-1.5 leading-none self-center">%</span>
                </button>
              )}
              
              {!isZoomedOut && (
              <button 
                  onClick={() => setIsZoomedOut(true)}
                  className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] border border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low transition-all shadow-sm text-on-surface-variant hover:text-on-surface"
                  title="Zoom Out"
              >
                  <Icon name="fullscreen" className=" text-[16px] sm:text-[18px]" />
              </button>
              )}
            </div>
          </div>
          


          <div className="flex-grow flex flex-col overflow-x-auto pb-4 custom-scrollbar">
            {heatmapPeriod === 'day' ? (
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
                            className={`transition-colors relative flex items-center justify-center font-mono-data heatmap-cell ${
                              cell.isPad ? 'bg-transparent cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-primary/50'
                            } ${
                              !cell.isPad && cell.score === null ? 'bg-surface-container' : !cell.isPad ? 'bg-perf-' + cell.perfBand : ''
                            }`}
                          >
                            {!cell.isPad && cell.score !== null && (
                              <span className={`absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] font-medium text-white drop-shadow-md pointer-events-none transition-opacity duration-200 ${showPercentages ? 'opacity-100' : 'opacity-0'}`}>
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
            ) : (
              <div className="flex gap-3 sm:gap-4 w-max">
                {aggregatedHeatmapData.map((period, i) => {
                  const perfBg = getPerfBandClass(period.average);
                  return (
                    <div 
                      key={i} 
                      className={`flex flex-col items-center justify-center rounded-2xl p-4 sm:p-5 min-w-[100px] sm:min-w-[120px] ${perfBg} shadow-sm border border-outline-variant/20 transition-transform hover:scale-105`}
                    >
                      <span className="text-[10px] sm:text-[11px] font-bold text-white/90 text-center leading-tight mb-2 uppercase tracking-widest drop-shadow-sm">
                        {period.label}
                      </span>
                      <span className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
                        {period.average}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase mt-1 tracking-widest">
                        /100
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
                    <Icon name="close" className=" text-lg" />
                  </button>
                </div>
                
                <div className="w-full h-px bg-outline-variant/50 mb-6"></div>
                
                <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const daySummary = summaries.find(s => s.id === selectedDay);
                    
                    if (!daySummary) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant">
                          <Icon name="event_busy" className=" text-4xl mb-2 opacity-50" />
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
                            if (!daySummary?.habitScores || daySummary.habitScores[habit.id] === undefined) return null;
                            const score = daySummary.habitScores[habit.id] ?? 0;
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
                    <Icon name="calendar_today" className=" text-[16px]" />
                    <span className="text-[10px] max-w-[150px] leading-tight">Daily data is calculated based on your habit targets.</span>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="flex items-center gap-1 text-[10px] font-bold text-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors">
                    View Full Analytics <Icon name="arrow_forward" className=" text-[14px]" />
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
        <div className="w-full overflow-x-auto custom-scrollbar">
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
              <Icon name="trending_down" className=" text-lg" />
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
      )}
      <ProModal 
        isOpen={showProUpgradeModal} 
        onClose={() => setShowProUpgradeModal(false)} 
        source="custom_analytics" 
      />
    </div>
  );
}

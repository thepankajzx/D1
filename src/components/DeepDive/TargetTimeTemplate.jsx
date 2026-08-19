import React, { useMemo } from 'react';
import Icon from '../Icon';
import { useTargetTimeData, formatTimeAmPm } from '../../hooks/useTargetTimeData';
import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart, HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, CalendarComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, BarChart, PieChart, HeatmapChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent, CalendarComponent, CanvasRenderer]);

const getScoreColor = (score) => {
  if (score >= 90) return '#4ade80';
  if (score >= 70) return '#a3e635';
  if (score >= 50) return '#facc15';
  if (score >= 30) return '#fb923c';
  return '#f87171';
};

export default function TargetTimeTemplate({ habit, habits, allSummaries }) {
  // We'll use 30 days for now
  const data = useTargetTimeData(habit, allSummaries, 30);
  
  if (!data) return <div>Loading...</div>;

  const { stats, distribution, timePatternArray, periodSummaries, startStr, endStr } = data;

  // Chart: Score Over Time (Line)
  const lineChartOptions = useMemo(() => {
    const dates = periodSummaries.map(s => s.id);
    const scores = periodSummaries.map(s => s.habitScores?.[habit.id] ?? null);
    
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: dates, show: false },
      yAxis: { type: 'value', min: 0, max: 100, splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{
        data: scores,
        type: 'line',
        smooth: true,
        itemStyle: { color: 'var(--color-primary)' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99, 102, 241, 0.4)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0)' }
          ])
        }
      }]
    };
  }, [periodSummaries, habit.id]);

  // Chart: Score Distribution (Donut)
  const donutOptions = useMemo(() => {
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          name: 'Score',
          type: 'pie',
          radius: ['50%', '80%'], // Slightly smaller to avoid clipping
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false },
          data: [
            { value: distribution.excellent, name: 'Excellent', itemStyle: { color: '#4ade80' } },
            { value: distribution.good, name: 'Good', itemStyle: { color: '#a3e635' } },
            { value: distribution.average, name: 'Average', itemStyle: { color: '#facc15' } },
            { value: distribution.poor, name: 'Poor', itemStyle: { color: '#f87171' } }
          ]
        }
      ]
    };
  }, [distribution]);

  // Chart: Time Pattern (Bar)
  const patternOptions = useMemo(() => {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 30, right: 20, top: 20, bottom: 40 },
      xAxis: { 
        type: 'category', 
        data: timePatternArray.map(d => d.time),
        axisLabel: { fontSize: 10, rotate: 45 }
      },
      yAxis: { type: 'value', splitLine: { show: false } },
      series: [{
        data: timePatternArray.map(d => d.count),
        type: 'bar',
        itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] }
      }]
    };
  }, [timePatternArray]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* HEADER SECTION */}
      <div className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center text-3xl shadow-inner">
            <Icon name={habit.icon || 'star'} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
              {habit.name}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1"><Icon name="schedule" className="text-[16px]"/> Time Target</span>
              <span>•</span>
              <span className="font-medium">Target: {formatTimeAmPm(habit.target)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-surface-variant/50 px-4 py-3 rounded-xl flex-1 md:flex-none text-center">
            <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Total Days</div>
            <div className="text-2xl font-bold text-on-surface">{stats.totalDays}</div>
          </div>
          <div className="bg-primary/10 px-4 py-3 rounded-xl flex-1 md:flex-none text-center border border-primary/20">
            <div className="text-xs text-primary font-medium uppercase tracking-wider mb-1">Successful</div>
            <div className="text-2xl font-bold text-primary">{stats.successfulDays}</div>
          </div>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="text-xs text-on-surface-variant mb-1 flex items-center gap-1"><Icon name="query_stats" className="text-[14px]"/> Average Time</div>
          <div className="text-xl font-bold text-on-surface">{formatTimeAmPm(stats.averageMinutes)}</div>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="text-xs text-on-surface-variant mb-1 flex items-center gap-1"><Icon name="light_mode" className="text-[14px]"/> Earliest</div>
          <div className="text-xl font-bold text-on-surface">{stats.earliest ? formatTimeAmPm(stats.earliest.val) : '--:--'}</div>
          {stats.earliest && <div className="text-[10px] text-on-surface-variant mt-1">{stats.earliest.date}</div>}
        </div>
        <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="text-xs text-on-surface-variant mb-1 flex items-center gap-1"><Icon name="dark_mode" className="text-[14px]"/> Latest</div>
          <div className="text-xl font-bold text-on-surface">{stats.latest ? formatTimeAmPm(stats.latest.val) : '--:--'}</div>
          {stats.latest && <div className="text-[10px] text-on-surface-variant mt-1">{stats.latest.date}</div>}
        </div>
        <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="text-xs text-on-surface-variant mb-1 flex items-center gap-1"><Icon name="score" className="text-[14px]"/> Avg Score</div>
          <div className="text-xl font-bold text-on-surface">{stats.averageScore}%</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface rounded-2xl p-5 border border-outline-variant shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="trending_up" className="text-primary" /> Score Over Time
          </h3>
          <div className="h-[200px] w-full">
            <ReactEChartsCore echarts={echarts} option={lineChartOptions} notMerge={true} lazyUpdate={true} style={{height: '100%', width: '100%'}} />
          </div>
        </div>
        
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="donut_large" className="text-primary" /> Distribution
          </h3>
          <div className="flex-1 min-h-[150px] relative w-full flex items-center justify-center">
            <ReactEChartsCore echarts={echarts} option={donutOptions} notMerge={true} lazyUpdate={true} style={{height: '100%', width: '100%', position: 'absolute', top: 0, left: 0}} />
            <div className="text-center z-10 pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-on-surface">{stats.averageScore}%</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Avg</span>
            </div>
          </div>
          {/* Custom Legend to replace the clipped SVG one */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-outline-variant/30">
             <div className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-[#4ade80]"></div>Excellent</div>
             <div className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-[#a3e635]"></div>Good</div>
             <div className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-[#facc15]"></div>Average</div>
             <div className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full bg-[#f87171]"></div>Poor</div>
          </div>
        </div>
      </div>

      {/* PATTERNS & HEATMAP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
            <Icon name="bar_chart" className="text-primary" /> Time Pattern
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">When do you usually complete this?</p>
          <div className="h-[220px] w-full">
            <ReactEChartsCore echarts={echarts} option={patternOptions} notMerge={true} lazyUpdate={true} style={{height: '100%', width: '100%'}} />
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-outline-variant shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
            <Icon name="grid_view" className="text-primary" /> Consistency Heatmap
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">Daily performance (Legend Removed)</p>
          
          <div className="w-full overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex flex-wrap gap-1.5 justify-start min-w-[250px]">
              {/* Generate a simple grid for the last 30 days */}
              {Array.from({length: 30}).map((_, i) => {
                 const d = new Date();
                 d.setDate(d.getDate() - 29 + i);
                 const dateStr = d.toISOString().split('T')[0];
                 const sum = periodSummaries.find(s => s.id === dateStr);
                 const score = sum?.habitScores?.[habit.id];
                 
                 let color = 'var(--color-surface-container-high)'; // empty
                 if (score !== undefined && score !== null) {
                    if (score >= 90) color = '#4ade80';
                    else if (score >= 70) color = '#a3e635';
                    else if (score >= 50) color = '#facc15';
                    else if (score >= 30) color = '#fb923c';
                    else color = '#f87171';
                 }

                 return (
                   <div 
                     key={dateStr}
                     className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm sm:rounded flex-shrink-0"
                     style={{ backgroundColor: color }}
                     title={`${dateStr}: ${score !== undefined ? score + '%' : 'No data'}`}
                   />
                 );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

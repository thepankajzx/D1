import React, { useMemo, useRef, useEffect } from 'react';
import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useTheme } from '../../contexts/ThemeContext';

echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

export default function DeepDiveTrendChart({ habit, allSummaries = [], dateRange }) {
  const { isDark } = useTheme();
  const colors = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
  const colorIndex = Math.abs((habit?.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length;
  const color = colors[colorIndex];
  
  const chartContainerRef = useRef(null);
  const echartsInstanceRef = useRef(null);

  useEffect(() => {
    const handleOutsideInteraction = (e) => {
      if (chartContainerRef.current && !chartContainerRef.current.contains(e.target)) {
        if (echartsInstanceRef.current) {
          echartsInstanceRef.current.dispatchAction({ type: 'hideTip' });
        }
      }
    };

    document.addEventListener('pointerdown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, []);

  const chartOption = useMemo(() => {
    if (!habit || !dateRange) return null;
    
function formatLocalYMD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

    // Generate dates array from dateRange.start to dateRange.end
    const dates = [];
    const [sY, sM, sD] = dateRange.start.split('-').map(Number);
    const [eY, eM, eD] = dateRange.end.split('-').map(Number);
    let current = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);
    while (current <= end) {
      dates.push(formatLocalYMD(current));
      current.setDate(current.getDate() + 1);
    }

    const todayStr = formatLocalYMD(new Date());

    const chartData = dates.map(dateStr => {
      const summary = allSummaries.find(s => s.id === dateStr);
      let score = null;
      let isUntracked = true;
      if (dateStr <= todayStr) {
        if (summary && summary.habitScores && summary.habitScores[habit.id] !== undefined) {
          score = summary.habitScores[habit.id];
          isUntracked = false;
        } else if (summary) {
          score = 0;
          isUntracked = false;
        } else {
          score = null;
          isUntracked = true;
        }
      }
      return {
        date: dateStr,
        score,
        isUntracked
      };
    });

    // Series data: Individual habit has solid habit-colored dots when logged, solid black dot when not recorded
    const seriesData = chartData.map((d) => {
      if (d.isUntracked || d.score === null) {
        return {
          value: 0,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: isDark ? '#ffffff' : '#0f172a',
            borderColor: 'transparent',
            borderWidth: 0
          }
        };
      }
      return {
        value: d.score,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: color,
          borderColor: 'transparent',
          borderWidth: 0
        }
      };
    });

    const tooltipBg = isDark ? '#2a2e37' : '#ffffff';
    const tooltipBorder = isDark ? '#4A5160' : '#f1f5f9';
    const textColor = isDark ? '#F1F3F7' : '#0f172a';
    const secondaryTextColor = isDark ? '#9BA3AF' : '#64748b';
    const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(150, 150, 150, 0.15)';

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        shadowColor: 'transparent',
        confine: true,
        hideDelay: 100,
        extraCssText: 'z-index: 20 !important; pointer-events: none;',
        formatter: function (params) {
          if (!params || !params.length) return '';
          const dataIndex = params[0].dataIndex;
          const pointData = chartData[dataIndex];
          const dateObj = new Date(pointData.date + 'T00:00:00');
          const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          
          let html = `<div style="background: ${tooltipBg}; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); border: 1px solid ${tooltipBorder}; padding: 10px 14px; font-family: system-ui, -apple-system, sans-serif; min-width: 150px;">`;
          html += `<div style="font-size: 11px; color: ${secondaryTextColor}; margin-bottom: 7px; font-weight: 600; border-bottom: 1px solid ${tooltipBorder}; padding-bottom: 5px;">${dateStr}</div>`;
          
          if (pointData.isUntracked || pointData.score === null) {
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid ${textColor}; background: ${tooltipBg}; display: inline-block;"></span>
                  <span style="font-size: 13px; font-weight: 700; color: ${textColor};">Not Recorded</span>
                </div>
                <span style="font-size: 11px; font-weight: 600; color: ${secondaryTextColor}; background: ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}; padding: 2px 6px; border-radius: 4px;">No Data</span>
              </div>
            `;
          } else {
            const score = Math.round(pointData.score);
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
                  <span style="font-size: 13px; font-weight: 700; color: ${textColor};">${habit.name}</span>
                </div>
                <strong style="font-size: 14px; font-weight: 800; color: ${textColor};">${score}%</strong>
              </div>
            `;
          }
          html += `</div>`;
          return html;
        }
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'filter'
        }
      ],
      grid: { left: '10px', right: '15px', bottom: '10px', top: '15px', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.map(d => {
          const date = new Date(d.date + 'T00:00:00');
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        axisLabel: { color: secondaryTextColor, fontSize: 10, fontWeight: 500 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: secondaryTextColor, fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { type: 'dashed', color: gridLineColor } }
      },
      series: [
        {
          name: habit.name,
          type: 'line',
          data: seriesData,
          connectNulls: true,
          itemStyle: { color },
          lineStyle: { width: 3, color },
          z: 2,
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: color + '35' },
                { offset: 1, color: color + '00' }
              ]
            }
          },
          showSymbol: true
        }
      ]
    };
  }, [habit, allSummaries, dateRange, color]);

  if (!chartOption) return null;

  return (
    <div ref={chartContainerRef} className="w-full flex flex-col gap-2">
      {/* Chart Legend: Habit Solid Dot and Solid Black Dot for Not Recorded */}
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-on-surface-variant mb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }}></span>
          <span className="text-on-surface font-semibold">{habit.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white inline-block"></span>
          <span className="text-on-surface font-semibold">Not Recorded</span>
        </div>
      </div>

      <div className="w-full h-full min-h-[190px]">
        <ReactEChartsCore 
          echarts={echarts} 
          onChartReady={(instance) => { echartsInstanceRef.current = instance; }}
          option={chartOption} 
          style={{ height: '100%', width: '100%', minHeight: '190px' }} 
        />
      </div>
    </div>
  );
}


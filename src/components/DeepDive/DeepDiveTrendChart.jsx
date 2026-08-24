import React, { useMemo, useRef, useEffect } from 'react';
import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

export default function DeepDiveTrendChart({ habit, allSummaries = [], dateRange }) {
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
    
    // Generate dates array from dateRange.start to dateRange.end
    const dates = [];
    let current = new Date(dateRange.start + 'T00:00:00');
    const end = new Date(dateRange.end + 'T00:00:00');
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const todayDate = new Date();
    const todayStr = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

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

    // Series data: Normal line with Black Ring ONLY on truly untracked days
    const seriesData = chartData.map((d) => {
      if (d.isUntracked || d.score === null) {
        return {
          value: 0,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#ffffff',
            borderColor: '#0f172a',
            borderWidth: 2
          }
        };
      }
      return {
        value: d.score,
        symbol: 'none'
      };
    });

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
          
          let html = `<div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border: 1px solid #f1f5f9; padding: 10px 14px; font-family: system-ui, -apple-system, sans-serif; min-width: 150px;">`;
          html += `<div style="font-size: 11px; color: #64748b; margin-bottom: 7px; font-weight: 600; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">${dateStr}</div>`;
          
          if (pointData.isUntracked || pointData.score === null) {
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid #0f172a; background: #ffffff; display: inline-block;"></span>
                  <span style="font-size: 13px; font-weight: 700; color: #0f172a;">Not Recorded</span>
                </div>
                <span style="font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">No Data</span>
              </div>
            `;
          } else {
            const score = Math.round(pointData.score);
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
                  <span style="font-size: 13px; font-weight: 700; color: #1e293b;">${habit.name}</span>
                </div>
                <strong style="font-size: 14px; font-weight: 800; color: #0f172a;">${score}%</strong>
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
        axisLabel: { color: '#868381', fontSize: 10, fontWeight: 500 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: '#868381', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(150, 150, 150, 0.15)' } }
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
      {/* Chart Legend - Exclusively 'Not Recorded' with Black Ring */}
      <div className="flex items-center justify-end gap-2 text-xs font-medium text-slate-500 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-white"></span>
          <span className="text-slate-700 font-semibold">Not Recorded</span>
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


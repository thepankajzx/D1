import React, { useMemo } from 'react';
import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([PieChart, TooltipComponent, CanvasRenderer]);

export default function DeepDivePerformanceDonut({ habit, allSummaries = [], dateRange, data }) {
  const stats = useMemo(() => {
    if (!habit || !dateRange) return null;

    // Generate dates in range
    const dates = [];
    let current = new Date(dateRange.start + 'T00:00:00');
    const end = new Date(dateRange.end + 'T00:00:00');
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const todayDate = new Date();
    const todayStr = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    let bestCount = 0;
    let moderateCount = 0;
    let decliningCount = 0;
    let noDataCount = 0;

    dates.forEach(dateStr => {
      if (dateStr > todayStr) {
        noDataCount++;
        return;
      }
      const summary = allSummaries.find(s => s.id === dateStr);
      let score = summary?.habitScores?.[habit.id];

      if (score === undefined || score === null || isNaN(Number(score))) {
        // Fallback: check if raw value exists and compute score
        const rawVal = summary?.habitValues?.[habit.id] ?? summary?.habits?.[habit.id]?.value ?? summary?.habits?.[habit.id];
        if (rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal))) {
          const num = Number(rawVal);
          const t100 = Number(habit.targetValue || habit.target100 || 1);
          const t0 = Number(habit.target0 || (habit.direction === 'lower_is_better' ? t100 * 2 : 0));
          if (habit.direction === 'lower_is_better') {
            score = num <= t100 ? 100 : num >= t0 ? 0 : Math.round(100 * (t0 - num) / Math.max(t0 - t100, 0.001));
          } else {
            score = num >= t100 ? 100 : num <= t0 ? 0 : Math.round(100 * (num - t0) / Math.max(t100 - t0, 0.001));
          }
        }
      } else {
        score = Number(score);
      }

      if (score === undefined || score === null || isNaN(score)) {
        noDataCount++;
      } else if (score >= 90) {
        bestCount++;
      } else if (score >= 60) {
        moderateCount++;
      } else {
        decliningCount++;
      }
    });

    const total = dates.length || 1;
    let overallScore = data?.summary?.overallScore;
    if (overallScore === undefined || overallScore === null || isNaN(Number(overallScore))) {
      const scoredDays = bestCount + moderateCount + decliningCount;
      overallScore = scoredDays > 0 ? Math.round(((bestCount * 100) + (moderateCount * 75) + (decliningCount * 30)) / scoredDays) : 0;
    } else {
      overallScore = Math.round(Number(overallScore));
    }

    return {
      total,
      overallScore: isNaN(overallScore) ? 0 : overallScore,
      bestCount,
      moderateCount,
      decliningCount,
      noDataCount
    };
  }, [habit, allSummaries, dateRange, data]);

  const donutOption = useMemo(() => {
    if (!stats) return null;

    const segments = [
      { 
        value: stats.bestCount, 
        name: 'Best / On Target', 
        desc: '100 points', 
        itemStyle: { color: '#10b981' } 
      },
      { 
        value: stats.moderateCount, 
        name: 'Moderate', 
        desc: '60–89% score', 
        itemStyle: { color: '#f59e0b' } 
      },
      { 
        value: stats.decliningCount, 
        name: 'Declining / Below Target', 
        desc: 'Score decreased', 
        itemStyle: { color: '#ef4444' } 
      },
      { 
        value: stats.noDataCount, 
        name: 'Missed / No Data', 
        desc: 'Unrecorded days', 
        itemStyle: { color: '#cbd5e1' } 
      }
    ].filter(s => s.value > 0);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        shadowColor: 'transparent',
        confine: true,
        formatter: function (params) {
          const color = params.color || '#10b981';
          const percent = Math.round(params.percent || 0);
          return `
            <div style="background: var(--surface-container-lowest, #ffffff); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 10px 14px; font-family: 'Inter', sans-serif; min-width: 140px; border: 1px solid var(--outline-variant, #e2e8f0);">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
                <span style="font-size: 12px; font-weight: 700; color: var(--on-surface, #1e293b);">${params.name}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 13px;">
                <span style="color: var(--on-surface-variant, #64748b); font-weight: 500;">${params.value} Days</span>
                <strong style="color: var(--on-surface, #0f172a); font-weight: 800;">${percent}%</strong>
              </div>
            </div>
          `;
        }
      },
      series: [
        {
          name: 'Performance Zone',
          type: 'pie',
          radius: ['64%', '88%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 5
          },
          data: segments
        }
      ]
    };
  }, [stats]);

  if (!stats) return null;

  return (
    <div className="flex flex-row items-center justify-between sm:justify-center gap-3 sm:gap-6 flex-1 w-full py-1">
      {/* Interactive Donut with center text */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 flex-shrink-0 flex items-center justify-center">
        <ReactEChartsCore 
          echarts={echarts} 
          option={donutOption} 
          style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }} 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-600 leading-none tracking-tight">
            {stats.overallScore}%
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Score
          </span>
        </div>
      </div>

      {/* Right Side Stats & Zones Legend */}
      <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0 max-w-[210px]">
        {stats.bestCount > 0 && (
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[9px] sm:text-[10px] border border-emerald-100/80 truncate">
                BEST (100 pts)
              </span>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">{stats.bestCount}d</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">{Math.round((stats.bestCount / stats.total) * 100)}% of period</div>
          </div>
        )}

        {stats.moderateCount > 0 && (
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md text-[9px] sm:text-[10px] border border-amber-100/80 truncate">
                MODERATE
              </span>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">{stats.moderateCount}d</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">{Math.round((stats.moderateCount / stats.total) * 100)}% of period</div>
          </div>
        )}

        {stats.decliningCount > 0 && (
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 font-bold rounded-md text-[9px] sm:text-[10px] border border-red-100/80 truncate">
                DECLINING
              </span>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">{stats.decliningCount}d</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">{Math.round((stats.decliningCount / stats.total) * 100)}% of period</div>
          </div>
        )}

        {stats.noDataCount > 0 && (
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[9px] sm:text-[10px] border border-slate-200/80 truncate">
                NO DATA
              </span>
              <span className="font-bold text-slate-600 text-xs sm:text-sm">{stats.noDataCount}d</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">{Math.round((stats.noDataCount / stats.total) * 100)}% of period</div>
          </div>
        )}
      </div>
    </div>
  );
}

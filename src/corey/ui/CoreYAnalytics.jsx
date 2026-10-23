import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

import CoreXIcon from '../../corex/ui/CoreXIcon';
import Icon from '../../components/Icon';
import { runDeepDiveAnalytics } from '../../corex/analyzer/engine';
import { 
  Sparkle, 
  CheckCircle, 
  Calendar, 
  CaretDown, 
  CaretUp, 
  CaretRight, 
  Clock, 
  PencilSimple, 
  ArrowUp, 
  ArrowDown, 
  Funnel, 
  Check, 
  TrendUp, 
  TrendDown, 
  Info, 
  SlidersHorizontal, 
  Flame, 
  ShieldCheck, 
  Hourglass,
  TreeStructure,
  Eye
} from '@phosphor-icons/react';

// ── SAMPLE DEMO DATA (FOR PREVIEW MODE WHEN < 7 DAYS OF CHECK-INS) ──
const SAMPLE_DEMO_FACTORS = [
  { 
    id: 'sample_coffee', 
    name: 'Coffee', 
    icon: 'Coffee', 
    color: '#ea580c',
    properties: [
      { id: 'prop_qty', label: 'Quantity', type: 'number', unit: 'cups' },
      { id: 'prop_time', label: 'Last Cup Time', type: 'time' }
    ]
  },
  { 
    id: 'sample_exercise', 
    name: 'Exercise', 
    icon: 'Barbell', 
    color: '#16a34a',
    properties: [
      { 
        id: 'prop_duration', 
        label: 'Duration', 
        type: 'number', 
        unit: 'min',
        subProperties: [
          { id: 'sub_intensity', label: 'Intensity (Zone 2/3)', type: 'choice', unit: 'zone' },
          { id: 'sub_calories', label: 'Calories Burned', type: 'number', unit: 'kcal' }
        ]
      }
    ]
  },
  { 
    id: 'sample_screen', 
    name: 'Late Screen Time', 
    icon: 'DeviceMobile', 
    color: '#8b5cf6',
    properties: [
      { id: 'prop_mins', label: 'Minutes in Bed', type: 'number', unit: 'min' }
    ]
  }
];

function generateSampleDemoLogs(daysCount = 30) {
  const result = [];
  const now = new Date();
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const hadCoffee = (i % 3 !== 0);
    const coffeeQty = hadCoffee ? (i % 2 === 0 ? 2 : 1) : 0;
    const coffeeTime = hadCoffee ? (i % 2 === 0 ? '16:00' : '11:00') : '';

    const hadExercise = (i % 2 === 0);
    const exerciseDuration = hadExercise ? (i % 4 === 0 ? 45 : 30) : 0;
    const exerciseIntensity = hadExercise ? (i % 4 === 0 ? 'Zone 3' : 'Zone 2') : '';
    const exerciseCalories = hadExercise ? (i % 4 === 0 ? 320 : 210) : 0;

    const hadScreen = (i % 2 !== 0);
    const screenMins = hadScreen ? (i % 3 === 0 ? 60 : 30) : 0;

    // Realistic outcome score calculation
    let baseScore = 7.8;
    if (hadCoffee && coffeeTime === '16:00') baseScore -= 1.8;
    if (hadExercise) baseScore += 1.2;
    if (hadScreen && screenMins >= 45) baseScore -= 1.5;
    const score = Math.max(2, Math.min(10, Number((baseScore + ((i % 5) * 0.2 - 0.4)).toFixed(1))));

    result.push({
      date: dateStr,
      outcome: score,
      factors: {
        sample_coffee: {
          had: hadCoffee,
          prop_qty: coffeeQty,
          prop_time: coffeeTime
        },
        sample_exercise: {
          had: hadExercise,
          prop_duration: exerciseDuration,
          sub_intensity: exerciseIntensity,
          sub_calories: exerciseCalories
        },
        sample_screen: {
          had: hadScreen,
          prop_mins: screenMins
        }
      },
      notes: hadCoffee && coffeeTime === '16:00' ? 'Late espresso' : (hadExercise ? 'Morning workout' : '')
    });
  }
  return result;
}

export default function CoreYAnalytics({ config, logs = [], onEditFactor, onAddFactor, onExitFullscreen }) {
  const [selectedRange, setSelectedRange] = useState('7D'); // '7D' | '30D'
  const [isTableExpanded, setIsTableExpanded] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const chartContainerRef = useRef(null);
  const echartsInstanceRef = useRef(null);
  const lastVibratedIndexRef = useRef(null);

  // ── 1. CHECK 7-DAY UNLOCK STATUS ──
  const distinctLoggedDates = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];
    const set = new Set(logs.map(l => l.date).filter(Boolean));
    return Array.from(set);
  }, [logs]);

  const loggedDaysCount = distinctLoggedDates.length;
  const isUnlocked = loggedDaysCount >= 7;

  // ── 2. PREPARE EFFECTIVE DATA (DEMO vs REAL) ──
  const sampleDemoLogs = useMemo(() => {
    if (isUnlocked) return [];
    return generateSampleDemoLogs(30);
  }, [isUnlocked]);

  const effectiveConfig = useMemo(() => {
    if (isUnlocked) {
      return config || { outcome: { label: 'Sleep Quality', key: 'outcome' }, factors: [] };
    }
    // If not unlocked, check if user has custom factors or fallback to sample demo factors
    if (config?.factors && config.factors.length > 0) {
      return config;
    }
    return {
      outcome: { label: config?.outcome?.label || 'Sleep Quality', key: 'outcome' },
      factors: SAMPLE_DEMO_FACTORS
    };
  }, [config, isUnlocked]);

  const effectiveLogs = useMemo(() => {
    if (isUnlocked) return logs || [];
    return sampleDemoLogs;
  }, [isUnlocked, logs, sampleDemoLogs]);

  // Close chart tooltip on outside tap / click
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

  // Active factors list
  const factors = useMemo(() => {
    if (effectiveConfig?.factors && effectiveConfig.factors.length > 0) {
      return effectiveConfig.factors.filter(f => f.active !== false);
    }
    return [];
  }, [effectiveConfig]);

  // Selected Target: can be a Factor, a Property, or a SubProperty (Mini-property)
  const [selectedTarget, setSelectedTarget] = useState(() => {
    const f0 = factors[0] || (SAMPLE_DEMO_FACTORS[0]);
    return {
      type: 'factor', // 'factor' | 'property' | 'subproperty'
      factorId: f0?.id || 'sample_coffee',
      propId: null,
      subId: null,
      label: f0?.name || 'Coffee',
      factorName: f0?.name || 'Coffee',
      icon: f0?.icon || 'Coffee',
      color: f0?.color || '#ea580c',
      unit: ''
    };
  });

  // Keep target synchronized if factors change
  useEffect(() => {
    if (factors.length > 0 && !factors.some(f => f.id === selectedTarget.factorId)) {
      const f0 = factors[0];
      setSelectedTarget({
        type: 'factor',
        factorId: f0.id,
        propId: null,
        subId: null,
        label: f0.name,
        factorName: f0.name,
        icon: f0.icon || 'Coffee',
        color: f0.color || '#ea580c',
        unit: ''
      });
    }
  }, [factors, selectedTarget.factorId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFactor = useMemo(() => {
    return factors.find(f => f.id === selectedTarget.factorId) || factors[0] || null;
  }, [factors, selectedTarget.factorId]);

  // 🌟 RUN THE STATISTICAL DEEP DIVE ANALYTICS ENGINE
  const analyticsEngineResult = useMemo(() => {
    return runDeepDiveAnalytics(effectiveConfig, effectiveLogs);
  }, [effectiveConfig, effectiveLogs]);

  // Generate structured daily data for the selected range (7D or 30D)
  const daysData = useMemo(() => {
    const daysCount = selectedRange === '30D' ? 30 : 7;
    const outcomeKey = effectiveConfig?.outcome?.key || 'outcome';
    const logsToUse = effectiveLogs;

    if (!activeFactor || !factors.length) return [];

    if (logsToUse && logsToUse.length > 0) {
      const sorted = [...logsToUse].sort((a, b) => b.date.localeCompare(a.date)).slice(0, daysCount);
      return sorted.map(l => {
        const dObj = new Date(l.date + 'T00:00:00');
        const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
        const shortDay = dObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dateNum = dObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        
        const factorData = l.factors?.[activeFactor.id] || l[activeFactor.id] || {};
        let had = false;
        let qtyNum = 0;
        let qtyStr = '-';
        let timeStr = '-';
        let targetMetricVal = 0;

        if (factorData) {
          if (factorData.had !== undefined) {
            had = Boolean(factorData.had);
          } else {
            had = Object.keys(factorData).length > 0;
          }

          if (selectedTarget.type === 'subproperty' && selectedTarget.subId) {
            const val = factorData[selectedTarget.subId];
            if (val !== undefined && val !== null) {
              targetMetricVal = Number(val) || (val === true ? 1 : 0);
              qtyStr = `${val} ${selectedTarget.unit || ''}`.trim();
            }
          } else if (selectedTarget.type === 'property' && selectedTarget.propId) {
            const val = factorData[selectedTarget.propId];
            if (val !== undefined && val !== null) {
              targetMetricVal = Number(val) || (val === true ? 1 : 0);
              qtyStr = `${val} ${selectedTarget.unit || ''}`.trim();
            }
          } else {
            const numProp = activeFactor.properties?.find(p => p.type === 'number');
            if (numProp && factorData[numProp.id] !== undefined) {
              qtyNum = Number(factorData[numProp.id]) || 0;
              qtyStr = `${qtyNum} ${numProp.unit || ''}`.trim();
              targetMetricVal = qtyNum;
            } else if (factorData.qty !== undefined) {
              qtyNum = Number(factorData.qty) || 0;
              qtyStr = `${qtyNum}`;
              targetMetricVal = qtyNum;
            } else {
              targetMetricVal = had ? 1 : 0;
            }
          }

          const numProp = activeFactor.properties?.find(p => p.type === 'number');
          if (numProp && factorData[numProp.id] !== undefined) {
            qtyNum = Number(factorData[numProp.id]) || 0;
            if (qtyStr === '-') qtyStr = `${qtyNum} ${numProp.unit || ''}`.trim();
          }

          const timeProp = activeFactor.properties?.find(p => p.type === 'time');
          if (timeProp && factorData[timeProp.id]) {
            timeStr = factorData[timeProp.id];
          } else if (factorData.time) {
            timeStr = factorData.time;
          }
        }

        const rawScore = l.outcome !== undefined && l.outcome !== null ? l.outcome : l[outcomeKey];
        const score = Number(rawScore) || 0;

        return {
          date: l.date,
          day: dayName,
          shortDay,
          dateNum,
          had,
          qty: had ? (qtyStr !== '-' ? qtyStr : 'Logged') : '-',
          qtyNum: had ? qtyNum : 0,
          targetMetricVal: had ? targetMetricVal : 0,
          time: had ? timeStr : '-',
          score,
          note: l.notes || '-'
        };
      });
    }

    return [];
  }, [effectiveLogs, activeFactor, selectedTarget, selectedRange, effectiveConfig, factors]);

  // Logged History Table Data: Maximum 7 days
  const tableData = useMemo(() => {
    return daysData.slice(0, 7);
  }, [daysData]);

  // Current Target KPI Calculations
  const kpis = useMemo(() => {
    if (!daysData.length || !activeFactor) {
      return {
        daysHad: 0,
        totalDays: 0,
        fraction: '0/0',
        impactPercent: 0,
        avgQty: '-',
        unit: 'per day',
        commonTime: '-',
        correlationLabel: 'Neutral Impact'
      };
    }
    
    const daysHad = daysData.filter(d => d.had).length;
    const totalDays = daysData.length;

    const scoresWith = daysData.filter(d => d.had).map(d => d.score);
    const scoresWithout = daysData.filter(d => !d.had).map(d => d.score);

    const avgWith = scoresWith.length ? (scoresWith.reduce((a, b) => a + b, 0) / scoresWith.length) : 0;
    const avgWithout = scoresWithout.length ? (scoresWithout.reduce((a, b) => a + b, 0) / scoresWithout.length) : 0;

    const impactPercent = avgWithout > 0 ? Math.round(((avgWith - avgWithout) / avgWithout) * 100) : 0;

    const qtys = daysData.filter(d => d.had && d.qtyNum > 0).map(d => d.qtyNum);
    const avgQty = qtys.length ? (qtys.reduce((a, b) => a + b, 0) / qtys.length).toFixed(1) : '-';
    
    const numProp = activeFactor?.properties?.find(p => p.type === 'number');
    const unit = selectedTarget.unit || (numProp?.unit ? `${numProp.unit}/day` : 'times/day');

    const times = daysData.filter(d => d.had && d.time !== '-').map(d => d.time);
    const commonTime = times.length ? times.sort((a,b) => times.filter(v => v===a).length - times.filter(v => v===b).length).pop() : '-';

    let correlationLabel = 'Neutral Correlation';
    if (impactPercent > 10) correlationLabel = 'Positive Driver';
    else if (impactPercent < -10) correlationLabel = 'Negative Trigger';

    return {
      daysHad,
      totalDays,
      fraction: `${daysHad}/${totalDays}`,
      impactPercent,
      avgQty,
      unit,
      commonTime,
      correlationLabel
    };
  }, [daysData, activeFactor, selectedTarget]);

  // Chart Chronological Points (Oldest -> Newest)
  const chartDays = useMemo(() => {
    return [...daysData].reverse();
  }, [daysData]);

  const maxFactorValue = useMemo(() => {
    const vals = chartDays.map(d => d.targetMetricVal);
    const max = Math.max(...vals, 1);
    return max > 0 ? max : 10;
  }, [chartDays]);

  const chartOption = useMemo(() => {
    if (!chartDays.length) return null;

    const outcomeLabel = effectiveConfig?.outcome?.label || 'Sleep Quality';
    const factorColor = selectedTarget.color || '#ea580c';
    const dates = chartDays.map(d => {
      const dt = new Date(d.date + 'T00:00:00');
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const isTargetBoolean = !selectedTarget.unit;

    // Series 1: Outcome score (0 to 10 scale)
    const outcomeSeriesData = chartDays.map(d => ({
      value: d.score !== undefined && d.score !== null ? Number(d.score) : 0,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: '#10b981',
        borderColor: 'transparent',
        borderWidth: 0
      }
    }));

    // Series 2: Factor / Property Metric
    const factorSeriesData = chartDays.map(d => {
      let val = 0;
      if (d.had) {
        val = isTargetBoolean ? (d.score ? Number(d.score) : 5) : d.targetMetricVal;
      }
      return {
        value: val,
        symbol: 'circle',
        symbolSize: d.had ? 6 : 4,
        itemStyle: {
          color: d.had ? factorColor : '#94a3b8',
          borderColor: 'transparent',
          borderWidth: 0
        },
        had: d.had,
        qty: d.qty,
        time: d.time
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
        extraCssText: 'z-index: 40 !important; pointer-events: none;',
        formatter: function (params) {
          if (!params || !params.length) return '';
          const dataIndex = params[0].dataIndex;

          if (lastVibratedIndexRef.current !== dataIndex) {
            lastVibratedIndexRef.current = dataIndex;
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try { navigator.vibrate(15); } catch(e) {}
            }
          }

          const d = chartDays[dataIndex];
          if (!d) return '';

          const dateObj = new Date(d.date + 'T00:00:00');
          const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const outcomeScore = Number(d.score || 0).toFixed(1);

          let html = `<div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.14); border: 1px solid #e2e8f0; padding: 10px 14px; font-family: system-ui, -apple-system, sans-serif; min-width: 170px;">`;
          html += `<div style="font-size: 11px; color: #64748b; margin-bottom: 7px; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">${dateStr}</div>`;

          // Outcome row
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 5px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                <span style="font-size: 12px; font-weight: 600; color: #1e293b;">${outcomeLabel}</span>
              </div>
              <strong style="font-size: 13px; font-weight: 800; color: #0f172a;">${outcomeScore} <span style="font-size: 10px; font-weight: 600; color: #64748b;">/10</span></strong>
            </div>
          `;

          // Factor row
          const factorValStr = d.had ? (d.qty !== '-' ? d.qty : (d.time !== '-' ? d.time : 'Logged')) : 'Not Logged';
          html += `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 14px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: ${factorColor}; display: inline-block;"></span>
                <span style="font-size: 12px; font-weight: 600; color: #1e293b;">${selectedTarget.label}</span>
              </div>
              <strong style="font-size: 13px; font-weight: 800; color: ${d.had ? '#0f172a' : '#94a3b8'};">${factorValStr}</strong>
            </div>
          `;

          if (d.time && d.time !== '-') {
            html += `
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #f1f5f9; font-size: 10.5px; color: #64748b; display: flex; justify-content: space-between;">
                <span>Logged Time:</span>
                <span style="font-weight: 600; color: #334155;">${d.time}</span>
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
      grid: { left: '10px', right: isTargetBoolean ? '15px' : '28px', bottom: '10px', top: '15px', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: { color: '#64748b', fontSize: 10, fontWeight: 500 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          min: 0,
          max: 10,
          interval: 2,
          axisLabel: { color: '#64748b', fontSize: 10, fontWeight: 600 },
          splitLine: { lineStyle: { type: 'dashed', color: 'rgba(150, 150, 150, 0.15)' } }
        },
        {
          type: 'value',
          min: 0,
          max: isTargetBoolean ? 10 : (maxFactorValue > 0 ? (maxFactorValue <= 1 ? 1 : Math.ceil(maxFactorValue * 1.25)) : 10),
          show: !isTargetBoolean,
          axisLabel: { 
            color: factorColor, 
            fontSize: 10, 
            fontWeight: 600,
            formatter: (v) => selectedTarget.unit ? `${v}${selectedTarget.unit}` : `${v}`
          },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: outcomeLabel,
          type: 'line',
          yAxisIndex: 0,
          data: outcomeSeriesData,
          connectNulls: true,
          itemStyle: { color: '#10b981' },
          lineStyle: { width: 3, color: '#10b981' },
          z: 3,
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.01)' }
              ]
            }
          },
          showSymbol: true,
          smooth: true
        },
        {
          name: selectedTarget.label,
          type: 'line',
          yAxisIndex: isTargetBoolean ? 0 : 1,
          data: factorSeriesData,
          connectNulls: true,
          itemStyle: { color: factorColor },
          lineStyle: { width: 2.5, color: factorColor },
          z: 2,
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: factorColor + '25' },
                { offset: 1, color: factorColor + '00' }
              ]
            }
          },
          showSymbol: true,
          smooth: true
        }
      ]
    };
  }, [chartDays, effectiveConfig, selectedTarget, maxFactorValue]);

  const { factorRanking, propertyAnalysis, goodBadBreakdown, recommendations } = analyticsEngineResult;

  // ── 3. EMPTY STATE IF UNLOCKED BUT NO FACTORS IN TREE ──
  if (isUnlocked && factors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs space-y-3.5 my-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold">
          <TreeStructure size={26} weight="bold" />
        </div>
        <div>
          <h3 className="text-base font-black text-on-surface">
            No Factors Configured in Tree
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 leading-relaxed">
            Open the Core X Builder to add influencing factors (like Coffee, Exercise, Hydration) to start tracking deep correlation analytics.
          </p>
        </div>
        {onAddFactor && (
          <button
            type="button"
            onClick={onAddFactor}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-black shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <TreeStructure size={15} weight="bold" />
            <span>Open Builder & Canvas</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
      
      {/* ── 7-DAY UNLOCK PROGRESS & SAMPLE DEMO BANNER ── */}
      {!isUnlocked && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <Hourglass size={20} weight="bold" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    7 Days of Daily Check-Ins Required
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Sample Demo Mode
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  You have completed <strong className="text-slate-900 dark:text-white font-black">{loggedDaysCount} / 7 days</strong>. Currently displaying sample demo analytics below so you can explore how dual trend graphs and root cause rankings work.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-amber-500/20 shadow-2xs">
                {Math.max(1, 7 - loggedDaysCount)} Days Left
              </span>
            </div>
          </div>

          {/* Unlock Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(8, (loggedDaysCount / 7) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* ── 1. TOP HEADER: HIERARCHICAL FACTOR/PROPERTY SELECTOR & 7D/30D TOGGLE ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full relative">
        
        {/* Left: Hierarchical Dropdown Selector */}
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 hover:border-on-surface/40 transition-all shadow-2xs cursor-pointer w-full sm:w-auto"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 text-xs"
                style={{ backgroundColor: selectedTarget.color || '#ea580c' }}
              >
                <CoreXIcon name={selectedTarget.icon || 'Coffee'} size={12} />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                <span>{selectedTarget.factorName}</span>
                {selectedTarget.type !== 'factor' && (
                  <>
                    <CaretRight size={10} weight="bold" className="text-on-surface-variant/60" />
                    <span className="text-primary font-black">{selectedTarget.label}</span>
                  </>
                )}
              </div>
            </div>
            <CaretDown size={13} weight="bold" className={`text-on-surface-variant transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Hierarchical Cascading Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-xl z-50 p-2 flex flex-col gap-1 max-h-96 overflow-y-auto">
              <div className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70 px-2 py-1 flex items-center justify-between">
                <span>Factors & Properties</span>
                <Funnel size={11} weight="bold" />
              </div>

              {factors.map((factor) => {
                const isFactorSelected = selectedTarget.factorId === factor.id && selectedTarget.type === 'factor';

                return (
                  <div key={factor.id} className="flex flex-col gap-0.5 border-b border-outline-variant/20 last:border-0 pb-1 mb-1">
                    {/* Main Factor Row */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTarget({
                          type: 'factor',
                          factorId: factor.id,
                          propId: null,
                          subId: null,
                          label: factor.name,
                          factorName: factor.name,
                          icon: factor.icon || 'Coffee',
                          color: factor.color || '#ea580c',
                          unit: ''
                        });
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                        isFactorSelected 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-md flex items-center justify-center text-white shrink-0 text-[10px]"
                          style={{ backgroundColor: factor.color || '#ea580c' }}
                        >
                          <CoreXIcon name={factor.icon || 'Coffee'} size={10} />
                        </div>
                        <span>{factor.name}</span>
                      </div>
                      {isFactorSelected && <Check size={12} weight="bold" />}
                    </button>

                    {/* Properties & Sub-Properties (Mini-properties) */}
                    {factor.properties && factor.properties.length > 0 && (
                      <div className="flex flex-col pl-6 pr-1 gap-0.5 mt-0.5">
                        {factor.properties.map((prop) => {
                          const isPropSelected = selectedTarget.factorId === factor.id && selectedTarget.propId === prop.id && selectedTarget.type === 'property';
                          const hasSubProps = prop.subProperties && prop.subProperties.length > 0;

                          return (
                            <div key={prop.id} className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTarget({
                                    type: 'property',
                                    factorId: factor.id,
                                    propId: prop.id,
                                    subId: null,
                                    label: prop.label,
                                    factorName: factor.name,
                                    icon: factor.icon || 'Coffee',
                                    color: factor.color || '#ea580c',
                                    unit: prop.unit || ''
                                  });
                                  setIsDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                  isPropSelected 
                                    ? 'bg-primary/15 text-primary font-bold' 
                                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/60 inline-block shrink-0" />
                                  <span className="truncate">{prop.label}</span>
                                  {prop.unit && <span className="text-[9px] text-on-surface-variant/50">({prop.unit})</span>}
                                </div>
                                {hasSubProps ? (
                                  <CaretRight size={10} weight="bold" className="text-on-surface-variant/50 shrink-0" />
                                ) : isPropSelected ? (
                                  <Check size={11} weight="bold" className="shrink-0" />
                                ) : null}
                              </button>

                              {/* Mini Properties / Sub-properties Cascade */}
                              {hasSubProps && (
                                <div className="flex flex-col pl-4 gap-0.5 my-0.5">
                                  {prop.subProperties.map((sub) => {
                                    const isSubSelected = selectedTarget.factorId === factor.id && selectedTarget.propId === prop.id && selectedTarget.subId === sub.id;

                                    return (
                                      <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedTarget({
                                            type: 'subproperty',
                                            factorId: factor.id,
                                            propId: prop.id,
                                            subId: sub.id,
                                            label: sub.label,
                                            factorName: factor.name,
                                            icon: factor.icon || 'Coffee',
                                            color: factor.color || '#ea580c',
                                            unit: sub.unit || ''
                                          });
                                          setIsDropdownOpen(false);
                                        }}
                                        className={`flex items-center justify-between px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all cursor-pointer ${
                                          isSubSelected 
                                            ? 'bg-primary/20 text-primary font-black' 
                                            : 'text-on-surface-variant/80 hover:bg-surface-container hover:text-on-surface'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="text-[9px] text-primary/60">↳</span>
                                          <span className="truncate">{sub.label}</span>
                                        </div>
                                        {isSubSelected && <Check size={10} weight="bold" className="shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {onAddFactor && (
                <button
                  type="button"
                  onClick={() => { setIsDropdownOpen(false); onAddFactor(); }}
                  className="flex items-center justify-center gap-1.5 py-1.5 mt-1 rounded-xl text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer border border-dashed border-primary/30"
                >
                  <span>+ Add New Factor</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: 7D / 30D Range Toggle + Back / Edit Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="flex bg-surface-container-lowest rounded-xl p-[3px] border border-outline-variant/40 h-[34px]">
            <button 
              onClick={() => { if (navigator.vibrate) navigator.vibrate(25); setSelectedRange('7D'); }}
              className={`px-3 flex items-center justify-center rounded-lg transition-all text-xs font-bold cursor-pointer ${selectedRange === '7D' ? 'bg-on-surface text-surface-container-lowest shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              7 Days
            </button>
            <button 
              onClick={() => { if (navigator.vibrate) navigator.vibrate(25); setSelectedRange('30D'); }}
              className={`px-3 flex items-center justify-center rounded-lg transition-all text-xs font-bold cursor-pointer ${selectedRange === '30D' ? 'bg-on-surface text-surface-container-lowest shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              30 Days
            </button>
          </div>

          {onEditFactor && (
            <button
              type="button"
              onClick={onEditFactor}
              className="flex items-center gap-1.5 px-3 h-[34px] rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-xs font-bold hover:border-outline-variant transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <PencilSimple size={13} weight="bold" />
              <span className="hidden sm:inline">Edit Factor</span>
            </button>
          )}
        </div>

      </div>

      {/* ── 2. COMPACT HERO CORRELATION METRIC (SLEEK & CONCISE) ── */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: selectedTarget.color || '#ea580c' }}
          >
            <CoreXIcon name={selectedTarget.icon || 'Coffee'} size={20} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-on-surface">
                {selectedTarget.label} Impact
              </span>
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold leading-none gap-0.5"
                style={{
                  color: kpis.impactPercent >= 0 ? '#18a56c' : '#ef4444',
                  backgroundColor: kpis.impactPercent >= 0 ? 'rgba(24, 165, 108, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                }}
              >
                {kpis.impactPercent >= 0 ? `+${kpis.impactPercent}%` : `${kpis.impactPercent}%`}
              </span>
              {!isUnlocked && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  DEMO
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant mt-0.5">
              {kpis.correlationLabel} vs {effectiveConfig?.outcome?.label || 'Sleep Quality'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-on-surface">
              {kpis.fraction} Days
            </span>
            <span className="text-[10px] text-on-surface-variant/70">
              Avg {kpis.avgQty} {kpis.unit}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. DUAL LINE CHART (OUTCOME CURVE + FACTOR/PROPERTY CURVE) ── */}
      <div className="flex flex-col p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs">
        {/* Chart Header & Dual Legends */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-on-surface">
              Dual Trend Analysis
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium">
              ({selectedRange === '7D' ? '7 Days' : '30 Days'})
            </span>
            {!isUnlocked && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                SAMPLE PREVIEW
              </span>
            )}
          </div>

          {/* Dual Line Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" />
              <span>{effectiveConfig?.outcome?.label || 'Sleep Quality'} (0-10)</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: selectedTarget.color || '#ea580c' }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block shadow-2xs" style={{ backgroundColor: selectedTarget.color || '#ea580c' }} />
              <span>{selectedTarget.label} {selectedTarget.unit ? `(${selectedTarget.unit})` : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 inline-block" />
              <span>Not Logged</span>
            </div>
          </div>
        </div>

        {/* ECharts Interactive Visualizer */}
        <div ref={chartContainerRef} className="w-full h-56 min-h-[220px] relative">
          {chartOption && (
            <ReactEChartsCore 
              echarts={echarts} 
              onChartReady={(instance) => { echartsInstanceRef.current = instance; }}
              option={chartOption} 
              style={{ height: '100%', width: '100%', minHeight: '220px' }} 
            />
          )}
        </div>
      </div>

      {/* ── 4. 🌟 FACTOR IMPACT RANKING (CORE ALGORITHM 1: RANKED BY IMPACT DELTA) ── */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-on-surface">
              Factor Impact Ranking
            </h2>
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              Ranked by Delta
            </span>
          </div>
          <span className="text-[11px] font-medium text-on-surface-variant/70">
            Present vs Absent Days
          </span>
        </div>
        
        <div className="flex flex-col">
          {factorRanking.ranked.length === 0 ? (
            <div className="p-4 text-xs font-medium text-on-surface-variant text-center">
              Logging active and skipped days will automatically compute your factor impact rankings.
            </div>
          ) : (
            factorRanking.ranked.map((item, idx) => {
              const isNegative = item.impact < 0;
              return (
                <div 
                  key={item.factorId || idx}
                  className="flex flex-col p-3.5 border-b border-dashed border-outline-variant/20 dark:border-slate-800/40 hover:bg-surface-container/40 transition-colors last:border-0"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 text-xs font-black"
                        style={{ backgroundColor: item.color || '#ea580c' }}
                      >
                        <CoreXIcon name={item.icon || 'Coffee'} size={14} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-on-surface">
                          {idx + 1}. {item.factorName}
                        </span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                          {item.confidenceTag}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {item.impact > 0 ? `+${item.impact}` : item.impact} pts
                      </span>
                      <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-full ${isNegative ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {item.impactPct > 0 ? `+${item.impactPct}%` : `${item.impactPct}%`}
                      </span>
                    </div>
                  </div>

                  {/* Plain Language Sentence */}
                  <p className="text-[11.5px] text-on-surface-variant font-medium leading-relaxed pl-9">
                    {item.sentence}
                  </p>

                  {/* Comparison Sub-bar: Avg With vs Avg Without */}
                  <div className="flex items-center gap-4 pl-9 mt-2 text-[10.5px] text-on-surface-variant/70">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 inline-block" />
                      Avg with: <strong className="text-on-surface font-bold">{item.avgPresent}</strong> ({item.sampleSizePresent}d)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant inline-block" />
                      Avg without: <strong className="text-on-surface font-bold">{item.avgAbsent}</strong> ({item.sampleSizeAbsent}d)
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Data Sufficiency Gate (Collecting Data Items) */}
          {factorRanking.insufficient.length > 0 && (
            <div className="p-3 bg-surface-container/20 border-t border-outline-variant/20 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-on-surface-variant">
                <Hourglass size={12} weight="bold" />
                <span>Collecting Data to Verify:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {factorRanking.insufficient.map(item => (
                  <span key={item.factorId} className="text-[10px] font-medium bg-surface-container-lowest border border-outline-variant/30 px-2 py-1 rounded-lg text-on-surface-variant">
                    <strong>{item.factorName}</strong>: {item.message}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. 🌟 PROPERTY THRESHOLD & TIMING DEEP DIVE (CORE ALGORITHM 2) ── */}
      {propertyAnalysis.length > 0 && (
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-on-surface">
                Threshold & Timing Boundaries
              </h2>
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                Auto Median Split
              </span>
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant/70">
              Where correlations shift
            </span>
          </div>

          <div className="flex flex-col divide-y divide-dashed divide-outline-variant/20 dark:divide-slate-800/40">
            {propertyAnalysis.map((prop, pIdx) => (
              <div key={pIdx} className="p-3.5 flex items-start justify-between gap-3 hover:bg-surface-container/40 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    {prop.type === 'time' ? <Clock size={14} weight="bold" /> : <SlidersHorizontal size={14} weight="bold" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">
                      {prop.factorName} • {prop.propertyLabel}
                    </span>
                    <p className="text-[11.5px] font-medium text-on-surface-variant mt-0.5">
                      {prop.sentence}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-black shrink-0 ${prop.propertyImpact < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {prop.propertyImpact > 0 ? `+${prop.propertyImpact}` : prop.propertyImpact} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. 🌟 GOOD DAYS VS BAD DAYS BREAKDOWN (CORE ALGORITHM 3) ── */}
      {goodBadBreakdown.available && (
        <div className="flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-on-surface">
                Good Days vs Bad Days Clusters
              </h2>
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant/70">
              Score ≥7 ({goodBadBreakdown.goodCount}d) vs ≤4 ({goodBadBreakdown.badCount}d)
            </span>
          </div>

          <div className="flex flex-col divide-y divide-dashed divide-outline-variant/20 dark:divide-slate-800/40">
            {goodBadBreakdown.breakdown.map((item, bIdx) => (
              <div key={bIdx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-container/40 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 text-xs"
                    style={{ backgroundColor: item.color || '#3b82f6' }}
                  >
                    <CoreXIcon name={item.icon || 'Star'} size={13} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">
                      {item.factorName} Frequency Shift
                    </span>
                    <span className="text-[11px] font-medium text-on-surface-variant mt-0.5">
                      {item.sentence}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  <span className="text-[10.5px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">
                    Worst: {item.presenceRateBad}%
                  </span>
                  <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Best: {item.presenceRateGood}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. 🌟 ACTIONABLE RECOMMENDATIONS & BEHAVIOR EXPERIMENTS ── */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-on-surface">
              Actionable Experiments & Next Steps
            </h2>
          </div>
          <span className="text-[11px] font-bold text-primary">
            Target Impact
          </span>
        </div>
        
        <div className="flex flex-col divide-y divide-dashed divide-outline-variant/20 dark:divide-slate-800/40">
          {recommendations.length === 0 ? (
            <div className="p-4 text-xs font-medium text-on-surface-variant text-center">
              Keep logging your daily factors to unlock customized 3-day challenge suggestions.
            </div>
          ) : (
            recommendations.map((rec, rIdx) => (
              <div key={rec.id || rIdx} className="p-3.5 flex items-start justify-between gap-3 hover:bg-surface-container/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle size={16} weight="fill" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-on-surface text-xs font-bold leading-tight">
                      {rec.title}
                    </span>
                    <span className="text-on-surface-variant text-[11.5px] font-medium mt-0.5">
                      {rec.action}
                    </span>
                    <span className="text-[10px] font-bold text-primary mt-1">
                      💡 {rec.prediction}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                  Experiment
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 8. LOGGED HISTORY (MAX 7 DAYS, SOLID HEADER LINE, FADED DASHED ROW LINES) ── */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs overflow-hidden mb-6">
        <div 
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-surface-container/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-on-surface">
              Logged History
            </h2>
            <span className="text-[11px] font-bold text-on-surface-variant/70">
              (Last 7 Days)
            </span>
            {!isUnlocked && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                DEMO
              </span>
            )}
          </div>
          <button type="button" className="text-on-surface-variant p-0.5">
            {isTableExpanded ? <CaretUp size={15} weight="bold" /> : <CaretDown size={15} weight="bold" />}
          </button>
        </div>
        
        {isTableExpanded && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-outline-variant/60 dark:border-slate-700 text-[11px] font-bold text-on-surface-variant bg-surface-container/30">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Had {activeFactor?.name || 'Factor'}?</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">{effectiveConfig?.outcome?.label || 'Score'}</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-outline-variant/20 dark:divide-slate-800/40 font-medium">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-xs font-bold text-on-surface-variant">
                      No logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-on-surface whitespace-nowrap">
                        {row.day}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold inline-block ${
                          row.had 
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {row.had ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant whitespace-nowrap">
                        {row.qty}
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant whitespace-nowrap">
                        {row.time}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-black text-xs ${
                          row.score >= 7.5 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : row.score >= 6.0 
                              ? 'text-amber-600 dark:text-amber-400' 
                              : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {row.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-on-surface-variant/70 truncate max-w-[140px]">
                        {row.note}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

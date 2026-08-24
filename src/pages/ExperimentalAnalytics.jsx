import ReactEChartsCoreLib from 'echarts-for-react/lib/core';
const ReactEChartsCore = ReactEChartsCoreLib.default || ReactEChartsCoreLib;
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, MarkAreaComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, MarkAreaComponent, CanvasRenderer]);
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import ProModal from '../components/ProModal';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Flame,
  ShieldCheck,
  TrendUp,
  TrendDown,
  Sparkle,
  Calendar,
  ChartLineUp,
  WarningCircle,
  CaretRight,
  X,
  CheckCircle,
  CaretDown,
  CornersOut,
  Flask,
  ArrowLeft,
  Trophy,
  Shield,
  Star,
  Clock,
  Target,
  Lightbulb,
  Warning,
  Lightning,
  Crown,
  RocketLaunch,
  Lock
} from '@phosphor-icons/react';
import { calculateStreakData, calculateConsistencyRate, getNextMilestone, getCurrentMilestone } from '../lib/streakEngine';
import { calculateRecoveryScore } from '../lib/recoveryAnalytics';

// Color palette for multiple habits in overlay mode
const HABIT_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6'  // teal
];

// Helper to generate smooth cubic bezier path string
function generateSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

const getPerfBandClass = (score) => {
  if (score === null || score === undefined) return 'bg-surface-container-high dark:bg-[#202532]';
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

// Fallback synthetic dataset for preview when user has < 7 days
const SAMPLE_HABITS = [
  { id: 's_pushups', name: 'Pushups', icon: 'fitness_center', scoringType: 'numeric', targetValue: 50, unit: 'reps', color: '#10b981' },
  { id: 's_reading', name: 'Daily Reading', icon: 'menu_book', scoringType: 'binary', targetValue: 1, unit: 'done', color: '#3b82f6' },
  { id: 's_water', name: 'Water Intake', icon: 'water_drop', scoringType: 'optimal_range', targetValue: 8, unit: 'glasses', color: '#06b6d4' },
  { id: 's_screen', name: 'Mood Rating', icon: 'mood', scoringType: 'scale', targetValue: 10, unit: '/10', color: '#f59e0b' }
];

function getMilestoneTierIcon(title = '') {
  const t = String(title).toLowerCase();
  if (t.includes('grandmaster') || t.includes('titan')) {
    return <Crown size={20} weight="fill" className="text-amber-500" />;
  }
  if (t.includes('identity') || t.includes('unstoppable')) {
    return <Trophy size={20} weight="fill" className="text-purple-500" />;
  }
  if (t.includes('iron') || t.includes('neural')) {
    return <ShieldCheck size={20} weight="fill" className="text-blue-500" />;
  }
  if (t.includes('seed')) {
    return <Sparkle size={20} weight="fill" className="text-emerald-500" />;
  }
  if (t.includes('momentum')) {
    return <TrendUp size={20} weight="bold" className="text-orange-500" />;
  }
  if (t.includes('ignition')) {
    return <RocketLaunch size={20} weight="fill" className="text-amber-500" />;
  }
  return <RocketLaunch size={20} weight="fill" className="text-slate-400 dark:text-slate-500" />;
}

export default function ExperimentalAnalytics() {
  const navigate = useNavigate();
  const { habits: realHabits = [], allSummaries: realSummaries = [], userDoc } = useData();
  const { isHinglish, t } = useLanguage();

  // Selected scope & timeframe
  // Timeframe & Granularity State (Persisted in sessionStorage so navigation retains timeframe)
  const [rangeOption, setRangeOptionState] = useState(() => {
    try {
      return sessionStorage.getItem('definite_analytics_tf') || '7';
    } catch (e) {
      return '7';
    }
  });

  const setRangeOption = (val) => {
    setRangeOptionState(val);
    try {
      sessionStorage.setItem('definite_analytics_tf', val);
    } catch (e) {}
  };
  const [selectedHabitId, setSelectedHabitId] = useState('all'); // 'all' or habit.id
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [appliedCustomStart, setAppliedCustomStart] = useState('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('');
  const [isCustomDropdownOpen, setIsCustomDropdownOpen] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [showResilienceLockModal, setShowResilienceLockModal] = useState(false);
  const [showDiagnoseLockModal, setShowDiagnoseLockModal] = useState(false);
  const dateSelectorRef = useRef(null);
  const [showHabitSheet, setShowHabitSheet] = useState(false);
  const [showPercentages, setShowPercentages] = useState(false);
  const [heatmapFilter, setHeatmapFilter] = useState('all'); // 'all', 'elite_90', 'target_80', 'passing_50', 'struggle_below_50', 'critical_below_30', 'skipped'
  const [dayTypeFilter, setDayTypeFilter] = useState('all'); // 'all', 'weekdays', 'weekends'
  const [heatmapLayout, setHeatmapLayout] = useState('continuous'); // 'continuous' | 'month_blocks'
  const [chartTrendMode, setChartTrendMode] = useState('raw'); // 'raw', '7d_ma', 'both'
  const [chartMetricType, setChartMetricType] = useState('score'); // 'score' | 'unit'
  const [heatmapGranularity, setHeatmapGranularity] = useState('day'); // 'day', 'week', 'month'
  const [activeTooltip, setActiveTooltip] = useState(null); // { date, score, x, y }
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showHeatmapControlModal, setShowHeatmapControlModal] = useState(false);
  const [showChartControlModal, setShowChartControlModal] = useState(false);
  const [showFullscreenChart, setShowFullscreenChart] = useState(false);
  const [showOverallUnitHint, setShowOverallUnitHint] = useState(false);
  const [showWeightedInfoModal, setShowWeightedInfoModal] = useState(false);
  const [guideModalTab, setGuideModalTab] = useState('weighted'); // 'weighted' | 'kpis'
  const [openWeightedSection, setOpenWeightedSection] = useState('1'); // '1' | '2' | '3' | null // 'weighted' | 'kpis'
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const lastVibratedIndexRef = useRef(null);
  const echartsRef = useRef(null);


  // Check if preview mode - only show sample simulation when no habits are configured at all
  const isPreviewMode = realHabits.length === 0 && realSummaries.length === 0;

  // Resolved habits list
  const activeHabits = useMemo(() => {
    if (realHabits.length === 0) return SAMPLE_HABITS;
    return realHabits.map((h, i) => ({
      ...h,
      color: HABIT_COLORS[i % HABIT_COLORS.length]
    }));
  }, [realHabits]);

  // Current selected habit object
  const currentSelectedHabit = useMemo(() => {
    if (selectedHabitId === 'all') return null;
    return activeHabits.find(h => h.id === selectedHabitId) || null;
  }, [activeHabits, selectedHabitId]);

  // Helper map: determine the earliest date each habit was ever created / present
  const habitFirstDateMap = useMemo(() => {
    const map = {};
    activeHabits.forEach(h => {
      if (h.createdAt) {
        map[h.id] = h.createdAt.includes('T') ? h.createdAt.split('T')[0] : h.createdAt;
      }
    });

    realSummaries.forEach(s => {
      if (s.habitScores) {
        Object.keys(s.habitScores).forEach(hId => {
          if (s.habitScores[hId] !== undefined && s.habitScores[hId] !== null) {
            if (!map[hId] || s.id < map[hId]) {
              map[hId] = s.id;
            }
          }
        });
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    activeHabits.forEach(h => {
      if (!map[h.id]) {
        map[h.id] = todayStr;
      }
    });

    return map;
  }, [activeHabits, realSummaries]);

  // Generate resolved date series for the selected timeframe
  const dateSeries = useMemo(() => {
    const dates = [];
    if (rangeOption === 'custom' && appliedCustomStart && appliedCustomEnd) {
      const start = new Date(appliedCustomStart);
      const end = new Date(appliedCustomEnd);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const curr = new Date(start);
        while (curr <= end) {
          dates.push(curr.toISOString().split('T')[0]);
          curr.setDate(curr.getDate() + 1);
        }
        return dates;
      }
    }

    const daysCount = parseInt(rangeOption, 10) || 30;
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [rangeOption, appliedCustomStart, appliedCustomEnd]);

  const timeframeLabel = useMemo(() => {
    if (rangeOption === 'custom') return `${dateSeries.length}D Custom`;
    return `${rangeOption}D`;
  }, [rangeOption, dateSeries]);

  // Resolved summaries map for the date range
  const summaryMap = useMemo(() => {
    const map = new Map();

    if (realSummaries.length === 0 && realHabits.length === 0) {
      // Synthetic realistic simulation for 30 days
      const pushupScores = [60, 75, 80, 85, 90, 100, 95, 85, 90, 100, 95, 80, 90, 100, 85, 90, 95, 100, 90, 95, 80, 90, 100, 95, 90, 100, 95, 90, 100, 95];
      const readingScores = [100, 100, 0, 100, 100, 100, 100, 100, 0, 100, 100, 100, 100, 100, 100, 0, 100, 100, 100, 100, 100, 100, 0, 100, 100, 100, 100, 100, 100, 100];
      const waterScores = [70, 80, 85, 90, 95, 100, 90, 85, 90, 95, 100, 90, 85, 95, 100, 90, 95, 100, 95, 90, 100, 95, 90, 100, 95, 90, 100, 95, 90, 100];
      const screenScores = [70, 65, 55, 60, 50, 45, 60, 55, 45, 50, 40, 55, 50, 45, 60, 50, 45, 40, 55, 50, 45, 40, 35, 50, 45, 40, 35, 50, 45, 40];

      dateSeries.forEach((dStr, idx) => {
        const offset = (30 - dateSeries.length) + idx;
        const pScore = pushupScores[offset % 30];
        const rScore = readingScores[offset % 30];
        const wScore = waterScores[offset % 30];
        const sScore = screenScores[offset % 30];
        const avg = Math.round((pScore + rScore + wScore + sScore) / 4);

        map.set(dStr, {
          overallScore: avg,
          habitScores: {
            s_pushups: pScore,
            s_reading: rScore,
            s_water: wScore,
            s_screen: sScore
          }
        });
      });
    } else {
      realSummaries.forEach(s => {
        map.set(s.id, s);
      });
    }

    return map;
  }, [realSummaries, realHabits, dateSeries]);

  // Per-habit statistics (Score, dynamic timeframe sparkline, trend)
  const habitStats = useMemo(() => {
    return activeHabits.map(h => {
      const scores = dateSeries.map(dStr => {
        const summary = summaryMap.get(dStr);
        if (!summary || !summary.habitScores || summary.habitScores[h.id] === undefined) return 0;
        return summary.habitScores[h.id];
      });

      // Valid tracked scores
      const validScores = scores.filter(s => s > 0);
      const avgScore = validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : 0;

      // Dynamic sparkline matching the selected timeframe (7D, 14D, 30D)
      const sparklineTimeframe = scores;

      // Trend: compare second half vs first half of timeframe
      const mid = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, mid).filter(s => s > 0);
      const secondHalf = scores.slice(mid).filter(s => s > 0);
      const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : avgScore;
      const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : avgScore;
      const delta = Math.round(secondAvg - firstAvg);

      const isWarning = delta < -8 || avgScore < 50;

      return {
        ...h,
        avgScore,
        sparklineTimeframe,
        delta,
        isWarning
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [activeHabits, dateSeries, summaryMap]);

  // Overall Average Score & Delta in Selected Window
  const overallStat = useMemo(() => {
    const scores = dateSeries.map(dStr => {
      const summary = summaryMap.get(dStr);
      return summary?.overallScore || 0;
    });
    const validScores = scores.filter(s => s > 0);
    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;
    const mid = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, mid).filter(s => s > 0);
    const secondHalf = scores.slice(mid).filter(s => s > 0);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : avgScore;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : avgScore;
    const delta = Math.round(secondAvg - firstAvg);
    return { avgScore, delta };
  }, [dateSeries, summaryMap]);

  // Performance Trajectory Stats for Selected Habit / Overall
  const trajectoryStats = useMemo(() => {
    const scores = dateSeries.map(dStr => {
      const summary = summaryMap.get(dStr);
      if (selectedHabitId === 'all') {
        return summary?.overallScore || 0;
      }
      return summary?.habitScores?.[selectedHabitId] || 0;
    });
    const validScores = scores.filter(s => s > 0);
    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;
    const peakScore = validScores.length > 0
      ? Math.round(Math.max(...validScores))
      : 0;
    const mid = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, mid).filter(s => s > 0);
    const secondHalf = scores.slice(mid).filter(s => s > 0);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : avgScore;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : avgScore;
    const delta = Math.round(secondAvg - firstAvg);

    return { avgScore, peakScore, delta, totalDays: dateSeries.length, loggedDays: validScores.length };
  }, [dateSeries, summaryMap, selectedHabitId]);

  // Weekly Aggregation for Heatmap
  const weeklyHeatmapData = useMemo(() => {
    const groups = new Map();
    dateSeries.forEach(dStr => {
      const d = new Date(dStr + 'T00:00:00');
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Monday start
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      const key = monday.toISOString().split('T')[0];

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const dateRange = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      if (!groups.has(key)) {
        groups.set(key, { key, monday, dateRange, dates: [], scores: [] });
      }

      const sum = summaryMap.get(dStr);
      let score = 0;
      if (selectedHabitId === 'all') {
        score = sum?.overallScore ?? 0;
      } else {
        score = sum?.habitScores?.[selectedHabitId] ?? 0;
      }

      const g = groups.get(key);
      g.dates.push(dStr);
      if (score > 0) g.scores.push(score);
    });

    return Array.from(groups.values()).sort((a, b) => a.monday - b.monday).map((g, idx) => {
      const avg = g.scores.length > 0
        ? Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length)
        : 0;
      return {
        id: g.key,
        weekNum: idx + 1,
        dateRange: g.dateRange,
        average: avg,
        daysLogged: g.scores.length,
        totalDays: g.dates.length,
        dates: g.dates
      };
    });
  }, [dateSeries, summaryMap, selectedHabitId]);

  // Monthly Aggregation for Heatmap
  const monthlyHeatmapData = useMemo(() => {
    const groups = new Map();
    dateSeries.forEach(dStr => {
      const d = new Date(dStr + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!groups.has(key)) {
        groups.set(key, { key, dateObj: d, label, dates: [], scores: [] });
      }

      const sum = summaryMap.get(dStr);
      let score = 0;
      if (selectedHabitId === 'all') {
        score = sum?.overallScore ?? 0;
      } else {
        score = sum?.habitScores?.[selectedHabitId] ?? 0;
      }

      const g = groups.get(key);
      g.dates.push(dStr);
      if (score > 0) g.scores.push(score);
    });

    return Array.from(groups.values()).sort((a, b) => a.dateObj - b.dateObj).map(g => {
      const avg = g.scores.length > 0
        ? Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length)
        : 0;
      return {
        id: g.key,
        label: g.label,
        average: avg,
        daysLogged: g.scores.length,
        totalDays: g.dates.length,
        dates: g.dates
      };
    });
  }, [dateSeries, summaryMap, selectedHabitId]);

  // Month-wise grouping for Calendar Heatmap Layout
  const monthBlocksHeatmapData = useMemo(() => {
    const monthMap = new Map();
    dateSeries.forEach(dStr => {
      const d = new Date(dStr + 'T00:00:00');
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthFullLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          monthLabel,
          monthFullLabel,
          year,
          month,
          dates: []
        });
      }
      monthMap.get(monthKey).dates.push(dStr);
    });

    return Array.from(monthMap.values()).map(m => {
      const firstDateStr = m.dates[0];
      const firstDateObj = new Date(firstDateStr + 'T00:00:00');
      const firstDayOfWeek = firstDateObj.getDay(); // 0: Sun, 1: Mon...
      // Align Monday as column 0 (Mon=0, Tue=1 ... Sun=6)
      const padCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

      const cells = [];
      for (let p = 0; p < padCount; p++) {
        cells.push({ isPad: true, id: `pad-${m.monthKey}-${p}` });
      }

      m.dates.forEach(dStr => {
        const dObj = new Date(dStr + 'T00:00:00');
        const dayNum = dObj.getDate();
        cells.push({
          isPad: false,
          dStr,
          dayNum,
          dayOfWeek: dObj.getDay()
        });
      });

      return {
        ...m,
        cells
      };
    });
  }, [dateSeries]);

  const currentOverallAvg = useMemo(() => {
    if (selectedHabitId === 'all') {
      return overallStat.avgScore;
    }
    const h = habitStats.find(stat => stat.id === selectedHabitId);
    return h ? h.avgScore : 0;
  }, [selectedHabitId, overallStat, habitStats]);

  // Overall dynamic sparkline for composite card
  const overallSparkPoints = useMemo(() => {
    const totalPts = Math.max(1, dateSeries.length - 1);
    return dateSeries.map((dStr, idx) => {
      const s = summaryMap.get(dStr);
      const val = s?.overallScore || 0;
      const x = (idx / totalPts) * 56 + 2;
      const y = 14 - (val / 100) * 12;
      return { x, y };
    });
  }, [dateSeries, summaryMap]);
  const overallSparkPath = useMemo(() => generateSmoothPath(overallSparkPoints), [overallSparkPoints]);
  const overallLastPt = overallSparkPoints[overallSparkPoints.length - 1];



  // Streak & Consistency metrics
  const { currentStreak, longestStreak, activeDaysCount, consistencyPct } = useMemo(() => {
    let curr = 0;
    let max = 0;
    let temp = 0;
    let active = 0;

    dateSeries.forEach(dStr => {
      const sum = summaryMap.get(dStr);
      let score = 0;
      if (selectedHabitId === 'all') {
        score = sum?.overallScore || 0;
      } else {
        score = sum?.habitScores?.[selectedHabitId] || 0;
      }

      if (score >= 60) {
        active++;
        temp++;
        if (temp > max) max = temp;
      } else {
        temp = 0;
      }
    });

    // Check streak from end backwards
    for (let i = dateSeries.length - 1; i >= 0; i--) {
      const sum = summaryMap.get(dateSeries[i]);
      const score = selectedHabitId === 'all'
        ? sum?.overallScore || 0
        : sum?.habitScores?.[selectedHabitId] || 0;
      if (score >= 60) curr++;
      else break;
    }

    const pct = Math.round((active / (dateSeries.length || 1)) * 100);
    return {
      currentStreak: curr,
      longestStreak: Math.max(max, curr),
      activeDaysCount: active,
      consistencyPct: pct
    };
  }, [dateSeries, summaryMap, selectedHabitId]);

  // "Steady Fire" Streak Engine Data (Current, Longest, Milestones)
  const streakEngineData = useMemo(() => {
    const activeSummaries = realSummaries.length > 0
      ? realSummaries
      : dateSeries.map(dStr => {
          const s = summaryMap.get(dStr);
          return { id: dStr, ...(s || {}) };
        });
    return calculateStreakData(selectedHabitId, activeSummaries);
  }, [selectedHabitId, realSummaries, dateSeries, summaryMap]);

  const streakMilestone = useMemo(() => {
    return getNextMilestone(streakEngineData.currentStreak);
  }, [streakEngineData.currentStreak]);

  // Current Unlocked Milestone Tier (e.g. Titan, Solid Iron, Momentum)
  const currentMilestoneTier = useMemo(() => {
    return getCurrentMilestone(streakEngineData.currentStreak);
  }, [streakEngineData.currentStreak]);

  // Target Hit Rate (% of days in dateSeries scoring >= 70%)
  const targetHitStats = useMemo(() => {
    let count = 0;
    dateSeries.forEach(dStr => {
      const sum = summaryMap.get(dStr);
      const score = selectedHabitId === 'all'
        ? sum?.overallScore || 0
        : sum?.habitScores?.[selectedHabitId] || 0;
      if (score >= 70) {
        count++;
      }
    });
    const pct = dateSeries.length > 0 ? Math.round((count / dateSeries.length) * 100) : 0;
    return {
      count,
      total: dateSeries.length,
      pct
    };
  }, [dateSeries, summaryMap, selectedHabitId]);

  // Resilience / Recovery Score for Deep Dive link
  const resilienceScore = useMemo(() => {
    const activeSummaries = realSummaries.length > 0
      ? realSummaries
      : dateSeries.map(dStr => {
          const s = summaryMap.get(dStr);
          return { id: dStr, ...(s || {}) };
        });
    const analytics = calculateRecoveryScore(activeSummaries, selectedHabitId === 'all' ? (activeHabits[0]?.id || '') : selectedHabitId);
    return analytics.recoveryScore ?? 85;
  }, [realSummaries, dateSeries, summaryMap, selectedHabitId]);

  // Streak Risk Analysis & Speedometer Calculation
  const streakRiskAnalysis = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySummary = summaryMap.get(todayStr);
    const todayScore = selectedHabitId === 'all'
      ? todaySummary?.overallScore || 0
      : todaySummary?.habitScores?.[selectedHabitId] || 0;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdaySummary = summaryMap.get(yesterdayStr);
    const yesterdayScore = selectedHabitId === 'all'
      ? yesterdaySummary?.overallScore || 0
      : yesterdaySummary?.habitScores?.[selectedHabitId] || 0;

    let level = 'low'; // 'low', 'moderate', 'high'
    let needleDeg = -55; // -65 to 65
    let title = isHinglish ? 'कम ख़तरा (Low Risk)' : 'Low';
    let message = isHinglish
      ? 'शानदार मोमेंटम! आज की प्रगति पूरी है, स्ट्रीक सुरक्षित है।'
      : "Don't break your chain! You're safe if you keep today's rhythm.";
    let color = '#10b981';

    if (todayScore > 0) {
      level = 'low';
      needleDeg = -55;
      title = isHinglish ? 'कम ख़तरा (Low)' : 'Low';
      message = isHinglish
        ? 'शानदार मोमेंटम! आज का लॉग पूरा है, आपकी लौ सुरक्षित है।'
        : 'Chain is solid! You have logged today and protected your momentum.';
      color = '#10b981';
    } else if (yesterdayScore > 0) {
      level = 'moderate';
      needleDeg = 5;
      title = isHinglish ? 'मध्यम ख़तरा (Moderate)' : 'Moderate';
      message = isHinglish
        ? 'सावधान! अगर आज मिस हुआ, तो स्ट्रीक टूटने का ख़तरा बढ़ जाएगा।'
        : "Don't break your chain! You're at risk if you miss today.";
      color = '#f59e0b';
    } else {
      level = 'high';
      needleDeg = 55;
      title = isHinglish ? 'उच्च ख़तरा (High)' : 'High';
      message = isHinglish
        ? 'गंभीर चेतावनी! 2 दिन से लॉग नहीं हुआ है — आज ही वापस लौटें।'
        : "Don't break your chain! You're at risk if you miss 2 more days.";
      color = '#ef4444';
    }

    return { level, needleDeg, title, message, color };
  }, [summaryMap, selectedHabitId, isHinglish]);

  // Day of Week Behavioral Analysis (Best Day vs Vulnerable Day)
  const dayOfWeekAnalysis = useMemo(() => {
    const dayStats = [
      { name: 'Sun', short: 'S', full: isHinglish ? 'रविवार' : 'Sunday', scores: [] },
      { name: 'Mon', short: 'M', full: isHinglish ? 'सोमवार' : 'Monday', scores: [] },
      { name: 'Tue', short: 'T', full: isHinglish ? 'मंगलवार' : 'Tuesday', scores: [] },
      { name: 'Wed', short: 'W', full: isHinglish ? 'बुधवार' : 'Wednesday', scores: [] },
      { name: 'Thu', short: 'T', full: isHinglish ? 'गुरुवार' : 'Thursday', scores: [] },
      { name: 'Fri', short: 'F', full: isHinglish ? 'शुक्रवार' : 'Friday', scores: [] },
      { name: 'Sat', short: 'S', full: isHinglish ? 'शनिवार' : 'Saturday', scores: [] }
    ];

    dateSeries.forEach(dStr => {
      const d = new Date(dStr + 'T00:00:00');
      const dayIdx = d.getDay();
      const sum = summaryMap.get(dStr);
      const score = selectedHabitId === 'all'
        ? sum?.overallScore || 0
        : sum?.habitScores?.[selectedHabitId] || 0;
      if (score !== undefined && score !== null) {
        dayStats[dayIdx].scores.push(score);
      }
    });

    // Reorder from Mon to Sun: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    const ordered = [dayStats[1], dayStats[2], dayStats[3], dayStats[4], dayStats[5], dayStats[6], dayStats[0]].map(d => {
      const avg = d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 50;
      return {
        ...d,
        avg: Math.max(15, Math.min(100, avg))
      };
    });

    const sorted = [...ordered].sort((a, b) => b.avg - a.avg);
    const best = sorted[0];
    const vulnerable = sorted[sorted.length - 1];

    return {
      orderedDays: ordered,
      bestDay: best,
      vulnerableDay: vulnerable
    };
  }, [dateSeries, summaryMap, selectedHabitId, isHinglish]);

  // Weekday vs Weekend Behavioral Comparison
  const weekdayVsWeekendAnalysis = useMemo(() => {
    const weekdayScores = [];
    const weekendScores = [];

    dateSeries.forEach(dStr => {
      const d = new Date(dStr + 'T00:00:00');
      const dayIdx = d.getDay(); // 0 = Sun, 6 = Sat
      const sum = summaryMap.get(dStr);
      const score = selectedHabitId === 'all'
        ? sum?.overallScore || 0
        : sum?.habitScores?.[selectedHabitId] || 0;

      if (score !== undefined && score !== null) {
        if (dayIdx === 0 || dayIdx === 6) {
          weekendScores.push(score);
        } else {
          weekdayScores.push(score);
        }
      }
    });

    const weekdayAvg = weekdayScores.length > 0
      ? Math.round(weekdayScores.reduce((a, b) => a + b, 0) / weekdayScores.length)
      : 50;
    const weekendAvg = weekendScores.length > 0
      ? Math.round(weekendScores.reduce((a, b) => a + b, 0) / weekendScores.length)
      : 50;

    const diff = weekdayAvg - weekendAvg;
    const isWeekdayStronger = diff >= 0;

    let headline = `${weekdayAvg}% vs ${weekendAvg}%`;

    let subtitle = '';
    if (Math.abs(diff) === 0) {
      subtitle = isHinglish
        ? 'वीकडेज़ और वीकेंड्स दोनों पर समान संतुलन है।'
        : 'Equal consistency across weekdays and weekends.';
    } else if (isWeekdayStronger) {
      subtitle = isHinglish
        ? `आप वीकेंड्स की तुलना में वीकडेज़ पर ${diff}% अधिक सुसंगत हैं।`
        : `You are ${diff}% more consistent on weekdays vs weekends.`;
    } else {
      subtitle = isHinglish
        ? `आप वीकडेज़ की तुलना में वीकेंड्स पर ${Math.abs(diff)}% अधिक सक्रिय हैं।`
        : `You are ${Math.abs(diff)}% stronger on weekends vs weekdays.`;
    }

    return {
      weekdayAvg,
      weekendAvg,
      diff,
      isWeekdayStronger,
      headline,
      subtitle
    };
  }, [dateSeries, summaryMap, selectedHabitId, isHinglish]);

  // Weekly breakdown bars
  const weeklyBreakdown = useMemo(() => {
    const weeksCount = dateSeries.length <= 7 ? 1 : dateSeries.length <= 14 ? 2 : dateSeries.length <= 30 ? 4 : Math.min(12, Math.ceil(dateSeries.length / 7));
    const daysPerWeek = Math.floor(dateSeries.length / weeksCount);
    const result = [];

    for (let w = 0; w < weeksCount; w++) {
      const sliceDates = dateSeries.slice(w * daysPerWeek, (w + 1) * daysPerWeek);
      const scores = sliceDates.map(dStr => {
        const sum = summaryMap.get(dStr);
        return selectedHabitId === 'all'
          ? sum?.overallScore || 0
          : sum?.habitScores?.[selectedHabitId] || 0;
      }).filter(s => s > 0);

      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      
      // Calculate formatted date range, e.g. "7 Jun – 14 Jun"
      const startDate = sliceDates[0] ? new Date(sliceDates[0] + 'T00:00:00') : null;
      const endDate = sliceDates[sliceDates.length - 1] ? new Date(sliceDates[sliceDates.length - 1] + 'T00:00:00') : null;
      let dateRangeStr = '';
      if (startDate && endDate) {
        const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
        dateRangeStr = `${startDate.getDate()} ${startMonth} – ${endDate.getDate()} ${endMonth}`;
      }

      result.push({
        label: `Week ${w + 1}`,
        dateRangeStr,
        sliceDates,
        avg
      });
    }

    return result.map((item, idx) => {
      const prevAvg = idx > 0 ? result[idx - 1].avg : item.avg;
      const isUp = item.avg >= prevAvg;
      return {
        ...item,
        isUp,
        diff: item.avg - prevAvg
      };
    });
  }, [dateSeries, summaryMap, selectedHabitId]);

  // "Kamzor Kadi" / Weakest Habit identifier
  const weakestHabit = useMemo(() => {
    const declining = habitStats.filter(h => h.isWarning || h.avgScore < 60);
    if (declining.length > 0) return declining[0];
    return habitStats[habitStats.length - 1] || null;
  }, [habitStats]);

  // SVG Line Chart Coordinate calculation
  const chartCoordinates = useMemo(() => {
    const W = 500;
    const H = 180;
    const padTop = 20;
    const padBottom = 30;
    const padLeft = 30;
    const padRight = 20;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;

    const xStep = plotW / Math.max(1, dateSeries.length - 1);

    if (selectedHabitId === 'all') {
      // Multi-habit lines + bold composite line
      const habitLines = activeHabits.map(h => {
        const pts = dateSeries.map((dStr, i) => {
          const sum = summaryMap.get(dStr);
          const score = sum?.habitScores?.[h.id] ?? 0;
          const x = padLeft + i * xStep;
          const y = padTop + plotH - (score / 100) * plotH;
          return { x, y, score };
        });
        return {
          id: h.id,
          name: h.name,
          color: h.color,
          path: generateSmoothPath(pts)
        };
      });

      // Composite bold line
      const compositePts = dateSeries.map((dStr, i) => {
        const sum = summaryMap.get(dStr);
        const score = sum?.overallScore ?? 0;
        const x = padLeft + i * xStep;
        const y = padTop + plotH - (score / 100) * plotH;
        return { x, y, score };
      });

      const compPath = generateSmoothPath(compositePts);
      const compArea = `${compPath} L ${padLeft + plotW} ${padTop + plotH} L ${padLeft} ${padTop + plotH} Z`;

      return {
        habitLines,
        compositeLine: compPath,
        compositeArea: compArea,
        xLabels: dateSeries.map((dStr, i) => {
          const d = new Date(dStr);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = d.getDate();
          return {
            x: padLeft + i * xStep,
            label: dateSeries.length <= 7 ? dayName : `${dayNum}`
          };
        }),
        W, H, padLeft, padRight, padTop, padBottom, plotW, plotH
      };
    } else {
      // Single selected habit
      const currentHabit = activeHabits.find(h => h.id === selectedHabitId) || activeHabits[0];
      const pts = dateSeries.map((dStr, i) => {
        const sum = summaryMap.get(dStr);
        const score = sum?.habitScores?.[currentHabit.id] ?? 0;
        const x = padLeft + i * xStep;
        const y = padTop + plotH - (score / 100) * plotH;
        return { x, y, score };
      });

      const linePath = generateSmoothPath(pts);
      const areaPath = `${linePath} L ${padLeft + plotW} ${padTop + plotH} L ${padLeft} ${padTop + plotH} Z`;

      return {
        singleLine: linePath,
        singleArea: areaPath,
        color: currentHabit.color,
        xLabels: dateSeries.map((dStr, i) => {
          const d = new Date(dStr);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = d.getDate();
          return {
            x: padLeft + i * xStep,
            label: dateSeries.length <= 7 ? dayName : `${dayNum}`
          };
        }),
        W, H, padLeft, padRight, padTop, padBottom, plotW, plotH
      };
    }
  }, [dateSeries, summaryMap, selectedHabitId, activeHabits]);

  // Resolved Chart Data for ECharts
  const chartData = useMemo(() => {
    return dateSeries.map(dateStr => {
      const summary = summaryMap.get(dateStr);
      const dataPoint = { date: dateStr };
      if (!summary) {
        dataPoint.overallScore = null;
        dataPoint.meta = {
           recordedCount: 0,
           expectedCount: activeHabits.length
        };
      } else {
        dataPoint.overallScore = summary.overallScore !== undefined ? summary.overallScore : null;
        dataPoint.meta = {
           recordedCount: summary.habitsCompleted || 0,
           expectedCount: summary.habitsTotal || activeHabits.length
        };
      }
      
      activeHabits.forEach(h => {
        if (!summary || summary.habitScores?.[h.id] === undefined) {
          dataPoint[h.id] = null;
        } else {
          dataPoint[h.id] = summary.habitScores[h.id];
        }
      });
      return dataPoint;
    });
  }, [dateSeries, summaryMap, activeHabits]);

  // Helper to format minutes to 12-Hour Clock (e.g. 6:30 AM)
  const formatTimeMinutes = (mins) => {
    if (mins === null || mins === undefined || isNaN(mins)) return '';
    const total = Math.round(mins) % 1440;
    let h = Math.floor(total / 60);
    const m = total % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Helper to format duration to compound hours/minutes (e.g. 1h 30m)
  const formatDurationMinutes = (mins) => {
    if (mins === null || mins === undefined || isNaN(mins)) return '';
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Helper to compute raw metric value based on habit type & target
  const getHabitRawValue = (habit, score, summary) => {
    if (score === null || score === undefined) return null;
    if (summary && summary.habitValues && summary.habitValues[habit.id] !== undefined) {
      const val = summary.habitValues[habit.id];
      if (typeof val === 'number') return val;
      if (val === true) return 1;
      if (val === false) return 0;
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
    const isTime = habit?.scoringType === 'time' || habit?.type === 'time';
    const isScale = habit?.scoringType === 'scale' || habit?.scoringType === 'rating' || habit?.unit === '/10';
    const isBoolean = habit?.scoringType === 'binary' || habit?.scoringType === 'boolean' || habit?.type === 'boolean';
    
    if (isTime) {
      const t100 = habit.target100 !== undefined ? habit.target100 : (habit.targetValue || 360);
      const t0 = habit.target0 !== undefined ? habit.target0 : (t100 + 120);
      const val = t100 + ((100 - score) / 100) * (t0 - t100);
      return Math.round(val);
    }
    if (isScale) {
      return Math.round((score / 10) * 10) / 10;
    }
    if (isBoolean) {
      return score >= 100 ? 1 : 0;
    }
    const target = habit?.targetValue || habit?.target || 100;
    return Math.round((score / 100) * target * 10) / 10;
  };

  // ECharts Options Generator with Support for Score (0-100%) vs Actual Raw Units
  const getEChartOption = (habitId) => {
    const isOverall = habitId === 'all';
    const habit = activeHabits.find(h => h.id === habitId);
    const habitName = isOverall ? 'Overall Composite' : (habit?.name || 'Habit');
    const primaryColor = isOverall ? '#10b981' : (habit?.color || '#10b981');

    const isTime = !isOverall && (habit?.scoringType === 'time' || habit?.type === 'time');
    const isDuration = !isOverall && (habit?.scoringType === 'duration' || habit?.unit === 'minutes' || habit?.unit === 'mins' || habit?.unit === 'hours');
    const isBoolean = !isOverall && (habit?.scoringType === 'binary' || habit?.scoringType === 'boolean' || habit?.type === 'boolean');
    const isScale = !isOverall && (habit?.scoringType === 'scale' || habit?.scoringType === 'rating' || habit?.unit === '/10');
    
    // Unit mode active for non-overall, non-boolean habits when toggled
    const isUnitMode = !isOverall && !isBoolean && chartMetricType === 'unit';
    const unitSuffix = isUnitMode ? (isTime || isDuration ? '' : (isScale ? '/10' : (habit?.unit ? ` ${habit.unit}` : ''))) : '%';

    // Helper to compute 7-Day Rolling Moving Average
    const get7DMAData = (rawList) => {
      return rawList.map((item, idx) => {
        const windowStart = Math.max(0, idx - 6);
        const windowSlice = rawList.slice(windowStart, idx + 1);
        const validValues = windowSlice
          .map(val => (typeof val === 'object' && val !== null ? val.value : val))
          .filter(v => v !== null && v !== undefined && v > 0);
        if (validValues.length === 0) return null;
        const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
        return Math.round(avg * 10) / 10;
      });
    };

    // Calculate raw or unit data array
    const rawScores = isOverall
      ? chartData.map(d => d.overallScore)
      : chartData.map(d => {
          const score = d[habitId];
          if (score === null || score === undefined) return null;
          if (!isUnitMode) return score;
          return getHabitRawValue(habit, score, summaryMap.get(d.date));
        });

    const ma7Scores = get7DMAData(rawScores);

    // Formatted raw data with circular data points
    const formattedRawPoints = chartData.map((d, i) => {
      const val = rawScores[i];
      if (val === null || val === undefined) {
        return {
          value: 0,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#ffffff', borderColor: '#0f172a', borderWidth: 2 },
          isUnrecorded: true,
          meta: d.meta,
          rawVal: null,
          maVal: ma7Scores[i]
        };
      }
      return {
        value: val,
        symbol: 'circle',
        symbolSize: chartTrendMode === 'both' ? 4 : 5.5,
        itemStyle: { color: primaryColor, borderColor: '#ffffff', borderWidth: 1.5 },
        meta: d.meta,
        rawVal: val,
        maVal: ma7Scores[i]
      };
    });

    // Formatted smooth 7D moving average data (No dots)
    const formattedMA = ma7Scores.map((val, i) => ({
      value: val,
      symbol: 'none',
      symbolSize: 0,
      rawVal: rawScores[i],
      maVal: val,
      meta: chartData[i]?.meta
    }));

    let series = [];

    if (chartTrendMode === 'raw') {
      // ── 1. RAW SCORES ONLY: Solid day-to-day lines + visible data point dots ──
      series = [
        {
          name: isOverall ? 'Daily Score' : (isUnitMode ? `Daily ${habit?.unit || 'Value'}` : habitName),
          type: 'line',
          data: formattedRawPoints,
          connectNulls: true,
          showSymbol: true,
          smooth: false, // Sharp daily fluctuations
          itemStyle: { color: primaryColor },
          lineStyle: { width: 2.5, color: primaryColor },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: primaryColor + '35' },
                { offset: 1, color: primaryColor + '01' }
              ]
            }
          }
        }
      ];
    } else if (chartTrendMode === '7d_ma') {
      // ── 2. 7-DAY MOVING AVERAGE ONLY: Smooth bezier wave, NO raw dots ──
      series = [
        {
          name: isOverall ? '7D Moving Avg' : `${habitName} (7D Trend)`,
          type: 'line',
          data: formattedMA,
          connectNulls: true,
          showSymbol: false, // NO dots on pure moving average
          smooth: true,      // Smooth flowing spline
          itemStyle: { color: '#3b82f6' },
          lineStyle: { width: 3.5, color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.30)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
              ]
            }
          }
        }
      ];
    } else {
      // ── 3. BOTH OVERLAID: Dotted Raw Daily Points + Smooth Bold 7D Trendline ──
      series = [
        {
          name: isOverall ? 'Daily Score (Raw)' : `${habitName} (${isUnitMode ? (habit?.unit || 'Units') : 'Raw'})`,
          type: 'line',
          data: formattedRawPoints,
          connectNulls: true,
          showSymbol: true,
          smooth: false,
          itemStyle: { color: primaryColor },
          lineStyle: { width: 1.5, color: primaryColor, type: 'dashed', opacity: 0.65 }
        },
        {
          name: '7D Moving Avg',
          type: 'line',
          data: formattedMA,
          connectNulls: true,
          showSymbol: false,
          smooth: true,
          itemStyle: { color: '#3b82f6' },
          lineStyle: { width: 3.5, color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.24)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
              ]
            }
          }
        }
      ];
    }

    // Dynamic Y-Axis scale
    let yMin = 0;
    let yMax = 100;
    if (isUnitMode) {
      if (isScale) {
        yMax = 10;
      } else if (isTime) {
        const validTime = rawScores.filter(v => v !== null && v !== undefined && v > 0);
        const minTime = validTime.length > 0 ? Math.min(...validTime) : 360;
        const maxTime = validTime.length > 0 ? Math.max(...validTime) : 480;
        yMin = Math.max(0, Math.floor((minTime - 60) / 60) * 60);
        yMax = Math.min(1440, Math.ceil((maxTime + 60) / 60) * 60);
      } else {
        const validNumeric = rawScores.filter(v => v !== null && v !== undefined && v > 0);
        const maxVal = validNumeric.length > 0 ? Math.max(...validNumeric) : (habit?.targetValue || 10);
        const targetVal = habit?.targetValue || 10;
        const highest = Math.max(maxVal, targetVal);
        yMax = highest > 100 ? Math.ceil(highest * 1.1) : Math.ceil(highest * 1.15);
      }
    }

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

          // Haptic tactile tick on mobile when scrubbing
          if (lastVibratedIndexRef.current !== dataIndex) {
            lastVibratedIndexRef.current = dataIndex;
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try { navigator.vibrate(15); } catch(e) {}
            }
          }

          const pointData = chartData[dataIndex];
          const dateObj = new Date(pointData.date + 'T00:00:00');
          const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const isOverallMode = habitId === 'all';
          
          const isOverallUnrec = isOverallMode && (pointData.overallScore === null || pointData.overallScore === undefined);
          const isHabitUnrec = !isOverallMode && (pointData[habitId] === null || pointData[habitId] === undefined);
          
          let html = `<div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border: 1px solid #f1f5f9; padding: 10px 14px; font-family: system-ui, -apple-system, sans-serif; min-width: 150px;">`;
          html += `<div style="font-size: 11px; color: #64748b; margin-bottom: 7px; font-weight: 600; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">${dateStr}</div>`;
          
          if (isOverallUnrec || isHabitUnrec) {
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid #0f172a; background: #ffffff; display: inline-block;"></span>
                  <span style="font-size: 13px; font-weight: 700; color: #0f172a;">Not Logged</span>
                </div>
                <span style="font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Untracked</span>
              </div>
            `;
          } else {
            params.forEach(param => {
              const valObj = param.data;
              const isUnrecPoint = valObj && valObj.value === 0 && valObj.isUnrecorded;
              if (!isUnrecPoint) {
                const score = valObj && valObj.value !== undefined ? (isUnitMode ? valObj.value : Math.round(valObj.value)) : Math.round(param.value);
                const color = param.color || primaryColor;
                const seriesName = param.seriesName || (isOverallMode ? 'Overall Composite' : 'Performance');
                
                let displayVal = `${score}${unitSuffix}`;
                if (isUnitMode && isTime) {
                  displayVal = formatTimeMinutes(score);
                } else if (isUnitMode && isDuration) {
                  displayVal = formatDurationMinutes(score);
                }

                html += `
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-top: 3px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="width: 6px; height: 6px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
                      <span style="font-size: 12px; font-weight: 700; color: #1e293b;">${seriesName}</span>
                    </div>
                    <strong style="font-size: 13.5px; font-weight: 800; color: #0f172a;">${displayVal}</strong>
                  </div>
                `;
              }
            });
          }
          
          html += `</div>`;
          return html;
        }
      },
      legend: { show: false },
      dataZoom: [{ type: 'inside', xAxisIndex: 0, filterMode: 'filter' }],
      grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.map(d => {
            const date = new Date(d.date + 'T00:00:00');
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        axisLabel: { color: '#868381', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        axisLabel: { 
          color: '#868381', 
          fontSize: 10,
          formatter: (val) => {
            if (isUnitMode) {
              if (isTime) return formatTimeMinutes(val);
              if (isDuration) return formatDurationMinutes(val);
              if (val >= 1000) return `${Math.round(val / 1000)}k`;
              return `${val}`;
            }
            return `${val}%`;
          }
        },
        splitLine: { lineStyle: { type: 'dashed', color: 'rgba(150, 150, 150, 0.15)' } }
      },
      series: series
    };
  };

  return (
    <div className="max-w-[720px] lg:max-w-6xl xl:max-w-7xl mx-auto w-full pb-20 space-y-2.5 sm:space-y-3.5 px-0 sm:px-2 lg:px-6 animate-in fade-in duration-300">
      
      {/* ── PREVIEW NOTICE BANNER - only shown when zero habits configured ─── */}
      {isPreviewMode && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Flask size={18} weight="fill" className="text-indigo-500 shrink-0" />
            <span className="font-semibold leading-tight text-[11px] sm:text-xs">
              {isHinglish 
                ? 'Koi habit configure nahi ki gayi hai. Pehle habits add karo.' 
                : 'No habits configured yet. Add habits to see your real stats.'}
            </span>
          </div>
        </div>
      )}

      {/* ── SECTION 1: TOP CONTROLS & HABIT PERFORMANCE KPIS (STICKY ON SCROLL) ── */}
      <section className="sticky top-[calc(3.25rem+env(safe-area-inset-top))] z-30 bg-slate-50/95 dark:bg-[#0b0f19]/95 backdrop-blur-md pt-0 pb-1 space-y-1.5 transition-all">
        {/* Top Controls Row: Left = Timeframe Picker Pill */}
        <div className="flex items-center justify-between px-0.5">
          {/* Left: Custom In-App Timeframe Selector Button (Zero OS Dialog Lag) */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(30);
              setShowTimeframeModal(true);
            }}
            className="flex items-center gap-1 bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 rounded-full h-[28px] px-2.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shrink-0 select-none group"
            title="Change Timeframe"
          >
            <Calendar size={11} weight="bold" className="text-slate-500 shrink-0" />
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
              {rangeOption === '7' ? '7D' :
               rangeOption === '14' ? '14D' :
               rangeOption === '30' ? '30D' :
               rangeOption === '90' ? '90D' :
               rangeOption === 'custom' ? 'Custom' :
               '30D'}
            </span>
            <CaretDown size={9} weight="bold" className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5 shrink-0" />
          </button>
        </div>

        {/* Horizontal Scrollable Habit KPI Pills (No Scrollbar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 -mx-0.5">
          {/* Overall Composite Pill */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(30);
              setSelectedHabitId('all');
            }}
            className={`h-[34px] px-3 rounded-full border flex items-center gap-2 shrink-0 cursor-pointer transition-all shadow-2xs ${
              selectedHabitId === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs font-black'
                : 'bg-white dark:bg-[#131722] border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkle size={11} weight="fill" />
            </div>
            <span className="text-xs font-bold whitespace-nowrap">Overall</span>
            <span className="text-xs font-black ml-0.5">{overallStat.avgScore}%</span>
            <span
              className={`text-[10.5px] font-bold flex items-center gap-0.5 leading-none ${
                overallStat.delta > 0
                  ? selectedHabitId === 'all'
                    ? 'text-emerald-300 dark:text-emerald-600'
                    : 'text-emerald-600 dark:text-emerald-400'
                  : overallStat.delta < 0
                  ? selectedHabitId === 'all'
                    ? 'text-rose-300 dark:text-rose-600'
                    : 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              (
              {overallStat.delta > 0 && <TrendUp size={10} weight="bold" />}
              {overallStat.delta < 0 && <TrendDown size={10} weight="bold" />}
              {Math.abs(overallStat.delta)}%)
            </span>
          </button>

          {/* Individual Habit KPI Pills */}
          {habitStats.map(h => {
            const isSelected = selectedHabitId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(30);
                  setSelectedHabitId(h.id);
                }}
                className={`h-[34px] px-3 rounded-full border flex items-center gap-2 shrink-0 cursor-pointer transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs font-black'
                    : 'bg-white dark:bg-[#131722] border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: h.color }}
                >
                  <HabitIcon name={h.icon} size={11} className="text-white" />
                </div>
                <span className="text-xs font-bold whitespace-nowrap truncate max-w-[120px]">{h.name}</span>
                <span className="text-xs font-black ml-0.5">{h.avgScore}%</span>
                <span
                  className={`text-[10.5px] font-bold flex items-center gap-0.5 leading-none ${
                    h.delta > 0
                      ? isSelected
                        ? 'text-emerald-300 dark:text-emerald-600'
                        : 'text-emerald-600 dark:text-emerald-400'
                      : h.delta < 0
                      ? isSelected
                        ? 'text-rose-300 dark:text-rose-600'
                        : 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  (
                  {h.delta > 0 && <TrendUp size={10} weight="bold" />}
                  {h.delta < 0 && <TrendDown size={10} weight="bold" />}
                  {Math.abs(h.delta)}%)
                </span>
              </button>
            );
          })}
        </div>
      </section>




      {/* ── DESKTOP 2-COLUMN GRID (CHART TOP/LEFT, HEATMAP BOTTOM/RIGHT) / MOBILE STACK ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        
        {/* ── SECTION 2: VELOCITY / TRAJECTORY QUICK STATS + MAIN ECHARTS ──── */}
        <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-3">
          
          {/* Header with 3 Balanced Items: Habit Selector Dropdown (Left), Timeframe Badge (Center), Chart Controls Button (Right) */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/60">
            {/* Left: Weighted Average / Individual Habit Average Pill + Separate (i) Button Outside Pill */}
            <div className="flex items-center gap-1.5 min-w-0">
              {selectedHabitId === 'all' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs select-none">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Weighted Average
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {overallStat.avgScore}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs select-none">
                  <div 
                    className="w-3.5 h-3.5 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: currentSelectedHabit?.color || '#3b82f6' }}
                  >
                    <HabitIcon name={currentSelectedHabit?.icon} size={8} className="text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">
                    {currentSelectedHabit?.name} Avg
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {trajectoryStats.avgScore}%
                  </span>
                </div>
              )}

              {/* Clean (i) Info Button (Outside the Pill) */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(30);
                  setShowWeightedInfoModal(true);
                }}
                className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700/70 shadow-2xs shrink-0"
                title="How Scoring & Performance Work"
              >
                <Icon name="info" className="text-[13px]" />
              </button>
            </div>

            {/* Right: Chart Controls & 4-Corner Zoom-Out Button (Clean, No duplicate (i) button!) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Filter Button (Shifted Left) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(35);
                    setShowChartControlModal(true);
                  }}
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border shadow-2xs bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Chart Controls & Smoothing"
                >
                  <Icon name="tune" className="text-[14px]" />
                </button>

                {/* Blue Dot: Shown when 7D MA smoothing or Unit metric is active */}
                {(chartTrendMode !== 'raw' || (selectedHabitId !== 'all' && chartMetricType !== 'score')) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#131722] pointer-events-none"></span>
                )}
              </div>

              {/* 4-Corner Zoom-Out / Expanded View Button (Round Wrapper) */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(35);
                  setShowFullscreenChart(true);
                }}
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border shadow-2xs bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 group"
                title="Expanded Chart View"
              >
                <CornersOut size={15} weight="bold" className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* 3-Column Micro KPI Stat Strip (Resilience Score, Consistency, Target Hit Rate) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            {/* Card 1: Resilience Score (Clickable Link / Lock Modal if < 14d) */}
            <div
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                if ((realSummaries?.length || 0) < 14) {
                  setShowResilienceLockModal(true);
                } else {
                  navigate(selectedHabitId === 'all' ? '/analytics/recovery' : `/analytics/recovery?habitId=${selectedHabitId}`);
                }
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col justify-between min-w-0 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-xs transition-all group cursor-pointer relative"
              title="Tap to open Resilience & Recovery Deep Dive"
            >
              <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-tight text-emerald-700 dark:text-emerald-300 leading-none whitespace-nowrap flex items-center gap-1 truncate">
                <ShieldCheck size={11} weight="fill" className="text-emerald-500 shrink-0" />
                <span>{isHinglish ? 'रेज़िलिएंस' : 'Resilience'}</span>
              </span>

              <div className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight my-0.5 tracking-tight">
                {resilienceScore}%
              </div>

              <div className="flex items-center justify-between gap-1 leading-none">
                <span className="text-[8.5px] xs:text-[9px] sm:text-[9.5px] font-semibold text-emerald-700/75 dark:text-emerald-400/75 whitespace-nowrap truncate">
                  {isHinglish ? 'रिकवरी हब' : 'Bounce-back'}
                </span>
                {(realSummaries?.length || 0) < 14 ? (
                  <Lock size={11} weight="bold" className="text-amber-500 shrink-0" />
                ) : (
                  <CaretRight size={10} weight="bold" className="text-emerald-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                )}
              </div>
            </div>

            {/* Card 2: Consistency Rate */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 flex flex-col justify-center min-w-0">
              <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-tight text-indigo-700 dark:text-indigo-300 leading-none whitespace-nowrap flex items-center gap-1">
                <Target size={11} weight="fill" className="text-indigo-500 shrink-0" />
                {isHinglish ? 'कंसिस्टेंसी' : 'Consistency'}
              </span>
              <div className="text-base sm:text-xl font-black text-indigo-600 dark:text-indigo-400 leading-tight my-0.5 tracking-tight">
                {consistencyPct}%
              </div>
              <span className="text-[8.5px] xs:text-[9px] sm:text-[9.5px] font-semibold text-indigo-700/75 dark:text-indigo-400/75 whitespace-nowrap leading-none truncate">
                {activeDaysCount}/{dateSeries.length} {isHinglish ? 'दिन सक्रिय' : 'days logged'}
              </span>
            </div>

            {/* Card 3: Target Hit Rate (Replaces duplicate Momentum) */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col justify-center min-w-0">
              <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-tight text-amber-700 dark:text-amber-300 leading-none whitespace-nowrap flex items-center gap-1">
                <Star size={11} weight="fill" className="text-amber-500 shrink-0" />
                {isHinglish ? 'लक्ष्य सिद्धि' : 'Target Hit'}
              </span>
              <div className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 leading-tight my-0.5 tracking-tight">
                {targetHitStats.pct}%
              </div>
              <span className="text-[8.5px] xs:text-[9px] sm:text-[9.5px] font-semibold text-amber-700/75 dark:text-amber-400/75 whitespace-nowrap leading-none truncate">
                {targetHitStats.count}/{targetHitStats.total} {isHinglish ? 'दिन बेंचमार्क पार' : 'days on-target'}
              </span>
            </div>
          </div>

          {/* ECharts Interactive Canvas (Draggable, Pan & Zoom) */}
          <div className="w-full h-[200px] sm:h-[230px] lg:h-[250px]">
            <ReactEChartsCore 
              ref={echartsRef}
              echarts={echarts} 
              option={getEChartOption(selectedHabitId)} 
              notMerge={true}
              lazyUpdate={true}
              style={{ height: '100%', width: '100%' }} 
            />
          </div>

          {/* Trajectory Legend Under Chart */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 px-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {/* Trend Indicators */}
            <div className="flex items-center gap-3">
              {chartTrendMode === 'raw' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950 inline-block"></span>
                  <span className="text-[10.5px]">
                    {selectedHabitId !== 'all' && chartMetricType === 'unit'
                      ? `Daily (${currentSelectedHabit?.unit || 'Units'})`
                      : (isHinglish ? 'Daily Score' : 'Daily Score')}
                  </span>
                </div>
              )}
              {chartTrendMode === '7d_ma' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 rounded-full bg-blue-500 inline-block shadow-2xs"></span>
                  <span className="text-[10.5px]">{isHinglish ? '7D Moving Avg' : '7D Moving Avg'}</span>
                </div>
              )}
              {chartTrendMode === 'both' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b-2 border-dashed border-emerald-500 inline-block"></span>
                    <span className="text-[10.5px]">
                      {selectedHabitId !== 'all' && chartMetricType === 'unit'
                        ? `Daily (${currentSelectedHabit?.unit || 'Raw'})`
                        : 'Daily (Raw)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-1 rounded-full bg-blue-500 inline-block shadow-2xs"></span>
                    <span className="text-[10.5px]">{isHinglish ? '7D Trend' : '7D Trend'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Not Logged / Untracked Indicator */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-900 inline-block shadow-2xs"></span>
              <span className="text-[10.5px]">{isHinglish ? 'Log Nahi Hua' : 'Not Logged'}</span>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: HEATMAP SECTION ──── */}
        <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-3">
          {/* Header with Balanced Clusters: Habit Dropdown + Score/Delta (Left), Timeframe + Filter Button (Right) */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/60 flex-wrap sm:flex-nowrap">
            {/* Left Cluster: Custom In-App Habit Selector Dropdown + Score & Delta Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(30);
                  setShowHabitSheet(true);
                }}
                className="flex items-center gap-1.5 px-2.5 h-[32px] rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 transition-all cursor-pointer shadow-2xs shrink-0 max-w-[150px] xs:max-w-[180px] sm:max-w-[210px] select-none group"
                title="Tap to switch habit"
              >
                <div 
                  className="w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: selectedHabitId === 'all' ? '#10b981' : (currentSelectedHabit?.color || '#3b82f6') }}
                >
                  {selectedHabitId === 'all' ? <Sparkle size={9} weight="fill" /> : <HabitIcon name={currentSelectedHabit?.icon} size={9} className="text-white" />}
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[85px] xs:max-w-[115px] sm:max-w-[145px]">
                  {selectedHabitId === 'all' ? 'Overall' : currentSelectedHabit?.name}
                </span>
                <CaretDown size={11} weight="bold" className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5 shrink-0" />
              </button>

              {/* Score % & Delta (Trend) Pill */}
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

            {/* Right Cluster: Filter Trigger Button */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Filter Trigger Button with Optional Green Dot */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(35);
                    setShowHeatmapControlModal(true);
                  }}
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer border shadow-2xs bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Heatmap Settings & Filters"
                >
                  <Icon name="tune" className="text-[14px]" />
                </button>

                {/* Green Dot: Shown when score filter OR day type filter is active */}
                {(heatmapFilter !== 'all' || dayTypeFilter !== 'all') && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131722] pointer-events-none"></span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Responsive Grid Layout (Day / Week / Month Views) */}
          <div className="relative pt-1">
            {(() => {
              // ── 1. DAILY HEATMAP VIEW ─────────────────────────────────
              if (heatmapGranularity === 'day') {
                if (heatmapLayout === 'month_blocks') {
                  return (
                    <div className="space-y-4 pt-1">
                      {monthBlocksHeatmapData.map((m) => {
                        let loggedDaysInMonth = 0;
                        m.dates.forEach(dStr => {
                          const sum = summaryMap.get(dStr);
                          const sc = selectedHabitId === 'all'
                            ? (sum?.overallScore ?? 0)
                            : (sum?.habitScores?.[selectedHabitId] ?? 0);
                          if (sc > 0) loggedDaysInMonth++;
                        });

                        return (
                          <div key={m.monthKey} className="space-y-2 p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/35 border border-slate-200/60 dark:border-slate-800/60">
                            {/* Month Header Row */}
                            <div className="flex items-center justify-between px-0.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                {m.monthFullLabel}
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300">
                                {loggedDaysInMonth} / {m.dates.length} {isHinglish ? 'Din Log Hue' : 'Days Logged'}
                              </span>
                            </div>

                            {/* Weekday Column Headers (Mon - Sun) */}
                            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 py-0.5">
                              <span>Mon</span>
                              <span>Tue</span>
                              <span>Wed</span>
                              <span>Thu</span>
                              <span>Fri</span>
                              <span>Sat</span>
                              <span>Sun</span>
                            </div>

                            {/* 7-Column Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                              {m.cells.map((cell) => {
                                if (cell.isPad) {
                                  return <div key={cell.id} className="h-8 sm:h-9 rounded-md bg-transparent" />;
                                }

                                const dStr = cell.dStr;
                                const sum = summaryMap.get(dStr);
                                let score = null;
                                if (sum) {
                                  score = selectedHabitId === 'all'
                                    ? (sum.overallScore ?? 0)
                                    : (sum.habitScores?.[selectedHabitId] ?? 0);
                                }

                                const isLogged = sum != null && (
                                  selectedHabitId === 'all'
                                    ? (sum.overallScore !== undefined)
                                    : (sum.habitScores?.[selectedHabitId] !== undefined)
                                );
                                const bgClass = getPerfBandClass(score);

                                // Score Match
                                let isScoreMatch = true;
                                if (heatmapFilter === 'elite_90') isScoreMatch = score >= 90;
                                else if (heatmapFilter === 'target_80') isScoreMatch = score >= 80;
                                else if (heatmapFilter === 'passing_50') isScoreMatch = score >= 50;
                                else if (heatmapFilter === 'struggle_below_50') isScoreMatch = score > 0 && score < 50;
                                else if (heatmapFilter === 'critical_below_30') isScoreMatch = score > 0 && score < 30;
                                else if (heatmapFilter === 'skipped') isScoreMatch = score === 0 || score === null || score === undefined;

                                // Day Type Match
                                const dObj = new Date(dStr + 'T00:00:00');
                                const dayOfWeek = dObj.getDay();
                                const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                let isDayTypeMatch = true;
                                if (dayTypeFilter === 'weekdays') isDayTypeMatch = isWeekday;
                                else if (dayTypeFilter === 'weekends') isDayTypeMatch = isWeekend;

                                const isAnyFilterActive = heatmapFilter !== 'all' || dayTypeFilter !== 'all';
                                const isFullMatch = isScoreMatch && isDayTypeMatch;
                                const filterEffectClass = isFullMatch ? 'opacity-100' : 'opacity-15 grayscale scale-95';

                                const recorded = sum?.loggedHabitIds?.length ?? (sum ? (sum.habitsTotal || activeHabits.length) : 0);
                                const expected = sum?.habitsTotal || activeHabits.length;
                                const isPartial = selectedHabitId === 'all' && isLogged && recorded > 0 && recorded < expected;

                                return (
                                  <div
                                    key={dStr}
                                    onClick={() => {
                                      if (navigator.vibrate) navigator.vibrate(40);
                                      setSelectedPeriod({
                                        type: 'day',
                                        title: new Date(dStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                                        subtitle: isHinglish ? 'Daily Performance Breakdown' : 'Daily Performance Breakdown',
                                        dates: [dStr]
                                      });
                                    }}
                                    className={`h-8 sm:h-9 rounded-md ${bgClass} ${isAnyFilterActive ? filterEffectClass : ''} border border-black/5 dark:border-white/5 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 relative`}
                                  >
                                    {showPercentages ? (
                                      <span className={`text-[9.5px] sm:text-[10.5px] font-black leading-none ${(score <= 35 || score >= 60) ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {isLogged ? `${Math.round(score)}%` : '—'}
                                      </span>
                                    ) : (
                                      <>
                                        <span className={`text-[10px] sm:text-[11px] font-black leading-none ${(score <= 35 || score >= 60) ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                          {cell.dayNum}
                                        </span>
                                        {isPartial ? (
                                          <span className="w-1 h-1 rounded-full bg-white shadow-2xs absolute bottom-1"></span>
                                        ) : !isLogged && (
                                          <span className="w-1 h-1 rounded-full bg-slate-900/60 dark:bg-white/60 absolute bottom-1"></span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Continuous Layout (Stream)
                const isLargeTimeframe = dateSeries.length > 30;
                const gridColsClass = isLargeTimeframe
                  ? "grid grid-cols-10 sm:grid-cols-15 md:grid-cols-18 gap-1 sm:gap-1.5"
                  : dateSeries.length <= 14
                  ? "grid grid-cols-7 sm:grid-cols-14 gap-1.5 sm:gap-2"
                  : "grid grid-cols-6 sm:grid-cols-10 gap-1.5 sm:gap-2";
                const cellHeightClass = isLargeTimeframe
                  ? "h-5 sm:h-6 rounded-[5px] sm:rounded-md"
                  : "h-9 sm:h-10 rounded-lg";

                return (
                  <div className={gridColsClass}>
                    {dateSeries.map(dStr => {
                      const sum = summaryMap.get(dStr);
                      let score = null;
                      if (sum) {
                        score = selectedHabitId === 'all'
                          ? (sum.overallScore ?? 0)
                          : (sum.habitScores?.[selectedHabitId] ?? 0);
                      }

                      const isLogged = sum != null && (
                        selectedHabitId === 'all'
                          ? (sum.overallScore !== undefined)
                          : (sum.habitScores?.[selectedHabitId] !== undefined)
                      );
                      const bgClass = getPerfBandClass(score);

                      // Evaluate Score Filter Match
                      let isScoreMatch = true;
                      if (heatmapFilter === 'elite_90') isScoreMatch = score >= 90;
                      else if (heatmapFilter === 'target_80') isScoreMatch = score >= 80;
                      else if (heatmapFilter === 'passing_50') isScoreMatch = score >= 50;
                      else if (heatmapFilter === 'struggle_below_50') isScoreMatch = score > 0 && score < 50;
                      else if (heatmapFilter === 'critical_below_30') isScoreMatch = score > 0 && score < 30;
                      else if (heatmapFilter === 'skipped') isScoreMatch = score === 0 || score === null || score === undefined;

                      // Evaluate Day Type Filter Match (All Days / Mon-Fri / Sat-Sun)
                      const dObj = new Date(dStr + 'T00:00:00');
                      const dayOfWeek = dObj.getDay();
                      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                      let isDayTypeMatch = true;
                      if (dayTypeFilter === 'weekdays') isDayTypeMatch = isWeekday;
                      else if (dayTypeFilter === 'weekends') isDayTypeMatch = isWeekend;

                      const isAnyFilterActive = heatmapFilter !== 'all' || dayTypeFilter !== 'all';
                      const isFullMatch = isScoreMatch && isDayTypeMatch;
                      const filterEffectClass = isFullMatch
                        ? 'opacity-100'
                        : 'opacity-15 grayscale scale-95';

                      const recorded = sum?.loggedHabitIds?.length ?? (sum ? (sum.habitsTotal || activeHabits.length) : 0);
                      const expected = sum?.habitsTotal || activeHabits.length;
                      const isPartial = selectedHabitId === 'all' && isLogged && recorded > 0 && recorded < expected;

                      return (
                        <div
                          key={dStr}
                          onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(40);
                            setSelectedPeriod({
                              type: 'day',
                              title: new Date(dStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                              subtitle: isHinglish ? 'Daily Performance Breakdown' : 'Daily Performance Breakdown',
                              dates: [dStr]
                            });
                          }}
                          className={`${cellHeightClass} ${bgClass} ${isAnyFilterActive ? filterEffectClass : ''} border border-black/5 dark:border-white/5 flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 relative group`}
                        >
                          {showPercentages ? (
                            <span className={`${isLargeTimeframe ? 'text-[7.5px] sm:text-[8.5px]' : 'text-[10px] sm:text-[11px]'} font-black leading-none ${
                              (score <= 35 || score >= 60) ? 'text-white' : 'text-slate-900 dark:text-white'
                            }`}>
                              {isLogged ? `${Math.round(score)}%` : '—'}
                            </span>
                          ) : (
                            <>
                              {isPartial ? (
                                <span className={`${isLargeTimeframe ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-white shadow-2xs`}></span>
                              ) : !isLogged && (
                                <span className={`${isLargeTimeframe ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full bg-slate-900/60 dark:bg-white/60`}></span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // ── 2. WEEKLY HEATMAP VIEW (Significantly Larger Cards) ─────
              if (heatmapGranularity === 'week') {
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {weeklyHeatmapData.map((w) => {
                      const score = w.average;
                      const isLogged = w.daysLogged > 0;
                      const bgClass = getPerfBandClass(score);

                      let isMatch = true;
                      if (heatmapFilter === 'elite_90') isMatch = score >= 90;
                      else if (heatmapFilter === 'target_80') isMatch = score >= 80;
                      else if (heatmapFilter === 'passing_50') isMatch = score >= 50;
                      else if (heatmapFilter === 'struggle_below_50') isMatch = score > 0 && score < 50;
                      else if (heatmapFilter === 'critical_below_30') isMatch = score > 0 && score < 30;
                      else if (heatmapFilter === 'skipped') isMatch = score === 0 || score === null || score === undefined;

                      const filterEffectClass = isMatch ? 'opacity-100' : 'opacity-20 grayscale';

                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(40);
                            setSelectedPeriod({
                              type: 'week',
                              title: w.dateRange,
                              subtitle: isHinglish 
                                ? `Weekly Breakdown (${w.daysLogged}/${w.totalDays} Din Log Hue)` 
                                : `Weekly Breakdown (${w.daysLogged}/${w.totalDays} Days Logged)`,
                              dates: w.dates
                            });
                          }}
                          className={`h-[68px] sm:h-[76px] rounded-2xl p-3 ${bgClass} ${heatmapFilter !== 'all' ? filterEffectClass : ''} border border-black/5 dark:border-white/5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.03] active:scale-95 shadow-2xs`}
                        >
                          {/* Top: Full Clean Date Range (Single line, no W1/W2, no top-right badge) */}
                          <div className="flex items-center">
                            <span className="text-[11px] sm:text-[12px] font-black tracking-wide opacity-90 leading-none truncate">
                              {w.dateRange}
                            </span>
                          </div>

                          {/* Bottom: Big Score % (Left) + Days Logged Count (Right) */}
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl sm:text-2xl font-black leading-none tracking-tight">
                              {isLogged ? `${score}%` : '—'}
                            </span>
                            <span className="text-[10px] sm:text-[10.5px] font-extrabold opacity-85 bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full leading-none">
                              {w.daysLogged}/{w.totalDays} {isHinglish ? 'Din' : 'Days'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // ── 3. MONTHLY HEATMAP VIEW (Hero Dimension Cards) ────────
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {monthlyHeatmapData.map((m) => {
                    const score = m.average;
                    const isLogged = m.daysLogged > 0;
                    const bgClass = getPerfBandClass(score);

                    let isMatch = true;
                    if (heatmapFilter === 'elite_90') isMatch = score >= 90;
                    else if (heatmapFilter === 'target_80') isMatch = score >= 80;
                    else if (heatmapFilter === 'passing_50') isMatch = score >= 50;
                    else if (heatmapFilter === 'struggle_below_50') isMatch = score > 0 && score < 50;
                    else if (heatmapFilter === 'critical_below_30') isMatch = score > 0 && score < 30;
                    else if (heatmapFilter === 'skipped') isMatch = score === 0 || score === null || score === undefined;

                    const filterEffectClass = isMatch ? 'opacity-100' : 'opacity-20 grayscale';

                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(40);
                          setSelectedPeriod({
                            type: 'month',
                            title: m.label,
                            subtitle: isHinglish 
                              ? `Monthly Breakdown (${m.daysLogged}/${m.totalDays} Din Log Hue)` 
                              : `Monthly Breakdown (${m.daysLogged}/${m.totalDays} Days Logged)`,
                            dates: m.dates
                          });
                        }}
                        className={`h-[78px] sm:h-[86px] rounded-2xl p-3.5 ${bgClass} ${heatmapFilter !== 'all' ? filterEffectClass : ''} border border-black/5 dark:border-white/5 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-2xs`}
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-black truncate leading-tight">{m.label}</h4>
                          <span className="text-[10.5px] font-bold opacity-80 mt-1 block">
                            {isHinglish 
                              ? `${m.totalDays} me se ${m.daysLogged} Din Track Hue` 
                              : `${m.daysLogged} of ${m.totalDays} Days Tracked`}
                          </span>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          <span className="text-2xl sm:text-3xl font-black leading-none block">
                            {isLogged ? `${score}%` : '—'}
                          </span>
                          <span className="text-[9.5px] font-bold opacity-75 uppercase tracking-wider">{isHinglish ? 'Month Avg' : 'Month Avg'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Floating Tooltip */}
            {activeTooltip && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 animate-in zoom-in-95 pointer-events-none z-20 flex items-center gap-2">
                <span>{activeTooltip.date}</span>
                <span className="text-emerald-400 font-extrabold">{activeTooltip.score}</span>
              </div>
            )}
          </div>

          {/* Heatmap Legend Under Grid: Less/More, Partial, No Data */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 px-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {/* 1. Score Gradient Intensity Scale (Less -> More) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400">{isHinglish ? 'Kam' : 'Less'}</span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] bg-perf-1" title="0-10%"></span>
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] bg-perf-3" title="21-30%"></span>
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] bg-perf-5" title="41-50%"></span>
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] bg-perf-7" title="61-70%"></span>
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] bg-perf-10" title="91-100%"></span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{isHinglish ? 'Zyada' : 'More'}</span>
            </div>

            {/* 2. Partial & 3. No Data Indicators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] bg-perf-7 flex items-center justify-center shadow-2xs">
                  <span className="w-1 h-1 rounded-full bg-white shadow-2xs"></span>
                </div>
                <span className="text-[11px]">{isHinglish ? 'Adha Tracked' : 'Partial'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[3px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-black/5 dark:border-white/10">
                  <span className="w-1 h-1 rounded-full bg-slate-800 dark:bg-slate-200"></span>
                </div>
                <span className="text-[11px]">{isHinglish ? 'Data Nahi Hai' : 'No Data'}</span>
              </div>
            </div>
          </div>
        </section>
      </div>




      {/* ── SECTION 4 & 5: WEEKLY MOMENTUM & FOCUS AREA (2-COLUMN GRID ON DESKTOP) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Weekly Breakdown Bar Chart */}
        <section className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Weekly Momentum
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Week-Over-Week Averages
              </h3>
            </div>
          </div>

          {/* Horizontal Bars */}
          <div className="space-y-2.5 pt-1">
            {weeklyBreakdown.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-14 shrink-0">
                  {item.label}
                </span>

                {/* Progress Bar (Clickable to view detailed week breakdown) */}
                <div
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setSelectedPeriod({
                      type: 'week',
                      title: `${item.label} (${item.dateRangeStr})`,
                      subtitle: isHinglish ? `Weekly Breakdown (${item.avg}% Avg)` : `Weekly Breakdown (${item.avg}% Avg)`,
                      dates: item.sliceDates
                    });
                  }}
                  className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 flex items-center cursor-pointer group hover:ring-2 hover:ring-blue-500/30 transition-all"
                  title={`Tap to view ${item.label} details (${item.dateRangeStr})`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.isUp ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, item.avg)}%` }}
                  />
                </div>

                {/* Average Score % */}
                <span className="text-xs font-black text-slate-900 dark:text-white w-10 text-right shrink-0">
                  {item.avg}%
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
            Tracking every week sharpens your consistency and reinforces automatic habit loops.
          </p>
        </section>

        {/* Section 5: Weakest Habit Focus Area Alert */}
        {weakestHabit && (
          <section className="bg-gradient-to-br from-rose-50/80 via-amber-50/50 to-orange-50/80 dark:from-rose-950/30 dark:to-amber-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                  <WarningCircle size={18} weight="fill" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                    Focus Area Required
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {weakestHabit.name}
                  </h4>
                </div>
              </div>

              <span className="text-xs font-black text-rose-600 bg-rose-100/80 dark:bg-rose-900/40 px-2.5 py-1 rounded-full">
                Avg {weakestHabit.avgScore}%
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              You’ve logged <strong>{weakestHabit.daysRecorded} of {dateSeries.length} days</strong> for this habit. Focus on logging this consistently to lift your overall trajectory.
            </p>

            <div className="pt-2.5 border-t border-rose-200/50 dark:border-rose-900/40 flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {isHinglish ? 'रिकवरी इनसाइट्स चाहिए?' : 'Need recovery insights?'}
              </span>
              {(realSummaries?.length || 0) < 14 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setShowDiagnoseLockModal(true);
                  }}
                  className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 hover:underline cursor-pointer select-none"
                >
                  <span>Diagnose Habit</span>
                  <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock size={10} weight="fill" />
                    <span>Preview</span>
                  </span>
                  <CaretRight size={13} weight="bold" />
                </button>
              ) : (
                <Link
                  to={`/analytics/diagnose?habitId=${weakestHabit.id}`}
                  className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <span>Diagnose Habit</span>
                  <CaretRight size={13} weight="bold" />
                </Link>
              )}
            </div>
          </section>
        )}
      </div>


      {/* ── SECTION 6: STEADY FIRE (HABIT STREAK & CONSISTENCY UNIFIED CARD) ── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-[24px] p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden space-y-3">
        {/* Card Header with In-Place Habit Dropdown Switcher & Timeframe Pill (Left) and Profile Trophy Wall Link (Right) */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
          {/* Left Cluster: Custom In-App Habit Selector Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                setShowHabitSheet(true);
              }}
              className="flex items-center gap-1.5 px-2.5 h-[28px] rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 transition-all cursor-pointer shadow-2xs shrink-0 max-w-[160px] select-none group"
              title="Tap to switch habit"
            >
              <div 
                className="w-3.5 h-3.5 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: selectedHabitId === 'all' ? '#10b981' : (currentSelectedHabit?.color || '#3b82f6') }}
              >
                {selectedHabitId === 'all' ? <Sparkle size={8} weight="fill" /> : <HabitIcon name={currentSelectedHabit?.icon} size={8} className="text-white" />}
              </div>
              <span className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[95px]">
                {selectedHabitId === 'all' ? 'Overall' : currentSelectedHabit?.name}
              </span>
              <CaretDown size={10} weight="bold" className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5 shrink-0" />
            </button>
          </div>

          {/* Right: Trophy Wall link */}
          <Link
            to="/streak-milestones"
            className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 hover:underline cursor-pointer group shrink-0"
          >
            <Trophy size={13} weight="fill" className="text-amber-500" />
            <span>{isHinglish ? 'Milestones' : 'Milestones'}</span>
            <CaretRight size={11} weight="bold" className="group-hover:translate-x-0.5 transition-transform opacity-70" />
          </Link>
        </div>

        {/* 3 Balanced Responsive Columns (Gamification: Current Streak, Best Streak, Current Milestone Tier) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center pt-0.5">
          
          {/* 1. Left: Current Streak */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner border border-amber-500/20">
              <Flame size={22} weight="fill" className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {streakEngineData.currentStreak}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {isHinglish ? 'din' : 'days'}
                </span>
              </div>
              <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mt-0.5 truncate">
                {isHinglish ? 'सक्रिय लौ' : 'Current Streak'}
              </span>
            </div>
          </div>

          {/* 2. Middle: Best Streak (All-Time Record) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-3 border-x border-slate-100 dark:border-slate-800/80 px-1 sm:px-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner border border-amber-500/20">
              <Crown size={20} weight="fill" className="text-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {streakEngineData.longestStreak}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {isHinglish ? 'din' : 'days'}
                </span>
              </div>
              <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mt-0.5 truncate">
                {isHinglish ? 'बेस्ट स्ट्रीक' : 'Best Streak'}
              </span>
            </div>
          </div>

          {/* 3. Right: Current Milestone Rank (Tap to view Trophy Wall) */}
          <Link
            to="/streak-milestones"
            className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-3 group cursor-pointer"
            title="Tap to view Milestone Trophies"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/15 to-indigo-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-inner border border-purple-500/20 group-hover:scale-105 transition-transform">
              {getMilestoneTierIcon(currentMilestoneTier.title)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-1">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">
                  {currentMilestoneTier.title}
                </span>
                <CaretRight size={10} weight="bold" className="text-purple-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
              <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mt-0.5 truncate">
                {currentMilestoneTier.days > 0 ? `${currentMilestoneTier.days}d Tier` : (isHinglish ? 'वर्तमान स्तर' : 'Current Tier')}
              </span>
            </div>
          </Link>

        </div>

        {/* ── 1ST DASHED DIVIDER LINE (COMPACT & SUBTLE) ── */}
        <div className="w-full pt-0.5 pb-0">
          <svg className="w-full h-[1.5px] text-slate-300 dark:text-slate-700/80" preserveAspectRatio="none">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
        </div>

        {/* ── YOUR STREAK INSIGHTS TITLE & CLEAN STATIC PREVIEW BADGE ── */}
        <div className="flex items-center justify-between gap-2 py-0.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lightbulb size={15} weight="fill" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
              {isHinglish ? 'आपकी स्ट्रीक इनसाइट्स (Your Streak Insights)' : 'Your Streak Insights'}
            </h3>
          </div>

          {/* Clean Static Preview Mode Pill (Shown when < 30 days, No blinking, clean & structured) */}
          {(realSummaries?.length || 0) < 30 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-[10px] font-black tracking-wider uppercase select-none">
              <Lock size={11} weight="bold" className="text-amber-500" />
              <span>{isHinglish ? 'सैंपल प्रीव्यू • 30 दिन पर अनलॉक' : 'Preview Mode • Unlocks at 30D'}</span>
            </div>
          )}
        </div>

        {/* ── 2ND DASHED DIVIDER LINE (COMPACT & SUBTLE) ── */}
        <div className="w-full pt-0 pb-0.5">
          <svg className="w-full h-[1.5px] text-slate-300 dark:text-slate-700/80" preserveAspectRatio="none">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
        </div>

        {/* ── 3 INSIGHT CARDS GRID WITH 30-DAY BLUR & LOCK OVERLAY ── */}
        <div className="relative">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${(realSummaries?.length || 0) < 30 ? 'filter blur-[3px] select-none pointer-events-none opacity-50' : ''}`}>
          
          {/* Card 1: Best Day */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Star size={14} weight="fill" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {isHinglish ? 'सर्वश्रेष्ठ दिन' : 'Best Day'}
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {dayOfWeekAnalysis.bestDay.full}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {isHinglish
                  ? `आप ${dayOfWeekAnalysis.bestDay.full} को सबसे अधिक नियमित रहते हैं।`
                  : `You're most consistent on ${dayOfWeekAnalysis.bestDay.name}s.`}
              </p>
            </div>

            {/* Day Bars (Mon to Sun) */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-end justify-between gap-1.5 h-12">
              {dayOfWeekAnalysis.orderedDays.map((d, i) => {
                const isTop = d.name === dayOfWeekAnalysis.bestDay.name;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isTop
                          ? 'bg-emerald-500 shadow-xs'
                          : 'bg-emerald-500/20 dark:bg-emerald-500/20'
                      }`}
                      style={{ height: `${isTop ? 100 : Math.max(20, d.avg * 0.7)}%` }}
                    />
                    <span className={`text-[9px] font-bold ${isTop ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-400'}`}>
                      {d.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Vulnerable Day */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <Warning size={14} weight="fill" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {isHinglish ? 'संवेदनशील दिन' : 'Vulnerable Day'}
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {dayOfWeekAnalysis.vulnerableDay.full}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {isHinglish
                  ? `आप ${dayOfWeekAnalysis.vulnerableDay.full} को सबसे ज़्यादा आदतें मिस करते हैं।`
                  : `You miss habits most on ${dayOfWeekAnalysis.vulnerableDay.name}s.`}
              </p>
            </div>

            {/* Day Bars (Mon to Sun) */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-end justify-between gap-1.5 h-12">
              {dayOfWeekAnalysis.orderedDays.map((d, i) => {
                const isVuln = d.name === dayOfWeekAnalysis.vulnerableDay.name;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isVuln
                          ? 'bg-rose-500 shadow-xs'
                          : 'bg-rose-500/20 dark:bg-rose-500/20'
                      }`}
                      style={{ height: `${isVuln ? 100 : Math.max(20, d.avg * 0.7)}%` }}
                    />
                    <span className={`text-[9px] font-bold ${isVuln ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-400'}`}>
                      {d.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Weekday vs Weekend */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Calendar size={14} weight="fill" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {isHinglish ? 'वीकडे बनाम वीकेंड' : 'Weekday vs Weekend'}
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {weekdayVsWeekendAnalysis.headline}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {weekdayVsWeekendAnalysis.subtitle}
              </p>
            </div>

            {/* 2 Comparative Comparison Bars (Mon-Fri vs Sat-Sun) */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-end justify-between gap-3 h-12">
              {/* Mon-Fri Bar */}
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full rounded-t-md bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 shadow-xs"
                  style={{ height: `${Math.max(15, weekdayVsWeekendAnalysis.weekdayAvg)}%` }}
                />
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 truncate">
                  Mon–Fri ({weekdayVsWeekendAnalysis.weekdayAvg}%)
                </span>
              </div>

              {/* Sat-Sun Bar */}
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full rounded-t-md bg-amber-500 dark:bg-amber-400 transition-all duration-500 shadow-xs"
                  style={{ height: `${Math.max(15, weekdayVsWeekendAnalysis.weekendAvg)}%` }}
                />
                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 truncate">
                  Sat–Sun ({weekdayVsWeekendAnalysis.weekendAvg}%)
                </span>
              </div>
            </div>
          </div>
        </div>

          {/* 30-Day Lock Overlay for Streak Insights */}
          {(realSummaries?.length || 0) < 30 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-4 bg-white/75 dark:bg-[#0b0f19]/85 backdrop-blur-xs rounded-3xl animate-in fade-in duration-150">
              <div className="w-full max-w-[320px] bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3.5 text-center">
                
                {/* Lock Icon */}
                <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Lock size={20} weight="fill" />
                </div>

                {/* Text Content with Clean Alignment */}
                <div className="space-y-1">
                  <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    {isHinglish ? '30 दिन के बाद अनलॉक होगा' : 'Unlocks After 30 Days'}
                  </h4>
                  <p className="text-[11.5px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-1">
                    {isHinglish 
                      ? 'आपकी आदतों का असली Best Day, Vulnerable Day और वीकेंड बनाम वीकडे पैटर्न 30 दिनों का डेटा पूरा होने के बाद अनलॉक होगा।'
                      : 'Authentic Best Day, Vulnerable Day, and Weekend vs Weekday rhythm anomalies unlock after 30 total logged days.'}
                  </p>
                </div>

                {/* Progress Box */}
                <div className="space-y-1.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span>{isHinglish ? 'प्रोग्रेस' : 'Progress'}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-black">
                      {realSummaries?.length || 0} / 30 {isHinglish ? 'दिन' : 'Days'} ({Math.max(1, 30 - (realSummaries?.length || 0))} {isHinglish ? 'दिन बाकी' : 'days left'})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(5, Math.min(100, Math.round(((realSummaries?.length || 0) / 30) * 100)))}%` }}
                    />
                  </div>
                </div>

                {/* Explore Sample Preview Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    navigate('/analytics/diagnose?habitId=sample_workout');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Sparkle size={13} weight="fill" />
                  <span>{isHinglish ? 'सैंपल प्रीव्यू देखें (Explore Sample)' : 'Explore Sample Preview'}</span>
                </button>

              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM SHEET / MODAL: SELECT HABIT SCOPE ───────────────────────── */}
      {showHabitSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowHabitSheet(false)}
        >
          <div
            className="bg-white dark:bg-[#151a26] rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 text-slate-800 dark:text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-base text-slate-900 dark:text-white">
                Select Habit Scope
              </h4>
              <button
                onClick={() => setShowHabitSheet(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {/* All Habits Option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedHabitId('all');
                  setShowHabitSheet(false);
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedHabitId === 'all'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-300 dark:border-emerald-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkle size={13} weight="fill" />
                  </div>
                  <div>
                    <span className="text-sm block">All Habits (Composite)</span>
                    <span className="text-[10px] text-slate-400 font-medium">Holistic Overview</span>
                  </div>
                </div>
                {selectedHabitId === 'all' && (
                  <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                )}
              </button>

              {/* Each Individual Habit */}
              {activeHabits.map(h => {
                const isSelected = selectedHabitId === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setSelectedHabitId(h.id);
                      setShowHabitSheet(false);
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-300 dark:border-emerald-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: h.color }}
                      >
                        <HabitIcon name={h.icon} size={13} />
                      </div>
                      <div>
                        <span className="text-sm block">{h.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium capitalize">
                          {h.scoringType || 'habit'}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── PERIOD DETAILS MODAL (DAY / WEEK / MONTH IN-MEMORY AGGREGATION - 0 EXTRA READS) ────────────────────── */}
      {selectedPeriod && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedPeriod(null)}
        >
          <div 
            className="bg-white dark:bg-[#131722] w-full max-w-[340px] sm:max-w-[360px] rounded-[24px] overflow-hidden shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Icon name="calendar_today" className="text-[15px]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {selectedPeriod.title}
                  </h3>
                  <span className="text-[10px] font-medium text-slate-400">{selectedPeriod.subtitle}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPeriod(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-3.5 sm:p-4 overflow-y-auto max-h-[58vh] custom-scrollbar flex-grow space-y-3">
              {(() => {
                const dates = selectedPeriod.dates;
                const summaries = dates.map(dStr => summaryMap.get(dStr)).filter(Boolean);
                const isSelectedHabit = selectedHabitId !== 'all';
                const currentHabitObj = activeHabits.find(h => h.id === selectedHabitId);

                const overallScores = summaries
                  .map(s => isSelectedHabit ? s.habitScores?.[selectedHabitId] : s.overallScore)
                  .filter(score => score !== undefined && score !== null);

                if (summaries.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                        <Icon name="event_busy" className="text-[22px] text-slate-400" />
                      </div>
                      <p className="text-slate-900 dark:text-white font-bold text-sm">No Data Logged</p>
                      <p className="text-slate-400 text-xs mt-0.5">You didn't log any data on this date.</p>
                    </div>
                  );
                }

                const mainScore = overallScores.length > 0 
                  ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length)
                  : 0;
                const isMultiDay = dates.length > 1;

                // Format raw unit value for single date
                const singleSummary = summaries[0];
                let formattedRawVal = '';
                if (isSelectedHabit && currentHabitObj && singleSummary) {
                  const rawVal = singleSummary.habitValues?.[selectedHabitId];
                  if (currentHabitObj.scoringType === 'time') {
                    formattedRawVal = formatTimeMinutes(rawVal);
                  } else if (currentHabitObj.scoringType === 'duration') {
                    formattedRawVal = formatDurationMinutes(rawVal);
                  } else if (currentHabitObj.scoringType === 'binary') {
                    formattedRawVal = rawVal === 1 ? 'Free / Done' : 'Missed';
                  } else if (rawVal !== undefined && rawVal !== null) {
                    formattedRawVal = `${rawVal} ${currentHabitObj.unit || ''}`;
                  }
                }

                return (
                  <div className="flex flex-col gap-3">
                    {/* Top Score Banner */}
                    <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isSelectedHabit 
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/50'
                        : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isSelectedHabit && currentHabitObj && (
                          <div className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: currentHabitObj.color }}>
                            <HabitIcon name={currentHabitObj.icon} size={14} className="text-white" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                            {isSelectedHabit ? (currentHabitObj?.name || 'Selected Habit') : (isMultiDay ? 'Period Average' : 'Overall Performance')}
                          </span>
                          {formattedRawVal && (
                            <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                              {formattedRawVal}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xl font-black leading-none ${
                          isSelectedHabit ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {mainScore}%
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-400 block mt-0.5">
                          {mainScore >= 80 ? 'Target Hit' : mainScore >= 50 ? 'Passing' : 'Needs Focus'}
                        </span>
                      </div>
                    </div>

                    {/* Habits List Breakdown */}
                    <div>
                      <div className="flex items-center justify-between mb-2 px-0.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">All 7 Habits Breakdown</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {summaries.length} Day Logged
                        </span>
                      </div>

                      <div className="flex flex-col divide-y divide-dashed divide-slate-100 dark:divide-slate-800/80">
                        {activeHabits.map(h => {
                          const habitScores = summaries
                            .map(s => s.habitScores?.[h.id])
                            .filter(score => score !== undefined && score !== null);
                          const isRecorded = habitScores.length > 0;
                          const avgScore = isRecorded ? Math.round(habitScores.reduce((a, b) => a + b, 0) / habitScores.length) : null;
                          const isSelected = h.id === selectedHabitId;

                          // Raw value formatting for list item
                          const singleVal = singleSummary?.habitValues?.[h.id];
                          let valStr = '';
                          if (singleVal !== undefined && singleVal !== null) {
                            if (h.scoringType === 'time') valStr = formatTimeMinutes(singleVal);
                            else if (h.scoringType === 'duration') valStr = formatDurationMinutes(singleVal);
                            else if (h.scoringType === 'binary') valStr = singleVal === 1 ? 'Free' : 'Missed';
                            else valStr = `${singleVal}`;
                          }

                          if (!isRecorded || avgScore === null) {
                            return (
                              <div key={h.id} className="py-2 px-1 flex items-center justify-between gap-2.5 opacity-60">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: h.color }}>
                                    <HabitIcon name={h.icon} size={12} className="text-white" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{h.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                                    Not Logged
                                  </span>
                                  <span className="text-xs font-bold text-slate-300 dark:text-slate-600 w-5 text-right">—</span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={h.id} className={`py-2 px-1 flex items-center justify-between gap-2.5 rounded-xl transition-all ${
                              isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30 px-2 my-0.5 border border-indigo-200/50 dark:border-indigo-900/40' : ''
                            }`}>
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: h.color }}>
                                  <HabitIcon name={h.icon} size={12} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                  <span className={`text-xs truncate block ${isSelected ? 'font-black text-indigo-900 dark:text-indigo-200' : 'font-bold text-slate-900 dark:text-white'}`}>
                                    {h.name} {isSelected && <span className="text-[9px] font-black uppercase text-indigo-500 ml-1">(Selected)</span>}
                                  </span>
                                  {valStr && (
                                    <span className="text-[9.5px] font-semibold text-slate-400 block">
                                      {valStr}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="w-12 sm:w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div className={`h-full rounded-full ${
                                    avgScore >= 70 ? 'bg-emerald-500' : avgScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} style={{ width: `${Math.max(5, avgScore)}%` }}></div>
                                </div>
                                <span className={`text-xs font-black w-8 text-right ${
                                  avgScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : avgScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                                }`}>{avgScore}%</span>
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

      {/* ── HEATMAP CONTROL HUB MODAL (IDEA 1) ─────────────────────────── */}
      {showHeatmapControlModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 w-full max-w-[340px] rounded-[24px] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Icon name="tune" className="text-[16px]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {isHinglish ? 'हीटमैप कंट्रोल्स' : 'Heatmap Controls'}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">
                    {isHinglish ? 'फ़िल्टर्स और लेआउट' : 'Filters & Visuals'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHeatmapControlModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* 1. Day Type Filter (All Days / Weekdays / Weekends) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isHinglish ? 'दिन का प्रकार (Day Type)' : 'Day Type Filter'}
                </span>
                {(dayTypeFilter !== 'all' || heatmapFilter !== 'all') && (
                  <button
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      setDayTypeFilter('all');
                      setHeatmapFilter('all');
                    }}
                    className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isHinglish ? 'रीसेट ऑल' : 'Reset All'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setDayTypeFilter('all');
                  }}
                  className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    dayTypeFilter === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? 'All Days' : 'All Days'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setDayTypeFilter(prev => prev === 'weekdays' ? 'all' : 'weekdays');
                  }}
                  className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    dayTypeFilter === 'weekdays'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  Mon–Fri
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setDayTypeFilter(prev => prev === 'weekends' ? 'all' : 'weekends');
                  }}
                  className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    dayTypeFilter === 'weekends'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  Sat–Sun
                </button>
              </div>
            </div>

            {/* 2. Score Boundary Filters */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isHinglish ? 'स्कोर रेंज फ़िल्टर' : 'Score Range Filter'}
                </span>
                {heatmapFilter !== 'all' && (
                  <button
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      setHeatmapFilter('all');
                    }}
                    className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isHinglish ? 'रीसेट फ़िल्टर' : 'Reset Filter'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {(() => {
                  let elite = 0, target = 0, passing = 0, struggle = 0, critical = 0, skipped = 0;
                  let filteredCount = 0;
                  dateSeries.forEach(dStr => {
                    const dObj = new Date(dStr + 'T00:00:00');
                    const dayOfWeek = dObj.getDay();
                    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    if (dayTypeFilter === 'weekdays' && !isWeekday) return;
                    if (dayTypeFilter === 'weekends' && !isWeekend) return;

                    filteredCount++;
                    const sum = summaryMap.get(dStr);
                    const score = selectedHabitId === 'all'
                      ? (sum?.overallScore ?? 0)
                      : (sum?.habitScores?.[selectedHabitId] ?? 0);
                    if (score >= 90) elite++;
                    if (score >= 80) target++;
                    if (score >= 50) passing++;
                    if (score > 0 && score < 50) struggle++;
                    if (score > 0 && score < 30) critical++;
                    if (score === 0 || score === null || score === undefined) skipped++;
                  });

                  return [
                    { id: 'all', label: isHinglish ? 'All Match' : 'All Match', badge: `${filteredCount}d` },
                    { id: 'elite_90', label: 'Elite ≥ 90%', badge: `${elite}d` },
                    { id: 'target_80', label: 'High ≥ 80%', badge: `${target}d` },
                    { id: 'passing_50', label: 'Passing ≥ 50%', badge: `${passing}d` },
                    { id: 'struggle_below_50', label: 'Struggle < 50%', badge: `${struggle}d` },
                    { id: 'critical_below_30', label: 'Critical < 30%', badge: `${critical}d` },
                    { id: 'skipped', label: isHinglish ? 'Skipped (0%)' : 'Skipped (0%)', badge: `${skipped}d` },
                  ].map((f) => {
                    const isActive = heatmapFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(30);
                          if (f.id === 'all') {
                            setHeatmapFilter('all');
                          } else {
                            setHeatmapFilter(prev => prev === f.id ? 'all' : f.id);
                          }
                        }}
                        className={`p-2 rounded-xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-[11px] font-bold truncate">{f.label}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                            : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400'
                        }`}>
                          {f.badge}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 2. Visual Option: Show Score Percentages */}
            <div
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(40);
                setShowPercentages(prev => !prev);
              }}
              className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer select-none group"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {isHinglish ? 'स्क्वेयर्स पर स्कोर % दिखाएं' : 'Show Score % on Squares'}
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                  {isHinglish ? 'हर दिन के सेल पर पर्सेंटेज दिखाएं' : 'Display percentage on each day cell'}
                </div>
              </div>
              <div
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 pointer-events-none ${
                  showPercentages ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  showPercentages ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </div>

            {/* 3. Daily Layout Style (Continuous Stream vs Month-Wise Calendar Blocks) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isHinglish ? 'Daily Layout Style' : 'Daily Layout Style'}
              </div>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setHeatmapLayout('continuous');
                  }}
                  className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    heatmapLayout === 'continuous'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? 'Continuous Stream' : 'Continuous Stream'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setHeatmapLayout('month_blocks');
                  }}
                  className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    heatmapLayout === 'month_blocks'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? 'Month-Wise Blocks' : 'Month-Wise Blocks'}
                </button>
              </div>
            </div>

            {/* 4. View Granularity (Daily / Weekly / Monthly) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isHinglish ? 'View Granularity' : 'View Granularity'}
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setHeatmapGranularity('day');
                  }}
                  className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    heatmapGranularity === 'day'
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? 'Daily' : 'Daily'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setHeatmapGranularity('week');
                  }}
                  className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    heatmapGranularity === 'week'
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? 'Weekly' : 'Weekly'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setHeatmapGranularity('month');
                  }}
                  className={`py-1.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    heatmapGranularity === 'month'
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? 'Monthly' : 'Monthly'}
                </button>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                setShowHeatmapControlModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              {isHinglish ? 'लागू करें और हो गया' : 'Apply & Done'}
            </button>
          </div>
        </div>
      )}

      {/* ── CHART CONTROL HUB MODAL (VELOCITY CONTROLS) ─────────────────────────── */}
      {showChartControlModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 w-full max-w-[340px] rounded-[24px] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icon name="tune" className="text-[16px]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {isHinglish ? 'चार्ट कंट्रोल्स' : 'Velocity Chart Controls'}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">
                    {isHinglish ? 'स्मूथिंग और ट्रेंडलाइन्स' : 'Smoothing & Trendlines'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChartControlModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* 1. Data Metric Toggle: Score % vs Unit-Wise */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isHinglish ? 'Data Metric' : 'Data Metric'}
                </span>
                {chartMetricType !== 'score' && selectedHabitId !== 'all' && (
                  <button
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      setChartMetricType('score');
                      setShowOverallUnitHint(false);
                    }}
                    className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isHinglish ? 'रीसेट' : 'Reset'}
                  </button>
                )}
              </div>
              
              {/* 2-Option Segmented Toggle (Always Visible) */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-center">
                {/* Left Button: Score % */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setChartMetricType('score');
                    setShowOverallUnitHint(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartMetricType === 'score' || selectedHabitId === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  Score %
                </button>

                {/* Right Button: Unit-Wise (Locked when Overall is active) */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(35);
                    if (selectedHabitId === 'all') {
                      setShowOverallUnitHint(true);
                    } else {
                      setChartMetricType('unit');
                      setShowOverallUnitHint(false);
                    }
                  }}
                  className={`py-2 rounded-lg text-xs transition-all cursor-pointer truncate px-1.5 flex items-center justify-center gap-1 ${
                    selectedHabitId === 'all'
                      ? 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold opacity-75'
                      : chartMetricType === 'unit'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                  title={selectedHabitId === 'all' ? 'Overall only uses 0-100% composite score' : 'View in actual units'}
                >
                  <span>Unit-Wise</span>
                  {selectedHabitId !== 'all' && currentSelectedHabit?.unit && (
                    <span className="text-[10px] opacity-80">({currentSelectedHabit.unit})</span>
                  )}
                </button>
              </div>

              {/* Informative Hint Banner when tapping Unit-Wise on Overall */}
              {showOverallUnitHint && selectedHabitId === 'all' && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] font-bold leading-relaxed flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <Sparkle size={14} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block text-amber-950 dark:text-amber-100">
                      {isHinglish ? 'Overall score 0–100% ही होता है' : 'Overall only uses 0–100% composite score'}
                    </span>
                    <span className="text-[10px] font-semibold opacity-90 block mt-0.5">
                      {isHinglish 
                        ? 'इसमें कोई unit नहीं होती। Unit-wise चार्ट देखने के लिए ऊपर हैबिट ड्रॉपडाउन से कोई खास हैबिट (उदा. Pushups, Water) चुनें।' 
                        : 'Overall has no unit. Select an individual habit (e.g. Pushups, Water) from habit pills to view unit-wise.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Curve Smoothing Mode (Compact 3-Segment Button Row) */}
            <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isHinglish ? 'कर्व डिस्प्ले' : 'Curve Display'}
                </span>
                {chartTrendMode !== 'raw' && (
                  <button
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      setChartTrendMode('raw');
                    }}
                    className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isHinglish ? 'रीसेट' : 'Reset'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setChartTrendMode('raw');
                  }}
                  className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartTrendMode === 'raw'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? 'Daily Raw' : 'Daily Raw'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setChartTrendMode('7d_ma');
                  }}
                  className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartTrendMode === '7d_ma'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? '7D Trend' : '7D Trend'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setChartTrendMode('both');
                  }}
                  className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartTrendMode === 'both'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                  }`}
                >
                  {isHinglish ? 'Both Overlaid' : 'Both Overlaid'}
                </button>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                setShowChartControlModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              {isHinglish ? 'लागू करें और हो गया' : 'Apply & Done'}
            </button>
          </div>
        </div>
      )}

      {/* ── QUICK HABIT SWITCHER MODAL (ZERO SCROLL NEEDED) ─────────────────────────── */}
      {showHabitSheet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 w-full max-w-[340px] rounded-[24px] p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkle size={14} weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {isHinglish ? 'हैबिट बदलें' : 'Switch Habit'}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400">
                    {isHinglish ? 'कोई भी हैबिट चुनें' : 'Select any habit to inspect'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHabitSheet(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-0.5">
              {/* Overall Option */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(30);
                  setSelectedHabitId('all');
                  setShowHabitSheet(false);
                }}
                className={`w-full p-2.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                  selectedHabitId === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkle size={13} weight="fill" />
                  </div>
                  <span className="text-xs font-black truncate">
                    {isHinglish ? 'Overall Composite' : 'Overall Composite'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-black">{overallStat.avgScore}%</span>
                  {selectedHabitId === 'all' && (
                    <CheckCircle size={14} weight="fill" className="text-emerald-400 dark:text-emerald-600 ml-1" />
                  )}
                </div>
              </button>

              {/* Individual Habits */}
              {habitStats.map(h => {
                const isSelected = selectedHabitId === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      setSelectedHabitId(h.id);
                      setShowHabitSheet(false);
                    }}
                    className={`w-full p-2.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs" style={{ backgroundColor: h.color }}>
                        <HabitIcon name={h.icon} size={13} className="text-white" />
                      </div>
                      <span className="text-xs font-black truncate">{h.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black">{h.avgScore}%</span>
                      {isSelected && (
                        <CheckCircle size={14} weight="fill" className="text-emerald-400 dark:text-emerald-600 ml-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. MASTER ANALYTICS & SCORING GUIDE MODAL ── */}
      {showWeightedInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ChartLineUp size={18} weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {isHinglish ? 'एनालिटिक्स और स्कोरिंग गाइड' : 'Analytics & Scoring Guide'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400">
                      {isHinglish ? 'स्मार्ट कैलकुलेशन और मेट्रिक्स' : 'Smart calculations & metric insights'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(25);
                    setShowWeightedInfoModal(false);
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Close"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              {/* 2 Sleek Black & White Segmented Toggle Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 gap-1 select-none">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    setGuideModalTab('weighted');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-black tracking-tight transition-all cursor-pointer truncate ${
                    guideModalTab === 'weighted'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isHinglish ? 'वेटेड एवरेज' : 'Weighted Average'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    setGuideModalTab('kpis');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-black tracking-tight transition-all cursor-pointer truncate ${
                    guideModalTab === 'kpis'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isHinglish ? 'KPIs Explained' : 'KPIs Explained'}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar">
              
              {/* ── TAB 1: WEIGHTED AVERAGE CONTENT (ACCORDION TOGGLES 1, 2, 3) ── */}
              {guideModalTab === 'weighted' && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  {/* Traditional Average Comparison Box */}
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-extrabold text-amber-700 dark:text-amber-400 text-xs">
                        <Icon name="warning" className="text-[14px]" />
                        <span>Traditional Average</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {isHinglish ? 'Dusre trackers' : 'Other trackers'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 leading-snug">
                      <p>• {isHinglish ? <>Har habit ko <strong className="text-amber-600 dark:text-amber-400 font-bold">barabar weight</strong> milta hai (1m task = 1h workout).</> : <>Every habit gets <strong className="text-amber-600 dark:text-amber-400 font-bold">equal weight</strong> (1-min task = 1-hr workout).</>}</p>
                      <p>• {isHinglish ? <>Missed habits <strong className="text-rose-600 dark:text-rose-400 font-bold">0% penalty</strong> ke sath score niche gira deti hain.</> : <>Missed habits drag your score down with a <strong className="text-rose-600 dark:text-rose-400 font-bold">0% penalty</strong>.</>}</p>
                    </div>
                  </div>

                  {/* 3 Single-Open Accordion Toggles */}
                  <div className="space-y-1.5 pt-0.5">

                    {/* Toggle 1 — Priority Multipliers */}
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 overflow-hidden transition-all">
                      <div 
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(15);
                          setOpenWeightedSection(prev => prev === '1' ? null : '1');
                        }}
                        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-100/70 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {isHinglish ? 'Priority Multipliers' : 'Priority Multipliers'}
                          </h4>
                        </div>
                        <div className={'text-slate-400 transition-transform duration-200 ' + (openWeightedSection === '1' ? 'rotate-180 text-indigo-600' : '')}>
                          <CaretDown size={14} weight="bold" />
                        </div>
                      </div>

                      {openWeightedSection === '1' && (
                        <div className="px-2.5 pb-3 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 animate-in fade-in duration-150">
                          <p>
                            • {isHinglish ? (
                              <>Aapki <span className="font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">P1</span>, <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">P2</span>, <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">P3</span> priority habits score ko drive karti hain, jabki baaki habits standard rehti hain.</>
                            ) : (
                              <>Your <span className="font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">P1</span>, <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">P2</span>, <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">P3</span> priority habits heavily drive your daily score, while others stay standard.</>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isHinglish 
                              ? 'High-priority kaam poora hone par daily score tezi se boost hota hai.' 
                              : 'Completing high-priority habits provides a substantially larger positive surge to your weighted score.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Toggle 2 — Track What Matters */}
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 overflow-hidden transition-all">
                      <div 
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(15);
                          setOpenWeightedSection(prev => prev === '2' ? null : '2');
                        }}
                        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-100/70 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {isHinglish ? 'Track What Matters' : 'Track What Matters'}
                          </h4>
                        </div>
                        <div className={'text-slate-400 transition-transform duration-200 ' + (openWeightedSection === '2' ? 'rotate-180 text-teal-600' : '')}>
                          <CaretDown size={14} weight="bold" />
                        </div>
                      </div>

                      {openWeightedSection === '2' && (
                        <div className="px-2.5 pb-3 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 animate-in fade-in duration-150">
                          <p>• {isHinglish ? <>Daily score sirf unhi habits ka banta hai jo aapne <strong className="text-emerald-600 dark:text-emerald-400 font-bold">complete & log</strong> kari hain.</> : <>Daily score averages only the habits you <strong className="text-emerald-600 dark:text-emerald-400 font-bold">completed & logged</strong>.</>}</p>
                          <p>• {isHinglish ? <>Unlogged habits <strong className="text-rose-600 dark:text-rose-400 font-bold">0% ka jhootha score</strong> nahi banati, jo kiya wahi dikhta hai.</> : <>Unlogged habits do <strong className="text-rose-600 dark:text-rose-400 font-bold">not fake a 0% score</strong>, protecting what you actually accomplished.</>}</p>
                        </div>
                      )}
                    </div>

                    {/* Toggle 3 — How Score Works */}
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 overflow-hidden transition-all">
                      <div 
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(15);
                          setOpenWeightedSection(prev => prev === '3' ? null : '3');
                        }}
                        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-100/70 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {isHinglish ? 'How Score Works' : 'How Score Works'}
                          </h4>
                        </div>
                        <div className={'text-slate-400 transition-transform duration-200 ' + (openWeightedSection === '3' ? 'rotate-180 text-indigo-600' : '')}>
                          <CaretDown size={14} weight="bold" />
                        </div>
                      </div>

                      {openWeightedSection === '3' && (
                        <div className="px-2.5 pb-3 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] space-y-2 animate-in fade-in duration-150">
                          {/* Row 1: Completed Habits */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              {isHinglish ? 'Completed Habits' : 'Completed Habits'}
                            </span>
                            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 flex-1 min-w-[16px] opacity-70"></div>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                              {isHinglish ? 'Scored (Target %)' : 'Scored (Target %)'}
                            </span>
                          </div>

                          {/* Row 2: Missed Habits */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              {isHinglish ? 'Missed Habits' : 'Missed Habits'}
                            </span>
                            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 flex-1 min-w-[16px] opacity-70"></div>
                            <span className="font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                              {isHinglish ? '0 Nahi Count Hota' : 'Not Counted as 0'}
                            </span>
                          </div>

                          {/* Row 3: Top Priorities */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              {isHinglish ? 'Top Priorities' : 'Top Priorities'}
                            </span>
                            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 flex-1 min-w-[16px] opacity-70"></div>
                            <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                              {isHinglish ? 'Higher Impact (3×)' : 'Higher Impact (3×)'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* ── TAB 2: KPIS EXPLAINED CONTENT ── */}
              {guideModalTab === 'kpis' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  {/* 1. Resilience Score */}
                  <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck size={16} weight="fill" className="text-emerald-500 shrink-0" />
                        <h4 className="text-xs font-black">
                          {isHinglish ? '1. रेज़िलिएंस स्कोर (Resilience Score)' : '1. Resilience Score'}
                        </h4>
                      </div>
                      <Link
                        to={selectedHabitId === 'all' ? '/analytics/recovery' : `/analytics/recovery?habitId=${selectedHabitId}`}
                        onClick={() => setShowWeightedInfoModal(false)}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <span>{isHinglish ? 'रिकवरी हब खोलें' : 'Open Recovery Hub'}</span>
                        <CaretRight size={10} weight="bold" />
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {isHinglish
                        ? 'जब कोई आदत मिस होती है, तो आप 24–48 घंटे में कितनी तेज़ी से वापसी करते हैं। यह आपकी बाउंस-बैक क्षमता मापता है।'
                        : 'Measures how quickly you bounce back within 24–48 hours after missing a day.'}
                    </p>
                  </div>

                  {/* 2. Consistency Rate */}
                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                      <Target size={16} weight="fill" className="text-indigo-500 shrink-0" />
                      <h4 className="text-xs font-black">
                        {isHinglish ? '2. कंसिस्टेंसी दर (Consistency Rate)' : '2. Consistency Rate'}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {isHinglish
                        ? `चुने गए टाइमफ्रेम में आप कितने प्रतिशत दिन सक्रिय रहे और डेटा लॉग किया (${activeDaysCount}/${dateSeries.length} दिन)।`
                        : `The percentage of total days you actively logged your progress in the selected window (${activeDaysCount}/${dateSeries.length} days).`}
                    </p>
                  </div>

                  {/* 3. Target Hit Rate */}
                  <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                      <Star size={16} weight="fill" className="text-amber-500 shrink-0" />
                      <h4 className="text-xs font-black">
                        {isHinglish ? '3. लक्ष्य सिद्धि दर (Target Hit Rate)' : '3. Target Hit Rate'}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {isHinglish
                        ? `कुल सक्रिय दिनों में से कितने दिन आपने 70%+ स्कोर का हाई-क्वालिटी बेंचमार्क पार किया (${targetHitStats.count}/${targetHitStats.total} दिन)।`
                        : `The percentage of days where your execution reached or exceeded the 70% benchmark (${targetHitStats.count}/${targetHitStats.total} days).`}
                    </p>
                  </div>
                </div>
              )}

              {/* Got It Button (Inside content flow, not sticky) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    setShowWeightedInfoModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {isHinglish ? 'समझ आ गया' : 'Okay, Got It'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── 14-DAY HABIT DIAGNOSTICS LOCK MODAL ── */}
      {showDiagnoseLockModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lock size={16} weight="fill" />
                </div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {isHinglish ? '14 दिन का डेटा आवश्यक' : '14 Days of Data Required'}
                </h4>
              </div>
              <button 
                onClick={() => setShowDiagnoseLockModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isHinglish 
                ? 'कमज़ोर आदतों का रूट-कॉज़ डायग्नोस्टिक्स और फ्रिक्शन एनालिसिस अनलॉक करने के लिए कम से कम 14 दिनों का डेटा आवश्यक है।'
                : 'Habit root-cause diagnostics, slump analysis, and friction reports require at least 14 days of tracked habit data.'}
            </p>

            {/* Progress counter */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>{isHinglish ? 'आपकी प्रोग्रेस' : 'Your Progress'}</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {realSummaries?.length || 0} / 14 {isHinglish ? 'दिन' : 'Days'} ({Math.max(1, 14 - (realSummaries?.length || 0))} {isHinglish ? 'दिन शेष' : 'days left'})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, Math.round(((realSummaries?.length || 0) / 14) * 100)))}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDiagnoseLockModal(false);
                  navigate('/analytics/diagnose?habitId=sample_workout');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkle size={13} weight="fill" />
                <span>{isHinglish ? 'सैंपल प्रीव्यू देखें (Peek Preview)' : 'Explore Sample Preview'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowDiagnoseLockModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
              >
                {isHinglish ? 'बंद करें' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── RESILIENCE HUB 14-DAY LOCK MODAL ── */}
      {showResilienceLockModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lock size={16} weight="fill" />
                </div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {isHinglish ? '14 दिन का डेटा आवश्यक' : '14 Days of Data Required'}
                </h4>
              </div>
              <button 
                onClick={() => setShowResilienceLockModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isHinglish 
                ? 'आपकी आदतों में आने वाली रुकावटों (Slumps) और उनके बाद वापसी (Bounce-Back) का सटीक पैटर्न पहचानने के लिए कम से कम 14 दिनों का डेटा आवश्यक है।'
                : 'Recognizing your true habit slump recovery and bounce-back speed requires at least 14 days of tracked logs.'}
            </p>

            {/* Progress counter */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>{isHinglish ? 'आपकी प्रोग्रेस' : 'Your Progress'}</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {realSummaries?.length || 0} / 14 {isHinglish ? 'दिन' : 'Days'} ({Math.max(1, 14 - (realSummaries?.length || 0))} {isHinglish ? 'दिन शेष' : 'days left'})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, Math.round(((realSummaries?.length || 0) / 14) * 100)))}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowResilienceLockModal(false);
                  navigate(selectedHabitId === 'all' ? '/analytics/recovery' : `/analytics/recovery?habitId=${selectedHabitId}`);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkle size={13} weight="fill" />
                <span>{isHinglish ? 'सैंपल प्रीव्यू देखें (Peek Preview)' : 'Explore Sample Preview'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowResilienceLockModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
              >
                {isHinglish ? 'बंद करें' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 6. CUSTOM IN-APP TIMEFRAME SELECTOR MODAL (CENTERED & ABOVE NAV) ── */}
      {showTimeframeModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowTimeframeModal(false)}
        >
          <div 
            className="w-full max-w-[340px] sm:max-w-[360px] bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Calendar size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isHinglish ? 'टाइमफ्रेम चुनें' : 'Select Timeframe'}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400">
                    {isHinglish ? 'एनालिटिक्स और चार्ट के लिए अवधि' : 'Time window for analytics'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTimeframeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Preset Options Grid (7, 14, 30, 90 Days Free + Pro Custom) */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: '7', label: isHinglish ? '7 Din' : '7 Days', desc: isHinglish ? 'साप्ताहिक' : 'Weekly Sprint' },
                { key: '14', label: isHinglish ? '14 Din' : '14 Days', desc: isHinglish ? 'दो हफ़्ते' : 'Two-Week Focus' },
                { key: '30', label: isHinglish ? '30 Din' : '30 Days', desc: isHinglish ? 'मासिक' : 'Monthly Review' },
                { key: '90', label: isHinglish ? '90 Din' : '90 Days', desc: isHinglish ? 'त्रैमासिक' : 'Quarterly Trend' }
              ].map(opt => {
                const isSelected = rangeOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      setRangeOption(opt.key);
                      setShowTimeframeModal(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black">{opt.label}</span>
                      {isSelected && <CheckCircle size={14} weight="fill" className="text-emerald-400 dark:text-emerald-600" />}
                    </div>
                    <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Range Option (PRO Only) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Crown size={14} weight="fill" className="text-amber-500" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {isHinglish ? 'कस्टम तारीख रेंज' : 'Custom Date Range'}
                  </span>
                </div>
                <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                  PRO
                </span>
              </div>

              {userDoc?.isPro ? (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isHinglish ? 'शुरुआती तारीख' : 'Start Date'}
                      </label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={e => setCustomStart(e.target.value)}
                        className="w-full text-xs font-bold p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        {isHinglish ? 'अंतिम तारीख' : 'End Date'}
                      </label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={e => setCustomEnd(e.target.value)}
                        className="w-full text-xs font-bold p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customStart || !customEnd) {
                        alert(isHinglish ? 'कृपया दोनों तारीखें चुनें' : 'Please select both start and end dates');
                        return;
                      }
                      if (customStart > customEnd) {
                        alert(isHinglish ? 'शुरुआती तारीख अंतिम तारीख से पहले होनी चाहिए' : 'Start date must be before end date');
                        return;
                      }
                      setAppliedCustomStart(customStart);
                      setAppliedCustomEnd(customEnd);
                      setRangeOption('custom');
                      setShowTimeframeModal(false);
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    {isHinglish ? 'कस्टम रेंज लागू करें' : 'Apply Custom Range'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowTimeframeModal(false);
                    setShowProUpgradeModal(true);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkle size={13} weight="fill" />
                  <span>{isHinglish ? 'Pro अनलॉक करें (Unlock Custom)' : 'Unlock Custom with Pro'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

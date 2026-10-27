import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { calculateRecoveryScore, getResilienceBadgeClasses } from '../lib/recoveryAnalytics';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import {
  ShieldCheck,
  Flame,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
  HourglassSimple,
  Sparkle,
  ArrowRight,
  Info,
  CalendarCheck,
  TrendUp,
  ArrowLeft,
  CaretDown,
  X
} from '@phosphor-icons/react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

const RESILIENCE_RULES = [
  {
    id: '01',
    num: '01',
    title: 'The "Never Miss Twice" Rule',
    desc: 'Missing one day is an accident; missing two is the start of a new habit. Recovering within 24-48 hours protects your habit neuro-pathways.'
  },
  {
    id: '02',
    num: '02',
    title: 'Elastic Consistency',
    desc: "Perfectionism breaks habits. High performers don't have zero missed days — they have an elite bounce-back rate when life gets busy."
  },
  {
    id: '03',
    num: '03',
    title: 'Momentum Stacking',
    desc: 'Each consecutive recovery increases your Recovery Streak. Build a streak of 3+ bounce-backs to cement true lifelong discipline.'
  }
];

const SAMPLE_WORKOUT_HABIT = {
  id: 'sample_workout',
  name: 'Daily Workout',
  icon: 'fitness_center',
  category: 'Fitness',
  scoringType: 'numeric',
  direction: 'higher_is_better',
  targetValue: 45,
  target0: 10,
  userTarget100: 45,
  userTarget0: 10,
  unit: 'minutes',
  defaultUnit: 'minutes',
  priorityRank: 1
};

export default function RecoveryDeepDive() {
  const query = useQuery();
  const habitId = query.get('habitId');
  const navigate = useNavigate();

  const { habits, allSummaries } = useData();
  const isSamplePreview = habitId === 'sample_workout' || habitId?.startsWith('sample_');

  const [periodDays, setPeriodDays] = useState(30);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showInfo, setShowInfo] = useState(() => {
    try {
      return !localStorage.getItem('has_seen_resilience_guide');
    } catch (e) {
      return false;
    }
  });
  const [expandedMisses, setExpandedMisses] = useState([]);
  const [expandedRule, setExpandedRule] = useState(null);

  const handleCloseInfo = () => {
    try {
      localStorage.setItem('has_seen_resilience_guide', 'true');
    } catch (e) {}
    setShowInfo(false);
  };

  const toggleRule = (id) => {
    setExpandedRule(prev => prev === id ? null : id);
  };

  const toggleMissExpand = (key) => {
    setExpandedMisses(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const resolvedSummaries = useMemo(() => {
    if (isSamplePreview) {
      const list = [];
      const today = new Date();
      const sampleValues = [
        30, 40, 45, 45, 50, 45, 0, 45, 50, 55,
        45, 50, 60, 45, 50, 55, 45, 60, 50, 45,
        35, 45, 50, 60, 0, 45, 50, 55, 60, 45,
        50, 55, 60, 50, 45, 50, 55, 60, 50, 45,
        55, 60, 50, 55, 60
      ];
      const targetVal = 45;
      const target0Val = 10;
      const hId = habitId || 'sample_workout';

      for (let i = sampleValues.length - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const val = sampleValues[sampleValues.length - 1 - i];

        let score = 0;
        if (val >= targetVal) {
          score = 100;
        } else if (val <= target0Val) {
          score = 0;
        } else {
          score = Math.round(((val - target0Val) / (targetVal - target0Val)) * 100);
        }

        list.push({
          id: dateStr,
          date: dateStr,
          overallScore: score,
          habitScores: { [hId]: score },
          scores: { [hId]: score },
          habitValues: { [hId]: val },
          values: { [hId]: val },
          actuals: { [hId]: val },
          habitsCompleted: score >= 60 ? 1 : 0,
          habitsTotal: 1
        });
      }
      return list;
    }
    return allSummaries;
  }, [isSamplePreview, habitId, allSummaries]);

  const habit = useMemo(() => {
    if (!habitId) return null;
    if (isSamplePreview) return SAMPLE_WORKOUT_HABIT;
    const userHabit = habits?.find(h => h.id === habitId);
    if (userHabit) return userHabit;
    return HABITS_SEED_DATA.find(h => h.id === habitId) || null;
  }, [habits, habitId, isSamplePreview]);

  const recoveryData = useMemo(() => {
    if (!habit || !resolvedSummaries) return {};
    return calculateRecoveryScore(resolvedSummaries, habit.id, 7, periodDays, 70, habit.createdAt);
  }, [habit, resolvedSummaries, periodDays]);

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <Icon name="error_outline" className="text-4xl text-on-surface-variant mb-4" />
        <h2 className="text-xl font-bold text-on-surface">Habit Not Found</h2>
        <p className="text-on-surface-variant mt-2 mb-6">This habit may have been deleted.</p>
        <button
          onClick={() => navigate('/deep-dive')}
          className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm cursor-pointer"
        >
          Back to Deep Dive
        </button>
      </div>
    );
  }

  const {
    recoveryScore = 100,
    totalMisses = 0,
    recoveryStreak = 0,
    bestRecoveryStreak = 0,
    currentStreak = 0,
    bestStreak = 0,
    resilienceSummary = 'High Resilience',
    successThreshold = 70,
    recoveryWindow = 7,
    misses = [],
    hasEnoughData = false,
    trackedDaysCount = 0
  } = recoveryData;

  const recoveredMisses = misses.filter(m => m.recovered);
  const inProgressMisses = misses.filter(m => m.isInProgress);
  const unrecoveredMisses = misses.filter(m => !m.recovered && !m.isInProgress);

  const winRate = totalMisses > 0 ? Math.round((recoveredMisses.length / totalMisses) * 100) : 100;

  const filteredMisses = (() => {
    let list = [...misses].reverse();
    if (activeFilter === 'recovered') return list.filter(m => m.recovered);
    if (activeFilter === 'inprogress') return list.filter(m => m.isInProgress);
    if (activeFilter === 'unrecovered') return list.filter(m => !m.recovered && !m.isInProgress);
    return list;
  })();

  const handleBackToDeepDive = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    navigate(`/analytics/deep-dive?habitId=${habit.id}`);
  };

  return (
    <div className="max-w-[1100px] mx-auto w-full space-y-4 md:space-y-6 px-1 sm:px-3 md:px-0 pb-16">

      {/* ── 1. TOP NAV BAR ── */}
      <nav className="flex items-center justify-between gap-3 w-full pb-2 border-b border-slate-200/80">
        <button
          onClick={handleBackToDeepDive}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors py-2 px-3 sm:px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Back</span>
        </button>

        <div className="relative flex-shrink-0">
          <Icon name="calendar_today" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none" />
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="pl-8 pr-7 py-2 text-xs sm:text-sm font-bold border border-slate-200 bg-white rounded-xl shadow-2xs hover:bg-slate-50 transition-colors appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <Icon name="arrow_drop_down" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none" />
        </div>
      </nav>

      {/* ── 2. HABIT CONTEXT HERO HEADER ── */}
      <section className="bg-gradient-to-b from-[#140b05] via-[#0d0703] to-[#0a0502] text-white rounded-3xl p-5 sm:p-6 md:p-7 border border-orange-900/40 shadow-xl relative overflow-hidden flex flex-col gap-4 w-full">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 w-full relative z-10">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#281508] border border-orange-500/30 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <HabitIcon name={habit.icon} habitId={habit.id} size={30} />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate">
              {habit.name}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-950/60 hover:bg-orange-900/80 active:scale-95 text-orange-400 hover:text-orange-300 flex items-center justify-center transition-all border border-orange-500/30 cursor-pointer shadow-xs flex-shrink-0"
            title="How Resilience Works"
          >
            <Icon name="info" className="text-[18px]" />
          </button>
        </div>

        <div className="w-full border-t border-dashed border-orange-900/50 relative z-10" />

        {/* Resilience Score Row */}
        <div className="w-full bg-[#170c06]/80 hover:bg-[#1f1008] transition-all rounded-2xl border border-orange-900/40 p-4 sm:p-5 flex items-center justify-between gap-4 relative z-10 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#281508] border border-orange-500/30 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <ShieldCheck size={28} weight="fill" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-orange-400">
                Resilience Score
              </span>
              <span className="text-xs sm:text-sm text-stone-300 font-medium mt-0.5 truncate">
                7-day comeback &amp; bounce-back rate
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0 text-right">
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-500 leading-tight">
              {recoveryScore !== null && recoveryScore !== undefined ? `${recoveryScore}%` : '—'}
            </div>
            <span className="text-[11px] sm:text-xs text-orange-200/80 font-bold tracking-wide mt-0.5 capitalize">
              {recoveryScore >= 80 ? 'High' : recoveryScore >= 50 ? 'Moderate' : (recoveryScore !== null ? 'Needs Work' : 'Flawless')}
            </span>
          </div>
        </div>
      </section>

      {/* ── INFO MODAL ── */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={handleCloseInfo} />
          <div className="relative w-full max-w-[440px] max-h-[90vh] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 z-10 flex flex-col animate-in zoom-in-95 duration-150 text-slate-800 overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-2xs shrink-0">
                  <ShieldCheck size={18} weight="fill" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight">How Resilience Works</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Quick Recovery Guide</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseInfo}
                className="w-8 h-8 rounded-full hover:bg-slate-100 active:scale-90 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-all shrink-0"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-0.5 text-slate-600 text-[11px] sm:text-xs">
              {[
                { num: 1, color: 'orange', title: '7-Day Window', body: 'After you miss a day, a 7-day recovery window starts. We track how quickly you get back on track.' },
                { num: 2, color: 'emerald', title: 'Bounce-Back', body: 'A bounce-back happens when you recover by completing your habit on at least 5 of the next 7 days (≥70%).' },
                { num: 3, color: 'purple', title: 'Recovery Streak', body: 'Consecutive misses you\'ve successfully bounced back from. A failed recovery resets the streak.' },
                { num: 4, color: 'blue', title: 'Resilience Score', body: 'Your average recovery rate across all misses. Shows "—" if you\'ve never missed.' }
              ].map(({ num, color, title, body }) => (
                <div key={num} className="flex items-start gap-2 bg-slate-50/90 p-2.5 rounded-xl border border-slate-100">
                  <span className={`w-4 h-4 rounded-full bg-${color}-100 text-${color}-700 font-bold text-[9px] sm:text-[10px] flex items-center justify-center shrink-0 mt-0.5`}>{num}</span>
                  <div className="min-w-0">
                    <strong className="text-slate-900 block font-bold text-[11px] sm:text-xs leading-tight mb-0.5">{title}</strong>
                    <p className="text-slate-600 leading-snug text-[11px] sm:text-xs">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleCloseInfo}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {[
          { label: 'Recovery Streak', value: recoveryStreak, unit: 'bounces', sub: 'Consecutive comebacks', icon: <ShieldCheck size={18} weight="fill" />, iconBg: 'bg-orange-50 text-orange-600', valColor: 'text-orange-600' },
          { label: 'Best Recovery', value: bestRecoveryStreak, unit: 'bounces', sub: 'All-time best streak', icon: <Star size={18} weight="fill" />, iconBg: 'bg-indigo-50 text-indigo-600', valColor: 'text-slate-900 dark:text-white' },
          { label: 'Total Misses', value: totalMisses, unit: 'days', sub: 'In lookback window', icon: <XCircle size={18} weight="fill" />, iconBg: 'bg-rose-50 text-rose-500', valColor: 'text-slate-900 dark:text-white' },
          { label: 'Win Rate', value: `${winRate}%`, unit: '', sub: `${recoveredMisses.length} of ${totalMisses} resolved`, icon: <CheckCircle size={18} weight="fill" />, iconBg: 'bg-emerald-50 text-emerald-600', valColor: 'text-emerald-600' }
        ].map(({ label, value, unit, sub, icon, iconBg, valColor }) => (
          <div key={label} className="bg-white dark:bg-[#151a26] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-orange-200 dark:hover:border-orange-900/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
            </div>
            <div>
              <div className={`text-xl sm:text-2xl md:text-3xl font-black leading-none flex items-baseline gap-1 ${valColor}`}>
                {value} {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium mt-1.5 block truncate">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 4. BOUNCE-BACK TIMELINE ── */}
      <div className="space-y-4 w-full pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Bounce-Back &amp; Recovery Timeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Chronological log of every slip and 7-day comeback journey
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            {[
              { key: 'all', label: `All (${misses.length})`, active: 'bg-orange-600 text-white' },
              { key: 'recovered', label: `Recovered (${recoveredMisses.length})`, active: 'bg-emerald-600 text-white' },
              { key: 'inprogress', label: `In Progress (${inProgressMisses.length})`, active: 'bg-amber-500 text-white' },
              { key: 'unrecovered', label: `Unrecovered (${unrecoveredMisses.length})`, active: 'bg-slate-700 text-white' }
            ].map(({ key, label, active }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === key
                    ? active
                    : 'bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredMisses.length === 0 ? (
          <div className="py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Sparkle size={28} weight="fill" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              {activeFilter === 'all' ? (trackedDaysCount < 2 ? 'Tracking Just Started!' : 'Flawless Consistency!') : 'No misses in this filter'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
              {activeFilter === 'all'
                ? "You haven't missed any habit days during this lookback window. Keep maintaining your momentum!"
                : 'No items match your selected filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredMisses.map((item, idx) => {
              const missKey = item.date || item.missDate || `miss_${idx}`;
              const isExpanded = expandedMisses.includes(missKey);
              const completionPercent = item.recoveryRate !== undefined ? Math.round(item.recoveryRate) : 0;
              const daysCompleted = item.recoveredDays || Math.round((completionPercent / 100) * 7);

              return (
                <div
                  key={missKey}
                  onClick={() => toggleMissExpand(missKey)}
                  className={`p-3.5 sm:p-4 rounded-2xl border border-dashed transition-all flex flex-col gap-3 cursor-pointer select-none ${
                    item.recovered
                      ? 'bg-white border-slate-300 hover:border-orange-300 shadow-2xs'
                      : item.isInProgress
                      ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400 shadow-2xs'
                      : 'bg-slate-50/90 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center flex-shrink-0">
                        <XCircle size={18} weight="fill" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 leading-none">Missed Day</span>
                        <span className="text-sm font-bold text-slate-900 mt-1 leading-none truncate">
                          {formatDateShort(item.missDate || item.date)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {getDayOfWeek(item.missDate || item.date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.recovered ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                          <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                          <span>Recovered</span>
                        </div>
                      ) : item.isInProgress ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
                          <HourglassSimple size={15} weight="bold" className="text-amber-600 animate-spin" />
                          <span>In Progress</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs">
                          <XCircle size={15} weight="bold" className="text-slate-400" />
                          <span>Unrecovered</span>
                        </div>
                      )}
                      <div className={`w-7 h-7 rounded-lg bg-slate-100/80 flex items-center justify-center text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <CaretDown size={14} weight="bold" />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="w-full flex flex-col gap-1.5 pt-3 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-1 duration-150 cursor-default"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <CalendarCheck size={14} className="text-orange-600" />
                          7-Day Window: <strong className="text-slate-900">{daysCompleted}/7 days</strong>
                        </span>
                        <span className={`font-bold ${item.recovered ? 'text-emerald-600' : item.isInProgress ? 'text-amber-600' : 'text-slate-500'}`}>
                          {completionPercent}% completion
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.recovered
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                              : item.isInProgress
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(completionPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>Threshold: ≥70%</span>
                        <span>Target Window: {formatDateShort(item.missDate || item.date)} — {formatDateShort(item.endDate)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. RESILIENCE PSYCHOLOGY ACCORDION ── */}
      <div className="space-y-2.5 w-full">
        {RESILIENCE_RULES.map(rule => {
          const isOpen = expandedRule === rule.id;
          return (
            <div
              key={rule.id}
              onClick={() => toggleRule(rule.id)}
              className={`bg-white rounded-2xl border transition-all cursor-pointer select-none overflow-hidden shadow-2xs ${
                isOpen ? 'border-orange-300 ring-2 ring-orange-500/10' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    rule.id === '01' ? 'bg-indigo-50 text-indigo-600'
                    : rule.id === '02' ? 'bg-orange-50 text-orange-600'
                    : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {rule.num}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{rule.title}</h4>
                </div>
                <div className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-orange-600' : ''}`}>
                  <CaretDown size={18} weight="bold" />
                </div>
              </div>
              {isOpen && (
                <div className="px-3.5 pb-4 pt-1 sm:px-4 sm:pb-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed animate-in fade-in duration-200">
                  <p>{rule.desc}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

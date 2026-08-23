import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import { useData } from '../contexts/DataContext';
import { generateBetterReport } from '../lib/betterReportEngine';
import ShareBetterReportModal from '../components/ShareBetterReportModal';
import confetti from 'canvas-confetti';

export default function BetterReport() {
  const navigate = useNavigate();
  const { habits = [], allSummaries = [] } = useData();
  const [selectedWindow] = useState(30);
  const [showShareModal, setShowShareModal] = useState(false);
  const [challengeAccepted, setChallengeAccepted] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const isLocked = (allSummaries?.length || 0) < 30;
  const daysRemaining = Math.max(0, 30 - (allSummaries?.length || 0));

  useEffect(() => {
    if (!isLocked) {
      try {
        const hasSeen = localStorage.getItem('has_seen_30d_report_unlocked');
        if (!hasSeen) {
          setShowUnlockModal(true);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 }
          });
        }
      } catch (e) {}
    }
  }, [isLocked]);

  const handleCloseUnlockModal = () => {
    try {
      localStorage.setItem('has_seen_30d_report_unlocked', 'true');
    } catch (e) {}
    setShowUnlockModal(false);
  };


  const sampleReport = useMemo(() => ({
    meta: {
      totalHabits: 3,
      totalDaysTracked: 30,
      requestedWindow: 30,
      isProvisional: false,
      dateRangeLabel: 'Sample 30-Day Period',
      activeDays: 28,
      avgOverallScore: 82,
      consistencyScore: 84,
      consistencyTier: 'Master',
      tierColor: 'emerald',
      narrativeArc: 'You built significant momentum across weeks 2 and 3, transforming hydration and morning workouts into automatic daily rituals.'
    },
    weeklyAverages: [68, 79, 88, 92],
    strongestHabit: {
      id: 's1',
      name: 'Water Intake',
      icon: 'water_drop',
      avgScore: 94,
      perfectDays: 22,
      missedDays: 2,
      streak: 18,
      delta: 12,
      firstAvg: 82,
      secondAvg: 94,
      weekly: [80, 88, 95, 98],
      dots: [100,90,100,100,80,100,100,100,90,100,100,80,100,100,100,95,100,100,80,100,100,100,90,100,100,100,85,100,100,100]
    },
    weakestHabit: {
      id: 's3',
      name: 'Screen Time',
      icon: 'smartphone',
      avgScore: 54,
      perfectDays: 8,
      missedDays: 14,
      streak: 3,
      delta: -8,
      firstAvg: 60,
      secondAvg: 52,
      weekly: [60, 55, 50, 48],
      dots: [60,40,70,30,80,50,60,40,70,30,80,50,60,40,70,55,60,40,70,30,80,50,60,40,70,30,80,50,55,60]
    },
    improvedHabit: {
      id: 's2',
      name: 'Deep Work',
      icon: 'psychology',
      avgScore: 82,
      perfectDays: 16,
      missedDays: 5,
      streak: 9,
      delta: 28,
      firstAvg: 58,
      secondAvg: 86,
      weekly: [55, 68, 85, 90],
      dots: [50,60,55,65,70,60,75,80,85,90,80,85,90,88,92,86,90,88,92,95,90,88,92,86,90,95,92,88,90,92]
    },
    correlations: [
      {
        type: 'positive',
        habitA: 'Water Intake',
        habitB: 'Deep Work',
        headline: 'Days with high hydration scores showed +42% better focus stamina during Deep Work sessions.',
        percentage: 87
      }
    ],
    recoveryStory: {
      weeklyAverages: [68, 79, 88, 92],
      startRecovery: 68,
      endRecovery: 92,
      recoveryGrowth: 24,
      resilienceBadge: 'Resilience Master'
    },
    habitReports: [
      { id: 's1', name: 'Water Intake', icon: 'water_drop', avgScore: 94, perfectDays: 22, streak: 18, delta: 12, weekly: [80, 88, 95, 98] },
      { id: 's2', name: 'Morning Workout', icon: 'fitness_center', avgScore: 88, perfectDays: 19, streak: 12, delta: 18, weekly: [70, 82, 92, 96] },
      { id: 's3', name: 'Deep Work', icon: 'psychology', avgScore: 82, perfectDays: 16, streak: 9, delta: 28, weekly: [55, 68, 85, 90] }
    ],
    nextChallenge: {
      targetHabit: 'Screen Time',
      targetGoal: 79,
      headline: 'Elevate Screen Time to 79% in the next 30 days',
      actionText: 'Use the 2-Minute Anchor rule every morning to build an unbreakable floor for Screen Time.'
    }
  }), []);


  const report = useMemo(() => {
    const raw = generateBetterReport(habits, allSummaries, selectedWindow);
    if (isLocked || !raw) return sampleReport;
    return raw;
  }, [habits, allSummaries, selectedWindow, isLocked, sampleReport]);

  const {
    meta,
    weeklyAverages,
    strongestHabit,
    weakestHabit,
    improvedHabit,
    correlations,
    recoveryStory,
    habitReports,
    nextChallenge
  } = report;

  // Circular score calculation
  const strokeDashoffset = 100 - (meta.consistencyScore * 100) / 100;

  return (
    <div className="w-full pb-24 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* ── Sample Mode Banner (When < 30 days) ── */}
      {isLocked && (
        <div className="space-y-2">
          {/* Standalone Pill on Top-Left */}
          <div className="flex items-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Sample Mode
            </span>
          </div>

          {/* Dark Card with Lock, Text & Bottom-Right Back to Dashboard */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-700/60 shadow-lg flex flex-col gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="lock" filled={true} className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-bold text-white leading-tight">
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left to unlock your Live 30-Day Story
                </p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                  This is a sample preview filled with realistic habit data so you can explore the full report format.
                </p>
              </div>
            </div>

            {/* Bottom-Right Back to Dashboard */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Icon name="home" className="text-[13px]" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}


      
      {/* ── Top Floating Action Bar ─────────────────────────────────────────── */}
      <div className="sticky top-4 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-md flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 transition-colors rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs sm:text-sm cursor-pointer"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {meta.isProvisional && (
            <span className="bg-amber-100 text-amber-800 font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200 hidden sm:inline-block">
              Provisional Story ({meta.totalDaysTracked}d)
            </span>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm shadow-md shadow-orange-600/25 border border-orange-500/40 transition-all cursor-pointer"
          >
            <Icon name="share" className="text-[16px]" />
            <span>Share Story</span>
          </button>
        </div>
      </div>

      {/* ── SECTION A: Cover & Hero ─────────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0c101c] via-[#141b2e] to-[#0a0d18] text-white p-5 sm:p-8 md:p-10 border border-slate-700/80 shadow-xl relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3.5 sm:gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-300">
              30-DAY PERSONAL DOCUMENTARY
            </span>
            <span className="font-bold text-slate-400 text-xs">
              {meta.dateRangeLabel}
            </span>
          </div>

          <h1 className="font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
            Your 30-Day Habit Story
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm md:text-base font-medium max-w-2xl leading-relaxed">
            This is not a dry dashboard, but your behavioral mirror — revealing where your routines flourished, where energy competed, and how your resilience compounded over 30 days.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-3 pt-4 border-t border-slate-700/60">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-slate-400 block">Total Habits</span>
              <span className="text-lg sm:text-2xl font-black text-white">{meta.totalHabits}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-slate-400 block">Active Days</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-400">{meta.activeDays}d</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-slate-400 block">Consistency</span>
              <span className="text-lg sm:text-2xl font-black text-sky-400">{meta.consistencyScore}%</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-bold text-slate-400 block">Mastery Tier</span>
              <span className="text-base sm:text-xl font-black text-purple-300">{meta.consistencyTier}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION B: Overall Consistency Score ────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Circular Ring Meter */}
        <div className="flex items-center gap-5 sm:gap-6 w-full md:w-auto">
          <div className="relative flex items-center justify-center shrink-0 w-24 h-24 sm:w-30 sm:h-30">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 transition-all duration-1000 ease-out"
                strokeDasharray="100, 100"
                strokeDashoffset={strokeDashoffset}
                strokeWidth="3.4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-black text-xl sm:text-2xl text-slate-900 leading-none">
                {meta.consistencyScore}%
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                {meta.consistencyTier}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              OVERALL CONSISTENCY
            </span>
            <h3 className="font-black text-slate-900 text-base sm:text-xl mt-1">Discipline & Frequency</h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
              You logged activity on <span className="font-bold text-slate-900">{meta.activeDays} of {meta.requestedWindow} days</span> with an overall discipline average of {meta.avgOverallScore}%.
            </p>
          </div>
        </div>

        {/* Right: 4-Week Progression Bars */}
        <div className="w-full md:w-64 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>4-Week Progression</span>
            <span className="text-indigo-600 font-mono">W1 ➔ W4</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {weeklyAverages.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-full bg-slate-200 rounded-md h-12 sm:h-14 flex items-end overflow-hidden">
                  <div 
                    className={`w-full transition-all duration-500 rounded-md ${
                      idx === 3 ? 'bg-indigo-600' : 'bg-slate-400'
                    }`}
                    style={{ height: `${Math.max(15, val)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">W{idx + 1}</span>
                <span className="text-[10px] font-black text-slate-800">{val}%</span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── SECTION C & D: Superpower & Prime Opportunity (2-Col Grid) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        
        {/* SECTION C: Strongest Habit */}
        {strongestHabit && (
          <section className="bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 rounded-3xl border border-emerald-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Icon name="bolt" filled={true} className="text-emerald-600 text-[15px]" />
                  <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                    STRONGEST HABIT
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  {strongestHabit.avgScore}% Avg
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <HabitIcon name={strongestHabit.icon} boxed={true} size={24} className="!w-11 !h-11 !rounded-2xl !bg-emerald-100 !text-emerald-700 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-base sm:text-lg truncate">{strongestHabit.name}</h3>
                  <p className="text-xs text-emerald-800 font-bold">Your Anchor Superpower</p>
                </div>
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mb-4">
                Maintained high execution on <span className="font-bold text-slate-900">{strongestHabit.perfectDays} days</span> with a streak of {strongestHabit.streak} days.
              </p>

              {/* 30-Day Dot Heatmap */}
              <div className="bg-white/80 p-3 rounded-2xl border border-emerald-150 mb-3">
                <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">30-Day Calendar Heatmap</span>
                <div className="grid grid-cols-10 gap-1.5">
                  {strongestHabit.dots.map((val, idx) => (
                    <div
                      key={idx}
                      className={`h-3.5 sm:h-4 rounded-md transition-all ${
                        val === null ? 'bg-slate-100' :
                        val >= 80 ? 'bg-emerald-500' :
                        val >= 50 ? 'bg-emerald-300' : 'bg-rose-400'
                      }`}
                      title={`Day ${idx + 1}: ${val !== null ? `${val}%` : 'No log'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-100/60 rounded-xl border border-emerald-200/80 text-[11px] font-bold text-emerald-950 flex items-center gap-2 mt-2">
              <Icon name="lightbulb" filled={true} className="text-emerald-700 text-[16px] shrink-0" />
              <span>Pro Tip: Stack your developing habits directly after this anchor routine.</span>
            </div>
          </section>
        )}

        {/* SECTION D: Weakest Habit */}
        {weakestHabit && (
          <section className="bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 rounded-3xl border border-rose-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Icon name="track_changes" filled={true} className="text-rose-600 text-[15px]" />
                  <span className="bg-rose-100 text-rose-800 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                    PRIME OPPORTUNITY
                  </span>
                </div>
                <span className="text-xs font-bold text-rose-700">
                  {weakestHabit.avgScore}% Avg
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <HabitIcon name={weakestHabit.icon} boxed={true} size={24} className="!w-11 !h-11 !rounded-2xl !bg-rose-100 !text-rose-700 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-base sm:text-lg truncate">{weakestHabit.name}</h3>
                  <p className="text-xs text-rose-800 font-bold">Highest Leverage Growth Area</p>
                </div>
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mb-4">
                Had low momentum on <span className="font-bold text-slate-900">{weakestHabit.missedDays} days</span>. This represents your biggest potential upside for next month.
              </p>

              {/* 30-Day Dot Heatmap */}
              <div className="bg-white/80 p-3 rounded-2xl border border-rose-150 mb-3">
                <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">30-Day Calendar Heatmap</span>
                <div className="grid grid-cols-10 gap-1.5">
                  {weakestHabit.dots.map((val, idx) => (
                    <div
                      key={idx}
                      className={`h-3.5 sm:h-4 rounded-md transition-all ${
                        val === null ? 'bg-slate-100' :
                        val >= 80 ? 'bg-emerald-500' :
                        val >= 50 ? 'bg-amber-300' : 'bg-rose-400'
                      }`}
                      title={`Day ${idx + 1}: ${val !== null ? `${val}%` : 'No log'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-rose-100/60 rounded-xl border border-rose-200/80 text-[11px] font-bold text-rose-950 flex items-center gap-2 mt-2">
              <Icon name="bolt" filled={true} className="text-rose-700 text-[16px] shrink-0" />
              <span>Pro Tip: Apply the 2-Minute Rule to establish a consistent non-zero floor.</span>
            </div>
          </section>
        )}

      </div>

      {/* ── SECTION E: Biggest Improvement ──────────────────────────────────── */}
      {improvedHabit && (
        <section className="bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/60 rounded-3xl border border-sky-200 p-5 sm:p-7 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon name="trending_up" filled={true} className="text-sky-600 text-[15px]" />
                <span className="bg-sky-100 text-sky-800 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-sky-200">
                  BIGGEST LEAP
                </span>
              </div>
              <h3 className="font-black text-slate-900 text-base sm:text-xl mt-1">
                {improvedHabit.name} surged by +{improvedHabit.delta}%!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Climbed from an average of {improvedHabit.firstAvg}% in the first half to <span className="font-bold text-sky-700">{improvedHabit.secondAvg}%</span> in the second half.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-sky-150 shadow-2xs shrink-0 self-start sm:self-auto">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 block">First 15d</span>
                <span className="text-base sm:text-lg font-black text-slate-600">{improvedHabit.firstAvg}%</span>
              </div>
              <Icon name="arrow_forward" className="text-sky-500 font-bold" />
              <div className="text-center">
                <span className="text-[10px] font-bold text-sky-600 block">Last 15d</span>
                <span className="text-base sm:text-lg font-black text-sky-600">+{improvedHabit.delta}%</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-sky-100/50 rounded-xl border border-sky-200 text-xs font-bold text-sky-950">
            This confirms compounding habit mastery and steady neurological habit formation.
          </div>
        </section>
      )}

      {/* ── SECTION F: 30-Day Correlations ──────────────────────────────────── */}
      {correlations.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
          {/* Section Header: Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Icon name="TreeStructure" filled={true} className="text-[18px]" />
              </div>
              <div>
                <span className="bg-purple-50 text-purple-700 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200 inline-block mb-0.5">
                  30-DAY CORRELATIONS
                </span>
                <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  Cross-Habit Synergies
                </h3>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
              {correlations.length} Pairs Detected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {correlations.map((corr, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex flex-col justify-between ${
                  corr.type === 'positive'
                    ? 'bg-sky-50/50 border-sky-200/80 text-sky-950'
                    : 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                    <span className={corr.type === 'positive' ? 'text-sky-500' : 'text-amber-500'}>
                      <Icon name={corr.type === 'positive' ? 'PlugsConnected' : 'BatteryLow'} filled={true} className="text-[17px]" />
                    </span>
                    <span>{corr.type === 'positive' ? 'Power Duo Synergy' : 'Energy Trade-off'}</span>
                  </span>
                  <span className="font-mono text-xs font-black bg-white px-2 py-0.5 rounded-md shadow-2xs text-slate-900 border border-slate-100">
                    {corr.percentage}%
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900 mb-1">{corr.habitA} + {corr.habitB}</h4>
                <p className="text-xs text-slate-600 leading-normal">{corr.headline}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECTION G: Recovery Story ───────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-violet-50/80 via-white to-purple-50/40 rounded-3xl border border-purple-200 p-5 sm:p-7 md:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="shield" filled={true} className="text-purple-600 text-[16px]" />
            <span className="bg-purple-100 text-purple-800 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
              RECOVERY TRAJECTORY
            </span>
            <span className="text-xs font-bold text-purple-700">
              {recoveryStory.resilienceBadge}
            </span>
          </div>
          <h3 className="font-black text-slate-900 text-base sm:text-xl">Resilience & Bounce-Back</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-xl">
            {recoveryStory.recoveryGrowth >= 0 
              ? `Your recovery resilience improved by +${recoveryStory.recoveryGrowth}% week-over-week, maintaining momentum without burnout.`
              : `Experienced slight mid-month compression but recovered baseline pace in the final week.`}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-150 shadow-2xs text-center shrink-0 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Resilience Status</span>
          <span className="text-lg sm:text-2xl font-black text-purple-700">{recoveryStory.resilienceBadge}</span>
          <span className="text-[11px] font-bold text-slate-500 block mt-0.5">Week 1: {recoveryStory.startRecovery}% ➔ Week 4: {recoveryStory.endRecovery}%</span>
        </div>
      </section>

      {/* ── SECTION H: All Habits Report Card (Mobile Optimized & Clean) ─────── */}
      <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-sm">
        
        {/* Header: Responsive & No Overlap */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Icon name="insights" className="text-[18px]" />
            </div>
            <div>
              <span className="bg-slate-100 text-slate-800 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-200 inline-block mb-0.5">
                UNIVERSE REPORT CARD
              </span>
              <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                All Habits Performance
              </h3>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
            {habitReports.length} Habits Tracked
          </span>
        </div>

        {/* Habit Items List */}
        <div className="divide-y divide-slate-100 pt-1">
          {habitReports.map((item, idx) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
              
              {/* Left Details: Rank + Icon + Name + Subtitle */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="font-mono text-xs font-bold text-slate-400 w-5 shrink-0">#{idx + 1}</span>
                <HabitIcon name={item.icon} habitId={item.id} boxed={true} size={20} className="!w-11 !h-11 !rounded-xl shrink-0 shadow-2xs" />
                <div className="min-w-0 flex flex-col">
                  <h4 className="font-black text-sm text-slate-900 truncate leading-tight">{item.name}</h4>
                  <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {item.perfectDays} High Days • Streak: {item.streak}d
                  </span>
                </div>
              </div>

              {/* Right Side: Colored 4-Week Bars (Top) + Score & Delta (Underneath) */}
              <div className="flex flex-col items-end shrink-0 gap-1 pl-2">
                
                {/* 4-Week Progression Bars */}
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  {item.weekly.map((wVal, wIdx) => (
                    <div 
                      key={wIdx} 
                      className={`w-2 h-4 rounded-xs transition-all ${
                        wVal >= 70 ? 'bg-emerald-500' : wVal >= 40 ? 'bg-amber-400' : 'bg-slate-200'
                      }`} 
                      title={`W${wIdx + 1}: ${wVal}%`}
                    />
                  ))}
                </div>

                {/* Score & Delta underneath the bars */}
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="font-black text-xs sm:text-sm text-slate-900 leading-none">{item.avgScore}%</span>
                  <span className={`text-[10px] font-extrabold leading-none ${item.delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {item.delta >= 0 ? `+${item.delta}%` : `${item.delta}%`}
                  </span>
                </div>

              </div>

            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION I: Next 30-Day Action Challenge ─────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1c0d06] via-[#150a04] to-[#0c0502] text-white rounded-3xl p-5 sm:p-7 md:p-8 border border-orange-900/50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-1.5">
              <Icon name="bolt" filled={true} className="text-orange-400 text-[16px]" />
              <span className="bg-orange-500/20 text-orange-300 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-orange-500/30 inline-block">
                NEXT 30-DAY CHALLENGE
              </span>
            </div>
            <h3 className="font-black text-lg sm:text-2xl text-white">
              {nextChallenge.headline}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 font-normal leading-relaxed">
              {nextChallenge.actionText}
            </p>
          </div>

          <button
            onClick={() => setChallengeAccepted(!challengeAccepted)}
            className={`px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
              challengeAccepted
                ? 'bg-emerald-500 text-white shadow-emerald-500/25 border border-emerald-400/40'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-98 text-white shadow-orange-600/30 border border-orange-500/40'
            }`}
          >
            <Icon name={challengeAccepted ? "check_circle" : "bolt"} filled={true} className="text-[18px]" />
            <span>{challengeAccepted ? "Challenge Accepted!" : "Accept 30-Day Challenge"}</span>
          </button>
        </div>
      </section>

      {/* ── Share Modal ──────────────────────────────────────────────────────── */}
      {showShareModal && (
        <ShareBetterReportModal
          report={report}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* ── 30-Day Unlock Celebration Modal ─────────────────────────────────── */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" onClick={handleCloseUnlockModal}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center gap-4 relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Icon name="emoji_events" filled={true} className="text-3xl text-white" />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
                30 Days Completed
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Your 30-Day Better Report is Unlocked!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1.5">
                Your 30 days Better Report has unlocked now. You can share your story or dive into your comprehensive behavioral documentary.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-2">
              <button
                onClick={() => {
                  handleCloseUnlockModal();
                  setShowShareModal(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-orange-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Icon name="share" className="text-[16px]" />
                <span>Share Story</span>
              </button>
              <button
                onClick={handleCloseUnlockModal}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Explore Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

}

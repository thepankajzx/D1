import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useData } from '../contexts/DataContext';
import {
  Lightbulb,
  ShieldCheck,
  ChartLineUp,
  Sparkle,
  Lock,
  LockOpen,
  PlugsConnected,
  Crown,
  BatteryLow,
  Trophy,
  BookOpen
} from '@phosphor-icons/react';

export default function InsightsRoadmap() {
  const navigate = useNavigate();
  const { allSummaries = [] } = useData();
  
  // Calculate unique days tracked
  const trackedDays = Math.max(0, allSummaries.length);
  
  // Tier thresholds
  const TIER1_TARGET = 7;
  const TIER2_TARGET = 14;
  const TIER3_TARGET = 30;

  const tier1Remaining = Math.max(0, TIER1_TARGET - trackedDays);
  const tier2Remaining = Math.max(0, TIER2_TARGET - trackedDays);
  const tier3Remaining = Math.max(0, TIER3_TARGET - trackedDays);

  const tier1Unlocked = trackedDays >= TIER1_TARGET;
  const tier2Unlocked = trackedDays >= TIER2_TARGET;
  const tier3Unlocked = trackedDays >= TIER3_TARGET;

  // Next target calculation for the top circle
  let nextTarget = TIER1_TARGET;
  let currentTargetLabel = 'Tier 1';
  let daysLeftForNext = tier1Remaining;

  if (tier1Unlocked && !tier2Unlocked) {
    nextTarget = TIER2_TARGET;
    currentTargetLabel = 'Tier 2';
    daysLeftForNext = tier2Remaining;
  } else if (tier2Unlocked && !tier3Unlocked) {
    nextTarget = TIER3_TARGET;
    currentTargetLabel = 'Tier 3';
    daysLeftForNext = tier3Remaining;
  } else if (tier3Unlocked) {
    nextTarget = TIER3_TARGET;
    currentTargetLabel = 'All Tiers Mastered';
    daysLeftForNext = 0;
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-6 md:space-y-8 pb-16 px-1 sm:px-2 md:px-0">
      
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Intelligence Roadmap</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
            The insights engine unlocks deeper behavioral mirrors as your tracking consistency matures.
          </p>
        </div>
      </div>

      {/* ── Progress Hero Banner ──────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Interactive Progress Ring */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
            {/* SVG Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-slate-100"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-amber-500 transition-all duration-700 ease-out"
                strokeWidth="10"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * Math.min(1, trackedDays / nextTarget))}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg sm:text-xl font-black text-slate-900 leading-none">
                {trackedDays}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                of {nextTarget}d
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                Current Goal: {currentTargetLabel}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {daysLeftForNext > 0 ? `${daysLeftForNext} days remaining` : 'Goal achieved!'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {daysLeftForNext > 0 
                ? `Track ${daysLeftForNext} more ${daysLeftForNext === 1 ? 'day' : 'days'} to unlock ${currentTargetLabel}`
                : 'All Roadmap Tiers Unlocked & Active!'}
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
              Every single day you log deepens your behavioral intelligence matrix.
            </p>
          </div>
        </div>

        {/* Right Emblem */}
        <div className="hidden lg:flex w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 items-center justify-center shrink-0 shadow-xs">
          <Icon name="redeem" filled={true} className="text-amber-500 text-[36px]" />
        </div>

      </section>

      {/* ── TIER 1 SECTION (7 DAYS) ───────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 md:p-8 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="bg-emerald-100 text-emerald-800 font-mono text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            TIER 1
          </span>

          <span className={`text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 ${
            tier1Unlocked 
              ? 'bg-emerald-100 text-emerald-800 font-extrabold' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
          }`}>
            {tier1Unlocked ? '✓ Unlocked' : (
              <>
                <span>{tier1Remaining} {tier1Remaining === 1 ? 'Day' : 'Days'} Left</span>
                <Lock size={14} weight="fill" />
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Daily Insight Feed */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Lightbulb size={28} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Daily Insight Feed</h4>
                  <span className="text-xs text-emerald-700 font-bold">Daily Intelligence</span>
                </div>
              </div>
              {tier1Unlocked ? (
                <LockOpen size={20} weight="fill" className="text-emerald-500 shrink-0" />
              ) : (
                <Lock size={20} weight="fill" className="text-slate-400 shrink-0" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              Personalized mathematical insights about your daily habits, streaks, and momentum.
            </p>
            <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 self-start border border-emerald-200/60">
              {tier1Unlocked ? '✓ Unlocked & Active' : 'Requires 7 Days'}
            </span>
          </div>

          {/* 2. Resilience Score */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck size={28} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Resilience Score</h4>
                  <span className="text-xs text-emerald-700 font-bold">Bounce-Back Rate</span>
                </div>
              </div>
              {tier1Unlocked ? (
                <LockOpen size={20} weight="fill" className="text-emerald-500 shrink-0" />
              ) : (
                <Lock size={20} weight="fill" className="text-slate-400 shrink-0" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              Calculates your 24-48 hour bounce-back rate to measure lifelong behavioral resilience.
            </p>
            <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 self-start border border-emerald-200/60">
              {tier1Unlocked ? '✓ Unlocked & Active' : 'Requires 7 Days'}
            </span>
          </div>

          {/* 3. 7-Day Trends */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <ChartLineUp size={28} weight="bold" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">7-Day Trends</h4>
                  <span className="text-xs text-emerald-700 font-bold">Rising & Falling Habits</span>
                </div>
              </div>
              {tier1Unlocked ? (
                <LockOpen size={20} weight="fill" className="text-emerald-500 shrink-0" />
              ) : (
                <Lock size={20} weight="fill" className="text-slate-400 shrink-0" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              Tracks rising star habits and alerts you early about habits needing attention.
            </p>
            <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 self-start border border-emerald-200/60">
              {tier1Unlocked ? '✓ Unlocked & Active' : 'Requires 7 Days'}
            </span>
          </div>

          {/* 4. Priority Deep Dive */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkle size={28} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Priority Deep Dive</h4>
                  <span className="text-xs text-emerald-700 font-bold">Top 3 Habit Analytics</span>
                </div>
              </div>
              {tier1Unlocked ? (
                <LockOpen size={20} weight="fill" className="text-emerald-500 shrink-0" />
              ) : (
                <Lock size={20} weight="fill" className="text-slate-400 shrink-0" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              In-depth statistical drill-down for your top priority habits with bounce-back recovery and trend charts.
            </p>
            <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 self-start border border-emerald-200/60">
              {tier1Unlocked ? '✓ Unlocked & Active' : 'Requires 7 Days'}
            </span>
          </div>

        </div>
      </section>

      {/* ── TIER 2 SECTION (14 DAYS) ──────────────────────────────────────── */}
      {tier2Unlocked ? (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 md:p-8 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="bg-amber-100 text-amber-800 font-mono text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              TIER 2
            </span>

            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">
              ✓ Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Power Duo & Synergy % */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-amber-300 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <PlugsConnected size={28} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Power Duo &amp; Synergy %</h4>
                    <span className="text-xs text-amber-700 font-bold">Habit Pairs</span>
                  </div>
                </div>
                <LockOpen size={20} weight="fill" className="text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Identifies two habits that fuel each other and thrive together with mathematical co-occurrence.
              </p>
              <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                ✓ Unlocked & Active
              </span>
            </div>

            {/* 2. Keystone Habit */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-amber-300 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <Crown size={28} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Keystone Habit</h4>
                    <span className="text-xs text-amber-700 font-bold">Master Catalyst</span>
                  </div>
                </div>
                <LockOpen size={20} weight="fill" className="text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Uncovers the single catalyst routine that lifts your entire daily score by +20% or more.
              </p>
              <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                ✓ Unlocked & Active
              </span>
            </div>

            {/* 3. Focus Drain */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-amber-300 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <BatteryLow size={28} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Focus Drain (Trade-off)</h4>
                    <span className="text-xs text-amber-700 font-bold">Willpower Conflict</span>
                  </div>
                </div>
                <LockOpen size={20} weight="fill" className="text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Detects conflicting habits that compete for the same energy and suggests smart spacing.
              </p>
              <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                ✓ Unlocked & Active
              </span>
            </div>

            {/* 4. Habit Diagnostics & Root Cause Engine */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-amber-300 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon name="Healing" filled={true} className="text-[28px] text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Habit Diagnostics &amp; Root Cause</h4>
                    <span className="text-xs text-amber-700 font-bold">Friction &amp; Domino Analysis</span>
                  </div>
                </div>
                <LockOpen size={20} weight="fill" className="text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Pinpoints drop reasons, weekday vs weekend splits, domino risks, gap duration, and actionable science protocols.
              </p>
              <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                ✓ Unlocked & Active
              </span>
            </div>

            {/* 5. Deep Dive Analytics */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-amber-300 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <ChartLineUp size={28} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Deep Dive Analytics</h4>
                    <span className="text-xs text-amber-700 font-bold">Full Deep Analysis</span>
                  </div>
                </div>
                <LockOpen size={20} weight="fill" className="text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                In-depth statistical drill-down for every single habit with recovery and trend charts.
              </p>
              <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                ✓ Unlocked & Active
              </span>
            </div>
          </div>
        </section>
      ) : (
        /* Compact Locked Row for Tier 2 */
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex items-center justify-between gap-4">
          <span className="bg-amber-100 text-amber-800 font-mono text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shrink-0">
            TIER 2
          </span>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70">
              {tier2Remaining} {tier2Remaining === 1 ? 'Day' : 'Days'} Left
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Lock size={15} weight="fill" />
            </div>
          </div>
        </div>
      )}

      {/* ── TIER 3 SECTION (30 DAYS) ──────────────────────────────────────── */}
      {tier3Unlocked ? (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 md:p-8 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="bg-sky-100 text-sky-800 font-mono text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              TIER 3
            </span>

            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 font-extrabold">
              ✓ Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Monthly Habit Score (AHS) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-sky-300 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <Trophy size={28} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">Monthly Habit Score</h4>
                    <span className="text-xs text-sky-700 font-bold">AHS Master Grade</span>
                  </div>
                </div>
                <LockOpen size={20} weight="fill" className="text-sky-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Your 30-day overall behavioral grade with historical compounding and benchmark stats.
              </p>
              <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 self-start border border-sky-200/60">
                ✓ Unlocked & Active
              </span>
            </div>

            {/* 2. 30-Day Better Report */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-sky-300 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <BookOpen size={28} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">30-Day Better Report</h4>
                    <span className="text-xs text-sky-700 font-bold">Personal Documentary</span>
                  </div>
                </div>
                <LockOpen size={20} weight="fill" className="text-sky-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Personalized 30-day behavioral documentary covering superpowers, recovery, and 1080x1920 story canvas.
              </p>
              <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 self-start border border-sky-200/60">
                ✓ Unlocked & Active
              </span>
            </div>
          </div>
        </section>
      ) : (
        /* Compact Locked Row for Tier 3 */
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex items-center justify-between gap-4">
          <span className="bg-sky-100 text-sky-800 font-mono text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shrink-0">
            TIER 3
          </span>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70">
              {tier3Remaining} {tier3Remaining === 1 ? 'Day' : 'Days'} Left
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Lock size={15} weight="fill" />
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Motivation Card ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 flex items-center gap-4 shadow-md">
        <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/40">
          <Icon name="bolt" filled={true} className="text-[24px]" />
        </div>
        <div>
          <h4 className="font-black text-white text-sm sm:text-base leading-tight">
            Consistency builds your intelligence mirror.
          </h4>
          <p className="text-xs text-slate-300 font-normal mt-0.5 leading-relaxed">
            Every day of habits you log unlocks deeper, surprising mathematical self-awareness.
          </p>
        </div>
      </div>

    </div>
  );
}

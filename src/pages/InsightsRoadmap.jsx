import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from '../components/Icon';
import { 
  Lock, Lightbulb, ShieldCheck, ChartLineUp, 
  Sparkle, PlugsConnected, Crown, BatteryLow, Trophy, BookOpen,
  CheckCircle, ArrowRight
} from '@phosphor-icons/react';

export default function InsightsRoadmap() {
  const navigate = useNavigate();
  const { allSummaries } = useData();
  const { isHinglish } = useLanguage();

  const trackedDays = allSummaries ? allSummaries.length : 0;

  const tier1Unlocked = trackedDays >= 7;
  const tier2Unlocked = trackedDays >= 14;
  const tier3Unlocked = trackedDays >= 30;

  const tier1Remaining = Math.max(0, 7 - trackedDays);
  const tier2Remaining = Math.max(0, 14 - trackedDays);
  const tier3Remaining = Math.max(0, 30 - trackedDays);

  const handleItemClick = (route, isUnlocked) => {
    if (!isUnlocked) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    navigate(route);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4 pb-16 animate-in fade-in duration-200">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {isHinglish ? 'इंटेलिजेंस रोडमैप (Intelligence Roadmap)' : 'Intelligence Roadmap'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isHinglish ? 'जैसे-जैसे आप दिन ट्रैक करेंगे, नए-नए एल्गोरिदम अनलॉक होंगे' : 'Progressively unlock advanced behavioral intelligence as you log habits.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
            {trackedDays} / 30 {isHinglish ? 'दिन पूरे' : 'Days Tracked'}
          </span>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              navigate('/insights');
            }}
            className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
          >
            {isHinglish ? 'इनसाइट्स फीड देखें ➔' : 'Insights Feed ➔'}
          </button>
        </div>
      </div>

      {/* ── TIER 1 SECTION (7 DAYS) ── */}
      <section className="bg-white dark:bg-[#131722] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
        {/* Top Header Row: Left TIER 1 Pill, Right Days Left Pill */}
        <div className="flex items-center justify-between gap-3">
          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200/80 dark:border-emerald-800/80 whitespace-nowrap shrink-0">
            TIER 1 • 7 DAYS
          </span>

          <span className={`text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            tier1Unlocked 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
          }`}>
            {tier1Unlocked ? (
              <>
                <CheckCircle size={13} weight="bold" />
                <span>Unlocked</span>
              </>
            ) : (
              <>
                <Lock size={12} weight="fill" />
                <span>{tier1Remaining} {tier1Remaining === 1 ? 'Day' : 'Days'} Left</span>
              </>
            )}
          </span>
        </div>

        {/* Subtitle row */}
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
            Foundation Intelligence
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Initial baseline habits, daily intelligence feeds, and recovery scoring.
          </p>
        </div>

        {/* Dashed line before items */}
        <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1" />

        {/* Compact Dashed List with Locks */}
        <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
          
          {/* 1. Daily Insight Feed */}
          <div 
            onClick={() => handleItemClick('/insights', tier1Unlocked)}
            className={`py-3 flex flex-col gap-1 transition-all ${
              tier1Unlocked 
                ? 'cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl' 
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <Lightbulb size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                    Daily Insight Feed
                  </h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Daily Intelligence</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  tier1Unlocked
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {tier1Unlocked ? (
                    <>
                      <CheckCircle size={11} weight="bold" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} weight="fill" />
                      <span>{tier1Remaining} Days Left</span>
                    </>
                  )}
                </span>
                {tier1Unlocked && (
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Personalized mathematical insights about your daily habits, streaks, and momentum.
            </p>
          </div>

          {/* 2. Resilience Score */}
          <div 
            onClick={() => handleItemClick('/deep-dive/recovery', tier1Unlocked)}
            className={`py-3 flex flex-col gap-1 transition-all ${
              tier1Unlocked 
                ? 'cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl' 
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                    Resilience Score
                  </h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Bounce-Back Rate</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  tier1Unlocked
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {tier1Unlocked ? (
                    <>
                      <CheckCircle size={11} weight="bold" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} weight="fill" />
                      <span>{tier1Remaining} Days Left</span>
                    </>
                  )}
                </span>
                {tier1Unlocked && (
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Calculates your 24-48 hour bounce-back rate to measure lifelong behavioral resilience.
            </p>
          </div>

          {/* 3. 7-Day Trends */}
          <div 
            onClick={() => handleItemClick('/analytics', tier1Unlocked)}
            className={`py-3 flex flex-col gap-1 transition-all ${
              tier1Unlocked 
                ? 'cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl' 
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <ChartLineUp size={16} weight="bold" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                    7-Day Trends
                  </h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Rising &amp; Falling Habits</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  tier1Unlocked
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {tier1Unlocked ? (
                    <>
                      <CheckCircle size={11} weight="bold" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} weight="fill" />
                      <span>{tier1Remaining} Days Left</span>
                    </>
                  )}
                </span>
                {tier1Unlocked && (
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Tracks rising star habits and alerts you early about habits needing attention.
            </p>
          </div>

          {/* 4. Priority Deep Dive */}
          <div 
            onClick={() => handleItemClick('/deep-dive', tier1Unlocked)}
            className={`py-3 flex flex-col gap-1 transition-all ${
              tier1Unlocked 
                ? 'cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl' 
                : 'opacity-70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <Sparkle size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                    Priority Deep Dive
                  </h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Top 3 Habit Analytics</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  tier1Unlocked
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {tier1Unlocked ? (
                    <>
                      <CheckCircle size={11} weight="bold" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} weight="fill" />
                      <span>{tier1Remaining} Days Left</span>
                    </>
                  )}
                </span>
                {tier1Unlocked && (
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              In-depth statistical drill-down for your top priority habits with bounce-back recovery and trend charts.
            </p>
          </div>
        </div>
      </section>

      {/* ── TIER 2 SECTION (14 DAYS) ── */}
      {tier2Unlocked ? (
        <section className="bg-white dark:bg-[#131722] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200/80 dark:border-amber-800/80 whitespace-nowrap shrink-0">
              TIER 2 • 14 DAYS
            </span>

            <span className="text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle size={13} weight="bold" />
              <span>Unlocked</span>
            </span>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
              Correlation &amp; Synergy Matrix
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Multi-habit synergy, Power Duos, and friction detector.
            </p>
          </div>

          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1" />

          {/* Features when unlocked */}
          <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
            <div 
              onClick={() => handleItemClick('/diagnostics', tier2Unlocked)}
              className="py-3 flex flex-col gap-1 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                    <PlugsConnected size={16} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                      Power Duo &amp; Synergy %
                    </h4>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Habit Pairs</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 shrink-0 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle size={11} weight="bold" />
                    <span>Active</span>
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                Identifies two habits that fuel each other and thrive together with mathematical co-occurrence.
              </p>
            </div>

            <div 
              onClick={() => handleItemClick('/diagnostics', tier2Unlocked)}
              className="py-3 flex flex-col gap-1 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                    <Crown size={16} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                      Keystone Habits
                    </h4>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Anchor Routine</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 shrink-0 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle size={11} weight="bold" />
                    <span>Active</span>
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                Pinpoints the #1 habit whose completion guarantees the highest overall daily performance score.
              </p>
            </div>

            <div 
              onClick={() => handleItemClick('/diagnostics', tier2Unlocked)}
              className="py-3 flex flex-col gap-1 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                    <BatteryLow size={16} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                      Focus Drains
                    </h4>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Friction Detector</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 shrink-0 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle size={11} weight="bold" />
                    <span>Active</span>
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                Identifies conflicting habits that pull focus away or fail together when scheduling conflicts occur.
              </p>
            </div>
          </div>
        </section>
      ) : (
        /* Single Clean Locked Card for Tier 2 */
        <section className="bg-white/80 dark:bg-[#131722]/80 backdrop-blur-xs rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200/80 dark:border-amber-800/80 whitespace-nowrap shrink-0">
              TIER 2 • 14 DAYS
            </span>

            <span className="text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Lock size={12} weight="fill" />
              <span>{tier2Remaining} {tier2Remaining === 1 ? 'Day' : 'Days'} Left</span>
            </span>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
              Correlation &amp; Synergy Matrix
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Multi-habit synergy, Power Duos, and friction detector (Unlocks at Day 14).
            </p>
          </div>
        </section>
      )}

      {/* ── TIER 3 SECTION (30 DAYS) ── */}
      {tier3Unlocked ? (
        <section className="bg-white dark:bg-[#131722] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-sky-200/80 dark:border-sky-800/80 whitespace-nowrap shrink-0">
              TIER 3 • 30 DAYS
            </span>

            <span className="text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle size={13} weight="bold" />
              <span>Unlocked</span>
            </span>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
              Long-term Behavioral Documentary
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              30-day comprehensive documentary, superpowers, and identity archetype.
            </p>
          </div>

          <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1" />

          {/* Features when unlocked */}
          <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
            <div 
              onClick={() => handleItemClick('/better-report', tier3Unlocked)}
              className="py-3 flex flex-col gap-1 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/40 flex items-center justify-center shrink-0">
                    <BookOpen size={16} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                      30-Day Monthly Habit Report
                    </h4>
                    <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold uppercase tracking-wider">Monthly Documentary</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 shrink-0 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle size={11} weight="bold" />
                    <span>Active</span>
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                Comprehensive 30-day behavioral documentary with weekly slope progress, tier grade, and shareable growth story.
              </p>
            </div>

            <div 
              onClick={() => handleItemClick('/insights', tier3Unlocked)}
              className="py-3 flex flex-col gap-1 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/40 flex items-center justify-center shrink-0">
                    <Trophy size={16} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate group-hover:text-primary transition-colors">
                      Long-term Behavioral Archetypes
                    </h4>
                    <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold uppercase tracking-wider">Identity Anchor</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 shrink-0 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle size={11} weight="bold" />
                    <span>Active</span>
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                Categorizes your psychological habit rhythm: Early Bird Momentum, Weekend Warrior, or Elastic Rebounder.
              </p>
            </div>
          </div>
        </section>
      ) : (
        /* Single Clean Locked Card for Tier 3 */
        <section className="bg-white/80 dark:bg-[#131722]/80 backdrop-blur-xs rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-sky-200/80 dark:border-sky-800/80 whitespace-nowrap shrink-0">
              TIER 3 • 30 DAYS
            </span>

            <span className="text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30">
              <Lock size={12} weight="fill" />
              <span>{tier3Remaining} {tier3Remaining === 1 ? 'Day' : 'Days'} Left</span>
            </span>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
              Long-term Behavioral Documentary
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              30-day comprehensive documentary, superpowers, and identity archetype (Unlocks at Day 30).
            </p>
          </div>
        </section>
      )}

      {/* ── MOTIVATION BANNER ── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/40">
          <Icon name="bolt" filled={true} className="text-[20px]" />
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-white text-xs sm:text-sm leading-tight">
            Consistency builds your intelligence mirror.
          </h4>
          <p className="text-[11px] text-slate-300 font-normal mt-0.5 leading-relaxed truncate">
            Every day of habits you log unlocks deeper, surprising mathematical self-awareness.
          </p>
        </div>
      </div>

    </div>
  );
}

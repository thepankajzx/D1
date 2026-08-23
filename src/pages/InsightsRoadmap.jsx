import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from '../components/Icon';
import { 
  Lock, LockOpen, Lightbulb, ShieldCheck, ChartLineUp, 
  Sparkle, PlugsConnected, Crown, BatteryLow, Trophy, BookOpen,
  CaretRight, CheckCircle
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
            onClick={() => navigate('/insights')}
            className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
          >
            {isHinglish ? 'इनसाइट्स फीड देखें ➔' : 'Insights Feed ➔'}
          </button>
        </div>
      </div>

      {/* ── TIER 1 SECTION (7 DAYS) ── */}
      <section className="bg-white dark:bg-[#131722] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              TIER 1 • 7 DAYS
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white">Foundation Intelligence</span>
          </div>

          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
            tier1Unlocked 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
          }`}>
            {tier1Unlocked ? (
              <>
                <CheckCircle size={12} weight="bold" />
                <span>Unlocked</span>
              </>
            ) : (
              <>
                <Lock size={12} weight="bold" />
                <span>{tier1Remaining}d Left</span>
              </>
            )}
          </span>
        </div>

        {/* Compact Dashed List */}
        <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
          {/* 1. Daily Insight Feed */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <Lightbulb size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">Daily Insight Feed</h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Daily Intelligence</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shrink-0">
                {tier1Unlocked ? '✓ Active' : '7 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Personalized mathematical insights about your daily habits, streaks, and momentum.
            </p>
          </div>

          {/* 2. Resilience Score */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">Resilience Score</h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Bounce-Back Rate</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shrink-0">
                {tier1Unlocked ? '✓ Active' : '7 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Calculates your 24-48 hour bounce-back rate to measure lifelong behavioral resilience.
            </p>
          </div>

          {/* 3. 7-Day Trends */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <ChartLineUp size={16} weight="bold" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">7-Day Trends</h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Rising &amp; Falling Habits</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shrink-0">
                {tier1Unlocked ? '✓ Active' : '7 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Tracks rising star habits and alerts you early about habits needing attention.
            </p>
          </div>

          {/* 4. Priority Deep Dive */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                  <Sparkle size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">Priority Deep Dive</h4>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Top 3 Habit Analytics</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shrink-0">
                {tier1Unlocked ? '✓ Active' : '7 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              In-depth statistical drill-down for your top priority habits with bounce-back recovery and trend charts.
            </p>
          </div>
        </div>
      </section>

      {/* ── TIER 2 SECTION (14 DAYS) ── */}
      <section className="bg-white dark:bg-[#131722] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              TIER 2 • 14 DAYS
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white">Correlation &amp; Synergy Matrix</span>
          </div>

          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
            tier2Unlocked 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
          }`}>
            {tier2Unlocked ? (
              <>
                <CheckCircle size={12} weight="bold" />
                <span>Unlocked</span>
              </>
            ) : (
              <>
                <Lock size={12} weight="bold" />
                <span>{tier2Remaining}d Left</span>
              </>
            )}
          </span>
        </div>

        {/* Compact Dashed List */}
        <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
          {/* 1. Power Duo & Synergy % */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                  <PlugsConnected size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">Power Duo &amp; Synergy %</h4>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Habit Pairs</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 shrink-0">
                {tier2Unlocked ? '✓ Active' : '14 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Identifies two habits that fuel each other and thrive together with mathematical co-occurrence.
            </p>
          </div>

          {/* 2. Keystone Habits */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                  <Crown size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">Keystone Habits</h4>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Anchor Routine</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 shrink-0">
                {tier2Unlocked ? '✓ Active' : '14 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Pinpoints the #1 habit whose completion guarantees the highest overall daily performance score.
            </p>
          </div>

          {/* 3. Focus Drains */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                  <BatteryLow size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">Focus Drains</h4>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Friction Detector</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 shrink-0">
                {tier2Unlocked ? '✓ Active' : '14 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Identifies conflicting habits that pull focus away or fail together when scheduling conflicts occur.
            </p>
          </div>
        </div>
      </section>

      {/* ── TIER 3 SECTION (30 DAYS) ── */}
      <section className="bg-white dark:bg-[#131722] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              TIER 3 • 30 DAYS
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white">Long-term Behavioral Documentary</span>
          </div>

          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
            tier3Unlocked 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
          }`}>
            {tier3Unlocked ? (
              <>
                <CheckCircle size={12} weight="bold" />
                <span>Unlocked</span>
              </>
            ) : (
              <>
                <Lock size={12} weight="bold" />
                <span>{tier3Remaining}d Left</span>
              </>
            )}
          </span>
        </div>

        {/* Compact Dashed List */}
        <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
          {/* 1. 30-Day Better Report */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/40 flex items-center justify-center shrink-0">
                  <BookOpen size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">30-Day Monthly Habit Report</h4>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold uppercase tracking-wider">Monthly Documentary</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50 shrink-0">
                {tier3Unlocked ? '✓ Active' : '30 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Comprehensive 30-day behavioral documentary with weekly slope progress, tier grade, and shareable growth story.
            </p>
          </div>

          {/* 2. Long-term Behavioral Archetypes */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/40 flex items-center justify-center shrink-0">
                  <Trophy size={16} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">Long-term Behavioral Archetypes</h4>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold uppercase tracking-wider">Identity Anchor</span>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50 shrink-0">
                {tier3Unlocked ? '✓ Active' : '30 Days'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
              Categorizes your psychological habit rhythm: Early Bird Momentum, Weekend Warrior, or Elastic Rebounder.
            </p>
          </div>
        </div>
      </section>

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

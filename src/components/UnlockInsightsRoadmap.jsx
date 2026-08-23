import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from './Icon';
import { 
  Lock, Lightbulb, ShieldCheck, ChartLineUp, 
  Sparkle, PlugsConnected, Crown, BatteryLow, Trophy, BookOpen,
  CheckCircle
} from '@phosphor-icons/react';

export default function UnlockInsightsRoadmap({ isModal = false, onClose }) {
  const navigate = useNavigate();
  const { allSummaries } = useData();
  const { isHinglish } = useLanguage();

  const [selectedTier, setSelectedTier] = useState('tier1');

  const trackedDays = allSummaries ? allSummaries.length : 0;

  const tier1Unlocked = trackedDays >= 7;
  const tier2Unlocked = trackedDays >= 14;
  const tier3Unlocked = trackedDays >= 30;

  const tier1Remaining = Math.max(0, 7 - trackedDays);
  const tier2Remaining = Math.max(0, 14 - trackedDays);
  const tier3Remaining = Math.max(0, 30 - trackedDays);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="font-black text-slate-900 dark:text-white leading-tight text-base sm:text-lg tracking-tight">
            {isHinglish ? 'अनलॉक एडवांस इनसाइट्स' : 'Unlock Advanced Insights'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isHinglish ? 'हैबिट्स ट्रैक करके नए इंटेलिजेंस टियर्स अनलॉक करें' : 'Track daily to unlock intelligence tiers'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80">
            {Math.min(30, trackedDays)} / 30 Days
          </span>
          {isModal && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── TIER SWITCHER TABS ── */}
      <div className="grid grid-cols-3 gap-2">
        {/* Tier 1 */}
        <button
          onClick={() => setSelectedTier('tier1')}
          className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
            selectedTier === 'tier1'
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className={`text-[9.5px] font-mono font-black uppercase tracking-wider ${
              selectedTier === 'tier1' ? 'text-emerald-100' : 'text-slate-400'
            }`}>
              7 DAYS
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1 ${
              selectedTier === 'tier1'
                ? 'bg-white/20 text-white'
                : (tier1Unlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')
            }`}>
              {tier1Unlocked ? '✓ Active' : `${tier1Remaining}d Left`}
            </span>
          </div>
          <h3 className="font-black text-xs sm:text-sm leading-tight">Tier 1</h3>
        </button>

        {/* Tier 2 */}
        <button
          onClick={() => setSelectedTier('tier2')}
          className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
            selectedTier === 'tier2'
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className={`text-[9.5px] font-mono font-black uppercase tracking-wider ${
              selectedTier === 'tier2' ? 'text-amber-100' : 'text-slate-400'
            }`}>
              14 DAYS
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1 ${
              selectedTier === 'tier2'
                ? 'bg-white/20 text-white'
                : (tier2Unlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')
            }`}>
              {tier2Unlocked ? '✓ Active' : `${tier2Remaining}d Left`}
            </span>
          </div>
          <h3 className="font-black text-xs sm:text-sm leading-tight">Tier 2</h3>
        </button>

        {/* Tier 3 */}
        <button
          onClick={() => setSelectedTier('tier3')}
          className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
            selectedTier === 'tier3'
              ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className={`text-[9.5px] font-mono font-black uppercase tracking-wider ${
              selectedTier === 'tier3' ? 'text-sky-100' : 'text-slate-400'
            }`}>
              30 DAYS
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1 ${
              selectedTier === 'tier3'
                ? 'bg-white/20 text-white'
                : (tier3Unlocked ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')
            }`}>
              {tier3Unlocked ? '✓ Active' : `${tier3Remaining}d Left`}
            </span>
          </div>
          <h3 className="font-black text-xs sm:text-sm leading-tight">Tier 3</h3>
        </button>
      </div>

      {/* ── SELECTED TIER FEATURE LIST OR LOCKED CARD ── */}
      <div className="bg-white dark:bg-[#131722] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        
        {/* TIER 1 */}
        {selectedTier === 'tier1' && (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200/80 dark:border-emerald-800/80 whitespace-nowrap shrink-0">
                TIER 1 • 7 DAYS
              </span>
              <span className={`text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                tier1Unlocked 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}>
                {tier1Unlocked ? <CheckCircle size={13} weight="bold" /> : <Lock size={12} weight="fill" />}
                <span>{tier1Unlocked ? 'Unlocked' : `${tier1Remaining} Days Left`}</span>
              </span>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                Foundation Intelligence
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Initial baseline habits, daily intelligence feeds, and recovery scoring.
              </p>
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1" />

            <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
              {/* Daily Insight Feed */}
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
                  <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    tier1Unlocked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                  }`}>
                    {tier1Unlocked ? <CheckCircle size={11} weight="bold" /> : <Lock size={11} weight="fill" />}
                    <span>{tier1Unlocked ? 'Active' : '7 Days'}</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                  Personalized mathematical insights about your daily habits, streaks, and momentum.
                </p>
              </div>

              {/* Resilience Score */}
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
                  <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    tier1Unlocked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                  }`}>
                    {tier1Unlocked ? <CheckCircle size={11} weight="bold" /> : <Lock size={11} weight="fill" />}
                    <span>{tier1Unlocked ? 'Active' : '7 Days'}</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                  Calculates your 24-48 hour bounce-back rate to measure lifelong behavioral resilience.
                </p>
              </div>

              {/* 7-Day Trends */}
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
                  <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    tier1Unlocked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                  }`}>
                    {tier1Unlocked ? <CheckCircle size={11} weight="bold" /> : <Lock size={11} weight="fill" />}
                    <span>{tier1Unlocked ? 'Active' : '7 Days'}</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                  Tracks rising star habits and alerts you early about habits needing attention.
                </p>
              </div>

              {/* Priority Deep Dive */}
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
                  <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap ${
                    tier1Unlocked ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                  }`}>
                    {tier1Unlocked ? <CheckCircle size={11} weight="bold" /> : <Lock size={11} weight="fill" />}
                    <span>{tier1Unlocked ? 'Active' : '7 Days'}</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                  In-depth statistical drill-down for your top priority habits with bounce-back recovery and trend charts.
                </p>
              </div>
            </div>
          </>
        )}

        {/* TIER 2 */}
        {selectedTier === 'tier2' && (
          tier2Unlocked ? (
            <>
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

              <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
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
                    <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0 flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle size={11} weight="bold" />
                      <span>Active</span>
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                    Identifies two habits that fuel each other and thrive together with mathematical co-occurrence.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2 py-1">
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
            </div>
          )
        )}

        {/* TIER 3 */}
        {selectedTier === 'tier3' && (
          tier3Unlocked ? (
            <>
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

              <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
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
                    <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0 flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle size={11} weight="bold" />
                      <span>Active</span>
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-10.5">
                    Comprehensive 30-day behavioral documentary with weekly slope progress, tier grade, and shareable growth story.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2 py-1">
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
            </div>
          )
        )}
      </div>

    </div>
  );
}

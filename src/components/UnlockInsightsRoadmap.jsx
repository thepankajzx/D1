import React, { useState } from 'react';
import Icon from './Icon';
import { useData } from '../contexts/DataContext';

export default function UnlockInsightsRoadmap({ onClose, isModal = true }) {
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

  // Default active tab: show the latest unlocked tier or Tier 1
  const defaultTab = tier3Unlocked ? 'tier3' : (tier2Unlocked ? 'tier2' : 'tier1');
  const [selectedTier, setSelectedTier] = useState(defaultTab);

  return (
    <div className={isModal ? "fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto" : "w-full"}>
      <div className={`bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar p-5 sm:p-7 ${isModal ? 'animate-in zoom-in-95 duration-200' : ''}`}>
        
        {/* ── Modal Top Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {isModal && (
              <button 
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Back"
              >
                <Icon name="arrow_back" className="text-[18px]" />
              </button>
            )}
            <div>
              <h2 className="font-black text-slate-900 leading-tight text-lg sm:text-xl tracking-tight">
                Unlock Advanced Insights
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Track daily to unlock intelligence tiers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 font-mono text-xs font-black px-3 py-1 rounded-full border border-emerald-200/80 hidden xs:inline-block">
              {Math.min(30, trackedDays)} / 30 Days Tracked
            </span>

            {isModal && (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            )}
          </div>
        </div>

        {/* ── Large & Prominent Tier Switcher (Big Tactile Tabs) ──────────── */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-5">
          
          {/* Tab 1: Tier 1 */}
          <button
            onClick={() => setSelectedTier('tier1')}
            className={`p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedTier === 'tier1'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/25 scale-[1.02]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-wider ${
                selectedTier === 'tier1' ? 'text-emerald-100' : 'text-slate-400'
              }`}>
                7 DAYS
              </span>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                selectedTier === 'tier1'
                  ? 'bg-white/20 text-white'
                  : (tier1Unlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500')
              }`}>
                {tier1Unlocked ? 'Unlocked' : (
                  <>
                    <span>{tier1Remaining}d Left</span>
                    <Icon name="lock" filled={true} className="text-[10px]" />
                  </>
                )}
              </span>
            </div>
            <h3 className="font-black text-sm sm:text-base leading-tight">Tier 1</h3>
          </button>

          {/* Tab 2: Tier 2 */}
          <button
            onClick={() => setSelectedTier('tier2')}
            className={`p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedTier === 'tier2'
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/25 scale-[1.02]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-wider ${
                selectedTier === 'tier2' ? 'text-amber-100' : 'text-slate-400'
              }`}>
                14 DAYS
              </span>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                selectedTier === 'tier2'
                  ? 'bg-white/20 text-white'
                  : (tier2Unlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500')
              }`}>
                {tier2Unlocked ? 'Unlocked' : (
                  <>
                    <span>{tier2Remaining}d Left</span>
                    <Icon name="lock" filled={true} className="text-[10px]" />
                  </>
                )}
              </span>
            </div>
            <h3 className="font-black text-sm sm:text-base leading-tight">Tier 2</h3>
          </button>

          {/* Tab 3: Tier 3 */}
          <button
            onClick={() => setSelectedTier('tier3')}
            className={`p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedTier === 'tier3'
                ? 'bg-sky-600 text-white border-sky-700 shadow-md shadow-sky-600/25 scale-[1.02]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-wider ${
                selectedTier === 'tier3' ? 'text-sky-100' : 'text-slate-400'
              }`}>
                30 DAYS
              </span>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                selectedTier === 'tier3'
                  ? 'bg-white/20 text-white'
                  : (tier3Unlocked ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500')
              }`}>
                {tier3Unlocked ? 'Unlocked' : (
                  <>
                    <span>{tier3Remaining}d Left</span>
                    <Icon name="lock" filled={true} className="text-[10px]" />
                  </>
                )}
              </span>
            </div>
            <h3 className="font-black text-sm sm:text-base leading-tight">Tier 3</h3>
          </button>

        </div>

        {/* ── TIER 1 CONTENT (7 DAYS) ─────────────────────────────────────── */}
        {selectedTier === 'tier1' && (
          <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                Tier 1 Features (Unlocked at 7 Days)
              </span>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                tier1Unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {tier1Unlocked ? '✓ All Active' : `${tier1Remaining} Days Required`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* 1. Daily Insight Feed */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
                      <Icon name="lightbulb" filled={true} className="text-[22px]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Daily Insight Feed</h4>
                      <span className="text-xs text-emerald-700 font-bold">Daily Intelligence</span>
                    </div>
                  </div>
                  <Icon name={tier1Unlocked ? 'lock_open' : 'lock'} className={`text-[18px] shrink-0 ${tier1Unlocked ? 'text-emerald-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                  Personalized mathematical insights about your daily habits, streaks, and momentum.
                </p>
                <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 self-start border border-emerald-200/60">
                  {tier1Unlocked ? '✓ Unlocked & Active' : 'Requires 7 Days'}
                </span>
              </div>

              {/* 2. Resilience Score */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
                      <Icon name="verified_user" filled={true} className="text-[22px]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Resilience Score</h4>
                      <span className="text-xs text-emerald-700 font-bold">Bounce-Back Rate</span>
                    </div>
                  </div>
                  <Icon name={tier1Unlocked ? 'lock_open' : 'lock'} className={`text-[18px] shrink-0 ${tier1Unlocked ? 'text-emerald-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                  Calculates your 24-48 hour bounce-back rate to measure lifelong behavioral resilience.
                </p>
                <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 self-start border border-emerald-200/60">
                  {tier1Unlocked ? '✓ Unlocked & Active' : 'Requires 7 Days'}
                </span>
              </div>

              {/* 3. 7-Day Trends */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
                      <Icon name="trending_up" filled={true} className="text-[22px]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">7-Day Trends</h4>
                      <span className="text-xs text-emerald-700 font-bold">Rising & Falling Habits</span>
                    </div>
                  </div>
                  <Icon name={tier1Unlocked ? 'lock_open' : 'lock'} className={`text-[18px] shrink-0 ${tier1Unlocked ? 'text-emerald-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                  Tracks rising star habits and alerts you early about habits needing attention.
                </p>
                <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 self-start border border-emerald-200/60">
                  {tier1Unlocked ? '✓ Unlocked & Active' : 'Requires 7 Days'}
                </span>
              </div>

              {/* 4. Day Patterns */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
                      <Icon name="ChartLineUp" filled={true} className="text-[22px]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Day Patterns</h4>
                      <span className="text-xs text-emerald-700 font-bold">Sunday vs Monday</span>
                    </div>
                  </div>
                  <Icon name={tier1Unlocked ? 'lock_open' : 'lock'} className={`text-[18px] shrink-0 ${tier1Unlocked ? 'text-emerald-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                  Discovers Sunday slump patterns and leverages Monday Fresh Start willpower spikes.
                </p>
                <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 self-start border border-emerald-200/60">
                  {tier1Unlocked ? '✓ Unlocked & Active' : 'Requires 7 Days'}
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ── TIER 2 CONTENT (14 DAYS) ────────────────────────────────────── */}
        {selectedTier === 'tier2' && (
          tier2Unlocked ? (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Tier 2 Features
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  ✓ All Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Power Duo & Synergy % */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 shadow-xs flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                        <Icon name="PlugsConnected" filled={true} className="text-[22px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Power Duo & Synergy %</h4>
                        <span className="text-xs text-amber-700 font-bold">Habit Pairs</span>
                      </div>
                    </div>
                    <Icon name="lock_open" className="text-[18px] shrink-0 text-amber-500" />
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                    Identifies two habits that fuel each other and thrive together with mathematical co-occurrence.
                  </p>
                  <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                    ✓ Unlocked & Active
                  </span>
                </div>

                {/* 2. Keystone Habit */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 shadow-xs flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                        <Icon name="Crown" filled={true} className="text-[22px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Keystone Habit</h4>
                        <span className="text-xs text-amber-700 font-bold">Master Catalyst</span>
                      </div>
                    </div>
                    <Icon name="lock_open" className="text-[18px] shrink-0 text-amber-500" />
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                    Uncovers the single catalyst routine that lifts your entire daily score by +20% or more.
                  </p>
                  <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                    ✓ Unlocked & Active
                  </span>
                </div>

                {/* 3. Focus Drain */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 shadow-xs flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                        <Icon name="BatteryLow" filled={true} className="text-[22px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Focus Drain (Trade-off)</h4>
                        <span className="text-xs text-amber-700 font-bold">Willpower Conflict</span>
                      </div>
                    </div>
                    <Icon name="lock_open" className="text-[18px] shrink-0 text-amber-500" />
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                    Detects conflicting habits that compete for the same energy and suggests smart spacing.
                  </p>
                  <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                    ✓ Unlocked & Active
                  </span>
                </div>

                {/* 4. Habit Diagnostics & Root Cause Engine */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 shadow-xs flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                        <Icon name="Healing" filled={true} className="text-[22px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Habit Diagnostics & Root Cause</h4>
                        <span className="text-xs text-amber-700 font-bold">Friction & Domino Analysis</span>
                      </div>
                    </div>
                    <Icon name="lock_open" className="text-[18px] shrink-0 text-amber-500" />
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                    Pinpoints drop reasons, weekday vs weekend splits, domino risks, gap duration, and actionable science protocols.
                  </p>
                  <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                    ✓ Unlocked & Active
                  </span>
                </div>

                {/* 5. Deep Dive Analytics */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 shadow-xs flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                        <Icon name="insights" filled={true} className="text-[22px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Deep Dive Analytics</h4>
                        <span className="text-xs text-amber-700 font-bold">Full Deep Analysis</span>
                      </div>
                    </div>
                    <Icon name="lock_open" className="text-[18px] shrink-0 text-amber-500" />
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                    In-depth statistical drill-down for every single habit with recovery and trend charts.
                  </p>
                  <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 self-start border border-amber-200/60">
                    ✓ Unlocked & Active
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center gap-3 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
                <Icon name="lock" filled={true} className="text-2xl text-amber-500" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Tier 2 Insights</h4>
              <p className="text-xs text-slate-500 max-w-sm">Complete 14 total days of tracking to unlock Power Duos, Keystone Habits, and Deep Dive analytics.</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                  {tier2Remaining} {tier2Remaining === 1 ? 'Day' : 'Days'} Left
                </span>
                <div className="w-7 h-7 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-600">
                  <Icon name="lock" filled={true} className="text-[13px]" />
                </div>
              </div>
            </div>
          )
        )}

        {/* ── TIER 3 CONTENT (30 DAYS) ────────────────────────────────────── */}
        {selectedTier === 'tier3' && (
          tier3Unlocked ? (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Tier 3 Features
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  ✓ All Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Monthly Habit Score (AHS) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/70 flex items-center justify-center shrink-0">
                        <Icon name="emoji_events" filled={true} className="text-[22px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">Monthly Habit Score</h4>
                        <span className="text-xs text-sky-700 font-bold">AHS Master Grade</span>
                      </div>
                    </div>
                    <Icon name="lock_open" className="text-[18px] shrink-0 text-sky-500" />
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                    Your 30-day overall behavioral grade with historical compounding and benchmark stats.
                  </p>
                  <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 self-start border border-sky-200/60">
                    ✓ Unlocked & Active
                  </span>
                </div>

                {/* 2. 30-Day Better Report */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/70 flex items-center justify-center shrink-0">
                        <Icon name="auto_stories" filled={true} className="text-[22px]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm sm:text-[15px] leading-tight truncate">30-Day Better Report</h4>
                        <span className="text-xs text-sky-700 font-bold">Personal Documentary</span>
                      </div>
                    </div>
                    <Icon name="lock_open" className="text-[18px] shrink-0 text-sky-500" />
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
                    Personalized 30-day behavioral documentary covering superpowers, recovery, and 1080x1920 story canvas.
                  </p>
                  <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 self-start border border-sky-200/60">
                    ✓ Unlocked & Active
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center gap-3 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shadow-xs">
                <Icon name="lock" filled={true} className="text-2xl text-sky-500" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Tier 3 Insights</h4>
              <p className="text-xs text-slate-500 max-w-sm">Complete 30 total days of tracking to unlock the Monthly Habit Score (AHS) and 30-Day Better Report.</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
                  {tier3Remaining} {tier3Remaining === 1 ? 'Day' : 'Days'} Left
                </span>
                <div className="w-7 h-7 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-600">
                  <Icon name="lock" filled={true} className="text-[13px]" />
                </div>
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
}

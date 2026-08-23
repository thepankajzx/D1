import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import HabitIcon from '../components/HabitIcon';
import Icon from '../components/Icon';
import { 
  Flame, 
  Trophy, 
  ArrowLeft, 
  Sparkle, 
  CheckCircle, 
  Lock, 
  CaretRight, 
  ShieldCheck, 
  Lightning,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { 
  calculateStreakData, 
  calculateConsistencyRate, 
  getNextMilestone, 
  MILESTONE_TARGETS 
} from '../lib/streakEngine';

const MILESTONE_DEFINITIONS = [
  { target: 3, title: 'Ignition', desc: 'Pehele 3 din ki shuruat', icon: 'local_fire_department', color: 'from-amber-500 to-orange-500' },
  { target: 7, title: 'Momentum', desc: '1 pura hafta bina ruke', icon: 'bolt', color: 'from-orange-500 to-amber-600' },
  { target: 14, title: 'Habit Seed', desc: '2 hafte ki solid buniyad', icon: 'spa', color: 'from-emerald-500 to-teal-600' },
  { target: 21, title: 'Neural Path', desc: '21 Din: Dimag me aadat fix', icon: 'psychology', color: 'from-blue-500 to-indigo-600' },
  { target: 30, title: 'Solid Iron', desc: '1 Mahina consistent track record', icon: 'shield', color: 'from-indigo-500 to-purple-600' },
  { target: 60, title: 'Unstoppable', desc: '2 Mahine ki continuous jeet', icon: 'military_tech', color: 'from-purple-500 to-pink-600' },
  { target: 90, title: 'New Identity', desc: '90 Din: Ye aadat ab tumhari pehchan hai', icon: 'diamond', color: 'from-pink-500 to-rose-600' },
  { target: 180, title: 'Titan', desc: 'Aadha saal champion consistency', icon: 'crown', color: 'from-amber-400 to-yellow-600' },
  { target: 365, title: 'Grandmaster', desc: '365 Din: A full year of mastery', icon: 'stars', color: 'from-yellow-400 via-amber-500 to-red-500' }
];

export default function StreaksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialHabit = searchParams.get('habitId') || 'all';

  const { habits = [], dailySummaries = [] } = useData();
  const { isHinglish, t } = useLanguage();
  const [selectedHabitId, setSelectedHabitId] = useState(initialHabit);

  // Active habits
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);

  // Selected habit object
  const currentHabit = useMemo(() => {
    if (selectedHabitId === 'all') return null;
    return activeHabits.find(h => h.id === selectedHabitId) || null;
  }, [activeHabits, selectedHabitId]);

  // Calculate Streak & Consistency stats for selected scope
  const streakData = useMemo(() => {
    return calculateStreakData(selectedHabitId, dailySummaries);
  }, [selectedHabitId, dailySummaries]);

  const consistency30 = useMemo(() => {
    return calculateConsistencyRate(selectedHabitId, dailySummaries, 30);
  }, [selectedHabitId, dailySummaries]);

  const milestoneInfo = useMemo(() => {
    return getNextMilestone(streakData.currentStreak);
  }, [streakData.currentStreak]);

  // Habit breakdown list
  const habitBreakdowns = useMemo(() => {
    return activeHabits.map(h => {
      const sData = calculateStreakData(h.id, dailySummaries);
      const cRate = calculateConsistencyRate(h.id, dailySummaries, 30);
      const mInfo = getNextMilestone(sData.currentStreak);
      return {
        ...h,
        currentStreak: sData.currentStreak,
        longestStreak: sData.longestStreak,
        consistencyPct: cRate.consistencyPct,
        activeDays30: cRate.activeDaysInWindow,
        milestone: mInfo
      };
    }).sort((a, b) => b.currentStreak - a.currentStreak || b.consistencyPct - a.consistencyPct);
  }, [activeHabits, dailySummaries]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-100 pb-24 pt-2">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 space-y-5">

        {/* ── TOP NAVIGATION BAR ────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft size={15} weight="bold" />
            <span>{isHinglish ? 'पीछे जाएँ' : 'Back'}</span>
          </button>

          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">
              {isHinglish ? 'रोज़-मर्रा का जश्न' : 'Daily Momentum'}
            </span>
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none mt-0.5">
              {isHinglish ? 'Habit Streaks & Consistency' : 'Habit Streaks & Consistency'}
            </h1>
          </div>
        </div>

        {/* ── HABIT FILTER PILLS ────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedHabitId('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
              selectedHabitId === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                : 'bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkle size={13} weight="fill" className="text-amber-500" />
            <span>{isHinglish ? 'All Habits (Composite)' : 'All Habits (Composite)'}</span>
          </button>

          {activeHabits.map(h => {
            const isSelected = selectedHabitId === h.id;
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHabitId(h.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                    : 'bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: h.color }}>
                  <HabitIcon name={h.icon} size={9} />
                </div>
                <span className="truncate max-w-[120px]">{h.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── 1. STEADY FIRE MASTER CARD (UNIFIED STREAK + CONSISTENCY) ── */}
        <div className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-[24px] p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-12"></div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
            
            {/* A. Left: Current Streak (~45% width) */}
            <div className="w-full sm:w-[45%] flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner border border-amber-500/20">
                <Flame size={32} weight="fill" className="animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {streakData.currentStreak}
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isHinglish ? 'din streak' : 'day streak'}
                  </span>
                </div>

                {/* Miniature Flame Progress Bar (2px height) */}
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (streakData.currentStreak / (milestoneInfo.target || 1)) * 100)}%` }}
                  />
                </div>

                <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                  {currentHabit ? currentHabit.name : (isHinglish ? 'Overall App Streak' : 'Overall App Streak')}
                </span>
              </div>
            </div>

            {/* B. Middle: Consistency Ring (~25% width) */}
            <div className="w-full sm:w-[25%] flex items-center sm:justify-center gap-3 py-2 sm:py-0 border-y sm:border-y-0 sm:border-x border-slate-100 dark:border-slate-800/80 sm:px-4">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14.5"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.2"
                    strokeDasharray={91.1}
                    strokeDashoffset={91.1 - (91.1 * Math.min(100, consistency30.consistencyPct)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute font-black text-xs text-slate-900 dark:text-white">
                  {consistency30.consistencyPct}%
                </span>
              </div>
              <div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                  {isHinglish ? 'Consistent' : 'Consistent'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block">
                  {isHinglish ? `30 me se ${consistency30.activeDaysInWindow} din` : `${consistency30.activeDaysInWindow} / 30 days active`}
                </span>
              </div>
            </div>

            {/* C. Right: Longest Streak + Milestone Progress (~30% width) */}
            <div className="w-full sm:w-[30%] flex flex-col justify-center items-start sm:items-end space-y-1.5">
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block">
                  {isHinglish ? 'Personal Best:' : 'Longest:'}{' '}
                  <strong className="text-slate-900 dark:text-white font-black">{streakData.longestStreak} {isHinglish ? 'din' : 'days'}</strong>
                </span>
              </div>

              {/* Milestone Pill Badge */}
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center gap-1.5 shadow-2xs">
                <span>{milestoneInfo.label}</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. MILESTONE TROPHY WALL (BADGES) ────────────────────── */}
        <section className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-[24px] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Trophy size={18} weight="fill" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {isHinglish ? 'Streak Milestones & Trophy Wall' : 'Streak Milestones & Trophy Wall'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400">
                  {isHinglish ? 'Har ek din ka sangharsh ek naya badge unlock karta hai' : 'Every milestone unlocked cements your discipline'}
                </p>
              </div>
            </div>

            <span className="text-xs font-black text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
              {MILESTONE_DEFINITIONS.filter(m => streakData.currentStreak >= m.target).length} / {MILESTONE_DEFINITIONS.length} Unlocked
            </span>
          </div>

          {/* Milestone Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2.5">
            {MILESTONE_DEFINITIONS.map(m => {
              const isUnlocked = streakData.currentStreak >= m.target;
              const isNext = !isUnlocked && m.target === milestoneInfo.target;
              const remaining = Math.max(0, m.target - streakData.currentStreak);

              return (
                <div
                  key={m.target}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-500/30 dark:border-amber-500/20'
                      : isNext
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/60'
                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isUnlocked
                      ? 'bg-gradient-to-tr ' + m.color + ' text-white'
                      : isNext
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {isUnlocked ? (
                      <Icon name={m.icon} className="text-[20px]" />
                    ) : isNext ? (
                      <Flame size={20} weight="fill" />
                    ) : (
                      <Lock size={18} weight="bold" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {m.title}
                      </h4>
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                        {m.target}d
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {m.desc}
                    </p>
                    {isNext && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${milestoneInfo.progressPct}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 shrink-0">
                          {remaining}d left
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. ALL HABITS STREAK BREAKDOWN TABLE ─────────────────── */}
        <section className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-[24px] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {isHinglish ? 'Sabhi Habits ki Streaks' : 'All Habits Streak Breakdown'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400">
                {isHinglish ? 'Har ek habit ki current streak aur longest record' : 'Compare momentum across every habit'}
              </p>
            </div>
            <span className="text-xs font-black text-slate-400">
              {activeHabits.length} Habits
            </span>
          </div>

          <div className="space-y-2">
            {habitBreakdowns.map(h => {
              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHabitId(h.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                    selectedHabitId === h.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: h.color }}
                    >
                      <HabitIcon name={h.icon} size={15} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black truncate leading-tight">
                        {h.name}
                      </h4>
                      <span className="text-[10px] opacity-70 block font-bold mt-0.5">
                        {isHinglish ? `Best: ${h.longestStreak} din` : `Best: ${h.longestStreak} days`} • {h.consistencyPct}% consistency
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Flame size={14} weight="fill" className="text-amber-500" />
                        <span className="text-xs font-black">
                          {h.currentStreak} {isHinglish ? 'din' : 'days'}
                        </span>
                      </div>
                      <span className="text-[9.5px] opacity-70 font-semibold block">
                        {h.milestone.label}
                      </span>
                    </div>
                    <CaretRight size={14} weight="bold" className="opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. WHY CONSISTENCY WINS SAFETY NET CARD ───────────────── */}
        <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-sky-500/10 border border-emerald-500/20 text-slate-800 dark:text-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck size={20} weight="fill" />
            <h4 className="text-xs sm:text-sm font-black">
              {isHinglish ? 'Streak टूटने का डर क्यों नहीं होना चाहिए?' : 'Why Consistency Outlasts Streak Anxiety'}
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {isHinglish
              ? 'Streak टूटना जीवन का एक सामान्य हिस्सा है। अगर तुम्हारी Streak 0 हो भी जाए, लेकिन 30-दिन की Consistency 90% है, तो इसका मतलब तुम एक दिन चूके पर तुमने 27 दिन जीत हासिल की। असली पहचान लगातार वापस आने में है।'
              : 'Breaking a streak is part of life. Even if your streak resets, a 90% 30-day consistency score proves you won 27 out of 30 days. True discipline is built on relentless consistency.'}
          </p>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from '@phosphor-icons/react/dist/icons/Compass';
import { Sparkle } from '@phosphor-icons/react/dist/icons/Sparkle';
import { Lock } from '@phosphor-icons/react/dist/icons/Lock';
import { CaretRight } from '@phosphor-icons/react/dist/icons/CaretRight';
import { CaretDown } from '@phosphor-icons/react/dist/icons/CaretDown';
import { CaretUp } from '@phosphor-icons/react/dist/icons/CaretUp';
import { ArrowRight } from '@phosphor-icons/react/dist/icons/ArrowRight';
import { X } from '@phosphor-icons/react/dist/icons/X';
import HabitIcon from './HabitIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

export default function TodayTopKpis({
  habits = [],
  allSummaries = [],
  todayEntries = [],
  priorityModeEnabled = false,
  selectedDate = null
}) {
  const navigate = useNavigate();
  const { isHinglish } = useLanguage();
  const { todayCompassEnabled, earlyUnlockAll } = useData();

  const [isCompassOpen, setIsCompassOpen] = useState(false);
  const [showInsightsLockModal, setShowInsightsLockModal] = useState(false);

  // 1. All Insights Data
  const trackedDays = useMemo(() => {
    return allSummaries.filter(s => (s.overallScore > 0 || s.habitsCompleted > 0)).length;
  }, [allSummaries]);

  const isInsightsLocked = !earlyUnlockAll && trackedDays < 7;
  const daysRemaining = earlyUnlockAll ? 0 : Math.max(1, 7 - trackedDays);

  const handleInsightsClick = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    if (isInsightsLocked) {
      setShowInsightsLockModal(true);
    } else {
      navigate('/insights');
    }
  };

  // 2. Today's Compass Categorized Habits
  const categorizedHabits = useMemo(() => {
    if (!habits || habits.length === 0) return [];

    const pastSummaries = (allSummaries || [])
      .filter((s) => (s.id || s.date) !== selectedDate)
      .sort((a, b) => (b.id || b.date || '').localeCompare(a.id || a.date || ''))
      .slice(0, 14);

    const stats = habits.map((habit) => {
      let total7 = 0;
      let count7 = 0;
      let consecutiveMisses = 0;

      pastSummaries.forEach((s, idx) => {
        const sc = s?.habitScores?.[habit.id];
        if (sc !== undefined && sc !== null) {
          if (idx < 7) {
            total7 += Number(sc);
            count7++;
          }
        }
      });

      for (let i = 0; i < pastSummaries.length && i < 4; i++) {
        const sc = pastSummaries[i]?.habitScores?.[habit.id];
        if (sc !== undefined && Number(sc) < 35) {
          consecutiveMisses++;
        } else {
          break;
        }
      }

      const avg7 = count7 > 0 ? Math.round(total7 / count7) : 0;
      let weight = 1;
      if (priorityModeEnabled && habit.priorityRank) {
        if (habit.priorityRank === 1) weight = 3;
        else if (habit.priorityRank === 2) weight = 2;
        else if (habit.priorityRank === 3) weight = 1.5;
      }

      return {
        habit,
        avg7,
        consecutiveMisses,
        weight
      };
    });

    const usedHabitIds = new Set();
    const result = [];

    // Category 1: Alpha Anchor (Must Do / At Risk)
    const alphaCandidates = [...stats].sort((a, b) => {
      if (b.consecutiveMisses !== a.consecutiveMisses) return b.consecutiveMisses - a.consecutiveMisses;
      return b.weight - a.weight;
    });
    const alphaHabit = alphaCandidates[0];
    if (alphaHabit) {
      usedHabitIds.add(alphaHabit.habit.id);
      result.push({
        ...alphaHabit,
        type: 'alpha',
        labelEn: 'Alpha',
        labelHi: 'Alpha',
        tagStyle: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200/70 dark:border-rose-900/40'
      });
    }

    // Category 2: Steel Flow (Strong Momentum)
    const flowCandidates = [...stats]
      .filter((h) => !usedHabitIds.has(h.habit.id))
      .sort((a, b) => b.avg7 - a.avg7);
    const flowHabit = flowCandidates[0];
    if (flowHabit && flowHabit.avg7 >= 35) {
      usedHabitIds.add(flowHabit.habit.id);
      result.push({
        ...flowHabit,
        type: 'flow',
        labelEn: 'Steel',
        labelHi: 'Steel',
        tagStyle: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/70 dark:border-emerald-900/40'
      });
    }

    // Category 3: Buffer Slip (Lowest priority / Safe to miss)
    const bufferCandidates = [...stats]
      .filter((h) => !usedHabitIds.has(h.habit.id))
      .sort((a, b) => a.weight - b.weight || a.avg7 - b.avg7);
    const bufferHabit = bufferCandidates[0];
    if (bufferHabit) {
      usedHabitIds.add(bufferHabit.habit.id);
      result.push({
        ...bufferHabit,
        type: 'buffer',
        labelEn: 'Buffer',
        labelHi: 'Buffer',
        tagStyle: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200/70 dark:border-sky-900/40'
      });
    }

    return result;
  }, [habits, allSummaries, selectedDate, priorityModeEnabled]);

  if (!habits || habits.length === 0) return null;

  return (
    <div className="w-full select-none">
      {/* ── TOP KPI ROW: ALL INSIGHTS (ALWAYS) + TODAY'S COMPASS (ONLY IF ENABLED) ── */}
      {todayCompassEnabled ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 items-start">
          
          {/* ── LEFT KPI: ALL INSIGHTS (Indigo Theme) ── */}
          <div
            onClick={handleInsightsClick}
            className="w-full min-h-[44px] py-2 px-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl shadow-md relative overflow-hidden transition-all cursor-pointer flex items-center justify-between gap-2"
            title="Open All Insights"
          >
            {/* Left: Sparkle Icon + Title */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-full bg-white/20 text-white shadow-inner flex items-center justify-center shrink-0">
                <Sparkle size={14} weight="fill" />
              </div>
              <span className="font-extrabold text-[11px] sm:text-xs text-white tracking-tight truncate whitespace-nowrap">
                {isHinglish ? 'ऑल इनसाइट्स' : 'All Insights'}
              </span>
            </div>

            {/* Right: Status Pill + Forward Arrow */}
            <div className="flex items-center gap-1 shrink-0">
              {isInsightsLocked ? (
                <span className="text-[8.5px] sm:text-[9px] font-black text-white bg-white/20 border border-white/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap shadow-sm">
                  <Lock size={8} weight="fill" />
                  <span>{daysRemaining}d</span>
                </span>
              ) : (
                <span className="text-[8.5px] sm:text-[9px] font-black text-white bg-white/20 border border-white/30 px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                  Active
                </span>
              )}
              <CaretRight size={10} weight="bold" className="text-white/80 shrink-0" />
            </div>
          </div>

          {/* ── RIGHT KPI: TODAY'S COMPASS (Amber Theme) ── */}
          <div className="w-full bg-gradient-to-br from-white to-amber-50/40 dark:from-[#151926] dark:to-amber-950/20 text-slate-900 dark:text-white rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden transition-all hover:border-amber-400/50 flex flex-col justify-start">
            
            {/* Header Strip */}
            <div
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setIsCompassOpen(!isCompassOpen);
              }}
              className="w-full min-h-[44px] py-2 px-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-[#1c2233] transition-colors"
              title="Toggle Today's Compass"
            >
              {/* Left: Compass Icon + Title */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Compass size={14} weight="fill" />
                </div>
                <span className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 tracking-tight truncate whitespace-nowrap">
                  {isHinglish ? 'टुडे कम्पास' : "Today's Compass"}
                </span>
              </div>

              {/* Right: Dropdown Toggle Caret */}
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 transition-colors">
                {isCompassOpen ? <CaretUp size={10} weight="bold" /> : <CaretDown size={10} weight="bold" />}
              </div>
            </div>

            {/* ── Dropdown Habit Details inside Compass Card ── */}
            {isCompassOpen && (
              <div className="px-2.5 pb-2 pt-0.5 border-t border-slate-100 dark:border-slate-800/80 space-y-0 animate-in fade-in duration-150">
                <div className="divide-y divide-dashed divide-slate-200/80 dark:divide-slate-800/80">
                  {categorizedHabits.map((item) => (
                    <div
                      key={item.habit.id}
                      className="py-1 flex items-center justify-between gap-1"
                    >
                      {/* Left: Icon + Habit Name */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <HabitIcon name={item.habit.icon || 'star'} habitId={item.habit.id} boxed={true} color={item.habit.color} size={11} className="!w-4.5 !h-4.5" />
                        <span className="font-bold text-[10px] sm:text-[11px] text-slate-900 dark:text-slate-100 truncate">
                          {item.habit.name}
                        </span>
                      </div>

                      {/* Right: Tag Pill */}
                      <span className={`text-[8px] sm:text-[8.5px] font-black px-1.5 py-0.2 rounded-md border shrink-0 uppercase tracking-tight ${item.tagStyle}`}>
                        {isHinglish ? item.labelHi : item.labelEn}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Arrow to full Compass Page */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) navigator.vibrate(20);
                      navigate('/compass');
                    }}
                    className="w-4.5 h-4.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                    title="Open Full Compass Briefing"
                  >
                    <ArrowRight size={9.5} weight="bold" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* ── FULL WIDTH ALL INSIGHTS BANNER (WHEN TODAY'S COMPASS IS DISABLED) ── */
        <div
          onClick={handleInsightsClick}
          className="w-full min-h-[44px] py-2 px-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl shadow-md relative overflow-hidden transition-all cursor-pointer flex items-center justify-between gap-2"
          title="Open All Insights"
        >
          {/* Left: Sparkle Icon + Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full bg-white/20 text-white shadow-inner flex items-center justify-center shrink-0">
              <Sparkle size={14} weight="fill" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-[13px] text-white tracking-tight truncate whitespace-nowrap">
                {isHinglish ? 'ऑल इनसाइट्स (All Insights)' : 'All Habit Insights'}
              </span>
              <span className="text-[9px] font-semibold text-white/70 hidden xs:inline truncate">
                {isHinglish ? 'बिहेवियरल पैटर्न्स और सिनर्जी' : 'Behavioral archetypes & synergies'}
              </span>
            </div>
          </div>

          {/* Right: Status Pill + Forward Arrow */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isInsightsLocked ? (
              <span className="text-[8.5px] sm:text-[9.5px] font-black text-white bg-white/20 border border-white/30 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow-sm">
                <Lock size={9} weight="fill" />
                <span>{daysRemaining}d locked</span>
              </span>
            ) : (
              <span className="text-[8.5px] sm:text-[9.5px] font-black text-white bg-white/20 border border-white/30 px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                Active
              </span>
            )}
            <CaretRight size={11} weight="bold" className="text-white/80 shrink-0" />
          </div>
        </div>
      )}

      {/* ── 7-DAY INSIGHT FEED LOCK MODAL ── */}
      {showInsightsLockModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowInsightsLockModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lock size={16} weight="fill" />
                </div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {isHinglish ? '7 दिन का डेटा आवश्यक' : '7 Days of Data Required'}
                </h4>
              </div>
              <button 
                onClick={() => setShowInsightsLockModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isHinglish 
                ? `आपकी आदतों का लाइव इनसाइट फीड अनलॉक करने के लिए कम से कम 7 दिनों का डेटा आवश्यक है। अभी आपकी प्रोग्रेस चल रही है (${trackedDays}/7 दिन)।`
                : `Your personalized live daily insights feed unlocks after 7 total logged days. Currently in progress (${trackedDays}/7 days).`}
            </p>

            {/* Progress counter */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>{isHinglish ? 'आपकी प्रोग्रेस' : 'Your Progress'}</span>
                <span className="text-amber-600 dark:text-amber-400 font-black">
                  {trackedDays} / 7 {isHinglish ? 'दिन' : 'Days'} ({daysRemaining} {isHinglish ? 'दिन बाकी' : 'days left'})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, Math.round((trackedDays / 7) * 100))) }%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowInsightsLockModal(false);
                navigate('/insights');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Sparkle size={13} weight="fill" />
              <span>{isHinglish ? 'सैंपल इनसाइट्स देखें' : 'Explore Sample Insights'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

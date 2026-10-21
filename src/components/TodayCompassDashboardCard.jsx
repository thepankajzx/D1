import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, CaretDown, CaretUp, ArrowRight } from '@phosphor-icons/react';
import HabitIcon from './HabitIcon';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * TodayCompassDashboardCard
 * Ultra-compact, matching exact visual style & height of All Insights bar.
 * 
 * 3 Distinct & Unique Tactical Categories (NO generic 'Needs Focus' duplicates):
 *  1. Alpha Anchor (Must Do / Non-Negotiable today)
 *  2. Buffer Slip (Safe to skip if overwhelmed / Low penalty)
 *  3. Steel Flow (Strong unbroken momentum / Keep the flow)
 */
export default function TodayCompassDashboardCard({
  habits = [],
  allSummaries = [],
  todayEntries = [],
  priorityModeEnabled = false,
  selectedDate = null,
  className = ''
}) {
  const navigate = useNavigate();
  const { isHinglish } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Compute 3 mutually exclusive, non-duplicate habit classifications
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

    // 1. Category 1: Alpha Anchor (Must Do / At Risk of break / Top Priority)
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
        labelEn: 'Alpha Anchor',
        labelHi: 'छोड़ना मना है (Alpha)',
        tagStyle: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200/70 dark:border-rose-900/40'
      });
    }

    // 2. Category 2: Steel Flow (Strongest Momentum / 7d Avg >= 70% / Keep it going)
    const flowCandidates = [...stats]
      .filter((h) => !usedHabitIds.has(h.habit.id))
      .sort((a, b) => b.avg7 - a.avg7);
    const flowHabit = flowCandidates[0];
    if (flowHabit && flowHabit.avg7 >= 35) {
      usedHabitIds.add(flowHabit.habit.id);
      result.push({
        ...flowHabit,
        type: 'flow',
        labelEn: 'Steel Flow',
        labelHi: 'अटूट लय (Steel)',
        tagStyle: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/70 dark:border-emerald-900/40'
      });
    }

    // 3. Category 3: Buffer Slip (Lowest priority / Safe to miss if time is short)
    const bufferCandidates = [...stats]
      .filter((h) => !usedHabitIds.has(h.habit.id))
      .sort((a, b) => a.weight - b.weight || a.avg7 - b.avg7);
    const bufferHabit = bufferCandidates[0];
    if (bufferHabit) {
      usedHabitIds.add(bufferHabit.habit.id);
      result.push({
        ...bufferHabit,
        type: 'buffer',
        labelEn: 'Buffer Slip',
        labelHi: 'छूट मान्य (Buffer)',
        tagStyle: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200/70 dark:border-sky-900/40'
      });
    }

    return result;
  }, [habits, allSummaries, selectedDate, priorityModeEnabled]);

  if (!habits || habits.length === 0) return null;

  return (
    <div className={`w-full bg-white dark:bg-[#151926] text-slate-900 dark:text-white rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-all hover:border-amber-400/50 select-none ${className}`}>
      
      {/* ── Compact Header Strip (Exact match to All Insights height) ── */}
      <div
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(15);
          setIsOpen(!isOpen);
        }}
        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#1c2233] transition-colors"
      >
        {/* Left: Compass Icon + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0">
            <Compass size={13} weight="fill" />
          </div>
          <span className="font-black text-xs text-slate-900 dark:text-slate-100 tracking-wide truncate">
            {isHinglish ? 'टुडे कम्पास (Today's Compass)' : 'Today's Compass'}
          </span>
        </div>

        {/* Right: Dropdown Toggle Pill */}
        <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 transition-colors">
          {isOpen ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
        </div>
      </div>

      {/* ── Compact Dropdown Rows (Dashed Separators) ── */}
      {isOpen && (
        <div className="px-3.5 pb-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-0 animate-in fade-in duration-150">
          <div className="divide-y divide-dashed divide-slate-200/80 dark:divide-slate-800/80">
            {categorizedHabits.map((item) => (
              <div
                key={item.habit.id}
                className="py-2 flex items-center justify-between gap-2.5"
              >
                {/* Left: Icon + Habit Name + Score */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <HabitIcon name={item.habit.icon || 'star'} habitId={item.habit.id} boxed={true} size={14} color={item.habit.color} />
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.habit.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0">
                      ({item.avg7}%)
                    </span>
                  </div>
                </div>

                {/* Right: Unique High-Impact Tag */}
                <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border shrink-0 uppercase tracking-tight ${item.tagStyle}`}>
                  {isHinglish ? item.labelHi : item.labelEn}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Sleek Arrow Link */}
          <div className="pt-1.5 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate(20);
                navigate('/compass');
              }}
              className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              title="Open Compass"
            >
              <ArrowRight size={11} weight="bold" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

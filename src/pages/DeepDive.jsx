import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import BinaryTemplate from '../components/DeepDive/BinaryTemplate';
import HigherIsBetterTemplate from '../components/DeepDive/HigherIsBetterTemplate';
import LowerIsBetterTemplate from '../components/DeepDive/LowerIsBetterTemplate';
import EarlierIsBetterTemplate from '../components/DeepDive/EarlierIsBetterTemplate';
import LaterIsBetterTemplate from '../components/DeepDive/LaterIsBetterTemplate';
import OptimalRangeTemplate from '../components/DeepDive/OptimalRangeTemplate';

import { HABITS_SEED_DATA } from '../lib/premadeHabits';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

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

export default function DeepDive() {
  const query = useQuery();
  const habitId = query.get('habitId');
  const navigate = useNavigate();
  
  const { habits, allSummaries } = useData();
  const isSamplePreview = habitId === 'sample_workout' || habitId?.startsWith('sample_');
  const daysRemaining = Math.max(0, 7 - (allSummaries?.length || 0));
  
  const [periodDays, setPeriodDays] = useState(30);
  
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (periodDays - 1)); 
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, [periodDays]);

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

  const resolvedHabits = useMemo(() => {
    if (isSamplePreview) return [SAMPLE_WORKOUT_HABIT, ...(habits || [])];
    return habits || [];
  }, [isSamplePreview, habits]);

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Icon name="error_outline" className="text-4xl text-on-surface-variant mb-4" />
        <h2 className="text-xl font-bold text-on-surface">Habit Not Found</h2>
        <p className="text-on-surface-variant mt-2 mb-6">This habit may have been deleted.</p>
        <button onClick={() => navigate('/deep-dive')} className="btn-primary">
          Back to Deep Dive
        </button>
      </div>
    );
  }

  const isBinary = habit.scoringType === 'binary';
  const isHigher = (habit.scoringType === 'numeric' || habit.scoringType === 'duration' || habit.scoringType === 'number') && habit.direction === 'higher_is_better';
  const isLower = (habit.scoringType === 'numeric' || habit.scoringType === 'duration' || habit.scoringType === 'number') && habit.direction === 'lower_is_better';
  const isEarlier = habit.scoringType === 'time' && habit.direction === 'lower_is_better';
  const isLater = habit.scoringType === 'time' && habit.direction === 'higher_is_better';
  const isOptimal = habit.direction === 'optimal_range' || habit.scoringType === 'optimal_range';

  const isImplemented = isBinary || isHigher || isLower || isEarlier || isLater;

  return (
    <div className="w-full space-y-3 md:space-y-5 px-1 sm:px-2 md:px-0">
      {/* ── Sample Preview Mode (Separate Pill + Dark Card) ── */}
      {isSamplePreview && (
        <div className="space-y-2">
          {/* Standalone Pill on Top-Left */}
          <div className="flex items-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Sample Preview Mode
            </span>
          </div>

          {/* Dark Card with Lock, Text & Bottom-Right View Roadmap */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-700/60 shadow-lg flex flex-col gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="lock" filled={true} className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-bold text-white leading-tight">
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left to unlock live data
                </p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                  Explore a realistic 30-day simulation with trend curves, recovery rates &amp; weekday patterns.
                </p>
              </div>
            </div>

            {/* Bottom-Right View Roadmap */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => navigate('/roadmap')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>View Roadmap</span>
                <Icon name="arrow_forward" className="text-[13px]" />
              </button>
            </div>
          </div>
        </div>
      )}



      <nav className="flex items-center justify-between gap-2 w-full pb-1 border-b border-slate-200 dark:border-slate-800">
        {/* Top Action Bar: Back on left, Compact Period Dropdown on right */}
        <button 
          onClick={() => navigate('/deep-dive')}
          className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 cursor-pointer"
        >
          <Icon name="arrow_back" className="text-[16px]" />
          <span>Back to Deep Dive</span>
        </button>

        <div className="relative flex-shrink-0">
          <Icon name="calendar_today" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none" />
          <select 
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="pl-7 pr-6 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151a26] rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <Icon name="arrow_drop_down" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none" />
        </div>
      </nav>

      {isBinary && <BinaryTemplate habit={habit} habits={resolvedHabits} allSummaries={resolvedSummaries} dateRange={dateRange} />}
      {isHigher && <HigherIsBetterTemplate habit={habit} habits={resolvedHabits} allSummaries={resolvedSummaries} dateRange={dateRange} />}
      {isLower && <LowerIsBetterTemplate habit={habit} habits={resolvedHabits} allSummaries={resolvedSummaries} dateRange={dateRange} />}
      {isEarlier && <EarlierIsBetterTemplate habit={habit} habits={resolvedHabits} allSummaries={resolvedSummaries} dateRange={dateRange} />}
      {isLater && <LaterIsBetterTemplate habit={habit} habits={resolvedHabits} allSummaries={resolvedSummaries} dateRange={dateRange} />}
      {isOptimal && <OptimalRangeTemplate habit={habit} habits={resolvedHabits} allSummaries={resolvedSummaries} dateRange={dateRange} />}
      
      {!isImplemented && !isOptimal && (
        <div className="bg-surface-variant/30 rounded-2xl p-12 text-center border border-outline-variant/50">
          <Icon name="construction" className="text-4xl text-primary mb-4" />
          <h3 className="text-xl font-bold text-on-surface mb-2">Template Coming Soon</h3>
          <p className="text-on-surface-variant">
            The Deep Dive template for {habit.scoringType} / {habit.direction} habits is currently under construction.
          </p>
        </div>
      )}
    </div>
  );
}

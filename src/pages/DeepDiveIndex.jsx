import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CaretRight, Eye, X } from '@phosphor-icons/react';
import HabitIcon from '../components/HabitIcon';
import Icon from '../components/Icon';

export default function DeepDiveIndex() {
  const { habits, allSummaries = [] } = useData();
  const { isHinglish, t } = useLanguage();
  const navigate = useNavigate();
  const [showLockModal, setShowLockModal] = useState(false);

  const trackedDays = Math.max(0, allSummaries.length);
  const isUnlocked = trackedDays >= 7;
  const daysRemaining = Math.max(0, 7 - trackedDays);

  const priorityHabits = habits?.filter(h => h.priorityRank === 1 || h.priorityRank === 2 || h.priorityRank === 3)
    .sort((a, b) => a.priorityRank - b.priorityRank) || [];

  const handleHabitClick = (habitId) => {
    if (!isUnlocked) {
      setShowLockModal(true);
    } else {
      navigate(`/analytics/deep-dive?habitId=${habitId}`);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-6 pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="bar_chart" className="text-[22px]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('deep_dive_title', 'Deep Dive Priorities')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {t('deep_dive_sub', 'Explore advanced analytics and detailed breakdowns for your top priority habits.')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sample Preview Row (only when < 7 days) ── */}
      {!isUnlocked && (
        <button
          onClick={() => navigate('/analytics/deep-dive?habitId=sample_workout')}
          className="w-full bg-white dark:bg-[#151a26] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300 text-left group"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all">
              <Eye size={26} weight="fill" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {t('explore_sample_deep_dive', 'Explore Sample Deep Dive')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/80 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 flex items-center justify-center transition-colors flex-shrink-0">
            <CaretRight size={20} weight="bold" className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
        </button>
      )}


      {/* Priority Habits List */}
      <div className="flex flex-col gap-4 max-w-3xl mt-6">
        {priorityHabits.length > 0 ? (
          priorityHabits.map(h => (
            <button
              key={h.id}
              onClick={() => handleHabitClick(h.id)}
              className="w-full bg-white dark:bg-[#151a26] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300 text-left group"
            >
              <div className="flex items-center gap-5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/70 transition-all duration-300">
                  <HabitIcon name={h.icon || 'star'} habitId={h.id} size={28} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {h.name}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">
                    #{h.priorityRank} Priority
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isUnlocked ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                      {daysRemaining}d Left
                    </span>
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <Icon name="lock" filled={true} className="text-[16px]" />
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/80 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 flex items-center justify-center transition-colors flex-shrink-0">
                    <CaretRight size={20} weight="bold" className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200/60 border-dashed">
            <p className="text-slate-500 font-medium">No priority habits set yet.</p>
            <p className="text-xs text-slate-400 mt-2">Go to settings or habit selection to assign priorities.</p>
          </div>
        )}
      </div>

      {/* ── Lock Popup Modal ── */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" onClick={() => setShowLockModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
            {/* Top bar: Deep Dive Locked (top-left) + X (top-right) */}
            <div className="flex items-center justify-between px-5 pt-5 pb-0">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Deep Dive Locked</span>
              <button
                onClick={() => setShowLockModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer transition-all"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pt-4 pb-5 flex flex-col gap-4">
              {/* Lock icon centered */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200/80 flex items-center justify-center shadow-xs">
                  <Icon name="lock" filled={true} className="text-[32px] text-amber-500" />
                </div>
              </div>

              {/* Days Left pill */}
              <div className="flex justify-center">
                <span className="px-4 py-1.5 bg-amber-50 text-amber-700 text-sm font-bold rounded-full border border-amber-200/80">
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                </span>
              </div>

              {/* Subtitle - left aligned, well written */}
              <div className="text-left space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Keep going — you're almost there!
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Deep Dive unlocks after <strong className="text-slate-700">7 days</strong> of tracked habit data. 
                  Once active, you'll get detailed trend curves, recovery analysis, and personalised bounce-back insights.
                </p>
              </div>

              {/* Sample Preview CTA */}
              <button
                onClick={() => { setShowLockModal(false); navigate('/analytics/deep-dive?habitId=sample_workout'); }}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye size={16} weight="fill" />
                Explore Sample Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

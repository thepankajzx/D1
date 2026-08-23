import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CaretRight, Trophy, ChartLineUp } from '@phosphor-icons/react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DeepDiveStreakRecoveryBanner({ 
  habit, 
  recoveryData = {} 
}) {
  const navigate = useNavigate();
  const { isHinglish, t } = useLanguage();

  const {
    recoveryScore = null,
    totalMisses = 0,
    misses = []
  } = recoveryData;

  const recoveredMissesCount = misses.filter(m => m.recovered).length;

  const handleOpenRecoveryPage = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    navigate(`/analytics/deep-dive/recovery?habitId=${habit.id}`);
  };

  return (
    <section 
      onClick={handleOpenRecoveryPage}
      className="group bg-gradient-to-r from-[#0d0b09] via-[#1a110a] to-[#321706] text-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-orange-900/30 hover:border-orange-500/50 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col gap-3.5 sm:gap-4 w-full"
    >
      {/* Top Row: Title + Icon + Chevron Arrow */}
      <div className="flex items-center justify-between gap-3 w-full relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#281508] border border-orange-500/30 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
            <ShieldCheck size={24} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide leading-tight">
              {t('habit_resilience', 'Habit Resilience')}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-400 font-medium mt-0.5 leading-snug">
              {t('resilience_sub', '7-Day bounce-backs & comeback timeline')}
            </p>
          </div>
        </div>


        {/* Right Arrow Chevron */}
        <div className="text-orange-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all flex-shrink-0 pr-1">
          <CaretRight size={22} weight="bold" />
        </div>
      </div>

      {/* Thin Horizontal Divider */}
      <div className="w-full h-px bg-white/10 relative z-10"></div>

      {/* Bottom Row: 2 Compact KPI Metrics (Score & Bounce-Backs) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
        {/* Metric 1: SCORE */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#281508] border border-orange-500/25 text-orange-500 flex items-center justify-center flex-shrink-0">
            <ChartLineUp size={16} weight="bold" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider leading-none">
              SCORE
            </span>
            <span className="text-base sm:text-lg md:text-xl font-black text-white leading-tight mt-1">
              {recoveryScore !== null && recoveryScore !== undefined ? `${recoveryScore}%` : '—'}
            </span>
          </div>
        </div>

        {/* Metric 2: BOUNCE-BACKS */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#281508] border border-orange-500/25 text-orange-400 flex items-center justify-center flex-shrink-0">
            <Trophy size={16} weight="fill" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider leading-none">
              BOUNCE-BACKS
            </span>
            <div className="flex items-baseline gap-1 mt-1 leading-tight whitespace-nowrap">
              <span className="text-base sm:text-lg md:text-xl font-black text-orange-500">
                {recoveredMissesCount}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-stone-400">
                / {totalMisses} misses
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

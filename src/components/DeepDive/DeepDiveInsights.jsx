import React from 'react';
import Icon from '../Icon';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DeepDiveInsights({
  habit,
  summary,
  weakestDay = 'Sunday',
  improvement = 0,
  weekdayPattern = []
}) {
  const { isHinglish, t } = useLanguage();
  const daysOnTarget = summary?.daysOnTarget || 0;
  const totalDays = summary?.totalDays || 30;
  const targetPercent = Math.round((daysOnTarget / Math.max(totalDays, 1)) * 100);

  // Derive weakest day if not explicitly provided
  const derivedWeakestDay = (() => {
    if (weakestDay && weakestDay !== 'None' && weakestDay !== 'N/A') return weakestDay;
    if (weekdayPattern && weekdayPattern.length > 0) {
      const sorted = [...weekdayPattern].filter(w => w.count > 0).sort((a, b) => a.avg - b.avg);
      if (sorted.length > 0) return sorted[0].day;
    }
    return 'Sunday';
  })();

  // Circular progress ring calculation
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, targetPercent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  const hasImprovement = improvement !== null && improvement !== undefined;
  const isPositiveImprovement = improvement >= 0;

  return (
    <div className="bg-white dark:bg-[#151a26] rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between w-full">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-1 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Radiant Purple Lightbulb Icon */}
          <div className="relative flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <circle cx="12" cy="2" r="1" fill="currentColor" />
              <circle cx="4" cy="6" r="1" fill="currentColor" />
              <circle cx="20" cy="6" r="1" fill="currentColor" />
              <circle cx="2" cy="12" r="1" fill="currentColor" />
              <circle cx="22" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            {t('insights_suggestions', 'Insights & Suggestions')}
          </h3>
        </div>
      </div>

      {/* ── 3 Compact Insight Cards ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 flex-1 justify-between">
        
        {/* 1. Weakness / Warning Card (Amber) */}
        <div className="bg-gradient-to-r from-amber-50/80 to-amber-50/20 dark:from-amber-950/40 dark:to-amber-950/10 border border-amber-200/70 dark:border-amber-900/50 border-l-[3.5px] border-l-amber-500 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0 z-10 flex-1">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-amber-100 dark:border-amber-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-3 18h6v1H9v-1zm1-3h4v1h-4v-1z" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                {isHinglish ? (
                  <>{derivedWeakestDay} aapka <span className="text-amber-600 font-extrabold">weakest day</span> rehta hai.</>
                ) : (
                  <>{derivedWeakestDay} tends to be your <span className="text-amber-600 font-extrabold">weakest day</span>.</>
                )}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                {isHinglish ? 'Dopahar ka reminder set karo.' : 'Try a midday reminder.'}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 opacity-35 text-amber-400 pointer-events-none pr-0.5">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="8" cy="14" r="1" fill="currentColor" />
              <circle cx="12" cy="14" r="1" fill="currentColor" />
              <circle cx="16" cy="14" r="1" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* 2. Improvement Card (Green) */}
        <div className="bg-gradient-to-r from-emerald-50/80 to-emerald-50/20 dark:from-emerald-950/40 dark:to-emerald-950/10 border border-emerald-200/70 dark:border-emerald-900/50 border-l-[3.5px] border-l-emerald-500 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0 z-10 flex-1">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                {isPositiveImprovement ? (
                  isHinglish 
                    ? <>Score me <span className="text-emerald-600 font-extrabold">+{improvement}%</span> ka improvement!</> 
                    : <>Score improved by <span className="text-emerald-600 font-extrabold">+{improvement}%</span> vs</>
                ) : (
                  isHinglish 
                    ? <>Score <span className="text-red-500 font-extrabold">{improvement}%</span> thoda gira hai</> 
                    : <>Score dipped by <span className="text-red-500 font-extrabold">{improvement}%</span> vs</>
                )}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                {isHinglish 
                  ? (isPositiveImprovement ? 'Momentum banaye rakho!' : 'Chhoti daily wins par focus karo.') 
                  : (isPositiveImprovement ? 'the previous period!' : 'the previous period.')}
              </p>
            </div>
          </div>


          <div className="flex-shrink-0 opacity-35 text-emerald-500 pointer-events-none pr-0.5">
            <svg className="w-8 h-5" viewBox="0 0 60 40" fill="none">
              <rect x="5" y="26" width="6" height="14" rx="2" fill="currentColor" fillOpacity="0.5" />
              <rect x="17" y="20" width="6" height="20" rx="2" fill="currentColor" fillOpacity="0.6" />
              <rect x="29" y="14" width="6" height="26" rx="2" fill="currentColor" fillOpacity="0.75" />
              <rect x="41" y="6" width="6" height="34" rx="2" fill="currentColor" fillOpacity="0.9" />
              <path d="M2 30 C 15 28, 30 18, 48 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* 3. Progress / Target Card (Blue) */}
        <div className="bg-gradient-to-r from-blue-50/80 to-blue-50/20 border border-blue-200/70 border-l-[3.5px] border-l-blue-500 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0 z-10 flex-1">
            <div className="w-8 h-8 rounded-lg bg-white shadow-2xs border border-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                Hit target on <span className="text-blue-600 font-extrabold">{daysOnTarget} of {totalDays} days</span>
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                ({targetPercent}% of period).
              </p>
            </div>
          </div>

          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 flex items-center justify-center pr-0.5">
            <svg className="w-8 h-8 sm:w-9 sm:h-9 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="2.2"
                fill="transparent"
              />
              <circle
                cx="18"
                cy="18"
                r={radius}
                stroke="#2563eb"
                strokeWidth="2.2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[7.5px] sm:text-[8.5px] font-bold text-blue-600 tracking-tight">
                {targetPercent}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

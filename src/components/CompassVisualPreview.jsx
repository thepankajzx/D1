import React from 'react';
import { Compass, Sparkle, CheckCircle } from '@phosphor-icons/react';

export default function CompassVisualPreview({
  todayStats = {},
  isHinglish = false,
  isSparkling = false,
  className = ''
}) {
  const completedCount = todayStats.completedCount || 0;
  const totalCount = todayStats.totalCount || 1;
  const completionPercentage = todayStats.completionPercentage || 0;

  return (
    <div className={`w-full rounded-2xl bg-white dark:bg-[#151926] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all select-none ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Left: Compass Title & Summary */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm shadow-amber-500/20">
            <Compass size={22} weight="bold" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {isHinglish ? 'दैनिक कम्पास विश्लेषण' : 'Daily Compass Briefing'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {isHinglish
                ? `आज ${totalCount} में से ${completedCount} आदतें पूरी हो चुकी हैं`
                : `${completedCount} of ${totalCount} habits completed today`}
            </p>
          </div>
        </div>

        {/* Right: Progress Meter */}
        <div className="flex items-center gap-3 sm:justify-end">
          <div className="w-36 sm:w-44 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white shrink-0">
            {completionPercentage}%
          </span>
        </div>

      </div>
    </div>
  );
}

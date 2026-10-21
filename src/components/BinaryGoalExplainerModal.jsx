import React from 'react';
import { X, Check, Info, Sparkle } from '@phosphor-icons/react';

export default function BinaryGoalExplainerModal({ isOpen, onClose, isHinglish = false }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden text-slate-900 dark:text-white space-y-4 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Info size={18} weight="bold" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                {isHinglish ? 'गोल टाइप कैसे काम करता है?' : 'How Goal Type Works'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Build vs Quit Habit Scoring Logic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* 1. BUILD HABIT SECTION */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
          <div className="text-xs font-black text-emerald-700 dark:text-emerald-400">
            🟢 1. Build Habit (Positive Action)
          </div>

          <div className="w-full px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-bold">
            Example: Cold Shower, Reading
          </div>

          <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Use this for positive habits you want to perform consistently.
          </p>
          
          {/* Visual Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check size={14} weight="bold" />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-black text-emerald-600 dark:text-emerald-400 block leading-tight">100% Score</span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block truncate">Done / Completed</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                <X size={14} weight="bold" />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-black text-rose-600 dark:text-rose-400 block leading-tight">0% Score</span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block truncate">Missed / Skipped</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. QUIT / BREAK HABIT SECTION */}
        <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
          <div className="text-xs font-black text-rose-700 dark:text-rose-400">
            🛡️ 2. Quit Habit (Avoid / Stop)
          </div>

          <div className="w-full px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-[10.5px] font-bold">
            Example: Sugar, Alcohol, Smoking
          </div>

          <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Use this for vices you want to avoid or quit completely.
          </p>
          
          {/* Visual Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check size={14} weight="bold" />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-black text-emerald-600 dark:text-emerald-400 block leading-tight">100% Score</span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block truncate">Stayed Clean (No)</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                <X size={14} weight="bold" />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-black text-rose-600 dark:text-rose-400 block leading-tight">0% Score</span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block truncate">Slipped / Did it (Yes)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pro-Tip Box */}
        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-2.5">
          <Sparkle size={15} weight="fill" className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            <strong className="text-blue-600 dark:text-blue-400">Dashboard Rule:</strong> On your Dashboard, <strong>Green Check (✔️)</strong> is ALWAYS your 100% victory, and <strong>Red Cross (❌)</strong> is 0%.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs"
        >
          {isHinglish ? 'समझ गया (Got It)' : 'Got It'}
        </button>
      </div>
    </div>
  );
}

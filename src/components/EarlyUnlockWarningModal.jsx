import React, { useEffect } from 'react';
import { WarningCircle, ShieldCheck, LockOpen, Sparkle, X } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

export default function EarlyUnlockWarningModal({ isOpen, onClose, onUnlocked }) {
  const { isHinglish } = useLanguage();
  const { earlyUnlockAll, setEarlyUnlockAll } = useData();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmUnlock = async () => {
    if (navigator?.vibrate) navigator.vibrate(35);
    await setEarlyUnlockAll(true);
    if (onUnlocked) onUnlocked();
    onClose();
  };

  const handleRestoreRecommended = async () => {
    if (navigator?.vibrate) navigator.vibrate(20);
    await setEarlyUnlockAll(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-[#151a26] rounded-3xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 text-left space-y-3.5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header with Warning Icon */}
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
              <WarningCircle size={19} weight="fill" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block leading-none">
                {isHinglish ? "डेटा सुरक्षा चेतावनी" : "SCIENTIFIC ACCURACY WARNING"}
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                {isHinglish ? "समय से पहले इनसाइट्स अनलॉक?" : "Unlock Insights Early?"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Compact Core Rationale Banner */}
        <div className="bg-amber-50/90 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-2.5 sm:p-3 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300 text-[11.5px]">
            <Sparkle size={13} weight="fill" className="shrink-0 text-amber-500" />
            <span>{isHinglish ? "सलाह: टाइम-गेट लॉक चालू रखें" : "Recommended: Keep time gates active"}</span>
          </p>
          <p className="text-[11px] font-medium leading-snug mt-1 text-amber-900/90 dark:text-amber-200/90">
            {isHinglish ? (
              <>कम डेटा (1–3 दिन) में एल्गोरिदम केवल <strong>संयोग</strong> पकड़ता है। सच्ची आदत व सटीक न्यूरोबायोलॉजिकल पैटर्न्स के लिए साइंटिफिक टाइम-फ्रेम आवश्यक है:</>
            ) : (
              <>Under 7–30 days of logs, statistical noise mimics true habit formation. Time gates prevent premature cognitive bias and preserve scientific accuracy:</>
            )}
          </p>
        </div>

        {/* The 3 Scientific Time-Gate Thresholds (Compact 3-Column Milestone Grid) */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            {isHinglish ? "D1 टाइम-गेट लॉक्स:" : "Intentional Time Gates in D1:"}
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {/* 7D */}
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                7D
              </span>
              <span className="text-[10px] font-bold text-slate-900 dark:text-white mt-1 leading-tight">
                {isHinglish ? "वीकली रिदम" : "Weekly Rhythm"}
              </span>
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 leading-none mt-0.5 truncate max-w-full">
                Keystones
              </span>
            </div>

            {/* 14D */}
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                14D
              </span>
              <span className="text-[10px] font-bold text-slate-900 dark:text-white mt-1 leading-tight">
                {isHinglish ? "बाउंस-बैक" : "Bounce-Back"}
              </span>
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 leading-none mt-0.5 truncate max-w-full">
                Resilience
              </span>
            </div>

            {/* 30D */}
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col items-center justify-center">
              <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                30D
              </span>
              <span className="text-[10px] font-bold text-slate-900 dark:text-white mt-1 leading-tight">
                {isHinglish ? "बेटर रिपोर्ट" : "Better Report"}
              </span>
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 leading-none mt-0.5 truncate max-w-full">
                Correlations
              </span>
            </div>
          </div>
        </div>

        {/* Current State Indicator */}
        <div className="p-2 px-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {earlyUnlockAll ? (
              <LockOpen size={14} weight="fill" className="text-amber-500 shrink-0" />
            ) : (
              <ShieldCheck size={14} weight="fill" className="text-emerald-600 shrink-0" />
            )}
            <div className="text-[11px] font-bold text-slate-900 dark:text-white">
              {earlyUnlockAll 
                ? (isHinglish ? "स्थिति: अर्ली अनलॉक सक्रिय" : "Status: Early Unlock Active")
                : (isHinglish ? "स्थिति: अनुशंसित लॉक सक्रिय" : "Status: Recommended Lock Active")}
            </div>
          </div>
          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full ${
            earlyUnlockAll 
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300' 
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300'
          }`}>
            {earlyUnlockAll ? "OVERRIDE" : "RECOMMENDED"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5 pt-0.5">
          {!earlyUnlockAll ? (
            <>
              {/* Button 1: Recommended Keep Locked */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-[13px] tracking-wide shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={15} weight="bold" />
                <span>{isHinglish ? "सलाह मानें — लॉक रहने दें (अनुशंसित)" : "Keep Recommended Lock (Recommended)"}</span>
              </button>

              {/* Button 2: Danger / Override Unlock All Now */}
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-[11px] transition-all active:scale-[0.99] flex items-center justify-center gap-1 cursor-pointer"
              >
                <LockOpen size={13} weight="bold" className="text-amber-600" />
                <span>{isHinglish ? "मैं समझ गया, फिर भी अभी अनलॉक करें" : "I Understand — Unlock Early Anyway"}</span>
              </button>
            </>
          ) : (
            <>
              {/* Restore Recommended */}
              <button
                type="button"
                onClick={handleRestoreRecommended}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-[13px] tracking-wide shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={15} weight="bold" />
                <span>{isHinglish ? "अनुशंसित लॉक मोड वापस चालू करें" : "Restore Recommended Lock Mode"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                {isHinglish ? "बंद करें" : "Close"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

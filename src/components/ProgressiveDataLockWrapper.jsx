import React, { useState } from 'react';
import { Lock, LockOpen, Eye, EyeSlash, Sparkle } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProgressiveDataLockWrapper({
  requiredDays = 30,
  currentDays = 0,
  titleEn = 'Unlocks with 30 Days of Tracking',
  titleHi = '30 दिन का डेटा ट्रैक करने पर अनलॉक होगा',
  descEn = 'Calculating statistically accurate patterns requires at least 30 days of data to eliminate one-off coincidences.',
  descHi = 'सटीक और असली बिहेवियरल पैटर्न निकालने के लिए कम से कम 30 दिनों का डेटा आवश्यक है ताकि संयोग के बजाय असली आदत का पता चल सके।',
  children,
  className = ''
}) {
  const { isHinglish } = useLanguage();
  const [peekSample, setPeekSample] = useState(false);

  const isUnlocked = currentDays >= requiredDays;

  if (isUnlocked) {
    return <div className={className}>{children}</div>;
  }

  const daysRemaining = Math.max(1, requiredDays - currentDays);
  const progressPercent = Math.min(100, Math.round((currentDays / requiredDays) * 100));

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 ${className}`}>
      
      {/* ── CARD CONTENT (BLURRED OR PEEKING) ── */}
      <div className={`transition-all duration-300 ${!peekSample ? 'filter blur-[5px] opacity-40 select-none pointer-events-none' : 'opacity-90'}`}>
        {children}
      </div>

      {/* ── PEEK SAMPLE DEMO BADGE (WHEN ACTIVE) ── */}
      {peekSample && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md animate-pulse">
          <Sparkle size={12} weight="fill" />
          <span>{isHinglish ? 'सैंपल प्रीव्यू (डेमो मोड)' : 'Sample Preview (Demo)'}</span>
          <button
            type="button"
            onClick={() => setPeekSample(false)}
            className="ml-1 hover:opacity-80 cursor-pointer font-bold"
            title="Lock again"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── GLASSMORPHISM LOCK OVERLAY (SHOWN WHEN NOT PEEKING) ── */}
      {!peekSample && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-black/50 backdrop-blur-xs text-center select-none">
          <div className="max-w-md w-full p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#151a26]/95 border border-slate-200/80 dark:border-slate-700/80 shadow-xl space-y-3 animate-in zoom-in-95 duration-200">
            
            {/* Lock Icon Header */}
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <Lock size={20} weight="fill" />
              </div>
            </div>

            {/* Title & Explanation */}
            <div className="space-y-1">
              <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                {isHinglish ? titleHi : titleEn}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                {isHinglish ? descHi : descEn}
              </p>
            </div>

            {/* Progress Bar & Counter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-300">
                <span>{isHinglish ? `प्रोग्रेस: ${currentDays}/${requiredDays} दिन` : `Progress: ${currentDays}/${requiredDays} Days`}</span>
                <span className="text-amber-600 dark:text-amber-400">{daysRemaining} {isHinglish ? 'दिन शेष' : 'days left'}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500" 
                  style={{ width: `${Math.max(5, progressPercent)}%` }} 
                />
              </div>
            </div>

            {/* Interactive Peek Button */}
            <div className="pt-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(30);
                  setPeekSample(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Eye size={14} weight="bold" />
                <span>{isHinglish ? 'सैंपल प्रीव्यू देखें (Peek Preview)' : 'Peek Sample Preview'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

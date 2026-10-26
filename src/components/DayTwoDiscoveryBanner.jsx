import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { InstagramLogo, X, ArrowUpRight, PlayCircle } from '@phosphor-icons/react';
import openExternalUrl from '../utils/openExternalUrl';

export default function DayTwoDiscoveryBanner() {
  const { isHinglish } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('d1_day2_banner_dismissed') === 'true';
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('d1_day2_banner_dismissed', 'true');
    setIsDismissed(true);
  };

  const handleOpenInstagram = (e) => {
    // Open official Instagram page in native Instagram app / browser
    openExternalUrl('https://www.instagram.com/definite.d1/', e);
  };

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-4 sm:p-5 shadow-sm overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* High-Visibility Dismiss (Cross) Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        aria-label="Dismiss banner"
        title={isHinglish ? "हटाएं (Dismiss)" : "Dismiss"}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-90 z-10"
      >
        <X size={16} weight="bold" />
      </button>

      {/* Left: Icon + Content */}
      <div className="flex items-start gap-3.5 pr-6 sm:pr-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-500/20">
          <InstagramLogo size={22} weight="bold" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {isHinglish ? 'ऐप ट्यूटोरियल्स & अपडेट्स' : 'App Guides & Tutorials'}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            {isHinglish ? 'D1 के सभी फीचर्स इंस्टाग्राम पर सीखें' : 'Master D1 on Instagram'}
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed max-w-xl">
            {isHinglish
              ? 'AI Coach, Deep Dive, और नए फीचर्स को कैसे प्रभावी ढंग से उपयोग करें — छोटे-छोटे वीडियो गाइड देखें।'
              : 'Watch short 30-second guides on Habit AI Coach, Deep Dive, and how to stay consistent.'}
          </p>
        </div>
      </div>

      {/* Right: Action Button */}
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <button
          type="button"
          onClick={handleOpenInstagram}
          className="w-full sm:w-auto h-9 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs tracking-wide shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <PlayCircle size={16} weight="fill" />
          <span>{isHinglish ? 'Instagram पर देखें' : 'Watch on Instagram'}</span>
          <ArrowUpRight size={14} weight="bold" />
        </button>
      </div>

    </div>
  );
}

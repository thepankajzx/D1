import React, { useEffect } from 'react';
import { WarningCircle, ShieldCheck, LockOpen, Lock, Sparkle, X, CalendarCheck } from '@phosphor-icons/react';
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
    if (navigator.vibrate) navigator.vibrate(40);
    await setEarlyUnlockAll(true);
    if (onUnlocked) onUnlocked();
    onClose();
  };

  const handleRestoreRecommended = async () => {
    if (navigator.vibrate) navigator.vibrate(20);
    await setEarlyUnlockAll(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#151a26] rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 text-left space-y-4 max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header with Warning Icon */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <WarningCircle size={22} weight="fill" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block leading-tight">
                {isHinglish ? "वैज्ञानिक डेटा चेतावनी" : "SCIENTIFIC ACCURACY WARNING"}
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                {isHinglish ? "समय से पहले इनसाइट्स अनलॉक करने का निर्णय" : "Early Insights Unlock & Scientific Rationale"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Core Rationale Paragraph */}
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-3 sm:p-3.5 text-xs text-amber-950 dark:text-amber-200 leading-relaxed space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
            <Sparkle size={14} weight="fill" className="shrink-0 text-amber-500" />
            <span>{isHinglish ? "हम दृढ़ता से सलाह देते हैं कि इसे अभी अनलॉक न करें!" : "We strongly recommend keeping time-gated locks active!"}</span>
          </p>
          <p className="text-[11.5px] font-medium leading-relaxed opacity-95">
            {isHinglish ? (
              <>कम डेटा (1–3 दिन) में कोई भी एल्गोरिदम केवल <strong>रैंडम संयोग (Coincidence)</strong> पकड़ता है, असली आदत नहीं। जब तक आपकी आदतों का असली डेटाबेस नहीं बनता, तब तक इनसाइट्स आपको गलत दिशा में ले जा सकती हैं। इसलिए हमने हर फ़ीचर के लिए एक वैज्ञानिक टाइमफ्रेम तय किया है:</>
            ) : (
              <>Statistical models cannot differentiate temporary coincidences from genuine neurobiological habit formation with under 7–30 days of logs. Incomplete data generates false patterns and cognitive biases. Here is why each time gate was intentionally constructed:</>
            )}
          </p>
        </div>

        {/* The 3 Scientific Time-Gate Thresholds */}
        <div className="space-y-2 pt-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            {isHinglish ? "D1 टाइम-गेट क्यों लगाए गए हैं:" : "Why These Time Gates Exist in D1:"}
          </span>

          {/* 7 Days Gate */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 flex items-start gap-2.5 text-left">
            <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              7D
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {isHinglish ? "7 Days: वीकली रिदम & कीस्टोन हैबिट्स" : "7 Days: Weekly Rhythm & Keystone Habits"}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Weekdays vs Weekend
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {isHinglish 
                  ? "सोमवार से रविवार तक का पूरा 1 चक्र देखना आवश्यक है ताकि कामकाजी दिनों और सप्ताहांत के ड्रॉप्स का सही फ़र्क पता चल सके।"
                  : "A full Monday-to-Sunday cycle is mathematically required to detect variance between weekday work routines and weekend execution drops."}
              </p>
            </div>
          </div>

          {/* 14 Days Gate */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 flex items-start gap-2.5 text-left">
            <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              14D
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {isHinglish ? "14 Days: बाउंस-बैक & रेज़िलिएंस शील्ड" : "14 Days: Bounce-Back & Resilience Shield"}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  Recovery Score
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {isHinglish 
                  ? "किसी मिस के बाद वापस कमबैक करने की मानसिक ताकत मापने के लिए कम से कम 2 हफ़्ते के कमबैक साइकल्स ज़रूरी होते हैं।"
                  : "Psychological resilience cannot be scored without tracking through at least two complete off-track and comeback recovery windows."}
              </p>
            </div>
          </div>

          {/* 30 Days Gate */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 flex items-start gap-2.5 text-left">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              30D
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {isHinglish ? "30 Days: 30-Day Better Report & Deep Curves" : "30 Days: 30-Day Better Report & Correlations"}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Full Documentary
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                {isHinglish 
                  ? "मंथली ट्रेंड्स, पावर डुओ और आदतों के आपसी कनेक्शन के लिए 30 दिनों का ठोस स्टैटिस्टिकल डेटा अनिवार्य है।"
                  : "Full behavioral recap, time-of-day anchors, and inter-habit correlations require 30 calendar days to reach 95% statistical confidence."}
              </p>
            </div>
          </div>
        </div>

        {/* Current State Indicator */}
        <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {earlyUnlockAll ? (
              <LockOpen size={16} weight="fill" className="text-amber-500 shrink-0" />
            ) : (
              <ShieldCheck size={16} weight="fill" className="text-emerald-600 shrink-0" />
            )}
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {earlyUnlockAll 
                ? (isHinglish ? "वर्तमान स्थिति: समय से पहले अनलॉक एक्टिव" : "Current: Unlocked Early (Active)")
                : (isHinglish ? "वर्तमान स्थिति: अनुशंसित लॉक मोड (सक्रिय)" : "Current: Recommended Lock Mode (Active)")}
            </div>
          </div>
          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
            earlyUnlockAll 
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300' 
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300'
          }`}>
            {earlyUnlockAll ? "OVERRIDE" : "RECOMMENDED"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Button 1: Recommended Keep Locked */}
          {!earlyUnlockAll ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={16} weight="bold" />
              <span>{isHinglish ? "सलाह मानें — लॉक रहने दें (अनुशंसित)" : "Keep Recommended Lock (Recommended)"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestoreRecommended}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={16} weight="bold" />
              <span>{isHinglish ? "अनुशंसित लॉक मोड वापस चालू करें" : "Restore Recommended Lock Mode"}</span>
            </button>
          )}

          {/* Button 2: Danger / Override Unlock All Now */}
          {!earlyUnlockAll ? (
            <button
              type="button"
              onClick={handleConfirmUnlock}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LockOpen size={14} weight="bold" className="text-amber-600" />
              <span>{isHinglish ? "मैं समझ गया, फिर भी सारे लॉक्स अभी तोड़ें" : "I Understand the Risk — Unlock Everything Now"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-center"
            >
              {isHinglish ? "बंद करें" : "Close"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CaretRight, Eye, X, Lock, Sparkle, ChartLineUp } from '@phosphor-icons/react';
import HabitIcon from '../components/HabitIcon';
import Icon from '../components/Icon';

export default function DeepDiveIndex() {
  const { habits = [], allSummaries = [] } = useData();
  const { isHinglish, t } = useLanguage();
  const navigate = useNavigate();
  const [showLockModal, setShowLockModal] = useState(false);

  const trackedDays = Math.max(0, allSummaries.length);
  const isUnlocked = trackedDays >= 7;
  const daysRemaining = Math.max(1, 7 - trackedDays);

  const priorityHabits = habits?.filter(h => h.priorityRank === 1 || h.priorityRank === 2 || h.priorityRank === 3)
    .sort((a, b) => a.priorityRank - b.priorityRank) || [];

  const handleHabitClick = (habitId) => {
    if (navigator.vibrate) navigator.vibrate(30);
    if (!isUnlocked) {
      setShowLockModal(true);
    } else {
      navigate(`/analytics/deep-dive?habitId=${habitId}`);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto w-full space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* ── TOP COMPACT HEADER ── */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
          <ChartLineUp size={20} weight="bold" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
            {t('deep_dive_title', isHinglish ? 'डीप डाइव प्राथमिकताएं' : 'Deep Dive Priorities')}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
            {t('deep_dive_sub', isHinglish ? 'अपनी शीर्ष 3 प्राथमिक आदतों के लिए विस्तृत विश्लेषण देखें।' : 'Explore advanced analytics and detailed breakdowns for your top priority habits.')}
          </p>
        </div>
      </div>

      {/* ── COMPACT SAMPLE PREVIEW BUTTON (WHEN < 7 DAYS) ── */}
      {!isUnlocked && (
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(30);
            navigate('/analytics/deep-dive?habitId=sample_workout');
          }}
          className="w-full bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-[#151a26] dark:to-[#1a1e2e] border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-xs transition-all text-left group shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Eye size={18} weight="fill" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                {t('explore_sample_deep_dive', isHinglish ? 'सैंपल डीप डाइव देखें (Explore Sample)' : 'Explore Sample Deep Dive')}
              </span>
              <span className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400/80 block">
                {isHinglish ? 'डेमो मोड में पूरी रिपोर्ट्स चेक करें' : 'Preview all charts and recovery curves'}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0 shadow-2xs">
            <CaretRight size={14} weight="bold" />
          </div>
        </button>
      )}

      {/* ── PRIORITY HABITS LIST (COMPACT, SLIM PADDING, PRECISE TYPOGRAPHY) ── */}
      <div className="flex flex-col gap-2.5">
        {priorityHabits.length > 0 ? (
          priorityHabits.map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => handleHabitClick(h.id)}
              className="w-full bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition-all text-left group shadow-2xs gap-2"
            >
              {/* Left: Icon + Habit Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: (h.color || '#3b82f6') + '20', color: h.color || '#3b82f6' }}
                >
                  <HabitIcon name={h.icon || 'star'} habitId={h.id} size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                    {h.name}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 leading-none">
                    #{h.priorityRank} {isHinglish ? 'प्राथमिकता' : 'Priority'}
                  </span>
                </div>
              </div>

              {/* Right: Clean Single-Line Pill + Lock / Arrow */}
              <div className="flex items-center gap-2 shrink-0">
                {!isUnlocked ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                      {daysRemaining}d {isHinglish ? 'बाकी' : 'Left'}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-amber-500 shrink-0">
                      <Lock size={12} weight="bold" />
                    </div>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                    <CaretRight size={14} weight="bold" />
                  </div>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center border border-slate-200/60 dark:border-slate-800 border-dashed">
            <p className="text-slate-500 font-medium text-xs">No priority habits set yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Go to settings or habit selection to assign priorities.</p>
          </div>
        )}
      </div>

      {/* ── UNIFIED CONSISTENT LOCK MODAL (MATCHES RESILIENCE & BETTER REPORT) ── */}
      {showLockModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lock size={16} weight="fill" />
                </div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {isHinglish ? '7 दिन का डेटा आवश्यक' : '7 Days of Data Required'}
                </h4>
              </div>
              <button 
                onClick={() => setShowLockModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isHinglish 
                ? 'डीप डाइव एनालिटिक्स, ट्रेंड कर्व्स और रिकवरी ग्राफ को अनलॉक करने के लिए कम से कम 7 दिनों का डेटा आवश्यक है।'
                : 'Deep Dive analytics, trend curves, and detailed breakdowns unlock after 7 days of tracked habit logs.'}
            </p>

            {/* Progress counter */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>{isHinglish ? 'आपकी प्रोग्रेस' : 'Your Progress'}</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {trackedDays} / 7 {isHinglish ? 'दिन' : 'Days'} ({daysRemaining} {isHinglish ? 'दिन शेष' : 'days left'})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, Math.round((trackedDays / 7) * 100)))}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowLockModal(false);
                  navigate('/analytics/deep-dive?habitId=sample_workout');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkle size={13} weight="fill" />
                <span>{isHinglish ? 'सैंपल प्रीव्यू देखें (Peek Preview)' : 'Explore Sample Preview'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowLockModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
              >
                {isHinglish ? 'बंद करें' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

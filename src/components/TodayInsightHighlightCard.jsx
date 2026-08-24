import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useLanguage } from '../contexts/LanguageContext';
import { generateDailyInsights } from '../lib/insightEngine';
import ArchetypeExplainerModal from './ArchetypeExplainerModal';
import { Sparkle, Lock, CaretRight, X } from '@phosphor-icons/react';

export default function TodayInsightHighlightCard({ habits = [], allSummaries = [] }) {
  const navigate = useNavigate();
  const { isHinglish } = useLanguage();
  const [explainerBadge, setExplainerBadge] = useState(null);
  const [showLockModal, setShowLockModal] = useState(false);

  const trackedDays = useMemo(() => {
    return allSummaries.filter(s => (s.overallScore > 0 || s.habitsCompleted > 0)).length;
  }, [allSummaries]);

  const isLocked = trackedDays < 7;
  const daysRemaining = Math.max(1, 7 - trackedDays);

  const insights = useMemo(() => {
    return generateDailyInsights(habits, allSummaries, isHinglish);
  }, [habits, allSummaries, isHinglish]);

  // ── LOCKED PREVIEW BAR (< 7 Days) — THIN COMPACT STRIP WITH MODAL ──
  if (isLocked) {
    return (
      <>
        <div 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(25);
            setShowLockModal(true);
          }}
          className="w-full bg-white dark:bg-[#151926] hover:bg-slate-50/80 dark:hover:bg-[#1c2233] text-slate-900 dark:text-white rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-all hover:border-amber-400/50 cursor-pointer px-3.5 py-2.5 flex items-center justify-between gap-2 select-none"
        >
          {/* Left: Sparkle + All Insights */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0">
              <Sparkle size={13} weight="fill" />
            </div>
            <span className="font-black text-xs text-slate-900 dark:text-slate-100 tracking-wide truncate">
              {isHinglish ? 'दैनिक इनसाइट्स (All Insights)' : 'All Insights'}
            </span>
          </div>

          {/* Right: Lock + Days Left + Arrow */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Lock size={10} weight="fill" />
              <span>{daysRemaining}d left</span>
            </span>
            <CaretRight size={12} weight="bold" className="text-slate-400" />
          </div>
        </div>

        {/* ── 7-DAY INSIGHT FEED LOCK MODAL ── */}
        {showLockModal && (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowLockModal(false)}
          >
            <div 
              className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
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
                  <X size={14} weight="bold" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isHinglish 
                  ? `आपकी आदतों का लाइव इनसाइट फीड अनलॉक करने के लिए कम से कम 7 दिनों का डेटा आवश्यक है। अभी आपकी प्रोग्रेस चल रही है (${trackedDays}/7 दिन)। आप नीचे दिए बटन से सैंपल इनसाइट्स का प्रीव्यू देख सकते हैं।`
                  : `Your personalized live daily insights feed unlocks after 7 total logged days. Currently in progress (${trackedDays}/7 days). Explore our sample insight feed below.`}
              </p>

              {/* Progress counter */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span>{isHinglish ? 'आपकी प्रोग्रेस' : 'Your Progress'}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black">
                    {trackedDays} / 7 {isHinglish ? 'दिन' : 'Days'} ({daysRemaining} {isHinglish ? 'दिन बाकी' : 'days left'})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(10, Math.round((trackedDays / 7) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowLockModal(false);
                    navigate('/insights');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Sparkle size={13} weight="fill" />
                  <span>{isHinglish ? 'सैंपल इनसाइट्स प्रीव्यू देखें' : 'Explore Sample Preview'}</span>
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
      </>
    );
  }

  // ── UNLOCKED LIVE INSIGHT CARD (Day 8+) ──
  if (!insights || insights.length === 0) return null;
  const topInsight = insights[0];

  return (
    <div 
      onClick={() => navigate('/insights')}
      className="w-full bg-white dark:bg-[#151926] hover:bg-indigo-50/40 dark:hover:bg-[#1c2233] text-slate-900 dark:text-white rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs hover:shadow-sm relative overflow-hidden transition-all cursor-pointer p-3.5 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Sparkle size={16} weight="fill" />
        </div>
        <div className="min-w-0">
          <span className="font-black text-xs sm:text-[13px] text-slate-900 dark:text-white block truncate">
            {topInsight.title || 'Daily Insight'}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {topInsight.text || topInsight.body}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/40 px-2.5 py-1 rounded-full flex items-center gap-1">
          <span>{insights.length} Insights</span>
          <CaretRight size={11} weight="bold" className="text-indigo-500" />
        </span>
      </div>
    </div>
  );
}
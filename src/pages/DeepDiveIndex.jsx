import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CaretRight, Eye, Lock, ChartLineUp, Star, SlidersHorizontal } from '@phosphor-icons/react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import HabitIcon from '../components/HabitIcon';
import Icon from '../components/Icon';

export default function DeepDiveIndex() {
  const { currentUser: user } = useAuth();
  const { habits = [], allSummaries = [], refreshData } = useData();
  const { isHinglish, t } = useLanguage();
  const navigate = useNavigate();
  const [showLockModal, setShowLockModal] = useState(false);

  // Priority Modal State
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityRanks, setPriorityRanks] = useState({});
  const [isSavingPriority, setIsSavingPriority] = useState(false);

  const trackedDays = Math.max(0, allSummaries.length);
  const isUnlocked = trackedDays >= 7;
  const daysRemaining = Math.max(1, 7 - trackedDays);

  const priorityHabits = habits?.filter(h => h.priorityRank === 1 || h.priorityRank === 2 || h.priorityRank === 3)
    .sort((a, b) => a.priorityRank - b.priorityRank) || [];

  const handleOpenPriorityModal = () => {
    const existingRanks = {};
    habits.forEach(h => {
      if (h.priorityRank) existingRanks[h.id] = h.priorityRank;
    });
    setPriorityRanks(existingRanks);
    setShowPriorityModal(true);
  };

  const togglePriorityRank = (habitId) => {
    setPriorityRanks(prev => {
      const next = { ...prev };
      const currentRank = next[habitId];

      if (currentRank) {
        delete next[habitId];
        Object.keys(next).forEach(id => {
          if (next[id] > currentRank) {
            next[id] -= 1;
          }
        });
      } else {
        const assignedCount = Object.values(next).filter(Boolean).length;
        if (assignedCount < 3) {
          next[habitId] = assignedCount + 1;
        }
      }
      return next;
    });
  };

  const handleSavePriorities = async () => {
    if (!user) return;
    setIsSavingPriority(true);
    try {
      const prioritySetAt = new Date().toISOString();
      const count = Object.values(priorityRanks).filter(Boolean).length;
      
      const batch = writeBatch(db);
      habits.forEach(habit => {
        const rank = priorityRanks[habit.id] || null;
        const habitRef = doc(db, `users/${user.uid}/habits`, habit.id);
        batch.update(habitRef, { 
          priorityRank: rank,
          prioritySetAt: (rank && count >= 3) ? prioritySetAt : null,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      if (refreshData) await refreshData();
      setShowPriorityModal(false);
    } catch (e) {
      console.error("Error saving priorities:", e);
    } finally {
      setIsSavingPriority(false);
    }
  };

  const handleHabitClick = (habitId) => {
    if (navigator.vibrate) navigator.vibrate(30);
    if (!isUnlocked) {
      setShowLockModal(true);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      navigate(`/analytics/deep-dive?habitId=${habitId}`);
    }
  };

  return (
    <div className="w-full space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* ── TOP COMPACT HEADER ── */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
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

        {priorityHabits.length > 0 && (
          <button
            type="button"
            onClick={handleOpenPriorityModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <SlidersHorizontal size={13} weight="bold" />
            <span className="hidden sm:inline">{isHinglish ? 'प्राथमिकता बदलें' : 'Edit Priorities'}</span>
            <span className="sm:hidden">{isHinglish ? 'बदलें' : 'Edit'}</span>
          </button>
        )}
      </div>

      {/* ── COMPACT SAMPLE PREVIEW BUTTON (WHEN < 7 DAYS) ── */}
      {!isUnlocked && (
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(30);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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

      {/* ── PRIORITY HABITS LIST ── */}
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
          /* ── NO PRIORITIES SET: DIRECT ACTION CARD ── */
          <div className="bg-white dark:bg-[#131722] rounded-2xl p-5 sm:p-6 text-center border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto text-xl shadow-2xs">
              <Star size={24} weight="fill" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {isHinglish ? 'शीर्ष 3 प्राथमिक आदतें चुनें' : 'Set Your Top 3 Core Priorities'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                {isHinglish 
                  ? 'डीप डाइव एनालिटिक्स, रिकवरी ट्रेंड्स और इन-डेप्थ स्टैट्स अनलॉक करने के लिए अपनी 3 मुख्य प्राथमिकताएं सेट करें।'
                  : 'Select up to 3 core priority habits to track with advanced deep dive analytics and recovery trends.'}
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenPriorityModal}
                className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Star size={14} weight="fill" className="text-amber-400" />
                <span>{isHinglish ? 'प्रायोरिटीज़ सेट करें (Set Priorities)' : 'Set Core Priorities'}</span>
              </button>
            </div>
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

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>{isHinglish ? 'वर्तमान प्रगति' : 'Current Progress'}</span>
              <span className="font-black">{trackedDays} / 7 {isHinglish ? 'दिन' : 'Days'}</span>
            </div>

            <button 
              onClick={() => setShowLockModal(false)}
              className="w-full py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              {isHinglish ? 'समझ गया' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* ── PRIORITY SELECTION MODAL ── */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in" onClick={() => setShowPriorityModal(false)}>
          <div className="bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl flex flex-col gap-3 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Set Core Priorities</h3>
                <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Pick up to 3 core habits for priority insights.</p>
              </div>
              <button onClick={() => setShowPriorityModal(false)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer">
                <Icon name="close" className="text-[14px]" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
              {habits.map(habit => {
                const isSelected = !!priorityRanks[habit.id];
                const rank = priorityRanks[habit.id];
                return (
                  <div 
                    key={habit.id}
                    onClick={() => togglePriorityRank(habit.id)}
                    className={`px-2.5 py-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-2xs' 
                        : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} size={15} className="!w-7 !h-7 !rounded-lg shrink-0" />
                      <span className={`font-bold text-xs truncate ${isSelected ? 'text-primary dark:text-primary-light font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                        {habit.name}
                      </span>
                    </div>
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="flex items-center gap-1 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                          <span className="opacity-80">PRIORITY</span>
                          <span>#{rank}</span>
                        </div>
                      ) : (
                        <span className="text-[10.5px] font-bold text-slate-400 hover:text-primary transition-colors">
                          + Select
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button"
                onClick={() => setPriorityRanks({})} 
                className="text-[11px] font-bold text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer px-1 py-1"
              >
                Clear All
              </button>
              <button
                type="button"
                disabled={isSavingPriority}
                onClick={handleSavePriorities}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingPriority ? 'Saving...' : 'Save Priorities'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

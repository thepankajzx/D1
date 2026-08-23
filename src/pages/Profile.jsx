import DataMigrationModal from '../components/DataMigrationModal';
import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import PriorityIcon from '../components/PriorityIcon';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import ProModal from '../components/ProModal';
import UnlockInsightsRoadmap from '../components/UnlockInsightsRoadmap';
import { doc, deleteDoc, updateDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { calculateStreakData, getNextMilestone, MILESTONE_TARGETS } from '../lib/streakEngine';
import { Flame, Trophy, Lock, CheckCircle, Sparkle } from '@phosphor-icons/react';

const MILESTONE_DEFINITIONS = [
  { target: 3, title: 'Ignition', desc: 'Pehele 3 din ki solid shuruat', icon: 'local_fire_department', color: 'from-amber-500 to-orange-500' },
  { target: 7, title: 'Momentum', desc: '1 pura hafta bina ruke', icon: 'bolt', color: 'from-orange-500 to-amber-600' },
  { target: 14, title: 'Habit Seed', desc: '2 hafte ki pakki buniyad', icon: 'spa', color: 'from-emerald-500 to-teal-600' },
  { target: 21, title: 'Neural Path', desc: '21 Din: Dimag me aadat fix', icon: 'psychology', color: 'from-blue-500 to-indigo-600' },
  { target: 30, title: 'Solid Iron', desc: '1 Mahina consistent track record', icon: 'shield', color: 'from-indigo-500 to-purple-600' },
  { target: 60, title: 'Unstoppable', desc: '2 Mahine ki continuous jeet', icon: 'military_tech', color: 'from-purple-500 to-pink-600' },
  { target: 90, title: 'New Identity', desc: '90 Din: Ye aadat ab tumhari pehchan hai', icon: 'diamond', color: 'from-pink-500 to-rose-600' },
  { target: 180, title: 'Titan', desc: 'Aadha saal champion consistency', icon: 'crown', color: 'from-amber-400 to-yellow-600' },
  { target: 365, title: 'Grandmaster', desc: '365 Din: A full year of mastery', icon: 'stars', color: 'from-yellow-400 via-amber-500 to-red-500' }
];

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const { habits, setHabits, allSummaries = [], loadingData, userDoc } = useData();
  const { language, setLanguage, t, isHinglish } = useLanguage();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showBetterReportLockModal, setShowBetterReportLockModal] = useState(false);
  const [showInsightsLockModal, setShowInsightsLockModal] = useState(false);
  const [habitPendingDelete, setHabitPendingDelete] = useState(null);
  const [deleteLockDays, setDeleteLockDays] = useState(0);
  const [showDeleteLockedModal, setShowDeleteLockedModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);
  const navigate = useNavigate();

  // Streak & Milestone Calculations
  const overallStreakData = React.useMemo(() => {
    return calculateStreakData('all', allSummaries);
  }, [allSummaries]);

  const bestStreak = Math.max(overallStreakData.currentStreak, overallStreakData.longestStreak);
  const unlockedTrophiesCount = MILESTONE_DEFINITIONS.filter(m => bestStreak >= m.target).length;
  const nextMilestoneInfo = getNextMilestone(overallStreakData.currentStreak);

  // Accordion Dropdown Open States (All closed by default until tapped)
  const [openSections, setOpenSections] = useState({
    myHabits: false,
    trophyWall: false,
    unlockInsights: false,
    betterReport: false,
    membership: false,
    myProfile: false
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Priority Modal State
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showLockPopup, setShowLockPopup] = useState(false);
  const [lockDaysRemaining, setLockDaysRemaining] = useState(0);
  const [priorityRanks, setPriorityRanks] = useState({});
  const [isSavingPriority, setIsSavingPriority] = useState(false);
  const [showPrioritySavedModal, setShowPrioritySavedModal] = useState(false);
  const [savedPriorityCount, setSavedPriorityCount] = useState(0);
  const [selectedHabitDetails, setSelectedHabitDetails] = useState(null);

  // Language state & Save handler
  const [selectedLang, setSelectedLang] = useState(language);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSavedFeedback, setLangSavedFeedback] = useState(false);

  useEffect(() => {
    setSelectedLang(language);
  }, [language]);

  const handleSaveLanguage = () => {
    if (navigator.vibrate) navigator.vibrate(40);
    setLanguage(selectedLang);
    setLangSavedFeedback(true);
    setTimeout(() => setLangSavedFeedback(false), 2500);
  };


  // Check priority lock status
  const getPriorityLockStatus = () => {
    const priorityCount = habits.filter(h => h.priorityRank && h.priorityRank >= 1 && h.priorityRank <= 3).length;
    if (priorityCount < 3) return { locked: false, daysRemaining: 0 };

    const prioritySetHabit = habits.find(h => h.priorityRank && h.prioritySetAt) || habits.find(h => h.priorityRank);
    if (!prioritySetHabit) return { locked: false, daysRemaining: 0 };
    const setDate = new Date(prioritySetHabit.prioritySetAt || prioritySetHabit.createdAt || Date.now());
    const diffDays = Math.ceil((new Date() - setDate) / (1000 * 60 * 60 * 24));
    const remaining = 30 - diffDays;
    const isSuperAdmin = ['dummytest2025@example.com', 'zxofficial84@gmail.com'].includes(currentUser?.email?.toLowerCase());
    if (remaining > 0 && !isSuperAdmin) return { locked: true, daysRemaining: remaining };
    return { locked: false, daysRemaining: 0 };
  };

  const handleSetPrioritiesClick = () => {
    const { locked, daysRemaining } = getPriorityLockStatus();
    if (locked) {
      setLockDaysRemaining(daysRemaining);
      setShowLockPopup(true);
    } else {
      const existingRanks = {};
      habits.forEach(h => { if (h.priorityRank) existingRanks[h.id] = h.priorityRank; });
      setPriorityRanks(existingRanks);
      setShowPriorityModal(true);
    }
  };

  const togglePriorityRank = (habitId) => {
    setPriorityRanks(prev => {
      const next = { ...prev };
      if (next[habitId]) {
        delete next[habitId];
        const remaining = Object.entries(next).sort((a, b) => a[1] - b[1]);
        const newRanks = {};
        remaining.forEach(([id], index) => { newRanks[id] = index + 1; });
        return newRanks;
      } else {
        if (Object.keys(next).length >= 3) return next;
        const used = Object.values(next);
        let newRank = 1;
        while (used.includes(newRank)) newRank++;
        next[habitId] = newRank;
        return next;
      }
    });
  };

  const handleSavePriorities = async () => {
    setIsSavingPriority(true);
    try {
      const prioritySetAt = new Date().toISOString();
      const count = Object.values(priorityRanks).filter(Boolean).length;
      for (const habit of habits) {
        const rank = priorityRanks[habit.id] || null;
        await updateDoc(doc(db, 'users', currentUser.uid, 'habits', habit.id), {
          priorityRank: rank,
          prioritySetAt: (rank && count >= 3) ? prioritySetAt : null,
        });
      }
      setShowPriorityModal(false);
      setSavedPriorityCount(count);
      setShowPrioritySavedModal(true);
    } catch (err) {
      console.error('Error saving priorities:', err);
      alert('Failed to save priorities.');
    }
    setIsSavingPriority(false);
  };

  const formatTimeVal = (val) => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'number') {
      const totalMins = val % 1440;
      let h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
    if (typeof val === 'string') {
      if (val.includes(':')) {
        const [hStr, mStr] = val.split(':');
        let h = parseInt(hStr, 10);
        if (isNaN(h)) return val;
        const m = (mStr || '00').padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
      }
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 60) {
        return formatTimeVal(num);
      }
    }
    return String(val);
  };

  const resolveHabitUnit = (h) => {
    if (h.unit && h.unit.trim()) return h.unit.trim();
    const lower = (h.name || '').toLowerCase();
    if (lower.includes('water') || lower.includes('hydrate')) return 'Liters';
    if (lower.includes('step') || lower.includes('walk')) return 'steps';
    if (lower.includes('pushup') || lower.includes('pullup') || lower.includes('squat')) return 'reps';
    if (lower.includes('calorie') || lower.includes('kcal')) return 'kcal';
    if (lower.includes('protein')) return 'g';
    if (lower.includes('screen') || lower.includes('sleep duration')) return 'hours';
    if (lower.includes('read') || lower.includes('meditat') || lower.includes('workout') || lower.includes('study')) return 'mins';
    return '';
  };

  const getHabitTargetDisplay = (h) => {
    if (!h) return '';
    const lowerName = (h.name || '').toLowerCase();
    const unit = resolveHabitUnit(h);
    const unitStr = unit ? ` ${unit}` : '';

    if (h.scoringType === 'binary') {
      return 'Daily Check-off';
    }

    if (h.scoringType === 'time' || lowerName.includes('wake') || (lowerName.includes('sleep') && !lowerName.includes('duration'))) {
      const rawTime = h.target100 !== undefined ? h.target100 : (h.userTarget100 !== undefined ? h.userTarget100 : (h.targetTime || h.target));
      if (rawTime !== undefined && rawTime !== null && rawTime !== '') {
        const formatted = formatTimeVal(rawTime);
        if (formatted) return `by ${formatted}`;
      }
      if (lowerName.includes('wake')) return 'by 6:00 AM';
      if (lowerName.includes('sleep')) return 'by 11:00 PM';
      return 'Daily Goal';
    }

    if (h.scoringType === 'optimal_range' || h.direction === 'optimal_range') {
      const min = h.target100 !== undefined ? h.target100 : (h.userTarget100 !== undefined ? h.userTarget100 : (h.targetMin || h.min || 0));
      const max = h.targetMax || h.userTargetMax || h.max || (min ? Number(min) + 1 : 4);
      return `${min} – ${max}${unitStr}`;
    }

    const targetVal = h.target100 !== undefined ? h.target100 : (h.userTarget100 !== undefined ? h.userTarget100 : (h.target !== undefined ? h.target : h.goal));
    
    if (targetVal !== undefined && targetVal !== null && targetVal !== '') {
      const formattedNum = typeof targetVal === 'number' ? targetVal.toLocaleString() : targetVal;
      if (h.direction === 'lower_is_better') {
        return `≤ ${formattedNum}${unitStr}`;
      }
      return `${formattedNum}${unitStr}`;
    }

    if (lowerName.includes('pushup')) return `30${unitStr || ' reps'}`;
    if (lowerName.includes('screen')) return `≤ 2${unitStr || ' hours'}`;
    if (lowerName.includes('water')) return `3 – 4${unitStr || ' Liters'}`;
    if (lowerName.includes('step') || lowerName.includes('walk')) return `10,000${unitStr || ' steps'}`;
    if (lowerName.includes('read')) return `30${unitStr || ' mins'}`;
    if (lowerName.includes('protein')) return `150${unitStr || 'g'}`;
    if (lowerName.includes('calorie')) return `2,000${unitStr || ' kcal'}`;

    return unit ? `Target in ${unit}` : 'Daily Target';
  };

  const get0BaseDisplay = (h) => {
    if (!h) return '';
    const seed = HABITS_SEED_DATA.find(s => s.id === h.id || s.name === h.name);
    const val0 = h.target0 !== undefined && h.target0 !== null ? h.target0 : (seed?.target0 !== undefined ? seed.target0 : null);
    const unit = h.unit || h.defaultUnit || (seed ? seed.defaultUnit : '') || '';
    const scoringType = h.scoringType || seed?.scoringType || '';

    if (scoringType === 'time' || h.type === 'time') {
      if (val0 !== null) return formatTimeVal(val0);
      return h.direction === 'lower_is_better' ? '8:00 AM' : '12:00 AM';
    }

    if (scoringType === 'binary' || scoringType === 'boolean') {
      return 'Missed (0%)';
    }

    if (scoringType === 'subjective' || scoringType === 'scale' || scoringType === 'rating' || unit === '/10') {
      return '0 / 10';
    }

    if (val0 !== null) {
      if (scoringType === 'duration' && typeof val0 === 'number' && val0 >= 60) {
        const hrs = Math.floor(val0 / 60);
        const mins = val0 % 60;
        return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`.trim();
      }
      return `${val0.toLocaleString()} ${unit}`.trim();
    }

    return `0 ${unit}`.trim();
  };

  const handleDeleteHabit = (habitId) => {
    if (navigator.vibrate) navigator.vibrate(25);
    const habitToDelete = habits.find(h => h.id === habitId);
    if (habitToDelete && habitToDelete.createdAt) {
      const createdDate = new Date(habitToDelete.createdAt);
      const diffDays = Math.ceil((new Date() - createdDate) / (1000 * 60 * 60 * 24));
      const isSuperAdmin = import.meta.env.DEV || ['dummytest2025@example.com', 'zxofficial84@gmail.com'].includes(currentUser?.email?.toLowerCase());
      if (diffDays <= 30 && !isSuperAdmin) {
        setDeleteLockDays(Math.max(1, 30 - diffDays));
        setShowDeleteLockedModal(true);
        return;
      }
    }
    setHabitPendingDelete(habitToDelete || { id: habitId, name: 'Habit' });
    setShowDeleteConfirmModal(true);
  };

  const confirmExecuteDelete = async () => {
    if (!habitPendingDelete) return;
    setIsDeletingHabit(true);
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'habits', habitPendingDelete.id));
      setHabits(habits.filter(h => h.id !== habitPendingDelete.id));
      setShowDeleteConfirmModal(false);
      setHabitPendingDelete(null);
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      console.error("Error deleting habit:", error);
    } finally {
      setIsDeletingHabit(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
      alert("Failed to log out");
    }
  };

  const handleAddHabitClick = (e) => {
    e.preventDefault();
    if (habits.length >= 8) {
      setShowPaywall(true);
    } else {
      navigate('/onboarding/select');
    }
  };

  const { locked: priorityIsLocked, daysRemaining: priorityDaysRemaining } = getPriorityLockStatus();
  const hasPriorities = habits.some(h => h.priorityRank);
  const trackedDays = allSummaries.length;

  return (
    <div className="max-w-4xl mx-auto w-full pb-24 space-y-2.5 animate-in fade-in duration-200">
      
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center gap-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black shrink-0 shadow-2xs mt-0.5 sm:mt-0">
          <Icon name="person" className="text-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {isHinglish ? 'खाता एवं आदतें (Account & Habits)' : 'Account & Habits'}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-snug mt-0.5">
            {isHinglish ? 'अपनी सक्रिय आदतें, इनसाइट अनलॉक, रिपोर्ट्स और प्लान प्रबंधित करें।' : 'Manage your habits, insight unlocks, reports, and membership.'}
          </p>
        </div>
      </div>


            {/* ── HISTORICAL DATA MIGRATION BANNER (PROMINENT TOP) ───────────────── */}
      <div className="bg-linear-to-r from-indigo-900/90 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-4.5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-black shrink-0 shadow-inner">
            <Icon name="cloud_download" className="text-2xl text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white tracking-tight">
                {isHinglish ? 'पुराना डेटा ट्रांसफर (Historical Data Migration)' : 'Historical Data Migration'}
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Bridge Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
              {isHinglish ? 'पुराने ऐप (fci-lms) से अपना 2 महीने का इतिहास इस अकाउंट में 1-क्लिक में लोड करें।' : 'Import historical daily logs from fci-lms directly into this account.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(30);
            setShowMigrationModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 group active:scale-95"
        >
          <span>{isHinglish ? 'डेटा इंपोर्ट करें' : 'Import Data'}</span>
          <Icon name="arrow_forward" className="text-sm group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ── 1. MY HABITS (TOP ACCORDION COLUMN) ────────────────────────────────── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <div 
          onClick={() => toggleSection('myHabits')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <Icon name="grid_view" className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">My Habits</h2>
                <span className="text-[10px] font-black text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/70 px-2 py-0.5 rounded-full shrink-0">
                  {habits.length} Active
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">Your active habits, targets &amp; priorities</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon name={openSections.myHabits ? "expand_less" : "expand_more"} className="text-slate-400 text-xl" />
          </div>
        </div>

        {openSections.myHabits && (
          <div className="p-3 sm:p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-3">
            
            {/* Priority Actions Banner */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-900/50">
              <div className="flex items-center gap-2">
                <div className="text-violet-600 dark:text-violet-400 shrink-0">
                  <Icon name="star" filled={true} className="text-[16px]" />
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  {hasPriorities ? (
                    <span>Priorities set for your top 3 core habits.</span>
                  ) : (
                    <span>Set your top 3 priorities to focus analytics and recovery tracking.</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSetPrioritiesClick}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {priorityIsLocked ? (
                    <>
                      <Icon name="lock" filled={true} className="text-[12px]" />
                      <span>Locked ({priorityDaysRemaining}d)</span>
                    </>
                  ) : (
                    <span>{hasPriorities ? 'Edit Priorities' : 'Set Priorities'}</span>
                  )}
                </button>
                <button
                  onClick={handleAddHabitClick}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Icon name="add" className="text-[13px]" />
                  <span>Add Habit</span>
                </button>
              </div>
            </div>

            {/* Habits List */}
            {habits.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No habits added yet. Click 'Add Habit' above to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {habits.map((habit) => {
                  const targetStr = getHabitTargetDisplay(habit);
                  return (
                    <div 
                      key={habit.id}
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(30);
                        setSelectedHabitDetails(habit);
                      }}
                      className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#151a26] flex items-center justify-between gap-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} size={18} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs sm:text-[13px] text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">{habit.name}</span>
                            {habit.priorityRank && (
                              <span className="text-[9px] font-black text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950 px-1.5 py-0.5 rounded-md shrink-0">
                                #{habit.priorityRank}
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            {targetStr}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHabit(habit.id);
                        }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Delete Habit"
                      >
                        <Icon name="delete" className="text-[16px]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 2. STREAK MILESTONES (CARD DIRECTING TO DEDICATED PAGE) ── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <div 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            navigate('/streak-milestones');
          }}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Trophy size={18} weight="fill" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">
                  {isHinglish ? 'Streak Milestones' : 'Streak Milestones'}
                </h2>
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full shrink-0">
                  {unlockedTrophiesCount} / {MILESTONE_DEFINITIONS.length} Achieved
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {isHinglish ? 'लगातार आदतें निभाने पर मिलने वाले विशेष बैजेस और ट्रॉफ़ी' : 'Trophies and badges unlocked as you build momentum'}
              </p>
            </div>
          </div>

          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shrink-0 shadow-2xs">
            <Icon name="arrow_forward" className="text-[14px]" />
          </div>
        </div>
      </section>

      {/* ── 3. UNLOCK ADVANCED INSIGHTS (THIRD ACCORDION COLUMN) ────────────────── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <div 
          onClick={() => toggleSection('unlockInsights')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <Icon name="redeem" filled={true} className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">Unlock Advanced Insights</h2>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">Power Duos, Time-of-Day correlations, and habit radar</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon name={openSections.unlockInsights ? "expand_less" : "expand_more"} className="text-slate-400 text-xl" />
          </div>
        </div>

        {openSections.unlockInsights && (
          <div className="p-3 sm:p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="font-black text-xs text-slate-800 dark:text-slate-200">Dynamic 7-Day &amp; 30-Day Intelligence</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Track habits consistently to automatically unlock deeper behavioral correlations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(30);
                    if (trackedDays < 7) {
                      setShowInsightsLockModal(true);
                    } else {
                      navigate('/insights');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  Insights Feed
                </button>
                <button 
                  onClick={() => navigate('/roadmap')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  View Roadmap
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 3. 30-DAY BETTER REPORT (THIRD ACCORDION COLUMN) ────────────────────── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <div 
          onClick={() => toggleSection('betterReport')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <Icon name="auto_stories" filled={true} className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">30-Day Better Report</h2>
                <span className="text-[10px] font-black text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  {trackedDays >= 30 ? 'Ready' : 'In Progress'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">Your personal 30-day habit documentary &amp; growth story</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon name={openSections.betterReport ? "expand_less" : "expand_more"} className="text-slate-400 text-xl" />
          </div>
        </div>

        {openSections.betterReport && (
          <div className="p-3 sm:p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="font-black text-xs text-slate-800 dark:text-slate-200">Behavioral Documentary &amp; Superpowers</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full 30-day recap with weekly slope progress, bounce-back velocity, and next milestones.
                </p>
              </div>
              <button 
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(30);
                  if (trackedDays < 30) {
                    setShowBetterReportLockModal(true);
                  } else {
                    navigate('/better-report');
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <span>Read Story</span>
                <Icon name="arrow_forward" className="text-[13px]" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 4. MEMBERSHIP (FOURTH ACCORDION COLUMN) ────────────────────────────── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <div 
          onClick={() => toggleSection('membership')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <Icon name="workspace_premium" filled={true} className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">Membership</h2>
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0">
                  {userDoc?.isPro ? 'Pro Member' : 'Free Plan'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">Subscription tier, plan limits &amp; features</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon name={openSections.membership ? "expand_less" : "expand_more"} className="text-slate-400 text-xl" />
          </div>
        </div>

        {openSections.membership && (
          <div className="p-3 sm:p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-black text-xs text-slate-900 dark:text-white">{userDoc?.isPro ? 'Definite Pro' : 'Free Plan'}</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">Active</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {userDoc?.isPro ? 'Unlimited habits, deep dive metrics, and export capabilities.' : 'Up to 8 habits, daily check-offs, and core tracking.'}
                </p>
              </div>
              <button 
                onClick={() => navigate('/subscription')}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 5. MY PROFILE (FIFTH ACCORDION COLUMN - COLLAPSED BY DEFAULT) ─────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all">
        <div 
          onClick={() => toggleSection('myProfile')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <Icon name="person" className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">My Profile</h2>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">Personal account info, theme &amp; preferences</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Icon name={openSections.myProfile ? "expand_less" : "expand_more"} className="text-slate-400 text-xl" />
          </div>
        </div>


        {openSections.myProfile && (
          <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 space-y-5">
            
            {/* Language & Preferences Dropdown */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setIsLangDropdownOpen(prev => !prev);
                }}
                className="w-full p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon name="translate" className="text-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      {isHinglish ? 'भाषा एवं प्राथमिकताएं (Language & Preferences)' : 'Language & Preferences'}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {selectedLang === 'en' ? 'Active: English' : 'Active: Hindi (हिंदी / Hinglish)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedLang === 'en' ? 'English' : 'Hindi'}
                  </span>
                  <Icon 
                    name={isLangDropdownOpen ? "expand_less" : "expand_more"} 
                    className="text-slate-400 text-xl transition-transform" 
                  />
                </div>
              </button>

              {isLangDropdownOpen && (
                <div className="p-3.5 sm:p-4 pt-0 border-t border-slate-200/60 dark:border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(20);
                        setSelectedLang('en');
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        selectedLang === 'en'
                          ? 'bg-white dark:bg-slate-800 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">English</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        selectedLang === 'en' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {selectedLang === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(20);
                        setSelectedLang('hinglish');
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        selectedLang === 'hinglish'
                          ? 'bg-white dark:bg-slate-800 border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Hindi (हिंदी)</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        selectedLang === 'hinglish' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {selectedLang === 'hinglish' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  </div>

                  {/* Save Button & Feedback Banner */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleSaveLanguage}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Icon name="check" className="text-[14px]" />
                      <span>{isHinglish ? 'सेव करें (Save)' : 'Save'}</span>
                    </button>

                    {langSavedFeedback && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1">
                        <Icon name="check_circle" className="text-[13px]" />
                        <span>{isHinglish ? 'सफलतापूर्वक सेव हुआ' : 'Saved Successfully'}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
              <input 
                disabled 
                value={currentUser?.email || ''} 
                className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-not-allowed"
              />
            </div>



            {/* Logout & Developer Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button 
                onClick={handleLogout}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Icon name="logout" className="text-[16px]" />
                <span>Log Out</span>
              </button>


              {['dummytest2025@example.com', 'zxofficial84@gmail.com'].includes(currentUser?.email) && (
                <button 
                  onClick={async () => {
                    try { 
                      await updateDoc(doc(db, 'users', currentUser.uid), { isPro: true }); 
                      alert('Pro status granted! Please reload.'); 
                    } catch (e) { alert('Error granting Pro'); }
                  }} 
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Icon name="workspace_premium" className="text-[16px]" />
                  <span>Grant Pro (Test)</span>
                </button>
              )}

              {import.meta.env.DEV && (
                <button
                  onClick={async () => {
                    const habitsToCreate = [
                      { id: 'mock_binary', name: 'Daily Reading', icon: 'menu_book', importance: 'very_important', scoringType: 'binary', direction: 'higher_is_better' },
                      { id: 'mock_higher', name: 'Pushups', icon: 'fitness_center', importance: 'important', scoringType: 'numeric', direction: 'higher_is_better', userTarget100: 50, userTarget0: 10, unit: 'reps' },
                      { id: 'mock_lower', name: 'Screen Time', icon: 'smartphone', importance: 'very_important', scoringType: 'numeric', direction: 'lower_is_better', userTarget100: 2, userTarget0: 5, unit: 'hours' },
                      { id: 'mock_time', name: 'Wake Up Early', icon: 'alarm', importance: 'important', scoringType: 'time', direction: 'lower_is_better', userTarget100: '07:00', userTarget0: '09:00', unit: 'Time' },
                      { id: 'mock_optimal', name: 'Water Intake', icon: 'water_drop', importance: 'important', scoringType: 'optimal_range', direction: 'optimal_range', userTarget100: 3, userTarget0: 1, targetMax: 4, unit: 'liters' }
                    ];
                    const batch = writeBatch(db);
                    habitsToCreate.forEach(h => { batch.set(doc(db, 'users', currentUser.uid, 'habits', h.id), { ...h, createdAt: new Date().toISOString() }); });
                    const summariesRef = collection(db, 'users', currentUser.uid, 'dailySummaries');
                    const entriesRef = collection(db, 'users', currentUser.uid, 'entries');
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 180);
                    for (let i = 0; i <= 180; i++) {
                      const cur = new Date(start); cur.setDate(cur.getDate() + i);
                      const dStr = cur.toISOString().split('T')[0];
                      const habitScores = {}; const habitValues = {};
                      const day = cur.getDay(); const rand = Math.random(); const isWeekend = day === 0 || day === 6;
                      habitsToCreate.forEach(h => {
                        let score = 0; let rawValue = 0;
                        if (h.scoringType === 'binary') { const isYes = day === 1 || day === 2 || (day === 3 && rand < 0.75) || (day === 4 && rand < 0.92) || (day === 5 && rand < 0.80) || (day === 6 && rand < 0.67) || (day === 0 && rand < 0.80); score = isYes ? 100 : 0; rawValue = isYes; }
                        else if (h.scoringType === 'numeric' && h.direction === 'higher_is_better') { rawValue = isWeekend ? Math.floor(Math.random() * 25) : Math.floor(Math.random() * 30 + 30); score = Math.min(100, Math.max(0, Math.round(((rawValue - h.userTarget0) / (h.userTarget100 - h.userTarget0)) * 100))); }
                        else if (h.scoringType === 'numeric' && h.direction === 'lower_is_better') { rawValue = Math.random() * 6; score = Math.min(100, Math.max(0, 100 - Math.round(((rawValue - h.userTarget100) / (h.userTarget0 - h.userTarget100)) * 100))); rawValue = Math.round(rawValue * 10) / 10; }
                        else if (h.scoringType === 'time') { const minutes = isWeekend ? Math.floor(Math.random() * 120 + 480) : Math.floor(Math.random() * 60 + 390); rawValue = minutes; score = Math.min(100, Math.max(0, 100 - Math.round(((rawValue - 7 * 60) / (9 * 60 - 7 * 60)) * 100))); }
                        else if (h.scoringType === 'optimal_range') { rawValue = Math.round(Math.random() * 5 * 10) / 10; score = Math.floor(Math.random() * 101); }
                        if (Math.random() > 0.05) { habitScores[h.id] = score; habitValues[h.id] = rawValue; batch.set(doc(entriesRef, `${h.id}_${dStr}`), { habitId: h.id, rawValue, computedScore: score, entryDate: dStr, updatedAt: new Date().toISOString() }); }
                      });
                      if (Object.keys(habitScores).length > 0) { const keys = Object.keys(habitScores); const overallScore = Math.round(keys.reduce((s, k) => s + habitScores[k], 0) / keys.length); batch.set(doc(summariesRef, dStr), { habitScores, habitValues, overallScore }, { merge: true }); }
                    }
                    await batch.commit();
                    alert('Mock Data for 5 Habits (6 Months) Generated!');
                    window.location.reload();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Icon name="science" className="text-[16px]" />
                  <span>Generate 5 Habits (6M Mock Data)</span>
                </button>
              )}
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-red-50/50 border border-red-200">
                <div>
                  <h4 className="text-xs font-extrabold text-red-700">Danger Zone</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Permanently delete your account and all associated habit tracking history.</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* ── PRIORITY SELECTION MODAL ─────────────────────────────────────────── */}
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

      {/* ── PRIORITY SAVED POPUP ─────────────────────────────────────────────── */}
      {showPrioritySavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" onClick={() => setShowPrioritySavedModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center gap-3 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl">
              ⭐
            </div>
            <h3 className="text-lg font-black text-slate-900">Priorities Saved</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your {savedPriorityCount} core priorities are now configured. We will prioritize these habits in your daily insights and 30-day documentary.
            </p>
            <button onClick={() => setShowPrioritySavedModal(false)} className="mt-2 w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 cursor-pointer">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── PRIORITY LOCKED POPUP ─────────────────────────────────────────────── */}
      {showLockPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" onClick={() => setShowLockPopup(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center gap-3 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shadow-xs">
              <Icon name="lock" filled={true} className="text-3xl text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Priorities Locked</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your 3 priorities are locked for <strong className="text-slate-800">{lockDaysRemaining} more days</strong> to build consistency.
            </p>
            <button onClick={() => setShowLockPopup(false)} className="mt-2 w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 cursor-pointer">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE ACCOUNT MODAL ─────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Icon name="delete_forever" className="text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Delete Account</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you absolutely sure? This will delete all your habits, daily entries, streaks, and analytics permanently.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button 
                disabled={isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  try {
                    const habitsSnap = await getDocs(collection(db, 'users', currentUser.uid, 'habits'));
                    const batch = writeBatch(db);
                    habitsSnap.forEach(d => batch.delete(d.ref));
                    const summariesSnap = await getDocs(collection(db, 'users', currentUser.uid, 'dailySummaries'));
                    summariesSnap.forEach(d => batch.delete(d.ref));
                    const entriesSnap = await getDocs(collection(db, 'users', currentUser.uid, 'entries'));
                    entriesSnap.forEach(d => batch.delete(d.ref));
                    batch.delete(doc(db, 'users', currentUser.uid));
                    await batch.commit();
                    await logout();
                    navigate('/login');
                  } catch (err) {
                    console.error('Error deleting account:', err);
                    alert('Failed to delete account.');
                  }
                  setIsDeletingAccount(false);
                }} 
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                {isDeletingAccount ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HABIT TARGET & BASELINE DETAILS MODAL ─────────────────────────── */}
      {selectedHabitDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedHabitDetails(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Header: Icon + Name */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <HabitIcon name={selectedHabitDetails.icon || 'star'} habitId={selectedHabitDetails.id} boxed={true} size={24} />
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-slate-900 truncate">{selectedHabitDetails.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400">Scoring Targets & Benchmark</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHabitDetails(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            </div>

            {/* Target & 0% Base Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 100% Target Card */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 flex flex-col justify-between">
                <div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-700">
                    100% Target
                  </span>
                  <div className="text-base font-black text-emerald-600 mt-1 leading-tight">
                    {getHabitTargetDisplay(selectedHabitDetails)}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-emerald-700/70 mt-2">
                  Full Score Goal
                </span>
              </div>

              {/* 0% Base Card */}
              <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/70 flex flex-col justify-between">
                <div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-700">
                    0% Base
                  </span>
                  <div className="text-base font-black text-rose-600 mt-1 leading-tight">
                    {get0BaseDisplay(selectedHabitDetails)}
                  </div>
                </div>
                <span className="text-[9px] font-bold text-rose-700/70 mt-2">
                  Zero Score Base
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedHabitDetails(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── 30-DAY BETTER REPORT LOCK MODAL ── */}
      {showBetterReportLockModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lock size={16} weight="fill" />
                </div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {isHinglish ? '30 दिन का डेटा आवश्यक' : '30 Days of Data Required'}
                </h4>
              </div>
              <button 
                onClick={() => setShowBetterReportLockModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isHinglish 
                ? 'आपकी व्यक्तिगत 30-दिवसीय बिहेवियरल डॉक्यूमेंट्री और ग्रोथ स्टोरी अनलॉक करने के लिए कम से कम 30 दिनों का डेटा आवश्यक है।'
                : 'Your personal 30-day habit documentary and monthly recap requires 30 total logged days.'}
            </p>

            {/* Progress counter */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>{isHinglish ? 'आपकी प्रोग्रेस' : 'Your Progress'}</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {trackedDays} / 30 {isHinglish ? 'दिन' : 'Days'} ({Math.max(1, 30 - trackedDays)} {isHinglish ? 'दिन शेष' : 'days left'})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, Math.round((trackedDays / 30) * 100)))}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowBetterReportLockModal(false);
                  navigate('/better-report');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkle size={13} weight="fill" />
                <span>{isHinglish ? 'सैंपल प्रीव्यू देखें (Peek Preview)' : 'Explore Sample Preview'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowBetterReportLockModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
              >
                {isHinglish ? 'बंद करें' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 7-DAY INSIGHTS FEED LOCK MODAL ── */}
      {showInsightsLockModal && (
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
                onClick={() => setShowInsightsLockModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {isHinglish 
                ? 'लाइव इनसाइट्स फीड, पावर डुओ और कीस्टोन हैबिट्स निकालने के लिए कम से कम 7 दिनों का डेटा आवश्यक है।'
                : 'Unlocking your personalized habit intelligence feed, Power Duos, and Keystone correlations requires 7 days of logs.'}
            </p>

            {/* Progress counter */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>{isHinglish ? 'आपकी प्रोग्रेस' : 'Your Progress'}</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {trackedDays} / 7 {isHinglish ? 'दिन' : 'Days'} ({Math.max(1, 7 - trackedDays)} {isHinglish ? 'दिन शेष' : 'days left'})
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
                  setShowInsightsLockModal(false);
                  navigate('/insights');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Sparkle size={13} weight="fill" />
                <span>{isHinglish ? 'सैंपल प्रीव्यू देखें (Peek Preview)' : 'Explore Sample Preview'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowInsightsLockModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
              >
                {isHinglish ? 'बंद करें' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── IN-APP CUSTOM HABIT DELETE CONFIRMATION MODAL ── */}
      {showDeleteConfirmModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowDeleteConfirmModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <Icon name="delete" className="text-2xl" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isHinglish ? 'आदत हटाएँ?' : 'Delete Habit?'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {isHinglish 
                  ? `क्या आप वास्तव में "${habitPendingDelete?.name}" आदत को अपनी प्रोफ़ाइल से हटाना चाहते हैं?`
                  : `Are you sure you want to remove "${habitPendingDelete?.name}" from your active habits?`}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isDeletingHabit}
                onClick={confirmExecuteDelete}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isDeletingHabit ? (
                  <span>{isHinglish ? 'हटाया जा रहा है...' : 'Deleting...'}</span>
                ) : (
                  <>
                    <Icon name="delete" className="text-sm" />
                    <span>{isHinglish ? 'हाँ, आदत हटाएँ' : 'Yes, Delete Habit'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
              >
                {isHinglish ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 30-DAY HABIT DELETE LOCKED MODAL ── */}
      {showDeleteLockedModal && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowDeleteLockedModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Lock size={22} weight="fill" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isHinglish ? 'आदत 30 दिन के लिए लॉक है' : 'Habit Locked for 30 Days'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {isHinglish 
                  ? 'निरंतरता और मजबूत अनुशासन बनाने के लिए नई आदतों को जोड़ने के बाद 30 दिनों तक हटाया नहीं जा सकता।'
                  : 'Habits are locked for 30 days to build unbreakable consistency. You cannot remove it until the lock period ends.'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-black">
              <span className="text-slate-500 dark:text-slate-400">{isHinglish ? 'शेष समय' : 'Remaining Time'}</span>
              <span className="text-amber-600 dark:text-amber-400">{deleteLockDays} {isHinglish ? 'दिन बाकी' : 'days left'}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteLockedModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all shadow-xs"
            >
              {isHinglish ? 'समझ गया' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* ── PAYWALL MODAL ────────────────────────────────────────────────────── */}
      {showPaywall && <ProModal onClose={() => setShowPaywall(false)} />}

      {/* ── HISTORICAL DATA MIGRATION MODAL ── */}
      <DataMigrationModal isOpen={showMigrationModal} onClose={() => setShowMigrationModal(false)} />
    </div>
  );
}

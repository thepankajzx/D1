import DataMigrationModal from '../components/DataMigrationModal';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import HabitTargetEditModal from '../components/HabitTargetEditModal';
import PriorityIcon from '../components/PriorityIcon';
import EarlyUnlockWarningModal from '../components/EarlyUnlockWarningModal';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useGuest } from '../contexts/GuestContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import ProModal from '../components/ProModal';
import UnlockInsightsRoadmap from '../components/UnlockInsightsRoadmap';
import { doc, deleteDoc, updateDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { formatDuration, normalizeDurationToMinutes } from '../lib/formatDuration';
import { calculateStreakData, getNextMilestone, MILESTONE_TARGETS } from '../lib/streakEngine';
import { calculateTowerProgress, getStreakTrackingPreference } from '../lib/progressTowerEngine';
import { Flame, Trophy, Lock, CheckCircle, Sparkle, DownloadSimple, DeviceMobile, Buildings, TreeEvergreen, Clock, FloppyDisk, PencilSimple, Target, SlidersHorizontal, TreeStructure, Compass, Flask, ArrowRight, X, CaretRight, WarningCircle, Robot, Moon, Sun, Check, ArrowLeft, Crown, Prohibit } from '@phosphor-icons/react';
import ProPill from '../components/ProPill';
import { promptInstall, onInstallableChange, isStandaloneMode } from '../registerServiceWorker';
import { useTheme } from '../contexts/ThemeContext';
import { formatTimeVal as formatTimeValUtil } from '../lib/timeFormat';
import HeaderPillWidgets, { getHeaderPillsConfig, saveHeaderPillsConfig } from '../components/HeaderPillWidgets';
import BadgePersonaIcon from '../components/BadgePersonaIcon';
import { evaluateUserBadges } from '../lib/badgeEngine';

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
  const { 
    habits, 
    deletedHabits,
    setHabits, 
    allSummaries, 
    userDoc, 
    isGuest, 
    streakTrackingEnabled, 
    setStreakTrackingEnabled,
    coreXEnabled,
    setCoreXEnabled,
    todayCompassEnabled,
    setTodayCompassEnabled,
    timeFormat = '12h',
    setTimeFormat,
    aiCoachEnabled,
    setAiCoachEnabled,
    earlyUnlockAll,
    setEarlyUnlockAll,
  } = useData();
  const { exitGuestMode } = useGuest();
  const { language, setLanguage, t, isHinglish } = useLanguage();
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showBetterReportLockModal, setShowBetterReportLockModal] = useState(false);
  const [showInsightsLockModal, setShowInsightsLockModal] = useState(false);
  const [showEarlyUnlockModal, setShowEarlyUnlockModal] = useState(false);
  const [habitPendingDelete, setHabitPendingDelete] = useState(null);
  const [deleteLockDays, setDeleteLockDays] = useState(0);
  const [showDeleteLockedModal, setShowDeleteLockedModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);
  const [streakToggleFeedback, setStreakToggleFeedback] = useState(false);
  const [coreXToggleFeedback, setCoreXToggleFeedback] = useState(false);
  const [compassToggleFeedback, setCompassToggleFeedback] = useState(false);
  const [aiCoachToggleFeedback, setAiCoachToggleFeedback] = useState(false);
  const [upcomingModalFeature, setUpcomingModalFeature] = useState(null);
  const [selectedTimeFormat, setSelectedTimeFormat] = useState(timeFormat || '12h');
  const [isSavingTimeFormat, setIsSavingTimeFormat] = useState(false);
  const [timeFormatFeedback, setTimeFormatFeedback] = useState(false);
  const navigate = useNavigate();

  const handleToggleCoreX = async (enabled) => {
    if (navigator.vibrate) navigator.vibrate(25);
    await setCoreXEnabled(enabled);
    setCoreXToggleFeedback(true);
    setTimeout(() => setCoreXToggleFeedback(false), 2000);
  };

  const handleToggleCompass = async (enabled) => {
    if (navigator.vibrate) navigator.vibrate(25);
    await setTodayCompassEnabled(enabled);
    setCompassToggleFeedback(true);
    setTimeout(() => setCompassToggleFeedback(false), 2000);
  };

  const handleToggleAiCoach = async (enabled) => {
    if (navigator.vibrate) navigator.vibrate(25);
    await setAiCoachEnabled(enabled);
    setAiCoachToggleFeedback(true);
    setTimeout(() => setAiCoachToggleFeedback(false), 2000);
  };

  useEffect(() => {
    if (timeFormat) {
      setSelectedTimeFormat(timeFormat);
    }
  }, [timeFormat]);

  useEffect(() => {
    if (currentUser?.email === 'zxofficial84@gmail.com') {
      const fixedFlag = localStorage.getItem('fixed_dates_zx_jul24');
      if (!fixedFlag && habits.length > 0) {
        console.log("Fixing dates for zxofficial84");
        const fixDates = async () => {
          try {
            const batch = writeBatch(db);
            const targetDate = "2026-07-24T00:00:00.000Z";
            let changed = 0;
            
            habits.forEach(habit => {
              const nameLower = habit.name.toLowerCase();
              if (
                !nameLower.includes('cold shower') && 
                !nameLower.includes('freelance') && 
                !nameLower.includes('gratitude')
              ) {
                 const ref = doc(db, 'users', currentUser.uid, 'habits', habit.id);
                 batch.update(ref, { createdAt: targetDate });
                 changed++;
              }
            });
            if (changed > 0) {
              await batch.commit();
              console.log(`Dates fixed successfully for ${changed} habits!`);
            }
            localStorage.setItem('fixed_dates_zx_jul24', 'true');
          } catch (e) {
            console.error(e);
          }
        };
        fixDates();
      }
    }
  }, [currentUser, habits]);

  const handleToggleStreakTracking = async (enabled) => {
    if (navigator.vibrate) navigator.vibrate(25);
    await setStreakTrackingEnabled(enabled);
    setStreakToggleFeedback(true);
    setTimeout(() => setStreakToggleFeedback(false), 2000);
  };

  const handleSaveTimeFormat = async (formatToSave) => {
    const targetFormat = formatToSave || selectedTimeFormat;
    if (navigator.vibrate) navigator.vibrate(25);
    setIsSavingTimeFormat(true);
    try {
      if (setTimeFormat) {
        await setTimeFormat(targetFormat);
      } else {
        localStorage.setItem('preference_time_format', targetFormat);
        if (currentUser?.uid && !isGuest) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            timeFormat: targetFormat
          });
        }
      }
      setTimeFormatFeedback(true);
      setTimeout(() => setTimeFormatFeedback(false), 2500);
    } catch (e) {
      console.error('Error saving time format preference:', e);
    } finally {
      setIsSavingTimeFormat(false);
    }
  };

  // Pure derivation of cumulative Progress Tower state
  const towerProgress = React.useMemo(() => {
    return calculateTowerProgress(allSummaries, habits);
  }, [allSummaries, habits]);

  // Streak & Milestone Calculations
  const overallStreakData = React.useMemo(() => {
    return calculateStreakData('all', allSummaries);
  }, [allSummaries]);

  // Comprehensive Multi-dimensional Badge & Persona Engine
  const badgeState = useMemo(() => {
    return evaluateUserBadges(allSummaries, habits, streakTrackingEnabled);
  }, [allSummaries, habits, streakTrackingEnabled]);

  const bestStreak = Math.max(overallStreakData.currentStreak, overallStreakData.longestStreak);
  const unlockedTrophiesCount = badgeState.unlockedBadges.length;
  const totalTrophiesCount = badgeState.allBadges.length;
  const nextMilestoneInfo = getNextMilestone(overallStreakData.currentStreak);

  // Accordion Dropdown Open States (All closed by default until tapped)
  const [openSections, setOpenSections] = useState({
    myProfile: false,
    myHabits: false,
    headerWidgets: false,
    upcomingFeatures: false,
    trophyWall: false,
    timeGatedInsights: false,
    unlockInsights: false,
    betterReport: false,
    membership: false
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
  const [editingTargetHabit, setEditingTargetHabit] = useState(null);

  // Language state & Save handler
  const [selectedLang, setSelectedLang] = useState(language);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSavedFeedback, setLangSavedFeedback] = useState(false);

  // Top Header Pills Widgets State
  const [headerPillsConfig, setHeaderPillsConfig] = useState(getHeaderPillsConfig);
  const [activeSlotModal, setActiveSlotModal] = useState(null); // 'pill1' | 'pill2' | 'pill3' | null
  const [selectedSlotSubView, setSelectedSlotSubView] = useState(null); // 'focus_habit' | 'persona_badge' | null
  const [headerPillsSavedFeedback, setHeaderPillsSavedFeedback] = useState(false);

  const handleUpdateHeaderPill = (key, value) => {
    if (navigator.vibrate) navigator.vibrate(15);
    const updated = { ...headerPillsConfig, [key]: value };
    setHeaderPillsConfig(updated);
    saveHeaderPillsConfig(updated);
    setHeaderPillsSavedFeedback(true);
    setTimeout(() => setHeaderPillsSavedFeedback(false), 2000);
  };

  // Available Pill Slot Options for Header Widgets
  const availablePillOptions = useMemo(() => {
    const opts = [
      {
        id: 'persona_badge',
        label: isHinglish ? 'सम्मान व बैज' : 'Honors & Badges',
        desc: isHinglish ? 'अपना अर्जित किया हुआ शीर्ष सम्मान या बैज दिखाएं' : 'Display your highest earned milestone honor or badge',
        iconName: 'Crown',
        bgGradient: 'from-amber-400 to-yellow-500',
        colorClass: 'text-amber-500',
        hasSubConfig: true
      },
      {
        id: 'weekly_avg',
        label: isHinglish ? 'साप्ताहिक औसत' : 'Weekly Average Score',
        desc: isHinglish ? 'पिछले 7 दिनों की औसत पूर्णता दर' : '7-day habit completion percentage',
        iconName: 'Lightning',
        bgGradient: 'from-amber-500 to-orange-500',
        colorClass: 'text-amber-500'
      }
    ];

    if (streakTrackingEnabled) {
      opts.push({
        id: 'streak',
        label: isHinglish ? 'सक्रिय स्ट्रीक' : 'Active Streak',
        desc: isHinglish ? 'लगातार पूरे किए गए सक्रिय दिन' : 'Current consecutive streak days',
        iconName: 'Flame',
        bgGradient: 'from-orange-500 to-amber-600',
        colorClass: 'text-orange-500'
      });
    }

    opts.push(
      {
        id: 'resilience',
        label: isHinglish ? 'रेज़िलिएंस स्कोर' : 'Resilience Score',
        desc: isHinglish ? 'बाउंस-बैक और सुधार क्षमता का सूचकांक' : 'Slump bounce-back resilience index',
        iconName: 'ShieldCheck',
        bgGradient: 'from-emerald-500 to-teal-600',
        colorClass: 'text-emerald-500'
      },
      {
        id: 'today_done',
        label: isHinglish ? 'आज की प्रगति' : "Today's Completion",
        desc: isHinglish ? 'आज के पूरे किए गए हैबिट्स की संख्या' : 'Habits completed today vs total',
        iconName: 'CheckCircle',
        bgGradient: 'from-blue-500 to-indigo-600',
        colorClass: 'text-blue-500'
      },
      {
        id: 'focus_habit',
        label: isHinglish ? 'फोकस हैबिट' : 'Focus Habit',
        desc: isHinglish ? 'शीर्ष हेडर में अपनी पसंदीदा हैबिट पिन करें' : 'Pin a specific habit to the top header',
        iconName: 'Target',
        bgGradient: 'from-rose-500 to-pink-600',
        colorClass: 'text-rose-500',
        hasSubConfig: true
      },
      {
        id: 'none',
        label: isHinglish ? 'खाली छोड़ें' : 'Empty (Leave slot blank)',
        desc: isHinglish ? 'हेडर में यह स्थान खाली रखें' : 'Hide this slot from header',
        iconName: 'Prohibit',
        bgGradient: 'from-slate-400 to-slate-500',
        colorClass: 'text-slate-400'
      }
    );

    return opts;
  }, [isHinglish, streakTrackingEnabled]);





  const [canInstallApp, setCanInstallApp] = useState(false);
  const [isAppStandalone, setIsAppStandalone] = useState(false);

  useEffect(() => {
    setIsAppStandalone(isStandaloneMode());
    const unsub = onInstallableChange((installable) => {
      setCanInstallApp(installable);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setSelectedLang(language);
  }, [language]);

  // Hardware Back Button: Close active modals/subviews/accordions cleanly
  useEffect(() => {
    const handleHardwareBack = (e) => {
      // 1. Slot Config Modal & Subviews
      if (activeSlotModal) {
        if (selectedSlotSubView) {
          setSelectedSlotSubView(null);
        } else {
          setActiveSlotModal(null);
        }
        e.preventDefault();
        return;
      }
      // 2. Modals
      if (showPriorityModal) {
        setShowPriorityModal(false);
        e.preventDefault();
        return;
      }
      if (editingTargetHabit) {
        setEditingTargetHabit(null);
        e.preventDefault();
        return;
      }
      if (selectedHabitDetails) {
        setSelectedHabitDetails(null);
        e.preventDefault();
        return;
      }
      // 3. Dropdowns
      if (isLangDropdownOpen) {
        setIsLangDropdownOpen(false);
        e.preventDefault();
        return;
      }
      // 4. Accordions
      const openKey = Object.keys(openSections).find(k => openSections[k]);
      if (openKey) {
        setOpenSections(prev => ({ ...prev, [openKey]: false }));
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('d1_hardware_back', handleHardwareBack);
    return () => window.removeEventListener('d1_hardware_back', handleHardwareBack);
  }, [activeSlotModal, selectedSlotSubView, showPriorityModal, editingTargetHabit, selectedHabitDetails, isLangDropdownOpen, openSections]);

  const handleSaveLanguage = () => {
    if (navigator.vibrate) navigator.vibrate(40);
    setLanguage(selectedLang);
    setLangSavedFeedback(true);
    setTimeout(() => setLangSavedFeedback(false), 2500);
  };


  // Check priority lock status
  const getPriorityLockStatus = () => {
    if (earlyUnlockAll) return { locked: false, daysRemaining: 0 };
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
    return formatTimeValUtil(val, timeFormat);
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
      if (lowerName.includes('wake')) return timeFormat === '24h' ? 'by 06:00' : 'by 6:00 AM';
      if (lowerName.includes('sleep')) return timeFormat === '24h' ? 'by 23:00' : 'by 11:00 PM';
      return 'Daily Goal';
    }

    if (h.scoringType === 'optimal_range' || h.direction === 'optimal_range') {
      const min = h.target100 !== undefined ? h.target100 : (h.userTarget100 !== undefined ? h.userTarget100 : (h.targetMin || h.min || 0));
      const max = h.targetMax || h.userTargetMax || h.max || (min ? Number(min) + 1 : 4);
      return `${min} - ${max}${unitStr}`;
    }

    const targetVal = h.target100 !== undefined ? h.target100 : (h.userTarget100 !== undefined ? h.userTarget100 : (h.target !== undefined ? h.target : h.goal));
    
    if (targetVal !== undefined && targetVal !== null && targetVal !== '') {
      if (h.scoringType === 'duration' || lowerName.includes('sleep duration') || lowerName.includes('screen') || lowerName.includes('read') || lowerName.includes('workout') || lowerName.includes('study') || lowerName.includes('deep work') || lowerName.includes('meditat') || unit === 'hours' || unit === 'mins') {
        const durStr = formatDuration(normalizeDurationToMinutes(targetVal, unit), 'standard');
        if (h.direction === 'lower_is_better') return `≤ ${durStr}`;
        return durStr;
      }
      const formattedNum = typeof targetVal === 'number' ? targetVal.toLocaleString() : targetVal;
      if (h.direction === 'lower_is_better') {
        return `≤ ${formattedNum}${unitStr}`;
      }
      return `${formattedNum}${unitStr}`;
    }

    if (lowerName.includes('pushup')) return `30${unitStr || ' reps'}`;
    if (lowerName.includes('screen')) return `≤ 2${unitStr || ' hours'}`;
    if (lowerName.includes('water')) return `3 - 4${unitStr || ' Liters'}`;
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
      return h.direction === 'lower_is_better' 
        ? (timeFormat === '24h' ? '08:00' : '8:00 AM') 
        : (timeFormat === '24h' ? '00:00' : '12:00 AM');
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
    if (isGuest) {
      alert("You are currently exploring in Demo Mode. Habits cannot be deleted in preview.");
      return;
    }
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
    if (isGuest) {
      setShowDeleteConfirmModal(false);
      setHabitPendingDelete(null);
      return;
    }
    setIsDeletingHabit(true);
    try {
      const createdDate = new Date(habitPendingDelete.createdAt || Date.now());
      const diffDays = Math.ceil((new Date() - createdDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 30) {
        // Soft delete for history tracking
        await updateDoc(doc(db, 'users', currentUser.uid, 'habits', habitPendingDelete.id), {
          status: 'deleted',
          deletedAt: new Date().toISOString()
        });
      } else {
        // Hard delete if less than 30 days (only super admins can bypass the 30-day lock anyway)
        await deleteDoc(doc(db, 'users', currentUser.uid, 'habits', habitPendingDelete.id));
      }
      
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
    if (isGuest) {
      exitGuestMode();
      navigate('/login');
      return;
    }
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
    if (isGuest) {
      alert("You are currently exploring in Demo Mode. Sign up free to create and track your custom habits!");
      return;
    }
    const isSuperAdmin = ['dummytest2025@example.com', 'zxofficial84@gmail.com'].includes(currentUser?.email?.toLowerCase());
    const isPro = userDoc?.isPro || userDoc?.tier === 'pro' || isSuperAdmin;
    if (habits.length >= 8 && !isPro) {
      setShowPaywall(true);
    } else {
      navigate('/onboarding/select');
    }
  };

  const isSuperAdmin = ['dummytest2025@example.com', 'zxofficial84@gmail.com', 'test2025@gmail.com'].includes(currentUser?.email?.toLowerCase() || '');
  const isAllowedToEditTargets = isSuperAdmin || (allSummaries?.length || 0) >= 30;
  const { locked: priorityIsLocked, daysRemaining: priorityDaysRemaining } = getPriorityLockStatus();
  const hasPriorities = habits.some(h => h.priorityRank);
  const trackedDays = allSummaries.length;

  return (
    <div className="w-full pb-3 sm:pb-4 space-y-2.5 animate-in fade-in duration-200">
      
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



      {/* ── 1. MY PROFILE (TOP ACCORDION COLUMN) ────────────────────────────────── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <button 
          type="button"
          onClick={() => toggleSection('myProfile')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors text-left"
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
        </button>



        {openSections.myProfile && (
          <div className="p-4 sm:p-5 pt-5 sm:pt-6 border-t border-outline-variant/30 space-y-4">

            {/* Appearance / Theme Mode */}
            <div className="rounded-2xl bg-surface-container border border-outline-variant/50 overflow-hidden transition-all shadow-2xs">
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                    isDark ? "bg-amber-950/50 text-amber-400" : "bg-slate-200/70 text-slate-700"
                  }`}>
                    {isDark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      {isHinglish ? 'थीम मोड (Appearance)' : 'Appearance & Theme'}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {isDark ? (isHinglish ? 'डार्क मोड सक्रिय (Dark Mode)' : 'Dark Mode Active') : (isHinglish ? 'लाइट मोड सक्रिय (Light Mode)' : 'Light Mode Active')}
                    </p>
                  </div>
                </div>

                {/* Theme Selector Segmented Control */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setTheme('light');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      !isDark 
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5' 
                        : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <Sun size={14} weight="bold" className={!isDark ? 'text-amber-500' : ''} />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setTheme('dark');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      isDark 
                        ? 'bg-slate-900 text-white shadow-xs ring-1 ring-white/10' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Moon size={14} weight="bold" className={isDark ? 'text-amber-400' : ''} />
                    <span>Dark</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Language & Preferences Dropdown */}
            <div className="rounded-2xl bg-surface-container border border-outline-variant/50 overflow-hidden transition-all shadow-2xs">
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

            {/* Streak Tracking Toggle Preference (Default: OFF) */}
            <div 
              onClick={() => handleToggleStreakTracking(!streakTrackingEnabled)}
              className="p-3.5 sm:p-4 rounded-2xl bg-surface-container border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer hover:border-amber-500/40 transition-all select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                  streakTrackingEnabled 
                    ? 'bg-amber-500 text-white shadow-amber-500/20' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}>
                  <Flame size={18} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {isHinglish ? 'स्ट्रीक ट्रैकिंग (Streak Tracking)' : 'Streak Tracking'}
                    </h4>
                    <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full transition-colors ${
                      streakTrackingEnabled
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {streakTrackingEnabled ? 'ON' : 'OFF (Default)'}
                    </span>
                    {streakToggleFeedback && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md animate-in fade-in zoom-in-95 duration-150">
                        {streakTrackingEnabled ? (isHinglish ? 'चालू किया गया' : 'Enabled') : (isHinglish ? 'बंद किया गया' : 'Disabled')}
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isHinglish
                      ? 'अपनी आदतों के लिए लगातार दिन (consecutive-day streaks) ट्रैक करें।'
                      : 'Track consecutive-day streaks for your habits.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStreakTracking(!streakTrackingEnabled);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  streakTrackingEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle Streak Tracking"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    streakTrackingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Time Format Preference (12-Hour vs 24-Hour) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container border border-outline-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs select-none">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-900/40 shadow-2xs">
                  <Clock size={18} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {isHinglish ? 'समय प्रारूप (Time Format)' : 'Time Format'}
                    </h4>
                    <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {timeFormat === '24h' ? '24 Hours (22:30)' : '12 Hours (10:30 PM)'}
                    </span>
                    {timeFormatFeedback && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md animate-in fade-in zoom-in-95 duration-150">
                        {isHinglish ? '✓ सेव हो गया' : '✓ Saved'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isHinglish
                      ? 'पूरे ऐप में समय को 12 घंटे (AM/PM) या 24 घंटे (00-24) प्रारूप में सेट करें।'
                      : 'Sync time display across the entire app in 12-hour (AM/PM) or 24-hour format.'}
                  </p>
                </div>
              </div>

              {/* Segmented Controls (12h / 24h) + Save Button */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTimeFormat('12h');
                      handleSaveTimeFormat('12h');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedTimeFormat === '12h'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    12 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTimeFormat('24h');
                      handleSaveTimeFormat('24h');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedTimeFormat === '24h'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    24 Hours
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveTimeFormat(selectedTimeFormat)}
                  disabled={isSavingTimeFormat}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 active:scale-95 text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  title="Save time format preference"
                >
                  <FloppyDisk size={14} weight="bold" />
                  <span>{isSavingTimeFormat ? (isHinglish ? 'सेविंग...' : 'Saving...') : (isHinglish ? 'सेव करें' : 'Save')}</span>
                </button>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
              <input 
                disabled 
                value={currentUser?.email || (isGuest ? 'guest@definitetracker.com (Demo Mode)' : '')} 
                className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>



            {/* Progressive Web App (PWA) Card */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
                  <DeviceMobile size={18} weight="duotone" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">Definite App</h4>
                    {isAppStandalone ? (
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} weight="fill" />
                        Installed
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                        PWA Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAppStandalone
                      ? 'Running in standalone native-feel mode with offline capability.'
                      : 'Install to your Home Screen for instant launch and offline access.'}
                  </p>
                </div>
              </div>

              {!isAppStandalone && (
                canInstallApp ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      await promptInstall();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold text-xs shadow-xs transition-opacity cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>Install App</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium shrink-0">
                    iOS: Tap Share <strong>(⬆)</strong> &amp; <strong>Add to Home Screen</strong>
                  </div>
                )
              )}
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

      {/* ── 2. MY HABITS (SECOND ACCORDION COLUMN) ────────────────────────────── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <button 
          type="button"
          onClick={() => toggleSection('myHabits')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors text-left"
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
        </button>

        {openSections.myHabits && (
          <div className="p-3.5 sm:p-4 pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
            
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
                        <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} size={18}  color={habit.color} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs sm:text-[13px] text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">{habit.name}</span>
                            {habit.priorityRank && (
                              <span className="text-[9px] font-black text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950 px-1.5 py-0.5 rounded-md shrink-0">
                                #{habit.priorityRank}
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>{targetStr}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0"></span>
                            <span>{isHinglish ? 'जोड़ी गई:' : 'Added:'} {new Date(habit.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {isAllowedToEditTargets && (
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.vibrate) navigator.vibrate(25);
                              setEditingTargetHabit(habit);
                            }}
                            className="group flex items-stretch overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                            title="Edit Habit Targets"
                          >
                            <span className="px-2 py-1 font-bold text-[11px] flex items-center">
                              Edit Target
                            </span>
                            <span className="w-6 bg-slate-950 dark:bg-black flex items-center justify-center text-white shrink-0 group-hover:bg-amber-600 transition-colors">
                              <PencilSimple size={11} weight="bold" />
                            </span>
                          </button>
                        )}
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
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* History List */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Icon name="history" className="text-slate-400 text-[14px]" />
                <h3 className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isHinglish ? 'हिस्ट्री (पुरानी आदतें)' : 'History (Deleted Habits)'}</h3>
              </div>
              
              {(!deletedHabits || deletedHabits.length === 0) ? (
                <div className="text-center py-4 text-slate-400 text-[11px] bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  {isHinglish ? 'अभी तक कोई पुरानी आदत नहीं है। (नोट: पहले से डिलीट की गई आदतें रिकवर नहीं की जा सकतीं)' : 'No past habits found. (Note: Previously hard-deleted habits cannot be recovered)'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {deletedHabits.map((habit) => {
                    const targetStr = getHabitTargetDisplay(habit);
                    return (
                      <div 
                        key={habit.id}
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(30);
                          navigate(`/deep-dive?habitId=${habit.id}`);
                        }}
                        className="p-2.5 sm:p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-[#151a26]/50 flex items-center justify-between gap-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group opacity-80 hover:opacity-100 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} size={18}  color={habit.color} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors truncate">{habit.name}</span>
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                                Completed / Deleted
                              </span>
                            </div>
                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1.5">
                              <span>Added: {new Date(habit.createdAt || Date.now()).toLocaleDateString()}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                              <span>Ended: {new Date(habit.deletedAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0">
                          <Icon name="chevron_right" className="text-slate-300 dark:text-slate-600 text-lg group-hover:text-slate-500 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── 3. TOP HEADER WIDGETS (STANDALONE SECTION DIRECTLY UNDER MY HABITS) ── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <div 
          onClick={() => toggleSection('headerWidgets')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <SlidersHorizontal size={18} weight="bold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">
                  {isHinglish ? 'शीर्ष हेडर विजेट्स' : 'Top Header Widgets'}
                </h2>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                  headerPillsConfig.enabled 
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {headerPillsConfig.enabled ? (isHinglish ? 'चालू' : 'ACTIVE') : (isHinglish ? 'बंद' : 'OFF')}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {headerPillsConfig.enabled 
                  ? (isHinglish ? '3 त्वरित हेडर पिल्स चालू हैं' : '3 quick header pill widgets enabled')
                  : (isHinglish ? 'क्लीन मिनिमल मोड (हेडर पिल्स बंद)' : 'Minimal mode (header pills disabled)')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleUpdateHeaderPill('enabled', !headerPillsConfig.enabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                headerPillsConfig.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title="Toggle Header Pills"
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                headerPillsConfig.enabled ? 'left-5.5' : 'left-0.5'
              }`} />
            </button>

            <button
              type="button"
              onClick={() => toggleSection('headerWidgets')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
            >
              <Icon name={openSections.headerWidgets ? "expand_less" : "expand_more"} className="text-xl" />
            </button>
          </div>
        </div>

        {openSections.headerWidgets && (
          <div className="p-3.5 sm:p-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
            {/* Live Header Preview Box */}
            <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-[#10141d] border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center gap-2.5 shadow-2xs">
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
                {isHinglish ? 'लाइव हेडर प्रीव्यू' : 'LIVE HEADER PREVIEW'}
              </span>
              <div className="relative h-11 w-full flex items-center justify-center overflow-visible">
                <HeaderPillWidgets forceShow={true} />
              </div>
            </div>

            {/* 3 Clickable Slots */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'हेडर स्लॉट कॉन्फ़िगरेशन' : 'Header Slot Layout'}
                </span>
                <span className="text-[10.5px] font-semibold text-slate-400">
                  {isHinglish ? 'बदलने के लिए स्लॉट पर टैप करें' : 'Tap slot to change metric'}
                </span>
              </div>

              {[
                { slotId: 'pill1', slotNum: 1, label: isHinglish ? 'स्लॉट 1 (बायां)' : 'Slot 1 (Left)' },
                { slotId: 'pill2', slotNum: 2, label: isHinglish ? 'स्लॉट 2 (मध्य)' : 'Slot 2 (Center)' },
                { slotId: 'pill3', slotNum: 3, label: isHinglish ? 'स्लॉट 3 (दायां)' : 'Slot 3 (Right)' }
              ].map(({ slotId, label }) => {
                const currentVal = headerPillsConfig[slotId];
                const selectedOpt = availablePillOptions.find(o => o.id === currentVal) || availablePillOptions[0];

                let displayLabel = selectedOpt?.label || 'None';
                let displayIcon = selectedOpt?.iconName || 'Prohibit';
                let displayColor = selectedOpt?.colorClass || 'text-slate-400';
                let displayBg = selectedOpt?.bgGradient || 'from-slate-400 to-slate-500';

                if (currentVal === 'focus_habit') {
                  const focusH = habits.find(h => h.id === headerPillsConfig.focusHabitId) || habits[0];
                  if (focusH) {
                    displayLabel = `${selectedOpt.label} (${focusH.name})`;
                  }
                } else if (currentVal === 'persona_badge') {
                  const activeB = (headerPillsConfig.selectedBadgeId && badgeState.allBadges.find(b => b.id === headerPillsConfig.selectedBadgeId))
                    || badgeState.topBadge;
                  if (activeB) {
                    displayLabel = `${selectedOpt.label} (${isHinglish ? activeB.hindiTitle : activeB.title})`;
                    displayIcon = activeB.iconName;
                    displayColor = activeB.colorText;
                    displayBg = activeB.gradient;
                  }
                }

                return (
                  <button
                    key={slotId}
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setActiveSlotModal(slotId);
                      setSelectedSlotSubView(null);
                    }}
                    className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 transition-all cursor-pointer group shadow-2xs text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${displayBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                        <BadgePersonaIcon iconName={displayIcon} size={18} weight="fill" className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {label}
                        </span>
                        <span className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate block">
                          {displayLabel}
                        </span>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors shrink-0">
                      <CaretRight size={14} weight="bold" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Saved Notification */}
            {headerPillsSavedFeedback && (
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl animate-in fade-in zoom-in-95 duration-150 flex items-center justify-center gap-1.5">
                <CheckCircle size={15} weight="fill" />
                <span>{isHinglish ? 'प्राथमिकता तुरंत सेव हुई!' : 'Preference Saved Instantly!'}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── UPCOMING FEATURES (EXPERIMENTAL / BETA LAB) ────────────────────────── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <button 
          type="button"
          onClick={() => toggleSection('upcomingFeatures')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <Flask size={18} weight="bold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-[13.5px] font-black text-slate-900 dark:text-white truncate">
                  {isHinglish ? 'आगामी सुविधाएं (Upcoming Features)' : 'Upcoming Features'}
                </h2>
                <span className="text-[9.5px] font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-full shrink-0">
                  {isHinglish ? 'प्रायोगिक / बीटा' : 'Beta Lab'}
                </span>
              </div>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {isHinglish ? 'विकास के अधीन नई सुविधाएं। परीक्षण के लिए चालू करें।' : 'Features in active development. Tap to view status or toggle.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-transform duration-200 ${openSections.upcomingFeatures ? 'rotate-180' : ''}`}>
              <Icon name="expand_more" className="text-base" />
            </div>
          </div>
        </button>

        {openSections.upcomingFeatures && (
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
            {/* Note banner */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
              <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold">{isHinglish ? 'सक्रिय विकास (Under Active Development):' : 'Work in progress:'}</span>{' '}
                {isHinglish 
                  ? 'ये सुविधाएं अभी टेस्टिंग फेज में हैं। आप इन्हें ऑन करके देख सकते हैं, लेकिन दैनिक उपयोग में कभी-कभी बदलाव हो सकते हैं।' 
                  : 'These tools are currently under active development. You can turn them on to experiment and test them.'}
              </div>
            </div>

            {/* Feature 0: AI Habit Coach Bot (Beta Lab + PRO Pill) */}
            <div 
              onClick={() => setUpcomingModalFeature('ai_coach')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer hover:border-orange-500/40 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black shrink-0 group-hover:scale-105 transition-transform border border-orange-500/20 shadow-2xs">
                  <Robot size={22} weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">
                      {isHinglish ? 'AI हैबिट कोच (AI Habit Coach)' : 'AI Habit Coach'}
                    </h3>
                    <ProPill size="sm" />
                    <span className="text-[9.5px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300/80 dark:border-rose-900/60 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      {isHinglish ? 'बीटा लैब' : 'Beta Lab'}
                    </span>
                    {aiCoachToggleFeedback && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md animate-in fade-in zoom-in-95 duration-150">
                        {aiCoachEnabled ? (isHinglish ? 'चालू किया गया' : 'Enabled') : (isHinglish ? 'बंद किया गया' : 'Disabled')}
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {isHinglish 
                      ? 'स्क्रीन पर स्मार्ट फ्लोटिंग बॉट जो आपकी मजबूत/कमजोर आदतों और दैनिक प्रोग्रेस का विश्लेषण करेगा।' 
                      : 'Interactive robot coach analyzing strongest/weakest habits with telemetry & bounce-back tips.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:hidden">
                  {aiCoachEnabled ? 'Enabled' : 'Disabled'}
                </span>
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAiCoach(!aiCoachEnabled);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    aiCoachEnabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle AI Habit Coach"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      aiCoachEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Feature 1: Today's Compass */}
            <div 
              onClick={() => setUpcomingModalFeature('compass')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer hover:border-amber-500/40 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0 group-hover:scale-105 transition-transform">
                  <Compass size={22} weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">
                      {isHinglish ? "आज का कम्पास (Today's Compass)" : "Today's Compass"}
                    </h3>
                    <span className="text-[9.5px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300/80 dark:border-rose-900/60 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      {isHinglish ? 'लाइव नहीं है' : 'Not Live Yet'}
                    </span>
                    {compassToggleFeedback && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md animate-in fade-in zoom-in-95 duration-150">
                        {todayCompassEnabled ? (isHinglish ? 'चालू किया गया' : 'Enabled') : (isHinglish ? 'बंद किया गया' : 'Disabled')}
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {isHinglish 
                      ? 'दैनिक त्रिशूल फ़ोकस और रिज़िलिएंस पल्स (ऑन करने पर Today पेज पर दिखेगा)' 
                      : 'Daily 3-focus triage & resilience pulse. Appears on Today tab when enabled.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:hidden">
                  {todayCompassEnabled ? 'Enabled' : 'Disabled'}
                </span>
                {todayCompassEnabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/compass');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10.5px] font-bold border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isHinglish ? 'खोलें' : 'Open'}</span>
                    <ArrowRight size={12} weight="bold" />
                  </button>
                )}
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCompass(!todayCompassEnabled);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    todayCompassEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle Today's Compass"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      todayCompassEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Feature 2: Core X */}
            <div 
              onClick={() => setUpcomingModalFeature('corex')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer hover:border-indigo-500/40 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shrink-0 group-hover:scale-105 transition-transform">
                  <SlidersHorizontal size={20} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">
                      {isHinglish ? 'कोर X (Core X)' : 'Core X'}
                    </h3>
                    <span className="text-[9.5px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300/80 dark:border-rose-900/60 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      {isHinglish ? 'कार्य प्रगति पर' : 'In Development'}
                    </span>
                    {coreXToggleFeedback && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md animate-in fade-in zoom-in-95 duration-150">
                        {coreXEnabled ? (isHinglish ? 'चालू किया गया' : 'Enabled') : (isHinglish ? 'बंद किया गया' : 'Disabled')}
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {isHinglish 
                      ? 'Core X, Core Y विजुअल फ़्लो कैनवास और फ़ैक्टर कोरिलेशन एनालिटिक्स' 
                      : 'Core X, Core Y visual flow canvas and factor correlation analytics.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:hidden">
                  {coreXEnabled ? 'Enabled' : 'Disabled'}
                </span>
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCoreX(!coreXEnabled);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    coreXEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle Core X"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      coreXEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Feature 3: Adventure Quest Map (Progress Tower) - NO TOGGLE BUTTON as per user instructions */}
            <div 
              onClick={() => setUpcomingModalFeature('tower')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer hover:border-cyan-500/40 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-black shrink-0 group-hover:scale-105 transition-transform text-lg">
                  {towerProgress.currentFloorIcon || '🏛️'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">
                      {isHinglish ? 'एडवेंचर क्वेस्ट मैप (Adventure Quest Map)' : 'Adventure Quest Map'}
                    </h3>
                    <span className="text-[9.5px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300/80 dark:border-rose-900/60 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      {isHinglish ? 'प्रायोगिक' : 'Experimental'}
                    </span>
                    <span className="text-[9.5px] font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded-full shrink-0">
                      Floor {towerProgress.currentFloor}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {towerProgress.totalCompletedActions} {isHinglish ? 'कुल आदतें पूर्ण' : 'actions completed'} • {isHinglish ? 'गेमिफाइड हैबिट स्काईस्क्रेपर' : 'Gamified habit skyscraper'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{isHinglish ? 'विवरण देखें' : 'View Preview'}</span>
                  <CaretRight size={13} weight="bold" />
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. STREAK MILESTONES (VISIBLE ONLY WHEN STREAK TRACKING IS ON) ── */}
      {streakTrackingEnabled && (
        <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
          <button 
            type="button"
            onClick={() => {
              try { navigator?.vibrate?.(20); } catch(e) {}
              navigate('/streak-milestones');
            }}
            className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group text-left"
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
          </button>
        </section>
      )}

      {/* ── TIME-GATED INSIGHTS (ACCORDION SECTION, CLOSED BY DEFAULT) ── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <div 
          onClick={() => toggleSection('timeGatedInsights')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 shadow-2xs ${
              earlyUnlockAll 
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' 
                : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
            }`}>
              {earlyUnlockAll ? <Lock size={18} weight="bold" /> : <Lock size={18} weight="fill" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">
                  {isHinglish ? 'समय-आधारित इनसाइट्स मोड' : 'Time-Gated Insights Mode'}
                </h2>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                  earlyUnlockAll 
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                }`}>
                  {earlyUnlockAll ? (isHinglish ? 'समय पूर्व अनलॉक' : 'UNLOCKED EARLY') : (isHinglish ? 'अनुशंसित' : 'RECOMMENDED')}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {earlyUnlockAll 
                  ? (isHinglish ? '7D, 14D व 30D इनसाइट्स अनलॉक हैं' : 'All 7D, 14D & 30D locks bypassed')
                  : (isHinglish ? 'डेटा शोर से सुरक्षा व वैज्ञानिक गेट्स सक्रिय' : 'Scientific noise prevention gates active')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              role="switch"
              aria-checked={earlyUnlockAll}
              onClick={async () => {
                if (navigator.vibrate) navigator.vibrate(30);
                if (!earlyUnlockAll) {
                  setShowEarlyUnlockModal(true);
                } else {
                  await setEarlyUnlockAll(false);
                }
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                earlyUnlockAll ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title={earlyUnlockAll ? "Click to relock to recommended mode" : "Click to unlock early"}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                earlyUnlockAll ? 'left-5.5' : 'left-0.5'
              }`} />
            </button>

            <button
              type="button"
              onClick={() => toggleSection('timeGatedInsights')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
            >
              <Icon name={openSections.timeGatedInsights ? "expand_less" : "expand_more"} className="text-xl" />
            </button>
          </div>
        </div>

        {openSections.timeGatedInsights && (
          <div className="p-3.5 sm:p-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {earlyUnlockAll
                ? (isHinglish ? 'सारे 7D, 14D व 30D लॉक्स खुले हैं। कम सैंपल डेटा में शुरुआती शोर दिख सकता है।' : 'All 7D, 14D, and 30D insight locks are bypassed. Early data may show noise.')
                : (isHinglish ? '7D, 14D और 30D के बाद ही इनसाइट्स अनलॉक होते हैं ताकि आपको सिर्फ सच्चा और वैज्ञानिक डेटा दिखे।' : '7D, 14D, and 30D time gates prevent premature cognitive bias and coincidence.')}
            </p>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowEarlyUnlockModal(true)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  earlyUnlockAll
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300'
                }`}
              >
                <Sparkle size={14} weight="bold" />
                <span>{earlyUnlockAll ? (isHinglish ? 'लॉक मोड बदलें / जानकारी' : 'Change Mode / Info') : (isHinglish ? 'समय से पहले अनलॉक करें (चेतावनी)' : 'Unlock Early (Warning)')}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 3. UNLOCK ADVANCED INSIGHTS (THIRD ACCORDION COLUMN) ────────────────── */}
      <section className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
        <button 
          type="button"
          onClick={() => toggleSection('unlockInsights')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors text-left"
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
        </button>

        {openSections.unlockInsights && (
          <div className="p-3 sm:p-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
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
                    try { navigator?.vibrate?.(30); } catch(e) {}
                    if (trackedDays < 7 && !earlyUnlockAll) {
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
        <button 
          type="button"
          onClick={() => toggleSection('betterReport')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors gap-3 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <Icon name="auto_stories" filled={true} className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">30-Day Better Report</h2>
                <span className="text-[10px] font-black text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  {trackedDays >= 30 || earlyUnlockAll ? 'Ready' : 'In Progress'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">Your personal 30-day habit documentary &amp; growth story</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon name={openSections.betterReport ? "expand_less" : "expand_more"} className="text-slate-400 text-xl" />
          </div>
        </button>

        {openSections.betterReport && (
          <div className="p-3 sm:p-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="font-black text-xs text-slate-800 dark:text-slate-200">Behavioral Documentary &amp; Superpowers</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full 30-day recap with weekly slope progress, bounce-back velocity, and next milestones.
                </p>
              </div>
              <button 
                onClick={() => {
                  try { navigator?.vibrate?.(30); } catch(e) {}
                  if (trackedDays < 30 && !earlyUnlockAll) {
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
        <button 
          type="button"
          onClick={() => toggleSection('membership')}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors text-left"
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
        </button>

        {openSections.membership && (
          <div className="p-3 sm:p-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
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
                      <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} size={15} className="!w-7 !h-7 !rounded-full shrink-0"  color={habit.color} />
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
                <HabitIcon name={selectedHabitDetails.icon || 'star'} habitId={selectedHabitDetails.id} boxed={true} size={24}  color={selectedHabitDetails.color} />
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

            <div className="space-y-2 pt-1">
              {isAllowedToEditTargets && (
                <button
                  type="button"
                  onClick={() => {
                    const h = selectedHabitDetails;
                    setSelectedHabitDetails(null);
                    setEditingTargetHabit(h);
                  }}
                  className="w-full group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 flex items-stretch transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <div className="flex-1 px-3.5 py-2.5 flex items-center gap-2.5 text-left min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Target size={15} weight="bold" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
                        Edit Habit Target &amp; Scoring
                      </span>
                      <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        Adjust 100% ideal goal &amp; 0% base
                      </span>
                    </div>
                  </div>
                  <div className="w-12 bg-slate-950 dark:bg-black flex items-center justify-center text-white shrink-0 group-hover:bg-amber-600 transition-colors shadow-inner">
                    <PencilSimple size={16} weight="bold" />
                  </div>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedHabitDetails(null)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
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

      {/* ── HABIT TARGET EDIT MODAL (FOR AUTHORIZED USER) ── */}
      <HabitTargetEditModal
        isOpen={!!editingTargetHabit}
        habit={editingTargetHabit}
        onClose={() => setEditingTargetHabit(null)}
        onSaveComplete={(updated) => {
          setSelectedHabitDetails(null);
        }}
      />

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

      {/* ── UPCOMING FEATURE POP-UP MODAL ── */}
      {upcomingModalFeature && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setUpcomingModalFeature(null)}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 relative text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setUpcomingModalFeature(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={15} weight="bold" />
            </button>

            {/* Header / Icon */}
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-sm ${
                upcomingModalFeature === 'compass' 
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 text-2xl'
                  : upcomingModalFeature === 'corex'
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-2xl'
                  : upcomingModalFeature === 'ai_coach'
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 text-2xl'
                  : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-2xl'
              }`}>
                {upcomingModalFeature === 'compass' && '🧭'}
                {upcomingModalFeature === 'corex' && <SlidersHorizontal size={22} weight="bold" />}
                {upcomingModalFeature === 'ai_coach' && <Robot size={24} weight="duotone" />}
                {upcomingModalFeature === 'tower' && (towerProgress.currentFloorIcon || '🏛️')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {upcomingModalFeature === 'ai_coach' && <ProPill size="sm" />}
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-300/80 dark:border-rose-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    {isHinglish ? 'निर्माणाधीन / Beta' : 'Work In Progress'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                  {upcomingModalFeature === 'compass' && (isHinglish ? "आज का कम्पास (Today's Compass)" : "Today's Compass")}
                  {upcomingModalFeature === 'corex' && (isHinglish ? 'कोर X (Core X Engine)' : 'Core X Engine')}
                  {upcomingModalFeature === 'ai_coach' && (isHinglish ? 'AI हैबिट कोच (AI Habit Coach)' : 'AI Habit Coach')}
                  {upcomingModalFeature === 'tower' && (isHinglish ? 'एडवेंचर क्वेस्ट मैप (Adventure Quest Map)' : 'Adventure Quest Map')}
                </h3>
              </div>
            </div>

            {/* Explanation Content */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/25 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                <WarningCircle size={15} weight="fill" />
                <span>{isHinglish ? 'वेबसाइट पर काम चल रहा है' : 'Under Active Development'}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {isHinglish
                  ? 'यह फ़ीचर अभी हमारी वेबसाइट पर सक्रिय विकास (Active Development) के अधीन है। आप इसे टेस्ट करने के लिए आज़मा और उपयोग कर सकते हैं, लेकिन यह अभी दैनिक सामान्य उपयोग के लिए 100% पूरी तरह तैयार नहीं है।'
                  : 'This feature is currently undergoing active development on our website. You are welcome to try it out and test it, but please note that it is not yet fully ready or polished for production daily use.'}
              </p>
            </div>

            {/* Specific context for each feature */}
            <div className="text-[11.5px] text-slate-600 dark:text-slate-400 space-y-1.5 px-0.5">
              {upcomingModalFeature === 'compass' && (
                <p>
                  {isHinglish
                    ? '💡 यदि आप इसे चालू (ON) करते हैं, तो यह आपके Today पेज पर दैनिक 3 मुख्य प्राथमिकताओं और रिज़िलिएंस अलर्ट्स के रूप में दिखाई देगा।'
                    : '💡 If you toggle this ON, it will appear directly on your Today dashboard page with daily priority triages.'}
                </p>
              )}
              {upcomingModalFeature === 'corex' && (
                <p>
                  {isHinglish
                    ? '💡 कोर X में फ़ैक्टर कोरिलेशन और नोड-बेस्ड कैनवास पर अभी टेस्टिंग जारी है। इसे ऑन करके आप प्रयोग कर सकते हैं।'
                    : '💡 Core X factor correlation flows are being continuously tuned. You can toggle it ON to experiment.'}
                </p>
              )}
              {upcomingModalFeature === 'ai_coach' && (
                <p>
                  {isHinglish
                    ? '💡 AI हैबिट कोच स्क्रीन पर एक फ्लोटिंग रोबोट बॉट लाता है जो आपकी सभी सक्रिय आदतों, 7-दिवसीय स्ट्रीक्स और कमजोरियों का लाइव विश्लेषण करके एक्शन लेने योग्य बाउंस-बैक सुझाव देता है।'
                    : '💡 AI Habit Coach brings an interactive floating robot that analyzes habit telemetry, streak drops, and weak spots with personalized bounce-back guidance.'}
                </p>
              )}
              {upcomingModalFeature === 'tower' && (
                <p>
                  {isHinglish
                    ? '💡 क्वेस्ट मैप में आपकी सभी पुरानी पूर्ण आदतें एक टॉवर के रूप में दर्ज हो रही हैं। नए स्तर और रिवॉर्ड्स जोड़े जा रहे हैं।'
                    : '💡 Your cumulative actions are recorded floor-by-floor. New reward tiers and animations are arriving soon.'}
                </p>
              )}
            </div>

            {/* Toggle controls inside modal for Compass and CoreX */}
            {upcomingModalFeature === 'compass' && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    {isHinglish ? 'Today पेज पर कम्पास दिखाएं' : 'Show Compass on Today'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {todayCompassEnabled ? (isHinglish ? 'वर्तमान में सक्षम (Enabled)' : 'Currently Enabled') : (isHinglish ? 'वर्तमान में बंद (Disabled)' : 'Currently Disabled')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleCompass(!todayCompassEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    todayCompassEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      todayCompassEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {upcomingModalFeature === 'corex' && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    {isHinglish ? 'कोर X टूल्स सक्षम करें' : 'Enable Core X Tools'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {coreXEnabled ? (isHinglish ? 'वर्तमान में सक्षम (Enabled)' : 'Currently Enabled') : (isHinglish ? 'वर्तमान में बंद (Disabled)' : 'Currently Disabled')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleCoreX(!coreXEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    coreXEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      coreXEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {upcomingModalFeature === 'ai_coach' && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    {isHinglish ? 'AI हैबिट कोच चालू करें' : 'Enable AI Habit Coach'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {aiCoachEnabled ? (isHinglish ? 'वर्तमान में सक्षम (Enabled)' : 'Currently Enabled') : (isHinglish ? 'वर्तमान में बंद (Disabled)' : 'Currently Disabled')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAiCoach(!aiCoachEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    aiCoachEnabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle AI Habit Coach"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      aiCoachEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {upcomingModalFeature === 'compass' && (
                <button
                  type="button"
                  onClick={() => {
                    setUpcomingModalFeature(null);
                    navigate('/compass');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{isHinglish ? 'कम्पास खोलें' : 'Open Compass'}</span>
                  <ArrowRight size={13} weight="bold" />
                </button>
              )}

              {upcomingModalFeature === 'ai_coach' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!aiCoachEnabled) {
                      handleToggleAiCoach(true);
                    }
                    setUpcomingModalFeature(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Robot size={15} weight="bold" />
                  <span>{aiCoachEnabled ? (isHinglish ? 'कोच चालू है' : 'Coach Active') : (isHinglish ? 'कोच चालू करें' : 'Enable Coach')}</span>
                </button>
              )}

              {upcomingModalFeature === 'tower' && (
                <button
                  type="button"
                  onClick={() => {
                    setUpcomingModalFeature(null);
                    navigate('/tower');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{isHinglish ? 'क्वेस्ट मैप खोलें' : 'Open Quest Map'}</span>
                  <ArrowRight size={13} weight="bold" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setUpcomingModalFeature(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs cursor-pointer hover:opacity-90 transition-all text-center"
              >
                {isHinglish ? 'समझ गया' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}

            {/* ── MODAL: CUSTOM CENTERED SLOT METRIC SELECTOR ── */}
      {activeSlotModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => {
            setActiveSlotModal(null);
            setSelectedSlotSubView(null);
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150 my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedSlotSubView && (
                  <button
                    type="button"
                    onClick={() => setSelectedSlotSubView(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft size={14} weight="bold" />
                  </button>
                )}
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {selectedSlotSubView === 'persona_badge'
                      ? (isHinglish ? 'सम्मान व बैज चुनें' : 'Select Honor / Badge')
                      : selectedSlotSubView === 'focus_habit'
                      ? (isHinglish ? 'फोकस हैबिट चुनें' : 'Select Focus Habit')
                      : (isHinglish 
                          ? `स्लॉट ${activeSlotModal === 'pill1' ? '1' : activeSlotModal === 'pill2' ? '2' : '3'} के लिए मेट्रिक` 
                          : `Choose Metric for ${activeSlotModal === 'pill1' ? 'Slot 1 (Left)' : activeSlotModal === 'pill2' ? 'Slot 2 (Center)' : 'Slot 3 (Right)'}`
                        )
                    }
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {selectedSlotSubView === 'persona_badge'
                      ? (isHinglish ? 'हेडर में दिखाने के लिए बैज चुनें' : 'Choose badge to feature in header')
                      : selectedSlotSubView === 'focus_habit'
                      ? (isHinglish ? 'हेडर में पिन करने के लिए हैबिट चुनें' : 'Pick a habit to pin')
                      : (isHinglish ? 'त्वरित एक्सेस के लिए कोई एक विकल्प चुनें' : 'Select one metric to display in this slot')
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveSlotModal(null);
                  setSelectedSlotSubView(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            {/* Modal Body: Option List or SubView */}
            <div className="overflow-y-auto py-2.5 space-y-2 flex-1 scrollbar-none">
              {/* SUBVIEW 1: PERSONA BADGE PICKER */}
              {selectedSlotSubView === 'persona_badge' ? (
                <div className="space-y-2">
                  {/* Option 1: Auto / Latest Earned */}
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateHeaderPill('selectedBadgeId', '');
                      handleUpdateHeaderPill(activeSlotModal, 'persona_badge');
                      setActiveSlotModal(null);
                      setSelectedSlotSubView(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                      !headerPillsConfig.selectedBadgeId
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shrink-0 shadow-2xs">
                        <Crown size={18} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {isHinglish ? 'नवीनतम अर्जित सम्मान (ऑटो)' : 'Latest Earned Honor (Auto)'}
                          </span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            {isHinglish ? 'अनुशंसित' : 'Auto'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {isHinglish 
                            ? `वर्तमान: ${badgeState.topBadge?.hindiTitle || 'जेनेसिस'}` 
                            : `Current: ${badgeState.topBadge?.title || 'Genesis'}`
                          }
                        </span>
                      </div>
                    </div>
                    {!headerPillsConfig.selectedBadgeId && (
                      <Check size={16} weight="bold" className="text-amber-500 shrink-0" />
                    )}
                  </button>

                  {/* List of All Badges (Unlocked ones highlighted) */}
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block px-1 pb-1.5">
                      {isHinglish ? 'विशिष्ट बैज चुनें' : 'Or Pick a Specific Honor'}
                    </span>
                    <div className="space-y-1.5">
                      {badgeState.allBadges.map(badge => {
                        const isUnlocked = badgeState.unlockedBadges.some(b => b.id === badge.id);
                        const isSelected = headerPillsConfig.selectedBadgeId === badge.id;

                        return (
                          <button
                            key={badge.id}
                            type="button"
                            onClick={() => {
                              handleUpdateHeaderPill('selectedBadgeId', badge.id);
                              handleUpdateHeaderPill(activeSlotModal, 'persona_badge');
                              setActiveSlotModal(null);
                              setSelectedSlotSubView(null);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left ${
                              isSelected
                                ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30'
                                : 'bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center text-white shrink-0 shadow-2xs ${
                                !isUnlocked ? 'opacity-40 grayscale' : ''
                              }`}>
                                <BadgePersonaIcon iconName={badge.iconName} size={16} weight="fill" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {isHinglish ? badge.hindiTitle : badge.title}
                                  </span>
                                  {isUnlocked ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                      {isHinglish ? 'अनलॉक' : 'Unlocked'}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400">
                                      {isHinglish ? 'लॉक' : 'Locked'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                                  {isHinglish ? badge.hindiCriteria : badge.criteria}
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <Check size={16} weight="bold" className="text-amber-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : selectedSlotSubView === 'focus_habit' ? (
                /* SUBVIEW 2: FOCUS HABIT PICKER */
                <div className="space-y-1.5">
                  {habits.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      {isHinglish ? 'कोई सक्रिय हैबिट उपलब्ध नहीं है' : 'No active habits found'}
                    </div>
                  ) : (
                    habits.map(habit => {
                      const isSelected = headerPillsConfig.focusHabitId === habit.id;

                      return (
                        <button
                          key={habit.id}
                          type="button"
                          onClick={() => {
                            handleUpdateHeaderPill('focusHabitId', habit.id);
                            handleUpdateHeaderPill(activeSlotModal, 'focus_habit');
                            setActiveSlotModal(null);
                            setSelectedSlotSubView(null);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left ${
                            isSelected
                              ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/30'
                              : 'bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <HabitIcon habit={habit} size={18} boxed={false} weight="fill" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                                {habit.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {habit.category || 'General'}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <Check size={16} weight="bold" className="text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                /* MAIN VIEW: CHOOSE METRIC FOR SLOT */
                <div className="space-y-2">
                  {availablePillOptions.map(option => {
                    const isSelected = headerPillsConfig[activeSlotModal] === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          if (option.id === 'persona_badge') {
                            setSelectedSlotSubView('persona_badge');
                          } else if (option.id === 'focus_habit') {
                            setSelectedSlotSubView('focus_habit');
                          } else {
                            handleUpdateHeaderPill(activeSlotModal, option.id);
                            setActiveSlotModal(null);
                            setSelectedSlotSubView(null);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30'
                            : 'bg-white dark:bg-[#131722] hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${option.bgGradient} flex items-center justify-center text-white shrink-0 shadow-2xs`}>
                            <BadgePersonaIcon iconName={option.iconName} size={18} weight="fill" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white block">
                              {option.label}
                            </span>
                            <span className="text-[10px] text-slate-400 line-clamp-1 block mt-0.5">
                              {option.desc}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {option.hasSubConfig && (
                            <span className="text-[10px] font-bold text-amber-500">
                              {option.id === 'focus_habit' ? (habits.find(h => h.id === headerPillsConfig.focusHabitId)?.name || 'Pick') : ''}
                            </span>
                          )}
                          {isSelected ? (
                            <Check size={16} weight="bold" className="text-amber-500" />
                          ) : option.hasSubConfig ? (
                            <CaretRight size={14} weight="bold" className="text-slate-400" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EARLY UNLOCK WARNING MODAL ────────────────────────────────────── */}
      <EarlyUnlockWarningModal
        isOpen={showEarlyUnlockModal}
        onClose={() => setShowEarlyUnlockModal(false)}
      />

      {/* ── PAYWALL MODAL ────────────────────────────────────────────────────── */}
      {showPaywall && <ProModal onClose={() => setShowPaywall(false)} />}
    </div>
  );
}

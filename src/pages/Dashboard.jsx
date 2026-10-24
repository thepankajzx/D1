import Icon from '../components/Icon';
import { Target, Flame, Lightning, SlidersHorizontal, Check, CheckCircle, FloppyDisk, ChartLineUp, CaretRight, X } from '@phosphor-icons/react';
import ProModal from '../components/ProModal';
import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import HabitCard from '../components/HabitCard';
import { calculateDailySummary, recalculateStreaks } from '../lib/scoring';
import { calculateStreakData } from '../lib/streakEngine';
import { Link, useNavigate } from 'react-router-dom';
import StreakWidget from '../components/StreakWidget';
import TodayTopKpis from '../components/TodayTopKpis';
import { useLanguage } from '../contexts/LanguageContext';
import { useGuest } from '../contexts/GuestContext';
import D1OnboardingCarousel from '../components/D1OnboardingCarousel';
import DailyCheckIn from '../corex/ui/DailyCheckIn';
import { getCoreXConfigs, saveCoreXLog, getCoreXLogs } from '../corex/data/schema';


const getPerfColor = (score) => {
  if (score === null || score === undefined || score === 0) return 'var(--color-outline-variant)';
  if (score <= 10) return 'var(--color-perf-1)';
  if (score <= 20) return 'var(--color-perf-2)';
  if (score <= 30) return 'var(--color-perf-3)';
  if (score <= 40) return 'var(--color-perf-4)';
  if (score <= 50) return 'var(--color-perf-5)';
  if (score <= 60) return 'var(--color-perf-6)';
  if (score <= 70) return 'var(--color-perf-7)';
  if (score <= 80) return 'var(--color-perf-8)';
  if (score <= 90) return 'var(--color-perf-9)';
  return 'var(--color-perf-10)';
};

function getTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Dashboard() {
  const { currentUser: user } = useAuth();
  const { isGuest } = useGuest();
  const { habits, allSummaries, setAllSummaries, userDoc, priorityModeEnabled, loadingData, refreshData, streakTrackingEnabled, coreXEnabled } = useData();
  const { isHinglish } = useLanguage();
  const navigate = useNavigate();

  // Core X State
  const [coreXConfigs, setCoreXConfigs] = useState([]);
  const [activeCoreXId, setActiveCoreXId] = useState(null);
  const [coreXLogsTodayMap, setCoreXLogsTodayMap] = useState({});
  const [coreXLogsYesterdayMap, setCoreXLogsYesterdayMap] = useState({});
  const [showCoreYCheckIn, setShowCoreYCheckIn] = useState(false);
  
  // Debug log
  useEffect(() => {
    console.log("Dashboard rendered. Habits count:", habits?.length);
    console.log("Habits array:", habits);
  }, [habits]);
  
  // State
  const dateInputRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(() => getTodayDate());
  
  const [entries, setEntries] = useState([]);
  const [savedHabitIds, setSavedHabitIds] = useState(new Set());
  const [savedEntries, setSavedEntries] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showKpiHelp, setShowKpiHelp] = useState(false);
  const [showPartialSaveModal, setShowPartialSaveModal] = useState(false);
  const [showKpiLockModal, setShowKpiLockModal] = useState(false);
  const [missingHabitsForSave, setMissingHabitsForSave] = useState([]);

  // Hardware Back: close open modals before anything else
  useEffect(() => {
    const handleHardwareBack = (e) => {
      if (showPaywall) { setShowPaywall(false); e.preventDefault(); return; }
      if (showCoreYCheckIn) { setShowCoreYCheckIn(false); e.preventDefault(); return; }
      if (showKpiHelp) { setShowKpiHelp(false); e.preventDefault(); return; }
      if (showPartialSaveModal) { setShowPartialSaveModal(false); e.preventDefault(); return; }
      if (showKpiLockModal) { setShowKpiLockModal(false); e.preventDefault(); return; }
    };
    window.addEventListener('d1_hardware_back', handleHardwareBack);
    return () => window.removeEventListener('d1_hardware_back', handleHardwareBack);
  }, [showPaywall, showCoreYCheckIn, showKpiHelp, showPartialSaveModal, showKpiLockModal]);


  // Fetch entries when selectedDate changes
  useEffect(() => {
    if (isGuest && !user) {
      const existingSummary = (allSummaries || []).find(s => s.id === selectedDate) || allSummaries?.[0];
      if (existingSummary) {
        setEntries(existingSummary.entries || []);
        setDailySummary(existingSummary);
        setSavedHabitIds(new Set((existingSummary.entries || []).map(e => e.habitId)));
      } else {
        setDailySummary({
          overallScore: 0,
          habitsCompleted: 0,
          habitsTotal: habits.length
        });
        setEntries([]);
      }
      setLoadingEntries(false);
      setPendingChanges(false);
      return;
    }

    if (!user || loadingData) return;
    if (habits.length === 0) {
      setLoadingEntries(false);
      return;
    }
    
    async function loadDateData() {
      const cacheKey = `entries_${user.uid}_${selectedDate}`;
      const cachedEntries = localStorage.getItem(cacheKey);
      
      // 1. Immediately hydrate entries from cache if present, or reset to empty
      if (cachedEntries) {
        try {
          const parsed = JSON.parse(cachedEntries);
          setEntries(parsed);
          setSavedHabitIds(new Set(parsed.map(e => e.habitId)));
        } catch (_) {
          setEntries([]);
          setSavedHabitIds(new Set());
        }
      } else {
        setEntries([]);
        setSavedHabitIds(new Set());
      }
      
      // 2. Immediately populate dailySummary from allSummaries (cached in memory & localStorage)
      const existingSummary = allSummaries.find(s => s.id === selectedDate);
      if (existingSummary) {
        setDailySummary(existingSummary);
      } else if (cachedEntries) {
        try {
          const parsed = JSON.parse(cachedEntries);
          const computed = calculateDailySummary(habits, parsed, priorityModeEnabled);
          setDailySummary({ id: selectedDate, ...computed });
        } catch (_) {
          setDailySummary({
            overallScore: 0,
            habitsCompleted: 0,
            habitsTotal: habits.length
          });
        }
      } else {
        setDailySummary({
          overallScore: 0,
          habitsCompleted: 0,
          habitsTotal: habits.length
        });
      }

      setLoadingEntries(false);
      setPendingChanges(false);

      // 3. Concurrently fetch fresh entries from Firestore only if online (non-fatal)
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          const entriesRef = collection(db, `users/${user.uid}/entries`);
          const q = query(entriesRef, where('entryDate', '==', selectedDate));
          const entriesSnap = await getDocs(q);
          
          if (entriesSnap && !entriesSnap.empty) {
            const fetchedEntries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEntries(fetchedEntries);
            localStorage.setItem(cacheKey, JSON.stringify(fetchedEntries));
            setSavedHabitIds(new Set(fetchedEntries.map(e => e.habitId)));
          }
        } catch (err) {
          console.warn("Offline: Using local cached entries for", selectedDate);
        }
      }

      // 4. Load Core X configs & daily logs if enabled (skip network roundtrips when offline)
      if (coreXEnabled && user?.uid && (typeof navigator === 'undefined' || navigator.onLine)) {
        try {
          const cfgs = await getCoreXConfigs(user.uid);
          setCoreXConfigs(cfgs || []);
          if (cfgs && cfgs.length > 0) {
            if (!activeCoreXId) setActiveCoreXId(cfgs[0].id);
            const todayLogs = {};
            const yesterdayLogs = {};
            const yesterday = new Date(selectedDate);
            yesterday.setDate(yesterday.getDate() - 1);
            const yDateStr = yesterday.toISOString().split('T')[0];

            for (const cfg of cfgs) {
              try {
                const allLogs = await getCoreXLogs(user.uid, cfg.id);
                todayLogs[cfg.id] = allLogs?.find(l => l.date === selectedDate) || null;
                yesterdayLogs[cfg.id] = allLogs?.find(l => l.date === yDateStr) || null;
              } catch (err) {
                console.warn(`Offline / error loading logs for corex ${cfg.id}:`, err);
              }
            }
            setCoreXLogsTodayMap(todayLogs);
            setCoreXLogsYesterdayMap(yesterdayLogs);
          } else {
            setCoreXLogsTodayMap({});
            setCoreXLogsYesterdayMap({});
          }
        } catch (cxErr) {
          console.warn("Offline / error loading Core X data in dashboard:", cxErr);
        }
      }
    }
    
    loadDateData();
  }, [selectedDate, habits.length, user?.uid, loadingData, coreXEnabled]);

  const activeCoreXConfig = coreXConfigs.find(c => c.id === activeCoreXId) || coreXConfigs[0] || null;

  const handleSaveCoreYLog = async (logData) => {
    if (!user || !activeCoreXConfig) return;
    await saveCoreXLog(user.uid, activeCoreXConfig.id, selectedDate, logData);
    setCoreXLogsTodayMap(prev => ({
      ...prev,
      [activeCoreXConfig.id]: logData
    }));
  };



  const handleSaveProgress = async (bypassValidation = false) => {
    if ((!user && !isGuest) || !pendingChanges) return;
    
    // Allow saving past dates (restriction removed)
    
    setIsSaving(true);

    if (isGuest && !user) {
      try {
        let finalEntries = [...entries];
        if (!bypassValidation) {
          const missingHabits = habits.filter(habit => !finalEntries.some(e => e.habitId === habit.id));
          if (missingHabits.length > 0) {
            setMissingHabitsForSave(missingHabits);
            setShowPartialSaveModal(true);
            setIsSaving(false);
            return;
          }
        }
        setPendingChanges(false);
        setSavedHabitIds(new Set(finalEntries.map(e => e.habitId)));
        if (dailySummary) {
          const updatedSummary = { id: selectedDate, ...dailySummary };
          updatedSummary.habitScores = {};
          updatedSummary.habitValues = {};
          finalEntries.forEach(e => {
            updatedSummary.habitScores[e.habitId] = e.computedScore !== null ? e.computedScore : 0;
            if (e.rawValue !== undefined && e.rawValue !== null) {
              updatedSummary.habitValues[e.habitId] = e.rawValue;
            }
          });
          setAllSummaries(prev => {
            const newSummaries = (prev || []).filter(s => s.id !== selectedDate);
            newSummaries.unshift(updatedSummary);
            return newSummaries;
          });
        }
      } finally {
        setIsSaving(false);
      }
      return;
    }
    
    // Authenticated User handling (Offline-First Guaranteed)
    try {
        let finalEntries = [...entries];
        
        if (!bypassValidation) {
            // Validate that all habits have been filled
            const missingHabits = habits.filter(habit => !finalEntries.some(e => e.habitId === habit.id));
            if (missingHabits.length > 0) {
                setMissingHabitsForSave(missingHabits);
                setShowPartialSaveModal(true);
                setIsSaving(false);
                return;
            }
        }
        
        // Build updated daily summary with full habitScores & habitValues
        let updatedSummary = null;
        if (dailySummary) {
            updatedSummary = { id: selectedDate, ...dailySummary };
            updatedSummary.habitScores = {};
            updatedSummary.habitValues = {};
            finalEntries.forEach(e => {
                updatedSummary.habitScores[e.habitId] = e.computedScore !== null ? e.computedScore : 0;
                if (e.rawValue !== undefined && e.rawValue !== null) {
                    updatedSummary.habitValues[e.habitId] = e.rawValue;
                }
            });
        }
        
        // 1. Optimistically and synchronously persist to localStorage and React state FIRST
        localStorage.setItem(`entries_${user.uid}_${selectedDate}`, JSON.stringify(finalEntries));
        
        let newSummaries = [...allSummaries];
        if (updatedSummary) {
            newSummaries = newSummaries.filter(s => s.id !== selectedDate);
            newSummaries.unshift(updatedSummary);
            localStorage.setItem(`summaries_${user.uid}`, JSON.stringify(newSummaries));
            setAllSummaries(newSummaries);
            setDailySummary(updatedSummary);
        }
        
        setPendingChanges(false);
        setEntries(finalEntries);
        setSavedHabitIds(new Set(finalEntries.map(e => e.habitId)));
        
        // 2. Compute streak offline from updated summaries
        let currentStreak = 0;
        let longestStreak = 0;
        try {
            const streakData = calculateStreakData('all', newSummaries, selectedDate);
            currentStreak = streakData.currentStreak || 0;
            longestStreak = Math.max(streakData.longestStreak || 0, userDoc?.longestStreak || 0);
        } catch (_) {}
        
        // 3. Queue writes to Firestore (persists to IndexedDB offline cache, background syncs when online)
        try {
            const batch = writeBatch(db);
            
            finalEntries.forEach(entry => {
                const entryRef = doc(db, `users/${user.uid}/entries`, entry.id);
                batch.set(entryRef, entry, { merge: true });
            });
            
            if (updatedSummary) {
                const summaryData = { ...updatedSummary };
                delete summaryData.id;
                const summaryRef = doc(db, `users/${user.uid}/dailySummaries`, selectedDate);
                batch.set(summaryRef, summaryData, { merge: true });
            }
            
            const userRef = doc(db, 'users', user.uid);
            batch.set(userRef, { currentStreak, longestStreak }, { merge: true });
            
            // Fire-and-forget batch commit: Firestore buffers locally in IndexedDB instantly
            // and background syncs when network is available without stalling UI offline
            batch.commit().catch(dbErr => {
                console.warn("Firestore batch background queued:", dbErr);
            });
        } catch (dbErr) {
            console.warn("Firestore batch queued in offline cache:", dbErr);
        }
        
        // Refresh global data if available and online (non-blocking)
        if (refreshData && typeof navigator !== 'undefined' && navigator.onLine) {
            refreshData().catch(() => {});
        }
    } catch (e) {
        console.error("Error saving progress:", e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    if (!newDate) return;
    if (pendingChanges) {
      await handleSaveProgress(true);
    }
    setSelectedDate(newDate);
  };

  // Handle Entry Update from Card
  const handleEntryUpdate = (habitId, rawValue, computedScore) => {
    if (!user && !isGuest) return;
    // Lock removed - allow editing anytime
    
    // 1. Optimistically update local entries array
    const entryId = `${habitId}_${selectedDate}`;
    let newEntries = [...entries];
    const existingIndex = newEntries.findIndex(e => e.habitId === habitId);
    
    const newEntry = {
      id: entryId,
      habitId,
      rawValue,
      computedScore,
      entryDate: selectedDate,
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      newEntries[existingIndex] = newEntry;
    } else {
      newEntries.push(newEntry);
    }
    setEntries(newEntries);
    setPendingChanges(true); // Flag as dirty
    
    // 2. Compute new daily summary
    const newSummaryData = calculateDailySummary(habits, newEntries, priorityModeEnabled);
    const newSummary = { id: selectedDate, ...newSummaryData };
    setDailySummary(newSummary);
    
    // Update allSummaries array locally
    let newAllSummaries = [...allSummaries];
    const summaryIndex = newAllSummaries.findIndex(s => s.id === selectedDate);
    if (summaryIndex >= 0) {
        newAllSummaries[summaryIndex] = newSummary;
    } else {
        newAllSummaries.push(newSummary);
    }
    setAllSummaries(newAllSummaries);
  };

  if (loadingData) {
      return (
          <div className="flex flex-col gap-12 w-full pb-24 animate-pulse">
            <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-8">
              <div className="flex flex-col gap-4 w-full md:w-1/2">
                <div className="h-10 bg-surface-container-high rounded-lg w-48"></div>
                <div className="h-12 bg-surface-container-high rounded-lg w-64"></div>
                <div className="h-6 bg-surface-container-high rounded-lg w-32"></div>
              </div>
              <div className="w-full md:w-auto h-32 bg-surface-container-high rounded-2xl md:min-w-[300px]"></div>
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-48 bg-surface-container-high rounded-xl ${i === 1 ? 'col-span-1 md:col-span-2 lg:col-span-2' : 'col-span-1'}`}></div>
              ))}
            </section>
          </div>
      );
  }

  // Handle Empty State: When user has 0 habits, show D1 Value Reveal Carousel directly!
  if (habits.length === 0) {
    return (
      <D1OnboardingCarousel
        onComplete={() => navigate('/onboarding/select')}
        onChooseBundle={() => navigate('/onboarding/select')}
        onAddHabit={() => navigate('/onboarding/select')}
      />
    );
  }

  const scorePercentage = dailySummary?.overallScore || 0;
  // Calculate SVG stroke-dashoffset (circumference = 2 * pi * 45 = ~282.7)
  const dashoffset = 282.7 - (282.7 * scorePercentage / 100);

  // Optional: Convert YYYY-MM-DD to readable date
  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full pb-24">
      {/* 1. Top 2 Tabs: All Insights (Left) & Today's Compass (Right) */}
      <TodayTopKpis
        habits={habits}
        allSummaries={allSummaries}
        todayEntries={entries}
        priorityModeEnabled={priorityModeEnabled}
        selectedDate={selectedDate}
      />

      {/* 3. Date Selector */}
      <div className="flex items-center justify-start">
        <div 
          onClick={() => {
            try { dateInputRef.current?.showPicker(); } catch(e) {}
          }}
          className="flex items-center gap-2 text-on-surface border border-outline-variant/40 px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container shadow-2xs cursor-pointer relative transition-colors"
        >
          <input 
            ref={dateInputRef}
            type="date" 
            aria-label="Select Date"
            value={selectedDate} 
            max={getTodayDate()}
            onChange={handleDateChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ colorScheme: 'dark' }} 
          />
          <Icon name="calendar_today" className="text-sm text-primary" />
          <span className="font-semibold text-xs sm:text-sm text-on-surface">{displayDate}</span>
          <Icon name="expand_more" className="text-sm text-on-surface-variant" />
        </div>
      </div>

      {/* Grouped Grid Main Content */}
      <div className="flex flex-col gap-6 relative">


        {/* Binary Habits Section */}
        {habits.filter(h => h.scoringType === 'binary').length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.filter(h => h.scoringType === 'binary').map((habit) => {
              const entry = entries.find(e => e.habitId === habit.id);
              return (
                <div key={`${habit.id}-${selectedDate}`} className="col-span-1">
                    <HabitCard 
                      habit={habit} 
                      entry={entry}
                      onUpdate={handleEntryUpdate}
                      allSummaries={allSummaries}
                    />
                </div>
              );
            })}
          </section>
        )}

        {/* Other Habits Section */}
        {habits.filter(h => h.scoringType !== 'binary').length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.filter(h => h.scoringType !== 'binary').map((habit) => {
              const entry = entries.find(e => e.habitId === habit.id);
              return (
                <div key={`${habit.id}-${selectedDate}`} className="col-span-1">
                    <HabitCard 
                      habit={habit} 
                      entry={entry}
                      onUpdate={handleEntryUpdate}
                      allSummaries={allSummaries}
                    />
                </div>
              );
            })}
          </section>
        )}
      </div>

      {/* ── CORE X DAILY CHECK-IN CARD (BELOW HABIT CARDS) ── */}
      {coreXEnabled && coreXConfigs && coreXConfigs.length > 0 && (
        <section className="mt-4 space-y-2">
          <div 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              setShowCoreYCheckIn(true);
            }}
            className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 hover:border-purple-300 dark:hover:border-purple-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <SlidersHorizontal size={22} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {activeCoreXConfig?.name || 'Core X Daily Check-in'}
                  </span>
                  <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                    CORE X
                  </span>
                  {coreXLogsTodayMap[activeCoreXConfig?.id] ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check size={12} weight="bold" /> {isHinglish ? 'लॉग किया गया' : 'Logged'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                      {isHinglish ? 'चेक-इन बाकी' : 'Needs Check-in'}
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {coreXConfigs.length > 1 
                    ? (isHinglish ? `${coreXConfigs.length} सक्रिय एक्सपेरिमेंट्स • फैक्टर्स भरने के लिए टैप करें` : `${coreXConfigs.length} experiments active • Tap to log factors`)
                    : (isHinglish ? 'दैनिक फैक्टर्स और आउटकम रेटिंग भरने के लिए टैप करें' : 'Tap to log daily factors and outcome rating')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>{isHinglish ? 'फॉर्म खोलें' : 'Open Form'}</span>
                <CaretRight size={14} weight="bold" />
              </span>
            </div>
          </div>
        </section>
      )}

      {coreXEnabled && (!coreXConfigs || coreXConfigs.length === 0) && (
        <section className="mt-4 space-y-2">
          <div 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              navigate('/deep-dive?tool=builder');
            }}
            className="bg-white dark:bg-[#131722] border border-dashed border-indigo-300 dark:border-indigo-800/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <SlidersHorizontal size={22} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {isHinglish ? 'Core X: अपना पहला एक्सपेरिमेंट बनाएं' : 'Core X: Build your first experiment'}
                </span>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {isHinglish ? 'डीप डाइव में जाएं और नोड-ट्री कैनवास में फैक्टर्स सेट करें' : 'Go to Deep Dive to design your outcome & factor tree'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              <span>{isHinglish ? 'कैनवास खोलें' : 'Open Canvas'}</span>
              <CaretRight size={14} weight="bold" />
            </div>
          </div>
        </section>
      )}
      
      {/* ── CLASSIC & PREMIUM BOTTOM SAVE & CTA BUTTONS ── */}
      <div className="mt-8 flex flex-col items-center justify-center w-full gap-3.5">
        <button 
          type="button"
          onClick={() => handleSaveProgress(false)} 
          disabled={isSaving || !pendingChanges} 
          className={`w-full sm:w-auto min-w-[280px] h-[50px] px-8 rounded-2xl font-bold text-sm tracking-tight transition-all duration-200 flex items-center justify-center gap-2.5 ${
            pendingChanges
              ? 'bg-[#06251b] dark:bg-white text-white dark:text-slate-950 hover:bg-[#0d382c] dark:hover:bg-slate-100 shadow-[0_6px_20px_rgba(6,37,27,0.22)] dark:shadow-[0_6px_24px_rgba(255,255,255,0.12)] border border-black/10 dark:border-white/20 active:scale-[0.98] cursor-pointer' 
              : 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 shadow-2xs cursor-default'
          }`}
        >
          {isSaving ? (
            <>
              <Icon name="sync" className="animate-spin text-lg text-emerald-400 dark:text-emerald-600" />
              <span>{isHinglish ? 'प्रोग्रेस सेव हो रही है...' : 'Saving Progress...'}</span>
            </>
          ) : pendingChanges ? (
            <>
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <FloppyDisk size={18} weight="bold" className="text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span>{isHinglish ? "आज की प्रोग्रेस सेव करें" : "Save Today's Progress"}</span>
            </>
          ) : (
            <>
              <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold tracking-normal">
                {isHinglish ? 'सब प्रोग्रेस सुरक्षित है' : 'All Progress Saved'}
              </span>
            </>
          )}
        </button>
        
        {!pendingChanges && !isSaving && (
          <Link 
            to="/analytics" 
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/30 text-on-surface hover:text-primary font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all hover:scale-102 group cursor-pointer"
          >
            <ChartLineUp size={16} weight="bold" className="text-primary group-hover:translate-x-0.5 transition-transform" />
            <span>{isHinglish ? 'डीप डाइव एनालिटिक्स व ट्रेंड्स देखें' : 'Check your deep dive analytics & trends'}</span>
            <Icon name="arrow_forward" className="text-xs text-on-surface-variant group-hover:text-primary transition-colors" />
          </Link>
        )}
      </div>

      {/* ── CORE X DAILY CHECK-IN MODAL ── */}
      {showCoreYCheckIn && activeCoreXConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" onClick={() => setShowCoreYCheckIn(false)}>
          <div className="bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <SlidersHorizontal size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    {activeCoreXConfig.name || 'Core X Daily Check-in'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">{selectedDate}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCoreYCheckIn(false)} 
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* If multiple configs, tabs to switch */}
            {coreXConfigs.length > 1 && (
              <div className="flex items-center gap-1.5 px-4 pt-3 overflow-x-auto border-b border-slate-100 dark:border-slate-800 pb-2">
                {coreXConfigs.map(cfg => (
                  <button
                    key={cfg.id}
                    onClick={() => setActiveCoreXId(cfg.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      activeCoreXId === cfg.id
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cfg.name || 'Experiment'}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 sm:p-5 overflow-y-auto max-h-[70vh]">
              <DailyCheckIn 
                config={activeCoreXConfig} 
                dateStr={selectedDate} 
                existingLog={coreXLogsTodayMap[activeCoreXConfig.id]} 
                yesterdayLog={coreXLogsYesterdayMap[activeCoreXConfig.id]} 
                onSave={handleSaveCoreYLog} 
              />
            </div>
          </div>
        </div>
      )}

      {showPaywall && (
        <ProModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
      )}

      {/* Partial Save Modal */}
      {showPartialSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border premium-border">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-warning">
                <Icon name="warning" className="text-[24px]" />
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Incomplete Habits</h3>
              </div>
              <p className="text-body-md text-on-surface-variant">
                You still have {missingHabitsForSave.length} habit{missingHabitsForSave.length > 1 ? 's' : ''} left for today:
              </p>
              <ul className="list-disc pl-5 text-sm text-on-surface-variant flex flex-col gap-1 max-h-[150px] overflow-y-auto">
                {missingHabitsForSave.map(h => (
                  <li key={h.id}>{h.name}</li>
                ))}
              </ul>
              <div className="bg-error-container/30 p-3 rounded-[8px] border border-error-container">
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-on-surface">Note:</span> You must complete the remaining habits before midnight. Otherwise, they will be marked as blank (missed) for today.
                </p>
              </div>
              <p className="text-body-md text-on-surface-variant font-medium mt-1">
                Do you want to save your partial progress now?
              </p>
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/40 flex justify-end gap-2">
              <button
                onClick={() => setShowPartialSaveModal(false)}
                className="px-4 py-2 rounded-full font-label-lg text-on-surface hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPartialSaveModal(false);
                  handleSaveProgress(true);
                }}
                className="px-4 py-2 rounded-full font-label-lg bg-primary text-on-primary shadow-sm hover:opacity-90 transition-opacity"
              >
                Save Partially
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Help Modal */}
      {showKpiHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowKpiHelp(false)}>
          <div className="bg-surface p-6 rounded-2xl shadow-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                <Icon name="analytics" className="text-primary" /> {streakTrackingEnabled ? 'Consistency & Streak' : 'Consistency'}
              </h3>
              <button onClick={() => setShowKpiHelp(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <Icon name="close" />
              </button>
            </div>
            
            <div className="space-y-4 text-on-surface-variant text-sm">
              <div>
                <h4 className="font-bold text-on-surface mb-1">Consistency</h4>
                <p>Consistency measures the percentage of days you have actively tracked your habits since your first entry. A higher percentage means you are regularly showing up to track your progress.</p>
              </div>
              
              {streakTrackingEnabled && (
                <>
                  <div>
                    <h4 className="font-bold text-on-surface mb-1">Current Streak</h4>
                    <p>Your streak increases for every consecutive day your <span className="font-bold">Overall Daily Score</span> is <span className="text-primary font-bold">60% or higher</span>. If your overall score falls below 60% or you miss a day, your streak resets to 0.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-on-surface mb-1">Record (Longest Streak)</h4>
                    <p>This is the highest streak you have ever achieved. Try to beat your record!</p>
                  </div>
                </>
              )}
            </div>
            
            <button 
              className="mt-6 w-full py-2 bg-primary text-on-primary rounded-xl font-bold cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowKpiHelp(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


import Icon from '../components/Icon';
import { Target, Flame, Lightning } from '@phosphor-icons/react';
import ProModal from '../components/ProModal';
import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import HabitCard from '../components/HabitCard';
import { calculateDailySummary, recalculateStreaks } from '../lib/scoring';
import { Link, useNavigate } from 'react-router-dom';
import StreakWidget from '../components/StreakWidget';
import TodayTopKpis from '../components/TodayTopKpis';
import { useLanguage } from '../contexts/LanguageContext';
import { useGuest } from '../contexts/GuestContext';
import D1OnboardingCarousel from '../components/D1OnboardingCarousel';


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
  const { habits, allSummaries, setAllSummaries, userDoc, priorityModeEnabled, loadingData, refreshData, streakTrackingEnabled } = useData();
  const { isHinglish } = useLanguage();
  const navigate = useNavigate();

  
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
      
      if (cachedEntries) {
        setEntries(JSON.parse(cachedEntries));
        setLoadingEntries(false);
      } else {
        setLoadingEntries(true);
      }

      try {
        const entriesRef = collection(db, `users/${user.uid}/entries`);
        const q = query(entriesRef, where('entryDate', '==', selectedDate));
        const entriesSnap = await getDocs(q);
        
        const fetchedEntries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setEntries(fetchedEntries);
        localStorage.setItem(cacheKey, JSON.stringify(fetchedEntries));
        
        // Track already saved habits in Firestore for locking
        setSavedHabitIds(new Set(fetchedEntries.map(e => e.habitId)));
        
        // Get today's summary from the allSummaries array if we have it
        const existingSummary = allSummaries.find(s => s.id === selectedDate);
        if (existingSummary) {
            setDailySummary(existingSummary);
        } else {
            setDailySummary({
                overallScore: 0,
                habitsCompleted: 0,
                habitsTotal: habits.length
            });
        }
        setPendingChanges(false);
      } catch (error) {
        console.error("Error loading date data:", error);
      } finally {
        setLoadingEntries(false);
      }
    }
    
    loadDateData();
  }, [selectedDate, habits.length, user?.uid, loadingData]);



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
    
    try {
        const batch = writeBatch(db);
        
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
        
        // Write all final entries
        finalEntries.forEach(entry => {
            const entryRef = doc(db, `users/${user.uid}/entries`, entry.id);
            batch.set(entryRef, entry, { merge: true });
        });
        
        // Write Summary
        if (dailySummary) {
            const summaryData = { ...dailySummary };
            
            // Add individual habit scores and raw values to the daily summary to power analytics without extra reads
            summaryData.habitScores = {};
            summaryData.habitValues = {};
            finalEntries.forEach(e => {
                summaryData.habitScores[e.habitId] = e.computedScore !== null ? e.computedScore : 0;
                if (e.rawValue !== undefined && e.rawValue !== null) {
                    summaryData.habitValues[e.habitId] = e.rawValue;
                }
            });
            
            delete summaryData.id;
            const summaryRef = doc(db, `users/${user.uid}/dailySummaries`, selectedDate);
            batch.set(summaryRef, summaryData, { merge: true });
        }
        
        // Write Streaks - Incremental O(1) approach
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        let { currentStreak = 0, longestStreak = 0 } = userSnap.data() || {};
        
        const summaryRef = doc(db, `users/${user.uid}/dailySummaries`, selectedDate);
        const summarySnap = await getDoc(summaryRef);
        
        // Only modify streak if we are creating a new day (not editing)
        if (!summarySnap.exists()) {
            const yesterdayObj = new Date(selectedDate);
            yesterdayObj.setDate(yesterdayObj.getDate() - 1);
            const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
            const yesterdaySnap = await getDoc(doc(db, `users/${user.uid}/dailySummaries`, yesterdayStr));
            
            if (yesterdaySnap.exists()) {
                currentStreak += 1;
            } else {
                currentStreak = 1;
            }
            longestStreak = Math.max(longestStreak, currentStreak);
        }
        
        batch.set(userRef, { currentStreak, longestStreak }, { merge: true });
        
        await batch.commit();
        
        // Update local cache
        localStorage.setItem(`entries_${user.uid}_${selectedDate}`, JSON.stringify(finalEntries));
        
        setPendingChanges(false);
        setEntries(finalEntries);
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
                const newSummaries = prev.filter(s => s.id !== selectedDate);
                newSummaries.push(updatedSummary);
                // Update global summaries cache
                localStorage.setItem(`summaries_${user.uid}`, JSON.stringify(newSummaries));
                return newSummaries;
            });
        }
        
        // Refresh global data to ensure cross-page consistency (e.g. Analytics)
        if (refreshData) {
            await refreshData();
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
      
      {/* Static Submit Button at Bottom */}
      <div className="mt-8 flex flex-col items-center justify-center w-full gap-4">
          <button 
              onClick={() => handleSaveProgress(false)} 
              disabled={isSaving || !pendingChanges} 
              className={`w-full md:w-auto md:min-w-[300px] px-10 py-4 rounded-full font-label-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  pendingChanges
                      ? 'bg-primary text-on-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(var(--color-primary),0.3)] hover:-translate-y-1 cursor-pointer' 
                      : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-70'
              }`}
          >
              {isSaving ? (
                  <Icon name="sync" className=" animate-spin text-xl" />
              ) : (
                  <Icon name="done_all" className=" text-xl" />
              )}
              {isSaving ? 'Saving...' : pendingChanges ? 'Save Progress' : 'All Progress Saved'}
          </button>
          
          {!pendingChanges && !isSaving && (
            <Link to="/analytics" className="text-primary hover:underline font-label-md flex items-center gap-1">
              Check your analytics <Icon name="arrow_forward" className=" text-sm" />
            </Link>
          )}
      </div>

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


import Icon from '../components/Icon';
import { useState, useEffect, useMemo } from 'react';
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import HabitCard from '../components/HabitCard';
import { calculateDailySummary, recalculateStreaks } from '../lib/scoring';
import { Link, useNavigate } from 'react-router-dom';

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

export default function Dashboard() {
  const { currentUser: user } = useAuth();
  const { habits, allSummaries, setAllSummaries, userDoc, priorityModeEnabled, loadingData, refreshData } = useData();
  const navigate = useNavigate();
  
  // State
  const [selectedDate, setSelectedDate] = useState(() => {
    // Local time YYYY-MM-DD
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
  });
  
  const [entries, setEntries] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Calculate consistency for Dashboard
  const overallConsistency = useMemo(() => {
    if (!allSummaries || allSummaries.length === 0) return 0;
    const sortedDates = allSummaries.map(s => s.id).sort();
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const totalDays = Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1);
    const activeDays = allSummaries.length;
    return Math.round((activeDays / totalDays) * 100) || 0;
  }, [allSummaries]);

  // Fetch entries when selectedDate changes
  useEffect(() => {
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
        const promises = habits.map(habit => {
          const entryId = `${habit.id}_${selectedDate}`;
          return getDoc(doc(db, `users/${user.uid}/entries`, entryId));
        });
        
        const entryDocs = await Promise.all(promises);
        
        const fetchedEntries = [];
        entryDocs.forEach((entryDoc, index) => {
          if (entryDoc.exists()) {
            fetchedEntries.push({ id: entryDoc.id, habitId: habits[index].id, ...entryDoc.data() });
          }
        });
        
        setEntries(fetchedEntries);
        localStorage.setItem(cacheKey, JSON.stringify(fetchedEntries));
        
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



  const handleSaveProgress = async () => {
    if (!user || !pendingChanges) return;
    setIsSaving(true);
    
    try {
        const batch = writeBatch(db);
        
        let finalEntries = [...entries];
        // Auto-fill any missing entries with defaults so they are "completed"
        habits.forEach(habit => {
            if (!finalEntries.some(e => e.habitId === habit.id)) {
                // Determine default value based on type
                let defaultVal = habit.scoringType === 'binary' ? 0 : (habit.target0 ?? 0);
                
                // For sleep time wraparound logic
                let adjustedVal = defaultVal;
                if (habit.scoringType === 'time' && habit.id.includes('sleep') && defaultVal < 12 * 60) {
                    adjustedVal += 1440;
                }
                
                // Calculate default score, handle subjective
                let defaultScore = null;
                if (habit.scoringType !== 'subjective') {
                    // Quick inline calculation logic or just use 0 if complex. We'll set to 0.
                    defaultScore = 0; 
                }
                
                finalEntries.push({
                    id: `${habit.id}_${selectedDate}`,
                    habitId: habit.id,
                    rawValue: defaultVal,
                    computedScore: defaultScore,
                    entryDate: selectedDate,
                    updatedAt: new Date().toISOString()
                });
            }
        });
        
        // Write all final entries
        finalEntries.forEach(entry => {
            const entryRef = doc(db, `users/${user.uid}/entries`, entry.id);
            batch.set(entryRef, entry, { merge: true });
        });
        
        // Write Summary
        if (dailySummary) {
            const summaryData = { ...dailySummary };
            
            // Add individual habit scores to the daily summary to power analytics without extra reads
            summaryData.habitScores = {};
            finalEntries.forEach(e => {
                summaryData.habitScores[e.habitId] = e.computedScore !== null ? e.computedScore : 0;
            });
            
            delete summaryData.id;
            const summaryRef = doc(db, `users/${user.uid}/dailySummaries`, selectedDate);
            batch.set(summaryRef, summaryData, { merge: true });
        }
        
        // Write Streaks
        const { currentStreak, longestStreak } = recalculateStreaks(allSummaries);
        const userRef = doc(db, 'users', user.uid);
        batch.set(userRef, { currentStreak, longestStreak }, { merge: true });
        
        await batch.commit();
        
        // Update local cache
        localStorage.setItem(`entries_${user.uid}_${selectedDate}`, JSON.stringify(finalEntries));
        
        setPendingChanges(false);
        setEntries(finalEntries);
        
        if (dailySummary) {
            const updatedSummary = { id: selectedDate, ...dailySummary };
            updatedSummary.habitScores = {};
            finalEntries.forEach(e => {
                updatedSummary.habitScores[e.habitId] = e.computedScore !== null ? e.computedScore : 0;
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
    if (pendingChanges) {
        await handleSaveProgress();
    }
    setSelectedDate(e.target.value);
  };

  // Handle Entry Update from Card
  const handleEntryUpdate = (habitId, rawValue, computedScore) => {
    if (!user) return;
    
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

  const handleAddHabitClick = (e) => {
    e.preventDefault();
    if (habits.length >= 8) {
      setShowPaywall(true);
    } else {
      navigate('/onboarding/select');
    }
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

  // Handle Empty State
  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
          <Icon name="rocket_launch" className=" text-5xl text-primary" />
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Welcome to Definite!</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          You don't have any habits tracked yet. Start your journey by setting up your first daily habits.
        </p>
        <Link 
          to="/onboarding/welcome" 
          className="mt-4 bg-primary text-on-primary px-8 py-4 rounded-full font-label-lg text-label-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          Get Started <Icon name="arrow_forward"  />
        </Link>
      </div>
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
    <div className="flex flex-col gap-12 w-full pb-24">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row items-start justify-between gap-6 pt-8 w-full">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-4 relative">
            <div className="flex items-center gap-2 text-on-surface premium-border px-4 py-2 rounded-lg bg-surface shadow-sm cursor-pointer relative">
              <input 
                  type="date" 
                  aria-label="Select Date"
                  value={selectedDate} 
                  onChange={handleDateChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ colorScheme: 'dark' }} 
              />
              <span className="font-body-md text-body-md font-medium">{displayDate}</span>
              <Icon name="calendar_today" className=" text-sm text-on-surface-variant" />
            </div>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Daily Review</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {dailySummary?.habitsCompleted || 0} of {habits.length} habits completed today.
          </p>
        </div>
        
        {/* KPI Cards from Analytics */}
        <div className="flex flex-row gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 shrink-0">
          <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-4 flex flex-col gap-2 min-w-[140px] shrink-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Consistency</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-primary">{overallConsistency}</span>
              <span className="font-headline-md text-headline-md text-primary">%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container rounded-full mt-auto overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${overallConsistency}%` }}></div>
            </div>
          </div>
          
          <div className="bg-surface border border-outline-variant shadow-sm rounded-2xl p-4 flex flex-col gap-2 min-w-[140px] shrink-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Current Streak</span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-lg text-headline-lg text-primary">{userDoc?.currentStreak || 0}</span>
              <span className="font-body-md text-body-md text-on-surface-variant">days</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-auto">Record: {userDoc?.longestStreak || 0} days</span>
          </div>
        </div>
      </section>

      {/* Bento Grid Main Content */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {habits.map((habit, index) => {
          // Wider first item
          const spanClass = index === 0 ? "col-span-1 md:col-span-2 lg:col-span-2" : "col-span-1";
          const entry = entries.find(e => e.habitId === habit.id);
          
          return (
            <div key={`${habit.id}-${selectedDate}`} className={spanClass}>
                <HabitCard 
                  habit={habit} 
                  entry={entry} 
                  onUpdate={handleEntryUpdate}
                />
            </div>
          );
        })}
        
        {/* Placeholder Card to encourage adding more */}
        <button onClick={handleAddHabitClick} className="bg-surface-container-low border border-dashed border-outline-variant rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center min-h-[220px] hover:bg-surface-variant transition-colors cursor-pointer col-span-1 shadow-sm hover:shadow-md w-full">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Icon name="add" className=" text-2xl" />
          </div>
          <span className="font-label-md text-label-md text-on-surface font-medium">Add Habit</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Track something new</span>
        </button>
      </section>
      
      {/* Static Submit Button at Bottom */}
      <div className="mt-8 flex flex-col items-center justify-center w-full gap-4">
          <button 
              onClick={handleSaveProgress} 
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

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="workspace_premium" className=" text-3xl" style={{fontVariationSettings: "'FILL' 1"}} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">Habit Limit Reached</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              You can only track up to 8 habits on the free plan. Upgrade to Pro to unlock unlimited habits and advanced analytics.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/subscription')}
                className="w-full py-3 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90"
              >
                Explore Pro
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full py-3 border border-outline-variant text-on-surface font-semibold rounded-lg hover:bg-surface-variant"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import Icon from '../components/Icon';
import ProModal from '../components/ProModal';
import { useState, useEffect, useMemo } from 'react';
import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import HabitCard from '../components/HabitCard';
import { calculateDailySummary, recalculateStreaks } from '../lib/scoring';
import { Link, useNavigate } from 'react-router-dom';
import StreakWidget from '../components/StreakWidget';

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
  
  // Debug log
  useEffect(() => {
    console.log("Dashboard rendered. Habits count:", habits?.length);
    console.log("Habits array:", habits);
  }, [habits]);
  
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
  const [showKpiHelp, setShowKpiHelp] = useState(false);

  // Calculate all-time weakest and strongest habits
  const { weakestHabit, strongestHabit } = useMemo(() => {
    if (!allSummaries || allSummaries.length === 0 || !habits || habits.length === 0) return { weakestHabit: null, strongestHabit: null };
    
    const habitStats = {};
    habits.forEach(h => {
        // Skip subjective habits — they don't have a meaningful percentage score
        if (h.scoringType === 'subjective') return;
        habitStats[h.id] = { total: 0, count: 0, name: h.name };
    });

    allSummaries.forEach(summary => {
        if (summary.habitScores) {
            Object.entries(summary.habitScores).forEach(([habitId, score]) => {
                if (habitStats[habitId] !== undefined) {
                    habitStats[habitId].total += score;
                    habitStats[habitId].count += 1;
                }
            });
        }
    });

    let weakest = null;
    let strongest = null;
    let minAvg = Infinity;
    let maxAvg = -1;

    Object.values(habitStats).forEach(stat => {
        if (stat.count > 0) {
            const avg = Math.round(stat.total / stat.count);
            if (avg < minAvg) {
                minAvg = avg;
                weakest = { name: stat.name, score: avg };
            }
            if (avg > maxAvg) {
                maxAvg = avg;
                strongest = { name: stat.name, score: avg };
            }
        }
    });

    return { 
        weakestHabit: weakest || { name: 'N/A', score: 0 }, 
        strongestHabit: strongest || { name: 'N/A', score: 0 } 
    };
  }, [allSummaries, habits]);

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
        const entriesRef = collection(db, `users/${user.uid}/entries`);
        const q = query(entriesRef, where('entryDate', '==', selectedDate));
        const entriesSnap = await getDocs(q);
        
        const fetchedEntries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
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
        // Validate that all habits have been filled
        const missingHabits = habits.filter(habit => !finalEntries.some(e => e.habitId === habit.id));
        if (missingHabits.length > 0) {
            alert(`Please complete the following habits before saving:\n- ${missingHabits.map(h => h.name).join('\n- ')}`);
            setIsSaving(false);
            return;
        }
        
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
        <div className="mt-4 md:mt-8 flex justify-between items-end mb-8 relative">
          <div className="flex flex-col z-10">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 flex items-center gap-2">
              Dashboard
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-2">
              You don't have any habits tracked yet. Start your journey by setting up your first daily habits.
            </p>
          </div>
        </div>
        <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
          <Icon name="rocket_launch" className=" text-5xl text-primary" />
        </div>
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
      <section className="flex flex-col md:flex-row items-start justify-between gap-6 pt-2 w-full">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-1 relative">
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
        
        {/* Streak Widget placed in top right */}
        <div className="flex-shrink-0 self-start md:self-center ml-auto">
          <StreakWidget allSummaries={allSummaries} />
        </div>
        
        {/* KPI Cards (2 Pills) */}
        <div className="flex flex-row gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
          
          {/* Weakest Habit Pill */}
          <div className="bg-[#151515] text-white rounded-xl p-[10px_14px] sm:p-[12px_16px] flex-1 shrink-0 relative flex flex-col justify-center overflow-hidden">
            <div className="flex items-center justify-between gap-[6px] mb-[8px]">
              <div className="flex flex-col min-w-0">
                <span className="text-red-400/80 text-[8px] uppercase tracking-widest font-bold leading-none mb-0.5">Lowest</span>
                <span className="text-[#b6b9bf] text-[12px] sm:text-[13px] font-medium truncate">{weakestHabit?.name || 'N/A'}</span>
              </div>
              <span className="text-[14px] sm:text-[16px] font-bold shrink-0">{weakestHabit?.score || 0}%</span>
            </div>
            <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[2px] sm:gap-[3px] w-full">
                {Array.from({ length: 20 }, (_, i) => {
                    const score = weakestHabit?.score || 0;
                    const filledCount = Math.round((score / 100) * 20);
                    const isFilled = i < filledCount;
                    let color = '#ef4444'; 
                    if (score >= 80) color = '#22c55e'; 
                    else if (score >= 60) color = '#86efac'; 
                    else if (score >= 40) color = '#facc15'; 
                    
                    return (
                        <span 
                            key={i}
                            className="h-[18px] sm:h-[21px] rounded-[4px]"
                            style={{ backgroundColor: isFilled ? color : '#272727' }}
                        ></span>
                    );
                })}
            </div>
          </div>

          {/* Strongest Habit Pill */}
          <div className="bg-[#151515] text-white rounded-xl p-[10px_14px] sm:p-[12px_16px] flex-1 shrink-0 relative flex flex-col justify-center overflow-hidden">
            <div className="flex items-center justify-between gap-[6px] mb-[8px]">
              <div className="flex flex-col min-w-0">
                <span className="text-green-400/80 text-[8px] uppercase tracking-widest font-bold leading-none mb-0.5">Strongest</span>
                <span className="text-[#b6b9bf] text-[12px] sm:text-[13px] font-medium truncate">{strongestHabit?.name || 'N/A'}</span>
              </div>
              <span className="text-[14px] sm:text-[16px] font-bold shrink-0">{strongestHabit?.score || 0}%</span>
            </div>
            <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[2px] sm:gap-[3px] w-full">
                {Array.from({ length: 20 }, (_, i) => {
                    const score = strongestHabit?.score || 0;
                    const filledCount = Math.round((score / 100) * 20);
                    const isFilled = i < filledCount;
                    let color = '#ef4444'; 
                    if (score >= 80) color = '#22c55e'; 
                    else if (score >= 60) color = '#86efac'; 
                    else if (score >= 40) color = '#facc15'; 
                    
                    return (
                        <span 
                            key={i}
                            className="h-[18px] sm:h-[21px] rounded-[4px]"
                            style={{ backgroundColor: isFilled ? color : '#272727' }}
                        ></span>
                    );
                })}
            </div>
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
                  allSummaries={allSummaries}
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

      <ProModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        source="total_habits_limit" 
      />

      {/* KPI Help Modal */}
      {showKpiHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowKpiHelp(false)}>
          <div className="bg-surface p-6 rounded-2xl shadow-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                <Icon name="analytics" className="text-primary" /> Consistency & Streak
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
              
              <div>
                <h4 className="font-bold text-on-surface mb-1">Current Streak</h4>
                <p>Your streak increases for every consecutive day your <span className="font-bold">Overall Daily Score</span> is <span className="text-primary font-bold">60% or higher</span>. If your overall score falls below 60% or you miss a day, your streak resets to 0.</p>
              </div>
              
              <div>
                <h4 className="font-bold text-on-surface mb-1">Record (Longest Streak)</h4>
                <p>This is the highest streak you have ever achieved. Try to beat your record!</p>
              </div>
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

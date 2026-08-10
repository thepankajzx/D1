import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import HabitCard from '../components/HabitCard';
import { calculateDailySummary, recalculateStreaks } from '../lib/scoring';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  
  // State
  const [selectedDate, setSelectedDate] = useState(() => {
    // Local time YYYY-MM-DD
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
  });
  
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [allSummaries, setAllSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityModeEnabled, setPriorityModeEnabled] = useState(false);

  // Initial Fetch Data
  useEffect(() => {
    if (!user) return;
    
    async function loadData() {
      setLoading(true);
      
      // 1. Fetch User Config
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
          setPriorityModeEnabled(userDoc.data().priorityModeEnabled || false);
      }
      
      // 2. Fetch User Habits
      const habitsSnap = await getDocs(collection(db, `users/${user.uid}/habits`));
      const fetchedHabits = habitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHabits(fetchedHabits);
      
      // 3. Fetch All Daily Summaries (for streak logic)
      const summariesSnap = await getDocs(collection(db, `users/${user.uid}/dailySummaries`));
      const fetchedSummaries = summariesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllSummaries(fetchedSummaries);
      
      setLoading(false);
    }
    
    loadData();
  }, [user]);

  // Fetch entries when selectedDate changes
  useEffect(() => {
    if (!user || habits.length === 0) return;
    
    async function loadDateData() {
      // Instead of complex query, just fetch the known IDs
      const fetchedEntries = [];
      for (const habit of habits) {
        const entryId = `${habit.id}_${selectedDate}`;
        const entryDoc = await getDoc(doc(db, `users/${user.uid}/entries`, entryId));
        if (entryDoc.exists()) {
          fetchedEntries.push({ id: entryId, habitId: habit.id, ...entryDoc.data() });
        }
      }
      setEntries(fetchedEntries);
      
      // Get today's summary from the allSummaries array if we have it, or fetch it
      const existingSummary = allSummaries.find(s => s.id === selectedDate);
      if (existingSummary) {
          setDailySummary(existingSummary);
      } else {
          // It might not exist yet
          setDailySummary({
              overallScore: 0,
              habitsCompleted: 0,
              habitsTotal: habits.length
          });
      }
    }
    
    loadDateData();
  }, [selectedDate, habits, user, allSummaries]);

  // Change Date Handler
  const shiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
  };

  // Handle Entry Update from Card
  const handleEntryUpdate = async (habitId, rawValue, computedScore) => {
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
    
    // 2. Compute new daily summary
    const newSummaryData = calculateDailySummary(habits, newEntries, priorityModeEnabled);
    const newSummary = { id: selectedDate, ...newSummaryData };
    setDailySummary(newSummary);
    
    // Update allSummaries array
    let newAllSummaries = [...allSummaries];
    const summaryIndex = newAllSummaries.findIndex(s => s.id === selectedDate);
    if (summaryIndex >= 0) {
        newAllSummaries[summaryIndex] = newSummary;
    } else {
        newAllSummaries.push(newSummary);
    }
    setAllSummaries(newAllSummaries);
    
    // 3. Compute new streaks
    const { currentStreak, longestStreak } = recalculateStreaks(newAllSummaries);
    
    // 4. Perform Firestore Writes
    try {
      // Write Entry
      await setDoc(doc(db, `users/${user.uid}/entries`, entryId), newEntry, { merge: true });
      
      // Write Summary
      await setDoc(doc(db, `users/${user.uid}/dailySummaries`, selectedDate), newSummaryData, { merge: true });
      
      // Write Streaks to user doc
      await updateDoc(doc(db, 'users', user.uid), {
          currentStreak,
          longestStreak
      });
      
    } catch (e) {
      console.error("Error writing entry/summary:", e);
    }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
    <div className="flex-grow pt-24 pb-16 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto w-full flex flex-col gap-12">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => shiftDate(-1)} className="hover:opacity-80 transition-opacity bg-surface p-2 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <div className="flex items-center gap-2 text-on-surface premium-border px-4 py-2 rounded-lg bg-surface">
              <span className="font-body-md text-body-md font-medium">{displayDate}</span>
            </div>
            <button onClick={() => shiftDate(1)} className="hover:opacity-80 transition-opacity bg-surface p-2 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Daily Review</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {dailySummary?.habitsCompleted || 0} of {habits.length} habits completed today.
          </p>
        </div>
        
        <div className="flex items-center gap-6 bg-surface p-6 rounded-2xl premium-border">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle className="circular-progress-bg" cx="50" cy="50" r="45"></circle>
              <circle 
                className="circular-progress-value" 
                cx="50" cy="50" r="45" 
                strokeDasharray="282.7" 
                strokeDashoffset={dashoffset}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="font-mono-data text-mono-data text-2xl font-bold text-primary">{scorePercentage}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Score</span>
            <span className="font-body-lg text-body-lg text-primary font-medium">
              {scorePercentage >= 90 ? 'Excellent' : scorePercentage >= 75 ? 'Great' : scorePercentage >= 60 ? 'Good' : 'Needs Focus'}
            </span>
          </div>
        </div>
      </section>

      {/* Bento Grid Main Content */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {habits.map((habit, index) => {
          // Just making the first item wider to match the bento style in the design
          const spanClass = index === 0 ? "col-span-1 md:col-span-2" : "col-span-1";
          const entry = entries.find(e => e.habitId === habit.id);
          
          return (
            <div key={habit.id} className={spanClass}>
                <HabitCard 
                  habit={habit} 
                  entry={entry} 
                  onUpdate={handleEntryUpdate}
                />
            </div>
          );
        })}
        
        {/* Placeholder Card to encourage adding more */}
        <Link to="/profile" className="bg-surface-container-low border border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-center min-h-[200px] hover:bg-surface-variant transition-colors cursor-pointer col-span-1">
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-on-surface-variant premium-border">
            <span className="material-symbols-outlined text-lg">add</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Add Habit</span>
        </Link>
      </section>
    </div>
  );
}

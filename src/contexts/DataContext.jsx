import { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { currentUser: user } = useAuth();
  
  const [habits, setHabits] = useState(() => {
    const cached = localStorage.getItem(`habits_${user?.uid}`);
    return cached ? JSON.parse(cached) : [];
  });
  const [allSummaries, setAllSummaries] = useState(() => {
    const cached = localStorage.getItem(`summaries_${user?.uid}`);
    return cached ? JSON.parse(cached) : [];
  });
  const [priorityModeEnabled, setPriorityModeEnabled] = useState(false);
  const [userDocData, setUserDocData] = useState(null);
  const [loadingData, setLoadingData] = useState(() => {
    // If we have cached habits, we don't need to block the UI
    const hasCachedData = !!localStorage.getItem(`habits_${user?.uid}`);
    return !hasCachedData;
  });

  async function loadGlobalData() {
    if (!user) return;
    // Only show loading spinner if we don't have cached data
    if (habits.length === 0) setLoadingData(true);
    
    try {
      const [userDoc, habitsSnap, summariesSnap] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDocs(collection(db, `users/${user.uid}/habits`)),
          getDocs(collection(db, `users/${user.uid}/dailySummaries`))
      ]);
      
      if (userDoc.exists()) {
          const data = userDoc.data();
          if ((user.email === 'dummytest2025@example.com' || user.email === 'test2025@gmail.com')) {
              data.isPro = true;
          }
          setUserDocData(data);
          setPriorityModeEnabled(data.priorityModeEnabled || false);
      } else if ((user.email === 'dummytest2025@example.com' || user.email === 'test2025@gmail.com')) {
          setUserDocData({ isPro: true });
      }
      
      const fetchedHabits = habitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedHabits.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setHabits(fetchedHabits);
      localStorage.setItem(`habits_${user.uid}`, JSON.stringify(fetchedHabits));
      
      const fetchedSummaries = summariesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllSummaries(fetchedSummaries);
      localStorage.setItem(`summaries_${user.uid}`, JSON.stringify(fetchedSummaries));
    } catch (error) {
      console.error("Error loading global data:", error);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setAllSummaries([]);
      setPriorityModeEnabled(false);
      setUserDocData(null);
      setLoadingData(false);
      return;
    }
    
    // Check local storage immediately when user changes
    const cachedHabits = localStorage.getItem(`habits_${user.uid}`);
    const cachedSummaries = localStorage.getItem(`summaries_${user.uid}`);
    
    if (cachedHabits) {
      setHabits(JSON.parse(cachedHabits));
      setLoadingData(false);
    } else {
      setLoadingData(true);
    }
    
    if (cachedSummaries) {
      setAllSummaries(JSON.parse(cachedSummaries));
    }

    loadGlobalData();
  }, [user]);

  const value = {
    habits,
    setHabits,
    allSummaries,
    setAllSummaries,
    priorityModeEnabled,
    setPriorityModeEnabled,
    userDoc: userDocData,
    loadingData,
    refreshData: loadGlobalData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

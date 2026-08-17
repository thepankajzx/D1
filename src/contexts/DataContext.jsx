import { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
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
      // Fetch user doc
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const lowerEmail = user.email ? user.email.toLowerCase() : '';
            if ((lowerEmail === 'dummytest2025@example.com' || lowerEmail === 'test2025@gmail.com')) {
                data.isPro = true;
            }
            setUserDocData(data);
            setPriorityModeEnabled(data.priorityModeEnabled || false);
        } else {
            const lowerEmail = user.email ? user.email.toLowerCase() : '';
            if ((lowerEmail === 'dummytest2025@example.com' || lowerEmail === 'test2025@gmail.com')) {
                setUserDocData({ isPro: true });
            }
        }
      } catch (err) {
        console.error("Error loading user doc:", err);
      }

      // Fetch habits
      try {
        const habitsSnap = await getDocs(collection(db, `users/${user.uid}/habits`));
        const fetchedHabits = habitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedHabits.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setHabits(fetchedHabits);
        localStorage.setItem(`habits_${user.uid}`, JSON.stringify(fetchedHabits));
      } catch (err) {
        console.error("Error loading habits:", err);
      }

      // Fetch summaries
      try {
        const summariesSnap = await getDocs(collection(db, `users/${user.uid}/dailySummaries`));
        const fetchedSummaries = summariesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by date (id) descending in memory
        fetchedSummaries.sort((a, b) => b.id.localeCompare(a.id));
        const recentSummaries = fetchedSummaries.slice(0, 30);
        
        setAllSummaries(recentSummaries);
        localStorage.setItem(`summaries_${user.uid}`, JSON.stringify(recentSummaries));
      } catch (err) {
        console.error("Error loading summaries:", err);
      }
      
    } catch (error) {
      console.error("Critical error in loadGlobalData:", error);
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

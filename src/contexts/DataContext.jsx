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
  
  const [habits, setHabits] = useState([]);
  const [allSummaries, setAllSummaries] = useState([]);
  const [priorityModeEnabled, setPriorityModeEnabled] = useState(false);
  const [userDocData, setUserDocData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  async function loadGlobalData() {
    if (!user) return;
    setLoadingData(true);
    try {
      const [userDoc, habitsSnap, summariesSnap] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDocs(collection(db, `users/${user.uid}/habits`)),
          getDocs(collection(db, `users/${user.uid}/dailySummaries`))
      ]);
      
      if (userDoc.exists()) {
          setUserDocData(userDoc.data());
          setPriorityModeEnabled(userDoc.data().priorityModeEnabled || false);
      }
      
      const fetchedHabits = habitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedHabits.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setHabits(fetchedHabits);
      
      const fetchedSummaries = summariesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllSummaries(fetchedSummaries);
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

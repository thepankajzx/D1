import { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { logErrorToDb } from '../lib/logger';
import { useAuth } from './AuthContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

const normalizeHabits = (habits) => {
  if (!Array.isArray(habits)) return habits;
  const nameToIcon = {
    'Daily Reading': 'menu_book',
    'Pushups': 'fitness_center',
    'Screen Time': 'smartphone',
    'Wake Up Early': 'alarm',
    'Wake Up Time': 'alarm',
    'Sleep Time': 'bedtime',
    'Sleep Duration': 'hourglass_empty',
    'Workout': 'fitness_center',
    'Walking / Steps': 'directions_walk',
    'Water Intake': 'water_drop',
    'Protein Intake': 'restaurant',
    'Calories': 'local_dining',
    'Deep Work': 'psychology',
    'Pomodoro Sessions': 'timer',
    'Reading': 'menu_book',
    'Study': 'school',
    'Meditation': 'self_improvement',
    'Journal': 'edit_note',
    'Cold Shower': 'ac_unit',
    'Mood': 'mood',
    'Energy Level': 'bolt',
    'Alcohol Free': 'no_drinks',
    'Smoking / Nicotine Free': 'smoke_free'
  };

  const emojiToIcon = {
    '📖': 'menu_book',
    '💪': 'fitness_center',
    '📱': 'smartphone',
    '🌅': 'alarm',
    '💧': 'water_drop',
    '🧘': 'self_improvement',
    '🚿': 'ac_unit',
    '🏋️': 'fitness_center',
    '😴': 'bedtime',
    '🥗': 'restaurant'
  };

  return habits.map(h => {
    let icon = h.icon;
    if (nameToIcon[h.name]) {
      icon = nameToIcon[h.name];
    } else if (emojiToIcon[icon]) {
      icon = emojiToIcon[icon];
    } else if (!icon || icon.includes("ð") || icon.includes("dY") || icon.includes("")) {
      icon = "star";
    }
    const seed = HABITS_SEED_DATA.find(s => s.id === h.id || s.name === h.name);
    let unit = h.unit || h.defaultUnit || h.customUnit || (seed ? seed.defaultUnit : "") || "";
    if (unit === "time" || unit === "Time") unit = "";

    return {
      ...h,
      unit,
      defaultUnit: h.defaultUnit || (seed ? seed.defaultUnit : unit),
      icon
    };
  });
};

export function DataProvider({ children }) {
  const { currentUser: user } = useAuth();
  
  const [habits, setHabits] = useState(() => {
    const cached = localStorage.getItem(`habits_${user?.uid}`);
    return cached ? normalizeHabits(JSON.parse(cached)) : [];
  });
  const [allSummaries, setAllSummaries] = useState(() => {
    const cached = localStorage.getItem(`summaries_${user?.uid}`);
    return cached ? JSON.parse(cached) : [];
  });
  const [priorityModeEnabled, setPriorityModeEnabled] = useState(false);

  // Grant pro to demo/dev accounts immediately, before Firestore loads
  const DEV_PRO_EMAILS = ['dummytest2025@example.com', 'test2025@gmail.com', 'zxofficial84@gmail.com'];
  const isDevPro = import.meta.env.DEV || DEV_PRO_EMAILS.includes(user?.email?.toLowerCase() ?? '');
  const [userDocData, setUserDocData] = useState(isDevPro ? { isPro: true } : null);
  const [loadingData, setLoadingData] = useState(() => {
    // If we have cached habits, we don't need to block the UI
    const hasCachedData = !!localStorage.getItem(`habits_${user?.uid}`);
    return !hasCachedData;
  });

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
      setHabits(normalizeHabits(JSON.parse(cachedHabits)));
      setLoadingData(false);
    } else {
      setLoadingData(true);
    }
    
    if (cachedSummaries) {
      setAllSummaries(JSON.parse(cachedSummaries));
    }

    let unsubHabits = () => {};
    let unsubSummaries = () => {};

    const setupListeners = async () => {
      // Fetch user doc once
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const lowerEmail = user.email ? user.email.toLowerCase() : '';
            if (import.meta.env.DEV || DEV_PRO_EMAILS.includes(lowerEmail)) {
                data.isPro = true;
            }
            setUserDocData(data);
            setPriorityModeEnabled(data.priorityModeEnabled || false);
        } else {
            const lowerEmail = user.email ? user.email.toLowerCase() : '';
            if (import.meta.env.DEV || DEV_PRO_EMAILS.includes(lowerEmail)) {
                setUserDocData({ isPro: true });
            }
        }
      } catch (err) {
        console.error("Error loading user doc:", err);
        logErrorToDb(err);
      }

      // Real-time listener for Habits
      unsubHabits = onSnapshot(
        collection(db, `users/${user.uid}/habits`),
        (snap) => {
          const fetchedHabits = normalizeHabits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          fetchedHabits.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
          setHabits(fetchedHabits);
          localStorage.setItem(`habits_${user.uid}`, JSON.stringify(fetchedHabits));
          setLoadingData(false);
        },
        (err) => {
          console.error("Error loading habits:", err);
          logErrorToDb(err);
        }
      );

      // Real-time listener for Summaries
      unsubSummaries = onSnapshot(
        collection(db, `users/${user.uid}/dailySummaries`),
        (snap) => {
          const fetchedSummaries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sort by date (id) descending in memory
          fetchedSummaries.sort((a, b) => b.id.localeCompare(a.id));
          const recentSummaries = fetchedSummaries.slice(0, 365);
          setAllSummaries(recentSummaries);
          localStorage.setItem(`summaries_${user.uid}`, JSON.stringify(recentSummaries));
        },
        (err) => {
          console.error("Error loading summaries:", err);
          logErrorToDb(err);
        }
      );
    };

    setupListeners();

    return () => {
      unsubHabits();
      unsubSummaries();
    };
  }, [user]);

  // Keep loadGlobalData for manual refreshes if needed, but it won't be as necessary now
  async function loadGlobalData() {
    // Empty function to prevent crashing where refreshData is called
  }

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

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logErrorToDb } from '../lib/logger';
import { useAuth } from './AuthContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { useGuest } from './GuestContext';
import { DEMO_DATA } from '../lib/demoData';
import { resolveHabitColor, resolveHabitIcon, canonicalizeHabit } from '../lib/habitColors';
import { isNightHabit } from '../lib/scoring';

const DataContext = createContext({});
export function useData() { return useContext(DataContext) || {}; }

const normalizeHabits = (habits) => {
  if (!Array.isArray(habits)) return habits;
  return habits.map(h => {
    const seed = HABITS_SEED_DATA.find(s => s.id === h.id || s.name === h.name);
    const canonical = canonicalizeHabit(h);
    
    let unit = h.unit || h.defaultUnit || h.customUnit || (seed ? seed.defaultUnit : '') || '';
    if (unit === 'time' || unit === 'Time') unit = '';
    
    let target100 = h.target100 !== undefined && h.target100 !== null ? h.target100 : (h.userTarget100 !== undefined && h.userTarget100 !== null ? h.userTarget100 : (h.target !== undefined && h.target !== null ? h.target : (seed?.target100 ?? 10)));
    let target0 = h.target0 !== undefined && h.target0 !== null ? h.target0 : (h.userTarget0 !== undefined && h.userTarget0 !== null ? h.userTarget0 : (h.floor !== undefined && h.floor !== null ? h.floor : (seed?.target0 ?? 0)));
    
    const isNight = isNightHabit(h);
    if (isNight) {
      if (typeof target100 === 'number' && target100 < 12 * 60) target100 += 1440;
      if (typeof target0 === 'number' && target0 < 12 * 60) target0 += 1440;
    }

    return { 
      ...canonical, 
      unit, 
      defaultUnit: h.defaultUnit || (seed ? seed.defaultUnit : unit), 
      target100, 
      target0, 
      userTarget100: target100, 
      userTarget0: target0 
    };
  });
};

export function DataProvider({ children }) {
  const { currentUser: user } = useAuth();
  const { isGuest, exitGuestMode } = useGuest();

  // Streak Tracking Preference (Default: ON)
  const [streakTrackingEnabled, setStreakTrackingEnabledState] = useState(() => {
    try {
      const localVal = localStorage.getItem('preference_streak_tracking');
      if (localVal !== null) return localVal === 'true';
    } catch (e) {}
    return true;
  });

  // Core X Preference (Default: OFF / false for all users until manually enabled)
  const [coreXEnabled, setCoreXEnabledState] = useState(() => {
    try {
      const localVal = localStorage.getItem('preference_corex_enabled');
      if (localVal !== null) return localVal === 'true';
    } catch (e) {}
    return false;
  });

  const setCoreXEnabled = async (enabled) => {
    setCoreXEnabledState(enabled);
    try {
      localStorage.setItem('preference_corex_enabled', String(enabled));
      if (user?.uid && !isGuest) {
        await updateDoc(doc(db, 'users', user.uid), {
          coreXEnabled: enabled
        });
      }
    } catch (e) {
      console.error('Error saving coreX preference:', e);
    }
  };

  // Today's Compass Preference (Default: OFF / false until manually enabled in Upcoming Features)
  const [todayCompassEnabled, setTodayCompassEnabledState] = useState(() => {
    try {
      const localVal = localStorage.getItem('preference_today_compass_enabled');
      if (localVal !== null) return localVal === 'true';
    } catch (e) {}
    return false;
  });

  const setTodayCompassEnabled = async (enabled) => {
    setTodayCompassEnabledState(enabled);
    try {
      localStorage.setItem('preference_today_compass_enabled', String(enabled));
      if (user?.uid && !isGuest) {
        await updateDoc(doc(db, 'users', user.uid), {
          todayCompassEnabled: enabled
        });
      }
    } catch (e) {
      console.error('Error saving todayCompass preference:', e);
    }
  };

  // AI Habit Coach Preference (Default: true / ON)
  const [aiCoachEnabled, setAiCoachEnabledState] = useState(() => {
    try {
      const localVal = localStorage.getItem('preference_ai_coach_enabled');
      if (localVal !== null) return localVal === 'true';
    } catch (e) {}
    return true;
  });

  const setAiCoachEnabled = async (enabled) => {
    setAiCoachEnabledState(enabled);
    try {
      localStorage.setItem('preference_ai_coach_enabled', String(enabled));
      if (user?.uid && !isGuest) {
        await updateDoc(doc(db, 'users', user.uid), {
          aiCoachEnabled: enabled
        });
      }
    } catch (e) {
      console.error('Error saving aiCoach preference:', e);
    }
  };

  // Early Unlock All Insights Preference (Default: false / locked, only Firestore upgrades)
  const [earlyUnlockAll, setEarlyUnlockAllState] = useState(false);

  const setEarlyUnlockAll = async (enabled) => {
    setEarlyUnlockAllState(enabled);
    try {
      localStorage.setItem('preference_early_unlock_all', String(enabled));
      if (user?.uid && !isGuest) {
        await updateDoc(doc(db, 'users', user.uid), {
          earlyUnlockAll: enabled
        });
      }
    } catch (e) {
      console.error('Error saving earlyUnlockAll preference:', e);
    }
  };

  const setStreakTrackingEnabled = async (enabled) => {
    setStreakTrackingEnabledState(enabled);
    try {
      localStorage.setItem('preference_streak_tracking', String(enabled));
      if (user?.uid && !isGuest) {
        await updateDoc(doc(db, 'users', user.uid), {
          streakTrackingEnabled: enabled
        });
      }
    } catch (e) {
      console.error('Error saving streak tracking preference:', e);
    }
  };

  // Time Format Preference (Default: '12h')
  const [timeFormat, setTimeFormatState] = useState(() => {
    try {
      const localVal = localStorage.getItem('preference_time_format');
      if (localVal === '24h' || localVal === '12h') return localVal;
    } catch (e) {}
    return '12h';
  });

  const setTimeFormat = async (format) => {
    const validFormat = format === '24h' ? '24h' : '12h';
    setTimeFormatState(validFormat);
    try {
      localStorage.setItem('preference_time_format', validFormat);
      if (user?.uid && !isGuest) {
        await updateDoc(doc(db, 'users', user.uid), {
          timeFormat: validFormat
        });
      }
    } catch (e) {
      console.error('Error saving time format preference:', e);
    }
  };

  // If a real user is authenticated, clear any leftover guest demo state
  useEffect(() => {
    if (user && isGuest) {
      exitGuestMode();
    }
  }, [user, isGuest, exitGuestMode]);

  // ── GUEST MODE: serve demo data, skip all Firebase ONLY if not logged in ──
  if (isGuest && !user) {
    return (
      <GuestDataProvider timeFormat={timeFormat} setTimeFormat={setTimeFormat}>
        {children}
      </GuestDataProvider>
    );
  }

  return (
    <RealDataProvider 
      user={user}
      streakTrackingEnabled={streakTrackingEnabled}
      setStreakTrackingEnabled={setStreakTrackingEnabled}
      setStreakTrackingEnabledState={setStreakTrackingEnabledState}
      coreXEnabled={coreXEnabled}
      setCoreXEnabled={setCoreXEnabled}
      setCoreXEnabledState={setCoreXEnabledState}
      todayCompassEnabled={todayCompassEnabled}
      setTodayCompassEnabled={setTodayCompassEnabled}
      setTodayCompassEnabledState={setTodayCompassEnabledState}
      aiCoachEnabled={aiCoachEnabled}
      setAiCoachEnabled={setAiCoachEnabled}
      setAiCoachEnabledState={setAiCoachEnabledState}
      earlyUnlockAll={earlyUnlockAll}
      setEarlyUnlockAll={setEarlyUnlockAll}
      setEarlyUnlockAllState={setEarlyUnlockAllState}
      timeFormat={timeFormat}
      setTimeFormat={setTimeFormat}
      setTimeFormatState={setTimeFormatState}
    >
      {children}
    </RealDataProvider>
  );
}

function GuestDataProvider({ children, timeFormat, setTimeFormat }) {
  const [habits, setHabits] = useState(DEMO_DATA.habits);
  const [allSummaries, setAllSummaries] = useState(DEMO_DATA.allSummaries);
  const [streakTrackingEnabled, setStreakTrackingEnabled] = useState(true);
  const [coreXEnabled, setCoreXEnabled] = useState(true);
  const [todayCompassEnabled, setTodayCompassEnabled] = useState(true);
  const [aiCoachEnabled, setAiCoachEnabled] = useState(true);
  const [earlyUnlockAll, setEarlyUnlockAll] = useState(false);
  const [priorityModeEnabled, setPriorityModeEnabled] = useState(true);

  return (
    <DataContext.Provider value={{
      habits,
      deletedHabits: [],
      setHabits,
      setDeletedHabits: () => {},
      allSummaries,
      dailySummaries: allSummaries,
      setAllSummaries,
      userDoc: DEMO_DATA.userDoc,
      loadingData: false,
      priorityModeEnabled,
      setPriorityModeEnabled,
      refreshData: () => {},
      isGuest: true,
      streakTrackingEnabled,
      setStreakTrackingEnabled,
      coreXEnabled,
      setCoreXEnabled,
      todayCompassEnabled,
      setTodayCompassEnabled,
      aiCoachEnabled,
      setAiCoachEnabled,
      earlyUnlockAll,
      setEarlyUnlockAll,
      timeFormat,
      setTimeFormat
    }}>
      {children}
    </DataContext.Provider>
  );
}

function RealDataProvider({ 
  user, 
  children, 
  streakTrackingEnabled, 
  setStreakTrackingEnabled, 
  setStreakTrackingEnabledState,
  coreXEnabled,
  setCoreXEnabled,
  setCoreXEnabledState,
  todayCompassEnabled,
  setTodayCompassEnabled,
  setTodayCompassEnabledState,
  aiCoachEnabled,
  setAiCoachEnabled,
  setAiCoachEnabledState,
  earlyUnlockAll,
  setEarlyUnlockAll,
  setEarlyUnlockAllState,
  timeFormat,
  setTimeFormat,
  setTimeFormatState
}) {
  const getCachedUid = () => {
    if (user?.uid) return user.uid;
    try {
      const cached = localStorage.getItem('d1_cached_user');
      return cached ? JSON.parse(cached).uid : null;
    } catch (_) {
      return null;
    }
  };

  const [habits, setHabits] = useState(() => {
    const uid = getCachedUid();
    const c = uid ? localStorage.getItem('habits_' + uid) : null;
    return c ? normalizeHabits(JSON.parse(c)) : [];
  });
  const [deletedHabits, setDeletedHabits] = useState(() => {
    const uid = getCachedUid();
    const c = uid ? localStorage.getItem('deleted_habits_' + uid) : null;
    return c ? normalizeHabits(JSON.parse(c)) : [];
  });
  const [allSummaries, setAllSummaries] = useState(() => {
    const uid = getCachedUid();
    const c = uid ? localStorage.getItem('summaries_' + uid) : null;
    return c ? JSON.parse(c) : [];
  });
  const [priorityModeEnabled, setPriorityModeEnabled] = useState(false);
  const isDevPro = import.meta.env.DEV;
  const [userDocData, setUserDocData] = useState(() => {
    const uid = getCachedUid();
    if (uid) {
      try {
        const c = localStorage.getItem('user_doc_' + uid);
        if (c) return JSON.parse(c);
      } catch (_) {}
    }
    return isDevPro ? { isPro: true } : null;
  });
  const [loadingData, setLoadingData] = useState(() => {
    const uid = getCachedUid();
    return !(uid && localStorage.getItem('habits_' + uid));
  });

  useEffect(() => {
    const activeUid = user?.uid || getCachedUid();
    if (!activeUid) {
      if (!user) {
        setHabits([]); setDeletedHabits([]); setAllSummaries([]); setPriorityModeEnabled(false);
        setUserDocData(null); setLoadingData(false); return;
      }
    }
    const ch = localStorage.getItem('habits_' + activeUid);
    const cdh = localStorage.getItem('deleted_habits_' + activeUid);
    const cs = localStorage.getItem('summaries_' + activeUid);
    if (ch) { setHabits(normalizeHabits(JSON.parse(ch))); setLoadingData(false); }
    else { setLoadingData(true); }
    if (cdh) { setDeletedHabits(normalizeHabits(JSON.parse(cdh))); }
    if (cs) setAllSummaries(JSON.parse(cs));
    let unsubH = () => {}, unsubS = () => {};

    // ⚡ Attach real-time snapshot listeners IMMEDIATELY (never wait for getDoc!)
    unsubH = onSnapshot(collection(db, 'users/' + activeUid + '/habits'), (snap) => {
      const fhAll = normalizeHabits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      const active = fhAll.filter(h => h.status !== 'deleted').sort((a,b) => (a.orderIndex||0)-(b.orderIndex||0));
      const deleted = fhAll.filter(h => h.status === 'deleted').sort((a,b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
      setHabits(active);
      setDeletedHabits(deleted);
      localStorage.setItem('habits_' + activeUid, JSON.stringify(active));
      localStorage.setItem('deleted_habits_' + activeUid, JSON.stringify(deleted));
      setLoadingData(false);
    }, (err) => { 
      console.warn("Habits snapshot listener offline/fallback:", err); 
      setLoadingData(false); 
    });

    unsubS = onSnapshot(collection(db, 'users/' + activeUid + '/dailySummaries'), (snap) => {
      const fs2 = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.id.localeCompare(a.id)).slice(0, 365);
      setAllSummaries(fs2); 
      localStorage.setItem('summaries_' + activeUid, JSON.stringify(fs2));
    }, (err) => { 
      console.warn("DailySummaries snapshot listener offline/fallback:", err); 
    });

    // ⚡ Fast Safety timeout: never leave user waiting more than 400ms for skeleton loaders
    const safetyTimer = setTimeout(() => {
      setLoadingData(false);
    }, 400);

    // Concurrently sync user doc in the background without blocking habits UI
    (async () => {
      try {
        const ud = await getDoc(doc(db, 'users', activeUid));
        if (ud.exists()) {
          const data = ud.data();
          if (import.meta.env.DEV) data.isPro = true;
          setUserDocData(data); 
          try {
            localStorage.setItem('user_doc_' + activeUid, JSON.stringify(data));
          } catch (_) {}
          setPriorityModeEnabled(data.priorityModeEnabled || false);

          try {
            if (data.reminderSettings) {
              const localSettings = localStorage.getItem('d1_reminder_settings');
              const parsed = localSettings ? JSON.parse(localSettings) : {};
              const merged = { ...parsed, ...data.reminderSettings };
              localStorage.setItem('d1_reminder_settings', JSON.stringify(merged));
            }
          } catch (e) {}

          try {
            const localVal = localStorage.getItem('preference_streak_tracking');
            if (localVal === null && typeof data.streakTrackingEnabled === 'boolean') {
              setStreakTrackingEnabledState(data.streakTrackingEnabled);
            }
          } catch (e) {}

          try {
            const localVal = localStorage.getItem('preference_corex_enabled');
            if (localVal === null && typeof data.coreXEnabled === 'boolean') {
              setCoreXEnabledState(data.coreXEnabled);
            }
          } catch (e) {}

          try {
            const localVal = localStorage.getItem('preference_today_compass_enabled');
            if (localVal === null && typeof data.todayCompassEnabled === 'boolean') {
              setTodayCompassEnabledState(data.todayCompassEnabled);
            }
          } catch (e) {}

          try {
            const localVal = localStorage.getItem('preference_ai_coach_enabled');
            if (localVal === null && typeof data.aiCoachEnabled === 'boolean') {
              setAiCoachEnabledState(data.aiCoachEnabled);
            }
          } catch (e) {}

          try {
            if (typeof data.earlyUnlockAll === 'boolean') {
              setEarlyUnlockAllState(data.earlyUnlockAll);
              localStorage.setItem('preference_early_unlock_all', String(data.earlyUnlockAll));
            }
          } catch (e) {}

          try {
            if (data.timeFormat === '12h' || data.timeFormat === '24h') {
              setTimeFormatState(data.timeFormat);
              localStorage.setItem('preference_time_format', data.timeFormat);
            }
          } catch (e) {}

          try {
            if (typeof data.coreXEnabled === 'boolean') {
              setCoreXEnabledState(data.coreXEnabled);
              localStorage.setItem('preference_corex_enabled', String(data.coreXEnabled));
            }
          } catch (e) {}
        } else {
          if (import.meta.env.DEV) setUserDocData({ isPro: true });
        }
      } catch (err) { 
        console.warn("User doc fetch offline/fallback:", err); 
      }
    })();

    return () => { 
      clearTimeout(safetyTimer);
      unsubH(); 
      unsubS(); 
    };
  }, [user?.uid]);

  const refreshData = async () => {
    const activeUid = user?.uid || getCachedUid();
    if (!activeUid) return;
    try {
      const hSnap = await getDocs(collection(db, 'users/' + activeUid + '/habits'));
      const fhAll = normalizeHabits(hSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const active = fhAll.filter(h => h.status !== 'deleted').sort((a,b) => (a.orderIndex||0)-(b.orderIndex||0));
      const deleted = fhAll.filter(h => h.status === 'deleted').sort((a,b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
      setHabits(active);
      setDeletedHabits(deleted);
      localStorage.setItem('habits_' + activeUid, JSON.stringify(active));
      localStorage.setItem('deleted_habits_' + activeUid, JSON.stringify(deleted));

      const sSnap = await getDocs(collection(db, 'users/' + activeUid + '/dailySummaries'));
      const fs2 = sSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.id.localeCompare(a.id)).slice(0, 365);
      setAllSummaries(fs2);
      localStorage.setItem('summaries_' + activeUid, JSON.stringify(fs2));
    } catch (err) {
      console.warn('Error refreshing data (offline fallback):', err);
    }
  };

  return (
    <DataContext.Provider value={{ 
      habits, 
      deletedHabits,
      setHabits, 
      setDeletedHabits,
      allSummaries, 
      dailySummaries: allSummaries,
      setAllSummaries, 
      priorityModeEnabled, 
      setPriorityModeEnabled, 
      userDoc: userDocData, 
      loadingData, 
      refreshData, 
      isGuest: false,
      streakTrackingEnabled,
      setStreakTrackingEnabled,
      coreXEnabled,
      setCoreXEnabled,
      todayCompassEnabled,
      setTodayCompassEnabled,
      aiCoachEnabled,
      setAiCoachEnabled,
      earlyUnlockAll,
      setEarlyUnlockAll,
      timeFormat,
      setTimeFormat
    }}>
      {children}
    </DataContext.Provider>
  );
}

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

const DataContext = createContext();
export function useData() { return useContext(DataContext); }

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

  // AI Habit Coach Preference (Default: false / off until toggled in Upcoming Beta Lab)
  const [aiCoachEnabled, setAiCoachEnabledState] = useState(() => {
    try {
      const localVal = localStorage.getItem('preference_ai_coach_enabled');
      if (localVal !== null) return localVal === 'true';
    } catch (e) {}
    return false;
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

  // Early Unlock All Insights Preference (Default: false / locked)
  const [earlyUnlockAll, setEarlyUnlockAllState] = useState(() => {
    try {
      const localVal = localStorage.getItem('preference_early_unlock_all');
      if (localVal !== null) return localVal === 'true';
    } catch (e) {}
    return false;
  });

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
    const noop = () => {};
    return (
      <DataContext.Provider value={{ 
        ...DEMO_DATA, 
        isGuest: true, 
        setHabits: noop, 
        setAllSummaries: noop, 
        setPriorityModeEnabled: noop, 
        refreshData: noop,
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
  const [habits, setHabits] = useState(() => {
    const c = localStorage.getItem('habits_' + user?.uid);
    return c ? normalizeHabits(JSON.parse(c)) : [];
  });
  const [deletedHabits, setDeletedHabits] = useState(() => {
    const c = localStorage.getItem('deleted_habits_' + user?.uid);
    return c ? normalizeHabits(JSON.parse(c)) : [];
  });
  const [allSummaries, setAllSummaries] = useState(() => {
    const c = localStorage.getItem('summaries_' + user?.uid);
    return c ? JSON.parse(c) : [];
  });
  const [priorityModeEnabled, setPriorityModeEnabled] = useState(false);
  const DEV_PRO_EMAILS = ['dummytest2025@example.com','test2025@gmail.com','zxofficial84@gmail.com'];
  const isDevPro = import.meta.env.DEV || DEV_PRO_EMAILS.includes(user?.email?.toLowerCase() ?? '');
  const [userDocData, setUserDocData] = useState(isDevPro ? { isPro: true } : null);
  const [loadingData, setLoadingData] = useState(() => !localStorage.getItem('habits_' + user?.uid));

  useEffect(() => {
    if (!user) {
      setHabits([]); setDeletedHabits([]); setAllSummaries([]); setPriorityModeEnabled(false);
      setUserDocData(null); setLoadingData(false); return;
    }
    const ch = localStorage.getItem('habits_' + user.uid);
    const cdh = localStorage.getItem('deleted_habits_' + user.uid);
    const cs = localStorage.getItem('summaries_' + user.uid);
    if (ch) { setHabits(normalizeHabits(JSON.parse(ch))); setLoadingData(false); }
    else { setLoadingData(true); }
    if (cdh) { setDeletedHabits(normalizeHabits(JSON.parse(cdh))); }
    if (cs) setAllSummaries(JSON.parse(cs));
    let unsubH = () => {}, unsubS = () => {};
    const setup = async () => {
      try {
        const ud = await getDoc(doc(db, 'users', user.uid));
        if (ud.exists()) {
          const data = ud.data();
          const le = user.email?.toLowerCase() ?? '';
          if (import.meta.env.DEV || DEV_PRO_EMAILS.includes(le)) data.isPro = true;
          setUserDocData(data); 
          setPriorityModeEnabled(data.priorityModeEnabled || false);

          // Sync streak preference from user doc if no local override
          try {
            const localVal = localStorage.getItem('preference_streak_tracking');
            if (localVal === null && typeof data.streakTrackingEnabled === 'boolean') {
              setStreakTrackingEnabledState(data.streakTrackingEnabled);
            }
          } catch (e) {}

          // Sync coreX preference from user doc if no local override
          try {
            const localVal = localStorage.getItem('preference_corex_enabled');
            if (localVal === null && typeof data.coreXEnabled === 'boolean') {
              setCoreXEnabledState(data.coreXEnabled);
            }
          } catch (e) {}

          // Sync todayCompass preference from user doc if no local override
          try {
            const localVal = localStorage.getItem('preference_today_compass_enabled');
            if (localVal === null && typeof data.todayCompassEnabled === 'boolean') {
              setTodayCompassEnabledState(data.todayCompassEnabled);
            }
          } catch (e) {}

          // Sync aiCoach preference from user doc if no local override
          try {
            const localVal = localStorage.getItem('preference_ai_coach_enabled');
            if (localVal === null && typeof data.aiCoachEnabled === 'boolean') {
              setAiCoachEnabledState(data.aiCoachEnabled);
            }
          } catch (e) {}

          // Sync earlyUnlockAll preference from user doc if no local override
          try {
            const localVal = localStorage.getItem('preference_early_unlock_all');
            if (localVal === null && typeof data.earlyUnlockAll === 'boolean') {
              setEarlyUnlockAllState(data.earlyUnlockAll);
            }
          } catch (e) {}

          // Sync time format preference from user doc if no local override
          try {
            const localFormat = localStorage.getItem('preference_time_format');
            if (!localFormat && (data.timeFormat === '12h' || data.timeFormat === '24h')) {
              setTimeFormatState(data.timeFormat);
              localStorage.setItem('preference_time_format', data.timeFormat);
            }
          } catch (e) {}
        } else {
          const le = user.email?.toLowerCase() ?? '';
          if (import.meta.env.DEV || DEV_PRO_EMAILS.includes(le)) setUserDocData({ isPro: true });
        }
      } catch (err) { console.error(err); logErrorToDb(err); }
      unsubH = onSnapshot(collection(db, 'users/' + user.uid + '/habits'), (snap) => {
        const fhAll = normalizeHabits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        const active = fhAll.filter(h => h.status !== 'deleted').sort((a,b) => (a.orderIndex||0)-(b.orderIndex||0));
        const deleted = fhAll.filter(h => h.status === 'deleted').sort((a,b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
        setHabits(active);
        setDeletedHabits(deleted);
        localStorage.setItem('habits_' + user.uid, JSON.stringify(active));
        localStorage.setItem('deleted_habits_' + user.uid, JSON.stringify(deleted));
        setLoadingData(false);
      }, (err) => { console.error(err); logErrorToDb(err); });
      unsubS = onSnapshot(collection(db, 'users/' + user.uid + '/dailySummaries'), (snap) => {
        const fs2 = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.id.localeCompare(a.id)).slice(0, 365);
        setAllSummaries(fs2); localStorage.setItem('summaries_' + user.uid, JSON.stringify(fs2));
      }, (err) => { console.error(err); logErrorToDb(err); });
    };
    setup();
    return () => { unsubH(); unsubS(); };
  }, [user]);

  const refreshData = async () => {
    if (!user) return;
    try {
      const hSnap = await getDocs(collection(db, 'users/' + user.uid + '/habits'));
      const fhAll = normalizeHabits(hSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const active = fhAll.filter(h => h.status !== 'deleted').sort((a,b) => (a.orderIndex||0)-(b.orderIndex||0));
      const deleted = fhAll.filter(h => h.status === 'deleted').sort((a,b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
      setHabits(active);
      setDeletedHabits(deleted);
      localStorage.setItem('habits_' + user.uid, JSON.stringify(active));
      localStorage.setItem('deleted_habits_' + user.uid, JSON.stringify(deleted));

      const sSnap = await getDocs(collection(db, 'users/' + user.uid + '/dailySummaries'));
      const fs2 = sSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.id.localeCompare(a.id)).slice(0, 365);
      setAllSummaries(fs2);
      localStorage.setItem('summaries_' + user.uid, JSON.stringify(fs2));
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  return (
    <DataContext.Provider value={{ 
      habits, 
      deletedHabits,
      setHabits, 
      setDeletedHabits,
      allSummaries, 
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

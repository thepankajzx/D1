import { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logErrorToDb } from '../lib/logger';
import { useAuth } from './AuthContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { useGuest } from './GuestContext';
import { DEMO_DATA } from '../lib/demoData';

const DataContext = createContext();
export function useData() { return useContext(DataContext); }

const normalizeHabits = (habits) => {
  if (!Array.isArray(habits)) return habits;
  const nameToIcon = {
    'Daily Reading':'menu_book','Pushups':'fitness_center','Screen Time':'smartphone',
    'Wake Up Early':'alarm','Wake Up Time':'alarm','Sleep Time':'bedtime',
    'Sleep Duration':'hourglass_empty','Workout':'fitness_center',
    'Walking / Steps':'directions_walk','Water Intake':'water_drop',
    'Protein Intake':'restaurant','Calories':'local_dining','Deep Work':'psychology',
    'Pomodoro Sessions':'timer','Reading':'menu_book','Study':'school',
    'Meditation':'self_improvement','Journal':'edit_note','Cold Shower':'ac_unit',
    'Mood':'mood','Energy Level':'bolt','Alcohol Free':'no_drinks',
    'Smoking / Nicotine Free':'smoke_free'
  };
  return habits.map(h => {
    let icon = h.icon;
    if (nameToIcon[h.name]) icon = nameToIcon[h.name];
    else if (!icon) icon = 'star';
    const seed = HABITS_SEED_DATA.find(s => s.id === h.id || s.name === h.name);
    let unit = h.unit || h.defaultUnit || h.customUnit || (seed ? seed.defaultUnit : '') || '';
    if (unit === 'time' || unit === 'Time') unit = '';
    const target100 = h.target100 !== undefined && h.target100 !== null ? h.target100 : (h.userTarget100 !== undefined && h.userTarget100 !== null ? h.userTarget100 : (h.target !== undefined && h.target !== null ? h.target : (seed?.target100 ?? 10)));
    const target0 = h.target0 !== undefined && h.target0 !== null ? h.target0 : (h.userTarget0 !== undefined && h.userTarget0 !== null ? h.userTarget0 : (h.floor !== undefined && h.floor !== null ? h.floor : (seed?.target0 ?? 0)));
    return { ...h, unit, defaultUnit: h.defaultUnit || (seed ? seed.defaultUnit : unit), icon, target100, target0, userTarget100: target100, userTarget0: target0 };
  });
};

export function DataProvider({ children }) {
  const { currentUser: user } = useAuth();
  const { isGuest } = useGuest();

  // ── GUEST MODE: serve demo data, skip all Firebase ──
  if (isGuest) {
    const noop = () => {};
    return (
      <DataContext.Provider value={{ ...DEMO_DATA, isGuest: true, setHabits: noop, setAllSummaries: noop, setPriorityModeEnabled: noop, refreshData: noop }}>
        {children}
      </DataContext.Provider>
    );
  }

  return <RealDataProvider user={user}>{children}</RealDataProvider>;
}

function RealDataProvider({ user, children }) {
  const [habits, setHabits] = useState(() => {
    const c = localStorage.getItem('habits_' + user?.uid);
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
      setHabits([]); setAllSummaries([]); setPriorityModeEnabled(false);
      setUserDocData(null); setLoadingData(false); return;
    }
    const ch = localStorage.getItem('habits_' + user.uid);
    const cs = localStorage.getItem('summaries_' + user.uid);
    if (ch) { setHabits(normalizeHabits(JSON.parse(ch))); setLoadingData(false); }
    else { setLoadingData(true); }
    if (cs) setAllSummaries(JSON.parse(cs));
    let unsubH = () => {}, unsubS = () => {};
    const setup = async () => {
      try {
        const ud = await getDoc(doc(db, 'users', user.uid));
        if (ud.exists()) {
          const data = ud.data();
          const le = user.email?.toLowerCase() ?? '';
          if (import.meta.env.DEV || DEV_PRO_EMAILS.includes(le)) data.isPro = true;
          setUserDocData(data); setPriorityModeEnabled(data.priorityModeEnabled || false);
        } else {
          const le = user.email?.toLowerCase() ?? '';
          if (import.meta.env.DEV || DEV_PRO_EMAILS.includes(le)) setUserDocData({ isPro: true });
        }
      } catch (err) { console.error(err); logErrorToDb(err); }
      unsubH = onSnapshot(collection(db, 'users/' + user.uid + '/habits'), (snap) => {
        const fh = normalizeHabits(snap.docs.map(d => ({ id: d.id, ...d.data() }))).sort((a,b) => (a.orderIndex||0)-(b.orderIndex||0));
        setHabits(fh); localStorage.setItem('habits_' + user.uid, JSON.stringify(fh)); setLoadingData(false);
      }, (err) => { console.error(err); logErrorToDb(err); });
      unsubS = onSnapshot(collection(db, 'users/' + user.uid + '/dailySummaries'), (snap) => {
        const fs2 = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.id.localeCompare(a.id)).slice(0, 365);
        setAllSummaries(fs2); localStorage.setItem('summaries_' + user.uid, JSON.stringify(fs2));
      }, (err) => { console.error(err); logErrorToDb(err); });
    };
    setup();
    return () => { unsubH(); unsubS(); };
  }, [user]);

  return (
    <DataContext.Provider value={{ habits, setHabits, allSummaries, setAllSummaries, priorityModeEnabled, setPriorityModeEnabled, userDoc: userDocData, loadingData, refreshData: async () => {}, isGuest: false }}>
      {children}
    </DataContext.Provider>
  );
}

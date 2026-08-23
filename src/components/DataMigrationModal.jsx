import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Database, CheckCircle, ShieldCheck, Sparkle, Spinner } from '@phosphor-icons/react';

const OLD_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDmV8kDK7YZk-lxPwwDG2drrjybylwenWE",
  authDomain: "fci-lms.firebaseapp.com",
  projectId: "fci-lms",
  storageBucket: "fci-lms.firebasestorage.app",
  messagingSenderId: "180801083177",
  appId: "1:180801083177:web:3a9c3b02728749d2420938"
};

function getOldFirestore() {
  const existing = getApps().find(a => a.name === 'fciLmsOldProject');
  const app = existing || initializeApp(OLD_FIREBASE_CONFIG, 'fciLmsOldProject');
  return getFirestore(app);
}

const TARGET_HABITS_CONFIG = [
  { id: 'study', name: 'Study', category: 'Focus', scoringType: 'duration', direction: 'higher_is_better', defaultUnit: 'minutes', unit: 'minutes', target100: 240, target0: 0, userTarget100: 240, userTarget0: 0, icon: 'school', priorityRank: 1 },
  { id: 'screentime', name: 'Screen Time', category: 'Lifestyle', scoringType: 'duration', direction: 'lower_is_better', defaultUnit: 'hours', unit: 'hours', target100: 0, target0: 1, userTarget100: 0, userTarget0: 1, icon: 'smartphone', priorityRank: 2 },
  { id: 'workout', name: 'Workout', category: 'Fitness', scoringType: 'duration', direction: 'higher_is_better', defaultUnit: 'minutes', unit: 'minutes', target100: 30, target0: 0, userTarget100: 30, userTarget0: 0, icon: 'fitness_center', priorityRank: 3 },
  { id: 'sleep', name: 'Sleep Time', category: 'Morning', scoringType: 'time', direction: 'lower_is_better', defaultUnit: 'time', target100: 1320, target0: 1440, userTarget100: 1320, userTarget0: 1440, icon: 'bedtime' },
  { id: 'wakeup', name: 'Wake Up Time', category: 'Morning', scoringType: 'time', direction: 'lower_is_better', defaultUnit: 'time', target100: 360, target0: 480, userTarget100: 360, userTarget0: 480, icon: 'alarm' },
  { id: 'custom_masturbation_free', name: 'No Masturbation', category: 'Lifestyle', scoringType: 'binary', direction: 'higher_is_better', defaultUnit: '', unit: '', target100: 1, target0: 0, userTarget100: 1, userTarget0: 0, icon: 'shield' },
  { id: 'custom_porn_free', name: 'Porn Free', category: 'Lifestyle', scoringType: 'binary', direction: 'higher_is_better', defaultUnit: '', unit: '', target100: 1, target0: 0, userTarget100: 1, userTarget0: 0, icon: 'smoke_free' }
];

export default function DataMigrationModal({ isOpen, onClose }) {
  const { currentUser: user } = useAuth();
  const { refreshData } = useData();
  const { isHinglish } = useLanguage();

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [oldLogs, setOldLogs] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '', count: 0 });
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [migrationStatus, setMigrationStatus] = useState('idle'); // 'idle' | 'running' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchOldLogsPreview();
    }
  }, [isOpen, user]);

  const fetchOldLogsPreview = async () => {
    setLoadingPreview(true);
    setErrorMessage('');
    try {
      const oldDb = getOldFirestore();
      const snap = await getDocs(collection(oldDb, 'daily_logs'));
      const docs = [];
      snap.forEach(d => {
        docs.push({ id: d.id, ...d.data() });
      });

      docs.sort((a, b) => a.id.localeCompare(b.id));
      setOldLogs(docs);

      if (docs.length > 0) {
        setDateRange({
          start: docs[0].id,
          end: docs[docs.length - 1].id,
          count: docs.length
        });
      }
    } catch (err) {
      console.error('Error fetching old logs from fci-lms:', err);
      setErrorMessage(err.message || 'Failed to read daily_logs from fci-lms');
    } finally {
      setLoadingPreview(false);
    }
  };

  const executeMigration = async () => {
    if (!user || oldLogs.length === 0) return;
    setIsMigrating(true);
    setMigrationStatus('running');
    setProgress(5);
    setErrorMessage('');

    try {
      // 1. Write Habits Configuration
      const habitBatch = writeBatch(db);
      TARGET_HABITS_CONFIG.forEach(h => {
        const hRef = doc(db, `users/${user.uid}/habits`, h.id);
        habitBatch.set(hRef, h, { merge: true });
      });
      await habitBatch.commit();
      setProgress(25);

      // 2. Batch write entries and dailySummaries
      const chunkSize = 20;
      const totalDocs = oldLogs.length;

      for (let i = 0; i < totalDocs; i += chunkSize) {
        const chunk = oldLogs.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach(docData => {
          const date = docData.id || docData.date;
          if (!date) return;

          const breakdown = docData.breakdown || {};
          
          // Parse values accurately
          const studyMinutes = (docData.studyUnit === 'hours') ? (docData.studyValue * 60) : (docData.studyValue || 0);
          const screenHours = (docData.phoneUnit === 'minutes') ? (docData.phoneValue / 60) : (docData.phoneValue || 0);
          const workoutMinutes = (docData.workout === 'Yes' || docData.workoutValue > 0) ? (docData.workoutValue || 30) : 0;
          
          const isMastFree = (docData.masturbation === 'No' || docData.masturbation === 1 || docData.masturbation === true);
          const isPornFree = (docData.porn === 'No' || docData.porn === 1 || docData.porn === true);

          // Calculate normalized percentage scores (0 to 100)
          const studyScore = Math.min(100, Math.round((studyMinutes / 240) * 100));
          const screenScore = screenHours <= 0 ? 100 : Math.max(0, Math.round((1 - screenHours) * 100));
          const workoutScore = workoutMinutes >= 30 ? 100 : Math.round((workoutMinutes / 30) * 100);
          const mastScore = isMastFree ? 100 : 0;
          const pornScore = isPornFree ? 100 : 0;
          const sleepScore = breakdown.sleepScore ? Math.round(breakdown.sleepScore * 10) : 80;
          const wakeScore = breakdown.wakeScore ? Math.round(breakdown.wakeScore * 10) : 80;

          const habitScores = {
            study: studyScore,
            screentime: screenScore,
            workout: workoutScore,
            sleep: sleepScore,
            wakeup: wakeScore,
            custom_masturbation_free: mastScore,
            custom_porn_free: pornScore
          };

          const habitValues = {
            study: studyMinutes,
            screentime: screenHours,
            workout: workoutMinutes,
            sleep: docData.sleep || '23:00',
            wakeup: docData.wakeUp || '06:00',
            custom_masturbation_free: isMastFree ? 1 : 0,
            custom_porn_free: isPornFree ? 1 : 0
          };

          const overallScore = docData.totalScore || Math.round(Object.values(habitScores).reduce((a, b) => a + b, 0) / 7);
          const habitsCompleted = Object.values(habitScores).filter(s => s >= 60).length;

          // Individual Entries
          Object.entries(habitScores).forEach(([hId, sVal]) => {
            const entryRef = doc(db, `users/${user.uid}/entries`, `${hId}_${date}`);
            batch.set(entryRef, {
              id: `${hId}_${date}`,
              habitId: hId,
              entryDate: date,
              rawValue: habitValues[hId],
              computedScore: sVal,
              updatedAt: new Date(docData.updatedAt || docData.timestamp || Date.now()).toISOString()
            }, { merge: true });
          });

          // Daily Summary
          const summaryRef = doc(db, `users/${user.uid}/dailySummaries`, date);
          batch.set(summaryRef, {
            id: date,
            date: date,
            overallScore,
            habitsCompleted,
            habitsTotal: 7,
            habitScores,
            habitValues,
            legacyRaw: docData,
            updatedAt: new Date(docData.updatedAt || docData.timestamp || Date.now()).toISOString()
          }, { merge: true });
        });

        await batch.commit();
        const currentProgress = Math.min(95, 25 + Math.round(((i + chunk.length) / totalDocs) * 70));
        setProgress(currentProgress);
      }

      // 3. Recalculate Streak Count
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      oldLogs.forEach(docData => {
        const score = docData.totalScore || 0;
        if (score >= 60) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      });
      currentStreak = tempStreak;

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        currentStreak,
        longestStreak,
        lastMigratedAt: new Date().toISOString(),
        migratedDaysCount: oldLogs.length
      }, { merge: true });

      setProgress(100);
      setMigrationStatus('success');

      if (refreshData) {
        await refreshData();
      }
    } catch (err) {
      console.error('Migration error:', err);
      setErrorMessage(err.message || 'Migration failed');
      setMigrationStatus('error');
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Database size={20} weight="fill" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                Firebase Cross-Project Data Migration
              </h3>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                From `fci-lms` ➔ Into your `d1-core` Account
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Source & Destination Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[9px] font-black uppercase text-slate-400 block">Source Project</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block mt-0.5">
              fci-lms (Connected ✓)
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40">
            <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-300 block">Destination</span>
            <span className="text-xs font-black text-slate-900 dark:text-white truncate block mt-0.5">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Inspection & Preview Status */}
        {loadingPreview ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Spinner size={24} className="animate-spin text-primary" />
            <span className="text-xs font-bold">Scanning fci-lms `daily_logs`...</span>
          </div>
        ) : errorMessage ? (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 dark:text-rose-400 text-xs font-bold">
            {errorMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Dry-Run Statistics Box */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Logs</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
                  {dateRange.count} Days
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">From Date</span>
                <span className="text-xs font-black text-slate-900 dark:text-white block mt-1 truncate">
                  {dateRange.start || 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">To Date</span>
                <span className="text-xs font-black text-slate-900 dark:text-white block mt-1 truncate">
                  {dateRange.end || 'N/A'}
                </span>
              </div>
            </div>

            {/* Custom Targets Preview */}
            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                  Configured Habits &amp; Targets:
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Ready to Import
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                  📚 Study: <strong className="text-indigo-600 dark:text-indigo-400">4 Hours</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                  📱 Screen: <strong className="text-indigo-600 dark:text-indigo-400">0 - 1 Hour</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                  💪 Workout: <strong className="text-indigo-600 dark:text-indigo-400">30 Mins</strong>
                </span>
                <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                  🛡️ Retention &amp; Porn Free
                </span>
              </div>
            </div>

            {/* Safety Badges */}
            <div className="flex items-center gap-3 text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} weight="fill" className="text-emerald-500" />
                Original fci-lms Untouched
              </span>
              <span className="flex items-center gap-1">
                <Sparkle size={14} weight="fill" className="text-indigo-500" />
                Idempotent Merge
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar (When Running) */}
        {migrationStatus === 'running' && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs font-black text-indigo-600 dark:text-indigo-400">
              <span>Importing Documents...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Success Alert */}
        {migrationStatus === 'success' && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
            <CheckCircle size={24} weight="fill" className="text-emerald-500 shrink-0" />
            <div>
              <h4 className="font-black text-xs sm:text-sm">Migration Complete!</h4>
              <p className="text-[11px] font-medium opacity-90">
                All {dateRange.count} days of historical records have been safely migrated into your account.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {migrationStatus === 'success' ? 'Close' : 'Cancel'}
          </button>

          {migrationStatus === 'success' ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              Refresh &amp; View Analytics ➔
            </button>
          ) : (
            <button
              type="button"
              disabled={isMigrating || loadingPreview || dateRange.count === 0}
              onClick={executeMigration}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {isMigrating ? (
                <>
                  <Spinner size={14} className="animate-spin" />
                  <span>Migrating...</span>
                </>
              ) : (
                <>
                  <Database size={14} weight="fill" />
                  <span>Start Safe Migration ({dateRange.count} Days)</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

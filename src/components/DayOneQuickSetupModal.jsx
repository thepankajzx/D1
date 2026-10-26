import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Clock, Bell, Sparkle, Check, ArrowRight, Sun, Moon } from '@phosphor-icons/react';
import { requestNotificationPermission, saveReminderSettings, scheduleDailyReminder } from '../services/notificationService';

export default function DayOneQuickSetupModal({ isOpen, onClose }) {
  const { isHinglish } = useLanguage();
  const { timeFormat, setTimeFormat } = useData();
  const { isDark, setTheme } = useTheme();

  const [selectedFormat, setSelectedFormat] = useState(timeFormat || '12h');
  const [selectedTheme, setSelectedTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return 'dark';
    if (stored === 'light') return 'light';
    return isDark ? 'dark' : 'light';
  });
  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    return localStorage.getItem('preference_bedtime_reminder_enabled') !== 'false';
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleToggleReminder = async () => {
    const nextState = !remindersEnabled;
    setRemindersEnabled(nextState);

    if (nextState) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setRemindersEnabled(false);
        return;
      }
    }
    localStorage.setItem('preference_bedtime_reminder_enabled', nextState ? 'true' : 'false');
  };

  const handleThemeChange = (mode) => {
    setSelectedTheme(mode);
    setTheme(mode); // Immediate real-time visual feedback!
  };

  const handleSaveAndStart = async () => {
    setIsSaving(true);
    try {
      if (setTimeFormat && selectedFormat !== timeFormat) {
        await setTimeFormat(selectedFormat);
      }
      localStorage.setItem('preference_time_format', selectedFormat);
      localStorage.setItem('preference_bedtime_reminder_enabled', remindersEnabled ? 'true' : 'false');

      // Persist chosen theme (Day / Night Mode)
      setTheme(selectedTheme);
      localStorage.setItem('theme', selectedTheme);

      // Schedule notification if enabled
      if (remindersEnabled) {
        try {
          await saveReminderSettings({ enabled: true, offsetMinutes: 15 }, null);
          await scheduleDailyReminder({ enabled: true, offsetMinutes: 15 }, null);
        } catch (e) {
          console.warn('[DayOneSetup] Could not schedule reminder immediately:', e);
        }
      }

      // Mark Day 1 setup as completed so it never shows again
      localStorage.setItem('d1_day1_setup_completed', 'true');
      onClose();
    } catch (err) {
      console.error('[DayOneSetup] Save error:', err);
      localStorage.setItem('d1_day1_setup_completed', 'true');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-[#151C28] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <Sparkle size={24} weight="fill" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isHinglish ? 'दिन 1 • आवश्यक सेटअप' : 'Day 1 • Essential Setup'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {isHinglish ? 'अपनी प्राथमिक सेटिंग्स चुनें' : 'Personalize Your Preferences'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isHinglish 
                ? 'इन प्राथमिकताओं को सेट करें। बाद में प्रोफाइल सेक्शन से कभी भी बदल सकते हैं।' 
                : 'Set your routine once. You can customize them anytime later.'}
            </p>
          </div>
        </div>

        {/* 1. Time Format Selector */}
        <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Clock size={16} weight="bold" className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isHinglish ? 'समय फॉर्मेट (Time Format)' : 'Time Format'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setSelectedFormat('12h')}
              className={`h-11 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                selectedFormat === '12h'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-xs">12-Hour</span>
                <span className="text-[10px] opacity-75">10:30 PM</span>
              </div>
              {selectedFormat === '12h' && <Check size={16} weight="bold" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('24h')}
              className={`h-11 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                selectedFormat === '24h'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-xs">24-Hour</span>
                <span className="text-[10px] opacity-75">22:30</span>
              </div>
              {selectedFormat === '24h' && <Check size={16} weight="bold" />}
            </button>
          </div>
        </div>

        {/* 2. Theme Mode Selector (Day / Night Mode) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun size={16} weight="bold" className="text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isHinglish ? 'थीम मोड (Appearance)' : 'Appearance & Theme'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
              {selectedTheme === 'dark' ? (isHinglish ? 'नाइट मोड सक्रिय' : 'Night Active') : (isHinglish ? 'डे मोड सक्रिय' : 'Day Active')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`h-12 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                selectedTheme === 'light'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedTheme === 'light' ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  <Sun size={16} weight={selectedTheme === 'light' ? 'fill' : 'bold'} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs font-bold">{isHinglish ? 'डे मोड' : 'Day Mode'}</span>
                  <span className="text-[10px] opacity-75">{isHinglish ? 'लाइट (Light)' : 'Light theme'}</span>
                </div>
              </div>
              {selectedTheme === 'light' && <Check size={16} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`h-12 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                selectedTheme === 'dark'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black shadow-xs ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-medium hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedTheme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  <Moon size={16} weight={selectedTheme === 'dark' ? 'fill' : 'bold'} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs font-bold">{isHinglish ? 'नाइट मोड' : 'Night Mode'}</span>
                  <span className="text-[10px] opacity-75">{isHinglish ? 'डार्क (Dark)' : 'Dark theme'}</span>
                </div>
              </div>
              {selectedTheme === 'dark' && <Check size={16} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
            </button>
          </div>

          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
            {isHinglish
              ? '💡 आप इसे बाद में कभी भी "Profile" सेक्शन में जाकर भी बदल सकते हैं।'
              : '💡 You can also change this anytime later in the "Profile" section.'}
          </p>
        </div>

        {/* 3. Daily Habit Reminder Opt-in */}
        <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} weight="bold" className="text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isHinglish ? 'दैनिक रिमाइंडर (Reminders)' : 'Daily Habit Check-in'}
              </span>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={handleToggleReminder}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                remindersEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isHinglish
              ? 'सोने से 15 मिनट पहले आपको एक ऑफलाइन अलर्ट मिलेगा ताकि आपकी स्ट्रीक कभी न टूटे।'
              : 'Receive a subtle notification 15 minutes before bedtime so your streaks stay active.'}
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSaveAndStart}
          disabled={isSaving}
          className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          <span>{isSaving ? (isHinglish ? 'सहेजा जा रहा है...' : 'Saving...') : (isHinglish ? 'शुरू करें और ट्रैक करें' : 'Save & Start Tracking')}</span>
          <ArrowRight size={18} weight="bold" />
        </button>

      </div>
    </div>
  );
}

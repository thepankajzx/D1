import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import HabitIcon from '../components/HabitIcon';
import CompassVisualPreview from '../components/CompassVisualPreview';
import { getTodayBriefing, formatHabitTarget, getHabitMicroModeInfo } from '../lib/compassEngine';
import {
  ArrowLeft,
  Compass,
  Sparkle,
  CheckCircle,
  Lightning,
  WarningCircle,
  Quotes,
  PlusCircle,
  Heartbeat,
  ShieldCheck,
  Drop,
  Wind,
  Sun,
  Barbell,
  Clock,
  Lightbulb
} from '@phosphor-icons/react';

function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TodaysCompassPage() {
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const { habits = [], allSummaries = [], priorityModeEnabled = false } = useData();
  const { isHinglish } = useLanguage();

  const [selectedDate] = useState(() => getTodayDateStr());
  const [localEntries] = useState(() => {
    try {
      const cacheKey = `entries_${user?.uid}_${getTodayDateStr()}`;
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [quickWinCompleted, setQuickWinCompleted] = useState(() => {
    try {
      return localStorage.getItem(`quickwin_${user?.uid}_${getTodayDateStr()}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isSparkling, setIsSparkling] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Compute Today's Compass Briefing state dynamically
  const briefing = useMemo(() => {
    return getTodayBriefing({
      habits,
      allSummaries,
      todayEntries: localEntries,
      priorityModeEnabled,
      selectedDate
    });
  }, [habits, allSummaries, localEntries, priorityModeEnabled, selectedDate]);

  // Handle 1-Tap Quick Win (+2 Points)
  const handleCompleteQuickWin = () => {
    if (navigator.vibrate) navigator.vibrate(25);
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 1200);

    setQuickWinCompleted(true);
    localStorage.setItem(`quickwin_${user?.uid}_${selectedDate}`, 'true');

    setToastMessage(
      isHinglish
        ? '⚡ +2 रिज़िलिएंस पॉइंट्स मिले! आज की शुरुआत सकारात्मक हुई।'
        : '⚡ +2 Resilience Points Awarded! Positive start unlocked.'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getQuickWinIcon = (iconName) => {
    switch (iconName) {
      case 'Drop': return <Drop size={20} weight="fill" className="text-cyan-500" />;
      case 'Wind': return <Wind size={20} weight="fill" className="text-sky-500" />;
      case 'PersonSimpleStretch': return <Barbell size={20} weight="fill" className="text-emerald-500" />;
      case 'Sun': return <Sun size={20} weight="fill" className="text-amber-500" />;
      default: return <Sparkle size={20} weight="fill" className="text-amber-500" />;
    }
  };

  return (
    <div className="w-full pb-20 space-y-4 animate-in fade-in duration-200">
      
      {/* ── 1. Top Header Bar ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              navigate('/');
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
                <Compass size={20} weight="fill" className="text-amber-500 shrink-0" />
                <span>{isHinglish ? "टुडे कम्पास (Today's Compass)" : "Today's Compass"}</span>
              </h1>
              <span className="text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Daily Focus Briefing
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {isHinglish ? 'आज कहाँ फोकस करना है, क्या करने से स्कोर बूस्ट होगा' : 'Your high-impact daily briefing & resilience guide'}
            </p>
          </div>
        </div>

        {/* Date / Status Pill */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300 shadow-2xs shrink-0 text-xs font-black">
          <Sparkle size={14} weight="fill" className="text-amber-500" />
          <span>{selectedDate}</span>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-500/60 animate-in zoom-in-95 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 2. Visual Preview & Progress Meter ── */}
      <CompassVisualPreview
        visualState={briefing.visualState}
        todayStats={briefing.todayStats}
        isHinglish={isHinglish}
        isSparkling={isSparkling}
      />

      {/* ── 3. 🔱 Section 1: Aaj Ka Trishul - Top 3 Focus Habits (PURE INFO CARDS) ── */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lightning size={16} weight="fill" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {isHinglish ? 'आज का त्रिशूल (Top 3 Focus Habits)' : 'Aaj Ka Trishul (Top 3 Focus Habits)'}
              </h2>
              <p className="text-[10.5px] text-slate-400 font-medium">
                {isHinglish ? 'आज सबसे ज्यादा असर देने वाली 3 महत्वपूर्ण आदतें' : "The 3 highest-leverage habits for today's momentum"}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
            Daily Intelligence
          </span>
        </div>

        {briefing.focusTrio.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            {isHinglish ? 'कोई आदत दर्ज नहीं है। कृपया प्रोफ़ाइल में आदतें जोड़ें।' : 'No habits tracked. Add habits in Profile to view briefing.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {briefing.focusTrio.map((item, idx) => {
              const { habit, isDoneToday, focusReasonEn, focusReasonHi, reasonType, formattedTarget, microMode } = item;

              let badgeText = isHinglish ? '⚡ हाई इम्पैक्ट' : '⚡ High Impact';
              let badgeColor = 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';

              if (reasonType === 'resilience_guard') {
                badgeText = isHinglish ? '🛡️ रिज़िलिएंस गार्ड' : '🛡️ Resilience Guard';
                badgeColor = 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
              } else if (reasonType === 'formation') {
                badgeText = isHinglish ? '🌱 दूसरा दिन (Critical)' : '🌱 Day 2 Momentum';
                badgeColor = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
              } else if (isDoneToday) {
                badgeText = isHinglish ? '✓ संपन्न (Done)' : '✓ Completed';
                badgeColor = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
              }

              return (
                <div
                  key={habit.id}
                  className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                    isDoneToday
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                      : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Habit Icon + Name + Priority Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} size={18} color={habit.color} />
                        <div className="min-w-0">
                          <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                            Focus #{idx + 1}
                          </span>
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                            {habit.name}
                          </h3>
                        </div>
                      </div>

                      <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md border shrink-0 ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    {/* Clean Formatted Target Info */}
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Target Goal:</span>
                      <span className="text-slate-900 dark:text-white font-black">{formattedTarget}</span>
                    </div>

                    {/* Psychological / Tactical Focus Reason */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      "{isHinglish ? focusReasonHi : focusReasonEn}"
                    </div>

                    {/* Micro / Quick Feasibility Option (ONLY if feasible) */}
                    {microMode?.isFeasible ? (
                      <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-1.5 text-[10.5px]">
                        <Lightbulb size={14} weight="fill" className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-amber-900 dark:text-amber-300 font-medium leading-tight">
                          <span className="font-black">{isHinglish ? 'मिनी मोड: ' : 'Quick Action: '}</span>
                          {isHinglish ? microMode.actionHi : microMode.actionEn}
                        </div>
                      </div>
                    ) : microMode?.tacticalAdvisoryHi ? (
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40 flex items-start gap-1.5 text-[10.5px]">
                        <Clock size={14} weight="bold" className="text-slate-500 shrink-0 mt-0.5" />
                        <div className="text-slate-600 dark:text-slate-400 font-medium leading-tight">
                          {isHinglish ? microMode.tacticalAdvisoryHi : microMode.tacticalAdvisoryEn}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Status Indicator (Pure Info - No Mark Done Button) */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Daily Status:</span>
                    {isDoneToday ? (
                      <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={13} weight="fill" /> {isHinglish ? 'आज पूरा हो गया' : 'Completed Today'}
                      </span>
                    ) : (
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock size={13} weight="bold" /> {isHinglish ? 'आज लंबित (Pending)' : 'Active / Pending'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Section 2 & 3: Resilience Pulse & Drag Alert ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Section 2: 💓 Resilience Pulse */}
        <div className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Heartbeat size={18} weight="fill" className="text-rose-500" />
                <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'रिज़िलिएंस पल्स (Resilience Pulse)' : 'Resilience Pulse'}
                </h3>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                briefing.resiliencePulse.trend === 'rising'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : briefing.resiliencePulse.trend === 'stable'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 animate-pulse'
              }`}>
                {briefing.resiliencePulse.trend}
              </span>
            </div>

            {/* Health Bar Meter */}
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-700 dark:text-slate-300">
                  {isHinglish ? 'हालिया 3-दिवसीय बाउंस रेट' : 'Recent 3-Day Bounce Rate'}
                </span>
                <span className="text-amber-500 font-black">
                  {briefing.resiliencePulse.score}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    briefing.resiliencePulse.trend === 'rising'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : briefing.resiliencePulse.trend === 'stable'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-rose-500 to-amber-500'
                  }`}
                  style={{ width: `${briefing.resiliencePulse.score}%` }}
                />
              </div>
            </div>

            {/* Diagnostic Message */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-3">
              {isHinglish ? briefing.resiliencePulse.messageHi : briefing.resiliencePulse.messageEn}
            </p>
          </div>

          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
            <ShieldCheck size={14} weight="bold" className="text-emerald-500" />
            <span>{isHinglish ? 'जीरो-लॉस फिलॉसफी: कोई भी मिस प्रगति को नष्ट नहीं करती' : 'Zero loss philosophy: missed days never erase progress'}</span>
          </div>
        </div>

        {/* Section 3: ⚠️ Drag Alert */}
        <div className="bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <WarningCircle size={18} weight="fill" className="text-rose-500" />
                <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'ड्रैग अलर्ट (Score Drag)' : 'Score Drag Alert'}
                </h3>
              </div>
              {briefing.dragAlert && (
                <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                  -{briefing.dragAlert.impactDropPercent}% Drag
                </span>
              )}
            </div>

            {briefing.dragAlert ? (
              <div className="space-y-3 mt-3">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {isHinglish ? briefing.dragAlert.messageHi : briefing.dragAlert.messageEn}
                </p>

                {/* Habit Drag Info Card */}
                <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <HabitIcon name={briefing.dragAlert.habitIcon} size={16} boxed={true} color={briefing.dragAlert.habitColor} />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {briefing.dragAlert.habitName}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        Target: {briefing.dragAlert.formattedTarget}
                      </p>
                    </div>
                  </div>

                  {briefing.dragAlert.microMode?.isFeasible ? (
                    <div className="text-[10.5px] text-rose-800 dark:text-rose-300 font-medium bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-rose-200/50 dark:border-rose-900/40">
                      <span className="font-bold">{isHinglish ? 'सुझाव (Quick Win): ' : 'Suggested Action: '}</span>
                      {isHinglish ? briefing.dragAlert.microMode.actionHi : briefing.dragAlert.microMode.actionEn}
                    </div>
                  ) : (
                    <div className="text-[10.5px] text-slate-600 dark:text-slate-300 font-medium bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                      <span className="font-bold">{isHinglish ? 'सलाह: ' : 'Advisory: '}</span>
                      {isHinglish ? briefing.dragAlert.microMode?.tacticalAdvisoryHi : briefing.dragAlert.microMode?.tacticalAdvisoryEn}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                {isHinglish ? '✓ कोई भी आदत आपकी रिदम को नीचे नहीं खींच रही है। उत्कृष्ट संतुलन!' : '✓ No habits dragging your rhythm. Flawless balance!'}
              </div>
            )}
          </div>

          <div className="text-[10.5px] text-slate-400 font-medium">
            {isHinglish ? 'छोटी शुरुआत से इच्छाशक्ति पर बोझ नहीं पड़ता।' : 'Small adjustments prevent willpower fatigue.'}
          </div>
        </div>

      </div>

      {/* ── 5. Section 4 & 5: Guru's Whisper & Quick Win ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Section 4: 📜 Guru's Whisper (Japanese Scroll Wisdom) */}
        <div className="md:col-span-7 rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-amber-500/5 dark:from-amber-950/30 dark:to-slate-900/40 border border-amber-400/40 dark:border-amber-500/20 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/20">
              <Quotes size={18} weight="fill" className="text-amber-500" />
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider">
                Guru's Whisper • {briefing.guruMessage?.author}
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed font-serif italic mt-3">
              "{isHinglish ? briefing.guruMessage?.hi : briefing.guruMessage?.en}"
            </p>
          </div>

          <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-bold">
            {isHinglish ? ' - किन्त्सुगी व सुमी-ए चेतना सूत्र' : ' - Ancient Zen & Kaizen Philosophy'}
          </div>
        </div>

        {/* Section 5: ⚡ Quick Win - फटाफट boost */}
        <div className="md:col-span-5 bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkle size={18} weight="fill" className="text-cyan-500" />
                <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'फटाफट क्विक-विन (Quick Win)' : 'Micro Quick Win'}
                </h3>
              </div>
              <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded-full">
                +{briefing.quickWin?.points || 2} Points
              </span>
            </div>

            <div className="flex items-start gap-3 mt-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center shrink-0">
                {getQuickWinIcon(briefing.quickWin?.icon)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {isHinglish ? briefing.quickWin?.titleHindi : briefing.quickWin?.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5 leading-tight">
                  {isHinglish ? briefing.quickWin?.descHindi : briefing.quickWin?.desc}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={quickWinCompleted}
            onClick={handleCompleteQuickWin}
            className={`w-full py-2.5 px-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
              quickWinCompleted
                ? 'bg-cyan-700 text-white cursor-default'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white font-black'
            }`}
          >
            {quickWinCompleted ? (
              <>
                <CheckCircle size={15} weight="bold" />
                <span>{isHinglish ? 'क्विक-विन संपन्न (+2 Pts)' : 'Micro-Win Claimed (+2 Pts)'}</span>
              </>
            ) : (
              <>
                <PlusCircle size={15} weight="bold" />
                <span>{isHinglish ? 'अभी करें (+2 Points लें)' : 'Claim Micro-Win (+2 Pts)'}</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}

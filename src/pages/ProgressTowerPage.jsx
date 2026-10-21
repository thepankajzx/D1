import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProgressTowerVisual from '../components/ProgressTowerVisual';
import HabitIcon from '../components/HabitIcon';
import { calculateTowerProgress, getFloorInfoForActions } from '../lib/progressTowerEngine';
import {
  ArrowLeft,
  Buildings,
  Sparkle,
  ShieldCheck,
  ChartPieSlice,
  CalendarCheck,
  Flag,
  PlusCircle,
  Lightning,
  Sliders,
  ArrowsClockwise
} from '@phosphor-icons/react';

export default function ProgressTowerPage() {
  const navigate = useNavigate();
  const { allSummaries = [], dailySummaries = [], habits = [] } = useData();
  const { isHinglish } = useLanguage();

  const summaries = allSummaries.length > 0 ? allSummaries : dailySummaries;

  // Interactive local bonus actions state (allows user to manually test adding actions)
  const [bonusActions, setBonusActions] = useState(0);
  const [simulationActions, setSimulationActions] = useState(null);
  const [isPowering, setIsPowering] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Pure derivation of base cumulative Progress Tower state
  const baseTowerProgress = useMemo(() => {
    return calculateTowerProgress(summaries, habits);
  }, [summaries, habits]);

  // Combined Progress Tower state with live interactive bonus actions
  const towerProgress = useMemo(() => {
    const totalWithBonus = (simulationActions !== null ? simulationActions : baseTowerProgress.totalCompletedActions) + bonusActions;
    const floorInfo = getFloorInfoForActions(totalWithBonus);

    return {
      ...baseTowerProgress,
      ...floorInfo,
      totalCompletedActions: totalWithBonus
    };
  }, [baseTowerProgress, bonusActions, simulationActions]);

  // ── 🏗️ Interactive Action Booster (+1 or +5 Actions) ──
  const handleAddActionBoost = (amount = 1, habitName = 'Habit Action') => {
    if (navigator.vibrate) navigator.vibrate(25);
    setIsPowering(true);

    setBonusActions(prev => prev + amount);

    setToastMessage(isHinglish ? `⚡ +${amount} आदत पूर्ण! ${habitName} ने इमारत को बड़ा किया।` : `⚡ +${amount} Action Added! ${habitName} expanded the tower.`);

    setTimeout(() => {
      setIsPowering(false);
      setTimeout(() => setToastMessage(null), 2500);
    }, 1000);
  };

  const simulationPresets = [
    { label: 'Stage 1: Valley (5)', score: 5, floor: 1, emoji: '🌿' },
    { label: 'Stage 2: Falls (15)', score: 15, floor: 2, emoji: '🌊' },
    { label: 'Stage 3: Ridge (35)', score: 35, floor: 3, emoji: '⚡' },
    { label: 'Stage 4: Zen (65)', score: 65, floor: 4, emoji: '🌸' },
    { label: 'Stage 5: Peaks (120)', score: 120, floor: 5, emoji: '🏔️' },
    { label: 'Stage 8: Celestial (520)', score: 520, floor: 8, emoji: '🌌' }
  ];

  return (
    <div className="w-full pb-16 space-y-4 animate-in fade-in duration-200">
      
      {/* ── Top Header Bar with Back Button ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              navigate('/profile');
            }}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Back to Profile"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
                <span>{isHinglish ? 'हैबिट क्वेस्ट मैप (Adventure Quest Map)' : 'Adventure Quest Map'}</span>
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border border-amber-300/60 dark:border-amber-700/50 px-2 py-0.5 rounded-full shadow-2xs">
                Upcoming
              </span>
              <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full border ${towerProgress.currentFloorConfig?.badgeClass}`}>
                Floor {towerProgress.currentFloor} • {isHinglish ? towerProgress.currentFloorTitleHindi : towerProgress.currentFloorTitle}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {simulationActions !== null || bonusActions > 0
                ? (isHinglish ? '⚡ लाइव सिमुलेशन व बूस्टर मोड एक्टिव है' : '⚡ Live Booster & Preview Mode Active')
                : (isHinglish ? 'आपकी हर आदत से बनी स्थायी संचयी इमारत' : 'Powered by your consistent habits')}
            </p>
          </div>
        </div>

        {/* Total Progress Badge */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 shadow-2xs shrink-0">
          <Sparkle size={15} weight="fill" className="text-cyan-500" />
          <span className="text-xs font-black">
            {towerProgress.totalCompletedActions} {isHinglish ? 'आदतें' : 'Actions'}
          </span>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl border border-cyan-500/50 animate-in zoom-in-95 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 🌟 LIVE TOWER LEVEL PREVIEW & ACTIONS SIMULATOR ── */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-indigo-500/10 border border-cyan-500/30 dark:border-cyan-500/20 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders size={18} weight="bold" className="text-cyan-600 dark:text-cyan-400" />
            <div>
              <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                {isHinglish ? 'क्वेस्ट यात्रा सिम्युलेटर (Trail & Realm Preview)' : 'Quest Journey Simulator'}
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                {isHinglish ? 'मंजिलों को टेस्ट करने के लिए क्लिक करें या नीचे दिए आदतों के बटन से +1 Action जोड़ें' : 'Tap presets or use habit action buttons below to grow the tower in real time'}
              </p>
            </div>
          </div>

          {(simulationActions !== null || bonusActions > 0) && (
            <button
              type="button"
              onClick={() => {
                setSimulationActions(null);
                setBonusActions(0);
              }}
              className="px-2.5 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <ArrowsClockwise size={12} weight="bold" />
              <span>{isHinglish ? 'असली डेटा पर लौटें' : 'Reset to Real Data'}</span>
            </button>
          )}
        </div>

        {/* Preset Floor Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 pt-1">
          {simulationPresets.map((p) => {
            const isSelected = towerProgress.currentFloor === p.floor && simulationActions !== null;
            return (
              <button
                key={p.floor}
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setSimulationActions(p.score);
                }}
                className={`p-2 rounded-xl text-center border text-[11px] font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-700 shadow-sm scale-102'
                    : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                }`}
              >
                <div className="text-base">{p.emoji}</div>
                <div className="truncate mt-0.5">{p.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Summary Metrics Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Sparkle size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {towerProgress.totalCompletedActions}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
              {isHinglish ? 'कुल आदतें पूर्ण' : 'Total Actions'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Buildings size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              Floor {towerProgress.currentFloor}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
              {isHinglish ? 'वर्तमान मंजिल' : 'Current Floor'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <CalendarCheck size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {towerProgress.totalDaysActive}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
              {isHinglish ? 'सक्रिय दिन' : 'Active Days'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Flag size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {towerProgress.totalHabitsBuilt}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
              {isHinglish ? 'सक्रिय आदतें' : 'Habits Built'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Visual Tower + Live Action Boosters + Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Visual Tower Viewport */}
        <div className="lg:col-span-7 bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Buildings size={18} weight="fill" className="text-cyan-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isHinglish ? 'इमारत की मंजिलें (Architectural Tower)' : 'Skyscraper Architecture (F1 - F8)'}
              </h3>
            </div>
            <span className="text-[10.5px] font-bold text-slate-400">
              Tap floor to inspect
            </span>
          </div>

          {/* Visual Tower Component */}
          <ProgressTowerVisual
            towerProgress={towerProgress}
            isHinglish={isHinglish}
            isPowering={isPowering}
          />
        </div>

        {/* Right Column: Live Action Boosters & Habit Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. ⚡ Live Interactive Habit Action Booster Card (Add Score Button) */}
          <div className="bg-gradient-to-br from-cyan-50/80 via-sky-50/40 to-indigo-50/80 dark:from-cyan-950/30 dark:to-indigo-950/20 border border-cyan-200/80 dark:border-cyan-900/50 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-cyan-200/50 dark:border-cyan-800/50">
              <div className="flex items-center gap-2">
                <Lightning size={18} weight="fill" className="text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'आदत एक्शन जोड़ें (Add Action Score)' : 'Log Action & Grow Tower'}
                </h3>
              </div>
              <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-300">
                +1 Action / Tap
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {isHinglish ? 'किसी भी आदत पर क्लिक करें और तुरंत इमारत को नई मंजिल तक बढ़ते देखें:' : 'Tap any habit to immediately add completed action score:'}
            </p>

            {/* Quick Habit Boost Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(habits.length > 0 ? habits.slice(0, 4) : [
                { id: 'h1', name: 'Workout / Gym', icon: 'Running' },
                { id: 'h2', name: 'Reading', icon: 'BookOpen' },
                { id: 'h3', name: 'Meditation', icon: 'Sparkle' },
                { id: 'h4', name: 'Drink Water', icon: 'Drop' }
              ]).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleAddActionBoost(1, h.name)}
                  className="p-2.5 rounded-2xl border border-cyan-300/60 dark:border-cyan-800/60 bg-white dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-left flex items-center justify-between gap-2 transition-all cursor-pointer group shadow-2xs active:scale-95"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <HabitIcon name={h.icon || 'star'} habitId={h.id} boxed={true} size={15} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-cyan-600">
                      {h.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-cyan-600 bg-cyan-100 dark:bg-cyan-950 px-1.5 py-0.5 rounded-md shrink-0">
                    +1
                  </span>
                </button>
              ))}
            </div>

            {/* Mega Boost (+5 Actions) */}
            <button
              type="button"
              onClick={() => handleAddActionBoost(5, 'Mega Habit Streak')}
              className="w-full py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <PlusCircle size={15} weight="bold" />
              <span>{isHinglish ? 'मेगा एक्शन बूस्ट (+5 Actions)' : 'Mega Action Boost (+5 Actions)'}</span>
            </button>
          </div>

          {/* 2. Transparent Habit Breakdown List */}
          <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ChartPieSlice size={18} weight="fill" className="text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'आदतों का निर्माण योगदान' : 'Habit Contribution Breakdown'}
                </h3>
              </div>
              <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded-full">
                {towerProgress.totalCompletedActions} Total Actions
              </span>
            </div>

            {towerProgress.habitBreakdown.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                {isHinglish ? 'अभी तक कोई आदत दर्ज नहीं हुई है।' : 'No habit actions recorded yet.'}
              </div>
            ) : (
              <div className="space-y-2 pt-0.5">
                {towerProgress.habitBreakdown.map((item) => (
                  <div
                    key={item.habitId}
                    className="p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HabitIcon name={item.icon || 'star'} habitId={item.habitId} boxed={true} size={16} />
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                          {item.actions} {isHinglish ? 'बार पूरी की गई' : 'actions completed'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                        {item.actions} actions
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-bold">
                        {item.share}% share
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Psychological Reassurance / Zero-Penalty Card */}
          <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} weight="fill" className="text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                {isHinglish ? 'स्थायी संचयी प्रगति (Cumulative Progress)' : 'Cumulative Habit Construction'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              "{isHinglish
                ? 'एक बुरा दिन कभी भी आपकी बनाई गई इमारत को नहीं मिटा सकता। जो मंजिलें आपने बना ली हैं, वे हमेशा सुरक्षित रहेंगी।'
                : 'One bad day should never erase what you have already built. Your progress is cumulative. Nothing you built was lost.'}"
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import BonsaiTreeSVG from '../components/BonsaiTreeSVG';
import HabitIcon from '../components/HabitIcon';
import {
  TOWER_MILESTONES,
  getTowerStageInfo,
  calculateTowerState,
  powerTower,
  isTodayDate
} from '../lib/treeEngine';
import {
  ArrowLeft,
  Sparkle,
  CheckCircle,
  Lock,
  Trophy,
  Buildings,
  ShieldCheck,
  Info,
  ChartPieSlice,
  Lightning,
  Sliders,
  ArrowsClockwise,
  PlusCircle,
  Flame
} from '@phosphor-icons/react';

export default function BonsaiTreePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { allSummaries = [], dailySummaries = [], habits = [] } = useData();
  const { isHinglish } = useLanguage();

  const summaries = allSummaries.length > 0 ? allSummaries : dailySummaries;

  // Local state for energy/power action triggers & simulations
  const [energyBonusCount, setEnergyBonusCount] = useState(0);
  const [habitBonusPts, setHabitBonusPts] = useState(0);
  const [isPowering, setIsPowering] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Time-Travel / Simulation Mode (null = use real data)
  const [simulationScore, setSimulationScore] = useState(null);

  // Pure synchronous calculation
  const baseTowerData = useMemo(() => {
    return calculateTowerState(currentUser?.uid, summaries, habits);
  }, [currentUser?.uid, summaries, habits]);

  // Combined Tower Data with live interactive bonuses
  const towerData = useMemo(() => {
    const totalHabitScore = baseTowerData.habitGrowthScore + habitBonusPts;
    const totalEnergyBonus = baseTowerData.energyBonus + (energyBonusCount * 2);
    const totalGrowth = totalHabitScore + totalEnergyBonus;
    const stage = getTowerStageInfo(totalGrowth);

    return {
      ...baseTowerData,
      growthScore: totalGrowth,
      habitGrowthScore: totalHabitScore,
      energyBonus: totalEnergyBonus,
      currentStage: stage.stageKey,
      totalHabitsDone: baseTowerData.totalHabitsDone + (habitBonusPts > 0 ? Math.round(habitBonusPts / 3) : 0)
    };
  }, [baseTowerData, habitBonusPts, energyBonusCount]);

  // Active Score & Stage Details (Simulation vs Real)
  const activeGrowthScore = simulationScore !== null ? simulationScore : towerData.growthScore;

  const stageInfo = useMemo(() => {
    return getTowerStageInfo(activeGrowthScore);
  }, [activeGrowthScore]);

  const alreadyPoweredToday = useMemo(() => {
    return isTodayDate(towerData.lastPoweredAt);
  }, [towerData.lastPoweredAt]);

  // ── ⚡ Instant Energy Power-Up Action ──
  const handlePowerClick = () => {
    if (alreadyPoweredToday && energyBonusCount === 0) {
      setToastMessage(isHinglish ? 'आज की ऊर्जा दी जा चुकी है! कल फिर आइए ⚡' : 'Already powered today! Come back tomorrow ⚡');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (navigator.vibrate) navigator.vibrate(30);
    setIsPowering(true);

    const res = powerTower(currentUser?.uid, towerData);
    if (res.success) {
      setEnergyBonusCount(prev => prev + 1);
      if (simulationScore !== null) {
        setSimulationScore(prev => prev + 2);
      }
      setToastMessage(isHinglish ? '⚡ +2 कंस्ट्रक्शन पॉइंट्स! इमारत को ऊर्जा दी गई।' : '⚡ +2 Construction Points! Tower powered.');
    }

    setTimeout(() => {
      setIsPowering(false);
      setTimeout(() => setToastMessage(null), 3000);
    }, 1200);
  };

  // ── 🏗️ Interactive Habit Construction Booster ──
  const handleSimulateHabitBoost = (habitName = 'Habit') => {
    if (navigator.vibrate) navigator.vibrate(25);
    setIsPowering(true);

    const bonus = 5;
    setHabitBonusPts(prev => prev + bonus);
    if (simulationScore !== null) {
      setSimulationScore(prev => prev + bonus);
    }

    setToastMessage(isHinglish ? `🏢 +${bonus} अंक! ${habitName} ने एक नया फ्लोर तैयार किया।` : `🏢 +${bonus} Pts! ${habitName} constructed a floor.`);

    setTimeout(() => {
      setIsPowering(false);
      setTimeout(() => setToastMessage(null), 3000);
    }, 1200);
  };

  const simulationPresets = [
    { label: 'नींव (L1 Base)', score: 5, stage: 'foundation', emoji: '🏗️' },
    { label: 'मिड-राइज (3 Floors)', score: 25, stage: 'low_rise', emoji: '🏢' },
    { label: 'हाई-राइज (5 Floors)', score: 65, stage: 'high_rise', emoji: '🏙️' },
    { label: 'पेंटहाउस (7 Floors)', score: 160, stage: 'sky_bridge', emoji: '🌆' },
    { label: 'मेगा स्पायर (Apex 9F)', score: 320, stage: 'cyber_spire', emoji: '🗼' }
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
                <span>{isHinglish ? 'हैबिट स्काईस्क्रेपर (Habit Tower)' : 'Habit Skyscraper'}</span>
              </h1>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stageInfo.currentStage.badge}`}>
                {stageInfo.currentStage.label}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {simulationScore !== null 
                ? (isHinglish ? '🔍 टावर सिमुलेटर मोड (Preview Active)' : '🔍 Tower Simulator Active')
                : (isHinglish ? 'आपकी असली आदतों के डेटा से आसमान छूती गगनचुंबी इमारत' : 'Constructed in real-time by your logged habit accomplishments')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
          title={isHinglish ? 'इमारत कैसे बनती है?' : 'How does the tower grow?'}
        >
          <Info size={16} weight="bold" />
        </button>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl border border-cyan-500/50 animate-in zoom-in-95 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 🌟 STAGE TIME-TRAVEL SIMULATOR ── */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-indigo-500/10 border border-cyan-500/30 dark:border-cyan-500/20 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders size={18} weight="bold" className="text-cyan-600 dark:text-cyan-400" />
            <div>
              <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                {isHinglish ? 'कंस्ट्रक्शन सिम्युलेटर (Floor Height Preview)' : 'Tower Height Simulator'}
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                {isHinglish ? 'ग्राउंड लॉबी से लेकर 9वें मेगा स्पायर तक इमारत का बढ़ना टेस्ट करें' : 'Preview floors stacking from foundation to cloud penthouse'}
              </p>
            </div>
          </div>

          {simulationScore !== null && (
            <button
              type="button"
              onClick={() => setSimulationScore(null)}
              className="px-2.5 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <ArrowsClockwise size={12} weight="bold" />
              <span>{isHinglish ? 'लाइव असली डेटा पर लौटें' : 'Back to Real Data'}</span>
            </button>
          )}
        </div>

        {/* Preset Stage Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
          {simulationPresets.map((p) => {
            const isSelected = stageInfo.stageKey === p.stage && simulationScore !== null;
            return (
              <button
                key={p.stage}
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setSimulationScore(p.score);
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

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Sparkle size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {activeGrowthScore}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
              {isHinglish ? 'कंस्ट्रक्शन स्कोर' : 'Tower Points'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Buildings size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {stageInfo.currentStage.floorsCount} Floors
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
              {isHinglish ? 'निर्मित मंजिलें' : 'Constructed Floors'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Lightning size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {towerData.totalDaysActive}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
              {isHinglish ? 'सक्रिय दिन' : 'Active Days'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame size={16} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {towerData.powerStreak}d
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
              {isHinglish ? 'ऊर्जा स्ट्रीक' : 'Power Streak'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Interactive Skyscraper Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left 7 Columns on Desktop: Interactive Skyscraper Viewport */}
        <div className="lg:col-span-7 bg-white dark:bg-[#131722] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center relative overflow-hidden space-y-4">
          
          {/* Top Stage & Points Badges */}
          <div className="w-full flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Buildings size={15} weight="fill" className="text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {stageInfo.currentStage.label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/70 dark:border-cyan-900/50 shadow-2xs">
              <Sparkle size={14} weight="fill" className="text-cyan-500" />
              <span className="text-xs font-black text-cyan-700 dark:text-cyan-300">
                {activeGrowthScore} {isHinglish ? 'अंक' : 'Pts'}
              </span>
            </div>
          </div>

          {/* Procedural Modular Skyscraper Vector Component */}
          <div className="w-full flex justify-center py-2">
            <BonsaiTreeSVG
              stageKey={stageInfo.stageKey}
              growthScore={activeGrowthScore}
              isWatering={isPowering}
            />
          </div>

          {/* Quick Stage Philosophy Quote & Interactive Hint */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic max-w-md">
              "{stageInfo.currentStage.desc}"
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              🏢 {isHinglish ? 'किसी भी फ्लोर पर टैप करके उस रूम की डिटेल देखें!' : 'Tap any floor to inspect its habit room!'}
            </p>
          </div>
        </div>

        {/* Right 5 Columns on Desktop: Controls, Progress & Rewards */}
        <div className="lg:col-span-5 space-y-3.5">
          
          {/* 1. Daily Power Grid Bonus Card */}
          <div className="bg-gradient-to-br from-cyan-50/80 via-sky-50/40 to-indigo-50/80 dark:from-cyan-950/30 dark:to-indigo-950/20 border border-cyan-200/80 dark:border-cyan-900/50 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Lightning size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {isHinglish ? 'दैनिक ग्रिड पावर (Daily Energy)' : 'Daily Grid Power Bonus'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    {isHinglish ? 'रोज़ इमारत को ऊर्जा देने पर +2 बोनस पॉइंट्स' : 'Power daily for +2 extra construction points'}
                  </span>
                </div>
              </div>

              {/* Power Streak Badge */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-cyan-200/60 dark:border-slate-700 shadow-2xs shrink-0">
                <Flame size={13} weight="fill" className="text-amber-500" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {towerData.powerStreak}d {isHinglish ? 'स्ट्रीक' : 'Streak'}
                </span>
              </div>
            </div>

            {/* Instant Power Button */}
            <button
              type="button"
              onClick={handlePowerClick}
              className={`w-full py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                alreadyPoweredToday && energyBonusCount === 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-800/50'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white active:scale-98 shadow-md hover:shadow-lg'
              }`}
            >
              {alreadyPoweredToday && energyBonusCount === 0 ? (
                <>
                  <CheckCircle size={16} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                  <span>{isHinglish ? 'आज ऊर्जा दी जा चुकी है (Grid Powered ✓)' : 'Tower Powered for Today ✓'}</span>
                </>
              ) : (
                <>
                  <Lightning size={16} weight="fill" className={isPowering ? 'animate-bounce' : ''} />
                  <span>{isPowering ? (isHinglish ? 'ऊर्जा दी जा रही है...' : 'Powering...') : (isHinglish ? 'इमारत को ऊर्जा दें (+2 Pts)' : 'Power Habit Tower (+2 Pts)')}</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Interactive Habit Construction Booster */}
          <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <PlusCircle size={16} weight="fill" className="text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'आदत से फ्लोर निर्माण टेस्ट करें' : 'Simulate Habit Floor Construction'}
                </h3>
              </div>
              <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400">
                +5 Pts / Floor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {(habits.length > 0 ? habits.slice(0, 4) : [
                { id: 'h_running', name: 'Fitness / Gym Deck', icon: 'Running' },
                { id: 'h_reading', name: 'Wisdom Library', icon: 'BookOpen' },
                { id: 'h_meditation', name: 'Zen Sky Garden', icon: 'Sparkle' },
                { id: 'h_water', name: 'Water Hydro Base', icon: 'Drop' }
              ]).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleSimulateHabitBoost(h.name)}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-300 text-left flex items-center justify-between gap-2 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <HabitIcon name={h.icon || 'star'} habitId={h.id} boxed={true} size={15} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-cyan-600">
                      {h.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-cyan-600 shrink-0">+5 pts</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Next Floor Evolution Progress */}
          <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                {isHinglish ? 'अगली मंजिल विस्तार (Next Extension)' : 'Next Extension'}
              </span>
              <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                {stageInfo.progressPct}% {isHinglish ? 'पूर्ण' : 'Progress'}
              </span>
            </div>

            {stageInfo.nextStage ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {stageInfo.currentStage.label}
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">
                    ➔ {stageInfo.nextStage.label}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(6, stageInfo.progressPct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-0.5">
                  <span>{activeGrowthScore} pts</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                    {stageInfo.pointsToNext} pts {isHinglish ? 'और चाहिए' : 'remaining'}
                  </span>
                  <span>{stageInfo.nextStage.min} pts</span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-bold text-center">
                🗼 {isHinglish ? 'बधाई! आपकी इमारत सर्वोच्च मेगा एंपायर स्पायर स्तर पर है।' : 'Congratulations! Your tower has reached the supreme Mega Spire apex.'}
              </div>
            )}
          </div>

          {/* 4. Milestones & Skyscraper Unlocks */}
          <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Trophy size={16} weight="fill" className="text-amber-500" />
                <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'इमारत के मील के पत्थर (Tower Milestones)' : 'Tower Milestones & Upgrades'}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {TOWER_MILESTONES.filter(r => activeGrowthScore >= r.at).length}/{TOWER_MILESTONES.length} Unlocked
              </span>
            </div>

            <div className="space-y-2 pt-0.5">
              {TOWER_MILESTONES.map((r) => {
                const isUnlocked = activeGrowthScore >= r.at;
                return (
                  <div
                    key={r.key}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200/70 dark:border-cyan-900/40'
                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{r.emoji}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {r.title}
                        </h4>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                          {r.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isUnlocked ? (
                        <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded-full">
                          Constructed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          <Lock size={10} weight="bold" />
                          <span>{r.at} pts</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── Habit Contribution Breakdown ── */}
      {towerData.habitBreakdown && towerData.habitBreakdown.length > 0 && (
        <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ChartPieSlice size={18} weight="fill" className="text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isHinglish ? 'आदतों का निर्माण योगदान (Habit Construction Share)' : 'Habit Construction Contribution'}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {towerData.habitGrowthScore} pts from Habits
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {towerData.habitBreakdown.map((item) => (
              <div
                key={item.habitId}
                className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2.5 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <HabitIcon name={item.icon || 'star'} habitId={item.habitId} boxed={true} size={16} />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                      {item.completions} {isHinglish ? 'बार पूरी की' : 'times logged'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                    +{item.points} pts
                  </div>
                  <div className="text-[9.5px] text-slate-400 font-bold">
                    {item.share}% share
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Zero-Penalty Philosophy ── */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck size={18} weight="fill" className="text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {isHinglish ? 'हैबिट स्काईस्क्रेपर का नियम - स्थायी निर्माण' : 'Permanent Architectural Habit Growth'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40 space-y-1">
            <span className="text-xs font-black text-cyan-800 dark:text-cyan-300 block">
              🏗️ {isHinglish ? 'कोई पेनल्टी नहीं (Zero Penalty)' : 'Zero Penalties'}
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              {isHinglish 
                ? 'यदि आप कभी आदत मिस करते हैं, तो इमारत कभी नहीं गिरती। आपकी बनाई हर मंजिल हमेशा सुरक्षित रहती है।' 
                : 'Your building never crumbles when you miss a day. Every constructed floor stands permanently.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 space-y-1">
            <span className="text-xs font-black text-sky-800 dark:text-sky-300 block">
              ⚡ {isHinglish ? 'मॉड्यूलर फ्लोर अपग्रेड' : 'Modular Floor Stacking'}
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              {isHinglish
                ? 'जैसे-जैसे आप आदतें पूरी करते हैं, इमारत में नए फ्लोर, खिड़कियां और ग्लास स्काईब्रिज जुड़ते हैं।'
                : 'Each logged habit adds structural strength and constructs upper floors with glowing rooms.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
            <span className="text-xs font-black text-amber-800 dark:text-amber-300 block">
              🔋 {isHinglish ? 'दैनिक पावर ग्रिड' : 'Daily Power Grid'}
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              {isHinglish
                ? 'रोज़ एक बार आकर ग्रिड को पावर दें और +2 अतिरिक्त कंस्ट्रक्शन पॉइंट्स व स्ट्रीक पाएं।'
                : 'Visit daily to energize the grid, earning +2 bonus construction points and power streaks.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal Explainer ── */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Buildings size={20} weight="fill" className="text-cyan-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isHinglish ? 'हैबिट स्काईस्क्रेपर कैसे बढ़ता है?' : 'How Habit Skyscraper Grows'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>1. आदतें इमारत के ब्लॉक हैं:</strong> आप जितनी आदतें पूरी करते हैं, इमारत उतनी ही ऊंची होती जाती है और ऊपर नए फ्लोर जुड़ते हैं।
              </p>
              <p>
                <strong>2. 5 निर्माण अवस्थाएं (Floors):</strong>
                <br />
                • 0-14 pts: <strong>नींव व लॉबी (Foundation & Lobby)</strong>
                <br />
                • 15-49 pts: <strong>मिड-राइज टावर (3 Floors)</strong>
                <br />
                • 50-119 pts: <strong>गगनचुंबी इमारत (5 Floors + Elevator)</strong>
                <br />
                • 120-249 pts: <strong>क्लाउड पेंटहाउस (7 Floors + Sky Garden)</strong>
                <br />
                • 250+ pts: <strong>मेगा एंपायर स्पायर (9 Floors + Apex Laser Spire)</strong>
              </p>
              <p>
                <strong>3. कोई पेनल्टी नहीं:</strong> अगर कोई दिन छूट भी जाए तो इमारत कभी नहीं गिरती।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-black text-xs cursor-pointer hover:bg-cyan-700 transition-all"
            >
              {isHinglish ? 'समझ गया (Got It)' : 'Got It'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

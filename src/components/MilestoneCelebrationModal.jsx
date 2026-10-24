// src/components/MilestoneCelebrationModal.jsx
import confetti from 'canvas-confetti';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { evaluateUserBadges } from '../lib/badgeEngine';
import { DEDICATED_MILESTONES } from '../lib/milestoneDefinitions';
import { calculateStreakData } from '../lib/streakEngine';
import { getHeaderPillsConfig, saveHeaderPillsConfig } from './HeaderPillWidgets';
import BadgePersonaIcon from './BadgePersonaIcon';
import { 
  Sparkle, 
  Trophy, 
  Check, 
  Crown, 
  X, 
  Lightning, 
  Flame, 
  SlidersHorizontal,
  SpeakerHigh,
  SpeakerSimpleSlash
} from '@phosphor-icons/react';

const STORAGE_KEY = 'd1_celebrated_achievements_v2';

/**
 * Synthesizes a warm, resonant, triumphant 4-note ascending fanfare
 * via Web Audio API. Requires zero external audio files, works completely offline.
 */
export function playCelebrationFanfare() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Ascending arpeggio with celebratory bell chime harmonics
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.22, vol: 0.22 }, // C5
      { freq: 659.25, time: 0.12, dur: 0.24, vol: 0.26 }, // E5
      { freq: 783.99, time: 0.24, dur: 0.28, vol: 0.30 }, // G5
      { freq: 1046.50, time: 0.38, dur: 0.75, vol: 0.35 }  // C6 (high triumphant resolution)
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm, musical chime timbre
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  } catch (e) {
    // AudioContext might be blocked until user gesture on strict webviews
  }
}

/**
 * Fires dynamic multi-angle confetti burst
 */
export function fireCelebrationConfetti() {
  try {
    // Left cannon
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 65,
      origin: { x: 0.12, y: 0.65 },
      colors: ['#fbbf24', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'],
      zIndex: 100000
    });

    // Right cannon
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 65,
      origin: { x: 0.88, y: 0.65 },
      colors: ['#fbbf24', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'],
      zIndex: 100000
    });

    // Central star burst delayed
    setTimeout(() => {
      try {
        confetti({
          particleCount: 75,
          spread: 100,
          origin: { x: 0.5, y: 0.45 },
          colors: ['#ffd700', '#f43f5e', '#6366f1', '#14b8a6', '#f59e0b'],
          zIndex: 100000
        });
      } catch (e) {}
    }, 180);
  } catch (e) {}
}

export default function MilestoneCelebrationModal() {
  const { allSummaries = [], habits = [], streakTrackingEnabled } = useData();
  const { isHinglish } = useLanguage();

  const [queue, setQueue] = useState([]);
  const [currentCelebration, setCurrentCelebration] = useState(null);
  const [isEquipped, setIsEquipped] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Evaluate user badges & streaks
  const badgeState = useMemo(() => {
    return evaluateUserBadges(allSummaries, habits, streakTrackingEnabled);
  }, [allSummaries, habits, streakTrackingEnabled]);

  const streakData = useMemo(() => {
    if (!streakTrackingEnabled) return { currentStreak: 0, longestStreak: 0 };
    return calculateStreakData('all', allSummaries);
  }, [allSummaries, streakTrackingEnabled]);

  const bestStreak = Math.max(streakData.currentStreak || 0, streakData.longestStreak || 0);

  // Check for newly unlocked achievements
  useEffect(() => {
    if (!allSummaries || allSummaries.length === 0) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let seenKeys = new Set(stored ? JSON.parse(stored) : []);

      const newlyUnlocked = [];

      // 1. Evaluate Honors & Badges
      badgeState.unlockedBadges.forEach(badge => {
        const key = `badge:${badge.id}`;
        if (!seenKeys.has(key)) {
          newlyUnlocked.push({
            type: 'badge',
            key,
            id: badge.id,
            title: isHinglish ? badge.hindiTitle : badge.title,
            persona: badge.persona,
            iconName: badge.iconName,
            gradient: badge.gradient || 'from-amber-400 to-yellow-500',
            definition: isHinglish ? badge.hindiDefinition : badge.definition,
            criteria: isHinglish ? badge.hindiCriteria : badge.criteria,
            badgeRef: badge
          });
        }
      });

      // 2. Evaluate Streak Milestones (if enabled)
      if (streakTrackingEnabled && bestStreak >= 3) {
        DEDICATED_MILESTONES.forEach(ms => {
          if (bestStreak >= ms.target) {
            const key = `streak:${ms.target}`;
            if (!seenKeys.has(key)) {
              newlyUnlocked.push({
                type: 'streak',
                key,
                target: ms.target,
                title: isHinglish ? ms.hindiTitle : ms.title,
                desc: isHinglish ? ms.hindiDesc : ms.desc,
                motto: ms.motto,
                gradient: ms.color || 'from-amber-400 to-orange-500',
                IconComponent: ms.icon,
                milestoneRef: ms
              });
            }
          }
        });
      }

      // First run protection: if user already had 10 achievements before this feature launched,
      // mark them as recognized so they don't get spammed with 10 modals, but showcase the top 1!
      if (!stored && newlyUnlocked.length > 1) {
        const topOne = newlyUnlocked[newlyUnlocked.length - 1];
        newlyUnlocked.forEach(item => seenKeys.add(item.key));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(seenKeys)));
        setQueue([topOne]);
        return;
      }

      if (newlyUnlocked.length > 0) {
        setQueue(prev => {
          const existingKeys = new Set(prev.map(p => p.key));
          const additions = newlyUnlocked.filter(n => !existingKeys.has(n.key));
          return [...prev, ...additions];
        });
      }
    } catch (e) {
      console.warn('Milestone celebration detector error:', e);
    }
  }, [allSummaries, badgeState, bestStreak, streakTrackingEnabled, isHinglish]);

  // Activate celebration when queue has items
  useEffect(() => {
    if (queue.length > 0 && !currentCelebration) {
      const next = queue[0];
      setCurrentCelebration(next);
      setIsEquipped(false);

      // Play fanfare sound
      if (soundEnabled) {
        playCelebrationFanfare();
      }

      // Fire confetti burst
      fireCelebrationConfetti();

      // Haptic vibration
      if (navigator.vibrate) {
        try { navigator.vibrate([40, 80, 140]); } catch(e) {}
      }
    }
  }, [queue, currentCelebration, soundEnabled]);

  // Listen to hardware back button
  useEffect(() => {
    if (!currentCelebration) return;
    const handleHardwareBack = (e) => {
      e?.preventDefault?.();
      handleDismiss();
    };
    window.addEventListener('d1_hardware_back', handleHardwareBack);
    return () => window.removeEventListener('d1_hardware_back', handleHardwareBack);
  }, [currentCelebration]);

  const handleDismiss = () => {
    if (!currentCelebration) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const seenKeys = new Set(stored ? JSON.parse(stored) : []);
      seenKeys.add(currentCelebration.key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(seenKeys)));
    } catch (e) {}

    setQueue(prev => prev.filter(item => item.key !== currentCelebration.key));
    setCurrentCelebration(null);
  };

  const handleEquipBadge = () => {
    if (!currentCelebration || currentCelebration.type !== 'badge') return;
    if (navigator.vibrate) navigator.vibrate(25);

    try {
      const currentConfig = getHeaderPillsConfig();
      const updated = {
        ...currentConfig,
        enabled: true,
        selectedBadgeId: currentCelebration.id
      };
      if (updated.pill1 !== 'persona_badge' && updated.pill2 !== 'persona_badge' && updated.pill3 !== 'persona_badge') {
        updated.pill1 = 'persona_badge';
      }
      saveHeaderPillsConfig(updated);
      setIsEquipped(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  if (!currentCelebration) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Glow aura backdrop */}
      <div className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr ${currentCelebration.gradient} opacity-25 blur-3xl pointer-events-none animate-pulse`} />

      {/* Main Glassmorphic Card */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 via-[#0e131f] to-[#0a0d16] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Subtle decorative top bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentCelebration.gradient}`} />

        {/* Top Controls: Sound Toggle & Close */}
        <div className="flex items-center justify-between text-slate-400">
          <button
            type="button"
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Celebration Sound' : 'Enable Celebration Sound'}
          >
            {soundEnabled ? <SpeakerHigh size={16} weight="bold" /> : <SpeakerSimpleSlash size={16} weight="bold" />}
          </button>

          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/90 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
            <Sparkle size={12} weight="fill" className="text-amber-400 animate-spin" />
            {currentCelebration.type === 'streak' ? (isHinglish ? 'स्ट्रीक विजय' : 'STREAK TRIUMPH') : (isHinglish ? 'नया सम्मान' : 'HONOR UNLOCKED')}
          </span>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Hero Icon Centerpiece with Animated Radial Glow */}
        <div className="relative pt-2 pb-1 flex justify-center">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <div className={`absolute -inset-3 rounded-full bg-gradient-to-tr ${currentCelebration.gradient} opacity-30 blur-md animate-ping`} style={{ animationDuration: '3s' }} />
            
            {/* Icon Container */}
            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${currentCelebration.gradient} p-0.5 shadow-2xl flex items-center justify-center`}>
              <div className="w-full h-full rounded-[22px] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white">
                {currentCelebration.type === 'badge' ? (
                  <BadgePersonaIcon iconName={currentCelebration.iconName} size={42} weight="fill" />
                ) : (
                  currentCelebration.IconComponent && <currentCelebration.IconComponent size={42} weight="fill" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Title & Badge Details */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            {currentCelebration.title}
          </h2>
          {currentCelebration.type === 'badge' && (
            <p className="text-xs font-bold text-amber-400">
              {currentCelebration.persona} Persona
            </p>
          )}
        </div>

        {/* Definition / Motto Quote Box */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-1.5">
          <p className="text-xs sm:text-[13px] text-slate-200 font-semibold leading-relaxed italic text-center">
            "{currentCelebration.definition || currentCelebration.motto || currentCelebration.desc}"
          </p>

          {currentCelebration.criteria && (
            <div className="pt-2 border-t border-white/5 flex items-start gap-2 text-[11px] text-slate-400">
              <Check size={14} weight="bold" className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300 font-bold">{isHinglish ? 'अनलॉक नियम:' : 'Unlocked by:'}</strong>{' '}
                {currentCelebration.criteria}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          {currentCelebration.type === 'badge' && (
            <button
              type="button"
              onClick={handleEquipBadge}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isEquipped
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isEquipped ? (
                <>
                  <Check size={16} weight="bold" />
                  <span>{isHinglish ? 'हेडर पिल में सेट कर दिया गया!' : 'Equipped to Top Header Pill!'}</span>
                </>
              ) : (
                <>
                  <Sparkle size={16} weight="fill" />
                  <span>{isHinglish ? 'शीर्ष हेडर पिल में लगाएं' : 'Equip as Header Pill'}</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer border border-white/10"
          >
            {isHinglish ? 'शानदार! आगे बढ़ें' : 'Claim & Continue'}
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { isNightHabit } from '../lib/scoring';
import HabitIcon from './HabitIcon';
import Icon from './Icon';
import BinaryGoalExplainerModal from './BinaryGoalExplainerModal';
import { Clock, Target, TrendUp, TrendDown, Check, X, ShieldCheck, Info } from '@phosphor-icons/react';
import { formatTimeVal } from '../lib/timeFormat';
import { isDurationHabit, formatDuration, normalizeDurationToMinutes } from '../lib/formatDuration';

function minutesToTimeString(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '06:00';
  const totalMins = (Math.round(minutes) % 1440 + 1440) % 1440;
  const h = Math.floor(totalMins / 60);
  const m = Math.floor(totalMins % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 360;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function HabitTargetEditModal({
  isOpen,
  onClose,
  habit,
  onSaveComplete
}) {
  const { currentUser } = useAuth();
  const { habits, setHabits, refreshData, userDoc } = useData();

  const [saving, setSaving] = useState(false);
  const [target100, setTarget100] = useState(10);
  const [target0, setTarget0] = useState(0);
  const [targetTime100, setTargetTime100] = useState('06:00');
  const [targetTime0, setTargetTime0] = useState('08:00');
  const [durHours100, setDurHours100] = useState(8);
  const [durMins100, setDurMins100] = useState(30);
  const [durHours0, setDurHours0] = useState(5);
  const [durMins0, setDurMins0] = useState(0);
  const [direction, setDirection] = useState('higher_is_better');
  const [unit, setUnit] = useState('');
  const [showExplainer, setShowExplainer] = useState(false);

  const isTime = habit?.scoringType === 'time' || 
    habit?.unit === 'Time' || 
    habit?.unit === 'time' || 
    habit?.id === 'wakeup' || 
    habit?.id === 'sleep' || 
    (habit?.name || '').toLowerCase().includes('wake') || 
    ((habit?.name || '').toLowerCase().includes('sleep') && !(habit?.name || '').toLowerCase().includes('duration'));

  const isBinary = habit?.scoringType === 'binary' || habit?.scoringType === 'yn';
  const isDuration = !isTime && !isBinary && isDurationHabit(habit);

  useEffect(() => {
    if (!habit) return;

    const raw100 = habit.target100 !== undefined && habit.target100 !== null 
      ? habit.target100 
      : (habit.userTarget100 !== undefined ? habit.userTarget100 : (habit.target || 10));
    
    const raw0 = habit.target0 !== undefined && habit.target0 !== null 
      ? habit.target0 
      : (habit.userTarget0 !== undefined ? habit.userTarget0 : 0);

    if (isTime) {
      setTargetTime100(minutesToTimeString(Number(raw100)));
      setTargetTime0(minutesToTimeString(Number(raw0)));
    } else if (isDuration) {
      let totalMins100 = normalizeDurationToMinutes(raw100, habit.unit);
      if (totalMins100 >= 1440 && totalMins100 < 2880) totalMins100 -= 1440;
      setDurHours100(Math.floor(totalMins100 / 60));
      setDurMins100(totalMins100 % 60);

      let totalMins0 = normalizeDurationToMinutes(raw0, habit.unit);
      if (totalMins0 >= 1440 && totalMins0 < 2880) totalMins0 -= 1440;
      setDurHours0(Math.floor(totalMins0 / 60));
      setDurMins0(totalMins0 % 60);
    } else {
      setTarget100(raw100);
      setTarget0(raw0);
    }

    setDirection(habit.direction || 'higher_is_better');
    setUnit(habit.unit || habit.defaultUnit || '');
  }, [habit, isTime, isDuration]);

  if (!isOpen || !habit) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser?.uid) return;

    setSaving(true);
    try {
      let finalTarget100 = target100;
      let finalTarget0 = target0;

      if (isTime) {
        finalTarget100 = timeStringToMinutes(targetTime100);
        finalTarget0 = timeStringToMinutes(targetTime0);
        if (isNightHabit(habit)) {
          if (finalTarget100 < 12 * 60) finalTarget100 += 1440;
          if (finalTarget0 < 12 * 60) finalTarget0 += 1440;
        }
      } else if (isDuration) {
        finalTarget100 = (Math.max(0, parseInt(durHours100) || 0) * 60) + Math.max(0, parseInt(durMins100) || 0);
        finalTarget0 = (Math.max(0, parseInt(durHours0) || 0) * 60) + Math.max(0, parseInt(durMins0) || 0);
        if (finalTarget100 >= 1440 && finalTarget100 < 2880) finalTarget100 -= 1440;
        if (finalTarget0 >= 1440 && finalTarget0 < 2880) finalTarget0 -= 1440;
      } else if (!isBinary) {
        finalTarget100 = Number(target100);
        finalTarget0 = Number(target0);
      }

      const habitRef = doc(db, 'users', currentUser.uid, 'habits', habit.id);
      const updates = {
        target100: finalTarget100,
        target0: finalTarget0,
        userTarget100: finalTarget100,
        userTarget0: finalTarget0,
        direction,
        unit,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(habitRef, updates);

      // Update local state without touching past historical summaries
      if (setHabits) {
        setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, ...updates } : h));
      }
      if (refreshData) {
        await refreshData();
      }

      if (navigator.vibrate) navigator.vibrate(35);
      if (onSaveComplete) onSaveComplete({ ...habit, ...updates });
      onClose();
    } catch (err) {
      console.error('Error updating habit targets:', err);
      alert('Failed to save updated habit targets.');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = userDoc?.role === 'super_admin' || userDoc?.isSuperAdmin === true;

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} color={habit.color} size={22} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {habit.name}
                </h3>
                {isSuperAdmin && (
                  <span className="text-[9.5px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded-md">
                    Admin Access
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                Modify Scoring Targets (Active from today onwards)
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Safety Note */}
        <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex items-start gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
          <ShieldCheck size={16} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Zero History Alteration:</strong> Previous days' entries and scores remain completely intact. Your updated targets will apply starting today.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-3.5">
          {isBinary ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {direction === 'lower_is_better' ? '🛡️ Quit Habit (Avoid / Stop)' : '🟢 Build Habit (Positive Action)'}
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Binary (Yes/No) habits score <strong>100%</strong> on check-off and <strong>0%</strong> on miss. Numerical target customizations are designed for duration, time, and quantity habits.
              </p>
            </div>
          ) : isTime ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 100% Target Time */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    100% Ideal Goal
                  </label>
                  <input 
                    type="time" 
                    value={targetTime100}
                    onChange={e => setTargetTime100(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 font-black text-sm sm:text-base text-slate-900 dark:text-white rounded-xl border border-emerald-300/80 dark:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center shadow-2xs"
                  />
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                      {formatTimeVal(targetTime100)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium text-center">
                    Hit before this time
                  </p>
                </div>

                {/* 0% Limit Time */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    0% Floor Limit
                  </label>
                  <input 
                    type="time" 
                    value={targetTime0}
                    onChange={e => setTargetTime0(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 font-black text-sm sm:text-base text-slate-900 dark:text-white rounded-xl border border-rose-300/80 dark:border-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-center shadow-2xs"
                  />
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md">
                      {formatTimeVal(targetTime0)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium text-center">
                    Zero score after this
                  </p>
                </div>
              </div>
            </div>
          ) : isDuration ? (
            <div className="space-y-3">
              {/* Direction selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Goal Direction
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDirection('higher_is_better')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      direction === 'higher_is_better'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendUp size={13} weight="bold" /> Higher is Better
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('lower_is_better')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      direction === 'lower_is_better'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendDown size={13} weight="bold" /> Lower is Better
                  </button>
                </div>
              </div>

              {/* Targets grid for Duration */}
              <div className="grid grid-cols-2 gap-3">
                {/* 100% Target Value */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    100% Goal
                  </label>
                  <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700 shadow-2xs">
                    <input 
                      type="number" 
                      min="0"
                      max="24"
                      value={durHours100 === 0 && durMins100 === 0 ? '' : durHours100}
                      placeholder="0"
                      onChange={e => setDurHours100(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-10 font-black text-sm text-slate-900 dark:text-white focus:outline-none text-center bg-transparent"
                    />
                    <span className="text-[10px] font-bold text-slate-400">hr</span>
                    <span className="text-slate-300 dark:text-slate-600 font-bold">:</span>
                    <input 
                      type="number" 
                      min="0"
                      max="59"
                      value={durHours100 === 0 && durMins100 === 0 ? '' : durMins100}
                      placeholder="0"
                      onChange={e => setDurMins100(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-10 font-black text-sm text-slate-900 dark:text-white focus:outline-none text-center bg-transparent"
                    />
                    <span className="text-[10px] font-bold text-slate-400">min</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md truncate max-w-full">
                      {formatDuration((durHours100 * 60) + durMins100, 'long')}
                    </span>
                  </div>
                </div>

                {/* 0% Base Floor Value */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    0% Base Floor
                  </label>
                  <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1.5 rounded-xl border border-rose-300/80 dark:border-rose-700 shadow-2xs">
                    <input 
                      type="number" 
                      min="0"
                      max="24"
                      value={durHours0 === 0 && durMins0 === 0 ? '' : durHours0}
                      placeholder="0"
                      onChange={e => setDurHours0(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-10 font-black text-sm text-slate-900 dark:text-white focus:outline-none text-center bg-transparent"
                    />
                    <span className="text-[10px] font-bold text-slate-400">hr</span>
                    <span className="text-slate-300 dark:text-slate-600 font-bold">:</span>
                    <input 
                      type="number" 
                      min="0"
                      max="59"
                      value={durHours0 === 0 && durMins0 === 0 ? '' : durMins0}
                      placeholder="0"
                      onChange={e => setDurMins0(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-10 font-black text-sm text-slate-900 dark:text-white focus:outline-none text-center bg-transparent"
                    />
                    <span className="text-[10px] font-bold text-slate-400">min</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md truncate max-w-full">
                      {formatDuration((durHours0 * 60) + durMins0, 'long')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Direction selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Goal Direction
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDirection('higher_is_better')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      direction === 'higher_is_better'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendUp size={13} weight="bold" /> Higher is Better
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('lower_is_better')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      direction === 'lower_is_better'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendDown size={13} weight="bold" /> Lower is Better
                  </button>
                </div>
              </div>

              {/* Targets grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* 100% Target Value */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    100% Goal
                  </label>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700 shadow-2xs">
                    <input 
                      type="number" 
                      step="any"
                      value={target100}
                      onChange={e => setTarget100(e.target.value)}
                      className="w-full font-black text-sm sm:text-base text-slate-900 dark:text-white focus:outline-none text-center bg-transparent"
                    />
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">{unit}</span>
                  </div>
                </div>

                {/* 0% Base Floor Value */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    0% Base Floor
                  </label>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-rose-300/80 dark:border-rose-700 shadow-2xs">
                    <input 
                      type="number" 
                      step="any"
                      value={target0}
                      onChange={e => setTarget0(e.target.value)}
                      className="w-full font-black text-sm sm:text-base text-slate-900 dark:text-white focus:outline-none text-center bg-transparent"
                    />
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">{unit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition-all cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={14} weight="bold" />
                  <span>Save Updated Targets</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Binary Goal Explainer Visual Modal */}
      <BinaryGoalExplainerModal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
      />
    </div>
  );
}

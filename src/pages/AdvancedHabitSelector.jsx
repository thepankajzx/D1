import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Target, X, ChartBar, Lightbulb, Lightning, Sparkle, Palette, TrendUp, TrendDown, Info } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { calculateScore } from '../lib/scoring';
import Icon from '../components/Icon';
import PriorityIcon from '../components/PriorityIcon';
import HabitIcon from '../components/HabitIcon';
import { getCanonicalHabitIconConfig, canonicalizeHabit } from '../lib/habitColors';
import ScoringModal from '../components/ScoringModal';
import BinaryGoalExplainerModal from '../components/BinaryGoalExplainerModal';
import ProModal from '../components/ProModal';
import HabitIconColorPickerModal from '../components/HabitIconColorPickerModal';
import ColorfulPaletteButton from '../components/ColorfulPaletteButton';
import { formatDuration, normalizeDurationToMinutes, isDurationHabit } from '../lib/formatDuration';
import { formatTimeVal } from '../lib/timeFormat';
import './AdvancedHabitSelector.css';

const DualRangeSlider = ({ target0, target100, onChange, direction, unit, isTime, habitId, habitName }) => {
  let resolvedUnit = (unit && unit !== 'Time' && unit !== 'time') ? unit : '';
  if (!resolvedUnit && (habitId || habitName)) {
    const seed = HABITS_SEED_DATA.find(s => s.id === habitId || s.name === habitName);
    if (seed?.defaultUnit && seed.defaultUnit !== 'time') {
      resolvedUnit = seed.defaultUnit;
    }
  }
  if (!resolvedUnit && habitName) {
    const lower = habitName.toLowerCase();
    if (lower.includes('water')) resolvedUnit = 'Liters';
    else if (lower.includes('calorie')) resolvedUnit = 'kcal';
    else if (lower.includes('protein')) resolvedUnit = 'grams';
    else if (lower.includes('read') || lower.includes('sleep') || lower.includes('walk') || lower.includes('workout') || lower.includes('meditat') || lower.includes('deep work') || lower.includes('screen')) resolvedUnit = 'minutes';
  }

  const isDecimalUnit = resolvedUnit === 'Liters' || resolvedUnit === 'L' || resolvedUnit === 'liters' || resolvedUnit === 'km' || resolvedUnit === 'miles';
  const localMax = isTime ? 1440 : (isDecimalUnit ? 20 : (Math.max(100, (target0 || 0) * 1.5, (target100 || 10) * 1.5)));
  const step = isTime ? 5 : (isDecimalUnit ? 0.1 : 1);

  const [glowTarget, setGlowTarget] = useState(null);
  const [activeThumb, setActiveThumb] = useState('target100');
  const prevValRef = useRef({ target0, target100 });
  const target0Ref = useRef(target0);
  const target100Ref = useRef(target100);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    target0Ref.current = target0;
  }, [target0]);

  useEffect(() => {
    target100Ref.current = target100;
  }, [target100]);

  const stopHolding = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startHolding = (field, delta) => {
    stopHolding();
    const performStep = () => {
      const current = field === 'target0' ? target0Ref.current : target100Ref.current;
      let next = current + delta;
      if (isDecimalUnit) {
        next = Math.round(next * 10) / 10;
      } else {
        next = Math.round(next);
      }
      next = Math.max(0, Math.min(localMax, next));
      if (field === 'target0') target0Ref.current = next;
      else target100Ref.current = next;
      handleSliderChange(field, next);
    };

    performStep();

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(performStep, 150);
    }, 500);
  };

  const handleSliderChange = (field, value) => {
    setActiveThumb(field);
    const prev = field === 'target0' ? prevValRef.current.target0 : prevValRef.current.target100;
    prevValRef.current[field] = value;
    onChange(field, value);

    if (navigator.vibrate) {
      const prevPct = (prev / localMax) * 100;
      const newPct = (value / localMax) * 100;
      const threshold = localMax > 500 ? (localMax / 80) : 1;
      
      if (Math.floor(newPct / 2.5) !== Math.floor(prevPct / 2.5) || Math.abs(value - prev) >= threshold) {
        navigator.vibrate(25);
      }
      if (value >= localMax) {
        navigator.vibrate(50);
        setGlowTarget(field);
        setTimeout(() => setGlowTarget(null), 1000);
      }
    }
  };

  const p0 = Math.min(100, Math.max(0, (target0 / localMax) * 100));
  const p100 = Math.min(100, Math.max(0, (target100 / localMax) * 100));
  
  const minP = Math.min(p0, p100);
  const maxP = Math.max(p0, p100);

  const trackColor = 'var(--color-surface-container-high)';
  const greenHex = 'rgba(34, 197, 94, 0.3)';
  const redHex = 'rgba(239, 68, 68, 0.3)';
  
  let bg = '';
  if (direction === 'higher_is_better' || direction === 'higher') {
    bg = `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${minP}%, ${redHex} ${minP}%, ${greenHex} ${maxP}%, ${trackColor} ${maxP}%, ${trackColor} 100%)`;
  } else {
    bg = `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${minP}%, ${greenHex} ${minP}%, ${redHex} ${maxP}%, ${trackColor} ${maxP}%, ${trackColor} 100%)`;
  }

  const showHM = !isTime && (resolvedUnit === 'minutes' || resolvedUnit === 'hours' || resolvedUnit === 'hrs' || resolvedUnit === 'mins');

  const formatTimeStr = (mins) => {
    if (typeof mins !== 'number' || isNaN(mins)) return '00:00';
    let h = Math.floor(mins / 60);
    let m = Math.floor(mins % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const parseTimeStr = (val) => {
    if (typeof val === 'string' && val.includes(':')) {
      const [h, m] = val.split(':').map(Number);
      return h * 60 + m;
    }
    return parseFloat(val) || 0;
  };
  const getH = (val) => Math.floor(val / 60) || 0;
  const getM = (val) => Math.floor(val % 60) || 0;

  const updateHM = (field, currentTotal, type, newValue) => {
      const val = parseInt(newValue) || 0;
      const h = type === 'h' ? val : getH(currentTotal);
      const m = type === 'm' ? val : getM(currentTotal);
      onChange(field, h * 60 + m);
  };

  const InputCard = ({ field, label, value, isRed }) => {
    const badgeBg = isRed ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600';
    const borderColor = glowTarget === field ? 'border-primary shadow-lg shadow-primary/20' : 'border-outline-variant/40';

    return (
      <div className="flex flex-col items-center w-full min-w-0">
        <div className={`w-full bg-surface-container-lowest rounded-2xl border ${borderColor} p-3 sm:p-4 flex flex-col items-center justify-between min-h-[110px] sm:min-h-[125px] shadow-sm transition-all duration-300 relative overflow-hidden`}>
          
          <div className="flex items-center justify-center w-full mb-1">
            <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full ${badgeBg}`}>
              {label}
            </span>
          </div>

          {isTime ? (
            <div className="flex flex-col items-center justify-center my-auto w-full py-1">
              <input 
                type="time" 
                aria-label={`${label} target time`}
                className="bg-surface-container-high/50 hover:bg-surface-container-high px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black text-sm sm:text-lg text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors cursor-pointer text-center" 
                value={formatTimeStr(value)} 
                onChange={e => onChange(field, parseTimeStr(e.target.value))} 
              />
              <span className="text-[10px] font-bold text-primary mt-1">
                {formatTimeVal(value)}
              </span>
            </div>
          ) : showHM ? (
            <div className="flex flex-col items-center justify-center my-auto w-full">
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <div className="flex items-center bg-surface-container-high/40 rounded-xl px-1.5 sm:px-2 py-0.5 sm:py-1 border border-outline-variant/30">
                  <input 
                    type="number"
                    aria-label={`${label} hours`}
                    min={0}
                    max={24}
                    className="w-8 sm:w-10 text-center font-black text-sm sm:text-lg text-on-surface bg-transparent focus:outline-none tabular-nums"
                    value={getH(value) || ''}
                    placeholder="0"
                    onChange={e => updateHM(field, value, 'h', e.target.value)}
                  />
                  <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant ml-0.5">h</span>
                </div>
                <span className="font-black text-on-surface-variant text-xs">:</span>
                <div className="flex items-center bg-surface-container-high/40 rounded-xl px-1.5 sm:px-2 py-0.5 sm:py-1 border border-outline-variant/30">
                  <input 
                    type="number" 
                    aria-label={`${label} minutes`}
                    min={0}
                    max={59}
                    step={5}
                    className="w-8 sm:w-10 text-center font-black text-sm sm:text-lg text-on-surface bg-transparent focus:outline-none tabular-nums"
                    value={getM(value) || ''}
                    placeholder="0"
                    onChange={e => updateHM(field, value, 'm', e.target.value)}
                  />
                  <span className="text-[10px] sm:text-xs font-bold text-on-surface-variant ml-0.5">m</span>
                </div>
              </div>
              <div className="text-center text-[10px] font-bold text-primary mt-1">
                {(() => {
                  const h = Math.floor(value / 60);
                  const m = Math.round(value % 60);
                  if (h > 0 && m > 0) return `${h} hr ${m} min (${value} mins)`;
                  if (h > 0) return `${h} ${h === 1 ? 'hour' : 'hours'} (${value} mins)`;
                  return `${m} mins`;
                })()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto w-full">
              <div className="flex items-center justify-center w-full">
                <input 
                  type="number" 
                  aria-label={`${label} value`}
                  min={0}
                  step={isDecimalUnit ? "0.1" : "1"}
                  className="bg-transparent w-full text-center font-black text-base sm:text-xl text-slate-900 dark:text-white focus:outline-none tabular-nums" 
                  value={value !== undefined && value !== null ? value : ''} 
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') {
                      onChange(field, 0);
                      return;
                    }
                    const parsed = parseFloat(raw);
                    onChange(field, isNaN(parsed) ? 0 : (isDecimalUnit ? Math.round(parsed * 10) / 10 : Math.round(parsed)));
                  }} 
                />
                {resolvedUnit && (
                  <span className="text-xs sm:text-sm font-bold text-primary ml-1 shrink-0">
                    {resolvedUnit}
                  </span>
                )}
              </div>
              {resolvedUnit && (
                <div className="text-center text-[11px] font-bold text-primary mt-1.5 bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 whitespace-nowrap">
                  {value} {resolvedUnit}
                </div>
              )}
            </div>
          )}

        </div>
        <div className="text-[11px] text-on-surface-variant mt-1.5 font-medium text-center">
          {isTime ? (isRed ? 'Late Limit (0%)' : 'Ideal Time (100%)') : (isRed ? 'Start Floor (0%)' : 'Target Goal (100%)')}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-3 mb-2">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 mb-3.5">
        <InputCard field="target0" label="0% Score" value={target0} isRed={true} />
        <InputCard field="target100" label="100% Score" value={target100} isRed={false} />
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 w-full mt-2">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            startHolding(activeThumb, -step);
          }}
          onPointerUp={stopHolding}
          onPointerLeave={stopHolding}
          onPointerCancel={stopHolding}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container-high hover:bg-surface-variant active:scale-90 flex items-center justify-center text-on-surface font-bold transition-all border border-outline-variant/40 select-none touch-none shrink-0 shadow-xs cursor-pointer"
          title="Decrease Target"
          aria-label="Decrease Target"
        >
          <Icon name="remove" className="text-[16px] sm:text-[18px]" />
        </button>

        <div className="dual-slider-container flex-1">
          <div className="dual-slider-track" style={{ background: bg }} />
          <input 
            type="range"
            min={0} max={localMax} step={step}
            value={target0}
            onPointerDown={() => setActiveThumb('target0')}
            onChange={e => handleSliderChange('target0', Number(e.target.value))}
            className="dual-slider-input"
            style={{ '--thumb-color': '#ef4444', zIndex: target0 > target100 ? 4 : 3 }}
          />
          <input 
            type="range"
            min={0} max={localMax} step={step}
            value={target100}
            onPointerDown={() => setActiveThumb('target100')}
            onChange={e => handleSliderChange('target100', Number(e.target.value))}
            className="dual-slider-input"
            style={{ '--thumb-color': '#22c55e', zIndex: target100 > target0 ? 4 : 3 }}
          />
        </div>

        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            startHolding(activeThumb, step);
          }}
          onPointerUp={stopHolding}
          onPointerLeave={stopHolding}
          onPointerCancel={stopHolding}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container-high hover:bg-surface-variant active:scale-90 flex items-center justify-center text-on-surface font-bold transition-all border border-outline-variant/40 select-none touch-none shrink-0 shadow-xs cursor-pointer"
          title="Increase Target"
          aria-label="Increase Target"
        >
          <Icon name="add" className="text-[16px] sm:text-[18px]" />
        </button>
      </div>

      <div className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2 font-medium">
        Drag red/green knobs or tap + / - to adjust {isTime ? 'in minutes' : (resolvedUnit || 'value')}
      </div>
    </div>
  );
};

const MAX_FREE_HABITS = 8;
const MAX_CUSTOM_HABITS = 6;

export default function AdvancedHabitSelector() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { habits: existingHabits = [], refreshData, userDoc } = useData();
  const isSuperAdmin = import.meta.env.DEV || userDoc?.role === 'super_admin' || userDoc?.isSuperAdmin === true;
  const isPro = userDoc?.isPro || userDoc?.tier === 'pro' || isSuperAdmin;

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('selection');
  const [prioritiesLocked, setPrioritiesLocked] = useState(false);
  const [priorityLockDays, setPriorityLockDays] = useState(0);
  const [lockDaysRemaining, setLockDaysRemaining] = useState(0);
  const [expandedSelectedHabits, setExpandedSelectedHabits] = useState([]);
  const [priorityRanks, setPriorityRanks] = useState({});
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [draftHabit, setDraftHabit] = useState(null);
  
  const habitLibrary = HABITS_SEED_DATA;
  
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [activeCategories, setActiveCategories] = useState(['Selected']);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallSource, setPaywallSource] = useState("");
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [scoringModal, setScoringModal] = useState(null);
  const [showPriorityInfo, setShowPriorityInfo] = useState(false);
  const [showPriorityLockModal, setShowPriorityLockModal] = useState(false);
  const formatReviewTime = (mins) => formatTimeVal(mins);
  const [showBinaryExplainer, setShowBinaryExplainer] = useState(false);

  // Modern In-App Notice Modal
  const [noticeModal, setNoticeModal] = useState(null);
  const showNotice = (title, message, options = {}) => {
    setNoticeModal({
      title,
      subtitle: options.subtitle || 'D1 Habit Tracker',
      message,
      actionText: options.actionText,
      onAction: options.onAction,
      closeText: options.closeText || 'OK'
    });
  };

  // Custom Habit Builder State
  const [editingCustomHabitId, setEditingCustomHabitId] = useState(null);
  const [cbName, setCbName] = useState('');
  const [cbType, setCbType] = useState('yn');
  const [cbUnit, setCbUnit] = useState('L');
  const [cbUnitCustom, setCbUnitCustom] = useState('');
  const [cbDirection, setCbDirection] = useState('higher');
  const [cbFloor, setCbFloor] = useState(0);
  const [cbTarget, setCbTarget] = useState(10);
  const [cbTolerance, setCbTolerance] = useState(false);
  const [cbIcon, setCbIcon] = useState('rocket_launch');
  const [cbColor, setCbColor] = useState('#10b981');
  const [showIconPickerModal, setShowIconPickerModal] = useState(false);
  const [pickerHabit, setPickerHabit] = useState(null);
  const [customizedHabits, setCustomizedHabits] = useState({});
  
  const [enabledFeatures, setEnabledFeatures] = useState({
    insights: true,
    betterReport: true,
    deepDives: true
  });

  useEffect(() => {
    if (userDoc?.enabledFeatures) {
      setEnabledFeatures(prev => ({ ...prev, ...userDoc.enabledFeatures }));
    }
  }, [userDoc]);

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('definite_scoring_guide_intro_seen');
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setScoringModal('all');
          localStorage.setItem('definite_scoring_guide_intro_seen', 'true');
        }, 450);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, []);

  const isFirstTimeSetup = existingHabits.length === 0;

  const hasLockedPriorities = useMemo(() => {
    const prioritySetHabit = existingHabits.find(h => h.priorityRank && h.prioritySetAt) || existingHabits.find(h => h.priorityRank);
    if (!prioritySetHabit) return false;
    const setDate = new Date(prioritySetHabit.prioritySetAt || prioritySetHabit.createdAt || Date.now());
    const diffDays = Math.ceil((new Date() - setDate) / (1000 * 60 * 60 * 24));
    return (30 - diffDays) > 0;
  }, [existingHabits]);

  const showPrioritySection = isFirstTimeSetup && !hasLockedPriorities;
  const showFeatureToggles = isFirstTimeSetup;

  const categories = ['Selected', 'All', ...new Set(habitLibrary.map(h => h.category)), 'Custom'];
  const displayedHabits = activeCategories.includes('Selected')
    ? [
        ...habitLibrary.filter(h => selectedHabits.some(sh => sh.id === h.id)),
        ...customHabits
      ]
    : activeCategories.includes('All') 
      ? habitLibrary 
      : habitLibrary.filter(h => activeCategories.includes(h.category));

  const openScoringModalForHabit = (habit) => {
    let type = 'build';
    if (habit.scoringType === 'binary' || habit.scoringType === 'yn') type = 'track';
    else if (habit.scoringType === 'time') type = 'sustain';
    else if (habit.scoringType === 'optimal_range' || habit.direction === 'optimal_range') type = 'balance';
    else if (habit.direction === 'lower_is_better' || habit.scoringType === 'lower') type = 'break';
    else if (habit.direction === 'higher_is_better' || habit.scoringType === 'duration' || habit.scoringType === 'number' || habit.scoringType === 'numeric') type = 'build';
    setScoringModal(type);
  };

  const handleBack = () => {
    if (viewMode === 'summary') {
      setViewMode('selection');
    } else {
      if (selectedHabits.length > 0 || customHabits.length > 0) {
        if (window.confirm("You have selected habits that haven't been saved yet. If you leave now, they will be lost. Are you sure you want to go back?")) {
          navigate(-1);
        }
      } else {
        navigate(-1);
      }
    }
  };

  const handleSaveFlow = async () => {
    if (viewMode === 'selection') {
      if (activeCategories.includes('Custom') && cbName.trim() !== '') {
        showNotice("Unsaved Custom Habit", "You have an unsaved custom habit in progress. Please click 'Add to Plan' first, or clear the Habit Name field.");
        return;
      }
      if (selectedHabits.length + customHabits.length === 0) {
        showNotice("Selection Required", "Please select at least 1 habit to save your 30-day routine.");
        return;
      }
      setViewMode('summary');
      window.scrollTo(0, 0);
    } else if (viewMode === 'summary') {
      const isSuperAdmin = import.meta.env.DEV || userDoc?.role === 'super_admin' || userDoc?.isSuperAdmin === true;
      if (isSuperAdmin) {
        executeSave();
      } else {
        setShowConfirmSaveModal(true);
      }
    }
  };

  const executeSave = async () => {
    try {
      const allToSave = [...selectedHabits, ...customHabits];
      
      // Navigate to dashboard immediately without any lag
      navigate('/');

      // Perform single atomic batch write to Firebase
      if (currentUser?.uid) {
        const batch = writeBatch(db);

        for (const habit of allToSave) {
          const userHabitRef = doc(db, 'users', currentUser.uid, 'habits', habit.id);
          const iconConfig = getCanonicalHabitIconConfig({
            id: habit.id,
            icon: customizedHabits[habit.id]?.icon || habit.icon,
            color: customizedHabits[habit.id]?.color || habit.color,
            iconBackgroundColor: customizedHabits[habit.id]?.iconBackgroundColor || habit.iconBackgroundColor,
            iconStyle: customizedHabits[habit.id]?.iconStyle || habit.iconStyle
          });

          const habitData = {
            habitLibraryId: habit.isCustom ? 'custom' : habit.id,
            name: habit.name || 'Unnamed',
            category: habit.category || 'Other',
            icon: iconConfig.icon,
            iconId: iconConfig.iconId,
            color: iconConfig.color,
            iconColor: iconConfig.iconColor,
            iconBackgroundColor: iconConfig.iconBackgroundColor,
            iconStyle: iconConfig.iconStyle,
            scoringType: habit.scoringType || 'number',
            direction: habit.direction || 'higher_is_better',
            unit: habit.unit || '',
            target100: habit.userTarget100 !== undefined ? habit.userTarget100 : null,
            target0: habit.userTarget0 !== undefined ? habit.userTarget0 : null,
            tolerance: habit.userTolerance !== undefined ? habit.userTolerance : 0,
            isActive: true,
            priority: 'medium',
            createdAt: habit.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: !!habit.isCustom,
            priorityRank: priorityRanks[habit.id] || null,
            prioritySetAt: priorityRanks[habit.id] ? new Date().toISOString() : null
          };
          
          Object.keys(habitData).forEach(key => habitData[key] === undefined && delete habitData[key]);
          batch.set(userHabitRef, habitData);
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        batch.set(userDocRef, { enabledFeatures }, { merge: true });

        await batch.commit();
        if (refreshData) {
          refreshData();
        }
      }
    } catch (error) {
      console.error("Error saving habits:", error);
    }
  };

  const togglePriorityRank = (habitId) => {
    const existingCount = existingHabits.filter(h => h.priorityRank && h.priorityRank >= 1 && h.priorityRank <= 3 && h.id !== habitId).length;
    if (prioritiesLocked || existingCount >= 3) {
      setShowPriorityLockModal(true);
      return;
    }
    setPriorityRanks(prev => {
      const next = { ...prev };
      if (next[habitId]) {
        delete next[habitId];
        const remaining = Object.entries(next).sort((a, b) => a[1] - b[1]);
        const newRanks = {};
        remaining.forEach(([id], index) => {
          newRanks[id] = index + 1;
        });
        return newRanks;
      } else {
        const totalCount = existingCount + Object.keys(next).length;
        if (totalCount >= 3) {
          setShowPriorityLockModal(true);
          return next;
        }
        const used = Object.values(next);
        let newRank = 1;
        while (used.includes(newRank)) newRank++;
        next[habitId] = newRank;
        return next;
      }
    });
  };

  const handleCardClick = (habit) => {
    if (expandedHabitId === habit.id) {
      setExpandedHabitId(null);
      setDraftHabit(null);
      return;
    }
    const isExisting = existingHabits.some(h => h.id === habit.id);
    if (isExisting) {
      showNotice(
        "Already Tracking Habit",
        "You are already tracking this habit. To manage or adjust existing habits, visit your Profile.",
        {
          subtitle: habit.name || "Active Habit",
          actionText: "Go to Profile",
          onAction: () => navigate("/profile")
        }
      );
      return;
    }

    if (habit.isCustom || habit.id?.startsWith('custom_')) {
      const existingCustom = customHabits.find(h => h.id === habit.id) || habit;
      setDraftHabit({
        ...existingCustom,
        target: existingCustom.userTarget100 !== undefined ? existingCustom.userTarget100 : (existingCustom.target100 !== undefined ? existingCustom.target100 : 10),
        floor: existingCustom.userTarget0 !== undefined ? existingCustom.userTarget0 : (existingCustom.target0 !== undefined ? existingCustom.target0 : 0)
      });
      setExpandedHabitId(habit.id);
      return;
    }

    const existingSelected = selectedHabits.find(h => h.id === habit.id);
    if (existingSelected) {
        setDraftHabit({
          ...existingSelected,
          target: existingSelected.userTarget100 !== undefined ? existingSelected.userTarget100 : (existingSelected.target100 !== undefined ? existingSelected.target100 : 100),
          floor: existingSelected.userTarget0 !== undefined ? existingSelected.userTarget0 : (existingSelected.target0 !== undefined ? existingSelected.target0 : 0)
        });
    } else {
        const newLibrarySelections = selectedHabits.filter(sh => !existingHabits.some(eh => eh.id === sh.id));
        const existingLibraryCount = existingHabits.filter(h => !h.id.startsWith('custom_') && h.category !== 'Custom').length;
        const totalLibraryCount = existingLibraryCount + newLibrarySelections.length;
        if (totalLibraryCount >= MAX_FREE_HABITS && !isPro) {
            setPaywallSource("total_habits_limit");
            setShowPaywall(true);
            return;
        }
        
        const newHabit = {
            ...habit,
            userTarget0: habit.target0 !== undefined ? habit.target0 : 0,
            userTarget100: habit.target100 !== undefined ? habit.target100 : 100,
            userTolerance: 0,
            direction: habit.direction || 'higher_is_better'
        };
        newHabit.target = newHabit.userTarget100;
        newHabit.floor = newHabit.userTarget0;

        setDraftHabit(newHabit);
    }
    setExpandedHabitId(habit.id);
  };

  const isDuplicateIconAndColor = (icon, color, ignoreHabitId = null) => {
    const normColor = (color || '#10b981').toLowerCase().trim();
    const normIcon = (icon || 'rocket_launch').toLowerCase().trim();
    const allHabits = [
      ...existingHabits,
      ...selectedHabits,
      ...customHabits
    ];
    return allHabits.find(h => {
      if (ignoreHabitId && h.id === ignoreHabitId) return false;
      const hColor = (h.color || '#10b981').toLowerCase().trim();
      const hIcon = (h.icon || 'rocket_launch').toLowerCase().trim();
      return hIcon === normIcon && hColor === normColor;
    });
  };

  const handleDoneConfig = (e) => {
    if (e) e.stopPropagation();
    if (!draftHabit) return;
    
    if (draftHabit.isCustom || draftHabit.id?.startsWith('custom_')) {
      const dup = isDuplicateIconAndColor(draftHabit.icon, draftHabit.color, draftHabit.id);
      if (dup) {
        showNotice("Icon & Color In Use", `This icon and color combination is already in use by "${dup.name}". Please choose a different icon or distinct color.`);
        return;
      }

      const finalCustom = {
        ...draftHabit,
        userTarget100: draftHabit.target !== undefined && draftHabit.target !== null ? draftHabit.target : (draftHabit.userTarget100 ?? 10),
        userTarget0: draftHabit.floor !== undefined && draftHabit.floor !== null ? draftHabit.floor : (draftHabit.userTarget0 ?? 0),
        target100: draftHabit.target !== undefined && draftHabit.target !== null ? draftHabit.target : (draftHabit.target100 ?? 10),
        target0: draftHabit.floor !== undefined && draftHabit.floor !== null ? draftHabit.floor : (draftHabit.target0 ?? 0)
      };

      setCustomHabits(prev => prev.map(ch => ch.id === finalCustom.id ? finalCustom : ch));
      setExpandedHabitId(null);
      setDraftHabit(null);
      return;
    }

    const finalHabit = {
        ...draftHabit,
        userTarget100: draftHabit.target,
        userTarget0: draftHabit.floor,
        target100: draftHabit.target,
        target0: draftHabit.floor
    };

    setSelectedHabits(prev => {
        const idx = prev.findIndex(h => h.id === finalHabit.id);
        if (idx >= 0) {
            const next = [...prev];
            next[idx] = finalHabit;
            return next;
        }
        return [...prev, finalHabit];
    });
    setExpandedHabitId(null);
    setDraftHabit(null);
  };

  const handleDeleteConfig = (e, habitId) => {
    if (e) e.stopPropagation();
    if (habitId?.startsWith('custom_')) {
      setCustomHabits(prev => prev.filter(h => h.id !== habitId));
    } else {
      setSelectedHabits(prev => prev.filter(h => h.id !== habitId));
    }
    setExpandedHabitId(null);
    setDraftHabit(null);
  };

  const startEditingCustomHabit = (ch, e) => {
    if (e) e.stopPropagation();
    setViewMode('selection');
    setActiveCategories(['Custom']);
    handleCardClick(ch);
    window.scrollTo({ top: 80, behavior: 'smooth' });
  };

  const cancelEditCustomHabit = (e) => {
    if (e) e.stopPropagation();
    setEditingCustomHabitId(null);
    setCbName('');
    setCbType('yn');
    setCbUnit('L');
    setCbUnitCustom('');
    setCbDirection('higher');
    setCbFloor(0);
    setCbTarget(10);
    setCbTolerance(false);
    setCbIcon('rocket_launch');
    setCbColor('#10b981');
  };

  const addCustomHabit = (e) => {
    if (e) e.stopPropagation();

    if (!cbName.trim()) { showNotice("Missing Habit Name", "Please enter a Habit Name."); return; }
    if (cbType === 'duration' && cbUnit === 'custom' && !cbUnitCustom.trim()) { showNotice("Missing Unit Label", "Please enter a custom unit label."); return; }
    if (cbType !== 'yn' && cbType !== 'time' && !cbDirection) { showNotice("Missing Scoring Goal", "Please select whether Higher or Lower is better."); return; }
    if (cbType !== 'yn' && (cbFloor === '' || cbTarget === '')) { showNotice("Missing Target Values", "Please enter both 0% and 100% scores."); return; }

    const duplicate = isDuplicateIconAndColor(cbIcon, cbColor, editingCustomHabitId);
    if (duplicate) {
      showNotice("Icon & Color In Use", `This icon and color combination is already in use by "${duplicate.name}". Please choose a different icon or distinct color.`);
      return;
    }

    if (!editingCustomHabitId) {
      const existingCustomsCount = existingHabits.filter(h => h.id.startsWith('custom_') || h.category === 'Custom').length;
      if (customHabits.length + existingCustomsCount >= MAX_CUSTOM_HABITS && !isPro) {
        setPaywallSource("custom_habit_creation");
        setShowPaywall(true);
        return;
      }
    }

    const name = cbName.trim();
    let unit = cbUnit === 'custom' ? cbUnitCustom.trim() : cbUnit;
    if (cbType === 'duration' && (unit === 'hrs' || unit === 'mins')) {
      unit = 'minutes';
    }
    
    let scoringType = 'numeric';
    if (cbType === 'yn') scoringType = 'binary';
    else if (cbType === 'time') scoringType = 'time';

    const parseTime = (val) => {
      if (typeof val === 'string' && val.includes(':')) {
        const [h, m] = val.split(':').map(Number);
        return h * 60 + m;
      }
      return parseFloat(val) || 0;
    };

    const isDecimal = unit === 'Liters' || unit === 'L' || unit === 'liters' || unit === 'km' || unit === 'miles';
    const target0Val = cbType === 'time' ? parseTime(cbFloor) : (isDecimal ? parseFloat(cbFloor) || 0 : Math.round(parseFloat(cbFloor) || 0));
    const target100Val = cbType === 'time' ? parseTime(cbTarget) : (isDecimal ? parseFloat(cbTarget) || 0 : Math.round(parseFloat(cbTarget) || 0));

    const habitPayload = canonicalizeHabit({
      id: editingCustomHabitId || `custom_${Date.now()}`,
      name,
      category: 'Custom',
      icon: cbIcon || 'rocket_launch',
      iconId: cbIcon || 'rocket_launch',
      color: cbColor || '#10b981',
      iconColor: cbColor || '#10b981',
      scoringType,
      direction: (cbDirection === 'lower' || cbDirection === 'lower_is_better') ? 'lower_is_better' : 'higher_is_better',
      unit: cbType === 'yn' ? '' : (cbType === 'time' ? 'Time' : unit),
      userTarget0: target0Val,
      userTarget100: target100Val,
      target0: target0Val,
      target100: target100Val,
      userTolerance: cbTolerance ? 10 : 0,
      isCustom: true
    });

    if (editingCustomHabitId) {
      setCustomHabits(prev => prev.map(h => h.id === editingCustomHabitId ? habitPayload : h));
      setEditingCustomHabitId(null);
    } else {
      setCustomHabits([...customHabits, habitPayload]);
    }

    setCbName('');
    setCbTolerance(false);
    setCbFloor(0);
    setCbTarget(10);
    setCbIcon('rocket_launch');
    setCbColor('#10b981');
  };

  const deleteCustomHabit = (id, e) => {
    if (e) e.stopPropagation();
    setCustomHabits(customHabits.filter(h => h.id !== id));
    if (editingCustomHabitId === id) {
      cancelEditCustomHabit();
    }
  };

  const renderHabitInputs = (h) => {
    const isExpanded = expandedHabitId === h.id;
    if (!isExpanded) return null;
    
    const selectedObj = draftHabit;
    if (!selectedObj) return null;

    const updateDraft = (field, val) => {
       setDraftHabit(prev => ({ ...prev, [field]: val }));
    };

    if (h.isCustom || h.id?.startsWith('custom_')) {
      return (
        <div className="w-full pt-3 space-y-3" onClick={e => e.stopPropagation()}>
          {/* Edit Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Habit Name</label>
            <input 
              type="text" 
              value={selectedObj.name || ''} 
              onChange={e => updateDraft('name', e.target.value)} 
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            />
          </div>

          {/* Scoring Type & Unit Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Type</label>
              <select 
                value={selectedObj.scoringType === 'binary' ? 'yn' : (selectedObj.scoringType === 'time' ? 'time' : 'duration')} 
                onChange={e => {
                  const newType = e.target.value;
                  if (newType === 'yn') {
                    updateDraft('scoringType', 'binary');
                    updateDraft('unit', '');
                    updateDraft('direction', 'higher_is_better');
                  } else if (newType === 'time') {
                    updateDraft('scoringType', 'time');
                    updateDraft('unit', 'Time');
                    updateDraft('direction', 'lower_is_better');
                    updateDraft('floor', selectedObj.floor !== undefined ? selectedObj.floor : 480);
                    updateDraft('target', selectedObj.target !== undefined ? selectedObj.target : 360);
                  } else {
                    updateDraft('scoringType', 'numeric');
                    updateDraft('unit', selectedObj.unit && selectedObj.unit !== 'Time' ? selectedObj.unit : 'mins');
                    updateDraft('direction', selectedObj.direction || 'higher_is_better');
                    updateDraft('floor', selectedObj.floor !== undefined ? selectedObj.floor : 0);
                    updateDraft('target', selectedObj.target !== undefined ? selectedObj.target : 10);
                  }
                }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
              >
                <option value="yn">Yes / No (Binary)</option>
                <option value="duration">Duration / Number</option>
                <option value="time">Target Time</option>
              </select>
            </div>

            {selectedObj.scoringType === 'binary' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Goal Type</label>
                  <button
                    type="button"
                    onClick={() => setShowBinaryExplainer(true)}
                    className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Info size={12} weight="bold" />
                    <span>How it works</span>
                  </button>
                </div>
                <select
                  value={selectedObj.direction === 'lower_is_better' ? 'lower_is_better' : 'higher_is_better'}
                  onChange={e => updateDraft('direction', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                >
                  <option value="higher_is_better">🟢 Build Habit (Positive Action • e.g. Cold Shower)</option>
                  <option value="lower_is_better">🛡️ Quit / Break Habit (Avoid / Stop • e.g. Sugar, Alcohol)</option>
                </select>
              </div>
            )}

            {selectedObj.scoringType !== 'binary' && selectedObj.scoringType !== 'time' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Unit</label>
                <select 
                  value={['mins', 'hrs', 'steps', 'pages', 'reps', 'L', 'kg'].includes(selectedObj.unit) ? selectedObj.unit : (selectedObj.unit === 'minutes' ? 'mins' : (selectedObj.unit === 'hours' ? 'hrs' : 'custom'))}
                  onChange={e => {
                    const u = e.target.value;
                    if (u === 'custom') {
                      updateDraft('unit', 'custom');
                    } else {
                      updateDraft('unit', u);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                >
                  <option value="mins">Minutes (mins)</option>
                  <option value="hrs">Hours (hrs)</option>
                  <option value="steps">Steps</option>
                  <option value="pages">Pages</option>
                  <option value="reps">Reps</option>
                  <option value="L">Litres (L)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="custom">Custom Unit...</option>
                </select>
              </div>
            )}
          </div>

          {selectedObj.scoringType !== 'binary' && selectedObj.scoringType !== 'time' && (!['mins', 'hrs', 'steps', 'pages', 'reps', 'L', 'kg', 'minutes', 'hours'].includes(selectedObj.unit) || selectedObj.unit === 'custom') && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Custom Unit Label</label>
              <input 
                type="text" 
                value={selectedObj.unit === 'custom' ? '' : (selectedObj.unit || '')} 
                onChange={e => updateDraft('unit', e.target.value)} 
                placeholder="e.g. cups, laps, pushups" 
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Scoring Controls */}
          {selectedObj.scoringType === 'binary' ? (
            <div className="ahs-input-group mt-2">
              <label className="ahs-input-label">Type</label>
              <div className="ahs-form-control cursor-not-allowed bg-surface-variant/30">
                <input type="text" value="Yes / No (Binary)" readOnly />
              </div>
            </div>
          ) : (
            <>
              {selectedObj.scoringType !== 'time' && (
                <div className="mb-3 w-full">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Scoring Logic</label>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                    <button 
                      type="button" 
                      className={selectedObj.direction === 'higher_is_better' ? "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 font-bold text-xs transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs" : "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 font-bold text-xs transition-all bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200/50"} 
                      onClick={(e) => { e.stopPropagation(); updateDraft('direction', 'higher_is_better'); }}
                    >
                      <Icon name="trending_up" className="text-[14px]" /> Higher is better
                    </button>
                    <button 
                      type="button" 
                      className={selectedObj.direction === 'lower_is_better' ? "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 font-bold text-xs transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs" : "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 font-bold text-xs transition-all bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200/50"} 
                      onClick={(e) => { e.stopPropagation(); updateDraft('direction', 'lower_is_better'); }}
                    >
                      <Icon name="trending_down" className="text-[14px]" /> Lower is better
                    </button>
                  </div>
                </div>
              )}

              <DualRangeSlider 
                target0={selectedObj.floor !== undefined ? selectedObj.floor : 0} 
                target100={selectedObj.target !== undefined ? selectedObj.target : 10} 
                unit={selectedObj.unit === 'custom' ? '' : (selectedObj.unit || '')}
                habitId={h.id}
                habitName={selectedObj.name || h.name}
                isTime={selectedObj.scoringType === 'time'}
                direction={selectedObj.direction || 'higher_is_better'}
                onChange={(field, val) => {
                  updateDraft(field === 'target0' ? 'floor' : 'target', val);
                }}
              />
            </>
          )}

          {/* Actions: Remove & Done */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              onClick={(e) => handleDeleteConfig(e, h.id)} 
              className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Icon name="delete" className="text-[14px]" /> Remove
            </button>
            <button 
              type="button"
              onClick={handleDoneConfig}
              className="px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      );
    }

    let content = null;
    if (h.scoringType === 'binary') {
      content = (
        <div className="ahs-input-group mt-4">
          <label className="ahs-input-label">Type</label>
          <div className="ahs-form-control cursor-not-allowed bg-surface-variant/30">
            <input type="text" value="Yes / No" readOnly />
          </div>
        </div>
      );
    } else if (h.scoringType === 'subjective') {
      content = (
        <div className="ahs-input-group mt-4">
          <label className="ahs-input-label">Type</label>
          <div className="ahs-form-control cursor-not-allowed bg-surface-variant/30">
            <input type="text" value="Subjective Score (1-10)" readOnly />
          </div>
          <p className="text-xs text-on-surface-variant mt-2 font-medium">
            You will rate this daily from 1 to 10. It is excluded from the overall daily percentage, but tracked for your insights.
          </p>
        </div>
      );
    } else {
      content = (
        <div className="ahs-input-group mt-4" onClick={e => e.stopPropagation()}>
          {(selectedObj.direction !== undefined) && (
            <div className="mb-6 w-full">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-on-surface-variant">Scoring Logic</label>
              </div>
              <div className="flex bg-surface border border-outline-variant/50 rounded-xl overflow-hidden shadow-sm">
                <button 
                  type="button" 
                  className={selectedObj.direction === 'higher_is_better' ? "flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold text-[13px] transition-all duration-300 bg-[#0B1120] text-white" : "flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold text-[13px] transition-all duration-300 bg-transparent text-on-surface hover:bg-surface-variant/30"} 
                  onClick={(e) => { e.stopPropagation(); updateDraft('direction', 'higher_is_better'); }}
                >
                  <Icon name="trending_up" className="text-[16px]" /> Higher is better
                </button>
                <button 
                  type="button" 
                  className={selectedObj.direction === 'lower_is_better' ? "flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold text-[13px] transition-all duration-300 bg-[#0B1120] text-white" : "flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold text-[13px] transition-all duration-300 bg-transparent text-on-surface hover:bg-surface-variant/30"} 
                  onClick={(e) => { e.stopPropagation(); updateDraft('direction', 'lower_is_better'); }}
                >
                  <Icon name="trending_down" className="text-[16px]" /> Lower is better
                </button>
              </div>
            </div>
          )}

          <DualRangeSlider 
            target0={selectedObj.floor !== undefined && selectedObj.floor !== null ? Number(selectedObj.floor) : 0} 
            target100={selectedObj.target !== undefined && selectedObj.target !== null ? Number(selectedObj.target) : (selectedObj.direction === 'lower_is_better' ? 0 : 10)} 
            unit={h.unit || h.defaultUnit || h.customUnit || selectedObj?.unit || selectedObj?.defaultUnit || ""}
            habitId={h.id}
            habitName={h.name}
            isTime={h.scoringType === 'time'}
            direction={selectedObj.direction || 'higher_is_better'}
            onChange={(field, val) => {
              updateDraft(field === 'target0' ? 'floor' : 'target', val);
            }}
          />
        </div>
      );
    }

    return (
      <div className="w-full">
        {content}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-outline-variant/30">
          <button 
            onClick={(e) => handleDeleteConfig(e, h.id)} 
            className="px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
          >
            <Icon name="delete" className="text-[16px]" /> Remove
          </button>
          <button 
            onClick={handleDoneConfig}
            className="px-6 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="ahs-wrap">
      <div className="ahs-container">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 mb-2 pt-1">
          <button 
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            <Icon name="arrow_back" className="text-sm" />
            <span>Back</span>
          </button>

          <button 
            type="button" 
            onClick={() => setScoringModal('all')}
            className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs" 
          >
            <Icon name="help_outline" className="text-[13px] text-primary" /> 
            <span>How Scoring Works</span>
          </button>
        </div>

        {viewMode === 'selection' && (
          <div id="view-selection" className="space-y-3">
            {/* Title & Lock Notice */}
            <div className="mb-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Choose Your Daily Habits
              </h1>
              <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 font-black mt-0.5 flex items-center gap-1">
                <span className="flex items-center gap-1.5"><Icon name="lock" className="text-xs" /> Habits lock for 30 days once your plan is saved</span>
              </p>
            </div>

            {/* 3 Main View Tabs (All Habits, Selected, + Custom) */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
              
              {/* Tab 1: All Habits */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setActiveCategories(['All']);
                }}
                className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  !activeCategories.includes('Selected') && !activeCategories.includes('Custom')
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon name="grid_view" className="text-[13px] shrink-0" />
                <span>All ({habitLibrary.length})</span>
              </button>

              {/* Tab 2: Selected */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setActiveCategories(['Selected']);
                }}
                className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  activeCategories.includes('Selected')
                    ? 'bg-violet-600 text-white shadow-xs shadow-violet-500/30'
                    : 'text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30'
                }`}
              >
                <Icon name="check" className="text-[13px] shrink-0" />
                <span>Selected ({selectedHabits.length + customHabits.length})</span>
              </button>

              {/* Tab 3: Custom */}
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setActiveCategories(['Custom']);
                }}
                className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  activeCategories.includes('Custom')
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
              >
                <Icon name="add" className="text-[13px] shrink-0" />
                <span>Custom</span>
              </button>
            </div>

            {/* Sub-Category Pills */}
            {!activeCategories.includes('Selected') && !activeCategories.includes('Custom') && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 hide-scrollbar no-scrollbar scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setActiveCategories(['All'])}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer border ${
                    activeCategories.length === 1 && activeCategories[0] === 'All'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-white dark:bg-[#151a26] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  All Categories
                </button>
                {[...new Set(habitLibrary.map(h => h.category))].map(cat => {
                  const isCatActive = activeCategories.length === 1 && activeCategories[0] === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategories([cat])}
                      className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer border ${
                        isCatActive
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                          : 'bg-white dark:bg-[#151a26] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="ahs-layout-grid">
              <main>
                <div className="ahs-category-section">
                  <div className="ahs-habits-grid items-start">
                    
                    {/* CUSTOM HABIT BUILDER */}
                    {activeCategories.includes('Selected') && !activeCategories.includes('Custom') && (
                      <button 
                        onClick={() => setActiveCategories(['Custom'])}
                        className="col-span-full w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-2.5 px-4 font-black flex justify-between items-center mb-4 shadow-sm hover:opacity-90 transition-all cursor-pointer text-xs sm:text-sm active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="add_circle" className="text-lg" />
                          <span>Create Custom Habit</span>
                        </div>
                        <Icon name="chevron_right" className="text-sm" />
                      </button>
                    )}

                    {activeCategories.includes('Custom') && (() => {
                      const isSuperAdmin = import.meta.env.DEV || userDoc?.role === 'super_admin' || userDoc?.isSuperAdmin === true;
                      const isPro = userDoc?.isPro || userDoc?.tier === 'pro' || isSuperAdmin;
                      const existingCustomsCount = existingHabits.filter(h => h.id.startsWith('custom_') || h.category === 'Custom').length;
                      const totalCustoms = customHabits.length + existingCustomsCount;
                      const isFreeLimitReached = totalCustoms >= MAX_CUSTOM_HABITS;
                      const showProLocked = isFreeLimitReached && !isPro;

                      if (showProLocked) {
                        return (
                          <div className="col-span-full flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-[#151a26] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl w-full" onClick={(e) => {
                            e.stopPropagation();
                            setPaywallSource("custom_habit_creation");
                            setShowPaywall(true);
                          }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Icon name="add" className="text-base"/> Unlimited Custom Habits</span>
                              <span className="text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">PRO</span>
                            </div>
                            <p className="text-slate-500 text-xs max-w-[280px] mb-4 font-medium">You have added {MAX_CUSTOM_HABITS} Free Custom Habits. Upgrade to Pro to add unlimited custom habits.</p>
                            <button className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full px-5 py-2 font-black text-xs hover:opacity-90 transition-all cursor-pointer shadow-xs">
                              <Icon name="lock" className="text-sm" /> Upgrade to Pro
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="col-span-full w-full bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3 overflow-hidden" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {editingCustomHabitId ? 'Edit Custom Habit' : 'Create Custom Habit'}
                              </h3>
                              {editingCustomHabitId ? (
                                <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-md shrink-0">
                                  Editing Mode
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md shrink-0">
                                  {isPro ? 'PRO' : `${Math.max(0, MAX_CUSTOM_HABITS - totalCustoms)} Free`}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {editingCustomHabitId && (
                                <button
                                  type="button"
                                  onClick={cancelEditCustomHabit}
                                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setScoringModal('all'); }}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                              >
                                <Icon name="help_outline" className="text-[11px] text-primary" /> 
                                <span>Rules</span>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Habit Name</label>
                              <input 
                                type="text" 
                                value={cbName} 
                                onChange={e => setCbName(e.target.value)} 
                                placeholder="e.g. Read 10 Pages, Cold Shower" 
                                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                              />
                            </div>

                            {/* ICON & COLOR SELECTOR TRIGGER */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Habit Icon & Color
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setPickerHabit(null);
                                  setShowIconPickerModal(true);
                                }}
                                className="w-full p-2 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between gap-2 cursor-pointer group overflow-hidden"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <HabitIcon 
                                    name={cbIcon} 
                                    boxed={true} 
                                    color={cbColor} 
                                    size={16} 
                                    className="!w-8 !h-8 !rounded-full shrink-0 shadow-xs" 
                                  />
                                  <div className="text-left min-w-0 flex-1">
                                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                      <span>Custom Icon</span>
                                      <span 
                                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                                        style={{ backgroundColor: cbColor }}
                                      />
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                      Tap to customize icon & color
                                    </div>
                                  </div>
                                </div>
                                <ColorfulPaletteButton 
                                  size={28}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPickerHabit(null);
                                    setShowIconPickerModal(true);
                                  }}
                                />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Type</label>
                                <select 
                                  value={cbType} 
                                  onChange={e => setCbType(e.target.value)}
                                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                >
                                  <option value="yn">Yes / No (Binary)</option>
                                  <option value="duration">Duration / Number</option>
                                  <option value="time">Target Time</option>
                                </select>
                              </div>

                              {cbType === 'yn' && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Goal Type</label>
                                    <button
                                      type="button"
                                      onClick={() => setShowBinaryExplainer(true)}
                                      className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                    >
                                      <Info size={12} weight="bold" />
                                      <span>How it works</span>
                                    </button>
                                  </div>
                                  <select 
                                    value={cbDirection === 'lower' || cbDirection === 'lower_is_better' ? 'lower_is_better' : 'higher_is_better'} 
                                    onChange={e => setCbDirection(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                  >
                                    <option value="higher_is_better">🟢 Build Habit (Positive Action • e.g. Cold Shower)</option>
                                    <option value="lower_is_better">🛡️ Quit / Break Habit (Avoid / Stop • e.g. Sugar, Alcohol)</option>
                                  </select>
                                </div>
                              )}

                              {cbType === 'duration' && (
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Unit</label>
                                  <select 
                                    value={cbUnit} 
                                    onChange={e => setCbUnit(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                  >
                                    <option value="mins">Minutes (mins)</option>
                                    <option value="hrs">Hours (hrs)</option>
                                    <option value="steps">Steps</option>
                                    <option value="pages">Pages</option>
                                    <option value="reps">Reps</option>
                                    <option value="L">Litres (L)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="custom">Custom Unit...</option>
                                  </select>
                                </div>
                              )}
                            </div>

                            {cbType === 'duration' && cbUnit === 'custom' && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Custom Unit Label</label>
                                <input 
                                  type="text" 
                                  value={cbUnitCustom} 
                                  onChange={e => setCbUnitCustom(e.target.value)} 
                                  placeholder="e.g. cups, laps, pushups" 
                                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                />
                              </div>
                            )}

                            {(cbType === 'duration' || cbType === 'time') && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Scoring Logic</label>
                                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                  <button
                                    type="button"
                                    onClick={() => setCbDirection('higher')}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                      cbDirection === 'higher'
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <TrendUp size={13} weight="bold" /> Higher is Better
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCbDirection('lower')}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                      cbDirection === 'lower'
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    <TrendDown size={13} weight="bold" /> Lower is Better
                                  </button>
                                </div>
                              </div>
                            )}

                            {cbType !== 'yn' && (
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    {cbType === 'time' ? '0% Score (Miss)' : '0% Floor'}
                                  </label>
                                  <input 
                                    type={cbType === 'time' ? 'time' : 'number'} 
                                    value={cbFloor} 
                                    onChange={e => setCbFloor(e.target.value)} 
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    {cbType === 'time' ? '100% Score (Target)' : '100% Target'}
                                  </label>
                                  <input 
                                    type={cbType === 'time' ? 'time' : 'number'} 
                                    value={cbTarget} 
                                    onChange={e => setCbTarget(e.target.value)} 
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                  />
                                </div>
                              </div>
                            )}

                            <button 
                              type="button" 
                              onClick={addCustomHabit}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-98 mt-2"
                            >
                              {editingCustomHabitId ? 'Save Custom Habit Changes' : '+ Add Custom Habit to Plan'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* CUSTOM HABITS LIST (In Custom Tab) */}
                    {activeCategories.includes('Custom') && customHabits.map(ch => {
                      const isExpanded = expandedHabitId === ch.id;
                      const formatTargetStr = () => {
                        if (ch.scoringType === 'binary') return 'Type: Yes / No (Binary)';
                        if (ch.scoringType === 'time') return `Target: ${formatReviewTime(ch.target100)}`;
                        if (ch.scoringType === 'duration' || isDurationHabit(ch)) {
                          return `Target: ${formatDuration(normalizeDurationToMinutes(ch.target100, ch.unit), 'long')}`;
                        }
                        return `Target: ${ch.target100} ${ch.unit || ''}`;
                      };

                      return (
                        <div 
                          key={ch.id} 
                          className={`ahs-habit-card ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => handleCardClick(ch)}
                        >
                          <div className="flex items-center justify-between gap-2.5 w-full">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <HabitIcon name={ch.icon || 'rocket_launch'} habitId={ch.id} boxed={true} color={ch.color} size={16} className="!w-8 !h-8 !rounded-full shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-xs sm:text-[13px] text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                    {ch.name}
                                  </span>
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                    CUSTOM
                                  </span>
                                </div>
                                <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                  {formatTargetStr()}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                              <ColorfulPaletteButton 
                                size={28}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPickerHabit(ch);
                                  setShowIconPickerModal(true);
                                }}
                              />
                              <button 
                                type="button" 
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors shadow-2xs" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(ch);
                                }}
                                title="Edit habit targets & settings"
                              >
                                <Icon name="edit" className="text-[12px]" /> Edit
                              </button>
                              <button 
                                type="button" 
                                className="ahs-btn-custom-scoring text-xs" 
                                onClick={(e) => { e.stopPropagation(); setScoringModal('all'); }}
                              >
                                <Icon name="help_outline" className="text-[12px]" /> Scoring
                              </button>
                              <button 
                                type="button" 
                                onClick={(e) => deleteCustomHabit(ch.id, e)}
                                className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                                title="Delete custom habit"
                              >
                                <Icon name="delete" className="text-[14px]" />
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 ahs-habit-card-expanded w-full">
                              {renderHabitInputs(ch)}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* RENDER HABIT LIBRARY */}
                    {displayedHabits.map(habit => {
                      const isSelected = selectedHabits.some(h => h.id === habit.id);
                      const isSelectedView = activeCategories.includes('Selected');
                      const isExpanded = expandedHabitId === habit.id;

                      if (isSelectedView) {
                         return (
                          <div 
                            key={habit.id} 
                            onClick={() => handleCardClick(habit)}
                            className="w-full bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2 shadow-2xs cursor-pointer hover:border-slate-400/80 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 w-full sm:flex-1">
                                 <HabitIcon name={customizedHabits[habit.id]?.icon || selectedHabits.find(sh => sh.id === habit.id)?.icon || habit.icon} habitId={habit.id} boxed={true} color={customizedHabits[habit.id]?.color || selectedHabits.find(sh => sh.id === habit.id)?.color || habit.color} size={16} className="!w-8 !h-8 !rounded-full shrink-0" />
                                 <div className="min-w-0 flex-1">
                                   <div className="font-black text-xs sm:text-[13px] text-slate-900 dark:text-white truncate">{habit.name}</div>
                                   <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{habit.category}</div>
                                 </div>
                              </div>
                              <div className="flex items-center justify-end gap-1.5 w-full sm:w-auto shrink-0 overflow-x-auto hide-scrollbar pb-1 sm:pb-0" onClick={e => e.stopPropagation()}>
                                 <ColorfulPaletteButton 
                                   size={28}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (expandedHabitId !== habit.id) {
                                       handleCardClick(habit);
                                     }
                                     const cur = selectedHabits.find(sh => sh.id === habit.id);
                                     setPickerHabit(cur || habit);
                                     setShowIconPickerModal(true);
                                   }}
                                 />
                                 <button 
                                   type="button" 
                                   className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors shadow-2xs" 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleCardClick(habit);
                                   }}
                                   title="Edit habit targets & settings"
                                 >
                                   <Icon name="edit" className="text-[12px]" /> Edit
                                 </button>
                                 <button 
                                   type="button" 
                                   className="ahs-btn-custom-scoring text-xs" 
                                   onClick={(e) => { e.stopPropagation(); openScoringModalForHabit(habit); }}
                                 >
                                   <Icon name="help_outline" className="text-[12px]" /> Scoring
                                 </button>
                                 <button 
                                   type="button" 
                                   onClick={(e) => handleDeleteConfig(e, habit.id)} 
                                   className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                   title="Remove habit"
                                 >
                                    <Icon name="close" className="text-[14px]" />
                                 </button>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 ahs-habit-card-expanded">
                                 {renderHabitInputs(habit)}
                              </div>
                            )}
                          </div>
                         );
                      }

                      return (
                        <div 
                          key={habit.id} 
                          className={`ahs-habit-card ${isSelected ? 'selected' : ''}`} 
                          onClick={() => handleCardClick(habit)}
                        >
                            <div className="ahs-hc-header">
                                <div className="ahs-hc-left">
                                    <HabitIcon name={customizedHabits[habit.id]?.icon || selectedHabits.find(sh => sh.id === habit.id)?.icon || habit.icon} habitId={habit.id} boxed={true} color={customizedHabits[habit.id]?.color || selectedHabits.find(sh => sh.id === habit.id)?.color || habit.color} size={22} className="!w-10 !h-10 !rounded-full shrink-0" />
                                    <div className="ahs-hc-title">{habit.name}</div>
                                </div>
                                <div className="ahs-card-actions" onClick={e => e.stopPropagation()}>
                                    <ColorfulPaletteButton 
                                      size={28}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (expandedHabitId !== habit.id) {
                                          handleCardClick(habit);
                                        }
                                        const cur = selectedHabits.find(sh => sh.id === habit.id);
                                        setPickerHabit(cur || habit);
                                        setShowIconPickerModal(true);
                                      }}
                                    />
                                    {isSelected && (
                                      <button 
                                        type="button" 
                                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors shadow-2xs" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCardClick(habit);
                                        }}
                                        title="Edit habit targets & settings"
                                      >
                                        <Icon name="edit" className="text-[12px]" /> Edit
                                      </button>
                                    )}
                                    <button className="ahs-btn-custom-scoring" onClick={(e) => { e.stopPropagation(); openScoringModalForHabit(habit); }}>
                                      <Icon name="help_outline" className="text-[12px]" /> Scoring
                                    </button>
                                    <div 
                                      className="ahs-checkbox cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSelected) {
                                          handleDeleteConfig(e, habit.id);
                                        } else {
                                          handleCardClick(habit);
                                        }
                                      }}
                                    >
                                      <Icon name="check" className="text-sm text-white stroke-white stroke-2" />
                                    </div>
                                </div>
                            </div>
                            {renderHabitInputs(habit)}
                        </div>
                      );
                    })}

                  </div>
                </div>
              </main>
            </div>

            {/* Sticky Bottom Bar for Selection Mode */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f141c]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 py-3 px-4 sm:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 sm:px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFlow}
                  disabled={selectedHabits.length + customHabits.length === 0}
                  className={`flex-1 sm:flex-initial px-5 sm:px-8 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    selectedHabits.length + customHabits.length > 0
                      ? 'bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white hover:shadow-lg'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <span>Review Your Plan ({selectedHabits.length + customHabits.length})</span>
                  <Icon name="arrow_forward" className="text-[14px]" />
                </button>
              </div>
            </div>

          </div>
        )}

        {viewMode === 'summary' && (
          <div id="view-summary" className="pt-0 pb-28">
            <div className="ahs-summary-header mt-0 sm:mt-1 mb-3 sm:mb-4 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Review Your Plan</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Check your targets before locking them in. You can edit selections below.</p>
            </div>
            
            {showPrioritySection && (
              <div className="max-w-3xl mx-auto mb-4 bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs">
                <div className="flex justify-between items-center mb-0.5 relative">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Give Priority to Your Habits</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.keys(priorityRanks).length > 0 && (
                      <button 
                        onClick={() => setPriorityRanks({})}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                    <button 
                      onClick={() => setShowPriorityInfo(true)}
                      className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Why set priorities?"
                    >
                      <Icon name="info" className="text-[16px]" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">Select up to 3 core habits for priority insights.</p>
                <div className="flex gap-2">
                  {[
                    { rank: 1, icon: <PriorityIcon rank={1} className="w-8 h-8 drop-shadow-xs mb-1" />, label: '#1' },
                    { rank: 2, icon: <PriorityIcon rank={2} className="w-8 h-8 drop-shadow-xs mb-1" />, label: '#2' },
                    { rank: 3, icon: <PriorityIcon rank={3} className="w-8 h-8 drop-shadow-xs mb-1" />, label: '#3' },
                  ].map(({ rank, icon, label }) => {
                    const habitIdForRank = Object.keys(priorityRanks).find(id => priorityRanks[id] === rank);
                    const habitForRank = habitIdForRank ? [...selectedHabits, ...customHabits].find(h => h.id === habitIdForRank) : null;
                    return (
                      <div 
                        key={rank} 
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border border-dashed transition-all ${habitForRank ? 'border-violet-400 bg-violet-50/80 dark:bg-violet-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30'}`}
                      >
                        {icon}
                        <div className={`text-[11px] font-black mb-0.5 ${habitForRank ? 'text-violet-700 dark:text-violet-400' : 'text-slate-400'}`}>{label}</div>
                        <div className="text-[9.5px] font-bold text-center text-slate-600 dark:text-slate-400 line-clamp-1 px-1">
                          {habitForRank ? habitForRank.name : 'Not set'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="ahs-summary-list-container max-w-3xl mx-auto flex flex-col gap-3">
              {[...selectedHabits, ...customHabits].map(h => {
                const formatReviewTime = (mins) => {
                  if (typeof mins !== 'number' || isNaN(mins)) return '00:00';
                  return formatTimeVal(mins);
                };

                const resolveReviewUnit = () => {
                  let u = (h.unit && h.unit !== 'Time' && h.unit !== 'time') ? h.unit : '';
                  if (!u) {
                    const seed = HABITS_SEED_DATA.find(s => s.id === h.id || s.name === h.name);
                    if (seed?.defaultUnit && seed.defaultUnit !== 'time') {
                      u = seed.defaultUnit;
                    }
                  }
                  if (!u && h.name) {
                    const lower = h.name.toLowerCase();
                    if (lower.includes('water')) u = 'Liters';
                    else if (lower.includes('calorie')) u = 'kcal';
                    else if (lower.includes('protein')) u = 'grams';
                    else if (lower.includes('step') || lower.includes('walk')) u = 'steps';
                    else if (lower.includes('sleep') && lower.includes('duration')) u = 'hours';
                    else if (lower.includes('screen')) u = 'hours';
                    else if (lower.includes('work') || lower.includes('read') || lower.includes('study') || lower.includes('meditat') || lower.includes('pomodoro')) u = 'minutes';
                  }
                  return u;
                };
                const habitUnit = resolveReviewUnit();
                const isCustom = h.isCustom || h.id.startsWith('custom_');

                const handleSummaryItemClick = (e) => {
                  if (isCustom) {
                    startEditingCustomHabit(h, e);
                  } else {
                    setViewMode('selection');
                    setActiveCategories(['Selected']);
                    setExpandedHabitId(h.id);
                    const sel = selectedHabits.find(sh => sh.id === h.id);
                    if (sel) {
                      setDraftHabit({ 
                        ...sel,
                        target: sel.userTarget100 !== undefined ? sel.userTarget100 : sel.target100,
                        floor: sel.userTarget0 !== undefined ? sel.userTarget0 : sel.target0
                      });
                    }
                  }
                };

                return (
                  <div 
                    key={h.id} 
                    onClick={handleSummaryItemClick}
                    className="ahs-summary-item flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#151a26] shadow-2xs hover:border-slate-400/80 dark:hover:border-slate-600 cursor-pointer transition-all group"
                    title={`Click to edit ${h.name}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <HabitIcon name={h.icon || 'star'} habitId={h.id} boxed={true} color={h.color} size={16} className="!rounded-full shrink-0" />
                      <div className="ahs-si-details flex-1 min-w-0">
                          <div className="ahs-si-title font-black text-slate-900 dark:text-white text-xs sm:text-[13px] truncate flex items-center gap-1.5 flex-wrap">
                            <span className="group-hover:text-primary transition-colors">{h.name}</span>
                            {isCustom ? (
                              <span className="ahs-custom-badge">CUSTOM</span>
                            ) : null}
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary flex items-center gap-0.5 ml-auto sm:ml-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Icon name="edit" className="text-[11px]" /> Edit
                            </span>
                          </div>
                          <div className="ahs-si-target mt-1">
                              {h.scoringType === 'binary' ? (
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Type: Yes / No</span>
                              ) : h.scoringType === 'time' ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    Target: {formatReviewTime(h.userTarget100)}
                                  </span>
                                </div>
                              ) : (h.scoringType === 'duration' || isDurationHabit(h) || habitUnit === 'minutes' || habitUnit === 'hours') ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    Target: {formatDuration(normalizeDurationToMinutes(h.userTarget100 !== undefined ? h.userTarget100 : h.target100, habitUnit), 'long')}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    Target: {h.userTarget100 !== undefined ? h.userTarget100 : h.target100} {habitUnit}
                                  </span>
                                </div>
                              )}
                          </div>
                      </div>
                    </div>
                    {showPrioritySection && (
                      <div className="ahs-si-check shrink-0" onClick={e => e.stopPropagation()}>
                        <button 
                          type="button" 
                          onClick={() => togglePriorityRank(h.id)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all cursor-pointer ${
                            priorityRanks[h.id] 
                              ? 'border-violet-500 bg-violet-600 text-white shadow-xs' 
                              : 'border-slate-300 dark:border-slate-600 bg-transparent text-slate-400 hover:border-violet-400'
                          }`}
                        >
                          {priorityRanks[h.id] ? `#${priorityRanks[h.id]}` : '+'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky Bottom Bar for Review Mode */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f141c]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 py-3 px-4 sm:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('selection')}
                  className="px-4 sm:px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  Edit Habits
                </button>
                <button
                  type="button"
                  onClick={handleSaveFlow}
                  className="flex-1 sm:flex-initial px-6 sm:px-10 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <span>Lock & Save Plan</span>
                  <Icon name="check" className="text-[14px]" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* PRO MODAL */}
        <ProModal 
          isOpen={showPaywall} 
          onClose={() => setShowPaywall(false)} 
          source={paywallSource} 
        />

        {/* PRIORITY LOCK MODAL */}
        {showPriorityLockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Icon name="lock" className="text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Priority Limit Reached</h3>
                  <p className="text-xs text-slate-500">You can select up to 3 core priority habits.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPriorityLockModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}

        {/* PRIORITY INFO MODAL */}
        {showPriorityInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Why Set Priorities?</h3>
                <button onClick={() => setShowPriorityInfo(false)} className="text-slate-400 hover:text-slate-600">
                  <Icon name="close" className="text-lg" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Priorities help focus your daily analytics, recovery deep dives, and habit coaching on your top 3 non-negotiable goals.
              </p>
              <button 
                onClick={() => setShowPriorityInfo(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM SAVE MODAL */}
        {showConfirmSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-[#151a26] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Icon name="lock" className="text-2xl" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Lock Your 30-Day Plan</h3>
                  <p className="text-xs text-slate-500">Are you ready to commit to this routine?</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Once saved, your habit plan and priorities will be locked for 30 days to build long-term consistency.
              </p>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowConfirmSaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Review Again
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmSaveModal(false);
                    executeSave();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Confirm & Lock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ICON & COLOR PICKER MODAL */}
        <HabitIconColorPickerModal
          isOpen={showIconPickerModal}
          onClose={() => {
            setShowIconPickerModal(false);
            setPickerHabit(null);
          }}
          selectedIcon={pickerHabit ? (draftHabit?.id === pickerHabit.id ? draftHabit.icon : pickerHabit.icon) : cbIcon}
          selectedColor={pickerHabit ? (draftHabit?.id === pickerHabit.id ? draftHabit.color : pickerHabit.color) : cbColor}
          habitName={pickerHabit ? (draftHabit?.id === pickerHabit.id ? draftHabit.name : pickerHabit.name) : (cbName || 'Custom Habit')}
          existingHabits={[...existingHabits, ...selectedHabits, ...customHabits]}
          currentHabitId={pickerHabit?.id || editingCustomHabitId}
          onSelect={({ icon, iconId, color, iconColor, iconBackgroundColor, iconStyle }) => {
            const finalIcon = iconId || icon;
            const finalColor = iconColor || color;
            if (pickerHabit) {
              const targetId = pickerHabit.id;
              // 1. Instant override in state so all icons and colors update immediately
              setCustomizedHabits(prev => ({
                ...prev,
                [targetId]: { 
                  icon: finalIcon, 
                  iconId: finalIcon, 
                  color: finalColor, 
                  iconColor: finalColor,
                  iconBackgroundColor,
                  iconStyle: iconStyle || 'circle'
                }
              }));

              // 2. Update in draftHabit if active
              if (draftHabit && draftHabit.id === targetId) {
                setDraftHabit(prev => ({ 
                  ...prev, 
                  icon: finalIcon, 
                  iconId: finalIcon, 
                  color: finalColor, 
                  iconColor: finalColor,
                  iconBackgroundColor,
                  iconStyle: iconStyle || 'circle'
                }));
              }

              // 3. Update or auto-select in selectedHabits
              setSelectedHabits(prev => {
                const exists = prev.some(h => h.id === targetId);
                if (exists) {
                  return prev.map(h => h.id === targetId ? { 
                    ...h, 
                    icon: finalIcon, 
                    iconId: finalIcon, 
                    color: finalColor, 
                    iconColor: finalColor,
                    iconBackgroundColor,
                    iconStyle: iconStyle || 'circle'
                  } : h);
                } else {
                  const base = (draftHabit && draftHabit.id === targetId) ? draftHabit : pickerHabit;
                  return [
                    ...prev,
                    {
                      ...base,
                      id: targetId,
                      icon: finalIcon,
                      iconId: finalIcon,
                      color: finalColor,
                      iconColor: finalColor,
                      iconBackgroundColor,
                      iconStyle: iconStyle || 'circle',
                      userTarget0: base.userTarget0 !== undefined ? base.userTarget0 : (base.target0 ?? 0),
                      userTarget100: base.userTarget100 !== undefined ? base.userTarget100 : (base.target100 ?? 100),
                      direction: base.direction || 'higher_is_better'
                    }
                  ];
                }
              });

              // 4. Update in customHabits
              setCustomHabits(prev => prev.map(h => h.id === targetId ? { 
                ...h, 
                icon: finalIcon, 
                iconId: finalIcon, 
                color: finalColor, 
                iconColor: finalColor,
                iconBackgroundColor,
                iconStyle: iconStyle || 'circle'
              } : h));
              setPickerHabit(prev => prev ? { 
                ...prev, 
                icon: finalIcon, 
                iconId: finalIcon, 
                color: finalColor, 
                iconColor: finalColor,
                iconBackgroundColor,
                iconStyle: iconStyle || 'circle'
              } : null);
            } else {
              setCbIcon(finalIcon);
              setCbColor(finalColor);
            }
            setShowIconPickerModal(false);
          }}
        />

        {/* SCORING MODAL */}
        <ScoringModal type={scoringModal} onClose={() => setScoringModal(null)} />

        {/* BINARY GOAL EXPLAINER MODAL */}
        <BinaryGoalExplainerModal isOpen={showBinaryExplainer} onClose={() => setShowBinaryExplainer(false)} />

        {/* IN-APP NOTICE MODAL (DARK & LIGHT THEME OPTIMIZED) */}
        {noticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={() => setNoticeModal(null)}>
            <div 
              className="w-full max-w-sm bg-white dark:bg-[#151a26] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Icon name="info" className="text-2xl" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">{noticeModal.title}</h3>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">{noticeModal.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {noticeModal.message}
              </p>
              <div className="flex gap-2.5 pt-2">
                {noticeModal.actionText && (
                  <button
                    type="button"
                    onClick={() => {
                      const act = noticeModal.onAction;
                      setNoticeModal(null);
                      if (act) act();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    {noticeModal.actionText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNoticeModal(null)}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    noticeModal.actionText 
                      ? 'px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
                  }`}
                >
                  {noticeModal.closeText || 'OK'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

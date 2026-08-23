import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Target, X, ChartBar, Lightbulb, Lightning, Sparkle } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { calculateScore } from '../lib/scoring';
import Icon from '../components/Icon';
import PriorityIcon from '../components/PriorityIcon';
import HabitIcon from '../components/HabitIcon';
import ScoringModal from '../components/ScoringModal';
import ProModal from '../components/ProModal';
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
  const localMax = isTime ? 1440 : (isDecimalUnit ? 20 : (Math.max(100, target0 * 1.5, target100 * 1.5)));
  const step = isDecimalUnit ? 0.1 : 1;

  const [glowTarget, setGlowTarget] = useState(null);
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
      <div className="flex flex-col items-center w-full">
        <div className={`border ${borderColor} rounded-2xl p-3 bg-surface flex flex-col items-center w-full transition-all duration-300 shadow-xs`}>
          <span className={`px-3 py-1 rounded-md text-xs font-bold mb-2.5 ${badgeBg}`}>
            {label}
          </span>
          {isTime ? (
            <div className="relative w-full">
              <input 
                type="time"
                className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-2 py-2.5 w-full text-center font-bold text-base sm:text-lg focus:border-primary focus:outline-none transition-colors" 
                value={formatTimeStr(value)} 
                onChange={e => onChange(field, parseTimeStr(e.target.value))} 
              />
            </div>
          ) : showHM ? (
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center justify-center w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-2.5 py-2">
                <div className="flex items-center justify-center flex-1 min-w-0">
                  <input 
                    type="number" min="0" max="23"
                    className="bg-transparent w-full text-center font-bold text-base sm:text-lg focus:outline-none focus:text-primary py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={getH(value) || ''} 
                    placeholder="0"
                    onChange={e => updateHM(field, value, 'h', e.target.value)} 
                  />
                  <span className="text-xs text-on-surface-variant font-bold ml-1 shrink-0">h</span>
                </div>
                <div className="text-outline-variant/60 font-bold px-1.5">:</div>
                <div className="flex items-center justify-center flex-1 min-w-0">
                  <input 
                    type="number" min="0" max="59"
                    className="bg-transparent w-full text-center font-bold text-base sm:text-lg focus:outline-none focus:text-primary py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={getM(value) !== undefined && getM(value) !== null ? getM(value) : ''} 
                    placeholder="00"
                    onChange={e => updateHM(field, value, 'm', e.target.value)} 
                  />
                  <span className="text-xs text-on-surface-variant font-bold ml-1 shrink-0">m</span>
                </div>
              </div>
              <div className="text-center text-xs font-bold text-primary mt-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {getH(value)}h {getM(value)}m
              </div>
            </div>
          ) : (
            <div className="relative w-full flex flex-col items-center">
              <div className="flex items-center justify-center w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                <input 
                  type="number" 
                  step={isDecimalUnit ? "0.1" : "1"}
                  className="bg-transparent w-full text-center font-bold text-lg sm:text-xl focus:outline-none" 
                  value={value !== undefined && value !== null ? value : ''} 
                  onChange={e => onChange(field, isDecimalUnit ? parseFloat(e.target.value) || 0 : Math.round(parseFloat(e.target.value)) || 0)} 
                />
                {resolvedUnit && (
                  <span className="text-xs sm:text-sm font-bold text-primary ml-1 shrink-0">
                    {resolvedUnit}
                  </span>
                )}
              </div>
              {resolvedUnit && (
                <div className="text-center text-xs font-bold text-primary mt-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {value} {resolvedUnit}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-[11px] text-on-surface-variant mt-2 font-medium">
          {isTime ? (isRed ? 'Late Limit (0%)' : 'Ideal Time (100%)') : (isRed ? 'Start Floor (0%)' : 'Target Goal (100%)')}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-4 mb-2">
      <div className="flex justify-between items-start gap-4 mb-6">
        <InputCard field="target0" label="0% Score" value={target0} isRed={true} />
        <InputCard field="target100" label="100% Score" value={target100} isRed={false} />
      </div>
      
      {!isTime && (
        <>
          <div className="flex items-center gap-3 w-full mt-2">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                startHolding('target100', -step);
              }}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              onPointerCancel={stopHolding}
              className="w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-variant active:scale-90 flex items-center justify-center text-on-surface font-bold transition-all border border-outline-variant/40 select-none touch-none shrink-0 shadow-xs cursor-pointer"
              title="Decrease Target (-1 unit)"
              aria-label="Decrease Target"
            >
              <Icon name="remove" className="text-[18px]" />
            </button>

            <div className="dual-slider-container flex-1">
              <div className="dual-slider-track" style={{ background: bg }} />
              <input 
                type="range"
                min={0} max={localMax} step={isDecimalUnit ? 0.1 : 1}
                value={target0}
                onChange={e => handleSliderChange('target0', Number(e.target.value))}
                className="dual-slider-input"
                style={{ '--thumb-color': '#ef4444', zIndex: target0 > target100 ? 4 : 3 }}
              />
              <input 
                type="range"
                min={0} max={localMax} step={isDecimalUnit ? 0.1 : 1}
                value={target100}
                onChange={e => handleSliderChange('target100', Number(e.target.value))}
                className="dual-slider-input"
                style={{ '--thumb-color': '#22c55e', zIndex: target100 > target0 ? 4 : 3 }}
              />
            </div>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                startHolding('target100', step);
              }}
              onPointerUp={stopHolding}
              onPointerLeave={stopHolding}
              onPointerCancel={stopHolding}
              className="w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-variant active:scale-90 flex items-center justify-center text-on-surface font-bold transition-all border border-outline-variant/40 select-none touch-none shrink-0 shadow-xs cursor-pointer"
              title="Increase Target (+1 unit)"
              aria-label="Increase Target"
            >
              <Icon name="add" className="text-[18px]" />
            </button>
          </div>

          <div className="text-[10px] text-center text-on-surface-variant mt-2.5 opacity-80 font-medium">
            Drag red/green knobs or tap + / - to adjust in {resolvedUnit || 'units'}
          </div>
        </>
      )}
    </div>
  );
};

const MAX_FREE_HABITS = 8;
const MAX_CUSTOM_HABITS = 5;

export default function AdvancedHabitSelector() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { habits: existingHabits = [], refreshData, userDoc } = useData();

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('selection');
  const [prioritiesLocked, setPrioritiesLocked] = useState(false);
  const [priorityLockDays, setPriorityLockDays] = useState(0); // 'locked', 'selection', 'summary'
  const [lockDaysRemaining, setLockDaysRemaining] = useState(0);
  const [expandedSelectedHabits, setExpandedSelectedHabits] = useState([]);
  const [priorityRanks, setPriorityRanks] = useState({});
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [draftHabit, setDraftHabit] = useState(null);
  
  // Use static predefined habits
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

  // Custom Habit Builder State
  const [cbName, setCbName] = useState('');
  const [cbType, setCbType] = useState('yn');
  const [cbUnit, setCbUnit] = useState('L');
  const [cbUnitCustom, setCbUnitCustom] = useState('');
  const [cbDirection, setCbDirection] = useState('');
  const [cbFloor, setCbFloor] = useState(0);
  const [cbTarget, setCbTarget] = useState(10);
  const [cbTolerance, setCbTolerance] = useState(false);
  
  // Choose What You Want feature toggles
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
    ? habitLibrary.filter(h => selectedHabits.some(sh => sh.id === h.id))
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
        alert("You have an unsaved custom habit. Please click 'Add to Plan' first, or clear the Habit Name field.");
        return;
      }
      if (selectedHabits.length + customHabits.length === 0) {
        alert("Please select at least 1 habit to save your plan.");
        return;
      }
      setViewMode('summary');
      window.scrollTo(0, 0);
    } else if (viewMode === 'summary') {
      const isSuperAdmin = currentUser?.email?.toLowerCase() === 'dummytest2025@example.com';
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
      for (const habit of allToSave) {
        const userHabitRef = doc(db, 'users', currentUser.uid, 'habits', habit.id);
        const habitData = {
          habitLibraryId: habit.isCustom ? 'custom' : habit.id,
          name: habit.name || 'Unnamed',
          category: habit.category || 'Other',
          icon: habit.icon || 'star',
          scoringType: habit.scoringType || 'number',
          direction: habit.direction || 'higher_is_better',
          unit: habit.unit || '',
          target100: habit.userTarget100 !== undefined ? habit.userTarget100 : null,
          target0: habit.userTarget0 !== undefined ? habit.userTarget0 : null,
          tolerance: habit.userTolerance !== undefined ? habit.userTolerance : 0,
          isActive: true,
          priority: 'medium',
          createdAt: new Date().toISOString(),
          isCustom: !!habit.isCustom,
          priorityRank: priorityRanks[habit.id] || null,
          prioritySetAt: priorityRanks[habit.id] ? new Date().toISOString() : null
        };
        
        // Remove any undefined values just to be absolutely safe
        Object.keys(habitData).forEach(key => habitData[key] === undefined && delete habitData[key]);

        await setDoc(userHabitRef, habitData);
      }

      // Save Choose What You Want feature toggles to user settings
      if (currentUser?.uid) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { enabledFeatures }, { merge: true });
      }

      await refreshData();
      const hasSetPriorities = Object.values(priorityRanks).some(rank => !!rank);
      if (hasSetPriorities) {
        alert("Your plan has been saved successfully!\n\nYour priorities are now locked for 30 days to build consistency and cannot be changed during this period.");
      } else {
        alert("Your plan has been saved successfully!");
      }
      navigate('/');
    } catch (error) {
      console.error("Error saving habits:", error);
      alert("Failed to save habits.");
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
        // Re-calculate ranks to keep them contiguous 1,2,3
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
    if (expandedHabitId === habit.id) return;
    const isExisting = existingHabits.some(h => h.id === habit.id);
    if (isExisting) {
      alert("You are already tracking this habit. To manage existing habits, go to your Profile.");
      return;
    }
    const existingSelected = selectedHabits.find(h => h.id === habit.id);
    if (existingSelected) {
        setDraftHabit({ ...existingSelected });
    } else {
        const newSelections = selectedHabits.filter(sh => !existingHabits.some(eh => eh.id === sh.id));
        const totalHabitsCount = existingHabits.length + newSelections.length + customHabits.length;
        if (totalHabitsCount >= 9 && (!userDoc || !userDoc.isPro)) {
            setPaywallSource("total_habits_limit");
            setShowPaywall(true);
            return;
        }
        
        // Setup defaults
        const newHabit = {
            ...habit,
            userTarget0: habit.target0 !== undefined ? habit.target0 : 0,
            userTarget100: habit.target100 !== undefined ? habit.target100 : 100,
            userTolerance: 0,
            direction: habit.direction || 'higher_is_better'
        };
        // Normalize fields for draft so the slider reads target and floor
        newHabit.target = newHabit.userTarget100;
        newHabit.floor = newHabit.userTarget0;

        setDraftHabit(newHabit);
    }
    setExpandedHabitId(habit.id);
  };

  const handleDoneConfig = (e) => {
    if (e) e.stopPropagation();
    if (!draftHabit) return;
    
    // Convert back target/floor to userTarget0/100 if needed by saving logic
    const finalHabit = {
        ...draftHabit,
        userTarget100: draftHabit.target,
        userTarget0: draftHabit.floor
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
    setSelectedHabits(prev => prev.filter(h => h.id !== habitId));
    setExpandedHabitId(null);
    setDraftHabit(null);
  };

  const handleHabitInputChange = (habitId, field, value) => {
    setSelectedHabits(selectedHabits.map(h => {
      if (h.id === habitId) {
        return { ...h, [field]: value };
      }
      return h;
    }));
  };

  const addCustomHabit = (e) => {
    e.stopPropagation();

    if (!cbName.trim()) { alert("Please enter a Habit Name"); return; }
    if (cbType === 'duration' && cbUnit === 'custom' && !cbUnitCustom.trim()) { alert("Please enter a custom unit label"); return; }
    if (cbType !== 'yn' && cbType !== 'time' && !cbDirection) { alert("Please select whether Higher or Lower is better"); return; }
    if (cbType !== 'yn' && (cbFloor === '' || cbTarget === '')) { alert("Please enter both 0% and 100% scores"); return; }

    const newSelections = selectedHabits.filter(sh => !existingHabits.some(eh => eh.id === sh.id));
    const totalHabitsCount = existingHabits.length + newSelections.length + customHabits.length;

    const existingCustomsCount = existingHabits.filter(h => h.id.startsWith('custom_') || h.category === 'Custom').length;
    if (customHabits.length + existingCustomsCount >= MAX_CUSTOM_HABITS && !userDoc?.isPro) {
      setPaywallSource("custom_habit_creation");
      setShowPaywall(true);
      return;
    }
    if (totalHabitsCount >= 9 && !userDoc?.isPro) {
      setPaywallSource("total_habits_limit");
      setShowPaywall(true);
      return;
    }

    const name = cbName.trim();
    let unit = cbUnit === 'custom' ? cbUnitCustom.trim() : cbUnit;
    if (cbType === 'duration' && (unit === 'hrs' || unit === 'mins')) {
      unit = 'minutes';
    }
    
    let scoringType = 'numeric';
    if (cbType === 'yn') scoringType = 'binary';
    else if (cbType === 'time') scoringType = 'time';

    const CUSTOM_DEDICATED_ICONS = ['rocket_launch', 'emoji_events', 'workspace_premium', 'local_fire_department', 'star'];
    const totalCustomCount = customHabits.length + existingHabits.filter(h => h.id.startsWith('custom_') || h.category === 'Custom').length;
    const icon = CUSTOM_DEDICATED_ICONS[totalCustomCount % CUSTOM_DEDICATED_ICONS.length];

    const parseTime = (val) => {
      if (typeof val === 'string' && val.includes(':')) {
        const [h, m] = val.split(':').map(Number);
        return h * 60 + m;
      }
      return parseFloat(val) || 0;
    };

    const newCustom = {
      id: `custom_${Date.now()}`,
      name,
      category: 'Custom',
      icon,
      scoringType,
      direction: cbType === 'yn' ? 'higher_is_better' : (cbType === 'time' ? 'lower_is_better' : (cbDirection === 'lower' ? 'lower_is_better' : 'higher_is_better')),
      unit: cbType === 'yn' ? '' : (cbType === 'time' ? 'Time' : unit),
      userTarget0: cbType === 'time' ? parseTime(cbFloor) : Math.round(parseFloat(cbFloor) || 0),
      userTarget100: cbType === 'time' ? parseTime(cbTarget) : Math.round(parseFloat(cbTarget) || 0),
      userTolerance: cbTolerance ? 10 : 0,
      isCustom: true
    };

    setCustomHabits([...customHabits, newCustom]);
    setCbName('');
    setCbTolerance(false);
  };

  const deleteCustomHabit = (id, e) => {
    e.stopPropagation();
    setCustomHabits(customHabits.filter(h => h.id !== id));
  };

  const renderHabitInputs = (h) => {
    const isExpanded = expandedHabitId === h.id;
    if (!isExpanded) return null;
    
    const selectedObj = draftHabit;
    if (!selectedObj) return null;

    const updateDraft = (field, val) => {
       setDraftHabit(prev => ({ ...prev, [field]: val }));
    };

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
          {h.scoringType === 'time' && (
            <div className="mb-6 w-full">
              <label className="text-sm font-bold text-on-surface-variant mb-3 block">Scoring Logic</label>
              <div className="bg-[#0B1120] text-white rounded-xl p-3 text-[13px] font-bold flex items-center gap-2 shadow-sm">
                <Icon name="trending_down" className="text-[16px]" /> 
                Early is Better (Before Target = 100%)
              </div>
            </div>
          )}

          {h.scoringType !== 'time' && selectedObj.direction && (
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
            target0={selectedObj.floor} 
            target100={selectedObj.target} 
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
            className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
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
        
        {/* ── Top Bar (Back & Scoring Guide) ── */}
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
            {/* ── Title & Lock Notice ── */}
            <div className="mb-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Choose Your Daily Habits
              </h1>
              <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 font-black mt-0.5 flex items-center gap-1">
                <span>🔒 Habits lock for 30 days once your plan is saved</span>
              </p>
            </div>

            {/* ── 3 Main View Tabs (All Habits, Selected, + Custom) ── */}
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

            {/* ── Sub-Category Pills (Visible when in All Habits view) ── */}
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
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-2.5 px-4 font-black flex justify-between items-center mb-4 shadow-sm hover:opacity-90 transition-all cursor-pointer text-xs sm:text-sm active:scale-98"
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="add_circle" className="text-lg" />
                          <span>Create Custom Habit</span>
                        </div>
                        <Icon name="chevron_right" className="text-sm" />
                      </button>
                    )}

                    {activeCategories.includes('Custom') && (() => {
                      const isSuperAdmin = import.meta.env.DEV || currentUser?.email?.toLowerCase() === 'dummytest2025@example.com';
                      const isPro = userDoc?.isPro || userDoc?.tier === 'pro' || isSuperAdmin;
                      const existingCustomsCount = existingHabits.filter(h => h.id.startsWith('custom_') || h.category === 'Custom').length;
                      const totalCustoms = customHabits.length + existingCustomsCount;
                      const isFreeLimitReached = totalCustoms >= MAX_CUSTOM_HABITS;
                      const showProLocked = isFreeLimitReached && !isPro;

                      if (showProLocked) {
                        return (
                          <div className="flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-[#151a26] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl w-full" onClick={(e) => {
                            e.stopPropagation();
                            setPaywallSource("custom_habit_creation");
                            setShowPaywall(true);
                          }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5"><Icon name="add" className="text-base"/> Unlimited Custom Habits</span>
                              <span className="text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">PRO</span>
                            </div>
                            <p className="text-slate-500 text-xs max-w-[280px] mb-4 font-medium">You have added 5 Free Custom Habits. Upgrade to Pro to add unlimited custom habits.</p>
                            <button className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full px-5 py-2 font-black text-xs hover:opacity-90 transition-all cursor-pointer shadow-xs">
                              <Icon name="lock" className="text-sm" /> Upgrade to Pro
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="w-full bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                Create Custom Habit
                              </h3>
                              <span className="text-[9.5px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md shrink-0">
                                {isPro ? 'PRO' : `${Math.max(0, MAX_CUSTOM_HABITS - totalCustoms)} Free Left`}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setScoringModal('all'); }}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-primary text-[10.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                            >
                              <Icon name="help_outline" className="text-[12px] text-primary" /> 
                              <span>Scoring Rules</span>
                            </button>
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

                            {cbType !== 'yn' && (
                              <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    {cbType === 'time' ? 'Target Time (100% Score)' : 'Target Goal (100%)'}
                                  </label>
                                  <input 
                                    type={cbType === 'time' ? 'time' : 'number'}
                                    value={cbTarget} 
                                    onChange={e => setCbTarget(e.target.value)} 
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    {cbType === 'time' ? 'Missed Time (0% Score)' : 'Baseline (0% Score)'}
                                  </label>
                                  <input 
                                    type={cbType === 'time' ? 'time' : 'number'}
                                    value={cbFloor} 
                                    onChange={e => setCbFloor(e.target.value)} 
                                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                                  />
                                </div>
                              </div>
                            )}

                            <button 
                              type="button" 
                              onClick={addCustomHabit}
                              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs sm:text-sm hover:opacity-90 transition-all cursor-pointer shadow-xs mt-2"
                            >
                              Add to Plan
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* EXISTING CUSTOM HABITS */}
                    {(activeCategories.includes('Custom') || activeCategories.includes('Selected')) && customHabits.map(ch => {
                      const formatTargetStr = () => {
                        if (ch.scoringType === 'binary') return 'Type: Yes / No';
                        if (ch.scoringType === 'time') return `Target: ${formatTimeStr(ch.userTarget100)}`;
                        return `Target: ${ch.userTarget100} ${ch.unit || ''}`.trim();
                      };

                      return (
                        <div 
                          key={ch.id} 
                          className="ahs-habit-card selected bg-white dark:bg-[#151a26] border-2 border-slate-900 dark:border-white rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs w-full"
                        >
                          {/* Left Icon & Details */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <HabitIcon name={ch.icon || 'rocket_launch'} habitId={ch.id} boxed={true} size={16} className="!w-8 !h-8 !rounded-lg shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-xs sm:text-[13px] text-slate-900 dark:text-white truncate">
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

                          {/* Right Action Controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
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
                      );
                    })}

                    {/* RENDER HABIT LIBRARY (Not visible in Custom tab) */}
                    {displayedHabits.map(habit => {
                      const isSelected = selectedHabits.some(h => h.id === habit.id);
                      const isSelectedView = activeCategories.includes('Selected');
                      const isExpanded = expandedSelectedHabits.includes(habit.id);

                      if (isSelectedView) {
                         return (
                          <div key={habit.id} className="w-full bg-white dark:bg-[#151a26] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2 shadow-2xs">
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                 <HabitIcon name={habit.icon} habitId={habit.id} boxed={true} size={16} className="!w-8 !h-8 !rounded-lg shrink-0" />
                                 <div className="min-w-0 flex-1">
                                   <div className="font-black text-xs sm:text-[13px] text-slate-900 dark:text-white truncate">{habit.name}</div>
                                   <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{habit.category}</div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
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
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 ahs-habit-card-expanded">
                               {renderHabitInputs(habit)}
                            </div>
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
                                    <HabitIcon name={habit.icon} habitId={habit.id} boxed={true} size={22} className="!w-10 !h-10 !rounded-xl shrink-0" />
                                    <div className="ahs-hc-title">{habit.name}</div>
                                </div>
                                <div className="ahs-card-actions">
                                    <button className="ahs-btn-custom-scoring" onClick={(e) => { e.stopPropagation(); openScoringModalForHabit(habit); }}>
                                      <Icon name="help_outline" className="text-[12px]" /> Scoring
                                    </button>
                                    <div className="ahs-checkbox"><Icon name="check" className="text-sm text-white stroke-white stroke-2" /></div>
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
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3 px-4 sm:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 sm:px-6 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFlow}
                  disabled={selectedHabits.length + customHabits.length === 0}
                  className={`flex-1 sm:flex-initial px-5 sm:px-8 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    selectedHabits.length + customHabits.length > 0
                      ? 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
                    let hStr = Math.floor(mins / 60);
                    let mStr = Math.floor(mins % 60);
                    return `${hStr.toString().padStart(2, '0')}:${mStr.toString().padStart(2, '0')}`;
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

                return (
                  <div key={h.id} className="ahs-summary-item flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#151a26] shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <HabitIcon name={h.icon || 'star'} habitId={h.id} boxed={true} size={16} className="!rounded-lg shrink-0" />
                      <div className="ahs-si-details flex-1 min-w-0">
                          <div className="ahs-si-title font-black text-slate-900 dark:text-white text-xs sm:text-[13px] truncate">{h.name} {h.isCustom ? <span className="ahs-custom-badge">CUSTOM</span> : ''}</div>
                          <div className="ahs-si-target mt-1">
                              {h.scoringType === 'binary' ? (
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Type: Yes / No</span>
                              ) : h.scoringType === 'time' ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    Target: {formatReviewTime(h.userTarget100)}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    Target: {h.userTarget100} {habitUnit}
                                  </span>
                                </div>
                              )}
                          </div>
                      </div>
                    </div>
                    {showPrioritySection && (
                      <div className="ahs-si-check shrink-0">
                        <button 
                          onClick={() => togglePriorityRank(h.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-dashed transition-all cursor-pointer ${
                            priorityRanks[h.id] 
                              ? 'border-violet-400 bg-violet-50 text-violet-700' 
                              : Object.keys(priorityRanks).length >= 3 
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'border-slate-300 text-slate-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'
                          }`}
                        >
                          <span className="flex items-center justify-center">
                            {priorityRanks[h.id] 
                                ? `Priority #${priorityRanks[h.id]}` 
                                : <span className="text-sm">+</span>}
                          </span>
                          {!priorityRanks[h.id] && <span>Set Priority</span>}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Choose what you want feature control toggles (Only on first time setup) */}
            {showFeatureToggles && (
              <div className="mt-8 mb-6 p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                <h3 className="text-base font-bold text-slate-900 mb-1">Choose what you want</h3>
                <p className="text-xs text-slate-500 mb-4">Toggle optional analysis and reporting features for your journey.</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div>
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Icon name="insights" className="text-primary text-[18px]" />
                        7-Day Dynamic Insights
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Automated pattern recognition & momentum feed</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enabledFeatures.insights} 
                        onChange={(e) => setEnabledFeatures(prev => ({ ...prev, insights: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div>
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Icon name="auto_stories" className="text-primary text-[18px]" />
                        30-Day Better Report
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Comprehensive 30-day story documentary & growth analysis</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enabledFeatures.betterReport} 
                        onChange={(e) => setEnabledFeatures(prev => ({ ...prev, betterReport: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div>
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Icon name="analytics" className="text-primary text-[18px]" />
                        Habit Deep Dives
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Individual habit deep-dive metrics & timeline breakdown</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enabledFeatures.deepDives} 
                        onChange={(e) => setEnabledFeatures(prev => ({ ...prev, deepDives: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Bottom Actions Bar for Summary View */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3.5 px-4 sm:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                <button 
                  type="button"
                  onClick={() => setViewMode('selection')} 
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  Edit Selection
                </button>
                <button 
                  type="button"
                  onClick={handleSaveFlow} 
                  className="flex-1 sm:flex-initial px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  Save Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRIORITY LOCK MODAL */}
        {showPriorityLockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in" onClick={() => setShowPriorityLockModal(false)}>
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center gap-3 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shadow-xs">
                <Icon name="lock" filled={true} className="text-3xl text-amber-500" />
              </div>
              <h3 className="text-[18px] font-bold text-slate-900">Priorities Locked</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                You've already set your 3 core priorities. They are locked for <strong className="text-slate-700">{priorityLockDays} more days</strong> to keep you focused and consistent.
              </p>
              <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 mt-1 flex items-center justify-center gap-1.5">
                <Icon name="lock" filled={true} className="text-[14px] text-slate-500 shrink-0" />
                <p className="text-[12px] text-slate-500 font-medium">Come back in {priorityLockDays} days to update your priorities.</p>
              </div>
              <button onClick={() => setShowPriorityLockModal(false)} className="mt-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-[14px] hover:bg-slate-800 transition-colors cursor-pointer">
                Got it
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM SAVE MODAL */}
        {showConfirmSaveModal && (
          <div className="ahs-modal-overlay" onClick={() => setShowConfirmSaveModal(false)}>
            <div className="ahs-modal" onClick={e => e.stopPropagation()}>
              <Icon name="lock" className="text-5xl text-primary mx-auto mb-4" />
              <h3 className="text-red-500 font-bold">Lock Habits for 30 Days</h3>
              <p className="mb-6 mt-2 text-on-surface-variant">
                Your habits will be locked for 30 days to build consistency. You can add new habits later, but you cannot remove them during this time.
              </p>
              <button className="ahs-btn ahs-btn-primary flex justify-center items-center gap-2 w-full" onClick={() => {
                  setShowConfirmSaveModal(false);
                  executeSave();
              }}>
                Start Tracking
              </button>
              <button className="mt-4 text-sm font-bold text-on-surface-variant hover:text-on-surface w-full" onClick={() => setShowConfirmSaveModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PRIORITY INFO MODAL */}
        {showPriorityInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowPriorityInfo(false)}>
            <div 
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-[440px] md:max-w-[520px] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 custom-scrollbar"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F3F0FF] text-[#6C5CE7] flex items-center justify-center shrink-0">
                      <Target size={20} weight="fill" className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="text-[17px] sm:text-[19px] font-semibold text-[#1F2937] leading-tight">
                        Why Set <span className="text-[#6C5CE7]">Priorities</span>?
                      </h3>
                      <p className="text-[12px] sm:text-[13px] text-[#64748B] mt-0.5">Focus on what matters most.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPriorityInfo(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>
    
                <div className="flex flex-col gap-2.5 mt-2 mb-3">
                  <div className="bg-[#F3F0FF] rounded-xl p-3 sm:p-4 flex gap-3 relative overflow-hidden group border border-transparent hover:border-[#6C5CE7]/20 transition-colors">
                    <div className="text-[#6C5CE7] flex-shrink-0 mt-0.5">
                      <ChartBar size={20} weight="fill" />
                    </div>
                    <div className="flex-1 pr-5">
                      <h4 className="text-[14px] sm:text-[15px] font-medium text-[#1F2937] mb-0.5">Deeper Insights</h4>
                      <p className="text-[12px] sm:text-[13px] text-[#64748B] leading-[1.4]">Get detailed analytics, trends & recovery insights for your top 3 habits.</p>
                    </div>
                    <div className="absolute top-3 right-3 text-[12px] font-bold text-[#6C5CE7]/30">01</div>
                  </div>
    
                  <div className="bg-[#FFF7E6] rounded-xl p-3 sm:p-4 flex gap-3 relative overflow-hidden group border border-transparent hover:border-amber-400/20 transition-colors">
                    <div className="text-amber-500 flex-shrink-0 mt-0.5">
                      <Lightbulb size={20} weight="fill" />
                    </div>
                    <div className="flex-1 pr-5">
                      <h4 className="text-[14px] sm:text-[15px] font-medium text-[#1F2937] mb-0.5">Stronger Streaks</h4>
                      <p className="text-[12px] sm:text-[13px] text-[#64748B] leading-[1.4]">Track streaks, bounce-backs & recovery after missed days.</p>
                    </div>
                    <div className="absolute top-3 right-3 text-[12px] font-bold text-amber-500/30">02</div>
                  </div>
    
                  <div className="bg-[#E9FBEF] rounded-xl p-3 sm:p-4 flex gap-3 relative overflow-hidden group border border-transparent hover:border-emerald-500/20 transition-colors">
                    <div className="text-emerald-500 flex-shrink-0 mt-0.5">
                      <Lightning size={20} weight="fill" />
                    </div>
                    <div className="flex-1 pr-5">
                      <h4 className="text-[14px] sm:text-[15px] font-medium text-[#1F2937] mb-0.5">Bigger Impact</h4>
                      <p className="text-[12px] sm:text-[13px] text-[#64748B] leading-[1.4]">See how your priority habits influence your overall consistency.</p>
                    </div>
                    <div className="absolute top-3 right-3 text-[12px] font-bold text-emerald-500/30">03</div>
                  </div>
                </div>
    
                <div className="flex gap-2.5 items-center p-3 bg-[#F3F0FF]/60 rounded-xl mb-4">
                  <div className="text-[#6C5CE7] shrink-0">
                    <Sparkle size={18} weight="fill" />
                  </div>
                  <p className="text-[12px] sm:text-[13px] text-[#1F2937] leading-snug">Prioritize what matters. Progress where it counts.</p>
                </div>
    
                <button 
                  onClick={() => setShowPriorityInfo(false)}
                  className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5a4cdb] text-white font-medium text-[15px] rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCORING MODAL */}
        <ScoringModal type={scoringModal} onClose={() => setScoringModal(null)} />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { calculateScore } from '../lib/scoring';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import ScoringModal from '../components/ScoringModal';
import ProModal from '../components/ProModal';
import './AdvancedHabitSelector.css';

const DualRangeSlider = ({ target0, target100, onChange, direction, unit, isTime }) => {
  const [localMax, setLocalMax] = useState(() => {
    let base = 10;
    if (unit === 'minutes' || unit === 'hours' || unit === 'hrs' || unit === 'mins') base = 720;
    else if (unit === '%') base = 100;
    return Math.max(base, target0 * 1.5, target100 * 1.5);
  });
  const [glowTarget, setGlowTarget] = useState(null);
  
  useEffect(() => {
    if (target0 > localMax || target100 > localMax) {
      setLocalMax(Math.max(localMax, target0 * 1.5, target100 * 1.5));
    }
  }, [target0, target100]);

  const handleSliderChange = (field, value) => {
    onChange(field, value);
    if (value >= localMax) {
      if (navigator.vibrate) navigator.vibrate(50);
      setGlowTarget(field);
      setTimeout(() => setGlowTarget(null), 1000);
    } else {
      if (navigator.vibrate && Number.isInteger(value) && value % 5 === 0) {
        navigator.vibrate(10);
      }
    }
  };

  // Calculate percentages for visual track
  const p0 = Math.min(100, Math.max(0, (target0 / localMax) * 100));
  const p100 = Math.min(100, Math.max(0, (target100 / localMax) * 100));
  
  const minP = Math.min(p0, p100);
  const maxP = Math.max(p0, p100);

  const trackColor = 'var(--color-surface-container-high)';
  const greenHex = 'rgba(34, 197, 94, 0.3)';
  const redHex = 'rgba(239, 68, 68, 0.3)';
  
  // Track gradient represents the scoring zone
  let bg = '';
  if (direction === 'higher_is_better' || direction === 'higher') {
    // Score increases from target0 (red side) to target100 (green side)
    bg = `linear-gradient(to right, 
      ${trackColor} 0%, 
      ${trackColor} ${minP}%, 
      ${redHex} ${minP}%, 
      ${greenHex} ${maxP}%, 
      ${trackColor} ${maxP}%, 
      ${trackColor} 100%)`;
  } else {
    // Lower is better: score decreases from target100 (green side) to target0 (red side)
    bg = `linear-gradient(to right, 
      ${trackColor} 0%, 
      ${trackColor} ${minP}%, 
      ${greenHex} ${minP}%, 
      ${redHex} ${maxP}%, 
      ${trackColor} ${maxP}%, 
      ${trackColor} 100%)`;
  }

  const showHM = !isTime && (unit === 'minutes' || unit === 'hours' || unit === 'hrs' || unit === 'mins');

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
        <div className={`border ${borderColor} rounded-2xl p-2 sm:p-3 bg-surface flex flex-col items-center w-full transition-all duration-300`}>
          <span className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold mb-3 sm:mb-4 ${badgeBg}`}>
            {label}
          </span>
          {isTime ? (
            <div className="relative w-full">
              <input 
                type="time"
                className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-2 py-3 w-full text-center font-bold text-lg focus:border-primary focus:outline-none transition-colors" 
                value={formatTimeStr(value)} 
                onChange={e => onChange(field, parseTimeStr(e.target.value))} 
              />
            </div>
          ) : showHM ? (
            <div className="flex items-center justify-center w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-2 py-1 max-w-[140px]">
              <div className="relative flex-1 flex items-center justify-center">
                <input 
                  type="number" min="0" max="23"
                  className="bg-transparent w-full text-center font-bold text-base sm:text-lg focus:outline-none focus:text-primary transition-colors py-1 sm:py-2" 
                  value={getH(value) || ''} 
                  placeholder="00"
                  onChange={e => updateHM(field, value, 'h', e.target.value)} 
                />
                <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium ml-1">h</span>
              </div>
              <div className="text-outline-variant/50 font-bold mx-1">:</div>
              <div className="relative flex-1 flex items-center justify-center">
                <input 
                  type="number" min="0" max="59"
                  className="bg-transparent w-full text-center font-bold text-base sm:text-lg focus:outline-none focus:text-primary transition-colors py-1 sm:py-2" 
                  value={getM(value) || ''} 
                  placeholder="00"
                  onChange={e => updateHM(field, value, 'm', e.target.value)} 
                />
                <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium ml-1">m</span>
              </div>
            </div>
          ) : (
            <div className="relative w-full">
              <input 
                type="number" step="1"
                className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-3 w-full text-center font-bold text-lg focus:border-primary focus:outline-none transition-colors" 
                value={value ? Math.round(value) : ''} 
                onChange={e => onChange(field, Math.round(parseFloat(e.target.value)) || 0)} 
              />
              <div className="text-center text-xs text-on-surface-variant font-medium mt-2">{unit}</div>
            </div>
          )}
        </div>
        <div className="text-[11px] text-on-surface-variant mt-3 font-medium">
          {isTime ? (isRed ? 'Late Limit (0%)' : 'Ideal Time (100%)') : (isRed ? 'Start Range (0%)' : 'Target Range (100%)')}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-4 mb-2">
      <div className="flex justify-between items-start gap-4 mb-8">
        <InputCard field="target0" label="0% Score" value={target0} isRed={true} />
        <InputCard field="target100" label="100% Score" value={target100} isRed={false} />
      </div>
      
      {!isTime && (
        <>
          <div className="dual-slider-container">
            <div className="dual-slider-track" style={{ background: bg }} />
            <input 
              type="range"
              min={0} max={localMax} step={localMax > 50 ? 1 : 0.5}
              value={target0}
              onChange={e => handleSliderChange('target0', Number(e.target.value))}
              className="dual-slider-input"
              style={{ '--thumb-color': '#ef4444', zIndex: target0 > target100 ? 4 : 3 }}
            />
            <input 
              type="range"
              min={0} max={localMax} step={localMax > 50 ? 1 : 0.5}
              value={target100}
              onChange={e => handleSliderChange('target100', Number(e.target.value))}
              className="dual-slider-input"
              style={{ '--thumb-color': '#22c55e', zIndex: target100 > target0 ? 4 : 3 }}
            />
          </div>
          <div className="text-[10px] text-center text-on-surface-variant mt-3 opacity-80 font-medium">
            Target score is calculated within this range
          </div>
        </>
      )}
    </div>
  );
};

const MAX_FREE_HABITS = 8;
const MAX_CUSTOM_HABITS = 1;

export default function AdvancedHabitSelector() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { habits: existingHabits = [], refreshData, userDoc } = useData();

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('selection'); // 'locked', 'selection', 'summary'
  const [lockDaysRemaining, setLockDaysRemaining] = useState(0);
  const [expandedSelectedHabits, setExpandedSelectedHabits] = useState([]);
  
  // Use static predefined habits
  const habitLibrary = HABITS_SEED_DATA;
  
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [activeCategories, setActiveCategories] = useState(['Selected']);
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallSource, setPaywallSource] = useState("");
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [scoringModal, setScoringModal] = useState(null);

  // Custom Habit Builder State
  const [cbName, setCbName] = useState('');
  const [cbType, setCbType] = useState('yn');
  const [cbUnit, setCbUnit] = useState('L');
  const [cbUnitCustom, setCbUnitCustom] = useState('');
  const [cbDirection, setCbDirection] = useState('');
  const [cbFloor, setCbFloor] = useState(0);
  const [cbTarget, setCbTarget] = useState(10);
  const [cbTolerance, setCbTolerance] = useState(false);
  
  // Live Previews State
  const [previewHighVal, setPreviewHighVal] = useState(70);
  const [previewLowVal, setPreviewLowVal] = useState(30);

  useEffect(() => {
    async function init() {
      // 1. Check 30-Day Lock
      if (existingHabits.length > 0) {
        // Find the oldest habit to determine when the plan was created
        const oldestHabit = [...existingHabits].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))[0];
        if (oldestHabit && oldestHabit.createdAt) {
          const createdDate = new Date(oldestHabit.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 30) {
            setLockDaysRemaining(30 - diffDays);
            // setViewMode('locked');
          }
        }
      }
    }
    
    init();
  }, [existingHabits]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-surface">Loading...</div>;
  }

  const categories = ['Selected', 'All', ...new Set(habitLibrary.map(h => h.category)), 'Custom'];
  const displayedHabits = activeCategories.includes('Selected')
    ? habitLibrary.filter(h => selectedHabits.some(sh => sh.id === h.id))
    : activeCategories.includes('All') 
      ? habitLibrary 
      : habitLibrary.filter(h => activeCategories.includes(h.category));

  const openScoringModalForHabit = (habit) => {
    let type = 'all';
    if (habit.scoringType === 'time') type = 'target_time';
    else if (habit.scoringType === 'binary') type = 'yes_no';
    else if (habit.direction === 'lower_is_better') type = 'lower';
    else if (habit.direction === 'higher_is_better' || habit.scoringType === 'duration' || habit.scoringType === 'number') type = 'higher';
    setScoringModal(type);
  };

  const toggleHabit = (habit) => {
    const isSelected = selectedHabits.some(h => h.id === habit.id);
    const isExisting = existingHabits.some(h => h.id === habit.id);

    if (isExisting) {
        alert("You are already tracking this habit. To manage existing habits, go to your Profile.");
        return;
    }

    if (isSelected) {
      setSelectedHabits(selectedHabits.filter(h => h.id !== habit.id));
    } else {
      const newSelections = selectedHabits.filter(sh => !existingHabits.some(eh => eh.id === sh.id));
      const totalHabitsCount = existingHabits.length + newSelections.length + customHabits.length;
      
      if (totalHabitsCount >= 9 && !userDoc?.isPro) {
        setPaywallSource("total_habits_limit");
        setShowPaywall(true);
      } else {
        // Add default targets to the selected habit based on its config
        const newHabit = { 
          ...habit, 
          // Initialize user inputs
          userTarget0: habit.target0 !== undefined ? habit.target0 : 0,
          userTarget100: habit.target100 !== undefined ? habit.target100 : 100,
          userTolerance: 0,
          unit: habit.scoringType === 'duration' ? 'minutes' : (habit.defaultUnit || '')
        };
        setSelectedHabits([...selectedHabits, newHabit]);
      }
    }
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

    const CUSTOM_ICONS = ['star', 'bolt', 'local_fire_department', 'favorite', 'emoji_events', 'rocket_launch', 'psychology', 'self_improvement', 'directions_run', 'fitness_center'];
    const icon = CUSTOM_ICONS[customHabits.length % CUSTOM_ICONS.length];

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
      setShowConfirmSaveModal(true);
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
          isCustom: !!habit.isCustom
        };
        
        // Remove any undefined values just to be absolutely safe
        Object.keys(habitData).forEach(key => habitData[key] === undefined && delete habitData[key]);

        await setDoc(userHabitRef, habitData);
      }
      await refreshData();
      alert("Your plan has been saved successfully!");
      navigate('/');
    } catch (error) {
      console.error("Error saving habits:", error);
      alert("Failed to save habits.");
    }
  };

  const renderHabitInputs = (h) => {
    const isSelected = selectedHabits.some(sh => sh.id === h.id);
    if (!isSelected) return null;
    
    // Find the actual selected object to bind values
    const selectedObj = selectedHabits.find(sh => sh.id === h.id);
    if (!selectedObj) return null;

    if (h.scoringType === 'binary') {
      return (
        <div className="ahs-input-group mt-4">
          <label className="ahs-input-label">Type</label>
          <div className="ahs-form-control cursor-not-allowed bg-surface-variant/30">
            <input type="text" value="Yes / No" readOnly />
          </div>
        </div>
      );
    }

    if (h.scoringType === 'subjective') {
      return (
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
    }

    return (
      <div className="ahs-input-group mt-4" onClick={e => e.stopPropagation()}>
        {h.scoringType === 'time' ? (
          <div className="mb-6 w-full">
            <label className="text-sm font-bold text-on-surface-variant mb-3 block">Scoring Logic</label>
            <div className="bg-[#0B1120] text-white rounded-xl p-3 text-[13px] font-bold flex items-center gap-2 shadow-sm">
              <Icon name="trending_down" className="text-[16px]" /> 
              Early is Better (Before Target = 100%)
            </div>
          </div>
        ) : h.scoringType !== 'binary' && selectedObj.direction && (
          <div className="mb-6 w-full">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-on-surface-variant">Scoring Logic</label>
              <button 
                type="button"
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  document.getElementById('scoring-preview-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Icon name="help_outline" className="text-[12px]" /> How this works
              </button>
            </div>
            <div className="flex bg-surface border border-outline-variant/50 rounded-xl overflow-hidden shadow-sm">
              <button 
                type="button" 
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold text-[13px] transition-all duration-300 ${selectedObj.direction === 'higher_is_better' ? 'bg-[#0B1120] text-white' : 'bg-transparent text-on-surface hover:bg-surface-variant/30'}`} 
                onClick={(e) => { e.stopPropagation(); handleHabitInputChange(h.id, 'direction', 'higher_is_better'); }}
              >
                <Icon name="trending_up" className="text-[16px]" /> Higher is better
              </button>
              <button 
                type="button" 
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold text-[13px] transition-all duration-300 ${selectedObj.direction === 'lower_is_better' ? 'bg-[#0B1120] text-white' : 'bg-transparent text-on-surface hover:bg-surface-variant/30'}`} 
                onClick={(e) => { e.stopPropagation(); handleHabitInputChange(h.id, 'direction', 'lower_is_better'); }}
              >
                <Icon name="trending_down" className="text-[16px]" /> Lower is better
              </button>
            </div>
          </div>
        )}
        <div className="w-full">
          <DualRangeSlider 
            target0={selectedObj.userTarget0}
            target100={selectedObj.userTarget100}
            direction={selectedObj.direction}
            unit={selectedObj.unit}
            isTime={h.scoringType === 'time'}
            onChange={(field, value) => {
              if (field === 'target0') handleHabitInputChange(h.id, 'userTarget0', value);
              if (field === 'target100') handleHabitInputChange(h.id, 'userTarget100', value);
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="ahs-wrap">
      <div className="ahs-container">
        
        {/* Back Button */}
        <div className="ahs-header-top" onClick={handleBack}>
          <Icon name="arrow_back" /> Back
        </div>

        {viewMode === 'selection' && (
          <div id="view-selection">
            <header className="ahs-header-main">
              <div className="ahs-header-left">
                <h1>Choose Your Daily Habits</h1>
                <p className="text-red-500 font-bold mb-4">Habit will be locked for 30 days once saved</p>
                <div className="mb-6">
                    <button className="flex items-center gap-2 py-2 px-4 border border-outline-variant rounded-full font-bold text-on-surface hover:bg-surface-variant transition-colors" onClick={() => setScoringModal('all')}>
                        <Icon name="help_outline" /> How habit scoring logics works
                    </button>
                </div>
                <hr className="border-t-2 border-dashed border-gray-400 w-full mb-6" />
              </div>
            </header>

            <div className="ahs-filters-container w-full overflow-hidden mb-6">
                <div className="flex flex-wrap gap-2 w-full pb-2 justify-start sm:justify-center">
                    {['Selected', 'Habits by Category', 'Custom'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => {
                                const mappedCat = cat === 'Habits by Category' ? 'All' : cat;
                                setActiveCategories([mappedCat]);
                            }}
                            className={`ahs-pill ${cat === 'Selected' ? 'bg-primary/10 text-primary border-primary/30' : ''} ${cat === 'Custom' ? 'custom-pill' : ''} ${(activeCategories.includes(cat) || (cat === 'Habits by Category' && activeCategories.includes('All'))) ? 'active' : ''}`}
                        >
                            {cat === 'Selected' ? `Selected (${selectedHabits.length + customHabits.length})` : cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="ahs-layout-grid">
              <main>
                <div className="ahs-category-section">
                  <div className="ahs-habits-grid items-start">
                    
                    {/* CUSTOM HABIT BUILDER */}
                    {activeCategories.includes('Selected') && !activeCategories.includes('Custom') && (
                      <button 
                        onClick={() => setActiveCategories(['Custom'])}
                        className="w-full bg-black text-white rounded-xl py-4 px-5 font-bold flex justify-between items-center mb-6 shadow-md hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon name="add_circle" className="text-2xl" />
                          <span className="text-base">Create Custom Habit</span>
                        </div>
                        <Icon name="chevron_right" />
                      </button>
                    )}

                    {activeCategories.includes('Custom') && (() => {
                      const existingCustomsCount = existingHabits.filter(h => h.category === 'custom_' || h.category === 'Custom').length;
                      const isFreeUsed = (customHabits.length + existingCustomsCount) >= 1;
                      const isPro = userDoc?.isPro;
                      const showProLocked = isFreeUsed && !isPro;

                      if (showProLocked) {
                        return (
                          <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border-2 border-dashed border-outline-variant rounded-2xl hover:bg-surface-variant transition-colors cursor-pointer w-full h-[280px]" onClick={(e) => {
                            e.stopPropagation();
                            setPaywallSource("custom_habit_creation");
                            setShowPaywall(true);
                          }}>
                               <div className="flex items-center gap-2 mb-4">
                                  <span className="font-bold text-lg text-on-surface flex items-center gap-1"><Icon name="add" className="text-xl"/> Unlimited Habits</span>
                                  <span className="pro-badge">PRO</span>
                               </div>
                               <p className="text-on-surface-variant text-sm max-w-[250px] mb-6">Upgrade to unlock unlimited custom habits and tracking.</p>
                               <button className="flex items-center gap-2 border border-outline-variant rounded-full px-5 py-2 font-medium text-on-surface hover:bg-surface-variant transition-colors">
                                  <Icon name="lock" className="text-lg" /> Upgrade to Pro
                               </button>
                          </div>
                        );
                      }

                      return (
                        <div className="ahs-habit-card ahs-custom-builder" style={{borderStyle: 'dashed', borderColor: '#CBD5E1', padding: '16px'}} onClick={e => e.stopPropagation()}>
                          <div className="ahs-hc-top" style={{justifyContent: 'flex-end', marginBottom: '8px'}}>
                              <button className="ahs-btn-custom-scoring" onClick={(e) => { e.stopPropagation(); setScoringModal('all'); }}>
                                <Icon name="help_outline" className="text-[12px]" /> Scoring Rules
                              </button>
                          </div>
                          <div className="ahs-hc-title text-primary font-bold flex justify-between items-center">
                            <span>+ Create Custom Habit</span>
                          </div>
                          
                          <>
                              {!isFreeUsed && <div className="text-xs text-green-600 font-semibold mb-2 bg-green-50 w-fit px-2 py-1 rounded">One custom habit is free</div>}
                              <div className="ahs-input-group w-full">
                                  <label className="ahs-input-label">Habit Name</label>
                                  <div className="ahs-form-control">
                                    <input type="text" value={cbName} onChange={e => setCbName(e.target.value)} placeholder="e.g. Drink 2L Water" />
                                  </div>
                              </div>
                              <div className="ahs-input-group w-full">
                                  <label className="ahs-input-label">Type</label>
                                  <div className="ahs-form-control">
                                      <select value={cbType} onChange={e => setCbType(e.target.value)}>
                                          <option value="yn">Yes / No</option>
                                          <option value="duration">Duration / Number</option>
                                          <option value="time">Target Time</option>
                                      </select>
                                  </div>
                              </div>
                              
                              {cbType === 'duration' && (
                                <>
                                  <div className="ahs-input-group w-full">
                                      <label className="ahs-input-label">Unit</label>
                                      <div className="ahs-form-control">
                                          <select value={cbUnit} onChange={e => setCbUnit(e.target.value)}>
                                              <option value="L">Litres (L)</option>
                                              <option value="kg">Kilograms (kg)</option>
                                              <option value="mins">Minutes (mins)</option>
                                              <option value="hrs">Hours (hrs)</option>
                                              <option value="steps">Steps</option>
                                              <option value="pages">Pages</option>
                                              <option value="reps">Reps</option>
                                              <option value="custom">Custom...</option>
                                          </select>
                                      </div>
                                  </div>
                                  {cbUnit === 'custom' && (
                                    <div className="ahs-input-group w-full">
                                        <label className="ahs-input-label">Custom Unit Label</label>
                                        <div className="ahs-form-control"><input type="text" value={cbUnitCustom} onChange={e => setCbUnitCustom(e.target.value)} placeholder="e.g. cups, laps, pushups" /></div>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {cbType !== 'yn' && (
                                <>
                                  {cbType === 'time' ? (
                                    <div className="mb-6 w-full">
                                        <label className="text-sm font-bold text-on-surface-variant mb-3 block">Scoring Logic</label>
                                        <div className="bg-[#0B1120] text-white rounded-xl p-3 text-[13px] font-bold flex items-center gap-2 shadow-sm">
                                          <Icon name="trending_down" className="text-[16px]" /> 
                                          Early is Better (Before Target = 100%)
                                        </div>
                                    </div>
                                  ) : (
                                    <div className="mb-6 w-full">
                                        <div className="flex justify-between items-center mb-3">
                                          <label className="text-sm font-bold text-on-surface-variant">Scoring Logic</label>
                                          <button 
                                            type="button"
                                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              document.getElementById('scoring-preview-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                          >
                                            <Icon name="help_outline" className="text-[12px]" /> How this works
                                          </button>
                                        </div>
                                        <div className="flex bg-surface border border-outline-variant/50 rounded-xl overflow-hidden shadow-sm">
                                            <button 
                                              type="button" 
                                              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold text-[13px] transition-all duration-300 ${cbDirection === 'higher' ? 'bg-[#0B1120] text-white' : 'bg-transparent text-on-surface hover:bg-surface-variant/30'}`} 
                                              onClick={() => setCbDirection('higher')}
                                            >
                                              <Icon name="trending_up" className="text-[16px]" /> Higher is better
                                            </button>
                                            <button 
                                              type="button" 
                                              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold text-[13px] transition-all duration-300 ${cbDirection === 'lower' ? 'bg-[#0B1120] text-white' : 'bg-transparent text-on-surface hover:bg-surface-variant/30'}`} 
                                              onClick={() => setCbDirection('lower')}
                                            >
                                              <Icon name="trending_down" className="text-[16px]" /> Lower is better
                                            </button>
                                        </div>
                                    </div>
                                  )}
                                      <div className="w-full mt-4">
                                        <DualRangeSlider 
                                          target0={cbFloor}
                                          target100={cbTarget}
                                          direction={cbType === 'time' ? 'lower' : cbDirection}
                                          unit={cbType === 'time' ? 'mins' : cbUnitCustom || cbUnit}
                                          isTime={cbType === 'time'}
                                          onChange={(field, value) => {
                                            if (field === 'target0') setCbFloor(value);
                                            if (field === 'target100') setCbTarget(value);
                                          }}
                                        />
                                      </div>
                                </>
                              )}
                              <button className="ahs-btn ahs-btn-primary mt-4 h-[38px] text-[0.85rem]" onClick={addCustomHabit}>Add to Plan</button>
                          </>
                        </div>
                      );
                    })()}

                    {/* EXISTING CUSTOM HABITS */}
                    {(activeCategories.includes('Custom') || activeCategories.includes('Selected')) && customHabits.map(ch => {
                      const isSelectedView = activeCategories.includes('Selected');
                      const isExpanded = expandedSelectedHabits.includes(ch.id);

                      if (isSelectedView) {
                        return (
                          <div key={ch.id} className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col gap-3 shadow-sm mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded bg-gray-900 text-white flex items-center justify-center"><Icon name="star" className="text-sm" /></div>
                                 <div className="flex flex-col">
                                   <span className="font-bold text-on-surface text-sm sm:text-base">{ch.name}</span>
                                   <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Custom</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button onClick={(e) => { e.stopPropagation(); setExpandedSelectedHabits(prev => prev.includes(ch.id) ? prev.filter(id => id !== ch.id) : [...prev, ch.id]) }} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-800 transition-colors">
                                    <Icon name="edit" className="text-[16px]" />
                                 </button>
                                 <button onClick={(e) => deleteCustomHabit(ch.id, e)} className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors">
                                    <Icon name="close" className="text-[16px]" />
                                 </button>
                              </div>
                            </div>
                            {isExpanded && (
                               <div className="pt-3 border-t border-outline-variant/30 mt-1 flex flex-col gap-3">
                                  <div className="text-xs text-on-surface-variant font-medium">Type: {ch.scoringType} • {ch.unit} • {ch.direction}</div>
                                  <button className="text-xs font-bold flex items-center gap-1 text-primary hover:underline w-fit" onClick={(e) => { e.stopPropagation(); setScoringModal('all'); }}>
                                    <Icon name="help_outline" className="text-[12px]"/> Scoring Rules
                                  </button>
                               </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={ch.id} className="ahs-habit-card selected bg-gray-50 border-gray-800" onClick={(e) => deleteCustomHabit(ch.id, e)}>
                          <div className="ahs-hc-top">
                              <div className="ahs-hc-icon bg-gray-900 text-white"><Icon name="star" /></div>
                              <div className="ahs-card-actions">
                                  <button className="ahs-btn-custom-scoring" onClick={(e) => { e.stopPropagation(); setScoringModal('all'); }}>
                                    <Icon name="help_outline" className="text-[12px]" /> Scoring Rules
                                  </button>
                                  <div className="ahs-checkbox"><Icon name="check" className="text-sm text-white stroke-white stroke-2" /></div>
                              </div>
                          </div>
                          <div className="ahs-hc-title">{ch.name} <span className="ahs-custom-badge">CUSTOM</span></div>
                          <div className="text-xs text-on-surface-variant font-medium mb-2">Type: {ch.scoringType} • {ch.unit} • {ch.direction}</div>
                          <div className="text-xs font-bold text-red-500 mt-4 underline text-right cursor-pointer">Remove</div>
                        </div>
                      );
                    })}

                    {/* RENDER HABIT LIBRARY (Not visible in Custom tab) */}
                    {displayedHabits.map(habit => {
                      const isSelected = selectedHabits.some(h => h.id === habit.id);
                      // Determine background based on category
                      let bgClass = "bg-gray-900 text-white"; // Black and white theme
                      
                      const isSelectedView = activeCategories.includes('Selected');
                      const isExpanded = expandedSelectedHabits.includes(habit.id);

                      if (isSelectedView) {
                         return (
                          <div key={habit.id} className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex flex-col gap-3 shadow-sm mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center ${bgClass}`}><Icon name={habit.icon} className="text-sm" /></div>
                                 <span className="font-bold text-on-surface text-sm sm:text-base">{habit.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button onClick={(e) => { e.stopPropagation(); setExpandedSelectedHabits(prev => prev.includes(habit.id) ? prev.filter(id => id !== habit.id) : [...prev, habit.id]) }} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-800 transition-colors">
                                    <Icon name="edit" className="text-[16px]" />
                                 </button>
                                 <button onClick={(e) => { e.stopPropagation(); toggleHabit(habit); }} className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors">
                                    <Icon name="close" className="text-[16px]" />
                                 </button>
                              </div>
                            </div>
                            {isExpanded && (
                               <div className="pt-3 border-t border-outline-variant/30 mt-1 ahs-habit-card-expanded">
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
                          onClick={() => toggleHabit(habit)}
                        >
                            <div className="ahs-hc-header">
                                <HabitIcon name={habit.icon} habitId={habit.id} boxed={true} size={28} className="mb-2" />
                                <div className="ahs-card-actions">
                                    <button className="ahs-btn-custom-scoring" onClick={(e) => { e.stopPropagation(); openScoringModalForHabit(habit); }}>
                                      <Icon name="help_outline" className="text-[12px]" /> Scoring
                                    </button>
                                    <div className="ahs-checkbox"><Icon name="check" className="text-sm text-white stroke-white stroke-2" /></div>
                                </div>
                            </div>
                            <div className="ahs-hc-title">{habit.name}</div>
                            {renderHabitInputs(habit)}
                        </div>
                      );
                    })}

                  </div>
                </div>
              </main>
            </div>

            {/* LIVE PREVIEWS (Moved to Bottom) */}
            <div id="scoring-preview-section" className="ahs-live-preview mb-8 mt-8 border-t border-outline-variant/30 pt-8">
                <div className="mb-4">
                    <h3 className="font-headline-md font-bold flex items-center gap-2 text-indigo-800">
                        <Icon name="science" className="text-indigo-600" /> Live Scoring Preview
                    </h3>
                    <p className="text-sm opacity-80 mt-1">See how different values affect your daily score.</p>
                </div>
                
                <div className="ahs-previews-row">
                    <div className="ahs-preview-widget mb-6">
                        <div className="ahs-preview-header flex justify-between items-center mb-3">
                            <div className="ahs-preview-title font-bold flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-surface-variant text-on-surface flex items-center justify-center"><Icon name="trending_up" /></div>
                                Higher is Better
                            </div>
                            <div className="ahs-preview-score">
                                {Math.round(calculateScore('numeric', 'higher', previewHighVal, 100, 0))}% <span>Score</span>
                            </div>
                        </div>
                        <p className="text-xs opacity-70 mb-2 font-medium">Drag to simulate daily input (Target: 100, Floor: 20)</p>
                        <div className="ahs-slider-wrap w-full py-2">
                            <input 
                                type="range" min="0" max="150" value={previewHighVal} 
                                onChange={(e) => setPreviewHighVal(parseInt(e.target.value))}
                                className="ahs-slider w-full h-2 rounded-full appearance-none bg-surface-container cursor-pointer"
                                style={{ background: `linear-gradient(to right, var(--color-primary) ${(previewHighVal/150)*100}%, transparent 0)` }}
                            />
                        </div>
                        <div className="ahs-preview-labels flex justify-between text-xs opacity-60 mt-1">
                            <span>0 input</span>
                            <span className="font-bold opacity-100">{previewHighVal} entered</span>
                            <span>150+ input</span>
                        </div>
                    </div>

                    <div className="ahs-preview-widget mb-6">
                        <div className="ahs-preview-header flex justify-between items-center mb-3">
                            <div className="ahs-preview-title font-bold flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-surface-variant text-on-surface flex items-center justify-center"><Icon name="trending_down" /></div>
                                Lower is Better
                            </div>
                            <div className="ahs-preview-score font-mono-data text-xl font-bold">
                                {Math.round(calculateScore('numeric', 'lower_is_better', previewLowVal, 20, 100))}% <span className="text-sm font-normal opacity-70">Score</span>
                            </div>
                        </div>
                        <p className="text-xs opacity-70 mb-2 font-medium">Drag to simulate daily input (Target: 20, Floor: 100)</p>
                        <div className="ahs-slider-wrap w-full py-2">
                            <input 
                                type="range" min="0" max="150" value={previewLowVal} 
                                onChange={(e) => setPreviewLowVal(parseInt(e.target.value))}
                                className="ahs-slider w-full h-2 rounded-full appearance-none bg-surface-container cursor-pointer"
                                style={{ background: `linear-gradient(to right, var(--color-primary) ${(previewLowVal/150)*100}%, transparent 0)` }}
                            />
                        </div>
                        <div className="ahs-preview-labels flex justify-between text-xs opacity-60 mt-1">
                            <span>0 input</span>
                            <span className="font-bold opacity-100">{previewLowVal} entered</span>
                            <span>150+ input</span>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        )}

        {viewMode === 'summary' && (
          <div id="view-summary">
            <div className="ahs-summary-header mt-8">
                <h2>Review Your Plan</h2>
                <p>Check your targets before locking them in. You can click 'Edit Selection' below if needed.</p>
            </div>
            
            <div className="ahs-summary-list-container max-w-3xl mx-auto">
              {[...selectedHabits, ...customHabits].map(h => {
                const formatReviewTime = (mins) => {
                    if (typeof mins !== 'number' || isNaN(mins)) return '00:00';
                    let hStr = Math.floor(mins / 60);
                    let mStr = Math.floor(mins % 60);
                    return `${hStr.toString().padStart(2, '0')}:${mStr.toString().padStart(2, '0')}`;
                };
                return (
                <div key={h.id} className="ahs-summary-item flex items-center gap-4">
                    <HabitIcon name={h.icon || 'star'} habitId={h.id} boxed={true} size={20} />
                    <div className="ahs-si-details">
                        <div className="ahs-si-title">{h.name} {h.isCustom ? <span className="ahs-custom-badge">CUSTOM</span> : ''}</div>
                        <div className="ahs-si-target">
                            {h.scoringType === 'binary' ? 'Type: Yes / No' : h.scoringType === 'time' ? `Target: ${formatReviewTime(h.userTarget100)} (0%: ${formatReviewTime(h.userTarget0)})` : `Target: ${h.userTarget100} ${h.unit || ''} (0%: ${h.userTarget0})`}
                        </div>
                    </div>
                    <div className="ahs-si-check"><Icon name="check_circle" className="text-green-500 text-2xl" /></div>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
            {/* STICKY FOOTER */}
      <footer className="ahs-sticky-footer" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="flex w-full h-[4px] gap-[2px] bg-surface-variant/30">
             {[...Array(MAX_FREE_HABITS)].map((_, i) => (
                <div key={i} className={`flex-1 h-full transition-colors duration-300 ${i < (existingHabits.length + selectedHabits.length + customHabits.length) ? 'bg-primary' : 'bg-transparent'}`} />
             ))}
          </div>
          <div className="flex justify-center items-center w-full px-4 py-2 sm:px-6">
            <div className="ahs-sf-actions flex justify-center gap-4 w-full max-w-[400px]">
                <button 
                  className="ahs-btn ahs-btn-cancel text-xs sm:text-sm" 
                  onClick={() => viewMode === 'summary' ? setViewMode('selection') : navigate(-1)}
                >
                  {viewMode === 'summary' ? "Edit Selection" : "Cancel"}
                </button>
                <button className="ahs-btn ahs-btn-primary ahs-btn-save text-xs sm:text-sm" onClick={handleSaveFlow}>
                  {viewMode === 'summary' ? "Start Tracking" : "Review Plan"}
                </button>
            </div>
          </div>
      </footer>

      <ProModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        source={paywallSource} 
      />

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

      {/* SCORING MODAL */}
      <ScoringModal type={scoringModal} onClose={() => setScoringModal(null)} />
    </div>
  );
}

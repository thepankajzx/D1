import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { calculateScore } from '../lib/scoring';
import Icon from '../components/Icon';
import ScoringModal from '../components/ScoringModal';
import './AdvancedHabitSelector.css';

const MAX_FREE_HABITS = 8;
const MAX_CUSTOM_HABITS = 1;

export default function AdvancedHabitSelector() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { habits: existingHabits = [], refreshData, userDoc } = useData();

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('selection'); // 'locked', 'selection', 'summary'
  const [lockDaysRemaining, setLockDaysRemaining] = useState(0);
  
  const [habitLibrary, setHabitsLibrary] = useState([]);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [scoringModal, setScoringModal] = useState(null);

  // Custom Habit Builder State
  const [cbName, setCbName] = useState('');
  const [cbType, setCbType] = useState('yn');
  const [cbUnit, setCbUnit] = useState('L');
  const [cbUnitCustom, setCbUnitCustom] = useState('');
  const [cbDirection, setCbDirection] = useState('higher');
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

      // 2. Fetch Habit Library
      try {
        const querySnapshot = await getDocs(collection(db, 'habitLibrary'));
        const loadedHabits = [];
        querySnapshot.forEach((doc) => {
          loadedHabits.push({ id: doc.id, ...doc.data() });
        });
        setHabitsLibrary(loadedHabits);
      } catch (error) {
        console.error("Error fetching habit library:", error);
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, [existingHabits]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-surface">Loading...</div>;
  }

  const categories = ['All', ...new Set(habitLibrary.map(h => h.category)), 'Custom'];
  const displayedHabits = activeCategory === 'All' 
    ? habitLibrary 
    : habitLibrary.filter(h => h.category === activeCategory);

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
    if (isSelected) {
      if (lockDaysRemaining > 0 && existingHabits.some(h => h.id === habit.id)) {
        alert("Habits are locked for 30 days to build consistency. You cannot remove them yet. You may add new ones if slots are available.");
        return;
      }
      setSelectedHabits(selectedHabits.filter(h => h.id !== habit.id));
    } else {
      if (selectedHabits.length + customHabits.length >= MAX_FREE_HABITS) {
        setShowPaywall(true);
      } else {
        // Add default targets to the selected habit based on its config
        const newHabit = { 
          ...habit, 
          // Initialize user inputs
          userTarget0: habit.target0 !== undefined ? habit.target0 : 0,
          userTarget100: habit.target100 !== undefined ? habit.target100 : 100,
          userTolerance: 0
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
    if (cbType !== 'yn' && (cbFloor === '' || cbTarget === '')) { alert("Please enter both 0% and 100% scores"); return; }

    if (customHabits.length >= MAX_CUSTOM_HABITS && !userDoc?.isPro) {
      setShowPaywall(true);
      return;
    }
    if (selectedHabits.length + customHabits.length >= MAX_FREE_HABITS && !userDoc?.isPro) {
      setShowPaywall(true);
      return;
    }

    const name = cbName.trim();
    const unit = cbUnit === 'custom' ? cbUnitCustom.trim() : cbUnit;
    
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
      direction: cbType === 'yn' ? 'higher_is_better' : (cbDirection === 'lower' ? 'lower_is_better' : 'higher_is_better'),
      unit: cbType === 'yn' ? '' : (cbType === 'time' ? 'Time' : unit),
      userTarget0: cbType === 'time' ? parseTime(cbFloor) : (parseFloat(cbFloor) || 0),
      userTarget100: cbType === 'time' ? parseTime(cbTarget) : (parseFloat(cbTarget) || 0),
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

  const handleSaveFlow = async () => {
    if (viewMode === 'selection') {
      if (selectedHabits.length + customHabits.length === 0) {
        alert("Please select at least 1 habit to save your plan.");
        return;
      }
      if (window.confirm("Your habits will be locked for 30 days. You cannot remove them during this time.\n\nProceed to review?")) {
        setViewMode('summary');
        window.scrollTo(0, 0);
      }
    } else if (viewMode === 'summary') {
      try {
        const allToSave = [...selectedHabits, ...customHabits];
        for (const habit of allToSave) {
          const userHabitRef = doc(db, 'users', currentUser.uid, 'habits', habit.id);
          await setDoc(userHabitRef, {
            habitLibraryId: habit.isCustom ? 'custom' : habit.id,
            name: habit.name,
            category: habit.category,
            icon: habit.icon,
            scoringType: habit.scoringType,
            direction: habit.direction,
            unit: habit.unit,
            target100: habit.userTarget100,
            target0: habit.userTarget0,
            tolerance: habit.userTolerance || 0,
            isActive: true,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            isCustom: !!habit.isCustom
          });
        }
        await refreshData();
        navigate('/');
      } catch (error) {
        console.error("Error saving habits:", error);
        alert("Failed to save habits.");
      }
    }
  };

  const renderHabitInputs = (h) => {
    const isSelected = selectedHabits.some(sh => sh.id === h.id);
    if (!isSelected) return null;
    
    // Find the actual selected object to bind values
    const selectedObj = selectedHabits.find(sh => sh.id === h.id);

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
    
    if (h.scoringType === 'time') {
      // Simplistic handling for time: 0 = 00:00, target in minutes
      const formatTime = (mins) => {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
      };
      return (
        <div className="ahs-input-group mt-4" onClick={e => e.stopPropagation()}>
          <label className="ahs-input-label">Target Time (100% Score)</label>
          <div className="ahs-form-control">
            <input 
              type="time" 
              value={formatTime(selectedObj.userTarget100)} 
              onChange={e => {
                const [hh, mm] = e.target.value.split(':');
                handleHabitInputChange(h.id, 'userTarget100', parseInt(hh)*60 + parseInt(mm));
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="ahs-input-group mt-4" onClick={e => e.stopPropagation()}>
        <label className="ahs-input-label">Target (100% Score)</label>
        <div className="ahs-control-row">
          <div className="ahs-form-control">
            <input 
              type="number" 
              value={selectedObj.userTarget100} 
              onChange={e => handleHabitInputChange(h.id, 'userTarget100', parseFloat(e.target.value) || 0)}
            />
          </div>
          <span className="text-[0.85rem] text-on-surface-variant font-bold self-center">{h.unit}</span>
        </div>
        <label className="ahs-input-label mt-2">Baseline (0% Score)</label>
        <div className="ahs-control-row">
          <div className="ahs-form-control">
            <input 
              type="number" 
              value={selectedObj.userTarget0} 
              onChange={e => handleHabitInputChange(h.id, 'userTarget0', parseFloat(e.target.value) || 0)}
            />
          </div>
          <span className="text-[0.85rem] text-on-surface-variant font-bold self-center">{h.unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="ahs-wrap">
      <div className="ahs-container">
        
        {/* Back Button */}
        <div className="ahs-header-top" onClick={() => viewMode === 'summary' ? setViewMode('selection') : navigate(-1)}>
          <Icon name="arrow_back" /> Back
        </div>

        {viewMode === 'selection' && (
          <div id="view-selection">
            <header className="ahs-header-main">
              <div className="ahs-header-left">
                <h1>Choose Your Daily Habits</h1>
                <p>Select the habits you want to track. <span className="text-red-500 font-bold">Habits will be locked for 30 days once saved.</span></p>
                
                <div className="ahs-badges-row">
                  <span className="ahs-badge"><Icon name="insights" /> Smart Scoring</span>
                  <span className="ahs-badge"><Icon name="analytics" /> Personalized Insights</span>
                </div>
              </div>

              <div className="ahs-progress-widget">
                <div className="ahs-progress-top">
                  <div className="ahs-progress-text">
                    <h3>Selected Habits</h3>
                    <div className="ahs-count"><span>{selectedHabits.length + customHabits.length}</span><span> / 8</span></div>
                  </div>
                  <div 
                    className="ahs-progress-circle" 
                    style={{ background: `conic-gradient(var(--ahs-primary) ${Math.min(100, ((selectedHabits.length + customHabits.length)/MAX_FREE_HABITS)*100)}%, #E2E8F0 0)`}}
                  >
                    <div className="ahs-progress-inner">{Math.round(((selectedHabits.length + customHabits.length)/MAX_FREE_HABITS)*100)}%</div>
                  </div>
                </div>
                <p>You can select up to 8 habits on Free plan.</p>
              </div>
            </header>

            {/* LIVE PREVIEWS (Top) */}
            <div className="ahs-live-preview bg-indigo-50/70 text-indigo-950 shadow-sm border border-indigo-100 p-6 rounded-2xl mb-8">
                <div className="mb-4">
                    <h3 className="font-headline-md font-bold flex items-center gap-2 text-indigo-800">
                        <Icon name="science" className="text-indigo-600" /> Live Scoring Preview
                    </h3>
                    <p className="text-sm opacity-80 mt-1">See how different values affect your daily score.</p>
                </div>
                
                <div className="ahs-previews-row">
                    <div className="ahs-preview-widget border border-outline-variant/30 mb-4 bg-surface-container-low rounded-xl p-4">
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

                    <div className="ahs-preview-widget border border-outline-variant/30 bg-surface-container-low rounded-xl p-4">
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

            <div className="ahs-filters-container" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ahs-cat-pills">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`ahs-pill ${cat === 'Custom' ? 'custom-pill' : ''} ${activeCategory === cat ? 'active' : ''}`}
                  >
                    {cat === 'All' ? 'All Habits' : cat}
                  </button>
                ))}
              </div>
              
              <button className="ahs-btn-scoring" onClick={() => setScoringModal('all')}>
                <Icon name="help_outline" /> How Scoring Works
              </button>
            </div>

            <div className="ahs-layout-grid">
              <main>
                <div className="ahs-category-section">
                  <div className="ahs-habits-grid items-start">
                    
                    {/* CUSTOM HABIT BUILDER (Only visible in Custom tab) */}
                    {activeCategory === 'Custom' && (() => {
                      const isFreeUsed = customHabits.length >= 1;
                      const isPro = userDoc?.isPro;
                      const showProLocked = isFreeUsed && !isPro;

                      const getInferredScoringType = () => {
                          if (cbType === 'yn') return 'yes_no';
                          if (cbType === 'duration' && cbDirection === 'lower') return 'reverse_duration';
                          if (cbType === 'duration' && cbDirection === 'higher') return 'duration';
                          if (cbType === 'time') return 'target_time';
                          return 'all';
                      };

                      if (showProLocked) {
                        return (
                          <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border-2 border-dashed border-outline-variant rounded-2xl hover:bg-surface-variant transition-colors cursor-pointer w-full h-[280px]" onClick={e => {
                            e.stopPropagation();
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
                                  <div className="ahs-input-group w-full">
                                      <div className="flex justify-between items-center w-full">
                                        <label className="ahs-input-label">Scoring Direction</label>
                                        <button className="text-xs text-primary flex items-center gap-1 font-bold hover:underline" onClick={(e) => { e.stopPropagation(); setScoringModal('all'); }}>
                                          <Icon name="info" className="text-[14px]" /> How this works
                                        </button>
                                      </div>
                                      <div className="ahs-segment-control w-full justify-between mt-1">
                                          <button type="button" className={`ahs-seg-btn flex-1 ${cbDirection === 'higher' ? 'active' : ''}`} onClick={() => setCbDirection('higher')}>Higher is Better</button>
                                          <button type="button" className={`ahs-seg-btn flex-1 ${cbDirection === 'lower' ? 'active' : ''}`} onClick={() => setCbDirection('lower')}>Lower is Better</button>
                                      </div>
                                  </div>
                                  <div className="ahs-input-group w-full">
                                      <label className="ahs-input-label">0% Score (Baseline)</label>
                                      <div className="ahs-form-control">
                                        <input type={cbType === 'time' ? "time" : "number"} value={cbType === 'time' && typeof cbFloor === 'number' ? '' : cbFloor} onChange={e => setCbFloor(e.target.value)} />
                                      </div>
                                      <label className="ahs-input-label mt-2">100% Score (Target)</label>
                                      <div className="ahs-form-control">
                                        <input type={cbType === 'time' ? "time" : "number"} value={cbType === 'time' && typeof cbTarget === 'number' ? '' : cbTarget} onChange={e => setCbTarget(e.target.value)} />
                                      </div>
                                  </div>
                                </>
                              )}
                              <button className="ahs-btn ahs-btn-primary mt-4 h-[38px] text-[0.85rem]" onClick={addCustomHabit}>Add Habit</button>
                          </>
                        </div>
                      );
                    })()}

                    {/* EXISTING CUSTOM HABITS (Only visible in Custom tab) */}
                    {activeCategory === 'Custom' && customHabits.map(ch => (
                      <div key={ch.id} className="ahs-habit-card selected bg-gray-50 border-gray-800" onClick={(e) => deleteCustomHabit(ch.id, e)}>
                        <div className="ahs-hc-top">
                            <div className="ahs-hc-icon bg-surface-container-highest text-on-surface"><Icon name="star" /></div>
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
                    ))}

                    {/* RENDER HABIT LIBRARY (Not visible in Custom tab) */}
                    {activeCategory !== 'Custom' && displayedHabits.map(habit => {
                      const isSelected = selectedHabits.some(h => h.id === habit.id);
                      // Determine background based on category
                      let bgClass = "bg-surface-container-highest text-on-surface"; // Black and white theme

                      return (
                        <div 
                          key={habit.id} 
                          className={`ahs-habit-card ${isSelected ? 'selected' : ''}`} 
                          onClick={() => toggleHabit(habit)}
                        >
                            <div className="ahs-hc-top">
                                <div className={`ahs-hc-icon ${bgClass}`}><Icon name={habit.icon} /></div>
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

              {/* SIDEBAR */}
              <aside className="ahs-sidebar hidden md:flex">
                  <div className="ahs-side-card">
                      <div className="ahs-sc-title">Selection Summary</div>
                      <ul className="ahs-summary-list">
                          <li><Icon name="check_circle" className="ahs-text-success" /> <span>{selectedHabits.length + customHabits.length} Habits Selected</span></li>
                          <li><Icon name="inventory_2" /> <span className="ahs-text-primary">{Math.max(0, MAX_FREE_HABITS - (selectedHabits.length + customHabits.length))} Slots Remaining</span></li>
                      </ul>
                  </div>
                  <div className="ahs-side-card">
                      <div className="ahs-sc-title"><span className="text-amber-500">💡</span> Tips</div>
                      <ul className="text-sm text-on-surface-variant font-medium flex flex-col gap-3">
                          <li className="flex items-start gap-2"><Icon name="keyboard_arrow_right" className="text-lg" /> Be realistic with your targets.</li>
                          <li className="flex items-start gap-2"><Icon name="keyboard_arrow_right" className="text-lg" /> Consistency beats perfection.</li>
                          <li className="flex items-start gap-2"><Icon name="keyboard_arrow_right" className="text-lg" /> You can change habits after 30 days.</li>
                      </ul>
                  </div>
                  <div className="ahs-side-card ahs-warning-card">
                      <div className="ahs-sc-title"><Icon name="warning" /> 30 Days Warning</div>
                      <div className="ahs-sc-desc">You can only add or remove habits within 30 days of creating your plan.</div>
                  </div>
              </aside>
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
              {[...selectedHabits, ...customHabits].map(h => (
                <div key={h.id} className="ahs-summary-item">
                    <div className="ahs-hc-icon bg-surface-container-highest text-on-surface"><Icon name={h.icon || 'star'} /></div>
                    <div className="ahs-si-details">
                        <div className="ahs-si-title">{h.name} {h.isCustom ? <span className="ahs-custom-badge">CUSTOM</span> : ''}</div>
                        <div className="ahs-si-target">
                            {h.scoringType === 'binary' ? 'Type: Yes / No' : `Target: ${h.userTarget100} ${h.unit || ''} (0%: ${h.userTarget0})`}
                        </div>
                    </div>
                    <div className="ahs-si-check"><Icon name="check_circle" className="text-green-500 text-2xl" /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      <footer className="ahs-sticky-footer">
          <div className="ahs-sf-left">
              <div className="ahs-sf-warning-icon"><Icon name="lock" className="text-sm" /></div>
              <span className="ahs-sf-text-line">
                {viewMode === 'selection' ? "Habits will be locked for 30 days once saved" : "Review your targets before confirming"}
              </span>
          </div>
          <div className="ahs-sf-actions">
              <button 
                className="ahs-btn ahs-btn-cancel" 
                onClick={() => viewMode === 'summary' ? setViewMode('selection') : navigate(-1)}
              >
                {viewMode === 'summary' ? "Edit Selection" : "Cancel"}
              </button>
              <button className="ahs-btn ahs-btn-primary ahs-btn-save" onClick={handleSaveFlow}>
                {viewMode === 'summary' ? "Confirm & Start Tracking" : "Review Plan"}
              </button>
          </div>
      </footer>

      {/* PAYWALL MODAL */}
      {showPaywall && (
        <div className="ahs-modal-overlay" onClick={() => setShowPaywall(false)}>
          <div className="ahs-modal" onClick={e => e.stopPropagation()}>
            <Icon name="workspace_premium" className="text-5xl text-amber-500 mx-auto mb-4" />
            <h3>Upgrade to Pro</h3>
            <p>You have reached the limit of the Free plan. Upgrade to unlock unlimited custom habits and tracking.</p>
            <button className="ahs-btn ahs-btn-primary flex justify-center items-center gap-2" onClick={() => navigate('/subscription')}>View <span className="pro-badge">PRO</span> Plans</button>
            <button className="mt-4 text-sm font-bold text-on-surface-variant hover:text-on-surface" onClick={() => setShowPaywall(false)}>Maybe Later</button>
          </div>
        </div>
      )}

      {/* SCORING MODAL */}
      <ScoringModal type={scoringModal} onClose={() => setScoringModal(null)} />
    </div>
  );
}

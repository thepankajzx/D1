import { useState, useEffect, useMemo } from 'react';
import { calculateScore } from '../lib/scoring';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import { useNavigate } from 'react-router-dom';


// Helper to format minutes into HH:MM
function formatTime(minutes) {
  if (minutes == null) return "00:00";
  let h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper to parse HH:MM into minutes
function parseTime(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function HabitDetailSheet({ habit, allSummaries, onClose }) {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!allSummaries || allSummaries.length === 0) return null;
    
    const scores = allSummaries
      .filter(s => s.habitScores && s.habitScores[habit.id] !== undefined)
      .map(s => ({ date: s.id, score: s.habitScores[habit.id] }));
    
    if (scores.length === 0) return null;

    const values = scores.map(s => s.score);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const best = Math.max(...values);
    const worst = Math.min(...values);
    const bestDay = scores.find(s => s.score === best)?.date;
    const worstDay = scores.find(s => s.score === worst)?.date;

    // Consistency: days logged out of total tracked days
    const sortedDates = allSummaries.map(s => s.id).sort();
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const totalDays = Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1);
    const consistency = Math.round((scores.length / totalDays) * 100);

    return { avg, best, worst, bestDay, worstDay, consistency, trackedDays: scores.length };
  }, [allSummaries, habit.id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Modal Container */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
        />
        
        {/* Centered Popup */}
        <div className="relative w-full max-w-[90vw] sm:max-w-sm bg-surface rounded-[24px] shadow-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto flex flex-col z-[61]">
          {/* Title */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{habit.name}</h2>
            <button onClick={() => { if (navigator.vibrate) navigator.vibrate(50); onClose(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors">
              <Icon name="close" className="text-lg" />
            </button>
          </div>

        {stats ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Consistency */}
              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Consistency</span>
                <span className="text-xl font-bold text-primary">{stats.consistency}%</span>
                <span className="text-[10px] text-on-surface-variant">{stats.trackedDays} days logged</span>
              </div>

              {/* Best */}
              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-green-500 uppercase tracking-wider font-semibold">Best</span>
                <span className="text-xl font-bold text-on-surface">{stats.best}%</span>
                <span className="text-[10px] text-on-surface-variant">{formatDate(stats.bestDay)}</span>
              </div>

              {/* Worst */}
              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">Worst</span>
                <span className="text-xl font-bold text-on-surface">{stats.worst}%</span>
                <span className="text-[10px] text-on-surface-variant">{formatDate(stats.worstDay)}</span>
              </div>
            </div>

            {/* Average bar */}
            <div className="bg-surface-container-low rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-on-surface-variant font-medium">All-Time Average</span>
                <span className="text-sm font-bold text-on-surface">{stats.avg}%</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700"
                  style={{ 
                    width: `${stats.avg}%`,
                    backgroundColor: stats.avg >= 80 ? '#22c55e' : stats.avg >= 50 ? '#facc15' : '#ef4444'
                  }}
                />
              </div>
            </div>

            {/* View Full Analytics */}
            <button
              onClick={() => { if (navigator.vibrate) navigator.vibrate(50); onClose(); navigate(`/analytics?habit=${habit.id}`); }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Icon name="bar_chart" className="text-base" />
              View Full Analytics
            </button>
          </>
        ) : (
          <div className="text-center text-on-surface-variant py-8">
            <Icon name="bar_chart" className="text-4xl mb-2 opacity-40" />
            <p className="text-sm">No data logged yet for this habit.</p>
            <button
              onClick={() => { if (navigator.vibrate) navigator.vibrate(50); onClose(); navigate(`/analytics?habit=${habit.id}`); }}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Icon name="bar_chart" className="text-base" />
              View Full Analytics
            </button>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

export default function HabitCard({ habit, entry, onUpdate, allSummaries }) {
  // For binary habits: null = not answered, 1 = yes/done, 0 = no/not done
  const getInitialVal = () => {
    if (entry && entry.rawValue !== undefined) return entry.rawValue;
    if (habit.scoringType === 'binary') return null; // No default selection for binary
    return habit.target0 ?? 0;
  };
  const [val, setVal] = useState(getInitialVal);
  const [showDetail, setShowDetail] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  
  useEffect(() => {
    if (entry && entry.rawValue !== undefined) {
      setVal(entry.rawValue);
    }
  }, [entry]);

  const handleChange = (newRawVal) => {
    setVal(newRawVal);
    
    let adjustedVal = newRawVal;
    if (habit.scoringType === 'time' && habit.id.includes('sleep') && newRawVal < 12 * 60) {
      adjustedVal += 1440;
    }

    const computedScore = calculateScore(
      habit.scoringType, 
      habit.direction, 
      adjustedVal, 
      habit.target100, 
      habit.target0
    );
    
    const finalScore = computedScore !== null ? Math.max(0, Math.min(100, Math.round(computedScore))) : null;
    onUpdate(habit.id, newRawVal, finalScore);
  };

  const renderInput = () => {
    switch (habit.scoringType) {
      case 'binary': {
        return (
          <div className="relative flex w-full h-[36px] rounded-[10px] bg-surface-container-lowest border border-outline-variant/40 overflow-hidden group">
            {/* Background fills */}
            <div className={`absolute inset-y-0 left-0 w-1/2 bg-green-500 transition-all duration-300 ease-out origin-left ${val === 1 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} />
            <div className={`absolute inset-y-0 right-0 w-1/2 bg-red-500 transition-all duration-300 ease-out origin-right ${val === 0 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} />

            {/* Clickable halves */}
            <div className="absolute inset-0 flex">
              <button onClick={(e) => { e.stopPropagation(); if (navigator.vibrate) navigator.vibrate(50); handleChange(1); }} className="flex-1 flex items-center justify-center z-10 cursor-pointer">
                <span className={`font-semibold text-[13px] transition-colors duration-300 ${val === 1 ? 'text-white' : 'text-on-surface-variant group-hover:text-on-surface'}`}>Yes</span>
              </button>
              <div className="w-[1px] bg-outline-variant/30 z-10" />
              <button onClick={(e) => { e.stopPropagation(); if (navigator.vibrate) navigator.vibrate(50); handleChange(0); }} className="flex-1 flex items-center justify-center z-10 cursor-pointer">
                <span className={`font-semibold text-[13px] transition-colors duration-300 ${val === 0 ? 'text-white' : 'text-on-surface-variant group-hover:text-on-surface'}`}>No</span>
              </button>
            </div>

            {/* Center circle */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-300 z-20 pointer-events-none ${val !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              {val === 1 ? (
                <span className="text-green-600 font-bold text-[12px] leading-none mb-[1px]">✔</span>
              ) : (
                <span className="text-red-600 font-bold text-[10px] leading-none mb-[1px]">✖</span>
              )}
            </div>
          </div>
        );
      }
      case 'time':
        return (
          <div className="flex flex-col gap-2 flex-grow justify-end">
            <div className="flex justify-between text-xs text-on-surface-variant mb-2">
              <span>Target: {formatTime(habit.target100)}</span>
              <span>Baseline: {formatTime(habit.target0)}</span>
            </div>
            <div 
              className="relative flex items-center border border-outline-variant rounded-lg overflow-hidden focus-within:border-primary transition-colors cursor-pointer hover:bg-surface-variant/30"
              onClick={(e) => {
                // Trigger showPicker when clicking anywhere on the wrapper
                if (e.target.tagName !== 'INPUT') {
                  const input = e.currentTarget.querySelector('input[type="time"]');
                  if (input) {
                    try {
                      if (typeof input.showPicker === 'function') {
                        input.showPicker();
                      } else {
                        input.focus();
                        input.click();
                      }
                    } catch (err) {
                      input.focus();
                    }
                  }
                }
              }}
            >
              <input 
                type="time" 
                aria-label={`Time for ${habit.name}`}
                value={formatTime(val)}
                onChange={(e) => handleChange(parseTime(e.target.value))}
                onClick={(e) => {
                  try {
                    if (typeof e.target.showPicker === 'function') {
                      e.target.showPicker();
                    }
                  } catch (err) {}
                }}
                className="w-full bg-transparent border-none py-3 px-4 font-mono-data text-mono-data text-primary focus:ring-0 cursor-pointer outline-none" 
              />
              <div className="absolute right-4 pointer-events-none text-on-surface dark:text-white">
                <Icon name="schedule_filled" className="text-[20px]" />
              </div>
            </div>
          </div>
        );
      case 'subjective':
        return (
          <div className="flex flex-col w-full mt-3">
            <div className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-mono-data text-on-surface-variant font-medium shrink-0 w-[24px] text-right">1</span>
              <div className="flex-grow flex items-center h-5">
                <input 
                  type="range" 
                  aria-label={`Subjective score for ${habit.name}`}
                  min="1" max="10" step="1" 
                  value={val}
                  onChange={(e) => {
                     setVal(Number(e.target.value));
                     if (navigator.vibrate) navigator.vibrate(50);
                  }}
                  onPointerUp={(e) => handleChange(Number(e.target.value))}
                  onTouchEnd={(e) => handleChange(Number(e.target.value))}
                  className="subjective-slider w-full m-0 !h-[6px]" 
                />
              </div>
              <span className="text-[11px] font-mono-data text-on-surface-variant font-medium shrink-0 text-left min-w-[24px]">10</span>
            </div>
            <div className="text-center font-mono-data text-primary font-bold mt-2">
              {val}/10
            </div>
          </div>
        );
      case 'number':
      case 'duration':
      default:
        const mult = 1;
        const dVal = val * mult;
        const dTarget100 = (habit.target100 || 0) * mult;
        const dTarget0 = (habit.target0 || 0) * mult;
        
        const maxSlider = Math.max(dTarget100, dTarget0) > 0 
          ? Math.max(dTarget100, dTarget0) * 1.5 
          : 100;
        const minSlider = 0;
        
        const sliderStep = '1'; // Snap to whole numbers
        
        // Generate Dynamic Slider Track Background
        const generateGradient = () => {
          const t100_pct = Math.min(100, Math.max(0, (dTarget100 / maxSlider) * 100));
          const t0_pct = Math.min(100, Math.max(0, (dTarget0 / maxSlider) * 100));
          
          const greenHex = '#22c55e60'; // Green
          const redHex = '#ef444460'; // Red
          const trackColor = 'var(--color-surface-container-high)';
          
          if (habit.direction === 'higher_is_better') {
            // 0 -> t0: RED, t0 -> t100: TRACK, t100 -> 100: GREEN
            return `linear-gradient(to right, 
              ${redHex} 0%, 
              ${redHex} ${t0_pct}%, 
              ${trackColor} ${t0_pct}%, 
              ${trackColor} ${t100_pct}%, 
              ${greenHex} ${t100_pct}%, 
              ${greenHex} 100%)`;
          } else {
            // 0 -> t100: GREEN, t100 -> t0: TRACK, t0 -> 100: RED
            return `linear-gradient(to right, 
              ${greenHex} 0%, 
              ${greenHex} ${t100_pct}%, 
              ${trackColor} ${t100_pct}%, 
              ${trackColor} ${t0_pct}%, 
              ${redHex} ${t0_pct}%, 
              ${redHex} 100%)`;
          }
        };

        const currentDisplayUnit = habit.unit;
        
        return (
          <div className="flex flex-col w-full mt-3">
            
            
            <div className="flex items-center gap-3 w-full">
              {/* Slider Track */}
              <span className="text-[11px] font-mono-data text-on-surface-variant font-medium shrink-0 w-[24px] text-right">0</span>
              <div className="flex-grow flex items-center h-5">
                <input 
                  type="range" 
                  aria-label={`Target slider for ${habit.name}`}
                  min={minSlider} 
                  max={maxSlider} 
                  step={sliderStep}
                  value={dVal}
                  style={{ background: generateGradient() }}
                  onChange={(e) => {
                      const newValue = Math.round(Number(e.target.value));
                      const prevValue = Math.round(val * mult);
                      setVal(newValue / mult);

                      if (navigator.vibrate) {
                          const prevPct = (prevValue / maxSlider) * 100;
                          const newPct = (newValue / maxSlider) * 100;
                          if (Math.floor(newPct / 5) !== Math.floor(prevPct / 5)) {
                              navigator.vibrate(50);
                          }
                          if (
                            (prevValue < dTarget100 && newValue >= dTarget100) ||
                            (prevValue > dTarget100 && newValue <= dTarget100)
                          ) {
                              navigator.vibrate(50);
                          }
                      }
                  }}
                  onPointerUp={(e) => handleChange(Math.round(Number(e.target.value)) / mult)}
                  onTouchEnd={(e) => handleChange(Math.round(Number(e.target.value)) / mult)}
                  className="custom-slider w-full m-0 !h-[6px]" 
                />
              </div>
              <span className="text-[11px] font-mono-data text-on-surface-variant font-medium shrink-0 text-left min-w-[24px]">
                {Math.round(dTarget100)}
              </span>

                            {showManualInput && (
                <div className="relative flex items-center shrink-0 ml-1 gap-1">
                  {habit.scoringType === 'duration' ? (() => {
                    const isBaseHours = habit.unit?.toLowerCase().startsWith('h');
                    let hrs = 0;
                    let mins = 0;
                    if (isBaseHours) {
                      hrs = Math.floor(val);
                      mins = Math.round((val - hrs) * 60);
                    } else {
                      hrs = Math.floor(val / 60);
                      mins = Math.round(val % 60);
                    }
                    return (
                      <>
                        <input
                          type="number"
                          aria-label="Hours"
                          min="0"
                          value={hrs === 0 && mins === 0 ? '' : hrs}
                          placeholder="hr"
                          onChange={(e) => {
                            const newHrs = Number(e.target.value) || 0;
                            if (isBaseHours) {
                              setVal(newHrs + (mins / 60));
                            } else {
                              setVal((newHrs * 60) + mins);
                            }
                          }}
                          onBlur={(e) => {
                            const newHrs = Number(e.target.value) || 0;
                            if (isBaseHours) {
                              handleChange(newHrs + (mins / 60));
                            } else {
                              handleChange((newHrs * 60) + mins);
                            }
                          }}
                          className="w-10 h-8 bg-surface-container-lowest border border-outline-variant/60 rounded-[8px] px-1 py-1 text-center font-mono-data text-on-surface focus:border-primary focus:outline-none transition-colors text-[13px] font-bold"
                        />
                        <span className="text-[10px] text-on-surface-variant font-medium">h</span>
                        <input
                          type="number"
                          aria-label="Minutes"
                          min="0"
                          max="59"
                          value={hrs === 0 && mins === 0 ? '' : mins}
                          placeholder="min"
                          onChange={(e) => {
                            const newMins = Number(e.target.value) || 0;
                            if (isBaseHours) {
                              setVal(hrs + (newMins / 60));
                            } else {
                              setVal((hrs * 60) + newMins);
                            }
                          }}
                          onBlur={(e) => {
                            const newMins = Number(e.target.value) || 0;
                            if (isBaseHours) {
                              handleChange(hrs + (newMins / 60));
                            } else {
                              handleChange((hrs * 60) + newMins);
                            }
                          }}
                          className="w-10 h-8 bg-surface-container-lowest border border-outline-variant/60 rounded-[8px] px-1 py-1 text-center font-mono-data text-on-surface focus:border-primary focus:outline-none transition-colors text-[13px] font-bold"
                        />
                        <span className="text-[10px] text-on-surface-variant font-medium">m</span>
                      </>
                    );
                  })() : (
                    <input
                      type="number"
                      aria-label={`Target value for ${habit.name}`}
                      min="0"
                      step="1"
                      value={val === 0 ? '' : Math.round(dVal)}
                      placeholder="0"
                      onChange={(e) => setVal(Math.round(Number(e.target.value)) / mult)}
                      onBlur={(e) => handleChange(Math.round(Number(e.target.value)) / mult)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              e.currentTarget.blur();
                          }
                      }}
                      className="w-16 h-8 bg-surface-container-lowest border border-outline-variant/60 rounded-[8px] px-2 py-1 text-center font-mono-data text-on-surface focus:border-primary focus:outline-none transition-colors text-[13px] font-bold"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  const getScoreDisplay = () => {
    if (habit.scoringType === 'subjective') return null;
    if (habit.scoringType === 'binary' && val === null) return '--';
    if (entry && entry.computedScore !== undefined && entry.computedScore !== null) {
      return `${entry.computedScore}%`;
    }
    return '--%';
  };

  const formatDisplayValue = () => {
    if (habit.scoringType === 'time') return formatTime(val);
    if (habit.scoringType === 'binary') {
      if (val === null) return '—';
      return val === 1 ? 'Yes' : 'No';
    }
    if (habit.scoringType === 'subjective') return `${val}/10`;
    return `${val} ${habit.unit || ''}`.trim();
  };

  if (habit.scoringType === 'binary') {
    return (
      <>
        <div className="bg-surface premium-border rounded-[16px] p-3 flex flex-row items-center justify-between gap-3 w-full">
          {/* Left: Icon and Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} size={20} className="!rounded-[12px] shrink-0" />
            <h3 className="font-bold text-[15px] text-on-surface truncate">
              {habit.name}
            </h3>
          </div>
          
          {/* Right: Inline Input and Detail button */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <div className="w-[140px]" onClick={(e) => e.stopPropagation()}>
              {renderInput()}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); if (navigator.vibrate) navigator.vibrate(50); setShowDetail(true); }}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors"
              title="View details"
            >
              <Icon name="bar_chart" className="text-[16px]" />
            </button>
          </div>
        </div>
        {showDetail && (
          <HabitDetailSheet
            habit={habit}
            allSummaries={allSummaries || []}
            onClose={() => setShowDetail(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="bg-surface premium-border rounded-[16px] p-4 flex flex-col w-full">
        <div className="flex justify-between items-center w-full">
          {/* Left side: Icon, Name, Pill, Value */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <HabitIcon name={habit.icon || 'star'} habitId={habit.id} boxed={true} size={18} className="!rounded-[8px] shrink-0" />
            <h3 className="font-bold text-[14px] text-on-surface truncate shrink">{habit.name}</h3>
            
            {(() => {
              const scoreDisplay = getScoreDisplay();
              return scoreDisplay ? (
                <div className={`shrink-0 px-1.5 py-[2px] rounded-[6px] ${entry?.computedScore >= 100 ? 'bg-[#22c55e20] text-[#16a34a]' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  <span className="font-mono-data text-[10px] font-bold">
                    {scoreDisplay}
                  </span>
                </div>
              ) : null;
            })()}
            
            <span className="font-mono-data text-[14px] text-on-surface ml-1 font-bold shrink-0">
              {formatDisplayValue()}
            </span>
          </div>

          {/* Right side: Detail & Edit buttons */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <button
              onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setShowDetail(true); }}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors"
              title="View details"
            >
              <Icon name="bar_chart" className="text-[16px]" />
            </button>
            {habit.scoringType !== 'subjective' && (
              <button
                onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setShowManualInput(!showManualInput); }}
                className={`w-8 h-8 flex items-center justify-center rounded-[8px] border transition-colors ${showManualInput ? 'bg-primary/10 border-primary/30 text-primary' : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'}`}
                title="Manual Entry"
              >
                <Icon name="edit" className="text-[14px]" />
              </button>
            )}
          </div>
        </div>
        
        {renderInput()}
      </div>

      {showDetail && (
        <HabitDetailSheet
          habit={habit}
          allSummaries={allSummaries || []}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}




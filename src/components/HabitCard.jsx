import { useState, useEffect, useMemo } from 'react';
import { calculateScore } from '../lib/scoring';
import Icon from '../components/Icon';
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[24px] shadow-2xl p-5 pb-8 animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4" />

        {/* Title */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{habit.name}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <Icon name="close" className="text-xl" />
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
              onClick={() => {
                onClose();
                navigate(`/analytics?habit=${habit.id}`);
              }}
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
              onClick={() => { onClose(); navigate(`/analytics?habit=${habit.id}`); }}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Icon name="bar_chart" className="text-base" />
              View Full Analytics
            </button>
          </div>
        )}
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
        // Determine label text based on habit name/context
        const yesLabel = 'Yes';
        const noLabel = 'No';
        return (
          <div className="flex flex-col gap-3 flex-grow justify-end">
            <div className="relative flex w-full h-[46px] rounded-full bg-surface-container-low border border-outline-variant/30 overflow-hidden group">
              
              {/* Background fills */}
              <div 
                className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-primary/90 to-primary/70 transition-all duration-300 ease-out origin-left ${val === 1 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} 
              />
              <div 
                className={`absolute inset-y-0 right-0 w-1/2 bg-surface-container-highest transition-all duration-300 ease-out origin-right ${val === 0 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} 
              />

              {/* Clickable halves */}
              <div className="absolute inset-0 flex">
                <button 
                  onClick={() => handleChange(1)}
                  className="flex-1 flex items-center justify-center z-10 cursor-pointer"
                >
                  <span className={`font-semibold text-sm transition-colors duration-300 ${val === 1 ? 'text-white' : 'text-on-surface-variant'}`}>
                    Yes
                  </span>
                </button>
                <button 
                  onClick={() => handleChange(0)}
                  className="flex-1 flex items-center justify-center z-10 cursor-pointer"
                >
                  <span className={`font-semibold text-sm transition-colors duration-300 ${val === 0 ? 'text-white' : 'text-on-surface-variant'}`}>
                    No
                  </span>
                </button>
              </div>

              {/* Center circle */}
              <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 z-20 pointer-events-none ${val !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                {val === 1 ? (
                  <span className="text-primary font-bold text-[16px] leading-none mb-[2px]">✓</span>
                ) : (
                  <span className="text-[#666] font-bold text-[14px] leading-none mb-[2px]">✕</span>
                )}
              </div>
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
            <div className="relative flex items-center border border-outline-variant rounded-lg overflow-hidden focus-within:border-primary transition-colors">
              <input 
                type="time" 
                aria-label={`Time for ${habit.name}`}
                value={formatTime(val)}
                onChange={(e) => handleChange(parseTime(e.target.value))}
                className="w-full bg-transparent border-none py-3 px-4 font-mono-data text-mono-data text-primary focus:ring-0" 
              />
              <div className="absolute right-4 pointer-events-none text-on-surface-variant">
                <Icon name="schedule" className=" text-sm" />
              </div>
            </div>
          </div>
        );
      case 'subjective':
        return (
          <div className="flex flex-col gap-4 flex-grow justify-end">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>1</span>
              <span>10</span>
            </div>
            <input 
              type="range" 
              aria-label={`Subjective score for ${habit.name}`}
              min="1" max="10" step="1" 
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              onPointerUp={(e) => handleChange(Number(e.target.value))}
              onTouchEnd={(e) => handleChange(Number(e.target.value))}
              className="subjective-slider" 
            />
            <div className="text-center font-mono-data text-primary font-bold">
              {val}/10
            </div>
          </div>
        );
      case 'number':
      case 'duration':
      default:
        const maxSlider = Math.max(habit.target100 || 0, habit.target0 || 0, val) * 1.2 || 100;
        const minSlider = 0;
        
        return (
          <div className="flex flex-col gap-4 flex-grow justify-end">
            <div className="flex justify-between items-center text-xs text-on-surface-variant">
              <span>0 {habit.unit}</span>
              <span>Target: {habit.target100} {habit.unit}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <input 
                  type="range" 
                  aria-label={`Target slider for ${habit.name}`}
                  min={minSlider} 
                  max={maxSlider} 
                  step={habit.scoringType === 'number' ? '1' : '5'}
                  value={val}
                  onChange={(e) => setVal(Number(e.target.value))}
                  onPointerUp={(e) => handleChange(Number(e.target.value))}
                  onTouchEnd={(e) => handleChange(Number(e.target.value))}
                  className="custom-slider flex-grow" 
                />
                <div className="relative flex items-center">
                    <input
                      type="number"
                      aria-label={`Target value for ${habit.name}`}
                      min="0"
                      value={val === 0 ? '' : val}
                      placeholder="0"
                      onChange={(e) => setVal(Number(e.target.value))}
                      onBlur={(e) => handleChange(Number(e.target.value))}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              e.currentTarget.blur();
                          }
                      }}
                      className="w-20 bg-surface-container border border-outline-variant rounded-md px-2 py-1.5 text-center font-mono-data text-primary focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
            </div>
          </div>
        );
    }
  };

  const getScoreDisplay = () => {
    if (habit.scoringType === 'subjective') return 'Logged';
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

  return (
    <>
      <div className="bg-surface premium-border rounded-xl p-6 flex flex-col gap-6 w-full">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">
              {habit.name}
            </span>
            <span className="font-headline-md text-headline-md text-primary">
              {formatDisplayValue()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Detail button */}
            <button
              onClick={() => setShowDetail(true)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
              title="View habit details"
            >
              <Icon name="bar_chart" className="text-base" />
            </button>
            <div className={`px-3 py-1 rounded-full border ${entry?.computedScore >= 100 ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant'}`}>
              <span className="font-mono-data text-mono-data text-xs font-medium">
                {getScoreDisplay()}
              </span>
            </div>
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

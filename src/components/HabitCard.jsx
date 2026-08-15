import { useState, useEffect } from 'react';
import { calculateScore } from '../lib/scoring';
import Icon from '../components/Icon';

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

export default function HabitCard({ habit, entry, onUpdate }) {
  // Local state for optimistic UI updates
  const [val, setVal] = useState(entry?.rawValue ?? (habit.scoringType === 'binary' ? 0 : habit.target0 ?? 0));
  
  // Update local state if entry prop changes from outside
  useEffect(() => {
    if (entry && entry.rawValue !== undefined) {
      setVal(entry.rawValue);
    }
  }, [entry]);

  // Handle local change and bubble up
  const handleChange = (newRawVal) => {
    setVal(newRawVal);
    
    // For sleep time wraparound logic as requested
    let adjustedVal = newRawVal;
    if (habit.scoringType === 'time' && habit.id.includes('sleep') && newRawVal < 12 * 60) {
      // If it's a sleep habit and logged before noon, add 24 hours (1440) for comparison
      adjustedVal += 1440;
    }

    const computedScore = calculateScore(
      habit.scoringType, 
      habit.direction, 
      adjustedVal, 
      habit.target100, 
      habit.target0
    );
    
    // Math.round the score to keep it clean (0-100), handle nulls
    const finalScore = computedScore !== null ? Math.max(0, Math.min(100, Math.round(computedScore))) : null;
    
    onUpdate(habit.id, newRawVal, finalScore);
  };

  const renderInput = () => {
    switch (habit.scoringType) {
      case 'binary':
        return (
          <div className="flex flex-col gap-2 flex-grow justify-end">
            <div className="text-xs text-on-surface-variant mb-4">
                Target: Complete
            </div>
            <div className="relative inline-block w-full align-middle select-none transition duration-200 ease-in mt-auto h-12">
              <input 
                type="checkbox" 
                id={`toggle-${habit.id}`} 
                checked={val === 1}
                onChange={(e) => handleChange(e.target.checked ? 1 : 0)}
                className="toggle-checkbox absolute block w-10 h-10 rounded-full bg-surface border-4 border-surface-container-high appearance-none cursor-pointer top-1 right-1 z-10" 
              />
              <label 
                htmlFor={`toggle-${habit.id}`} 
                className={`toggle-label block overflow-hidden h-12 rounded-full cursor-pointer w-full text-center flex items-center justify-start pl-6 font-label-sm text-label-sm transition-colors duration-200 ${val === 1 ? 'text-on-primary bg-primary' : 'text-on-surface-variant'}`}
              >
                  {val === 1 ? 'Completed' : 'Not Completed'}
              </label>
            </div>
          </div>
        );
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
        // Use custom slider
        // Need to figure out min/max based on targets
        const maxSlider = Math.max(habit.target100 || 0, habit.target0 || 0, val) * 1.2 || 100; // Give a little headroom
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
    if (entry && entry.computedScore !== undefined && entry.computedScore !== null) {
      return `${entry.computedScore}%`;
    }
    return '--%';
  };

  const formatDisplayValue = () => {
    if (habit.scoringType === 'time') return formatTime(val);
    if (habit.scoringType === 'binary') return val === 1 ? 'Yes' : 'No';
    if (habit.scoringType === 'subjective') return `${val}/10`;
    return `${val} ${habit.unit || ''}`.trim();
  };

  return (
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
        <div className={`px-3 py-1 rounded-full border ${entry?.computedScore >= 100 ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low border-outline-variant'}`}>
          <span className="font-mono-data text-mono-data text-xs font-medium">
            {getScoreDisplay()}
          </span>
        </div>
      </div>
      
      {renderInput()}
    </div>
  );
}

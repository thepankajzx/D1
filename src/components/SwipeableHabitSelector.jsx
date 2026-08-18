import React, { useState } from 'react';
import Icon from './Icon';
import HabitIcon from './HabitIcon';

export default function SwipeableHabitSelector({ habits, selectedHabitId, onChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const options = [
    ...habits.map(h => ({ id: h.id, name: h.name, icon: h.icon || 'star' })),
    { id: 'overall', name: 'Overall', icon: 'grid_view' }
  ];

  const selectedOpt = options.find(opt => opt.id === selectedHabitId) || options[0];

  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // Short, sharp haptic feedback
    }
  };

  return (
    <div className="relative w-full h-[36px] z-30">
      <button 
        onClick={() => { setIsDropdownOpen(!isDropdownOpen); triggerVibration(); }}
        className="flex items-center gap-2 pl-3 pr-7 bg-surface-container-lowest rounded-[10px] h-full shadow-sm overflow-hidden select-none border border-outline-variant/40 hover:border-outline-variant transition-colors w-full relative cursor-pointer"
      >
        <div className="shrink-0 flex items-center justify-center">
          <HabitIcon name={selectedOpt.icon || 'star'} habitId={selectedOpt.id} boxed={false} size={20} />
        </div>
        <span className="font-semibold text-[13px] text-on-surface truncate flex-1 text-left">{selectedOpt.name}</span>
        <Icon name="keyboard_arrow_down" className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none" />
      </button>
      
      {/* Dropdown Menu (Opened on Tap) */}
      {isDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] transition-opacity" onClick={() => setIsDropdownOpen(false)}></div>
          <div className="absolute top-[calc(100%+8px)] right-0 w-[200px] max-h-[300px] overflow-y-auto bg-surface/95 backdrop-blur-xl shadow-lg border border-outline-variant/30 rounded-[16px] p-2 z-50 flex flex-col gap-1 custom-scrollbar animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            {options.map((opt) => {
              const isSelected = opt.id === selectedHabitId;
              return (
                <button
                  key={opt.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-colors ${
                    isSelected 
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm border border-outline-variant/50' 
                      : 'bg-transparent text-on-surface-variant hover:bg-surface-container/50 border border-transparent'
                  }`}
                  onClick={() => {
                    onChange(opt.id);
                    triggerVibration();
                    setIsDropdownOpen(false);
                  }}
                >
                  <HabitIcon name={opt.icon || 'star'} habitId={opt.id} boxed={false} size={20} />
                  <span className={`truncate text-left ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}`}>{opt.name}</span>
                  {isSelected && (
                    <Icon name="check" className="text-[16px] ml-auto text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


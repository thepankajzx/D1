import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import HabitIcon from './HabitIcon';

// Wheel configuration
const ANGLE_STEP = 28; // Degrees between each item on the curve
const RADIUS = 210; // Distance of items from the right edge
const PIXELS_PER_DEGREE = 5; // How many vertical drag pixels = 1 degree of rotation

export default function SwipeableHabitSelector({ habits, selectedHabitId, onChange }) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Rotary Wheel State
  const [showWheel, setShowWheel] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); 
  const [isAnimating, setIsAnimating] = useState(false);
  
  const dragActiveRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startYRef = useRef(0);
  const lastVibratedIndexRef = useRef(-1);

  const options = [
    { id: 'overall', name: 'Overall', icon: 'grid_view' },
    ...habits.map(h => ({ id: h.id, name: h.name, icon: h.icon || 'star' }))
  ];

  const selectedIndex = Math.max(0, options.findIndex(opt => opt.id === selectedHabitId));
  const selectedOpt = options[selectedIndex] || options[0];

  const triggerVibration = (pattern = 10) => {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch(e){}
    }
  };

  const handlePointerDown = (e) => {
    if (showDropdown) {
      setShowDropdown(false);
      return;
    }
    
    // Support touch and mouse
    if (e.button !== 0 && e.type.startsWith('mouse')) return;
    
    dragActiveRef.current = true;
    hasDraggedRef.current = false;
    startYRef.current = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    
    setDragOffset(0);
    setIsAnimating(false);
    lastVibratedIndexRef.current = selectedIndex;
  };

  // We bind mouse/touch move to window so we don't lose it if they drag outside the button
  useEffect(() => {
    const onMove = (e) => {
      if (!dragActiveRef.current) return;
      
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const deltaY = clientY - startYRef.current;
      
      if (!hasDraggedRef.current && Math.abs(deltaY) > 8) {
        hasDraggedRef.current = true;
        setShowWheel(true);
        setShowDropdown(false);
      }

      if (hasDraggedRef.current) {
        setDragOffset(deltaY);
        
        // Vibrate when ticking over a new item
        const angleOffset = deltaY / PIXELS_PER_DEGREE;
        const currentIndexOffset = Math.round(angleOffset / ANGLE_STEP);
        const newIndex = Math.max(0, Math.min(options.length - 1, selectedIndex - currentIndexOffset));
        
        if (lastVibratedIndexRef.current !== newIndex) {
           triggerVibration(10);
           lastVibratedIndexRef.current = newIndex;
        }
      }
    };

    const onUp = () => {
      if (!dragActiveRef.current) return;
      dragActiveRef.current = false;

      if (hasDraggedRef.current) {
        // We dragged -> snap wheel and close
        // Re-calculate the snapped index from latest state
        setDragOffset((prevOffset) => {
          const angleOffset = prevOffset / PIXELS_PER_DEGREE;
          const indexOffset = Math.round(angleOffset / ANGLE_STEP);
          const newIndex = Math.max(0, Math.min(options.length - 1, selectedIndex - indexOffset));
          
          // Snap visually
          const snappedDeltaY = (selectedIndex - newIndex) * ANGLE_STEP * PIXELS_PER_DEGREE;
          
          setIsAnimating(true);
          triggerVibration([20, 20]);
          
          setTimeout(() => {
            onChange(options[newIndex].id);
            setShowWheel(false);
            setDragOffset(0);
            setIsAnimating(false);
          }, 200);
          
          return snappedDeltaY; // Update offset for animation
        });
        
      } else {
        // Just a tap -> show dropdown
        setShowDropdown(true);
        triggerVibration(10);
      }
      
      hasDraggedRef.current = false;
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [options.length, selectedIndex, onChange]);


  return (
    <div className="relative w-full max-w-[200px]">
      
      {/* 1. THE MAIN PILL BUTTON */}
      <div 
        onPointerDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className="relative w-full h-[36px] bg-surface-container-lowest text-on-surface border border-outline-variant/40 rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer select-none overflow-hidden group hover:bg-surface-container transition-colors touch-none"
      >
        <div className="absolute inset-0 flex items-center px-3 gap-3">
          <HabitIcon name={selectedOpt.icon || 'star'} habitId={selectedOpt.id} boxed={true} size={18} className="!rounded-[8px]" />
          <span className="font-semibold text-[13px] truncate flex-1 leading-none">{selectedOpt.name}</span>
          <Icon name="unfold_more" className="text-[16px] text-on-surface-variant opacity-50 ml-auto" />
        </div>
      </div>
      
      {/* 2. REGULAR TAP DROPDOWN */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] transition-opacity"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-[220px] bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/30 rounded-[16px] shadow-xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {options.map((opt) => {
                const isSelected = opt.id === selectedHabitId;
                return (
                  <button
                    key={opt.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-colors ${
                      isSelected 
                        ? 'bg-surface-container text-on-surface shadow-sm border border-outline-variant/50' 
                        : 'bg-transparent text-on-surface-variant hover:bg-surface-container/50 border border-transparent'
                    }`}
                    onClick={() => {
                      onChange(opt.id);
                      triggerVibration();
                      setShowDropdown(false);
                    }}
                  >
                    <HabitIcon name={opt.icon || 'star'} habitId={opt.id} boxed={true} size={18} className="!rounded-[8px]" />
                    <span className={`truncate ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}`}>{opt.name}</span>
                    {isSelected && (
                      <Icon name="check" className="text-[16px] ml-auto text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 3. ROTARY WHEEL (SWIPE EFFECT) */}
      {showWheel && (
        <div 
          className="fixed inset-0 z-[100] pointer-events-none"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)',
            backdropFilter: 'blur(3px)'
          }}
        >
          {/* 
            Invisible center anchor on the right edge of the screen 
            Top 50%, Right 0 (pushed off slightly).
          */}
          <div className="absolute top-1/2 right-[-20px] w-0 h-0 flex items-center justify-center">
            
            {options.map((opt, i) => {
              const angleOffset = dragOffset / PIXELS_PER_DEGREE;
              
              // Math:
              // i - selectedIndex gives relative position (-2, -1, 0, 1, 2)
              // Multiply by ANGLE_STEP (e.g. 28 deg)
              // Add angleOffset from dragging
              const baseAngle = (i - selectedIndex) * ANGLE_STEP;
              const currentAngle = baseAngle + angleOffset;
              
              // Cull items that are outside +/- 90 degrees (behind the wheel)
              if (currentAngle < -95 || currentAngle > 95) return null;
              
              // Find which one is visually selected (closest to 0 angle)
              const snappedIndex = Math.max(0, Math.min(options.length - 1, selectedIndex - Math.round(angleOffset / ANGLE_STEP)));
              const isSelected = i === snappedIndex;

              return (
                <div
                  key={opt.id}
                  className={`absolute right-0 flex items-center p-2 rounded-[16px] transition-all
                    ${isAnimating ? 'duration-200 ease-out' : 'duration-0'} 
                    ${isSelected ? 'bg-surface shadow-lg ring-1 ring-outline-variant text-on-surface z-10' : 'bg-surface-container-low/90 text-on-surface-variant opacity-80 z-0'}`}
                  style={{
                    width: '190px',
                    // Counter-rotate magic: 
                    // 1. Rotate the wrapper container around the central right anchor
                    // 2. Move out by -RADIUS to push it into the screen
                    // 3. Counter-rotate the element itself so it stays perfectly horizontal
                    transformOrigin: 'right center',
                    transform: `rotate(${currentAngle}deg) translateX(-${RADIUS}px) rotate(${-currentAngle}deg) scale(${isSelected ? 1.08 : 0.95})`,
                  }}
                >
                  <div className="flex items-center gap-3 w-full pl-2">
                    <HabitIcon name={opt.icon || 'star'} habitId={opt.id} boxed={true} size={20} className="!rounded-[10px] shadow-sm" />
                    <span className="font-semibold text-[14px] truncate flex-1">{opt.name}</span>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}
      
    </div>
  );
}

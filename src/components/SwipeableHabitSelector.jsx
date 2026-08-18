import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import HabitIcon from './HabitIcon';

export default function SwipeableHabitSelector({ habits, selectedHabitId, onChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef(null);

  const options = [
    ...habits.map(h => ({ id: h.id, name: h.name, icon: h.icon || 'star' })),
    { id: 'overall', name: 'Overall', icon: 'grid_view' }
  ];

  const currentIndex = options.findIndex(opt => opt.id === selectedHabitId);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  const dragStartY = useRef(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const itemHeight = 36; // approximate height of one item in px
  
  // Slower scrolling threshold (increased to make it less sensitive)
  const threshold = 70; 

  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20); // Short, sharp haptic feedback
    }
  };

  const handleTouchStart = (e) => {
    // Ignore if tapping inside dropdown
    if (isDropdownOpen) return;
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    hasDragged.current = false;
    setIsActive(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || dragStartY.current === null) return;
    
    // Prevent default scrolling when dragging on this component
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;
    
    if (Math.abs(deltaY) > 5) {
      hasDragged.current = true;
    }

    if (Math.abs(deltaY) > threshold) {
      // Swiped far enough
      if (deltaY < 0 && safeCurrentIndex < options.length - 1) {
        // Swipe UP -> Next item
        onChange(options[safeCurrentIndex + 1].id);
        triggerVibration();
        dragStartY.current = currentY; // Reset anchor for continuous scrolling
      } else if (deltaY > 0 && safeCurrentIndex > 0) {
        // Swipe DOWN -> Prev item
        onChange(options[safeCurrentIndex - 1].id);
        triggerVibration();
        dragStartY.current = currentY; // Reset anchor
      }
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    dragStartY.current = null;
    setIsActive(false);
  };

  const scrollTimeout = useRef(null);

  // Support wheel for desktop testing (also made very sensitive)
  const handleWheel = (e) => {
    e.preventDefault();
    setIsActive(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setIsActive(false), 500);

    if (e.deltaY > 0 && safeCurrentIndex < options.length - 1) {
      onChange(options[safeCurrentIndex + 1].id);
      triggerVibration();
    } else if (e.deltaY < 0 && safeCurrentIndex > 0) {
      onChange(options[safeCurrentIndex - 1].id);
      triggerVibration();
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      // Passive false to allow preventDefault
      el.addEventListener('touchmove', handleTouchMove, { passive: false });
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (el) {
        el.removeEventListener('touchmove', handleTouchMove);
        el.removeEventListener('wheel', handleWheel);
      }
    };
  }, [safeCurrentIndex, options.length]); // Re-bind when index changes so closures have fresh data

  const handleClick = () => {
    if (!hasDragged.current) {
      setIsDropdownOpen(!isDropdownOpen);
      triggerVibration();
    }
  };

  return (
    <div className="relative w-[130px] sm:w-[150px] h-[36px] z-30 shrink">
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className="absolute inset-0 cursor-pointer touch-none"
      >
        <div 
          className="absolute w-full h-[144px] top-1/2 -translate-y-1/2 pointer-events-none select-none transition-all duration-200"
          style={{
            WebkitMaskImage: isActive ? 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)' : 'none',
            maskImage: isActive ? 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)' : 'none'
          }}
        >
          <div 
            className="scroll-wrapper absolute w-full flex flex-col transition-transform duration-200 ease-out"
            style={{ 
              transform: `translateY(calc(54px - ${safeCurrentIndex * itemHeight}px))` 
            }}
          >
            {options.map((opt, i) => {
              const isSelected = i === safeCurrentIndex;
              return (
                <div key={opt.id} className="h-[36px] w-full px-0.5 py-0.5">
                  <div 
                    className={`flex items-center h-full px-3 gap-3 w-full rounded-full transition-all duration-200 border ${
                      isSelected 
                        ? 'bg-surface-container-lowest text-on-surface border-outline-variant/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)] opacity-100 scale-100' 
                        : `bg-surface-container-low/80 backdrop-blur-md text-on-surface-variant border-transparent scale-95 ${isActive ? 'opacity-50' : 'opacity-0'}`
                    }`}
                  >
                    <HabitIcon name={opt.icon || 'star'} habitId={opt.id} boxed={false} size={20} />
                    <span className={`font-semibold text-[13px] truncate flex-1 leading-none ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}`}>{opt.name}</span>
                    {isSelected && (
                      <Icon name="arrow_drop_down" className="text-[18px] text-on-surface-variant ml-auto shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(opt.id);
                    triggerVibration();
                    setIsDropdownOpen(false);
                  }}
                >
                  <HabitIcon name={opt.icon || 'star'} habitId={opt.id} boxed={false} size={20} />
                  <span className={`truncate ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}`}>{opt.name}</span>
                  {isSelected && (
                    <Icon name="check" className="text-[16px] ml-auto text-primary" />
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

import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

export default function SwipeableHabitSelector({ habits, selectedHabitId, onChange }) {
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  
  // Combine 'overall' and habits
  const options = [
    { id: 'overall', name: 'All Habits', icon: 'grid_view' },
    ...habits.map(h => ({ id: h.id, name: h.name, icon: h.icon }))
  ];

  const currentIndex = options.findIndex(o => o.id === selectedHabitId);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  const dragStartY = useRef(null);
  const isDragging = useRef(false);
  const itemHeight = 36; // approximate height of one item in px
  const threshold = 40; // firm threshold to trigger a change

  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // Strong, short haptic feedback
    }
  };

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || dragStartY.current === null) return;
    
    // Prevent default scrolling when dragging on this component
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;
    
    // Limit visually how far it drags (optional, makes it feel tight)
    setDragOffset(deltaY * 0.5);

    if (Math.abs(deltaY) > threshold) {
      // Swiped far enough
      if (deltaY < 0 && safeCurrentIndex < options.length - 1) {
        // Swipe UP -> Next item
        onChange(options[safeCurrentIndex + 1].id);
        triggerVibration();
        dragStartY.current = currentY; // Reset anchor for continuous scrolling
        setDragOffset(0);
      } else if (deltaY > 0 && safeCurrentIndex > 0) {
        // Swipe DOWN -> Prev item
        onChange(options[safeCurrentIndex - 1].id);
        triggerVibration();
        dragStartY.current = currentY; // Reset anchor
        setDragOffset(0);
      }
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    dragStartY.current = null;
    setDragOffset(0);
  };

  // Support wheel for desktop testing
  const handleWheel = (e) => {
    e.preventDefault();
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

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative shrink-0 flex-1 max-w-[160px] h-[36px] bg-surface-container-lowest text-on-surface border border-outline-variant/40 rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer select-none overflow-hidden group hover:bg-surface-container transition-colors"
    >
      <div 
        className="absolute w-full flex flex-col transition-transform duration-200 ease-out"
        style={{ 
          transform: `translateY(calc(-${safeCurrentIndex * itemHeight}px + ${dragOffset}px))` 
        }}
      >
        {options.map((opt, i) => {
          const isSelected = i === safeCurrentIndex;
          return (
            <div 
              key={opt.id} 
              className={`flex items-center h-[36px] px-3 gap-2 w-full ${isSelected ? 'opacity-100' : 'opacity-40'} transition-opacity duration-200`}
            >
              <div className="shrink-0 flex items-center justify-center w-[16px]">
                {opt.id === 'overall' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant group-hover:text-on-surface transition-colors">
                    <rect width="7" height="7" x="3" y="3" rx="1"/>
                    <rect width="7" height="7" x="14" y="3" rx="1"/>
                    <rect width="7" height="7" x="14" y="14" rx="1"/>
                    <rect width="7" height="7" x="3" y="14" rx="1"/>
                  </svg>
                ) : (
                  <Icon name={opt.icon || 'star'} className="text-[16px] text-on-surface-variant" />
                )}
              </div>
              <span className="font-semibold text-[13px] truncate flex-1 leading-none">{opt.name}</span>
            </div>
          );
        })}
      </div>

      {/* Up/Down Arrow Hint */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none opacity-50">
        <Icon name="keyboard_arrow_up" className="text-[10px] -mb-1" />
        <Icon name="keyboard_arrow_down" className="text-[10px]" />
      </div>
    </div>
  );
}

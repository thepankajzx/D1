import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import HabitIcon from './HabitIcon';
import WheelPicker from './WheelPicker';

export default function SwipeableHabitSelector({ habits, selectedHabitId, onChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [visualOffset, setVisualOffset] = useState(0); // For initial nudge animation
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Combine 'overall' and habits
  const options = [
    { id: 'overall', name: 'Overall', icon: 'grid_view' },
    ...habits.map(h => ({ id: h.id, name: h.name, icon: h.icon }))
  ];

  const currentIndex = options.findIndex(o => o.id === selectedHabitId);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  const dragStartY = useRef(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const sensitivity = 25; // How many pixels of drag = 1 step change. Lower is faster!

  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // Strong haptic feedback
    }
  };

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    hasDragged.current = false;
    setIsDropdownOpen(true); // Show dropdown instantly on touch
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

    if (Math.abs(deltaY) > sensitivity) {
      // Swiped far enough for a step
      if (deltaY < 0 && safeCurrentIndex < options.length - 1) {
        // Swipe UP -> Next item
        onChange(options[safeCurrentIndex + 1].id);
        triggerVibration();
        dragStartY.current = currentY; // Reset anchor
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
    if (hasDragged.current) {
      // If they were actively dragging, close it when they lift finger
      setTimeout(() => setIsDropdownOpen(false), 150);
    }
  };

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
    // Initial Nudge Animation to show it's scrollable
    const timeout1 = setTimeout(() => setVisualOffset(-15), 600);
    const timeout2 = setTimeout(() => setVisualOffset(10), 900);
    const timeout3 = setTimeout(() => setVisualOffset(0), 1200);
    
    const el = containerRef.current;
    if (el) {
      el.addEventListener('touchmove', handleTouchMove, { passive: false });
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      if (el) {
        el.removeEventListener('touchmove', handleTouchMove);
        el.removeEventListener('wheel', handleWheel);
      }
    };
  }, [safeCurrentIndex, options.length]);

  // Scroll active item into view inside dropdown
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [isDropdownOpen, safeCurrentIndex]);

  const handleClick = () => {
    if (!hasDragged.current) {
      setIsDropdownOpen(!isDropdownOpen);
      triggerVibration();
    }
  };

  const selectedOpt = options[safeCurrentIndex];

  return (
    <div className="relative shrink-0 flex-1 max-w-[160px] z-30">
      {/* Main Pill Button */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className="relative w-full h-[36px] bg-surface-container-lowest text-on-surface border border-outline-variant/40 rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer select-none overflow-hidden group hover:bg-surface-container transition-colors"
      >
        <div 
          className="absolute inset-0 flex items-center px-3 gap-3 transition-transform duration-200 ease-out"
          style={{ transform: `translateY(${visualOffset}px)` }}
        >
          <HabitIcon name={selectedOpt.icon || 'star'} habitId={selectedOpt.id} boxed={true} size={18} className="!rounded-[8px]" />
          <span className="font-semibold text-[13px] truncate flex-1 leading-none">{selectedOpt.name}</span>
          
          <Icon name="unfold_more" className="text-[16px] text-on-surface-variant opacity-50 ml-auto" />
        </div>
      </div>
      
      {/* Glassmorphism Dropdown Menu */}
      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
            <WheelPicker 
              items={options}
              selectedValue={selectedHabitId}
              onChange={(id) => {
                 onChange(id);
                 triggerVibration();
              }}
              onClose={() => setIsDropdownOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

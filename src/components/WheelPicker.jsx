import React, { useRef, useEffect, useState } from 'react';
import HabitIcon from './HabitIcon';
import Icon from './Icon';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5; // 2 above, 1 center, 2 below

export default function WheelPicker({ 
  items, 
  selectedValue, 
  onChange, 
  onClose 
}) {
  const containerRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  
  // Find initial index
  const initialIndex = Math.max(0, items.findIndex(item => item.id === selectedValue));

  useEffect(() => {
    // Initial scroll position
    if (containerRef.current) {
      containerRef.current.scrollTop = initialIndex * ITEM_HEIGHT;
      setScrollOffset(initialIndex * ITEM_HEIGHT);
    }
  }, [initialIndex]);

  const handleScroll = (e) => {
    setScrollOffset(e.target.scrollTop);
  };

  // Debounced change detection for snap
  useEffect(() => {
    const handleSnap = () => {
      const snappedIndex = Math.round(scrollOffset / ITEM_HEIGHT);
      const targetItem = items[snappedIndex];
      
      if (targetItem && targetItem.id !== selectedValue) {
        if (navigator.vibrate) navigator.vibrate(10);
        onChange(targetItem.id);
      }
    };

    const timeout = setTimeout(handleSnap, 100);
    return () => clearTimeout(timeout);
  }, [scrollOffset, items, selectedValue, onChange]);

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-surface-container-low/70 backdrop-blur-xl border border-outline-variant/30 shadow-xl" style={{ width: 220, height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      
      {/* Center Highlight Bar (Optional, like iOS) */}
      <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[44px] bg-on-surface/5 rounded-[12px] pointer-events-none" />

      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar"
        style={{ perspective: 1000, scrollBehavior: 'smooth' }}
        onScroll={handleScroll}
      >
        {/* Padding to allow first and last items to reach the center */}
        <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />

        {items.map((item, index) => {
          const itemCenter = index * ITEM_HEIGHT;
          const dy = itemCenter - scrollOffset;
          
          // Math for 3D curved cylinder effect
          const radius = 110; // Distance to center of cylinder
          // Calculate angle based on distance from center. 
          // 44px (1 item) = ~22 degrees
          let angle = (dy / ITEM_HEIGHT) * 22; 
          
          // Clamp angle so it doesn't wrap around
          if (angle > 90) angle = 90;
          if (angle < -90) angle = -90;

          const isSelected = Math.round(scrollOffset / ITEM_HEIGHT) === index;

          return (
            <div
              key={item.id}
              onClick={() => {
                // If tapped, smooth scroll to it
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    top: index * ITEM_HEIGHT,
                    behavior: 'smooth'
                  });
                }
                onChange(item.id);
                // Also close the dropdown immediately if they clicked an item directly?
                // The user said: "ad jab select ho jaye tab sirf ek habit dikhni chaiye".
                // We'll let the parent handle onClose.
                if (isSelected) {
                   onClose();
                }
              }}
              className="w-full snap-center flex justify-center items-center cursor-pointer select-none"
              style={{
                height: ITEM_HEIGHT,
                transform: `rotateX(${angle}deg) translateZ(${Math.abs(angle) > 5 ? -10 : 0}px)`,
                transformOrigin: '50% 50%',
                opacity: 1 - Math.min(1, Math.abs(dy) / (ITEM_HEIGHT * 2.5)),
                transition: 'opacity 0.1s ease-out',
                zIndex: isSelected ? 10 : 1
              }}
            >
              <div className="w-[85%] flex items-center gap-3 px-3 py-1">
                {item.id === 'overall' ? (
                  <div className="shrink-0 flex items-center justify-center w-[30px] h-[30px] rounded-[10px] bg-rose-500/20 text-rose-500">
                    <Icon name="grid_view" className="text-[18px]" />
                  </div>
                ) : (
                  <HabitIcon name={item.icon || 'star'} habitId={item.id} boxed={true} size={18} className="!rounded-[10px]" />
                )}
                <span className={`truncate font-semibold text-[15px] transition-colors ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {item.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* Padding bottom */}
        <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

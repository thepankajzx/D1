import React, { useState, useRef, useEffect } from 'react';

export default function TruncatedText({ 
  text, 
  className = '', 
  style = {},
  as = 'span',
  children
}) {
  const [showFloatingPopover, setShowFloatingPopover] = useState(false);
  const elementRef = useRef(null);
  const fullContent = text || children;

  useEffect(() => {
    if (!showFloatingPopover) return;

    const handleOutsideClick = (e) => {
      if (elementRef.current && !elementRef.current.contains(e.target)) {
        setShowFloatingPopover(false);
      }
    };

    // Close on any touch or click anywhere else
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [showFloatingPopover]);

  const handleTap = (e) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(20);
    setShowFloatingPopover(prev => !prev);
  };

  const Component = as;

  return (
    <div className="relative inline-flex items-center min-w-0 max-w-full" ref={elementRef}>
      <Component 
        onClick={handleTap}
        className={`${className} cursor-pointer active:opacity-75 transition-opacity`}
        style={style}
        title={typeof fullContent === 'string' ? fullContent : undefined}
      >
        {children || text}
      </Component>

      {/* Floating Micro-Popover on Tap */}
      {showFloatingPopover && (
        <div 
          onClick={(e) => { e.stopPropagation(); setShowFloatingPopover(false); }}
          className="absolute left-0 bottom-full mb-1.5 z-50 px-2.5 py-1.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold rounded-xl shadow-xl border border-slate-700/50 dark:border-slate-300 max-w-[260px] sm:max-w-xs whitespace-normal break-words animate-in fade-in zoom-in-95 duration-150 cursor-pointer pointer-events-auto shrink-0 leading-tight"
        >
          {fullContent}
          <div className="absolute left-3.5 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-slate-100"></div>
        </div>
      )}
    </div>
  );
}

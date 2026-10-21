import React from 'react';

/**
 * Global Standard PRO Pill Badge
 * Standardized across the app for all premium/pro features:
 * Black pill background with white bold 'PRO' text.
 */
export default function ProPill({ className = '', size = 'sm' }) {
  const sizeClasses = size === 'xs' 
    ? 'text-[8.5px] px-1.5 py-0.5' 
    : size === 'md' 
    ? 'text-[11px] px-2.5 py-0.5' 
    : 'text-[9.5px] px-2 py-0.5';

  return (
    <span 
      className={`inline-flex items-center justify-center font-black tracking-wider uppercase rounded-full bg-black text-white shadow-xs select-none border border-black/90 dark:border-zinc-800 ${sizeClasses} ${className}`}
      title="Premium Pro Feature"
    >
      PRO
    </span>
  );
}

import React from 'react';

// Matches the same logic as Analytics.jsx
const getPerfBandClass = (score) => {
  if (score === null || score === undefined || score === 0) return 'bg-surface-variant';
  if (score <= 10) return 'bg-perf-1';
  if (score <= 20) return 'bg-perf-2';
  if (score <= 30) return 'bg-perf-3';
  if (score <= 40) return 'bg-perf-4';
  if (score <= 50) return 'bg-perf-5';
  if (score <= 60) return 'bg-perf-6';
  if (score <= 70) return 'bg-perf-7';
  if (score <= 80) return 'bg-perf-8';
  if (score <= 90) return 'bg-perf-9';
  return 'bg-perf-10';
};

const getPerfTextColorClass = (score) => {
  if (score === null || score === undefined || score === 0) return 'text-on-surface-variant';
  if (score <= 10) return 'text-perf-1';
  if (score <= 20) return 'text-perf-2';
  if (score <= 30) return 'text-perf-3';
  if (score <= 40) return 'text-perf-4';
  if (score <= 50) return 'text-perf-5';
  if (score <= 60) return 'text-perf-6';
  if (score <= 70) return 'text-perf-7';
  if (score <= 80) return 'text-perf-8';
  if (score <= 90) return 'text-perf-9';
  return 'text-perf-10';
};

export default function RadialGauge({ habitName, percentage, changeLabel, changeValue }) {
  const totalSegments = 36;
  const activeSegments = Math.round((percentage / 100) * totalSegments);
  
  const startAngle = -135;
  const endAngle = 135;
  const angleRange = endAngle - startAngle;
  const step = angleRange / (totalSegments - 1);
  
  const perfBgClass = getPerfBandClass(percentage);
  const perfTextClass = getPerfTextColorClass(percentage);

  // Default color logic for change pill
  const isPositive = changeValue >= 0;
  // If no change value provided (e.g. all-time average only), we don't show the colored badge
  const showChangeBadge = changeValue !== null && changeValue !== undefined;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 p-4 w-[160px] flex flex-col items-center relative shrink-0">
      
      {/* Top Header Row (Decorations) - Simplified for small size */}
      <div className="w-full flex justify-between items-center mb-4 opacity-50">
        <div className="w-8 h-1.5 bg-surface-container-highest rounded-full"></div>
        <div className="flex gap-0.5 p-0.5">
          <div className="w-0.5 h-0.5 bg-on-surface-variant rounded-full"></div>
          <div className="w-0.5 h-0.5 bg-on-surface-variant rounded-full"></div>
          <div className="w-0.5 h-0.5 bg-on-surface-variant rounded-full"></div>
        </div>
      </div>

      {/* Segmented Radial Chart Area */}
      <div className="relative w-[110px] h-[110px] mb-6 flex justify-center items-center">
        <div className="text-center z-10 flex flex-col gap-0.5 -mt-2">
          <div className="text-3xl font-bold tracking-tight text-on-surface leading-none font-headline-display">
            {Math.round(percentage)}%
          </div>
          <div className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5 truncate max-w-[90px]">
            {habitName}
          </div>
        </div>
        
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeSegments;
          const currentAngle = startAngle + (i * step);
          return (
            <div
              key={i}
              className={`absolute top-1/2 left-1/2 w-1.5 h-3.5 rounded-[2px] origin-[50%_55px] -ml-[3px] -mt-[55px] transition-colors duration-500 ${isActive ? perfBgClass : 'bg-surface-container-high'}`}
              style={{
                transform: `rotate(${currentAngle}deg)`,
                boxShadow: isActive ? 'inset 0 0 0 1px rgba(0,0,0,0.05)' : 'none'
              }}
            ></div>
          );
        })}
      </div>

      {/* Footer Pill */}
      <div className="w-full flex flex-col justify-center items-center px-2 py-1.5 border border-outline-variant/50 rounded-xl bg-surface-container-lowest gap-1">
        <span className="text-[9px] font-medium text-on-surface-variant text-center leading-tight truncate w-full">{changeLabel}</span>
        {showChangeBadge ? (
          <div className={`flex items-center justify-center gap-0.5 w-full py-0.5 rounded-md text-[10px] font-bold ${isPositive ? 'bg-perf-8/20 text-perf-8' : 'bg-perf-2/20 text-perf-2'}`}>
            <span className="material-symbols-outlined text-[12px]">
              {isPositive ? 'trending_up' : 'trending_down'}
            </span>
            {isPositive ? '+' : ''}{Math.round(changeValue)}%
          </div>
        ) : (
          <div className="flex items-center justify-center gap-0.5 w-full py-0.5 rounded-md text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-[12px]">
              stacked_line_chart
            </span>
            AVG
          </div>
        )}
      </div>
    </div>
  );
}

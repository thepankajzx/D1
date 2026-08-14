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
    <div className="bg-surface rounded-[32px] shadow-sm border border-outline-variant/30 p-6 md:p-8 w-full max-w-[340px] flex flex-col items-center relative">
      
      {/* Top Header Row (Decorations) */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="w-16 h-2.5 bg-surface-container rounded-full"></div>
        <div className="flex gap-1 p-1">
          <div className="w-1 h-1 bg-on-surface-variant rounded-full"></div>
          <div className="w-1 h-1 bg-on-surface-variant rounded-full"></div>
          <div className="w-1 h-1 bg-on-surface-variant rounded-full"></div>
        </div>
      </div>

      {/* Segmented Radial Chart Area */}
      <div className="relative w-[240px] h-[240px] mb-8 flex justify-center items-center">
        <div className="text-center z-10 flex flex-col gap-1 -mt-4">
          <div className="text-[56px] font-bold tracking-tight text-on-surface leading-none font-headline-display">
            {Math.round(percentage)}%
          </div>
          <div className="text-lg font-medium text-on-surface-variant uppercase tracking-wider mt-1 truncate max-w-[160px]">
            {habitName}
          </div>
        </div>
        
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeSegments;
          const currentAngle = startAngle + (i * step);
          return (
            <div
              key={i}
              className={`absolute top-1/2 left-1/2 w-3.5 h-8 rounded-[4px] origin-[50%_120px] -ml-[7px] -mt-[120px] transition-colors duration-500 ${isActive ? perfBgClass : 'bg-surface-container-high'}`}
              style={{
                transform: `rotate(${currentAngle}deg)`,
                boxShadow: isActive ? 'inset 0 0 0 1px rgba(0,0,0,0.05)' : 'none'
              }}
            ></div>
          );
        })}
      </div>

      {/* Footer Pill */}
      <div className="w-full flex justify-between items-center px-4 py-2.5 border border-outline-variant/50 rounded-full bg-surface-container-lowest">
        <span className="text-[11px] md:text-xs font-medium text-on-surface-variant">{changeLabel}</span>
        {showChangeBadge ? (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${isPositive ? 'bg-perf-8/20 text-perf-8' : 'bg-perf-2/20 text-perf-2'}`}>
            <span className="material-symbols-outlined text-[14px]">
              {isPositive ? 'trending_up' : 'trending_down'}
            </span>
            {isPositive ? '+' : ''}{Math.round(changeValue)}%
          </div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">
              stacked_line_chart
            </span>
            AVG
          </div>
        )}
      </div>
    </div>
  );
}

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

export default function RadialGauge({ habitName, habitIcon = 'check_circle', percentage, changeLabel, changeValue }) {
  const totalSegments = 40;
  const activeSegments = Math.round((percentage / 100) * totalSegments);
  
  const step = 360 / totalSegments;
  
  const perfBgClass = getPerfBandClass(percentage);
  const perfTextClass = getPerfTextColorClass(percentage);

  // Default color logic for change pill
  const isPositive = changeValue >= 0;
  const showChangeBadge = changeValue !== null && changeValue !== undefined;

  return (
    <div className="bg-surface rounded-[20px] shadow-sm border border-outline-variant/30 p-3.5 w-[150px] flex flex-col items-center relative shrink-0">
      
      {/* Top Header Row */}
      <div className="w-full flex justify-between items-start mb-2">
        <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center bg-surface-container-high ${perfTextClass} shadow-sm`}>
          <span className="material-symbols-outlined text-[15px]">{habitIcon}</span>
        </div>
        <div className="flex gap-[3px] p-1 mt-1 opacity-40">
          <div className="w-[3px] h-[3px] bg-on-surface-variant rounded-full"></div>
          <div className="w-[3px] h-[3px] bg-on-surface-variant rounded-full"></div>
          <div className="w-[3px] h-[3px] bg-on-surface-variant rounded-full"></div>
        </div>
      </div>

      {/* Segmented Radial Chart Area */}
      <div className="relative w-[100px] h-[100px] mb-4 flex justify-center items-center">
        <div className="text-center z-10 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold tracking-tight text-on-surface leading-none font-headline-display">
            {Math.round(percentage)}%
          </div>
          <div className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 truncate max-w-[80px]">
            {habitName}
          </div>
        </div>
        
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeSegments;
          const currentAngle = i * step;
          return (
            <div
              key={i}
              className={`absolute top-1/2 left-1/2 w-1.5 h-2.5 rounded-[1px] origin-[50%_50px] -ml-[3px] -mt-[50px] transition-colors duration-500 ${isActive ? perfBgClass : 'bg-surface-container-highest opacity-40'}`}
              style={{
                transform: `rotate(${currentAngle}deg)`,
              }}
            ></div>
          );
        })}
      </div>

      {/* Horizontal Divider */}
      <div className="w-full h-px bg-outline-variant/30 mb-3"></div>

      {/* Footer Pill */}
      <div className="w-full flex justify-between items-center px-1">
        <span className="text-[9px] font-medium text-on-surface-variant truncate mr-2">{changeLabel}</span>
        {showChangeBadge ? (
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0 ${isPositive ? 'bg-perf-8/20 text-perf-8' : 'bg-perf-2/20 text-perf-2'}`}>
            <span className="material-symbols-outlined text-[10px]">
              {isPositive ? 'arrow_outward' : 'south_east'}
            </span>
            {isPositive ? '+' : ''}{Math.round(changeValue)}%
          </div>
        ) : (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0 bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-[10px]">
              stacked_line_chart
            </span>
            AVG
          </div>
        )}
      </div>
    </div>
  );
}

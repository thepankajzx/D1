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

export default function RadialGauge({ habitName, percentage, timeframeLabel }) {
  const totalSegments = 32;
  const activeSegments = Math.round((percentage / 100) * totalSegments);
  
  const startAngle = -135;
  const endAngle = 135;
  const angleRange = endAngle - startAngle;
  const step = angleRange / (totalSegments - 1);
  
  const perfBgClass = getPerfBandClass(percentage);
  const perfTextClass = getPerfTextColorClass(percentage);

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 p-3 w-full flex flex-col items-center relative">
      
      {/* Top Labels */}
      <div className="w-full flex justify-between items-center mb-3 px-1">
        <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider truncate mr-2 flex-1">{habitName}</span>
        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0">{timeframeLabel}</span>
      </div>

      {/* Segmented Radial Chart Area */}
      <div className="relative w-[90px] h-[90px] mb-2 flex justify-center items-center">
        <div className="text-center z-10 flex flex-col items-center justify-center mt-2">
          <div className={`text-3xl font-bold tracking-tight ${perfTextClass} leading-none font-headline-display`}>
            {Math.round(percentage)}%
          </div>
        </div>
        
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeSegments;
          const currentAngle = startAngle + (i * step);
          return (
             <div
              key={i}
              className={`absolute top-1/2 left-1/2 w-[4px] h-2.5 rounded-[1px] origin-[50%_45px] -ml-[2px] -mt-[45px] transition-colors duration-500 ${isActive ? perfBgClass : 'bg-surface-container-highest opacity-40'}`}
              style={{
                transform: `rotate(${currentAngle}deg)`,
              }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}

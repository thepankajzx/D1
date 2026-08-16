import React from 'react';

export default function Gauge({ percentage, color, label, subLabel }) {
    // Semi-circle path
    const pathData = "M 10 90 A 40 40 0 0 1 90 90";
    // Length of the arc
    const pathLength = 125.66; 
    const dashOffset = pathLength - (percentage / 100) * pathLength;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            {label && <div className="text-[#b6b9bf] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-2 text-center w-full truncate px-1">{label}</div>}
            
            <div className="relative w-full max-w-[80px] aspect-[2/1] flex items-end justify-center">
                <svg viewBox="0 40 100 60" className="absolute top-0 left-0 w-full h-full overflow-visible">
                    {/* Background track (dashed optionally, but solid looks cleaner) */}
                    <path 
                        d={pathData} 
                        fill="none" 
                        stroke="#272727" 
                        strokeWidth="12" 
                        strokeLinecap="round" 
                        // strokeDasharray="4 4" // Optional: makes it segmented
                    />
                    {/* Foreground progress */}
                    <path 
                        d={pathData} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="12" 
                        strokeLinecap="round" 
                        strokeDasharray={pathLength} 
                        strokeDashoffset={dashOffset} 
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>
                {/* Center Text */}
                <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end leading-none translate-y-1">
                    <span className="text-white text-[16px] sm:text-[18px] font-bold">{percentage}%</span>
                </div>
            </div>
            
            {subLabel && <div className="text-[#b6b9bf] text-[9px] font-medium mt-3 text-center">{subLabel}</div>}
        </div>
    );
}

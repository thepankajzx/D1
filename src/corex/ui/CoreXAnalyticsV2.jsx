import React, { useMemo } from 'react';
import { runCoreXEngineV2 } from '../analyzer/engine_v2';
import CoreXIcon from './CoreXIcon';
import { ChartBar, Info, WarningCircle } from '@phosphor-icons/react';

function DivergingBar({ delta, deltaShrunk, maxDelta = 3 }) {
  const isPositive = delta > 0;
  const widthPct = Math.min(100, (Math.abs(deltaShrunk) / maxDelta) * 100);

  return (
    <div className="relative w-full h-8 flex items-center">
      {/* Center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 z-0" />
      
      {/* Bars container (two halves) */}
      <div className="w-full flex h-4 z-10">
        {/* Left half (Negative) */}
        <div className="w-1/2 flex justify-end">
          {!isPositive && (
            <div 
              className="h-full bg-rose-400 dark:bg-rose-500 rounded-l-sm" 
              style={{ width: `${widthPct}%` }}
            />
          )}
        </div>
        {/* Right half (Positive) */}
        <div className="w-1/2 flex justify-start">
          {isPositive && (
            <div 
              className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-r-sm" 
              style={{ width: `${widthPct}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoreXAnalyticsV2({ config, logs = [] }) {
  const analysis = useMemo(() => {
    return runCoreXEngineV2(config, logs);
  }, [config, logs]);

  const { totalDays, supportersAndDestroyers } = analysis;

  if (totalDays < 3) {
    return (
      <div className="p-6 bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <ChartBar size={24} weight="bold" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Collecting Data...</h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
            Need at least 3 logged days to start showing early patterns. You have {totalDays} so far.
          </p>
        </div>
      </div>
    );
  }

  // Find the maximum impact to scale the bars relative to the strongest factor
  const maxImpact = supportersAndDestroyers.reduce((max, item) => {
    return Math.max(max, Math.abs(item.stats.deltaShrunk));
  }, 1); // fallback to at least 1

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-150">
      
      {/* Header Strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Nights Analyzed</p>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {totalDays} <span className="text-sm font-medium text-slate-500 font-sans">logs</span>
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Data Readiness</p>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {totalDays >= 30 ? 'Solid' : totalDays >= 14 ? 'Building' : 'Early Signal'}
          </div>
        </div>
      </div>

      {/* Hero Chart: Supporters and Destroyers */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Supporters and destroyers</h3>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Change in score, pts</span>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_2fr_1fr] px-4 py-2 bg-slate-50/50 dark:bg-[#161a26]/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
          <div>Factor</div>
          <div className="flex justify-between px-2">
            <span>Lowers</span>
            <span>Raises</span>
          </div>
          <div className="text-right">Impact</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {supportersAndDestroyers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No factors have enough data yet (minimum {MIN_N} days).</div>
          ) : (
            supportersAndDestroyers.map((item) => {
              const { delta, deltaShrunk, tier, nMin, nA, nB, se } = item.stats;
              const isPositive = delta > 0;
              const sign = isPositive ? '+' : '';
              
              // Formatting Private Factors
              const displayName = item.isPrivate ? 'Private factor' : item.name;

              // Opacity/dashed style for low confidence
              const isUnclear = tier === 'Unclear' || tier === 'Early signal';
              
              return (
                <div key={item.id} className={`grid grid-cols-[1fr_2fr_1fr] px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${isUnclear ? 'opacity-75' : ''}`}>
                  
                  {/* Name & Icon */}
                  <div className="flex items-center gap-2 pr-2">
                    <CoreXIcon name={item.icon} size={16} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {displayName}
                    </span>
                  </div>

                  {/* Diverging Bar */}
                  <div className={`px-2 ${isUnclear ? 'opacity-60 grayscale-[30%]' : ''}`}>
                    <DivergingBar delta={delta} deltaShrunk={deltaShrunk} maxDelta={Math.max(2, maxImpact)} />
                  </div>

                  {/* Impact Stats */}
                  <div className="text-right pl-2">
                    <div className={`text-sm font-black tracking-tight ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {sign}{delta.toFixed(1)} pts
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                      {tier} • {nA} v {nB}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}

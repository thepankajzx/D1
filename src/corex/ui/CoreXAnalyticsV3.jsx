import React, { useState } from 'react';
import { Clock, Info, Calendar } from '@phosphor-icons/react';
import { DEMO_CONFIG, generateDemoLogs } from '../data/demoData';
import { runCoreXEngineV3 } from '../analyzer/engine_v3';

const IconMap = {
  Coffee: '☕',
  Barbell: '🏋️',
  Drop: '💧',
  ForkKnife: '🍔',
  DeviceMobile: '📱',
  Sparkle: '✨',
  default: '📌'
};

// --- CUSTOM SVGs FOR CONCEPT 1 ---
const BalloonIcon = () => (
  <svg width="28" height="36" viewBox="0 0 24 32" fill="currentColor" className="drop-shadow-sm">
    <path d="M12 0C6.48 0 2 5.37 2 12C2 18.63 7 26 12 28C17 26 22 18.63 22 12C22 5.37 17.52 0 12 0Z" />
    <path d="M10 28H14L13 32H11L10 28Z" opacity="0.8" />
    {/* Highlight for 3D effect */}
    <path d="M6 10C6 7 8 5 10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
  </svg>
);

const WeightIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
    <path d="M3 12C3 10.8954 3.89543 10 5 10H19C20.1046 10 21 10.8954 21 12V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V12Z" />
    <circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <path d="M12 9V10" stroke="currentColor" strokeWidth="2.5" />
    <path d="M5 14H19" stroke="black" strokeWidth="1" opacity="0.2" />
    <path d="M5 18H19" stroke="black" strokeWidth="1" opacity="0.2" />
  </svg>
);


export default function CoreXAnalyticsV3() {
  const [logs] = useState(() => generateDemoLogs(30)); // 30 days
  const [selectedId, setSelectedId] = useState('overview');

  const result = runCoreXEngineV3(DEMO_CONFIG, logs);
  const { factors, overallAvg } = result;
  
  if (!factors.length) return <div className="p-4">No data</div>;

  const maxImpact = Math.max(2, ...factors.map(f => Math.abs(f.analysis.deltaShrunk || 0)));
  const selectedFactor = factors.find(f => f.id === selectedId);

  return (
    <div className="flex flex-col gap-5 w-full pb-10 mt-2">
      
      {/* ── TOP LEVEL PILL TABS ── */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-hide border-b border-outline-variant/30">
        <button 
          onClick={() => setSelectedId('overview')}
          className={`px-5 py-2.5 rounded-full text-sm font-black transition-all flex-shrink-0 border ${
            selectedId === 'overview' 
              ? 'bg-slate-800 text-white border-slate-800 shadow-md dark:bg-slate-200 dark:text-slate-900' 
              : 'bg-surface-container-lowest text-slate-500 border-outline-variant/40 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Overview
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 flex-shrink-0" />
        
        {factors.map(f => {
          const isSelected = selectedId === f.id;
          return (
            <button 
              key={f.id}
              onClick={() => setSelectedId(f.id)}
              className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 border ${
                isSelected 
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-md transform scale-[1.02]' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{IconMap[f.icon] || '📌'}</span>
              <span>{f.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── VIEW SWITCHER ── */}
      {selectedId === 'overview' ? (
        <OverviewMode factors={factors} maxImpact={maxImpact} onSelect={setSelectedId} />
      ) : (
        <PatternHeatmapDrillDown factor={selectedFactor} logs={logs} overallAvg={overallAvg} />
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 1: THE WEIGHT & BALLOON OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
function OverviewMode({ factors, maxImpact, onSelect }) {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden bg-white dark:bg-slate-900 p-6">
        <div className="text-center mb-8">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Habit Impact Balance</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Balloons lift your sleep up. Weights drag it down.</p>
        </div>
        
        <div className="flex flex-col gap-2 relative">
          
          {/* Visual Baseline */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-white dark:bg-slate-900 px-2 text-[10px] font-black text-slate-400 tracking-widest uppercase z-10">
            Average Sleep
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 z-10 pt-4 pb-4">
            {factors.map(factor => {
              const diff = factor.analysis.deltaShrunk || 0;
              const isPositive = diff > 0;
              // Normalize impact for height (min 20px, max 80px distance)
              const impactRatio = Math.min(1, Math.abs(diff) / maxImpact);
              const stringHeight = 15 + (impactRatio * 60); 

              return (
                <div 
                  key={factor.id}
                  onClick={() => onSelect(factor.id)}
                  className="flex flex-col items-center justify-center h-48 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-2xl p-2 transition-all"
                >
                  {/* BALLOON (TOP HALF) */}
                  <div className="h-1/2 w-full flex flex-col items-center justify-end pb-1 relative">
                    {isPositive && (
                      <div className="flex flex-col items-center justify-end" style={{ height: `${stringHeight}px` }}>
                        <div className="text-emerald-500 group-hover:-translate-y-2 transition-transform duration-500">
                          <BalloonIcon />
                        </div>
                        <div className="w-0.5 bg-emerald-500/40 flex-1 mt-1" />
                      </div>
                    )}
                  </div>

                  {/* FACTOR BADGE (CENTER) */}
                  <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 z-20 group-hover:border-indigo-500 transition-colors">
                    <span className="text-lg">{IconMap[factor.icon] || '📌'}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[60px] truncate">{factor.name}</span>
                  </div>

                  {/* WEIGHT (BOTTOM HALF) */}
                  <div className="h-1/2 w-full flex flex-col items-center justify-start pt-1 relative">
                    {!isPositive && diff !== 0 && (
                      <div className="flex flex-col items-center justify-start" style={{ height: `${stringHeight}px` }}>
                        <div className="w-0.5 bg-rose-500/40 flex-1 mb-1" />
                        <div className="text-rose-500 group-hover:translate-y-2 transition-transform duration-500">
                          <WeightIcon />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 4: THE PATTERN HEATMAP DRILL DOWN
// ─────────────────────────────────────────────────────────────────────────────
function PatternHeatmapDrillDown({ factor, logs, overallAvg }) {
  if (!factor) return null;
  const { properties } = factor;

  // Sort logs chronologically just in case
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Determine sleep quality color logic
  const getQuality = (score) => {
    if (score >= overallAvg + 0.5) return 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200';
    if (score <= overallAvg - 0.5) return 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200';
    return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200'; // Neutral/Okay
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* HEATMAP CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar size={24} className="text-indigo-500" />
              Your 30-Day Pattern
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Find the connection between your sleep quality and <strong>{factor.name}</strong>.
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /> Good</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-300" /> Okay</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-400" /> Bad</div>
          </div>
        </div>

        {/* 30-DAY GRID */}
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-3">
          {sortedLogs.map((log, idx) => {
            const factorData = log.factors[factor.id];
            const didHabit = factorData && factorData.had === true;
            const qualityClasses = getQuality(log.outcome);
            
            // Format date lightly (e.g., "12th")
            const dateObj = new Date(log.date);
            const dayNum = dateObj.getDate();

            return (
              <div 
                key={idx} 
                title={`Date: ${log.date}\nScore: ${log.outcome}\nHabit: ${didHabit ? 'Yes' : 'No'}`}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all ${qualityClasses} ${didHabit ? 'shadow-inner' : 'opacity-70 grayscale-[20%]'}`}
              >
                <span className="absolute top-1.5 right-2 text-[9px] font-black opacity-40">
                  {dayNum}
                </span>
                
                {/* The Habit Icon appears ONLY if they did the habit */}
                {didHabit && (
                  <span className="text-2xl sm:text-3xl drop-shadow-md animate-in zoom-in duration-300">
                    {IconMap[factor.icon] || '📌'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex gap-3 items-center">
          <Info size={24} weight="duotone" className="text-indigo-500 shrink-0" />
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
            <strong>How to read this:</strong> Look at the boxes where the {IconMap[factor.icon]} icon appears. Are those boxes mostly red (bad sleep) or green (good sleep)? Your brain will spot the trend instantly!
          </p>
        </div>
      </div>

      {/* PROPERTIES SUMMARY (Optional, keeping it extremely simple) */}
      {properties && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {properties.map(prop => {
             return (
               <div key={prop.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                 <h4 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                   {prop.type === 'time' ? <Clock size={16} /> : <Info size={16} />}
                   {prop.label} Impact
                 </h4>
                 
                 <div className="flex flex-col gap-3">
                    {/* We rely on the engine's bucket analysis here, but just format it simply */}
                    {prop.type === 'number' && prop.analysis?.buckets.map((b, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{b.label}</span>
                        <span className={`px-2 py-1 rounded text-xs font-black ${
                          b.avg >= overallAvg + 0.3 ? 'bg-emerald-100 text-emerald-700' :
                          b.avg <= overallAvg - 0.3 ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {b.avg >= overallAvg + 0.3 ? '🟢 Best' : b.avg <= overallAvg - 0.3 ? '🔴 Worst' : '🟡 Okay'}
                        </span>
                      </div>
                    ))}

                    {prop.type === 'time' && prop.analysis?.slots.map((s, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{s.label}</span>
                        <span className={`px-2 py-1 rounded text-xs font-black ${
                          s.avg >= overallAvg + 0.3 ? 'bg-emerald-100 text-emerald-700' :
                          s.avg <= overallAvg - 0.3 ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {s.avg >= overallAvg + 0.3 ? '🟢 Best' : s.avg <= overallAvg - 0.3 ? '🔴 Worst' : '🟡 Okay'}
                        </span>
                      </div>
                    ))}
                 </div>
               </div>
             )
          })}
        </div>
      )}

    </div>
  );
}
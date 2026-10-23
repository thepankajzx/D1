import React, { useState } from 'react';
import { Flask, CheckCircle, WarningCircle, ArrowRight } from '@phosphor-icons/react';
import { computeWelchStats } from '../analyzer/engine_v2';

// Dummy experiment shape:
// { id, factorId, ruleName, predictedDelta, baselineMean, status, startDate, length, validNights: [] }

export default function CoreXExperimentFlow({ 
  factorId, 
  factorName, 
  opportunity, 
  logs = [], 
  onStartExperiment, 
  activeExperiment = null 
}) {
  const [showSetup, setShowSetup] = useState(false);

  // If there's an active experiment, show the progress strip
  if (activeExperiment && activeExperiment.status === 'active') {
    const daysElapsed = activeExperiment.validNights.length;
    const isComplete = daysElapsed >= activeExperiment.length;

    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 shadow-sm animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Flask size={20} weight="fill" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-100">
              Active Experiment: {activeExperiment.ruleName}
            </h4>
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-500 flex items-center gap-2 mt-0.5">
              <span>Day {daysElapsed} of {activeExperiment.length}</span>
              {/* Simple progress ring */}
              <div className="flex gap-1">
                {Array.from({ length: activeExperiment.length }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < daysElapsed ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-900'}`} />
                ))}
              </div>
            </div>
          </div>
          {isComplete && (
            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors">
              View Results
            </button>
          )}
        </div>
      </div>
    );
  }

  // Setup State
  if (showSetup) {
    return (
      <div className="bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Flask size={18} className="text-purple-500" /> Pre-register Experiment
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          Freeze your baseline today. For the next 7 nights, try avoiding <strong>{factorName}</strong>. 
          Your history predicts a boost of <span className="font-bold text-emerald-500">+{opportunity?.toFixed(1)} pts</span>.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="text-[11px] text-slate-500">
              We'll compare these 7 nights strictly against past nights where you did log {factorName}. No manual tracking needed; just use the Daily Check-in normally.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button 
            onClick={() => setShowSetup(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (onStartExperiment) onStartExperiment(factorId);
              setShowSetup(false);
            }}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black transition-colors hover:scale-[1.02] active:scale-95"
          >
            Start 7-Day Trial
          </button>
        </div>
      </div>
    );
  }

  // Teaser (Call to Action)
  return (
    <div className="bg-slate-900 dark:bg-[#161a26] border border-slate-800 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-rose-400">
            Top Destroyer: {factorName}
          </h4>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Cutting it could add about <span className="text-emerald-400 font-bold">+{opportunity?.toFixed(1)} points</span> a week.
          </p>
        </div>
        <button 
          onClick={() => setShowSetup(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          Start 7-day experiment <ArrowRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

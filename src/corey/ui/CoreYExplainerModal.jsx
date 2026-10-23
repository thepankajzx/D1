import React, { useState } from 'react';
import { X, Info, Sparkle, TreeStructure, CalendarCheck, ChartLineUp, CheckCircle, ArrowRight } from '@phosphor-icons/react';

export default function CoreYExplainerModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const TABS = [
    { id: 'overview', label: '1. Overview', icon: Sparkle },
    { id: 'tree', label: '2. Node Tree', icon: TreeStructure },
    { id: 'tracking', label: '3. Daily Tracking', icon: CalendarCheck },
    { id: 'insights', label: '4. Rule Analyzer', icon: ChartLineUp }
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl overflow-hidden text-slate-900 dark:text-white space-y-3.5 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Info size={18} weight="bold" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm leading-tight text-slate-900 dark:text-white">
                Core Y — Visual Flow Guide
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Habit Intelligence & Root-Cause Tree
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* ── TOP COMPACT TABS ── */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 gap-1">
          {TABS.map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                  isActive
                    ? 'bg-white dark:bg-[#131722] text-purple-600 dark:text-purple-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <IconComponent size={12} weight={isActive ? 'fill' : 'bold'} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT (COMPACT & INFORMATIVE) ── */}
        <div className="min-h-[220px]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-2.5 animate-in fade-in duration-150 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 block tracking-wider">
                  Core Concept
                </span>
                <p className="text-[11.5px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Normal trackers sirf yeh dekhte hain ki <span className="font-bold text-slate-900 dark:text-white">"Habit complete hui ya nahi"</span>. Core Y yeh dhoondhta hai ki <span className="font-bold text-purple-600 dark:text-purple-400">"Kaunse factors ise bana rahe hain ya bigad rahe hain"</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10.5px] font-black text-slate-900 dark:text-white block mb-0.5">🎯 Primary Outcome</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Target metric jisko optimize karna hai (e.g. Sleep Quality 1-10).</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10.5px] font-black text-slate-900 dark:text-white block mb-0.5">🌳 Factors & Properties</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Influencing habits jo result badalti hain (Coffee, Exercise, Screen).</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NODE TREE SETUP */}
          {activeTab === 'tree' && (
            <div className="space-y-2.5 animate-in fade-in duration-150 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 block tracking-wider">
                  Visual Branching Structure
                </span>
                <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md border shadow-2xs">Main Habit (Head)</span>
                  <ArrowRight size={12} className="text-slate-400" />
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md border shadow-2xs">Factor Nodes</span>
                  <ArrowRight size={12} className="text-slate-400" />
                  <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-md border shadow-2xs">Properties</span>
                </div>
              </div>

              <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium pl-1">
                <li className="flex items-start gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                  <span><strong className="text-slate-900 dark:text-white">+ Add Factor:</strong> Naya branch jodne ke liye click karein (e.g. Coffee, Workout).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                  <span><strong className="text-slate-900 dark:text-white">+ Add Property:</strong> Factor ke neeche uski mini details dalein (Quantity, Time, Rating).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                  <span>Branch connector lines automatically dynamically connect ho jaati hain.</span>
                </li>
              </ul>
            </div>
          )}

          {/* TAB 3: DAILY TRACKING */}
          {activeTab === 'tracking' && (
            <div className="space-y-2.5 animate-in fade-in duration-150 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block tracking-wider">
                  30-Second Daily Rapid Check-In
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Roz tracking form me har factor ke samne <span className="font-black text-purple-600">Yes / No</span> gate milega.
                </p>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border flex items-center justify-between">
                  <span><strong>No dabane par:</strong> Properties skip (0 seconds time).</span>
                  <span className="text-[10px] font-bold text-rose-500">Skipped</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border flex items-center justify-between">
                  <span><strong>Yes dabane par:</strong> Stepper aur time picker se fill karein.</span>
                  <span className="text-[10px] font-bold text-emerald-500">Tracked</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-2.5 animate-in fade-in duration-150 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block tracking-wider">
                  Deterministic Mathematical Correlations
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  5 din track karne ke baad Analyzer engine with-vs-without factors compare karke real causation patterns dikhata hai.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-emerald-100/50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300">
                  <span className="text-[10.5px] font-black block">🟢 Helps (+Delta)</span>
                  <span className="text-[10px]">What improves your target score.</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-100/50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300">
                  <span className="text-[10.5px] font-black block">🔴 Hurts (-Delta)</span>
                  <span className="text-[10px]">What reduces your target score.</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER CLOSE ── */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs cursor-pointer shadow-2xs"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}

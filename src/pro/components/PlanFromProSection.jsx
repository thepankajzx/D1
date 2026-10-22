import React, { useState } from 'react';
import Icon from '../../components/Icon';
import { getProTypeConfig } from '../proConfig';

export default function PlanFromProSection({ 
  activeLink, 
  onOpenAuditModal 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeInstructionHabit, setActiveInstructionHabit] = useState(null);

  if (!activeLink || activeLink.status !== 'active') return null;

  const plan = activeLink.plan || {};
  const habits = plan.habits || [];
  const metrics = plan.metrics || [];
  const proConfig = getProTypeConfig(activeLink.proType || 'dietitian');

  if (habits.length === 0 && metrics.length === 0) return null;

  return (
    <>
      {/* ── Mobile-First Ultra-Compact 1-Line Strip (Day & Night Theme) ── */}
      <div className="w-full bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-3 text-xs mb-3 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
            ✓
          </span>
          <div className="truncate text-xs">
            <span className="font-extrabold text-slate-900 dark:text-white">
              {activeLink.dietitianName || 'Coach'}&apos;s Prescribed Plan
            </span>
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline ml-1.5 font-medium">
              • {habits.length} Prescribed Habits syncing
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-indigo-200/80 dark:border-indigo-800/80 active:scale-95"
          >
            <span>View Plan</span>
            <Icon name="arrow_forward" className="text-xs" />
          </button>
        </div>
      </div>

      {/* ── Perfectly Centered Modal Dialog for Plan Details (Mobile & Desktop) ── */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-5 sm:p-6 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center font-black shadow-2xs">
                  <Icon name="verified" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    {activeLink.dietitianName}&apos;s Prescribed Plan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {activeLink.clinicName || proConfig.orgLabel} • Plan v{plan.version || 1}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center text-lg font-bold cursor-pointer transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Doctor's Daily Focus Note if set */}
            {plan.dailyFocusNote && (
              <div className="mt-3.5 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-start gap-2.5 shrink-0">
                <span className="text-base shrink-0">💡</span>
                <div className="text-xs">
                  <span className="font-extrabold text-indigo-900 dark:text-indigo-200 block text-[10.5px] uppercase tracking-wider">
                    Doctor&apos;s Daily Focus Note:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium leading-relaxed">
                    &ldquo;{plan.dailyFocusNote}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Scrollable Habits List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-3.5 pr-1">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`p-3.5 rounded-2xl border text-xs transition-all ${
                    habit.avoid
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {habit.name}
                        </span>
                        {habit.avoid && (
                          <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md">
                            Avoid
                          </span>
                        )}
                        <span className="text-[10.5px] text-slate-500 font-medium">
                          ({habit.category})
                        </span>
                      </div>

                      <div className={`mt-1.5 text-xs font-black ${
                        habit.avoid 
                          ? 'text-rose-600 dark:text-rose-400' 
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}>
                        Target: {habit.target} {habit.unit}
                      </div>
                    </div>

                    {habit.instructions && (
                      <button
                        type="button"
                        onClick={() => setActiveInstructionHabit(activeInstructionHabit === habit.id ? null : habit.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                          activeInstructionHabit === habit.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                        title="Doctor's Instruction"
                      >
                        i
                      </button>
                    )}
                  </div>

                  {activeInstructionHabit === habit.id && habit.instructions && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 animate-in fade-in duration-100">
                      <span className="font-extrabold block text-[10px] uppercase text-indigo-600 dark:text-indigo-400 mb-0.5">
                        Instructions from {activeLink.dietitianName}:
                      </span>
                      {habit.instructions}
                    </div>
                  )}
                </div>
              ))}

              {metrics.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-center justify-between">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <span>⚖️</span>
                    <span>{metrics.map(m => m.name).join(', ')}</span>
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                    {metrics[0].frequency || 'Weekly'} Tracking
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
              {onOpenAuditModal ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    onOpenAuditModal();
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Icon name="visibility" className="text-sm" />
                  <span>Sharing Transparency</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

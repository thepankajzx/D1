import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trophy, 
  Star, 
  CheckCircle, 
  XCircle, 
  HourglassSimple, 
  Sparkle, 
  ArrowRight,
  ShieldCheck,
  TrendUp,
  Flame,
  CalendarCheck
} from '@phosphor-icons/react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecoveryHistoryModal({ 
  isOpen, 
  onClose, 
  habit, 
  recoveryData = {} 
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'recovered' | 'inprogress'

  const {
    recoveryScore = 100,
    totalMisses = 0,
    recoveryStreak = 0,
    bestRecoveryStreak = 0,
    successThreshold = 70,
    recoveryWindow = 7,
    misses = []
  } = recoveryData;

  const recoveredMisses = useMemo(() => misses.filter(m => m.recovered), [misses]);
  const inProgressMisses = useMemo(() => misses.filter(m => m.isInProgress), [misses]);

  const winRate = totalMisses > 0 ? Math.round((recoveredMisses.length / totalMisses) * 100) : 100;

  const filteredMisses = useMemo(() => {
    if (filter === 'recovered') return recoveredMisses;
    if (filter === 'inprogress') return inProgressMisses;
    return [...misses].reverse(); // most recent first
  }, [filter, misses, recoveredMisses, inProgressMisses]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-orange-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-white px-5 sm:px-7 py-4 sm:py-5 border-b border-orange-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Trophy size={22} weight="fill" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 truncate">
                  Recovery Hall of Fame
                </h3>
                <span className="bg-orange-100 text-orange-700 font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                  {habit?.name || 'Habit'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                Every time you slipped and conquered the 7-day comeback
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer flex-shrink-0 ml-2"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* ── METRICS OVERVIEW STRIP ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-4 sm:p-6 bg-orange-50/30 border-b border-orange-100/60 shrink-0">
          {/* Card 1: Best Recovery Streak */}
          <div className="bg-white rounded-2xl p-3 border border-orange-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-orange-600 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best Streak</span>
              <Trophy size={15} weight="fill" className="text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-orange-600 leading-tight">
              {bestRecoveryStreak} <span className="text-xs font-semibold text-slate-400">in a row</span>
            </div>
            <span className="text-[10px] text-orange-500 font-semibold mt-0.5">Personal Record</span>
          </div>

          {/* Card 2: Total Recoveries */}
          <div className="bg-white rounded-2xl p-3 border border-orange-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bounce-Backs</span>
              <CheckCircle size={15} weight="fill" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 leading-tight">
              {recoveredMisses.length} <span className="text-xs font-semibold text-slate-400">/ {totalMisses}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Times recovered</span>
          </div>

          {/* Card 3: Comeback Rate */}
          <div className="bg-white rounded-2xl p-3 border border-orange-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-600 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Comeback</span>
              <TrendUp size={15} weight="bold" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 leading-tight">
              {recoveryScore !== null && recoveryScore !== undefined ? `${recoveryScore}%` : 'â€”'}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">7-day avg pace</span>
          </div>

          {/* Card 4: Win Rate */}
          <div className="bg-white rounded-2xl p-3 border border-orange-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-600 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Win Rate</span>
              <ShieldCheck size={15} weight="fill" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 leading-tight">
              {winRate}%
            </div>
            <span className="text-[10px] text-indigo-500 font-semibold mt-0.5">Resilience rating</span>
          </div>
        </div>

        {/* ── FILTER BUTTONS ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 sm:px-7 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${filter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Misses ({misses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('recovered')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${filter === 'recovered' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Recovered ({recoveredMisses.length})
            </button>
            {inProgressMisses.length > 0 && (
              <button
                type="button"
                onClick={() => setFilter('inprogress')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${filter === 'inprogress' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                In Progress ({inProgressMisses.length})
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Rule: ≥{successThreshold}% in {recoveryWindow} days
          </span>
        </div>

        {/* ── SCROLLABLE HISTORY LIST ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-3 space-y-3 custom-scrollbar min-h-[220px]">
          {filteredMisses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Sparkle size={24} weight="fill" />
              </div>
              <h4 className="font-extrabold text-base text-slate-800">No records found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {filter === 'recovered' 
                  ? 'No completed bounce-backs in this filter yet.' 
                  : 'You have a flawless consistency record without any recent misses!'}
              </p>
            </div>
          ) : (
            filteredMisses.map((m, idx) => (
              <div 
                key={m.date || idx}
                className={`rounded-2xl p-4 border transition-all ${
                  m.recovered 
                    ? 'bg-gradient-to-r from-emerald-50/50 via-white to-white border-emerald-200/90 shadow-2xs' 
                    : m.isInProgress
                    ? 'bg-gradient-to-r from-amber-50/50 via-white to-white border-amber-200/90 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  {/* Left: Miss Date & Journey */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      m.recovered 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : m.isInProgress 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {m.recovered ? (
                        <CheckCircle size={18} weight="fill" />
                      ) : m.isInProgress ? (
                        <HourglassSimple size={18} weight="bold" />
                      ) : (
                        <XCircle size={18} weight="bold" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                        <span>Missed {formatDateShort(m.missDate)}</span>
                        <ArrowRight size={12} weight="bold" className="text-slate-400" />
                        <span className={m.recovered ? 'text-emerald-700' : 'text-slate-600'}>
                          {m.recovered ? `Bounced Back by ${formatDateShort(m.endDate)}` : `Window ended ${formatDateShort(m.endDate)}`}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        {m.recovered 
                          ? `${m.recoveredDays || Math.round((m.recoveryRate/100)*7)} of ${m.recoveryWindow || 7} days successfully completed`
                          : m.isInProgress
                          ? `Evaluated ${m.daysEvaluated || 0} of ${m.recoveryWindow || 7} days so far`
                          : 'Target not reached in 7-day window'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Badge */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                      m.recovered 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : m.isInProgress
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {m.recoveryRate}% Rate
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      {m.recovered ? '🎉 Comeback' : m.isInProgress ? '⏳ In Progress' : 'Unrecovered'}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                  {/* 70% Target Marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-slate-400/60 z-10"
                    style={{ left: `${successThreshold}%` }}
                    title={`Target: ${successThreshold}%`}
                  ></div>
                  <div 
                    className={`h-full rounded-full transition-all ${
                      m.recovered 
                        ? 'bg-emerald-500' 
                        : m.isInProgress 
                        ? 'bg-amber-500' 
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, m.recoveryRate))}%` }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── FOOTER MOTIVATIONAL NOTE ──────────────────────────────────────── */}
        <div className="px-5 sm:px-7 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium min-w-0">
            <Flame size={18} weight="fill" className="text-orange-500 flex-shrink-0" />
            <span className="truncate">
              Discipline is not never falling, it is always getting back up.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex-shrink-0"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}



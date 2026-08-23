import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  TrendUp, 
  Info, 
  Star,
  HourglassSimple,
  Sparkle,
  ArrowRight
} from '@phosphor-icons/react';
import RecoveryHistoryModal from './RecoveryHistoryModal';

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecoveryStreakCard({ 
  habit, 
  recoveryData = {}, 
  onViewTrend 
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const {
    recoveryScore = 100,
    totalMisses = 0,
    recoveryStreak = 0,
    bestRecoveryStreak = 0,
    resilienceSummary = 'High Resilience',
    successThreshold = 70,
    recoveryWindow = 7,
    misses = []
  } = recoveryData;

  // Filter the recent misses to show in the timeline (take last 3 items)
  const recentMisses = misses.slice(-3);

  // Motivational quote based on streak
  const getMotivationalMessage = () => {
    if (totalMisses === 0) {
      return {
        title: "Flawless consistency! 🌟",
        desc: "You haven't missed any days recently. Keep up the amazing discipline!"
      };
    }
    if (recoveryStreak >= 3) {
      return {
        title: "Elite resilience! 💪",
        desc: "You're bouncing back consistently like a champion. Keep building this momentum."
      };
    }
    if (recoveryStreak >= 1) {
      return {
        title: "Great recovery! 🚀",
        desc: "You successfully bounced back from your last miss. Consistency is a practice."
      };
    }
    return {
      title: "Ready to bounce back! 🌱",
      desc: "Every day is a fresh opportunity. Complete your habit today to spark a new streak."
    };
  };

  const motivation = getMotivationalMessage();

  return (
    <>
      <section 
        aria-label="Recovery streak analytics"
        className="bg-white border border-orange-100/80 rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-7 shadow-xs relative overflow-hidden transition-all flex flex-col gap-5 sm:gap-6 w-full"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(245, 243, 255, 0.5) 0%, rgba(255, 255, 255, 1) 60%)'
        }}
      >
        {/* ── 1. HEADER ROW (Always Pinned Right on Mobile & Desktop) ──────── */}
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Left: Shield Icon + Title + Info */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-2xs border border-orange-200/60">
              <ShieldCheck size={22} weight="fill" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-slate-900 truncate">
                  Recovery Streak
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInfo(!showInfo)}
                  className="text-slate-400 hover:text-orange-600 transition-colors cursor-pointer p-0.5 rounded-full flex-shrink-0"
                  aria-label="About recovery streak calculation"
                  title="Click for calculation details"
                >
                  <Info size={14} weight="bold" />
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5 line-clamp-1 sm:line-clamp-none">
                Consecutive recoveries after missed days
              </p>
            </div>
          </div>

          {/* Right: Best Streak Badge (Clickable to open Hall of Fame Modal) */}
          <button
            type="button"
            onClick={() => { if (navigator.vibrate) navigator.vibrate(30); setShowHistoryModal(true); }}
            className="bg-orange-50 hover:bg-orange-100/90 border border-orange-100/90 hover:border-orange-300 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 flex flex-col items-end flex-shrink-0 shadow-2xs transition-all cursor-pointer group active:scale-95 text-right"
            title="Click to view full bounce-back history"
          >
            <div className="flex items-center gap-1 text-orange-700 group-hover:text-orange-900 font-bold text-[11px] sm:text-xs md:text-sm leading-none whitespace-nowrap">
              <Star size={13} weight="fill" className="text-orange-500 group-hover:text-amber-500 transition-colors" />
              <span>Best: {bestRecoveryStreak}</span>
              <span className="text-[10px] text-orange-400 group-hover:text-orange-600 font-bold ml-0.5">→</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-orange-400 group-hover:text-orange-600 font-semibold mt-0.5 leading-none whitespace-nowrap">
              View history
            </span>
          </button>
        </div>

      {/* Info Popover / Collapsible Explanation */}
      {showInfo && (
        <div className="bg-orange-50/80 border border-orange-200/80 rounded-xl p-3 text-xs text-orange-950 leading-relaxed transition-all">
          <p className="font-semibold mb-1">How Recovery Streak is measured:</p>
          <p className="text-orange-700">
            Whenever a habit is missed on a day, we evaluate your completion over the following <strong>{recoveryWindow} days</strong>. If you achieve <strong>≥{successThreshold}% completion</strong> during those 7 days, it counts as a <strong>successful bounce-back</strong>. The Recovery Streak counts how many consecutive misses you successfully recovered from!
          </p>
        </div>
      )}

      {/* ── 2. HERO STAT & CELEBRATION ────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center py-2 sm:py-3 gap-1.5">
        {totalMisses === 0 ? (
          /* Empty State: No misses */
          <div className="flex flex-col items-center gap-2 max-w-md">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <Sparkle size={24} weight="fill" />
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900">
              No misses yet! 🌟
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              You haven't missed any habit days in this lookback window. Your recovery streak will appear automatically after your first bounce-back!
            </p>
          </div>
        ) : (
          /* Main Hero Stat */
          <>
            <div 
              className="font-black text-orange-600 tracking-tight leading-none"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 5.5rem)' }}
            >
              {recoveryStreak}
            </div>

            <h4 className="text-lg sm:text-2xl font-extrabold text-slate-950 flex items-center justify-center gap-1.5 leading-tight">
              <span>successful bounce-backs</span>
              <span>🎉</span>
            </h4>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              You recovered successfully after your{' '}
              <strong className="text-slate-900 font-bold">
                {recoveryStreak > 0 ? `last ${recoveryStreak} misses` : 'recent misses'}
              </strong>.
            </p>
          </>
        )}
      </div>

      {/* ── 3. DEFINITION WITH TOP & BOTTOM DASHED LINES (NO BOX WRAPPER) ─── */}
      <div className="w-full border-y border-dashed border-orange-200/90 py-2.5 sm:py-3 my-0.5 flex items-center justify-center gap-2 text-center">
        <ShieldCheck size={16} weight="fill" className="text-orange-600 flex-shrink-0" />
        <p className="text-[11px] sm:text-xs text-orange-800 font-medium leading-tight">
          A recovery is successful when you achieve <strong className="font-bold text-orange-950">≥{successThreshold}% completion</strong> in the {recoveryWindow} days after a miss.
        </p>
      </div>

      {/* ── 4. RECOVERY TIMELINE (Missed → Recovered Chain) ────────────────── */}
      {recentMisses.length > 0 && (
        <div className="flex flex-col items-center gap-3 pt-1">
          {/* Responsive Timeline Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
            {recentMisses.map((m, idx) => (
              <div 
                key={m.date || idx}
                className={`rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col justify-between ${
                  m.recovered 
                    ? 'bg-white border-slate-200/90 shadow-2xs hover:border-orange-200' 
                    : m.isInProgress
                    ? 'bg-amber-50/40 border-amber-200/70 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200/60'
                }`}
              >
                {/* Top: Status Nodes (Missed ─→ Recovered) */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {/* Missed Node */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center flex-shrink-0">
                      <XCircle size={17} weight="fill" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                        Missed
                      </span>
                      <span className="text-xs font-semibold text-slate-800 mt-0.5 leading-none">
                        {formatDateShort(m.missDate)}
                      </span>
                    </div>
                  </div>

                  {/* Connecting Dotted Arrow */}
                  <div className="flex-1 flex items-center justify-center px-1">
                    <div className="w-full flex items-center gap-0.5">
                      <div className="h-[2px] flex-1 border-t-2 border-dashed border-slate-300"></div>
                      <ArrowRight size={13} weight="bold" className="text-slate-400 -ml-1" />
                    </div>
                  </div>

                  {/* Recovered / Status Node */}
                  <div className="flex items-center gap-2">
                    {m.recovered ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={17} weight="fill" />
                      </div>
                    ) : m.isInProgress ? (
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center flex-shrink-0">
                        <HourglassSimple size={16} weight="bold" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <XCircle size={17} weight="bold" />
                      </div>
                    )}
                    <div className="flex flex-col text-right">
                      <span className={`text-[10px] font-bold uppercase tracking-wider leading-none ${m.recovered ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {m.recovered ? 'Recovered' : m.isInProgress ? 'In Progress' : 'Unrecovered'}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 mt-0.5 leading-none">
                        {formatDateShort(m.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom: 7-Day Bounce-Back Rate Badge */}
                <div className="flex items-center justify-center pt-2 border-t border-slate-100/80">
                  <span 
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                      m.recovered 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                        : m.isInProgress
                        ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {m.recoveryRate}% <span className="text-[10px] font-medium opacity-80">7-day rate</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Connected Bracket: "X in a row" */}
          {recoveryStreak > 0 && (
            <div className="flex flex-col items-center gap-1 mt-1 text-center">
              <div className="flex items-center gap-2 text-orange-600">
                <div className="w-8 sm:w-16 h-[2px] bg-orange-200"></div>
                <span className="bg-orange-100 text-orange-700 font-extrabold text-xs px-3 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                  {recoveryStreak} in a row
                </span>
                <div className="w-8 sm:w-16 h-[2px] bg-orange-200"></div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Current recovery streak
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── 5. FOOTER NOTE ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center text-center text-[10px] sm:text-[11px] text-slate-400 font-medium">
        <span>ⓘ Only completed days are counted in recovery rate.</span>
      </div>
    </section>

    {/* ── RECOVERY HALL OF FAME MODAL ─────────────────────────────────────── */}
    {showHistoryModal && (
      <RecoveryHistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
        habit={habit} 
        recoveryData={recoveryData} 
      />
    )}
  </>
);
}


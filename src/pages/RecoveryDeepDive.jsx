import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HABITS_SEED_DATA } from '../lib/premadeHabits';
import { calculateRecoveryScore, getResilienceBadgeClasses } from '../lib/recoveryAnalytics';
import Icon from '../components/Icon';
import HabitIcon from '../components/HabitIcon';
import RecoveryBounceBackCurve from '../components/RecoveryBounceBackCurve';
import {
  ShieldCheck, Lock, Flame, Trophy, Star, CheckCircle,
  XCircle, HourglassSimple, Sparkle, ArrowRight,
  Info, CalendarCheck, TrendUp, ArrowLeft, CaretDown, X
} from '@phosphor-icons/react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

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

function getDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatNum1(val, fallback = '0') {
  if (val === null || val === undefined || isNaN(val)) return String(fallback);
  const n = Number(val);
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const RESILIENCE_RULES = [
  { id: '01', num: '01', title: 'The Never Miss Twice Rule', desc: 'Missing one day is an accident; missing two is the start of a new habit. Recovering within 24-48 hours protects your habit neuro-pathways.' },
  { id: '02', num: '02', title: 'Elastic Consistency', desc: 'Perfectionism breaks habits. High performers have an elite bounce-back rate when life gets busy.' },
  { id: '03', num: '03', title: 'Momentum Stacking', desc: 'Each consecutive recovery increases your Recovery Streak. Build a streak of 3+ bounce-backs to cement true lifelong discipline.' }
];

const SAMPLE_WORKOUT_HABIT = {
  id: 'sample_workout', name: 'Daily Workout', icon: 'fitness_center', category: 'Fitness',
  scoringType: 'numeric', direction: 'higher_is_better', targetValue: 45, target0: 10,
  userTarget100: 45, userTarget0: 10, unit: 'minutes', defaultUnit: 'minutes', priorityRank: 1
};

export default function RecoveryDeepDive() {
  const query = useQuery();
  const habitId = query.get('habitId');
  const navigate = useNavigate();
  const { habits, allSummaries, earlyUnlockAll } = useData();
  const { isHinglish } = useLanguage();

  const isSamplePreview = habitId === 'sample_workout' || String(habitId || '').startsWith('sample_');
  const [periodDays, setPeriodDays] = useState(30);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showInfo, setShowInfo] = useState(() => { try { return !localStorage.getItem('has_seen_resilience_guide'); } catch (e) { return false; } });
  const [expandedMisses, setExpandedMisses] = useState([]);
  const [expandedRule, setExpandedRule] = useState(null);
  const [showLockModal, setShowLockModal] = useState((allSummaries?.length || 0) < 14 && !earlyUnlockAll);

  const handleCloseInfo = () => { try { localStorage.setItem('has_seen_resilience_guide', 'true'); } catch (e) {} setShowInfo(false); };
  const toggleRule = (id) => setExpandedRule(prev => prev === id ? null : id);
  const toggleMissExpand = (key) => setExpandedMisses(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const activeHabits = useMemo(() => (habits || []).filter(h => !h.archived), [habits]);

  const habit = useMemo(() => {
    if (isSamplePreview) return SAMPLE_WORKOUT_HABIT;
    if (habitId) {
      const userHabit = habits && habits.find(h => h.id === habitId);
      if (userHabit) return userHabit;
      const seed = (HABITS_SEED_DATA || []).find(h => h.id === habitId);
      if (seed) return seed;
    }
    try {
      const lastId = localStorage.getItem('last_viewed_deep_dive_habit_id');
      if (lastId) {
        const found = habits && habits.find(h => h.id === lastId);
        if (found) return found;
      }
    } catch (e) {}
    return activeHabits[0] || (HABITS_SEED_DATA || [])[0] || SAMPLE_WORKOUT_HABIT;
  }, [habits, habitId, isSamplePreview, activeHabits]);

  const hasRealData = useMemo(() => {
    if (isSamplePreview || !allSummaries || (!earlyUnlockAll && allSummaries.length < 14) || !habit?.id) return false;
    return allSummaries.some(s => s.habitScores && s.habitScores[habit.id] !== undefined);
  }, [allSummaries, habit, isSamplePreview]);

  const resolvedSummaries = useMemo(() => {
    if (!hasRealData) {
      const today = new Date();
      const vals = [30,40,45,45,50,45,0,45,50,55,45,50,60,45,50,55,45,60,50,45,35,45,50,60,0,45,50,55,60,45,50,55,60,50,45,50,55,60,50,45,55,60,50,55,60];
      const hId = habit?.id || 'sample_workout';
      return vals.map((val, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (vals.length - 1 - i));
        const dateStr = d.toISOString().split('T')[0];
        const score = val >= 45 ? 100 : val <= 10 ? 0 : Math.round(((val - 10) / 35) * 100);
        return { id: dateStr, date: dateStr, overallScore: score, habitScores: { [hId]: score }, scores: { [hId]: score }, habitValues: { [hId]: val }, values: { [hId]: val }, actuals: { [hId]: val }, habitsCompleted: score >= 50 ? 1 : 0, habitsTotal: 1 };
      });
    }
    return allSummaries;
  }, [hasRealData, habit, allSummaries]);

  const recoveryData = useMemo(() => {
    if (!habit || !resolvedSummaries) return {};
    return calculateRecoveryScore(resolvedSummaries, habit.id, 7, periodDays, 70, habit.createdAt);
  }, [habit, resolvedSummaries, periodDays]);

  if (!habit) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <Icon name="error_outline" className="text-4xl text-on-surface-variant mb-4" />
      <h2 className="text-xl font-bold text-on-surface">Habit Not Found</h2>
      <p className="text-on-surface-variant mt-2 mb-6">This habit may have been deleted.</p>
      <button onClick={() => navigate('/deep-dive')} className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm cursor-pointer">Back to Deep Dive</button>
    </div>
  );

  const { recoveryScore = 100, totalMisses = 0, recoveryStreak = 0, bestRecoveryStreak = 0, misses = [], trackedDaysCount = 0 } = recoveryData;
  const recoveredMisses = misses.filter(m => m.recovered);
  const inProgressMisses = misses.filter(m => m.isInProgress);
  const unrecoveredMisses = misses.filter(m => !m.recovered && !m.isInProgress);
  const winRate = totalMisses > 0 ? Math.round((recoveredMisses.length / totalMisses) * 100) : 100;
  const filteredMisses = (() => {
    let list = [...misses].reverse();
    if (activeFilter === 'recovered') return list.filter(m => m.recovered);
    if (activeFilter === 'inprogress') return list.filter(m => m.isInProgress);
    if (activeFilter === 'unrecovered') return list.filter(m => !m.recovered && !m.isInProgress);
    return list;
  })();
  const handleBackToDeepDive = () => { if (navigator.vibrate) navigator.vibrate(30); navigate('/analytics/deep-dive?habitId=' + habit.id); };

  return (
    <div className="w-full space-y-4 md:space-y-6 px-1 sm:px-3 md:px-0 pb-16">
      
      {/* ── 1. TOP NAV BAR ── */}
      <nav className="flex items-center justify-between gap-3 w-full pb-2 border-b border-slate-200/80">
        <button onClick={handleBackToDeepDive} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 py-2 px-3 sm:px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs cursor-pointer">
          <ArrowLeft size={16} weight="bold" /><span>Back</span>
        </button>
        <div className="relative flex-shrink-0">
          <Icon name="calendar_today" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none" />
          <select value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))} className="pl-8 pr-7 py-2 text-xs sm:text-sm font-bold border border-slate-200 bg-white rounded-xl shadow-2xs appearance-none cursor-pointer outline-none text-slate-800">
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <Icon name="arrow_drop_down" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none" />
        </div>
      </nav>

      {/* ── 2. HABIT TITLE & ICON (OUTSIDE WRAPPER, TOP-LEFT) ── */}
      <div className="flex items-center gap-3.5 px-1">
        <HabitIcon habit={habit} size={48} className="shrink-0 shadow-xs" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            {habit.name}
          </h1>
          <span className="text-xs text-slate-400 font-medium truncate block">
            {habit.category ? habit.category + ' Focus • Resilience Hub' : 'Habit Resilience Hub'}
          </span>
        </div>
      </div>

      {/* ── 3. SLEEK COMPACT RESILIENCE SCORE BANNER (MATCHES SCREENSHOT) ── */}
      <section className="bg-gradient-to-r from-[#110a05] via-[#0d0703] to-[#1a0e05] text-white rounded-2xl md:rounded-3xl p-3.5 sm:p-4 border border-orange-900/50 shadow-md flex items-center justify-between gap-3 w-full">
        {/* Left: Shield Icon + Title + Status Pill + Subtitle */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#281508] border border-orange-500/30 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-xs">
            <ShieldCheck size={22} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-tight leading-none truncate">
                Resilience Score
              </h2>
              {/* Rating Pill: DEVELOPING / MODERATE / HIGH */}
              <span className={`text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full leading-none shrink-0 ${
                recoveryScore >= 80 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : recoveryScore >= 50
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {recoveryScore >= 80 ? 'High' : recoveryScore >= 50 ? 'Moderate' : 'Developing'}
              </span>
            </div>
            <p className="text-[10.5px] sm:text-xs text-stone-400 font-medium truncate mt-1 leading-none">
              7-day comeback velocity & bounce-back rate
            </p>
          </div>
        </div>

        {/* Right: Score % + Info (i) Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <span className="text-xl sm:text-2xl md:text-3xl font-black text-orange-500 leading-none">
            {recoveryScore !== null && recoveryScore !== undefined ? formatNum1(recoveryScore) + '%' : '—'}
          </span>
          <button 
            type="button" 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(25);
              setShowInfo(true);
            }} 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-950/70 hover:bg-orange-900/90 active:scale-95 text-orange-400 hover:text-white flex items-center justify-center transition-all border border-orange-500/40 hover:border-orange-400 cursor-pointer shadow-xs shrink-0"
            title="How Resilience Works"
            aria-label="Information"
          >
            <Info size={15} weight="bold" />
          </button>
        </div>
      </section>

      {/* ── 4. HOW RESILIENCE WORKS COMPACT & HIGHLIGHTED MODAL ── */}
      {showInfo && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={handleCloseInfo} />
          <div className="relative w-full max-w-[440px] max-h-[85vh] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-orange-200/80 z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 space-y-3">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} weight="fill" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 leading-tight">
                    {isHinglish ? 'रेज़िलिएंस & बाउंस-बैक गाइड' : 'Resilience & Bounce-Back Guide'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isHinglish ? 'Off-Target, 7-Day Window aur Recovery' : 'How Off-Targets, Windows and Streaks work'}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCloseInfo} 
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-all shrink-0"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Compact Highlighted Items */}
            <div className="space-y-2 overflow-y-auto pr-0.5 max-h-[60vh]">
              
              {/* Item 1: Off-Target */}
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle size={14} weight="fill" />
                </div>
                <div className="min-w-0 text-[11.5px] text-slate-600 leading-snug">
                  {isHinglish ? (
                    <><strong className="text-rose-700 font-black">Off-Target (Score &lt; 50%):</strong> इसका मतलब यह नहीं कि आपने ट्रैकिंग मिस की। इसका मतलब है कि उस दिन टारगेट थोड़ा कम रह गया (स्कोर 50 से नीचे रहा)।</>
                  ) : (
                    <><strong className="text-rose-700 font-black">Off-Target Day (Score &lt; 50%):</strong> This does not mean you missed logging. It means you showed up, but fell short of the passing target threshold (score below 50).</>
                  )}
                </div>
              </div>

              {/* Item 2: 7-Day Window */}
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarCheck size={14} weight="fill" />
                </div>
                <div className="min-w-0 text-[11.5px] text-slate-600 leading-snug">
                  {isHinglish ? (
                    <>Off-target होते ही अगले <strong className="text-indigo-700 font-black">7 दिनों की बाउंस-बैक विंडो</strong> शुरू हो जाती है ताकि आप तुरंत कमबैक कर सकें।</>
                  ) : (
                    <>When an off-target occurs, a <strong className="text-indigo-700 font-black">7-day comeback window</strong> automatically opens to track your recovery speed.</>
                  )}
                </div>
              </div>

              {/* Item 3: Recovered */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} weight="fill" />
                </div>
                <div className="min-w-0 text-[11.5px] text-slate-600 leading-snug">
                  {isHinglish ? (
                    <>अगले 7 दिनों में <strong className="text-emerald-700 font-black">5+ दिन (≥70%)</strong> अच्छा स्कोर करने पर यह दिन <strong className="text-emerald-700 font-black">Recovered (Green)</strong> माना जाता है।</>
                  ) : (
                    <>Completing <strong className="text-emerald-700 font-black">at least 5 of 7 days (≥70%)</strong> successfully marks this event as <strong className="text-emerald-700 font-black">Recovered</strong>.</>
                  )}
                </div>
              </div>

              {/* Item 4: Recovery Streak */}
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame size={14} weight="fill" />
                </div>
                <div className="min-w-0 text-[11.5px] text-slate-600 leading-snug">
                  {isHinglish ? (
                    <><strong className="text-orange-700 font-black">Recovery Streak</strong> गिनता है कि लगातार कितनी बार आपने हर Off-Target से बिना रुके सफल बाउंस-बैक किया।</>
                  ) : (
                    <><strong className="text-orange-700 font-black">Recovery Streak</strong> counts consecutive off-targets you successfully recovered from without a multi-day slump.</>
                  )}
                </div>
              </div>

              {/* Item 5: Resilience Score */}
              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendUp size={14} weight="fill" />
                </div>
                <div className="min-w-0 text-[11.5px] text-slate-600 leading-snug">
                  {isHinglish ? (
                    <><strong className="text-purple-700 font-black">Resilience Score %</strong> आपके सभी Off-Targets में से सफल कमबैक का 30-दिन का ओवरऑल सक्सेस रेट है।</>
                  ) : (
                    <><strong className="text-purple-700 font-black">Resilience Score %</strong> is your 30-day recovery win rate across all recorded off-target events.</>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Button */}
            <div className="pt-2 border-t border-slate-100 shrink-0">
              <button 
                type="button" 
                onClick={handleCloseInfo} 
                className="w-full py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-98"
              >
                {isHinglish ? 'समझ गया (Got it)' : 'Got it'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 5. 4 CORE METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {[
          {label:'Recovery Streak', val:recoveryStreak, unit:'bounces', sub:'Consecutive comebacks', IC:<ShieldCheck size={18} weight="fill"/>, ibg:'bg-orange-50 text-orange-600', vc:'text-orange-600'},
          {label:'Best Recovery', val:bestRecoveryStreak, unit:'bounces', sub:'All-time best streak', IC:<Star size={18} weight="fill"/>, ibg:'bg-indigo-50 text-indigo-600', vc:'text-slate-900'},
          {label:'Off-Target Days', val:totalMisses, unit:'days', sub:'Score < 50% in window', IC:<XCircle size={18} weight="fill"/>, ibg:'bg-rose-50 text-rose-500', vc:'text-slate-900'},
          {label:'Win Rate', val:formatNum1(winRate)+'%', unit:'', sub:recoveredMisses.length+' of '+totalMisses+' resolved', IC:<CheckCircle size={18} weight="fill"/>, ibg:'bg-emerald-50 text-emerald-600', vc:'text-emerald-600'}
        ].map(({label,val,unit,sub,IC,ibg,vc}) => (
          <div key={label} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-orange-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              <div className={'w-8 h-8 rounded-xl flex items-center justify-center ' + ibg}>{IC}</div>
            </div>
            <div>
              <div className={'text-xl sm:text-2xl md:text-3xl font-black leading-none flex items-baseline gap-1 ' + vc}>
                {val}{unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1.5 block truncate">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 5.5. 7-DAY BOUNCE-BACK CURVE BAR CHART ── */}
      <RecoveryBounceBackCurve
        habit={habit}
        summaries={resolvedSummaries}
        misses={misses}
        isHinglish={isHinglish}
      />

      {/* ── 6. BOUNCE-BACK & RECOVERY TIMELINE (DASHED SEPARATORS) ── */}
      <div className="space-y-4 w-full pt-1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Bounce-Back and Recovery Timeline</h3>
              <button 
                type="button" 
                onClick={() => setShowInfo(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-[11px] font-bold transition-colors cursor-pointer"
                title="How Timeline Works"
              >
                <Info size={13} weight="bold" />
                <span>How it works</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Chronological log of every off-target day and 7-day comeback journey</p>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              {k:'all',l:'All ('+misses.length+')',a:'bg-orange-600 text-white'},
              {k:'recovered',l:'Recovered ('+recoveredMisses.length+')',a:'bg-emerald-600 text-white'},
              {k:'inprogress',l:'In Progress ('+inProgressMisses.length+')',a:'bg-amber-500 text-white'},
              {k:'unrecovered',l:'Unrecovered ('+unrecoveredMisses.length+')',a:'bg-slate-700 text-white'}
            ].map(({k,l,a}) => (
              <button key={k} type="button" onClick={() => setActiveFilter(k)} className={'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ' + (activeFilter===k ? a : 'bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 shadow-2xs')}>{l}</button>
            ))}
          </div>
        </div>

        {filteredMisses.length === 0 ? (
          <div className="py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3"><Sparkle size={28} weight="fill" /></div>
            <h4 className="text-lg font-bold text-slate-900">{activeFilter==='all'?(trackedDaysCount<2?'Tracking Just Started!':'Flawless Consistency!'):'No misses in this filter'}</h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">{activeFilter==='all'?"You haven't missed any habit days during this lookback window!":'No items match your selected filter criteria.'}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredMisses.map((item, idx) => {
              const missKey = item.date || item.missDate || ('miss_'+idx);
              const isExpanded = expandedMisses.includes(missKey);
              const completionPercent = item.recoveryRate !== undefined ? Math.round(item.recoveryRate) : 0;
              const daysCompleted = item.recoveredDays || Math.round((completionPercent / 100) * 7);
              return (
                <div key={missKey} onClick={() => toggleMissExpand(missKey)} className={'p-3.5 sm:p-4 rounded-2xl border border-dashed transition-all flex flex-col gap-3 cursor-pointer select-none ' + (item.recovered?'bg-white border-slate-300 hover:border-orange-300 shadow-2xs':item.isInProgress?'bg-amber-50/40 border-amber-300 hover:border-amber-400 shadow-2xs':'bg-slate-50/90 border-slate-300 hover:border-slate-400')}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center flex-shrink-0"><XCircle size={18} weight="fill" /></div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 leading-none">Off-Target</span>
                        <span className="text-sm font-bold text-slate-900 mt-1 leading-none truncate">{formatDateShort(item.missDate||item.date)}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">{getDayOfWeek(item.missDate||item.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.recovered?(<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs"><CheckCircle size={16} weight="fill" className="text-emerald-600"/><span>Recovered</span></div>):item.isInProgress?(<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs"><HourglassSimple size={15} weight="bold" className="text-amber-600 animate-spin"/><span>In Progress</span></div>):(<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs"><XCircle size={15} weight="bold" className="text-slate-400"/><span>Unrecovered</span></div>)}
                      <div className={'w-7 h-7 rounded-lg bg-slate-100/80 flex items-center justify-center text-slate-500 transition-transform duration-200 ' + (isExpanded?'rotate-180':'')}><CaretDown size={14} weight="bold"/></div>
                    </div>
                  </div>

                  {/* Prominent Action Line: Tells exact progress and days needed */}
                  {item.isInProgress && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                      <div className="flex items-center gap-1.5">
                        <Sparkle size={13} weight="fill" className="text-amber-500 shrink-0" />
                        <span>
                          {isHinglish 
                            ? `प्रोग्रेस: 5 में से ${daysCompleted} दिन पूरे (70%+ स्कोर)` 
                            : `Progress: ${daysCompleted} of 5 days completed (70%+ score)`}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                        {isHinglish
                          ? `रिकवर होने के लिए ${Math.max(0, 5 - daysCompleted)} दिन और चाहिए (${Math.max(0, 7 - (item.daysEvaluated || 0))} दिन बाकी)`
                          : `Need ${Math.max(0, 5 - daysCompleted)} more to recover (${Math.max(0, 7 - (item.daysEvaluated || 0))}d left)`}
                      </span>
                    </div>
                  )}

                  {isExpanded && (
                    <div onClick={e=>e.stopPropagation()} className="w-full flex flex-col gap-2 pt-3 border-t border-slate-200/60 animate-in fade-in duration-150 cursor-default">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 flex items-center gap-1.5"><CalendarCheck size={14} className="text-orange-600"/>7-Day Comeback Window: <strong className="text-slate-900">{daysCompleted}/7 days</strong></span>
                        <span className={'font-bold ' + (item.recovered?'text-emerald-600':item.isInProgress?'text-amber-600':'text-slate-500')}>{completionPercent}% completed</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={'h-full rounded-full transition-all duration-500 ' + (item.recovered?'bg-gradient-to-r from-emerald-400 to-emerald-600':item.isInProgress?'bg-gradient-to-r from-amber-400 to-amber-500':'bg-slate-300')} style={{width:Math.min(completionPercent,100)+'%'}}/>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>Success Threshold: 70%+ (5 of 7 days)</span>
                        <span>Window: {formatDateShort(item.missDate||item.date)} - {formatDateShort(item.endDate)}</span>
                      </div>

                      {/* Contextual Explainer Note with Premium Phosphor Icons */}
                      <div className={`p-3 rounded-2xl flex items-start gap-2.5 mt-0.5 border shadow-2xs ${
                        item.recovered
                          ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200/80'
                          : item.isInProgress
                          ? 'bg-amber-50/80 text-amber-950 border-amber-200/80'
                          : 'bg-slate-100/90 text-slate-700 border-slate-200'
                      }`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          item.recovered
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.isInProgress
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {item.recovered ? (
                            <Sparkle size={14} weight="fill" />
                          ) : item.isInProgress ? (
                            <HourglassSimple size={14} weight="bold" />
                          ) : (
                            <Info size={14} weight="bold" />
                          )}
                        </div>
                        <div className="min-w-0 text-[11.5px] leading-relaxed">
                          {item.recovered ? (
                            <>
                              <strong className="font-black text-emerald-950 block mb-0.5">
                                {isHinglish ? 'शानदार कमबैक' : 'Strong Comeback'}
                              </strong>
                              <span>
                                {isHinglish 
                                  ? `आपने 7 दिनों में से ${daysCompleted} दिन आदत को पूरा किया (≥70%), जिससे यह Off-Target सफलतापूर्वक Recovered हो गया।`
                                  : `You completed ${daysCompleted} of 7 days (≥70%), successfully securing this recovery.`}
                              </span>
                            </>
                          ) : item.isInProgress ? (
                            <>
                              <strong className="font-black text-amber-950 block mb-0.5">
                                {isHinglish ? 'कमबैक चैलेंज एक्टिव है (In Progress)' : 'Active Comeback Challenge (In Progress)'}
                              </strong>
                              <span>
                                {isHinglish
                                  ? `आपने अब तक 5 में से ${daysCompleted} दिन 70%+ स्कोर के साथ पूरे कर लिए हैं। विंडो समाप्त (${formatDateShort(item.endDate)}) होने से पहले ${Math.max(0, 5 - daysCompleted)} दिन और 70%+ स्कोर लाएं और 5/7 दिन पूरे करके Recovery हासिल करें!`
                                  : `You have completed ${daysCompleted} of 5 required days (≥70% score). Score ≥70% on ${Math.max(0, 5 - daysCompleted)} more days before ${formatDateShort(item.endDate)} to secure your recovery!`}
                              </span>
                            </>
                          ) : (
                            <>
                              <strong className="font-black text-slate-900 block mb-0.5">
                                {isHinglish ? 'विंडो समाप्त' : 'Window Closed'}
                              </strong>
                              <span>
                                {isHinglish
                                  ? `7-दिन की विंडो समाप्त हो गई (${daysCompleted}/7 दिन, ${completionPercent}%)। अगला Off-Target आपके लिए नई Recovery Streak शुरू करने का ताज़ा मौका है!`
                                  : `7-day window closed at ${daysCompleted}/7 days (${completionPercent}%). The next off-target is a fresh opportunity to build your recovery streak!`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 7. RESILIENCE RULES SINGLE-OPEN ACCORDION ── */}
      <div className="space-y-2.5 w-full">
        {RESILIENCE_RULES.map(rule => {
          const isOpen = expandedRule === rule.id;
          return (
            <div key={rule.id} onClick={() => toggleRule(rule.id)} className={'bg-white rounded-2xl border transition-all cursor-pointer select-none overflow-hidden shadow-2xs ' + (isOpen?'border-orange-300 ring-2 ring-orange-500/10':'border-slate-200/90 hover:border-slate-300')}>
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={'w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ' + (rule.id==='01'?'bg-indigo-50 text-indigo-600':rule.id==='02'?'bg-orange-50 text-orange-600':'bg-emerald-50 text-emerald-600')}>{rule.num}</div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{rule.title}</h4>
                </div>
                <div className={'text-slate-400 transition-transform duration-200 shrink-0 ' + (isOpen?'rotate-180 text-orange-600':'')}><CaretDown size={18} weight="bold"/></div>
              </div>
              {isOpen && (<div className="px-3.5 pb-4 pt-1 sm:px-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed animate-in fade-in duration-200"><p>{rule.desc}</p></div>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

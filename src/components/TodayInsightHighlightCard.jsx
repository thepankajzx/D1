import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useLanguage } from '../contexts/LanguageContext';
import { generateDailyInsights } from '../lib/insightEngine';
import ArchetypeExplainerModal from './ArchetypeExplainerModal';

export default function TodayInsightHighlightCard({ habits = [], allSummaries = [] }) {
  const navigate = useNavigate();
  const { isHinglish } = useLanguage();
  const [explainerBadge, setExplainerBadge] = useState(null);

  const trackedDays = useMemo(() => {
    return allSummaries.filter(s => s.overallScore > 0 || s.habitsCompleted > 0).length;
  }, [allSummaries]);

  const isLocked = trackedDays < 7;
  const daysRemaining = Math.max(1, 7 - trackedDays);

  const insights = useMemo(() => {
    return generateDailyInsights(habits, allSummaries, isHinglish);
  }, [habits, allSummaries, isHinglish]);


  if (!insights || insights.length === 0) return null;

  // ── LOCKED PREVIEW BAR (< 7 Days) ──
  if (isLocked) {
    return (
      <div 
        onClick={() => navigate('/insights')}
        className="w-full bg-[#111420] hover:bg-[#161a29] text-white rounded-xl border border-slate-800/80 shadow-xs relative overflow-hidden transition-all hover:border-indigo-500/40 cursor-pointer px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-2.5"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/15 border border-indigo-400/25 text-indigo-400 flex items-center justify-center shrink-0">
            <Icon name="insights" className="text-[15px] sm:text-[16px]" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-xs sm:text-[13px] text-white shrink-0">Daily Insights</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 truncate flex items-center gap-1">
              <Icon name="bolt" className="text-[10px]" /> Power Duo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md hidden xs:inline-block">
            {daysRemaining}d left
          </span>
          <div className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 transition-all shadow-2xs">
            <span>{insights.length}</span>
            <Icon name="arrow_forward" className="text-[11px]" />
          </div>
        </div>
      </div>
    );
  }

  // ── UNLOCKED LIVE INSIGHT CARD (Day 8+) ──
  const topInsight = insights[0];

  const badgeThemeClasses = {
    sky: 'bg-sky-500/20 text-sky-200 border-sky-400/40 hover:bg-sky-500/30',
    violet: 'bg-violet-500/20 text-violet-200 border-violet-400/40 hover:bg-violet-500/30',
    purple: 'bg-purple-500/20 text-purple-200 border-purple-400/40 hover:bg-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30',
    orange: 'bg-orange-500/20 text-orange-200 border-orange-400/40 hover:bg-orange-500/30',
    teal: 'bg-teal-500/20 text-teal-200 border-teal-400/40 hover:bg-teal-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30',
    rose: 'bg-rose-500/20 text-rose-200 border-rose-400/40 hover:bg-rose-500/30',
    blue: 'bg-sky-500/20 text-sky-200 border-sky-400/40 hover:bg-sky-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40 hover:bg-indigo-500/30'
  };

  const iconBadgeThemes = {
    sky: 'bg-sky-500/20 border-sky-400/40 text-sky-300 shadow-sky-500/15',
    violet: 'bg-violet-500/20 border-violet-400/40 text-violet-300 shadow-violet-500/15',
    purple: 'bg-purple-500/20 border-purple-400/40 text-purple-300 shadow-purple-500/15',
    amber: 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-amber-500/15',
    orange: 'bg-orange-500/20 border-orange-400/40 text-orange-300 shadow-orange-500/15',
    teal: 'bg-teal-500/20 border-teal-400/40 text-teal-300 shadow-teal-500/15',
    emerald: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-emerald-500/15',
    rose: 'bg-rose-500/20 border-rose-400/40 text-rose-300 shadow-rose-500/15',
    blue: 'bg-sky-500/20 border-sky-400/40 text-sky-300 shadow-sky-500/15',
    indigo: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300 shadow-indigo-500/15'
  };

  const headlineColorThemes = {
    sky: 'text-sky-200',
    violet: 'text-violet-200',
    purple: 'text-purple-200',
    amber: 'text-amber-200',
    orange: 'text-orange-200',
    teal: 'text-teal-200',
    emerald: 'text-emerald-300',
    rose: 'text-rose-300',
    blue: 'text-sky-200',
    indigo: 'text-indigo-200'
  };

  const colorKey = topInsight.badge?.color || 'sky';
  const badgeClass = badgeThemeClasses[colorKey] || badgeThemeClasses.sky;
  const iconBadgeClass = iconBadgeThemes[colorKey] || iconBadgeThemes.sky;
  const headlineColorClass = headlineColorThemes[colorKey] || 'text-white';

  return (
    <>
      <div 
        className="w-full bg-gradient-to-r from-[#0f1422] via-[#151c2f] to-[#0c101c] text-white rounded-2xl border border-slate-700/70 shadow-sm relative overflow-hidden transition-all hover:border-slate-600"
        style={{ padding: 'clamp(0.85rem, 1.6vw, 1.25rem)' }}
      >
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10" style={{ gap: 'clamp(0.75rem, 1.5vw, 1.15rem)' }}>
          
          <div className="flex items-start min-w-0 flex-1" style={{ gap: 'clamp(0.65rem, 1.2vw, 0.95rem)' }}>
            <button
              onClick={() => setExplainerBadge(topInsight.badge?.label)}
              title="Tap to learn what this insight means"
              className={`rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm relative overflow-hidden active:scale-95 transition-all cursor-pointer ${iconBadgeClass}`}
              style={{ width: 'clamp(2.2rem, 3.2vw, 2.65rem)', height: 'clamp(2.2rem, 3.2vw, 2.65rem)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
              <Icon name={topInsight.icon || 'insights'} filled={true} className="text-[20px] sm:text-[23px] transform scale-110" />
            </button>
            
            <div className="flex flex-col min-w-0 pr-1 flex-1 gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={() => setExplainerBadge(topInsight.badge?.label)}
                  title="Tap to learn what this insight means"
                  className={`font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 ${badgeClass}`}
                  style={{ fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)' }}
                >
                  <span>⚡ DAILY EDGE</span>
                  {topInsight.badge?.label && <span className="opacity-70">• {topInsight.badge.label}</span>}
                </button>

                {topInsight.dateRange && (
                  <span 
                    className="font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md"
                    style={{ fontSize: 'clamp(0.62rem, 0.75vw, 0.72rem)' }}
                  >
                    {topInsight.timeScope ? `${topInsight.timeScope}: ` : ''}{topInsight.dateRange}
                  </span>
                )}
              </div>
              
              <h3 
                className={`font-black leading-snug tracking-tight break-words ${headlineColorClass}`}
                style={{ fontSize: 'clamp(0.85rem, 1.1vw + 0.45rem, 1rem)' }}
              >
                "{topInsight.headline}"
              </h3>

              <p 
                className="font-bold text-slate-300/90 leading-tight"
                style={{ fontSize: 'clamp(0.7rem, 0.85vw, 0.8rem)' }}
              >
                {topInsight.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center shrink-0 self-end sm:self-center">
            <button
              onClick={() => navigate('/insights')}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              style={{ padding: 'clamp(0.4rem, 0.8vw, 0.55rem) clamp(0.85rem, 1.2vw, 1.1rem)', fontSize: 'clamp(0.72rem, 0.85vw, 0.82rem)' }}
            >
              <span>All Insights</span>
              <span className="bg-indigo-950/90 text-indigo-200 px-1.5 py-0.5 rounded-md font-mono text-[10px]">
                {insights.length}
              </span>
              <Icon name="arrow_forward" className="text-[13px] text-sky-300 font-bold" />
            </button>
          </div>

        </div>

      </div>

      {explainerBadge && (
        <ArchetypeExplainerModal 
          badgeLabel={explainerBadge} 
          onClose={() => setExplainerBadge(null)} 
        />
      )}
    </>
  );
}

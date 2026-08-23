import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from '../components/Icon';
import { generateDailyInsights } from '../lib/insightEngine';
import ShareInsightModal from '../components/ShareInsightModal';
import ArchetypeExplainerModal from '../components/ArchetypeExplainerModal';
import TruncatedText from '../components/TruncatedText';


export default function InsightFeed() {
  const navigate = useNavigate();
  const { habits, allSummaries } = useData();
  const { isHinglish, t } = useLanguage();

  const [shareInsight, setShareInsight] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [explainerBadge, setExplainerBadge] = useState(null);

  const [feedback, setFeedback] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('insight_feedback') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Auto-open guide on first visit
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('has_seen_insight_guide');
    if (!hasSeenGuide) {
      setShowGuideModal(true);
      localStorage.setItem('has_seen_insight_guide', 'true');
    }
  }, []);

  const handleVote = (id, vote) => {
    const next = { ...feedback, [id]: vote };
    setFeedback(next);
    try {
      localStorage.setItem('insight_feedback', JSON.stringify(next));
    } catch (e) {}
  };

  const isLocked = (allSummaries?.length || 0) < 7;
  const daysRemaining = Math.max(0, 7 - (allSummaries?.length || 0));

  const sampleInsights = useMemo(() => [
    {
      id: 'sample_duo_1',
      archetype: 'duo',
      icon: 'join_inner',
      badge: { label: 'POWER DUO', color: 'sky' },
      dateCategory: 'Today',
      timeScope: 'Last 7 Days',
      dateRange: 'Active Pattern',
      headline: isHinglish
        ? 'Jab aap Morning Hydration karte ho, to Deep Work completion rate +42% badh jata hai'
        : 'When you complete Morning Hydration, Deep Work completion rate surges by +42%',
      subtitle: isHinglish
        ? 'Morning hydration se din bhar ke focused sessions ke liye energy milti hai.'
        : 'Morning hydration creates optimal cognitive stamina for focused sessions.',
      body: isHinglish
        ? 'Pichhle hafte me jin dino aapne hydration complete kiya, un dino Deep Work 5 me se 6 baar 100% raha. Ye aapka strongest synergy combo hai.'
        : 'On days with proper hydration across the last week, Deep Work hit 100% in 5 out of 6 tracked days. This is your strongest behavioral synergy.',
      whyItHappened: isHinglish
        ? 'Subah 9:00 AM se pehle paani peene se dopahar ka energy drop nahi hota.'
        : 'Hydration before 9:00 AM prevents afternoon energy slump and focus dissipation.',
      habit1Name: 'Morning Hydration',
      habit2Name: 'Deep Work',
      statLabel: '+42% Surge',
      dataQuote: isHinglish
        ? '≥3L paani wale dino par Deep Work 5 me se 6 din 100% raha.'
        : 'On days with ≥3L water, Deep Work hit 100% in 5 out of 6 tracked days.',
      actionPlan: isHinglish
        ? 'Uthne ke 30 minute ke andar 1L paani peeo taaki deep work easily shuru ho sake.'
        : 'Drink 1L water within 30 minutes of waking to trigger deep work flow.',
      visualType: 'overlap',
      visualData: { habitA: 'Morning Hydration', habitB: 'Deep Work', percentage: 88, accentColor: 'sky' }
    },
    {
      id: 'sample_time_1',
      archetype: 'time',
      icon: 'schedule',
      badge: { label: 'GOLDEN HOUR', color: 'amber' },
      dateCategory: 'Today',
      timeScope: 'Weekly Trend',
      dateRange: '6 AM - 8 AM',
      headline: isHinglish
        ? 'Subah 7:30 AM se pehle kiye gaye Workouts ki consistency 95% rehti hai'
        : 'Workouts completed before 7:30 AM have a 95% consistency rate',
      subtitle: isHinglish
        ? 'Shaam ke workouts me thakan aur busy schedule ki wajah se miss hone ka risk 3x zyada hota hai.'
        : 'Evening workouts face 3x higher cancellation rate due to daily friction.',
      body: isHinglish
        ? 'Subah jaldi kiye gaye sessions uninterrupted 5-day streak banate hain. Decision fatigue se bachne ka ye sabse best tarika hai.'
        : 'Early morning sessions sustained an unbroken 5-day streak, bypassing decision fatigue and late-day delays.',
      whyItHappened: isHinglish
        ? 'Subah ke routines me din ki thakan aur unexpected kaam beech me nahi aate.'
        : 'Morning routines bypass decision fatigue and unexpected work delays.',
      habit1Name: 'Morning Workout',
      statLabel: '95% vs 31%',
      dataQuote: isHinglish
        ? 'Subah ke sessions ne uninterrupted 5-day streak banayi.'
        : 'Early morning sessions sustained an unbroken 5-day streak.',
      actionPlan: isHinglish
        ? 'Raat ko hi gym clothes ready rakho taaki subah koi aalas na aaye.'
        : 'Pack gym clothes the night before to eliminate morning resistance.',
      visualType: 'comparison',
      visualData: { bar1Label: 'Morning (6-8 AM)', bar1Val: 95, bar2Label: 'Evening (6-8 PM)', bar2Val: 31, accentColor: 'amber' }
    },
    {
      id: 'sample_recovery_1',
      archetype: 'recovery',
      icon: 'offline_bolt',
      badge: { label: 'BOUNCE BACK', color: 'emerald' },
      dateCategory: 'Past',
      timeScope: 'Pattern',
      dateRange: '24h Recovery',
      headline: isHinglish
        ? 'Aap miss hone par 24 ghante ke andar 88% baar rebound karte ho'
        : 'You rebound from missed days in 24 hours 88% of the time',
      subtitle: isHinglish
        ? 'Ek din miss hona kabhi bhi lambe slump me nahi badalta.'
        : 'A single missed day never turns into a multi-day slump.',
      body: isHinglish
        ? 'Tuesday ko miss hone ke baad Wednesday ko aapne 45 mins poora kiya. Fast comeback speed hi streaks ko bacha kar rakhti hai.'
        : 'After missing on Tuesday, you completed 45 mins reading on Wednesday. High recovery velocity protects your long-term streak.',
      whyItHappened: isHinglish
        ? 'High bounce-back speed aapki 30-day streak aur discipline ko protect karti hai.'
        : 'High recovery velocity protects your long-term 30-day streak.',
      habit1Name: 'Reading',
      statLabel: '88% Velocity',
      dataQuote: isHinglish
        ? 'Tuesday miss ke baad agle din Wednesday ko 45 mins reading complete kari.'
        : 'After missing on Tuesday, you completed 45 mins reading on Wednesday.',
      actionPlan: isHinglish
        ? 'Kabhi bhi 2 lagatar zero days mat hone do. 24-hour reset rule follow karo.'
        : 'Never allow 2 consecutive zero days. Keep the 24-hour reset rule.'
    }
  ], [isHinglish]);

  const rawInsights = useMemo(() => {
    return generateDailyInsights(habits, allSummaries, isHinglish);
  }, [habits, allSummaries, isHinglish]);

  const insights = useMemo(() => {
    if (isLocked || rawInsights.length === 0) {
      return sampleInsights;
    }
    return rawInsights;
  }, [isLocked, rawInsights, sampleInsights]);

  const todayInsights = insights.filter(i => i.dateCategory === 'Today');
  const pastInsights = insights.filter(i => i.dateCategory !== 'Today');

  return (
    <div 
      className="max-w-7xl mx-auto w-full pb-20"
      style={{ padding: '0 clamp(0.25rem, 2vw, 1.5rem)', gap: 'clamp(1rem, 2.2vw, 2rem)', display: 'flex', flexDirection: 'column' }}
    >
      
      {/* ── Sample Preview Mode (Separate Pill + Dark Card) ── */}
      {isLocked && (
        <div className="space-y-2">
          {/* Standalone Pill on Top-Left */}
          <div className="flex items-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Sample Preview Mode
            </span>
          </div>

          {/* Dark Card with Lock, Text & Bottom-Right View Roadmap */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-700/60 shadow-lg flex flex-col gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="lock" filled={true} className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-bold text-white leading-tight">
                  {isHinglish 
                    ? `Live insights unlock hone me ${daysRemaining} din baaki hain`
                    : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left to unlock live insights feed`}
                </p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                  {isHinglish 
                    ? 'Ye ek realistic interactive demo hai. Day 8 par aapke live habit correlations aur Power Duos automatically activate ho jayenge.'
                    : 'This is a realistic interactive demo. Your personalized live habit correlations and Power Duos activate automatically on Day 8.'}
                </p>
              </div>
            </div>

            {/* Bottom-Right View Roadmap */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => navigate('/roadmap')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>View Roadmap</span>
                <Icon name="arrow_forward" className="text-[13px]" />
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Liquid Header & Navigation ────────────────────────────────────── */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200"
        style={{ paddingBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)', gap: 'clamp(0.75rem, 1.5vw, 1.5rem)' }}
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate('/')}
            className="self-start flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 transition-colors rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
            style={{ padding: 'clamp(0.35rem, 0.7vw, 0.5rem) clamp(0.65rem, 1vw, 0.85rem)', fontSize: 'clamp(0.72rem, 0.85vw, 0.82rem)' }}
          >
            <Icon name="arrow_back" className="text-[15px]" />
            <span>Back to Dashboard</span>
          </button>

          <div>
            <h1 
              className="font-black text-slate-900 tracking-tight flex items-center flex-wrap"
              style={{ fontSize: 'clamp(1.25rem, 2vw + 0.5rem, 1.85rem)', gap: 'clamp(0.5rem, 1vw, 0.75rem)' }}
            >
              <span>Daily Insight Feed</span>
              <span 
                className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-extrabold"
                style={{ padding: 'clamp(0.15rem, 0.4vw, 0.25rem) clamp(0.5rem, 0.8vw, 0.75rem)', fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)' }}
              >
                {insights.length} Insights
              </span>
            </h1>
            <p 
              className="text-slate-500 font-medium mt-1 leading-normal"
              style={{ fontSize: 'clamp(0.75rem, 0.9vw + 0.35rem, 0.9rem)' }}
            >
              {isHinglish 
                ? 'Aapka behavioral mirror — hidden routines, Power Duos aur momentum patterns discover karne ke liye.'
                : 'Your behavioral mirror — discovering hidden routines, Power Duos, and momentum patterns.'}
            </p>
          </div>
        </div>


        {/* Right Action: How Insights Work Guide Button */}
        <button
          onClick={() => setShowGuideModal(true)}
          className="self-start sm:self-center flex items-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs cursor-pointer shrink-0"
          style={{ padding: 'clamp(0.45rem, 0.9vw, 0.65rem) clamp(0.75rem, 1.2vw, 1.1rem)', gap: 'clamp(0.4rem, 0.8vw, 0.6rem)', fontSize: 'clamp(0.72rem, 0.85vw, 0.82rem)' }}
        >
          <span 
            className="rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black"
            style={{ width: 'clamp(1.1rem, 1.5vw, 1.35rem)', height: 'clamp(1.1rem, 1.5vw, 1.35rem)', fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)' }}
          >
            i
          </span>
          <span>How Insights Work</span>
        </button>
      </div>

      {/* ── Liquid Auto-Fitting Grid Feed ──────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1.25rem, 2.5vw, 2.25rem)' }}>
        
        {/* Section 1: Today's Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3.5">
            <span 
              className="font-extrabold uppercase tracking-wider text-slate-900 bg-slate-100 rounded-lg border border-slate-200/80 flex items-center gap-1.5"
              style={{ padding: 'clamp(0.2rem, 0.5vw, 0.35rem) clamp(0.5rem, 1vw, 0.75rem)', fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)' }}
            >
              <Icon name="bolt" className="text-amber-500 text-[14px]" />
              <span>Today's Highlights</span>
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', 
              gap: 'clamp(0.85rem, 1.6vw, 1.35rem)' 
            }}
          >
            {todayInsights.map(item => (
              <InsightCard 
                key={item.id} 
                insight={item} 
                feedback={feedback[item.id]} 
                onVote={handleVote}
                onShare={() => setShareInsight(item)}
                onExplainBadge={(badge) => setExplainerBadge(badge)}
                navigate={navigate}
              />
            ))}
          </div>
        </div>

        {/* Section 2: Historical / Past Archive */}
        {pastInsights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <span 
                className="font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5"
                style={{ padding: 'clamp(0.2rem, 0.5vw, 0.35rem) clamp(0.5rem, 1vw, 0.75rem)', fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)' }}
              >
                <Icon name="history" className="text-slate-500 text-[14px]" />
                <span>Past 7 Days Archive</span>
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', 
                gap: 'clamp(0.85rem, 1.6vw, 1.35rem)' 
              }}
            >
              {pastInsights.map(item => (
                <InsightCard 
                  key={item.id} 
                  insight={item} 
                  feedback={feedback[item.id]} 
                  onVote={handleVote}
                  onShare={() => setShareInsight(item)}
                  onExplainBadge={(badge) => setExplainerBadge(badge)}
                  navigate={navigate}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Share Modal */}
      {shareInsight && (
        <ShareInsightModal
          insight={shareInsight}
          onClose={() => setShareInsight(null)}
        />
      )}

      {/* How Habit Intelligence Works Guide Modal */}
      {showGuideModal && (
        <InsightGuideModal onClose={() => setShowGuideModal(false)} />
      )}

      {/* Individual Archetype Explainer Modal */}
      {explainerBadge && (
        <ArchetypeExplainerModal
          badgeLabel={explainerBadge}
          onClose={() => setExplainerBadge(null)}
        />
      )}

    </div>
  );
}

function InsightCard({ insight, feedback, onVote, onShare, onExplainBadge, navigate }) {
  const badgeColors = {
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80',
    violet: 'bg-violet-50 text-violet-700 border-violet-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    orange: 'bg-orange-50 text-orange-700 border-orange-200/80',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
  };

  const textAccentColors = {
    sky: 'text-sky-600',
    violet: 'text-violet-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
    orange: 'text-orange-600',
    teal: 'text-teal-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    blue: 'text-sky-600',
    indigo: 'text-indigo-600'
  };

  const currentBadgeClass = badgeColors[insight.badge?.color] || badgeColors.sky;
  const currentAccentColor = textAccentColors[insight.visualData?.accentColor || insight.badge?.color] || 'text-slate-800';

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-md h-full"
      style={{ padding: 'clamp(0.85rem, 1.6vw, 1.35rem)', gap: 'clamp(0.75rem, 1.3vw, 1.15rem)' }}
    >
      
      <div className="flex flex-col" style={{ gap: 'clamp(0.5rem, 1vw, 0.85rem)' }}>
        {/* Top Row: Badge + Time Range + Share Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => onExplainBadge?.(insight.badge?.label)}
              title="Tap to learn what this insight means"
              className={`font-extrabold uppercase tracking-wider rounded-full border active:scale-95 transition-all cursor-pointer ${currentBadgeClass}`}
              style={{ padding: 'clamp(0.15rem, 0.4vw, 0.25rem) clamp(0.5rem, 0.8vw, 0.7rem)', fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)' }}
            >
              {insight.badge?.label}
            </button>
            
            {insight.dateRange && (
              <span 
                className="font-bold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/70"
                style={{ fontSize: 'clamp(0.62rem, 0.75vw, 0.72rem)' }}
              >
                {insight.timeScope ? `${insight.timeScope}: ` : ''}{insight.dateRange}
              </span>
            )}
          </div>

          <button
            onClick={onShare}
            className="rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            style={{ padding: 'clamp(0.25rem, 0.5vw, 0.4rem) clamp(0.45rem, 0.8vw, 0.65rem)', fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)' }}
            title="Share as Image"
          >
            <Icon name="share" className="text-[13px]" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* Main Headline */}
        <div>
          <h3 
            className="font-black text-slate-900 leading-snug tracking-tight"
            style={{ fontSize: 'clamp(0.92rem, 1.2vw + 0.45rem, 1.15rem)' }}
          >
            "{insight.headline}"
          </h3>
          <p 
            className="font-bold text-orange-600 mt-1"
            style={{ fontSize: 'clamp(0.72rem, 0.9vw + 0.35rem, 0.85rem)' }}
          >
            {insight.subtitle}
          </p>
        </div>

        {/* Body Description */}
        <p 
          className="text-slate-600 font-medium leading-relaxed"
          style={{ fontSize: 'clamp(0.75rem, 0.85vw + 0.4rem, 0.85rem)' }}
        >
          {insight.body}
        </p>

        {/* ── Visual Data ── */}
        {insight.visualType === 'overlap' && (
          <div 
            className="w-full rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 my-1 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Icon name="link" className={`${currentAccentColor} text-[16px] shrink-0`} />
              <TruncatedText 
                text={`${insight.visualData?.habitA} + ${insight.visualData?.habitB}`}
                className="font-bold text-slate-800 truncate" 
                style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)' }}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-semibold text-slate-500 text-xs">Synergy:</span>
              <span className={`font-black text-sm ${currentAccentColor}`}>{insight.visualData?.percentage}%</span>
            </div>
          </div>
        )}

        {insight.visualType === 'comparison' && (
          <div 
            className="w-full rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 my-1 flex items-center justify-around gap-2 text-center"
          >
            <div className="flex-1 min-w-0 px-1">
              <TruncatedText 
                text={insight.visualData?.bar1Label}
                className="font-semibold text-slate-500 block truncate" 
                style={{ fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)' }}
              />
              <span className={`font-black ${currentAccentColor}`} style={{ fontSize: 'clamp(0.95rem, 1.2vw, 1.15rem)' }}>
                {insight.visualData?.bar1Val}%
              </span>
            </div>
            <span className="text-slate-300 font-bold px-1 text-xs shrink-0">vs</span>
            <div className="flex-1 min-w-0 px-1">
              <TruncatedText 
                text={insight.visualData?.bar2Label}
                className="font-semibold text-slate-500 block truncate" 
                style={{ fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)' }}
              />
              <span className="font-black text-slate-700" style={{ fontSize: 'clamp(0.95rem, 1.2vw, 1.15rem)' }}>
                {insight.visualData?.bar2Val}%
              </span>
            </div>
          </div>
        )}


        {insight.visualType === 'sparkline' && insight.visualData?.points && (
          <div 
            className="w-full rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 my-1 flex items-center justify-between gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Icon name="trending_up" className="text-slate-500 text-[14px] shrink-0" />
              <span className="font-bold text-slate-700 truncate" style={{ fontSize: 'clamp(0.72rem, 0.85vw, 0.82rem)' }}>
                {insight.visualData.label} 7-Day Trend:
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-6 shrink-0">
              {insight.visualData.points.map((pt, idx) => (
                <div
                  key={idx}
                  className={`w-3 rounded-t-xs transition-all ${pt >= 70 ? 'bg-emerald-500' : pt >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  style={{ height: `${Math.max(4, Math.round((pt / 100) * 24))}px` }}
                  title={`${pt}%`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div 
        className="flex items-center justify-between gap-2 border-t border-slate-100 flex-wrap pt-2 mt-auto"
      >
        {insight.actionHabitId ? (
          <button
            onClick={() => navigate(`/analytics/deep-dive?habitId=${insight.actionHabitId}`)}
            className="font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ fontSize: 'clamp(0.7rem, 0.8vw, 0.8rem)' }}
          >
            <span>{insight.actionLabel || 'View Deep Dive'}</span>
            <Icon name="arrow_forward" className="text-[13px] text-blue-600 font-bold shrink-0" />
          </button>
        ) : insight.actionRoute ? (
          <button
            onClick={() => navigate(insight.actionRoute)}
            className="font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ fontSize: 'clamp(0.7rem, 0.8vw, 0.8rem)' }}
          >
            <span>{insight.actionLabel || 'Explore Analytics'}</span>
            <Icon name="arrow_forward" className="text-[13px] text-blue-600 font-bold shrink-0" />
          </button>
        ) : (
          <div />
        )}

        {/* Micro-Feedback Voting (Clean Minimal Icons) */}
        <div className="flex items-center gap-1 text-slate-500 font-medium" style={{ fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)' }}>
          <span>Helpful?</span>
          <button
            onClick={() => onVote(insight.id, 'up')}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              feedback === 'up' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                : 'hover:bg-slate-50 text-slate-400 border-slate-200/80 hover:text-slate-700'
            }`}
            title="Helpful"
          >
            <Icon name="thumb_up" className="text-[13px]" />
          </button>
          <button
            onClick={() => onVote(insight.id, 'down')}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              feedback === 'down' 
                ? 'bg-rose-50 text-rose-700 border-rose-300' 
                : 'hover:bg-slate-50 text-slate-400 border-slate-200/80 hover:text-slate-700'
            }`}
            title="Not useful"
          >
            <Icon name="thumb_down" className="text-[13px]" />
          </button>
        </div>
      </div>

    </div>
  );
}

function InsightGuideModal({ onClose }) {
  const { isHinglish } = useLanguage();
  const [activeTab, setActiveTab] = useState('01');

  const guideItems = [
    {
      num: '01',
      pillLabel: 'Power Duo',
      title: '1. Power Duo & Synergy %',
      icon: 'PlugsConnected',
      badgeClass: 'bg-purple-100 text-purple-700 border-purple-200/80',
      activePillClass: 'bg-purple-600 text-white shadow-md shadow-purple-500/25',
      iconBoxClass: 'bg-purple-100 text-purple-700 border border-purple-200/80 shadow-purple-500/10',
      cardClass: 'bg-purple-50/50 border-purple-200/80',
      titleClass: 'text-purple-950',
      line1: isHinglish ? 'Jab do habits ek doosre ko boost karti hain.' : 'When two habits reinforce each other.',
      line2: isHinglish ? (
        <>
          <span className="font-bold text-purple-800">Synergy %</span> batata hai ki kitni baar{' '}
          <span className="font-bold text-slate-900">Habit A (jaise Workout)</span> complete karne par{' '}
          <span className="font-bold text-slate-900">Habit B (jaise Sleep)</span> bhi poori hoti hai.
        </>
      ) : (
        <>
          <span className="font-bold text-purple-800">Synergy %</span> measures how often completing{' '}
          <span className="font-bold text-slate-900">Habit A (e.g. Workout)</span> directly coincides with completing{' '}
          <span className="font-bold text-slate-900">Habit B (e.g. Sleep)</span>.
        </>
      ),
      extraTip: isHinglish ? 'Ek habit protect karne se doosri habit automatically fuel hoti hai.' : 'Protecting one habit automatically fuels the other.'
    },
    {
      num: '02',
      pillLabel: 'Focus Drain',
      title: '2. Focus Drain (Trade-off)',
      icon: 'BatteryLow',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200/80',
      activePillClass: 'bg-amber-600 text-white shadow-md shadow-amber-500/25',
      iconBoxClass: 'bg-amber-100 text-amber-700 border border-amber-200/80 shadow-amber-500/10',
      cardClass: 'bg-amber-50/50 border-amber-200/80',
      titleClass: 'text-amber-950',
      line1: isHinglish ? (
        <>
          Aisi habits jo <span className="font-bold text-slate-900">ek hi energy ke liye compete karti hain</span>.
        </>
      ) : (
        <>
          Identifies habits that <span className="font-bold text-slate-900">compete for the same energy</span>.
        </>
      ),
      line2: isHinglish ? (
        <>
          Jab <span className="font-bold text-amber-800">Habit A peak karti hai to Habit B drop</span> ho jati hai. Inhe din me alag-alag time par track karo.
        </>
      ) : (
        <>
          When <span className="font-bold text-amber-800">Habit A peaks, Habit B drops</span>. Spacing them throughout the day restores balance.
        </>
      ),
      extraTip: isHinglish ? 'Conflicting habits ko subah aur shaam me divide karo.' : 'Separate conflicting habits into morning vs evening.'
    },
    {
      num: '03',
      pillLabel: 'Keystone Habit',
      title: '3. Keystone Habits',
      icon: 'Crown',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
      activePillClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25',
      iconBoxClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200/80 shadow-emerald-500/10',
      cardClass: 'bg-emerald-50/50 border-emerald-200/80',
      titleClass: 'text-emerald-950',
      line1: isHinglish ? (
        <>
          Wo ek master habit jo aapke <span className="font-bold text-emerald-800">poore din ke score ko +20% ya zyada badha deti hai</span>.
        </>
      ) : (
        <>
          The single catalyst habit that elevates your <span className="font-bold text-emerald-800">entire day's score by +20% or more</span>.
        </>
      ),
      line2: isHinglish ? (
        <>
          Ise protect karne se poore daily routine par <span className="font-bold text-slate-900">positive domino effect</span> banta hai.
        </>
      ) : (
        <>
          Protecting this habit creates a <span className="font-bold text-slate-900">positive domino effect</span> across your entire daily routine.
        </>
      ),
      extraTip: isHinglish ? 'Apni Keystone Habit ko subah sabse pehle complete karo.' : 'Always complete your Keystone Habit first thing in the day.'
    },
    {
      num: '04',
      pillLabel: 'Comeback Hero',
      title: '4. Comeback Hero (U-Shape)',
      icon: 'RocketLaunch',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-200/80',
      activePillClass: 'bg-sky-600 text-white shadow-md shadow-sky-500/25',
      iconBoxClass: 'bg-sky-100 text-sky-700 border border-sky-200/80 shadow-sky-500/10',
      cardClass: 'bg-sky-50/50 border-sky-200/80',
      titleClass: 'text-sky-950',
      line1: isHinglish ? (
        <>
          Jab aap hafte ke beech ke <span className="font-bold text-slate-900">slump ko reverse karte ho</span>.
        </>
      ) : (
        <>
          Celebrates when you <span className="font-bold text-slate-900">reverse a mid-week slump</span>.
        </>
      ),
      line2: isHinglish ? (
        <>
          Slipping normal hai — <span className="font-bold text-sky-800">wapas 80%+ par bounce back karna</span> hi lifelong mental resilience banata hai.
        </>
      ) : (
        <>
          Slipping is normal — <span className="font-bold text-sky-800">bouncing right back to 80%+</span> is what builds lifelong mental resilience.
        </>
      ),
      extraTip: isHinglish ? 'Consistency aapki recovery speed se naapi jati hai.' : 'Consistency is measured by your speed of recovery.'
    },
    {
      num: '05',
      pillLabel: 'Patterns',
      title: '5. Patterns (Sunday & Monday)',
      icon: 'ChartLineUp',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200/80',
      activePillClass: 'bg-orange-600 text-white shadow-md shadow-orange-500/25',
      iconBoxClass: 'bg-orange-100 text-orange-700 border border-orange-200/80 shadow-orange-500/10',
      cardClass: 'bg-orange-50/50 border-orange-200/80',
      titleClass: 'text-orange-950',
      line1: isHinglish ? (
        <>
          Hafte ke rhythms jaise <span className="font-bold text-orange-800">Monday Fresh Start</span> ya <span className="font-bold text-slate-900">weekend slump</span> ko detect karta hai.
        </>
      ) : (
        <>
          Detects weekly rhythm variations like the <span className="font-bold text-orange-800">"Fresh Start" Monday spike</span> or the <span className="font-bold text-slate-900">weekend slump</span>.
        </>
      ),
      line2: isHinglish ? (
        <>
          Ye aapko pehle se alert karta hai taaki aap smartly routine plan kar sakein.
        </>
      ) : (
        <>
          Helps you anticipate high and low willpower days to plan your routine smartly.
        </>
      ),
      extraTip: isHinglish ? 'Low willpower wale dino par 1-2 tiny anchor habits rakho.' : 'Keep 1-2 tiny anchor habits on low willpower days.'
    },
    {
      num: '06',
      pillLabel: 'Privacy',
      title: '6. Privacy & Deterministics',
      icon: 'shield',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200/80',
      activePillClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25',
      iconBoxClass: 'bg-indigo-100 text-indigo-700 border border-indigo-200/80 shadow-indigo-500/10',
      cardClass: 'bg-indigo-50/50 border-indigo-200/80',
      titleClass: 'text-indigo-950',
      line1: isHinglish ? (
        <>
          Insights <span className="font-bold text-indigo-800">100% aapke device par</span> mathematical rules se calculate hote hain.
        </>
      ) : (
        <>
          Insights are calculated <span className="font-bold text-indigo-800">100% on your device</span> using mathematical rule logic.
        </>
      ),
      line2: isHinglish ? (
        <>
          <span className="font-bold text-slate-900">Koi personal data</span> external server par nahi bheja jata.
        </>
      ) : (
        <>
          <span className="font-bold text-slate-900">No personal data</span> is sent to external servers. All correlation scoring runs directly in your browser.
        </>
      ),
      extraTip: isHinglish ? '100% private aur offline-capable mathematical mirror.' : '100% offline-capable, private mathematical mirror.'
    }
  ];


  const currentItem = guideItems.find(item => item.num === activeTab) || guideItems[0];
  const currentIndex = guideItems.findIndex(item => item.num === activeTab);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 p-4 sm:p-6"
      >
        {/* Subtle Top Drag Indicator */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100/80 text-purple-600 flex items-center justify-center font-bold shadow-xs">
              <Icon name="auto_awesome" filled={true} className="text-[20px]" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 leading-tight text-base sm:text-lg tracking-tight">
                How Habit Insights Work
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Your personal behavioral mirror, explained.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100/90 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-[17px]" />
          </button>
        </div>

        {/* ── Interactive Navigation Pills (Horizontal Switcher) ────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar shrink-0">
          {guideItems.map(item => {
            const isActive = item.num === activeTab;
            return (
              <button
                key={item.num}
                onClick={() => setActiveTab(item.num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isActive 
                    ? item.activePillClass
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span className="opacity-70 font-mono text-[10px]">{item.num}</span>
                <span>{item.pillLabel}</span>
              </button>
            );
          })}
        </div>

        {/* ── Selected Spotlight Card (Interactive & Compact) ────────── */}
        <div className="py-2 animate-in fade-in zoom-in-95 duration-150">
          <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs ${currentItem.cardClass}`}>
            
            {/* Top Row: Big Icon + Title + Number Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden ${currentItem.iconBoxClass}`}>
                  <Icon name={currentItem.icon} filled={true} className="text-[34px] sm:text-[36px] transform scale-125" />
                </div>
                <div className="min-w-0">
                  <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-md inline-block mb-1 shadow-2xs ${currentItem.badgeClass}`}>
                    FEATURE {currentItem.num} OF 06
                  </span>
                  <h3 className={`font-black text-sm sm:text-base tracking-tight truncate ${currentItem.titleClass}`}>
                    {currentItem.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Content Lines with Highlighted Words */}
            <div className="space-y-2 text-xs sm:text-[13px] text-slate-600 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-white/80">
              <p>{currentItem.line1}</p>
              {currentItem.line2 && <p>{currentItem.line2}</p>}
            </div>

            {/* Pro Tip Pill */}
            {currentItem.extraTip && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-white/90 px-3 py-1.5 rounded-lg border border-slate-200/60">
                <Icon name="lightbulb" className="text-amber-500 text-[14px] shrink-0" />
                <span>{currentItem.extraTip}</span>
              </div>
            )}

          </div>
        </div>

        {/* ── Footer Navigation & CTA ───────────────────────────────── */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const prevIdx = (currentIndex - 1 + guideItems.length) % guideItems.length;
                setActiveTab(guideItems[prevIdx].num);
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Previous"
            >
              <Icon name="chevron_left" className="text-[16px]" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <button
              onClick={() => {
                const nextIdx = (currentIndex + 1) % guideItems.length;
                setActiveTab(guideItems[nextIdx].num);
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Next"
            >
              <span className="hidden sm:inline">Next</span>
              <Icon name="chevron_right" className="text-[16px]" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#4f39f6] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Icon name="auto_awesome" className="text-white text-[15px]" />
            <span>Got it, Let's Explore</span>
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from '../components/Icon';
import { generateDailyInsights } from '../lib/insightEngine';
import ShareInsightModal from '../components/ShareInsightModal';
import ArchetypeExplainerModal from '../components/ArchetypeExplainerModal';
import TruncatedText from '../components/TruncatedText';
import { 
  Lightning, CalendarCheck, ChartBar, Crown, 
  CaretDown, Sparkle, ArrowLeft, Info, ShareNetwork,
  PlugsConnected, BatteryWarning, BatteryLow, RocketLaunch, TrendUp, 
  TrendDown, WarningCircle, CalendarBlank, Trophy, Clock, ShieldCheck,
  Lightbulb, Target
} from '@phosphor-icons/react';

function getBadgeIcon(badgeLabel = '') {
  const label = String(badgeLabel).toUpperCase();
  if (label.includes('DUO')) return <PlugsConnected size={13} weight="fill" className="shrink-0 text-sky-600 dark:text-sky-400" />;
  if (label.includes('DRAIN')) return <BatteryWarning size={13} weight="fill" className="shrink-0 text-amber-600 dark:text-amber-400" />;
  if (label.includes('KEYSTONE')) return <Crown size={13} weight="fill" className="shrink-0 text-purple-600 dark:text-purple-400" />;
  if (label.includes('COMEBACK') || label.includes('HERO') || label.includes('BOUNCE')) return <RocketLaunch size={13} weight="fill" className="shrink-0 text-violet-600 dark:text-violet-400" />;
  if (label.includes('RISING') || label.includes('STAR')) return <TrendUp size={13} weight="bold" className="shrink-0 text-emerald-600 dark:text-emerald-400" />;
  if (label.includes('ATTENTION') || label.includes('NEED')) return <WarningCircle size={13} weight="fill" className="shrink-0 text-rose-600 dark:text-rose-400" />;
  if (label.includes('SUNDAY') || label.includes('SLUMP')) return <CalendarBlank size={13} weight="fill" className="shrink-0 text-orange-600 dark:text-orange-400" />;
  if (label.includes('MONDAY') || label.includes('CHAMPION')) return <Trophy size={13} weight="fill" className="shrink-0 text-teal-600 dark:text-teal-400" />;
  if (label.includes('GOLDEN') || label.includes('HOUR')) return <Clock size={13} weight="fill" className="shrink-0 text-amber-600 dark:text-amber-400" />;
  if (label.includes('SURGE')) return <Lightning size={13} weight="fill" className="shrink-0 text-emerald-600 dark:text-emerald-400" />;
  return <Sparkle size={13} weight="fill" className="shrink-0 text-indigo-600 dark:text-indigo-400" />;
}

export default function InsightFeed() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const navigate = useNavigate();
  const { habits, allSummaries } = useData();
  const { isHinglish, t } = useLanguage();

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const completedSummaries = useMemo(() => {
    return (allSummaries || []).filter(s => {
      const sDate = s.id || s.date;
      return sDate && sDate < todayStr;
    });
  }, [allSummaries, todayStr]);

  const isLocked = (completedSummaries?.length || 0) < 7;
  const daysRemaining = Math.max(0, 7 - (completedSummaries?.length || 0));

  const [shareInsight, setShareInsight] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [explainerBadge, setExplainerBadge] = useState(null);
  const [showLockModal, setShowLockModal] = useState(isLocked);

  // 4 Main Dropdown Sections: ALL CLOSED BY DEFAULT, SINGLE-OPEN ACCORDION
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (key) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setOpenSection(prev => (prev === key ? null : key));
  };

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

  const sampleInsights = useMemo(() => [
    // 1. TODAY / YESTERDAY SAMPLE
    {
      id: 'sample_today_1',
      timeframe: 'today',
      archetype: 'duo',
      icon: 'join_inner',
      badge: { label: 'POWER DUO', color: 'sky' },
      dateCategory: 'Yesterday',
      timeScope: isHinglish ? 'Yesterday Focus' : 'Yesterday Focus',
      dateRange: isHinglish ? 'Kal Ka Pattern' : 'Yesterday',
      headline: isHinglish
        ? 'Jab aap Morning Hydration karte ho, to Deep Work completion rate +42% badh jata hai'
        : 'When you complete Morning Hydration, Deep Work completion rate surges by +42%',
      subtitle: isHinglish
        ? 'Morning hydration se din bhar ke focused sessions ke liye energy milti hai.'
        : 'Morning hydration creates optimal cognitive stamina for focused sessions.',
      body: isHinglish
        ? 'Pichhle dino me jin dino aapne hydration complete kiya, un dino Deep Work 5 me se 6 baar 100% raha. Ye aapka strongest synergy combo hai.'
        : 'On days with proper hydration across tracked sessions, Deep Work hit 100% in 5 out of 6 tracked days. This is your strongest behavioral synergy.',
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
      id: 'sample_today_2',
      timeframe: 'today',
      archetype: 'time',
      icon: 'schedule',
      badge: { label: 'GOLDEN HOUR', color: 'amber' },
      dateCategory: 'Yesterday',
      timeScope: isHinglish ? 'Yesterday Trigger' : 'Yesterday Trigger',
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

    // 2. WEEKLY (7 DAYS) SAMPLE
    {
      id: 'sample_weekly_1',
      timeframe: 'weekly',
      archetype: 'growth',
      icon: 'trending_up',
      badge: { label: 'RISING STAR', color: 'emerald' },
      dateCategory: 'Weekly',
      timeScope: isHinglish ? 'Last 7 Days' : 'Last 7 Days',
      dateRange: isHinglish ? 'Past 7 Days' : 'Past 7 Days',
      headline: isHinglish
        ? 'Reading habit me pichhle 7 dino me +24% ka steady growth dekha gaya'
        : 'Reading consistency climbed steadily by +24% over the past 7 days',
      subtitle: isHinglish
        ? 'Pichhle hafte: 58% ➔ Is hafte: 82%'
        : 'Previous Week: 58% ➔ This Week: 82%',
      body: isHinglish
        ? 'Pichhle hafte ke 4 misses ke mukable is hafte sirf 1 miss hua. Aapka evening consistency band kafi strong ho raha hai.'
        : 'Recorded only 1 slip this week compared to 4 prior misses. Your evening retention routine is consolidating.',
      visualType: 'comparison',
      visualData: { bar1Label: 'Prior 7 Days', bar1Val: 58, bar2Label: 'Recent 7 Days', bar2Val: 82, accentColor: 'emerald' }
    },
    {
      id: 'sample_weekly_2',
      timeframe: 'weekly',
      archetype: 'bounce_back',
      icon: 'verified',
      badge: { label: 'COMEBACK HERO', color: 'violet' },
      dateCategory: 'Weekly',
      timeScope: isHinglish ? 'Recent Comeback' : 'Recent Comeback',
      dateRange: isHinglish ? 'Past 7 Days' : 'Past 7 Days',
      headline: isHinglish
        ? 'Meditation me 2-din ke slip ke baad instant bounce back kiya'
        : 'Rapid bounce back in Meditation following a 2-day dip',
      subtitle: isHinglish
        ? 'Zero streak drop mentality: slip ke turant baad perfect score achieve kiya'
        : 'Resilience triggered: converted friction immediately back to 100%',
      body: isHinglish
        ? 'Aapne friction ko streak killer nahi banne diya aur turant normal baseline pe return kiya.'
        : 'Prevented minor drift from becoming habit decay by instantly re-engaging.',
      visualType: 'comparison',
      visualData: { bar1Label: 'Slip Day', bar1Val: 20, bar2Label: 'Rebound Day', bar2Val: 100, accentColor: 'violet' }
    },

    // 3. 14-DAY SAMPLE
    {
      id: 'sample_days14_1',
      timeframe: 'days14',
      archetype: 'biweekly',
      icon: 'bar_chart',
      badge: { label: 'BI-WEEKLY SURGE', color: 'sky' },
      dateCategory: '14 Days',
      timeScope: isHinglish ? '14-Day Trajectory' : '14-Day Trajectory',
      dateRange: isHinglish ? 'Past 14 Days' : 'Past 14 Days',
      headline: isHinglish
        ? 'Daily Journaling pichhle 14 dino me +32% zyada stable ho chuki hai'
        : 'Daily Journaling consistency surged by +32% across the past 14 days',
      subtitle: isHinglish
        ? 'Prior Week Avg: 50% ➔ Current Week Avg: 82%'
        : 'Prior 7-Day Avg: 50% ➔ Recent 7-Day Avg: 82%',
      body: isHinglish
        ? 'Aapka 14-day trajectory batata hai ki journaling ab ek natural bedtime reflex ban chuka hai.'
        : 'Your 14-day trend indicates journaling is solidifying into an effortless bedtime habit.',
      visualType: 'comparison',
      visualData: { bar1Label: 'Prior 7 Days', bar1Val: 50, bar2Label: 'Recent 7 Days', bar2Val: 82, accentColor: 'sky' }
    },

    // 4. 30-DAY (MONTHLY) SAMPLE
    {
      id: 'sample_days30_1',
      timeframe: 'days30',
      archetype: 'keystone',
      icon: 'auto_awesome',
      badge: { label: 'KEYSTONE HABIT', color: 'purple' },
      dateCategory: '30 Days',
      timeScope: isHinglish ? '30-Day Analysis' : '30-Day Analysis',
      dateRange: isHinglish ? 'Past Month' : 'Past Month',
      headline: isHinglish
        ? 'Morning Workout aapke poore din ka master keystone catalyst hai'
        : 'Morning Workout is your master keystone catalyst for the day',
      subtitle: isHinglish
        ? 'Overall daily score me +34% ka massive boost unlock karta hai'
        : 'Unlocks +34% higher overall daily habit performance',
      body: isHinglish
        ? 'Workout wale dino me aapka overall day completion 86% rehta hai, jabki miss hone par 52%. Subah isko pehle lock karo.'
        : 'On days with workout completed, your overall day completion averages 86% vs 52% on rest days. Protect this anchor!',
      visualType: 'comparison',
      visualData: { bar1Label: 'With Workout', bar1Val: 86, bar2Label: 'Without Workout', bar2Val: 52, accentColor: 'purple' }
    },
    {
      id: 'sample_days30_2',
      timeframe: 'days30',
      archetype: 'anomaly',
      icon: 'event_busy',
      badge: { label: 'SUNDAY SLUMP', color: 'orange' },
      dateCategory: '30 Days',
      timeScope: isHinglish ? '30-Day Day Rhythm' : '30-Day Day Rhythm',
      dateRange: isHinglish ? 'Past Month' : 'Past Month',
      headline: isHinglish
        ? 'Sundays ko aapka overall habit score 28% tak dip hota hai'
        : 'Your habit completion rate drops by 28% on Sundays',
      subtitle: isHinglish
        ? 'Weekdays Avg: 84% vs Sunday Avg: 56%'
        : 'Weekdays Avg: 84% vs Sunday Avg: 56%',
      body: isHinglish
        ? 'Sunday ko schedule free hone se routine loose ho jata hai. Sirf 1-2 core habits maintain karke momentum intact rakho.'
        : 'Unstructured weekends disrupt routine cues. Keep just 1-2 core micro-habits on Sundays to prevent streak friction.',
      visualType: 'comparison',
      visualData: { bar1Label: 'Weekdays Avg', bar1Val: 84, bar2Label: 'Sunday Avg', bar2Val: 56, accentColor: 'orange' }
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

  // Group insights into the 4 main timeframes
  const todayInsights = useMemo(() => {
    return insights.filter(i => i.timeframe === 'today' || i.dateCategory === 'Today' || i.dateCategory === 'Yesterday' || i.category === 'YESTERDAY' || i.timeScope?.includes('Today') || i.timeScope?.includes('Yesterday'));
  }, [insights]);

  const weeklyInsights = useMemo(() => {
    return insights.filter(i => i.timeframe === 'weekly' || i.dateCategory === 'Weekly' || i.timeScope?.includes('7 Days'));
  }, [insights]);

  const days14Insights = useMemo(() => {
    return insights.filter(i => i.timeframe === 'days14' || i.dateCategory === '14 Days' || i.timeScope?.includes('14-Day'));
  }, [insights]);

  const days30Insights = useMemo(() => {
    return insights.filter(i => i.timeframe === 'days30' || i.dateCategory === '30 Days' || i.timeScope?.includes('30-Day') || i.timeScope?.includes('Month'));
  }, [insights]);

  const sectionsConfig = [
    {
      key: 'today',
      title: isHinglish ? "Yesterday's Insights (कल का परफॉर्मेंस)" : "Yesterday's Insights (Latest Day)",
      subtitle: isHinglish ? 'कल के ट्रिगर्स, कमबैक और डेली मोमेंटम' : 'Yesterday\'s triggers, comeback rebounds & daily momentum',
      items: todayInsights,
      icon: <Lightning size={18} weight="fill" className="text-amber-500" />,
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
    },
    {
      key: 'weekly',
      title: isHinglish ? 'Weekly Insights (7 Days / वीकली)' : 'Weekly Insights (7 Days)',
      subtitle: isHinglish ? '7-दिन के राइजिंग स्टार्स, स्लोप्स और कमबैक ट्रेंड्स' : '7-day rising stars, slips & bounce-back rebounds',
      items: weeklyInsights,
      icon: <CalendarCheck size={18} weight="fill" className="text-emerald-500" />,
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
    },
    {
      key: 'days14',
      title: isHinglish ? '14-Day Patterns (14 डेज़)' : '14-Day Patterns (Bi-Weekly)',
      subtitle: isHinglish ? '14 दिनों के कंसिस्टेंसी शिफ्ट्स और हैबिट स्टेबलाइजेशन' : 'Bi-weekly consistency shifts & routine crystallization',
      items: days14Insights,
      icon: <ChartBar size={18} weight="fill" className="text-sky-500" />,
      badgeColor: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
    },
    {
      key: 'days30',
      title: isHinglish ? '30-Day Analysis (मंथली / 30 डेज़)' : '30-Day Monthly Analysis',
      subtitle: isHinglish ? 'Power Duos, Keystone Habits और वीकेंड पैटर्न्स' : 'Power Duos, Keystone Habits & day rhythm anomalies',
      items: days30Insights,
      icon: <Crown size={18} weight="fill" className="text-purple-500" />,
      badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
    }
  ];

  return (
    <div 
      className="max-w-7xl mx-auto w-full pb-20"
      style={{ padding: '0 clamp(0.25rem, 2vw, 1.5rem)', gap: 'clamp(1rem, 2.2vw, 2rem)', display: 'flex', flexDirection: 'column' }}
    >
      
      {/* ── Sample Preview Mode Header ── */}
      {isLocked && (
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {isHinglish ? 'Sample Preview Mode' : 'Sample Preview Mode'}
            </span>
          </div>

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

            <div className="flex justify-end pt-1">
              <button
                onClick={() => navigate('/roadmap')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>{isHinglish ? 'View Roadmap' : 'View Roadmap'}</span>
                <Icon name="arrow_forward" className="text-[13px]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header Bar ── */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800"
        style={{ paddingBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)', gap: 'clamp(0.75rem, 1.5vw, 1.5rem)' }}
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate('/')}
            className="self-start flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
            style={{ padding: 'clamp(0.35rem, 0.7vw, 0.5rem) clamp(0.65rem, 1vw, 0.85rem)', fontSize: 'clamp(0.72rem, 0.85vw, 0.82rem)' }}
          >
            <ArrowLeft size={16} weight="bold" />
            <span>{isHinglish ? 'Dashboard' : 'Back to Dashboard'}</span>
          </button>

          <div>
            <h1 
              className="font-black text-slate-900 dark:text-white tracking-tight flex items-center flex-wrap"
              style={{ fontSize: 'clamp(1.25rem, 2vw + 0.5rem, 1.85rem)', gap: 'clamp(0.5rem, 1vw, 0.75rem)' }}
            >
              <span>{isHinglish ? 'Daily Insight Feed' : 'Daily Insight Feed'}</span>
              <span 
                className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold"
                style={{ padding: 'clamp(0.15rem, 0.4vw, 0.25rem) clamp(0.5rem, 0.8vw, 0.75rem)', fontSize: 'clamp(0.7rem, 0.85vw, 0.85rem)' }}
              >
                {insights.length} {insights.length === 1 ? 'Insight' : 'Insights'}
              </span>
            </h1>
            <p 
              className="text-slate-500 dark:text-slate-400 font-medium mt-1 leading-normal"
              style={{ fontSize: 'clamp(0.75rem, 0.9vw + 0.35rem, 0.9rem)' }}
            >
              {isHinglish 
                ? 'Today, Weekly (7D), 14 Days aur Monthly (30D) ke behavioral patterns aur Power Duos.'
                : 'Your behavioral mirror - discovering hidden routines, Power Duos, and multi-week momentum patterns.'}
            </p>
          </div>
        </div>

        {/* Right Action: How Insights Work Guide Button */}
        <button
          onClick={() => setShowGuideModal(true)}
          className="self-start sm:self-center flex items-center rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold transition-all shadow-xs cursor-pointer shrink-0"
          style={{ padding: 'clamp(0.45rem, 0.9vw, 0.65rem) clamp(0.75rem, 1.2vw, 1.1rem)', gap: 'clamp(0.4rem, 0.8vw, 0.6rem)', fontSize: 'clamp(0.72rem, 0.85vw, 0.82rem)' }}
        >
          <span 
            className="rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black"
            style={{ width: 'clamp(1.1rem, 1.5vw, 1.35rem)', height: 'clamp(1.1rem, 1.5vw, 1.35rem)', fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)' }}
          >
            i
          </span>
          <span>{isHinglish ? 'How Insights Work' : 'How Insights Work'}</span>
        </button>
      </div>

      {/* ── 4 Dropdown Accordion Sections (Single-Open, Closed by default) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.85rem, 1.8vw, 1.5rem)' }}>
        
        {sectionsConfig.map((section) => {
          const isOpen = openSection === section.key;
          const hasItems = section.items.length > 0;

          return (
            <div 
              key={section.key} 
              className="bg-slate-50/70 dark:bg-[#121622] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs transition-all"
            >
              {/* Dropdown Header Bar (Tap to toggle single-open accordion) */}
              <div 
                onClick={() => toggleSection(section.key)}
                className="p-3.5 sm:p-4 md:p-5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                    {section.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                        {section.title}
                      </h2>
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-extrabold border ' + section.badgeColor}>
                        {section.items.length} {section.items.length === 1 ? 'Insight' : 'Insights'}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                {/* Dropdown Arrow on Right Side */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                    {isOpen ? (isHinglish ? 'बंद करें' : 'Collapse') : (isHinglish ? 'खोलें' : 'Expand')}
                  </span>
                  <div className={'w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 transition-transform duration-200 ' + (isOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : '')}>
                    <CaretDown size={16} weight="bold" />
                  </div>
                </div>
              </div>

              {/* Collapsible Content Area */}
              {isOpen && (
                <div className="p-4 sm:p-6 pt-0 border-t border-slate-200/70 dark:border-slate-800/70 animate-in fade-in duration-200">
                  {!hasItems ? (
                    <div className="py-8 px-4 bg-white dark:bg-[#161b2a] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center mt-3">
                      <Sparkle size={24} weight="fill" className="text-slate-400 mb-2" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        {isHinglish ? 'अभी इस टाइमफ़्रेम में कोई इनसाइट नहीं है' : 'No insights generated for this timeframe yet'}
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                        {isHinglish ? 'लगातार ट्रैकिंग जारी रखें, पैटर्न्स डिटेक्ट होते ही यहाँ दिखेंगे।' : 'Continue logging your daily habits to discover automatic patterns here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
                      {section.items.map((item, idx) => (
                        <InsightItemRow 
                          key={item.id || idx} 
                          insight={item} 
                          feedback={feedback[item.id]} 
                          onVote={handleVote}
                          onShare={() => setShareInsight(item)}
                          onExplainBadge={(badge) => setExplainerBadge(badge)}
                          navigate={navigate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

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

function InsightItemRow({ insight, feedback, onVote, onShare, onExplainBadge, navigate }) {
  const badgeColors = {
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    violet: 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    orange: 'bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
  };

  const currentBadgeClass = badgeColors[insight.badge?.color] || badgeColors.sky;

  return (
    <div className="py-4 sm:py-5 first:pt-3.5 last:pb-1 flex flex-col gap-3 transition-colors">
      
      <div className="flex flex-col gap-2.5">
        {/* Top Row: Badge + Time Range + Share Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => onExplainBadge?.(insight.badge?.label)}
              title="Tap to learn what this insight means"
              className={`font-extrabold uppercase tracking-wider rounded-full border active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${currentBadgeClass}`}
              style={{ padding: 'clamp(0.18rem, 0.4vw, 0.28rem) clamp(0.55rem, 0.8vw, 0.75rem)', fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)' }}
            >
              {getBadgeIcon(insight.badge?.label)}
              <span>{insight.badge?.label}</span>
            </button>
            
            {insight.dateRange && (
              <span 
                className="font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700 shadow-2xs"
                style={{ fontSize: 'clamp(0.62rem, 0.75vw, 0.72rem)' }}
              >
                {insight.timeScope ? `${insight.timeScope}: ` : ''}{insight.dateRange}
              </span>
            )}
          </div>

          <button
            onClick={onShare}
            className="rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
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
            className="font-black text-slate-900 dark:text-white leading-snug tracking-tight"
            style={{ fontSize: 'clamp(0.92rem, 1.2vw + 0.45rem, 1.15rem)' }}
          >
            "{insight.headline}"
          </h3>
          <p 
            className="font-bold text-orange-600 dark:text-orange-400 mt-0.5"
            style={{ fontSize: 'clamp(0.72rem, 0.9vw + 0.35rem, 0.85rem)' }}
          >
            {insight.subtitle}
          </p>
        </div>

        {/* Body Description */}
        <TruncatedText
          text={insight.body}
          maxLines={3}
          className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed"
          style={{ fontSize: 'clamp(0.72rem, 0.9vw + 0.35rem, 0.85rem)' }}
        />

        {/* Visual Graph / Chart / Comparison */}
        {insight.visualType && (
          <div className="pt-1 max-w-lg">
            <InsightVisual visualType={insight.visualType} visualData={insight.visualData} />
          </div>
        )}
      </div>

      {/* Bottom Row: Action Link & Feedback */}
      <div className="flex items-center justify-between pt-1" style={{ gap: '0.5rem' }}>
        {insight.actionLabel ? (
          <button
            onClick={() => {
              if (insight.actionRoute) {
                navigate(insight.actionRoute);
              } else if (insight.actionHabitId) {
                navigate(`/analytics/deep-dive?habitId=${insight.actionHabitId}`);
              } else {
                navigate('/analytics');
              }
            }}
            className="font-bold text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{insight.actionLabel}</span>
            <Icon name="arrow_forward" className="text-[12px]" />
          </button>
        ) : <div />}

        <div className="flex items-center gap-1">
          <button
            onClick={() => onVote(insight.id, 'up')}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              feedback === 'up' 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shadow-2xs' 
                : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
            title="Helpful insight"
          >
            <Icon name="thumb_up" className="text-[13px]" filled={feedback === 'up'} />
          </button>
          <button
            onClick={() => onVote(insight.id, 'down')}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              feedback === 'down' 
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shadow-2xs' 
                : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
            title="Not helpful"
          >
            <Icon name="thumb_down" className="text-[13px]" filled={feedback === 'down'} />
          </button>
        </div>
      </div>

    </div>
  );
}

function InsightVisual({ visualType, visualData }) {
  if (!visualData) return null;

  if (visualType === 'overlap') {
    const { habitA, habitB, percentage = 80, isNegative = false, accentColor = 'sky' } = visualData;
    return (
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{habitA} + {habitB}</span>
          <span className={isNegative ? 'text-amber-600 font-extrabold' : 'text-sky-600 font-extrabold'}>
            {percentage}% Synergy
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${isNegative ? 'bg-amber-500' : 'bg-sky-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  if (visualType === 'comparison') {
    const { bar1Label = 'Group A', bar1Val = 80, bar2Label = 'Group B', bar2Val = 40 } = visualData;
    return (
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{bar1Label}</span>
          <span className="font-extrabold text-slate-900 dark:text-white">{bar1Val}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${bar1Val}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
          <span>{bar2Label}</span>
          <span className="font-extrabold">{bar2Val}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${bar2Val}%` }} />
        </div>
      </div>
    );
  }

  if (visualType === 'sparkline') {
    const { points = [30, 40, 50, 70, 85], label = 'Trend', isPositive = true } = visualData;
    const max = Math.max(...points, 100);
    return (
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700 flex items-end justify-between gap-1.5 h-16">
        {points.map((pt, idx) => {
          const hPercent = Math.max(12, Math.round((pt / max) * 100));
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div 
                className={`w-full rounded-md ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                style={{ height: `${hPercent}%` }}
                title={`Day ${idx + 1}: ${pt}%`}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

function InsightGuideModal({ onClose }) {
  const { isHinglish } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);

  const archetypes = [
    {
      id: 'POWER DUO',
      label: isHinglish ? 'पावर डुओ' : 'Power Duo',
      shortName: 'Power Duo',
      title: isHinglish ? '1. Power Duo & Synergy %' : '1. Power Duo & Synergy %',
      icon: PlugsConnected,
      themeColor: 'sky',
      gradient: 'from-sky-500 to-blue-600',
      bgLight: 'bg-sky-50 dark:bg-sky-950/40',
      borderLight: 'border-sky-200 dark:border-sky-800/80',
      textAccent: 'text-sky-600 dark:text-sky-400',
      activeTabClass: 'bg-sky-600 text-white shadow-md shadow-sky-500/25 border-sky-600',
      inactiveTabClass: 'bg-slate-100 dark:bg-[#161a28] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 border-sky-300 dark:border-sky-700',
      tag: isHinglish ? 'पॉजिटिव सिनर्जी' : 'Positive Synergy',
      coreConcept: isHinglish
        ? 'जब 2 आदतें एक-दूसरे को स्वाभाविक रूप से बूस्ट और अनलॉक करती हैं।'
        : 'When two habits mutually reinforce and unlock each other.',
      rule: isHinglish
        ? 'Synergy % यह नापता है कि जब Habit A 70%+ रही, तो Habit B भी कितनी बार 100% पूरी हुई।'
        : 'Synergy % measures the co-occurrence rate: how often doing Habit A directly coincides with completing Habit B.',
      actionTip: isHinglish
        ? 'दोनों आदतों को बैक-टू-बैक (Habit Stacking) करके एक साथ पूरा करें।'
        : 'Pair these habits back-to-back in your daily routine to leverage automatic habit stacking.'
    },
    {
      id: 'FOCUS DRAIN',
      label: isHinglish ? 'फोकस ड्रेन' : 'Focus Drain',
      shortName: 'Focus Drain',
      title: isHinglish ? '2. Focus Drain (Energy Trade-off)' : '2. Focus Drain (Energy Trade-off)',
      icon: BatteryWarning,
      themeColor: 'amber',
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 dark:bg-amber-950/40',
      borderLight: 'border-amber-200 dark:border-amber-800/80',
      textAccent: 'text-amber-600 dark:text-amber-400',
      activeTabClass: 'bg-amber-600 text-white shadow-md shadow-amber-500/25 border-amber-600',
      inactiveTabClass: 'bg-slate-100 dark:bg-[#161a28] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700',
      tag: isHinglish ? 'एनर्जी फ्रिक्शन' : 'Energy Friction',
      coreConcept: isHinglish
        ? 'विलपॉवर और एनर्जी के लिए आपस में टकराने वाली भारी आदतें।'
        : 'Habits that compete for the same energy or willpower pool.',
      rule: isHinglish
        ? 'जब Habit A में बहुत ज़्यादा मानसिक ऊर्जा लगती है, तो Habit B छूटने का रिस्क बढ़ जाता है।'
        : 'When Habit A requires high cognitive load, Habit B slips due to shared willpower depletion.',
      actionTip: isHinglish
        ? 'दोनों आदतों को दिन के अलग-अलग पहर (Morning vs Evening) में बाँटकर करें।'
        : 'Space them across the day (Morning vs Evening) so your willpower stays balanced.'
    },
    {
      id: 'KEYSTONE HABIT',
      label: isHinglish ? 'कीस्टोन हैबिट' : 'Keystone Habit',
      shortName: 'Keystone',
      title: isHinglish ? '3. Keystone Habit (Master Catalyst)' : '3. Keystone Habit (Master Catalyst)',
      icon: Crown,
      themeColor: 'purple',
      gradient: 'from-purple-500 to-violet-600',
      bgLight: 'bg-purple-50 dark:bg-purple-950/40',
      borderLight: 'border-purple-200 dark:border-purple-800/80',
      textAccent: 'text-purple-600 dark:text-purple-400',
      activeTabClass: 'bg-purple-600 text-white shadow-md shadow-purple-500/25 border-purple-600',
      inactiveTabClass: 'bg-slate-100 dark:bg-[#161a28] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800',
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-300 dark:border-purple-700',
      tag: isHinglish ? 'मास्टर उत्प्रेरक' : 'Highest Leverage',
      coreConcept: isHinglish
        ? 'आपके पूरे दिन की सबसे शक्तिशाली और निर्णायक एंकर आदत।'
        : 'The single highest-leverage anchor habit for your routine.',
      rule: isHinglish
        ? 'इस 1 हैबिट को पूरा करने पर आपके पूरे दिन का ओवरऑल स्कोर +20% से +40% तक बढ़ जाता है।'
        : 'Completing this master habit naturally lifts your entire daily performance by +20% to +40%.',
      actionTip: isHinglish
        ? 'इसे अपने दिन की नॉन-नेगोशिएबल प्रायोरिटी #1 बना लें।'
        : 'Lock this in as your non-negotiable Priority #1 first thing every day.'
    },
    {
      id: 'COMEBACK HERO',
      label: isHinglish ? 'कमबैक हीरो' : 'Comeback Hero',
      shortName: 'Comeback Hero',
      title: isHinglish ? '4. Comeback Hero (U-Shape Rebound)' : '4. Comeback Hero (U-Shape Rebound)',
      icon: RocketLaunch,
      themeColor: 'violet',
      gradient: 'from-violet-500 to-indigo-600',
      bgLight: 'bg-violet-50 dark:bg-violet-950/40',
      borderLight: 'border-violet-200 dark:border-violet-800/80',
      textAccent: 'text-violet-600 dark:text-violet-400',
      activeTabClass: 'bg-violet-600 text-white shadow-md shadow-violet-500/25 border-violet-600',
      inactiveTabClass: 'bg-slate-100 dark:bg-[#161a28] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800',
      badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 border-violet-300 dark:border-violet-700',
      tag: isHinglish ? 'बाउंस-बैक ग्रिट' : 'Bounce-Back Grit',
      coreConcept: isHinglish
        ? 'मिड-वीक स्लंप से तुरंत वापस पटरी पर लौटने की ताक़त।'
        : 'Celebrating rapid recovery from mid-week performance dips.',
      rule: isHinglish
        ? 'स्लिप होना सामान्य है - उसी हफ़्ते में 75%+ पर बाउंस-बैक करना ही असली रेजिलिएंस है।'
        : 'Slipping is human; bouncing right back to 75%+ within the same week cements true lifelong grit.',
      actionTip: isHinglish
        ? '"Never Miss Twice" का नियम अपनाएँ - 1 दिन छूटे तो अगले दिन तुरंत रीसेट करें।'
        : 'Apply the "Never Miss Twice" golden rule to protect habit momentum.'
    },
    {
      id: 'RISING STAR',
      label: isHinglish ? 'राइज़िंग स्टार' : 'Rising Star',
      shortName: 'Rising Star',
      title: isHinglish ? '5. Rising Star (7-Day Momentum)' : '5. Rising Star (7-Day Momentum)',
      icon: TrendUp,
      themeColor: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderLight: 'border-emerald-200 dark:border-emerald-800/80',
      textAccent: 'text-emerald-600 dark:text-emerald-400',
      activeTabClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 border-emerald-600',
      inactiveTabClass: 'bg-slate-100 dark:bg-[#161a28] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
      tag: isHinglish ? 'लगातार ग्रोथ' : 'Upward Momentum',
      coreConcept: isHinglish
        ? 'लगातार 7 दिनों की मजबूत और चढ़ती हुई लय (Momentum)।'
        : 'Continuous 7-day upward trajectory and habit momentum.',
      rule: isHinglish
        ? 'यह दिखाता है कि आदत अब दिमाग में पक्की होने लगी है और फ्रिक्शन लगातार घट रहा है।'
        : 'Highlights positive velocity where daily friction is steadily dropping.',
      actionTip: isHinglish
        ? 'मोमेंटम को बनाए रखें और टारगेट को अचानक ज़्यादा भारी न करें।'
        : 'Protect the upward rhythm; keep daily friction low and stay consistent.'
    },
    {
      id: 'ATTENTION NEEDED',
      label: isHinglish ? 'अटेंशन नीडेड' : 'Attention Needed',
      shortName: 'Attention',
      title: isHinglish ? '6. Attention Needed (Downward Slope)' : '6. Attention Needed (Downward Slope)',
      icon: WarningCircle,
      themeColor: 'rose',
      gradient: 'from-rose-500 to-red-600',
      bgLight: 'bg-rose-50 dark:bg-rose-950/40',
      borderLight: 'border-rose-200 dark:border-rose-800/80',
      textAccent: 'text-rose-600 dark:text-rose-400',
      activeTabClass: 'bg-rose-600 text-white shadow-md shadow-rose-500/25 border-rose-600',
      inactiveTabClass: 'bg-slate-100 dark:bg-[#161a28] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300 dark:border-rose-700',
      tag: isHinglish ? 'अलर्ट सिग्नल' : 'Friction Warning',
      coreConcept: isHinglish
        ? 'आदत में आ रही लगातार गिरावट का शुरुआती वॉर्निंग सिग्नल।'
        : 'Early warning detection of downward performance trend.',
      rule: isHinglish
        ? 'हाल के दिनों में स्कोर गिरने पर तुरंत अलर्ट करता है ताकि आदत पूरी तरह टूटने से पहले बचाई जा सके।'
        : 'Detects a multi-day slide so you can intervene before the habit completely breaks.',
      actionTip: isHinglish
        ? '2-Minute Rule अपनाएँ - फ्रिक्शन घटाकर सिर्फ़ 2 मिनट का मिनी-वर्जन करें।'
        : 'Apply the 2-Minute Rule to lower friction and reset the habit effortlessly.'
    },
    {
      id: 'DAY RHYTHM',
      label: isHinglish ? 'डे रिदम' : 'Day Rhythm',
      shortName: 'Day Rhythm',
      title: isHinglish ? '7. Day Rhythm (Weekly Anomalies)' : '7. Day Rhythm (Weekly Anomalies)',
      icon: CalendarBlank,
      themeColor: 'teal',
      gradient: 'from-teal-500 to-cyan-600',
      bgLight: 'bg-teal-50 dark:bg-teal-950/40',
      borderLight: 'border-teal-200 dark:border-teal-800/80',
      textAccent: 'text-teal-600 dark:text-teal-400',
      activeTabClass: 'bg-teal-600 text-white shadow-md shadow-teal-500/25 border-teal-600',
      inactiveTabClass: 'bg-slate-100 dark:bg-[#161a28] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800',
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border-teal-300 dark:border-teal-700',
      tag: isHinglish ? 'साप्ताहिक रिदम' : 'Rhythm Flow',
      coreConcept: isHinglish
        ? 'दिनों के हिसाब से एनर्जी और आदतों के दोहराव वाले पैटर्न।'
        : 'Weekly rhythm variations and day-specific tendencies.',
      rule: isHinglish
        ? 'सोमवार की ऊर्जा या रविवार की सुस्ती जैसे पैटर्न को समझकर तैयारी करने में मदद करता है।'
        : 'Pinpoints Sunday slumps or Monday surges to help optimize your weekly execution.',
      actionTip: isHinglish
        ? 'कमज़ोर दिनों (जैसे संडे) के लिए आसान मिनी-रूटीन तैयार रखें।'
        : 'Pre-plan lighter versions of tough habits for your high-friction days.'
    }
  ];

  const current = archetypes[activeIdx];
  const IconComponent = current.icon;

  const handlePrev = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : archetypes.length - 1));
  };

  const handleNext = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setActiveIdx((prev) => (prev < archetypes.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#131722] rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 space-y-3.5">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-purple-500/20">
              <Sparkle size={17} weight="fill" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {isHinglish ? 'How Habit Insights Work' : 'How Habit Insights Work'}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                {isHinglish ? 'टॉगल करके सभी 7 व्यवहारिक Archetypes समझें' : 'Toggle through all 7 behavioral archetypes'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
          >
            <Icon name="close" className="text-sm" />
          </button>
        </div>

        {/* ── INTERACTIVE TOGGLE PILLS (HORIZONTAL SCROLL) ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1">
          {archetypes.map((arch, idx) => {
            const ArchIcon = arch.icon;
            const isActive = activeIdx === idx;
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  setActiveIdx(idx);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 border cursor-pointer ${
                  isActive ? arch.activeTabClass : arch.inactiveTabClass
                }`}
              >
                <ArchIcon size={13} weight={isActive ? "fill" : "bold"} />
                <span className="whitespace-nowrap">{arch.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* ── SPOTLIGHT SHOWCASE CARD (COMPACT, NO LONG SCROLL) ── */}
        <div className={`p-4 rounded-2xl ${current.bgLight} border ${current.borderLight} space-y-3 transition-all duration-200 relative overflow-hidden`}>
          {/* Card Top Title & Tag */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${current.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                <IconComponent size={20} weight="fill" />
              </div>
              <div className="min-w-0">
                <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {current.title}
                </h5>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[9.5px] font-extrabold border mt-0.5 ${current.badgeClass}`}>
                  {current.tag}
                </span>
              </div>
            </div>

            {/* Step Counter Badge */}
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-black/30 px-2 py-1 rounded-lg shrink-0">
              {activeIdx + 1} / {archetypes.length}
            </span>
          </div>

          {/* 3 Structured Highlight Points */}
          <div className="space-y-2 text-xs">
            {/* 1. Core Idea */}
            <div className="flex items-start gap-2.5 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Lightbulb size={14} weight="fill" />
              </div>
              <div className="min-w-0">
                <strong className="text-slate-900 dark:text-white font-bold block text-[11px]">
                  {isHinglish ? 'मूल विचार (Concept):' : 'Core Concept:'}
                </strong>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug mt-0.5">
                  {current.coreConcept}
                </p>
              </div>
            </div>

            {/* 2. Calculation Rule */}
            <div className="flex items-start gap-2.5 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Lightning size={14} weight="fill" />
              </div>
              <div className="min-w-0">
                <strong className="text-slate-900 dark:text-white font-bold block text-[11px]">
                  {isHinglish ? 'कैलकुलेशन नियम (Rule):' : 'Calculation Rule:'}
                </strong>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug mt-0.5">
                  {current.rule}
                </p>
              </div>
            </div>

            {/* 3. Action Tip */}
            <div className="flex items-start gap-2.5 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Target size={14} weight="fill" />
              </div>
              <div className="min-w-0">
                <strong className="text-slate-900 dark:text-white font-bold block text-[11px]">
                  {isHinglish ? 'सक्सेस टिप (Action):' : 'Champion Strategy:'}
                </strong>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug mt-0.5">
                  {current.actionTip}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Prev / Next Navigator Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all shadow-2xs"
            >
              <span>← {isHinglish ? 'पिछला' : 'Previous'}</span>
            </button>

            {/* Dot Indicators */}
            <div className="flex items-center gap-1">
              {archetypes.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeIdx === i ? 'w-4 bg-slate-800 dark:bg-white' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all shadow-2xs"
            >
              <span>{isHinglish ? 'अगला' : 'Next'} →</span>
            </button>
          </div>
        </div>

        {/* Footer (Got it button) */}
        <div className="pt-1 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer"
          >
            {isHinglish ? "Got it, Let's Explore" : "Got it, Let's Explore"}
          </button>
        </div>

      </div>
    </div>
  );
}
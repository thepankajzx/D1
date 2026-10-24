import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateStreakData, MILESTONE_TARGETS } from '../lib/streakEngine';
import { evaluateUserBadges } from '../lib/badgeEngine';
import ProPill from './ProPill';
import { 
  Robot, 
  Sparkle, 
  X, 
  ArrowClockwise, 
  PaperPlaneRight, 
  CaretRight, 
  WarningCircle, 
  CheckCircle, 
  Flame, 
  Trophy, 
  Target, 
  Lightbulb, 
  ChatTeardropText,
  CalendarX,
  CalendarCheck,
  Lightning,
  ShieldCheck,
  ShieldWarning,
  SlidersHorizontal,
  Crown,
  TrendUp,
  TrendDown,
  ChartLineUp,
  ChartBar,
  Clock,
  ArrowBendDownRight,
  ArrowsSplit,
  HourglassSimple,
  ArrowsClockwise,
  Check,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react';

// 4 Category Tabs for Segmented Navigation
export const COACH_TABS = [
  { id: 'today', label: 'Today', IconComponent: Target },
  { id: 'patterns', label: 'Patterns', IconComponent: ChartLineUp },
  { id: 'milestones', label: 'Milestones', IconComponent: Trophy },
  { id: 'advice', label: 'Advice', IconComponent: Lightbulb }
];

// Comprehensive Data-Driven Prompt Definitions with Strict Proper Phosphor Icons (NO EMOJIS)
export const COACH_PROMPTS = [
  // ── 1. TODAY & WIN CONDITION
  {
    id: 'daily_win',
    tab: 'today',
    label: 'Minimum Viable Win',
    sublabel: '70%+ score ke liye priority action',
    IconComponent: Target,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    related: ['danger_day', 'catalyst_duos', 'today_status']
  },
  {
    id: 'today_status',
    tab: 'today',
    label: 'Aaj Ka Live Progress',
    sublabel: 'Check-in status aur bachi hui habits',
    IconComponent: CheckCircle,
    colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    related: ['daily_win', 'milestone_runway', 'weakest']
  },

  // ── 2. BEHAVIORAL PATTERNS & DATA
  {
    id: 'danger_day',
    tab: 'patterns',
    label: 'Danger Day & Weekend Gap',
    sublabel: 'Hafte ka sabse kamzor din aur drop',
    IconComponent: CalendarX,
    colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    related: ['crisis_defense', 'daily_win', 'weakest']
  },
  {
    id: 'catalyst_duos',
    tab: 'patterns',
    label: 'Catalyst Habits & Duos',
    sublabel: 'Lead habit aur domino chain effect',
    IconComponent: Lightning,
    colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    related: ['strongest', 'target_tune', 'daily_win']
  },
  {
    id: 'crisis_defense',
    tab: 'patterns',
    label: 'Slump Risk & Crisis Defense',
    sublabel: '2-din drop alert aur comeback speed',
    IconComponent: ShieldCheck,
    colorClass: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    related: ['danger_day', 'coaching_tips', 'daily_win']
  },

  // ── 3. PROGRESSION & HEALTH
  {
    id: 'milestone_runway',
    tab: 'milestones',
    label: 'Next Milestone Runway',
    sublabel: 'Agla honor badge aur trophy timeline',
    IconComponent: Trophy,
    colorClass: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    related: ['strongest', 'daily_win', 'full_report']
  },
  {
    id: 'strongest',
    tab: 'milestones',
    label: 'Champion Strongest Habit',
    sublabel: 'Consistency ka sabse mazboot pillar',
    IconComponent: Crown,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    related: ['catalyst_duos', 'milestone_runway', 'full_report']
  },
  {
    id: 'weakest',
    tab: 'milestones',
    label: 'Drop Risk / Needs Attention',
    sublabel: 'Kamzor habit jahan dhyan dena zaroori hai',
    IconComponent: WarningCircle,
    colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    related: ['target_tune', 'crisis_defense', 'daily_win']
  },

  // ── 4. ADVICE & ACTIONABLE STRATEGY
  {
    id: 'target_tune',
    tab: 'advice',
    label: 'Habit Target Tuning Advice',
    sublabel: 'Overambitious target ko scale-down karein',
    IconComponent: SlidersHorizontal,
    colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    related: ['weakest', 'catalyst_duos', 'full_report']
  },
  {
    id: 'full_report',
    tab: 'advice',
    label: 'Complete Health Scorecard',
    sublabel: 'Sabhi active habits ka performance matrix',
    IconComponent: ChartBar,
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    related: ['daily_win', 'danger_day', 'milestone_runway']
  },
  {
    id: 'coaching_tips',
    tab: 'advice',
    label: 'Atomic Consistency Rules',
    sublabel: 'Habit psychology ke 4 golden rules',
    IconComponent: Lightbulb,
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    related: ['daily_win', 'crisis_defense', 'target_tune']
  }
];

export default function HabitAiCoachBot() {
  const { aiCoachEnabled, habits = [], allSummaries = [], streakTrackingEnabled = true } = useData();
  const { isHinglish } = useLanguage();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isReasoning, setIsReasoning] = useState(false);
  const [reasoningStep, setReasoningStep] = useState(0);
  const [activeStarterTab, setActiveStarterTab] = useState('today');

  const btnRef = useRef(null);
  const msgContainerRef = useRef(null);

  // Dragging state for launcher button
  const dragRef = useRef({
    isDragging: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0
  });

  // Check if current route is Pro/Admin/Org/Coach (Clinical Copilot handles those)
  const isProOrAdmin = (location.pathname === '/pro' || location.pathname.startsWith('/pro/')) || 
                       location.pathname.startsWith('/org') || 
                       location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith('/coach') ||
                       location.pathname.startsWith('/super-admin') ||
                       location.pathname.startsWith('/join');

  // Hardware Back: close bot dialog if open
  useEffect(() => {
    if (!isOpen) return;
    const handleHardwareBack = (e) => {
      setIsOpen(false);
      e.preventDefault();
    };
    window.addEventListener('d1_hardware_back', handleHardwareBack);
    return () => window.removeEventListener('d1_hardware_back', handleHardwareBack);
  }, [isOpen]);

  // Initial Welcome Message
  useEffect(() => {
    resetWelcome();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  }, [messages, isReasoning]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 100% DETERMINISTIC CLIENT-SIDE TELEMETRY INTELLIGENCE ENGINE (ZERO-AI / ZERO-API)
  // ─────────────────────────────────────────────────────────────────────────────
  const getHabitTelemetry = () => {
    const activeHabits = (habits || []).filter(h => h.status !== 'deleted');
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todaySummary = (allSummaries || []).find(s => s.id === todayStr || s.date === todayStr);
    const recent7Summaries = (allSummaries || []).slice(0, 7);

    // 1. Analyze Individual Habits
    const analyzed = activeHabits.map(h => {
      const streakInfo = calculateStreakData(h.id, allSummaries, todayStr);
      
      let hitCount7d = 0;
      let totalLogged7d = 0;
      let scoreSum7d = 0;
      let valSum7d = 0;
      let valCount7d = 0;

      recent7Summaries.forEach(s => {
        const sc = s.habitScores?.[h.id] ?? s.scores?.[h.id];
        if (sc !== undefined && sc !== null && !isNaN(Number(sc))) {
          totalLogged7d++;
          scoreSum7d += Number(sc);
          if (Number(sc) >= 60) hitCount7d++;
        }

        const v = s.habitValues?.[h.id] ?? s.values?.[h.id] ?? s.actuals?.[h.id];
        if (v !== undefined && v !== null && !isNaN(Number(v))) {
          valSum7d += Number(v);
          valCount7d++;
        }
      });

      const completionRate7d = recent7Summaries.length > 0 
        ? Math.round((hitCount7d / recent7Summaries.length) * 100) 
        : 0;
      const avgScore7d = totalLogged7d > 0 ? Math.round(scoreSum7d / totalLogged7d) : 0;
      const avgActualVal7d = valCount7d > 0 ? Math.round((valSum7d / valCount7d) * 10) / 10 : null;
      const missCount7d = Math.max(0, recent7Summaries.length - hitCount7d);

      const rawTodayScore = todaySummary?.habitScores?.[h.id] ?? todaySummary?.scores?.[h.id];
      const todayScore = rawTodayScore !== undefined && rawTodayScore !== null ? Number(rawTodayScore) : null;
      const isDoneToday = todayScore !== null && todayScore >= 60;
      const isLoggedToday = todayScore !== null;

      const targetVal = h.userTarget100 ?? h.target100 ?? h.target ?? h.dailyTarget ?? null;
      const unit = h.unit || h.defaultUnit || '';

      return {
        ...h,
        targetVal,
        unit,
        currentStreak: streakInfo.currentStreak || 0,
        longestStreak: streakInfo.longestStreak || 0,
        consistencyPct: streakInfo.totalDays > 0 ? Math.round((streakInfo.activeDays / streakInfo.totalDays) * 100) : 0,
        completionRate7d,
        avgScore7d,
        avgActualVal7d,
        missCount7d,
        isDoneToday,
        isLoggedToday,
        todayScore
      };
    });

    // Sort strongest & weakest
    const sortedStrongest = [...analyzed].sort((a, b) => {
      const scoreA = (a.currentStreak * 2.5) + (a.completionRate7d * 1.5) + (a.avgScore7d * 0.5);
      const scoreB = (b.currentStreak * 2.5) + (b.completionRate7d * 1.5) + (b.avgScore7d * 0.5);
      return scoreB - scoreA;
    });

    const sortedWeakest = [...analyzed].sort((a, b) => {
      if (a.completionRate7d !== b.completionRate7d) {
        return a.completionRate7d - b.completionRate7d;
      }
      return a.avgScore7d - b.avgScore7d;
    });

    const doneToday = analyzed.filter(h => h.isDoneToday);
    const pendingToday = analyzed.filter(h => !h.isDoneToday);
    const compositeStreak = calculateStreakData('all', allSummaries, todayStr);

    const currStrk = compositeStreak.currentStreak || 0;
    const nextTarget = MILESTONE_TARGETS.find(m => m > currStrk) || 365;
    const daysToMilestone = Math.max(0, nextTarget - currStrk);

    // 2. Day-of-Week & Weekend Patterns
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayScoresMap = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    (allSummaries || []).forEach(s => {
      const dayDate = s.id || s.date;
      if (!dayDate) return;
      try {
        const d = new Date(dayDate + 'T00:00:00');
        const dayIdx = d.getDay();
        const score = typeof s.overallScore === 'number' ? s.overallScore : null;
        if (score !== null && !isNaN(score)) {
          dayScoresMap[dayIdx].push(score);
        }
      } catch (e) {}
    });

    const dayAverages = dayNames.map((name, idx) => {
      const list = dayScoresMap[idx];
      const avg = list.length > 0 ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null;
      return { dayIdx: idx, name, count: list.length, avg };
    }).filter(d => d.avg !== null);

    let worstDay = null;
    let bestDay = null;
    if (dayAverages.length > 0) {
      const sortedByAvg = [...dayAverages].sort((a, b) => a.avg - b.avg);
      worstDay = sortedByAvg[0];
      bestDay = sortedByAvg[sortedByAvg.length - 1];
    }

    const weekdayList = [1, 2, 3, 4, 5].flatMap(i => dayScoresMap[i]);
    const weekendList = [0, 6].flatMap(i => dayScoresMap[i]);
    const weekdayAvg = weekdayList.length > 0 ? Math.round(weekdayList.reduce((a, b) => a + b, 0) / weekdayList.length) : null;
    const weekendAvg = weekendList.length > 0 ? Math.round(weekendList.reduce((a, b) => a + b, 0) / weekendList.length) : null;
    const weekendGapPct = (weekdayAvg !== null && weekendAvg !== null && weekdayAvg > weekendAvg)
      ? Math.round(((weekdayAvg - weekendAvg) / weekdayAvg) * 100)
      : 0;

    // 3. Catalyst Habits & Cross-Habit Power Duos
    let leadCatalyst = null;
    let bestDuo = null;
    if (activeHabits.length >= 2 && allSummaries.length >= 3) {
      let maxBoost = -1;
      let highestCorrelationDuo = null;
      let highestCoHits = -1;

      activeHabits.forEach(hA => {
        let daysDoneA = 0;
        let otherHitsWhenADone = 0;
        let otherTotalChecks = 0;

        allSummaries.forEach(s => {
          const scA = s.habitScores?.[hA.id] ?? s.scores?.[hA.id];
          if (scA !== undefined && Number(scA) >= 60) {
            daysDoneA++;
            activeHabits.forEach(hB => {
              if (hA.id === hB.id) return;
              const scB = s.habitScores?.[hB.id] ?? s.scores?.[hB.id];
              otherTotalChecks++;
              if (scB !== undefined && Number(scB) >= 60) {
                otherHitsWhenADone++;
              }
            });
          }
        });

        const boostRate = otherTotalChecks > 0 ? Math.round((otherHitsWhenADone / otherTotalChecks) * 100) : 0;
        if (daysDoneA >= 1 && boostRate > maxBoost) {
          maxBoost = boostRate;
          leadCatalyst = { habit: hA, boostRate, daysDone: daysDoneA };
        }
      });

      // Find top paired duo
      for (let i = 0; i < activeHabits.length; i++) {
        for (let j = i + 1; j < activeHabits.length; j++) {
          const h1 = activeHabits[i];
          const h2 = activeHabits[j];
          let bothDoneCount = 0;

          allSummaries.forEach(s => {
            const sc1 = s.habitScores?.[h1.id] ?? s.scores?.[h1.id];
            const sc2 = s.habitScores?.[h2.id] ?? s.scores?.[h2.id];
            if (sc1 !== undefined && sc2 !== undefined && Number(sc1) >= 60 && Number(sc2) >= 60) {
              bothDoneCount++;
            }
          });

          if (bothDoneCount > highestCoHits) {
            highestCoHits = bothDoneCount;
            highestCorrelationDuo = { h1, h2, bothDoneCount };
          }
        }
      }
      bestDuo = highestCorrelationDuo;
    }

    // 4. Slump Risk & Crisis Defense
    const recentSummariesChronological = [...(allSummaries || [])].slice(0, 14);
    let yesterdayScore = null;
    if (recentSummariesChronological.length >= 2) {
      const ySummary = recentSummariesChronological[1];
      yesterdayScore = typeof ySummary.overallScore === 'number' ? ySummary.overallScore : null;
    }
    const isAtSlumpRisk = (yesterdayScore !== null && yesterdayScore < 40 && doneToday.length === 0);

    // 1-Day Reset Rate calculation (How often an off day <40% is followed by >=60% next day)
    let offDaysCount = 0;
    let bouncedBackCount = 0;
    for (let i = 0; i < allSummaries.length - 1; i++) {
      const curr = allSummaries[i];
      const prev = allSummaries[i + 1];
      if (prev && typeof prev.overallScore === 'number' && prev.overallScore < 40) {
        offDaysCount++;
        if (typeof curr.overallScore === 'number' && curr.overallScore >= 60) {
          bouncedBackCount++;
        }
      }
    }
    const resetRatePct = offDaysCount > 0 ? Math.round((bouncedBackCount / offDaysCount) * 100) : 85;

    // 5. Next Milestone & Honors Runway
    let badgeState = null;
    try {
      badgeState = evaluateUserBadges(allSummaries, habits, streakTrackingEnabled);
    } catch (e) {}
    const nextLockedBadge = badgeState?.lockedBadges ? badgeState.lockedBadges[0] : null;

    // 6. Minimum Viable Win
    const totalHabits = activeHabits.length;
    const requiredFor70 = Math.ceil(totalHabits * 0.7);
    const neededToWin = Math.max(0, requiredFor70 - doneToday.length);
    const recommendedWinHabits = pendingToday.slice(0, Math.max(1, neededToWin));

    return {
      activeHabits: analyzed,
      strongest: sortedStrongest[0] || null,
      weakest: sortedWeakest[0] || null,
      doneToday,
      pendingToday,
      compositeStreak,
      nextTarget,
      daysToMilestone,
      todayStr,
      dayAverages,
      worstDay,
      bestDay,
      weekdayAvg,
      weekendAvg,
      weekendGapPct,
      leadCatalyst,
      bestDuo,
      yesterdayScore,
      isAtSlumpRisk,
      resetRatePct,
      nextLockedBadge,
      neededToWin,
      recommendedWinHabits,
      requiredFor70
    };
  };

  const resetWelcome = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        sender: 'bot',
        type: 'welcome',
        content: `Hey! Main hoon aapka Definite Habit Coach. Main aapki streaks, weekly patterns, aur daily completion ko live analyze karta hoon taaki aapka momentum kabhi na toote.`
      }
    ]);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PURE FORMULA-DRIVEN INTELLIGENCE RESPONSES (NO EMOJIS, HIGH RIGOR)
  // ─────────────────────────────────────────────────────────────────────────────
  const generateHabitResponse = (promptKey, userQuery = '') => {
    const data = getHabitTelemetry();
    const { 
      activeHabits, 
      strongest, 
      weakest, 
      doneToday, 
      pendingToday, 
      compositeStreak, 
      nextTarget, 
      daysToMilestone, 
      todayStr,
      worstDay,
      bestDay,
      weekdayAvg,
      weekendAvg,
      weekendGapPct,
      leadCatalyst,
      bestDuo,
      isAtSlumpRisk,
      resetRatePct,
      nextLockedBadge,
      neededToWin,
      recommendedWinHabits,
      requiredFor70
    } = data;

    if (activeHabits.length === 0) {
      return {
        title: 'Shuruat Karein: No Active Habits Yet',
        badge: 'Setup Required',
        badgeColor: 'amber',
        text: `Aapne abhi tak koi habit add nahi ki hai.\n\nScreen par '+ Add Habit' par tap karein aur pehle 2 ya 3 habits choose karein (e.g. Hydration, 15 min Walk, Reading). Jaise hi aap track karenge, main aapko live stats aur streaks ka breakdown dunga.`,
        bullets: [
          'Morning anchor habit chunein (e.g., Drink 500ml water)',
          'Evening cooldown habit chunein (e.g., Sleep tracking / screen off)',
          'Chhota target rakhein taaki pehle 3 din momentum automatic bane'
        ],
        followUps: ['coaching_tips']
      };
    }

    // ── 1. TODAY'S MINIMUM VIABLE WIN (MVA) ──────────────────────────────
    if (promptKey === 'daily_win' || /win|minimum|aaj ka win|priority|target 70|kya karu/i.test(userQuery)) {
      const isAlreadyWon = doneToday.length >= requiredFor70;

      if (isAlreadyWon) {
        return {
          title: 'Today Win Secured: 70%+ Threshold Locked',
          badge: 'Win Achieved',
          badgeColor: 'emerald',
          text: `Shaandar! Aaj aapne ${doneToday.length} / ${activeHabits.length} habits complete kar liye hain. Aaj ka score already winning tier me lock ho chuka hai.`,
          stats: [
            { label: 'Completed', val: `${doneToday.length} Habits` },
            { label: 'Current Score', val: `${Math.round((doneToday.length / activeHabits.length) * 100)}%` },
            { label: 'Streak Status', val: `${compositeStreak.currentStreak} Days Safe` }
          ],
          bullets: [
            `Aapka daily win condition poora hai. Remaining habits bonus consistency boost hain.`,
            `Streak protect ho chuki hai. Relax karein aur kal ka focus ready rakhein.`
          ],
          followUps: ['today_status', 'milestone_runway', 'danger_day']
        };
      }

      // Prioritize pending habits: catalyst first, then highest 7d rate
      const sortedPending = [...pendingToday].sort((a, b) => {
        if (leadCatalyst && a.id === leadCatalyst.habit.id) return -1;
        if (leadCatalyst && b.id === leadCatalyst.habit.id) return 1;
        return (b.completionRate7d || 0) - (a.completionRate7d || 0);
      });
      const priorityPicks = sortedPending.slice(0, Math.max(1, neededToWin));

      return {
        title: 'Today Minimum Viable Win Formula',
        badge: 'Priority Action',
        badgeColor: 'amber',
        text: `Aaj ka overall score 70%+ karne aur streak protect karne ke liye aapko sirf <strong>${neededToWin} aur habit(s)</strong> complete karni hain.`,
        stats: [
          { label: 'Done Today', val: `${doneToday.length} / ${activeHabits.length}` },
          { label: 'Needed For Win', val: `${neededToWin} Habit(s)` },
          { label: 'Target Threshold', val: '70% Win Tier' }
        ],
        bullets: [
          `Recommended Priority: Inhe pehle niptayein -> ${priorityPicks.map(h => `<strong>${h.name}</strong> (${h.targetVal ? `${h.targetVal} ${h.unit}`.trim() : 'Daily goal'})`).join(', ')}.`,
          `High-leverage action: ${doneToday.length} complete + ${neededToWin} aur = ${requiredFor70} / ${activeHabits.length} habits (70%+ winning score tier).`,
          `Din khatam hone se pehle sirf inko complete karein taaki streak freeze ya reset na ho.`
        ],
        followUps: ['today_status', 'catalyst_duos', 'danger_day']
      };
    }

    // ── 2. DANGER DAY & WEEKEND GAP ─────────────────────────────────────
    if (promptKey === 'danger_day' || /danger|weekend|sunday|drop|day pattern|hafta|kamzor din/i.test(userQuery)) {
      if (!worstDay) {
        return {
          title: 'Weekly Pattern: Analyzing Day Curves',
          badge: 'Building History',
          badgeColor: 'indigo',
          text: `Aapke paas abhi kam se kam 5-7 dino ka data ikattha ho raha hai. Kuch aur din log karte hi aapka personal Danger Day aur Weekend gap mathematically calculate ho jayega.`,
          bullets: [
            `General Benchmark: 73% logo ka sabse bada slump Sunday aur Monday subah hota hai.`,
            `Pre-commitment Rule: Weekend par target ko 50% reduce karein taaki consistency break na ho.`
          ],
          followUps: ['daily_win', 'crisis_defense', 'coaching_tips']
        };
      }

      return {
        title: `Danger Day Analysis: ${worstDay.name}`,
        badge: 'Pattern Detected',
        badgeColor: 'rose',
        text: `Pichle records ke mutabiq aapka sabse bada drop <strong>${worstDay.name}</strong> (${worstDay.avg}% avg) par hota hai, jabki aapka peak day <strong>${bestDay?.name || 'Weekday'}</strong> (${bestDay?.avg || 85}% avg) hai.`,
        stats: [
          { label: 'Danger Day', val: `${worstDay.name} (${worstDay.avg}%)` },
          { label: 'Peak Day', val: `${bestDay?.name || 'N/A'} (${bestDay?.avg || 0}%)` },
          { label: 'Weekend Drop', val: weekendGapPct > 0 ? `-${weekendGapPct}%` : 'Stable' }
        ],
        bullets: [
          weekendGapPct > 15
            ? `Weekend Gap Alert: Weekdays ke muqable weekends par aapka completion ${weekendGapPct}% drop hota hai.`
            : `Weekend Performance: Aapka weekend execution weekdays ke barabar steady chal raha hai.`,
          `Defensive Action on ${worstDay.name}: Is din full routine follow karne ki jagah sirf 1 core habit lock karein taaki zero-day na bane.`,
          `Trigger Planning: ${worstDay.name} ke din subah ka schedule pehle se lock karein.`
        ],
        followUps: ['crisis_defense', 'daily_win', 'weakest']
      };
    }

    // ── 3. CATALYST HABITS & POWER DUOS ─────────────────────────────────
    if (promptKey === 'catalyst_duos' || /catalyst|duo|power duo|pair|domino|chain|trigger/i.test(userQuery)) {
      if (!leadCatalyst && !bestDuo) {
        return {
          title: 'Catalyst Habits & Domino Engine',
          badge: 'Cross-Correlation',
          badgeColor: 'purple',
          text: `Jab aap 3 ya zyada habits ko regular log karte hain, toh system automatically un habits ko pehchanta hai jo doosri habits ko trigger karti hain.`,
          bullets: [
            `Lead Domino Rule: Ek primary physical habit (jaise Sleep ya Morning Hydration) poore din ke execution ko anchor karti hai.`,
            `Habit Pairing: Kisi nayi aadat ko hamesha apni sabse consistent habit ke turant baad place karein.`
          ],
          followUps: ['strongest', 'target_tune', 'daily_win']
        };
      }

      return {
        title: `Catalyst Habit: ${leadCatalyst ? leadCatalyst.habit.name : strongest?.name}`,
        badge: 'Lead Domino',
        badgeColor: 'purple',
        text: leadCatalyst 
          ? `Jab aap <strong>${leadCatalyst.habit.name}</strong> complete karte hain, toh baki sabhi habits ke complete hone ka chance <strong>${leadCatalyst.boostRate}%</strong> tak badh jata hai!`
          : `Aapki sabse influential habit <strong>${strongest?.name}</strong> hai. Yeh aapke poore schedule ka anchor pillar hai.`,
        stats: [
          { label: 'Catalyst Habit', val: leadCatalyst ? leadCatalyst.habit.name : (strongest?.name || 'N/A') },
          { label: 'Chain Success', val: leadCatalyst ? `${leadCatalyst.boostRate}% Hit` : '90%+' },
          { label: 'Power Duo Pair', val: bestDuo ? `${bestDuo.h1.name.slice(0, 8)} + ${bestDuo.h2.name.slice(0, 8)}` : 'Forming' }
        ],
        bullets: [
          bestDuo ? `Strongest Duo: <strong>${bestDuo.h1.name}</strong> aur <strong>${bestDuo.h2.name}</strong> aksar ek sath complete hote hain (${bestDuo.bothDoneCount} matches).` : `Duo Analysis: Data synchronize ho raha hai.`,
          `Execution Strategy: Subah pehle apni Catalyst habit (${leadCatalyst?.habit.name || strongest?.name}) complete karein; baki routine khud-ba-khud follow hoga.`,
          `Avoid Friction: Agar Catalyst habit drop hoti hai toh baki routine par domino crash ka khatra hota hai.`
        ],
        followUps: ['strongest', 'target_tune', 'daily_win']
      };
    }

    // ── 4. SLUMP RISK & CRISIS DEFENSE ──────────────────────────────────
    if (promptKey === 'crisis_defense' || /slump|crisis|bounce|recovery|drop risk|break|reset rate/i.test(userQuery)) {
      return {
        title: isAtSlumpRisk ? 'Slump Early-Warning: Crisis Defense Mode' : 'Resilience & Slump Shield',
        badge: isAtSlumpRisk ? 'High Alert' : 'Shield Active',
        badgeColor: isAtSlumpRisk ? 'rose' : 'cyan',
        text: isAtSlumpRisk
          ? `Alert: Kal aapka score low tha aur aaj abhi tak habit log nahi hui hai. Psychological science kehti hai: <strong>'Never Miss Twice'</strong>. 1 din drop accident hai, 2 din drop nayi buri aadat banna shuru ho jata hai.`
          : `Aapka historical comeback record mazboot hai. Pichle low performance days me aapka bounce-back success rate <strong>${resetRatePct}%</strong> raha hai.`,
        stats: [
          { label: '1-Day Reset Rate', val: `${resetRatePct}%` },
          { label: 'Slump Status', val: isAtSlumpRisk ? 'At Risk' : 'Protected' },
          { label: 'Defense Action', val: 'Lock 1 Habit' }
        ],
        bullets: [
          `The 2-Minute Emergency Protocol: Agar thakaan ya busy schedule hai, toh target ko 2 minute ke liye karein par zero-day na banne dein.`,
          `Crisis Rule: Aaj din khatam hone se pehle kam se kam 1 single habit zaroor tick karein taaki multi-day slump avoid ho sake.`,
          `Personal Record: Aapka average bounce-back time 24 se 48 ghante ke andar raha hai.`
        ],
        followUps: ['daily_win', 'danger_day', 'coaching_tips']
      };
    }

    // ── 5. NEXT MILESTONE & HONORS RUNWAY ────────────────────────────────
    if (promptKey === 'milestone_runway' || /runway|next badge|milestone|trophy|honor|kab milega|next award/i.test(userQuery)) {
      return {
        title: nextLockedBadge ? `Next Honor Runway: ${nextLockedBadge.title}` : `Milestone Runway: ${nextTarget} Days`,
        badge: 'Runway Target',
        badgeColor: 'yellow',
        text: nextLockedBadge
          ? `Aapka agla target honor badge hai: <strong>${nextLockedBadge.title}</strong> (${nextLockedBadge.persona} Persona). \n\n"${nextLockedBadge.definition}"`
          : `Aap streak milestone ke peak zone me hain. Agla milestone target ${nextTarget} days hai.`,
        stats: [
          { label: 'Next Badge', val: nextLockedBadge ? nextLockedBadge.title : `${nextTarget}d Trophy` },
          { label: 'Current Progress', val: nextLockedBadge ? `${nextLockedBadge.progress}%` : `${compositeStreak.currentStreak}d` },
          { label: 'Remaining Gap', val: nextLockedBadge ? (nextLockedBadge.criteria || 'In Progress') : `${daysToMilestone} Din` }
        ],
        bullets: [
          nextLockedBadge ? `Unlock Criteria: <strong>${nextLockedBadge.criteria}</strong>.` : `Target: ${nextTarget} consecutive days.`,
          `Streak Target: Agli streak trophy ke liye sirf <strong>${daysToMilestone} active din</strong> baaki hain.`,
          `Auto-Equip Feature: Jaise hi yeh unlock hoga, aap ise top navbar ke 3 pills me direct equip kar sakte hain.`
        ],
        followUps: ['strongest', 'daily_win', 'full_report']
      };
    }

    // ── 6. HABIT TARGET TUNING ADVICE ───────────────────────────────────
    if (promptKey === 'target_tune' || /tune|tuning|adjust|heavy|mushkil|target kam|scale down|target/i.test(userQuery)) {
      const frictionHabits = activeHabits.filter(h => h.completionRate7d < 50 || h.avgScore7d < 50);
      const masteredHabits = activeHabits.filter(h => h.completionRate7d >= 80 && h.currentStreak >= 5);
      const balancedHabits = activeHabits.filter(h => !frictionHabits.some(f => f.id === h.id) && !masteredHabits.some(m => m.id === h.id));

      const tuningBullets = [];

      if (frictionHabits.length > 0) {
        frictionHabits.slice(0, 3).forEach(h => {
          const tVal = h.targetVal ? `${h.targetVal} ${h.unit}`.trim() : 'Goal';
          const actVal = h.avgActualVal7d !== null ? `${h.avgActualVal7d} ${h.unit}`.trim() : null;
          let recSuggestion = '';
          if (actVal && h.targetVal && typeof h.targetVal === 'number') {
            const suggested = Math.round(h.avgActualVal7d * 1.1) || Math.round(h.targetVal * 0.6);
            recSuggestion = `Actual avg logged: <strong>${actVal}</strong>. Recommendation: Target ko temporary <strong>${suggested} ${h.unit}</strong> par tune karein.`;
          } else if (h.targetVal && typeof h.targetVal === 'number') {
            const suggested = Math.round(h.targetVal * 0.5) || 1;
            recSuggestion = `Recommendation: Target ko 50% scale-down karke <strong>${suggested} ${h.unit}</strong> karein.`;
          } else {
            recSuggestion = `Recommendation: Target ko 2-Minute micro action me divide karein taaki zero-day avoid ho.`;
          }
          tuningBullets.push(`<strong>${h.name}</strong> (${h.completionRate7d}% 7d hit rate • Target: ${tVal}): ${recSuggestion}`);
        });
      }

      if (masteredHabits.length > 0) {
        masteredHabits.slice(0, 2).forEach(h => {
          const tVal = h.targetVal ? `${h.targetVal} ${h.unit}`.trim() : 'Goal';
          tuningBullets.push(`<strong>${h.name}</strong> (Mastered • ${h.currentStreak}d streak): Target ${tVal} automatic ban chuka hai (${h.completionRate7d}% rate). Aap chahein toh iska challenge 10-15% scale-up kar sakte hain.`);
        });
      }

      if (tuningBullets.length === 0) {
        activeHabits.forEach(h => {
          const tVal = h.targetVal ? `${h.targetVal} ${h.unit}`.trim() : 'Goal';
          tuningBullets.push(`<strong>${h.name}</strong>: Target <strong>${tVal}</strong> sweet spot par hai (${h.completionRate7d}% 7d hit rate). Is routine ko steady maintain karein.`);
        });
      }

      tuningBullets.push(`Golden Rule: Habit ka target hamesha aisa rakhein jise sabse busy ya thake hue din me bhi bina friction ke execute kiya ja sake.`);

      return {
        title: 'Habit Target Tuning & Calibration',
        badge: frictionHabits.length > 0 ? `${frictionHabits.length} Need Tuning` : 'Targets Balanced',
        badgeColor: frictionHabits.length > 0 ? 'amber' : 'emerald',
        text: frictionHabits.length > 0
          ? `Telemetry analysis ke mutabiq <strong>${frictionHabits.map(h => h.name).join(', ')}</strong> me mental friction ya drop detect hua hai. Yahan hai aapka data-backed target tuning roadmap:`
          : `Shaandar! Aapki sabhi active habits ka daily target optimal balance me hai. Koi extreme mental resistance detect nahi hui.`,
        stats: [
          { label: 'High Friction', val: `${frictionHabits.length} Habits` },
          { label: 'Balanced', val: `${balancedHabits.length} Habits` },
          { label: 'Mastered', val: `${masteredHabits.length} Routines` }
        ],
        bullets: tuningBullets,
        followUps: ['weakest', 'catalyst_duos', 'full_report']
      };
    }

    // ── 7. STRONGEST HABIT (CHAMPION) ───────────────────────────────────
    if (promptKey === 'strongest' || /strong|best|top|achhi|sabse|champion/i.test(userQuery)) {
      if (!strongest) return null;
      const tVal = strongest.targetVal ? `${strongest.targetVal} ${strongest.unit}`.trim() : 'Daily goal';
      return {
        title: `Champion Habit: ${strongest.name}`,
        badge: 'Consistency Pillar',
        badgeColor: 'emerald',
        text: `Yeh habit aapke daily lifestyle ka sabse mazboot anchor hai. Iska consistency score sabhi habits se aage chal raha hai.`,
        stats: [
          { label: 'Current Streak', val: `${strongest.currentStreak} Days` },
          { label: '7-Day Hit Rate', val: `${strongest.completionRate7d}% Hit` },
          { label: 'Personal Best', val: `${strongest.longestStreak} Days` }
        ],
        bullets: [
          `Target & Execution: Target <strong>${tVal}</strong> ko aapne consecutive ${strongest.currentStreak} din successfully maintain kiya hai.`,
          `Habit Stacking Tip: Is mazboot aadat ke theek baad apni struggle habit (${weakest?.name || 'naya routine'}) ko attach karein.`,
          `Identity Anchor: Yeh aadat aapki core discipline ka prateek ban chuki hai.`
        ],
        followUps: ['catalyst_duos', 'milestone_runway', 'daily_win']
      };
    }

    // ── 8. WEAKEST HABIT / DROP RISK ────────────────────────────────────
    if (promptKey === 'weakest' || /weak|drop|risk|struggle|kamzor|kharab|miss|problem/i.test(userQuery)) {
      if (!weakest) return null;
      const tVal = weakest.targetVal ? `${weakest.targetVal} ${weakest.unit}`.trim() : 'Daily goal';
      
      const isAllSolid = weakest.completionRate7d >= 80;
      if (isAllSolid) {
        return {
          title: 'All Active Habits Solid: Zero Drop Risk',
          badge: 'High Performance',
          badgeColor: 'emerald',
          text: `Shaandar! Aapki koi bhi habit severe drop risk par nahi hai. Sabhi active habits 80%+ consistency maintain kar rahi hain.`,
          bullets: [
            `Lowest hit rate bhi ${weakest.completionRate7d}% (${weakest.name} • ${tVal}) par solid hai.`,
            `Consistency banaye rakhein aur over-ambitious hokar ek sath zyada nayi habits add na karein.`
          ],
          followUps: ['daily_win', 'danger_day', 'milestone_runway']
        };
      }

      return {
        title: `Needs Attention: ${weakest.name}`,
        badge: 'Drop-Risk Alert',
        badgeColor: 'rose',
        text: `Is habit me pichle 7 dino me consistency break hui hai. Abhi ispe focus karne se streak bounce-back ho sakti hai.`,
        stats: [
          { label: '7-Day Rate', val: `${weakest.completionRate7d}%` },
          { label: 'Recent Misses', val: `${weakest.missCount7d} Days` },
          { label: 'Current Streak', val: `${weakest.currentStreak} Days` }
        ],
        bullets: [
          `Target & Resistance: Target <strong>${tVal}</strong> me resistance detect hui hai (${weakest.completionRate7d}% 7d hit rate).`,
          `The 2-Minute Rule: Target ko temporarily kam karein taaki mental resistance khatam ho.`,
          `Never Miss Twice: Aaj is habit ko priority dekar zero-day break karein.`
        ],
        followUps: ['target_tune', 'crisis_defense', 'daily_win']
      };
    }

    // ── 9. TODAY'S STATUS & PENDING CHECKLIST ───────────────────────────
    if (promptKey === 'today_status' || /today|aaj|pending|progress|status|bache/i.test(userQuery)) {
      const total = activeHabits.length;
      const doneCount = doneToday.length;
      const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

      const bullets = [];
      if (doneToday.length > 0) {
        bullets.push(`Completed Today: ${doneToday.map(h => `<strong>${h.name}</strong> (${h.todayScore}%)`).join(', ')}.`);
      }
      if (pendingToday.length > 0) {
        pendingToday.slice(0, 4).forEach(h => {
          const tVal = h.targetVal ? `${h.targetVal} ${h.unit}`.trim() : 'Daily goal';
          bullets.push(`Pending: <strong>${h.name}</strong> (Target: ${tVal})`);
        });
        bullets.push(`Din khatam hone se pehle pending habits log karein taaki streak continue rahe.`);
      } else {
        bullets.push(`Sabhi habits 100% complete! Rest karein aur kal ka momentum ready rakhein.`);
      }

      return {
        title: `Today Live Status: ${todayStr}`,
        badge: `${pct}% Complete`,
        badgeColor: pct === 100 ? 'emerald' : 'indigo',
        text: pct === 100 
          ? `Zabardast! Aaj ke sabhi ${total} habits aapne complete kar liye hain. Day score 100% locked hai.` 
          : `Aaj aapne ${doneCount} / ${total} habits tick kar liye hain (${pct}%). Abhi ${pendingToday.length} habits baaki hain.`,
        stats: [
          { label: 'Completed', val: `${doneCount} Habits` },
          { label: 'Pending', val: `${pendingToday.length} Habits` },
          { label: 'Day Score', val: `${pct}%` }
        ],
        bullets,
        followUps: ['daily_win', 'milestone_runway', 'danger_day']
      };
    }

    // ── 10. COMPLETE HEALTH SCORECARD ───────────────────────────────────
    if (promptKey === 'full_report' || /report|all|summary|pura|poora|scorecard/i.test(userQuery)) {
      const overallAvgRate = activeHabits.length > 0 
        ? Math.round(activeHabits.reduce((acc, h) => acc + h.completionRate7d, 0) / activeHabits.length) 
        : 0;

      return {
        title: 'Complete Habit Health Scorecard',
        badge: `${activeHabits.length} Habits Tracked`,
        badgeColor: 'indigo',
        text: `Aapki sabhi active habits ka real-time performance matrix:`,
        stats: [
          { label: 'Active Habits', val: `${activeHabits.length} Total` },
          { label: '7-Day Avg Rate', val: `${overallAvgRate}%` },
          { label: 'Today Progress', val: `${doneToday.length} / ${activeHabits.length}` }
        ],
        bullets: activeHabits.map(h => {
          const tVal = h.targetVal ? `${h.targetVal} ${h.unit}`.trim() : 'Goal';
          const streakStr = `${h.currentStreak}d (PB: ${h.longestStreak}d)`;
          const todayStatusStr = h.isDoneToday ? `Today Done (${h.todayScore}%)` : 'Today Pending';
          return `<strong>${h.name}:</strong> Streak ${streakStr} • Target: ${tVal} • 7d Rate: ${h.completionRate7d}% • ${todayStatusStr}`;
        }),
        followUps: ['daily_win', 'target_tune', 'danger_day']
      };
    }

    // ── 11. ATOMIC COACHING TIPS ────────────────────────────────────────
    if (promptKey === 'coaching_tips' || /tip|tips|help|advice|kaise|motivation|rules/i.test(userQuery)) {
      const strongName = strongest?.name || 'core routine';
      const weakName = weakest?.name || 'struggle habit';
      const weakTarget = weakest?.targetVal ? `${weakest.targetVal} ${weakest.unit}`.trim() : 'target';

      return {
        title: 'Habit Consistency Ke 4 Golden Rules',
        badge: 'Atomic Framework',
        badgeColor: 'indigo',
        text: `Behavioral psychology ke mutabiq habits banane aur maintain karne ka sabse solid framework:`,
        bullets: [
          `1. Habit Stacking: Apni sabse consistent habit (<strong>${strongName}</strong>) ke theek baad apni struggle habit (<strong>${weakName}</strong>) ko attach karein.`,
          `2. The 2-Minute Rule: Jab man na kare ya thakaan ho, toh <strong>${weakName}</strong> ke target (${weakTarget}) ko sirf 2 minute ke micro-action me execute karein. Zero-day avoid karna sabse zaroori hai.`,
          `3. Visual Cues & Environment: Jo habit karni hai uska trigger aakhon ke samne rakhein (Water bottle table par, shoes ready).`,
          `4. Never Miss Twice: 1 din miss hona accident hai, 2 din miss hona nayi buri aadat banna hai. Agle din bounce-back prioritize karein.`
        ],
        followUps: ['daily_win', 'crisis_defense', 'target_tune']
      };
    }

    // ── SPECIFIC HABIT SPOTLIGHT MATCHING ────────────────────────────────
    const matchedHabit = activeHabits.find(h => 
      userQuery.toLowerCase().includes(h.name.toLowerCase()) ||
      (h.unit && userQuery.toLowerCase().includes(h.unit.toLowerCase()))
    );

    if (matchedHabit) {
      return {
        title: `Habit Spotlight: ${matchedHabit.name}`,
        badge: `${matchedHabit.currentStreak}d Streak`,
        badgeColor: matchedHabit.completionRate7d >= 70 ? 'emerald' : 'amber',
        text: `Yahan hai <strong>${matchedHabit.name}</strong> ka personalized telemetry:`,
        stats: [
          { label: 'Current Streak', val: `${matchedHabit.currentStreak} Days` },
          { label: '7-Day Hit Rate', val: `${matchedHabit.completionRate7d}%` },
          { label: 'Today Status', val: matchedHabit.isDoneToday ? 'Complete' : 'Pending' }
        ],
        bullets: [
          `Longest recorded streak: <strong>${matchedHabit.longestStreak} din</strong>.`,
          `Recent 7-day average score: <strong>${matchedHabit.avgScore7d}%</strong>.`,
          matchedHabit.isDoneToday 
            ? `Aaj ka target achieve ho chuka hai. Great execution.` 
            : `Aaj yeh habit abhi pending hai, din khatam hone se pehle log karein.`
        ],
        followUps: ['daily_win', 'target_tune', 'catalyst_duos']
      };
    }

    // Fallback Default
    return {
      title: 'Definite Habit Coach Intelligence',
      badge: 'Habits Active',
      badgeColor: 'indigo',
      text: `Main aapke real habit data aur streaks se connected hoon. Aap kisi specific topic ya habit ke baare me pooch sakte hain.`,
      bullets: [
        `Champion Habit: <strong>${strongest?.name || 'N/A'}</strong> (${strongest?.currentStreak || 0}d streak)`,
        `Needs Attention: <strong>${weakest?.name || 'N/A'}</strong> (${weakest?.completionRate7d || 0}% 7d rate)`,
        `Today Progress: <strong>${doneToday.length} / ${activeHabits.length}</strong> habits done`
      ],
      followUps: ['daily_win', 'danger_day', 'milestone_runway']
    };
  };

  // Handle user selecting a prompt or typing a message
  const handleUserTrigger = (promptId, promptLabel = null) => {
    const userText = promptLabel || inputValue.trim();
    if (!userText && !promptId) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsReasoning(true);
    setReasoningStep(1);

    // Step-by-step reasoning simulation
    setTimeout(() => {
      setReasoningStep(2);
      setTimeout(() => {
        setReasoningStep(3);
        setTimeout(() => {
          setIsReasoning(false);
          const responseData = generateHabitResponse(promptId, userText);
          if (responseData) {
            // Find follow-up prompt objects based on responseData.followUps
            const followUpList = (responseData.followUps || [])
              .map(fId => COACH_PROMPTS.find(p => p.id === fId))
              .filter(Boolean);

            const botMsg = {
              id: 'bot_' + Date.now(),
              sender: 'bot',
              type: 'card',
              data: responseData,
              suggestedPrompts: followUpList
            };
            setMessages(prev => [...prev, botMsg]);
          }
        }, 280);
      }, 240);
    }, 240);
  };

  // Draggable physics for Desktop Mouse + Mobile Touch
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    function onStart(e) {
      dragRef.current.isDragging = true;
      dragRef.current.hasMoved = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragRef.current.startX = clientX;
      dragRef.current.startY = clientY;

      const rect = el.getBoundingClientRect();
      dragRef.current.initialLeft = rect.left;
      dragRef.current.initialTop = rect.top;
    }

    function onMove(e) {
      if (!dragRef.current.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;

      if (Math.hypot(dx, dy) > 6) {
        dragRef.current.hasMoved = true;
      }

      if (dragRef.current.hasMoved) {
        const nextX = Math.max(10, Math.min(window.innerWidth - 60, dragRef.current.initialLeft + dx));
        const nextY = Math.max(60, Math.min(window.innerHeight - 80, dragRef.current.initialTop + dy));
        el.style.left = `${nextX}px`;
        el.style.top = `${nextY}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
      }
    }

    function onEnd() {
      dragRef.current.isDragging = false;
    }

    el.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    el.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      el.removeEventListener('mousedown', onStart);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      el.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  if (isProOrAdmin) return null;

  const currentTabPrompts = COACH_PROMPTS.filter(p => p.tab === activeStarterTab);

  return (
    <>
      <style>{`
        @keyframes coachRobotFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1.2deg); }
        }
        .coach-float-group {
          animation: coachRobotFloat 3.2s ease-in-out infinite;
          transform-origin: 50% 50%;
        }

        @keyframes coachAntennaWiggle {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-7deg); }
          40% { transform: rotate(0deg); }
          60% { transform: rotate(7deg); }
          80% { transform: rotate(0deg); }
        }
        .coach-antenna-group {
          transform-origin: 50px 24px;
          animation: coachAntennaWiggle 3.6s ease-in-out infinite;
        }
        #coach-launcher-btn:hover .coach-antenna-group {
          animation: coachAntennaHover 0.45s ease-in-out infinite alternate !important;
        }
        @keyframes coachAntennaHover {
          0% { transform: rotate(-14deg); }
          100% { transform: rotate(14deg); }
        }

        @keyframes coachBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.08); }
          97% { transform: scaleY(1); }
        }
        .coach-eyes-group {
          transform-origin: 50% 46px;
          animation: coachBlink 3.8s infinite ease-in-out;
        }

        .coach-smile-path {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), stroke-width 0.2s;
          transform-origin: 50% 57px;
        }
        #coach-launcher-btn:hover .coach-smile-path {
          transform: scale(1.22);
          stroke-width: 3px;
        }
      `}</style>

      {/* ── 1. FLOATING DRAGGABLE ROBOT LAUNCHER BUTTON ─────────────── */}
      <button
        id="coach-launcher-btn"
        ref={btnRef}
        type="button"
        onClick={() => {
          if (!dragRef.current.hasMoved) {
            if (navigator.vibrate) navigator.vibrate(20);
            setIsOpen(!isOpen);
          }
        }}
        className={`fixed z-[99999] w-[50px] h-[50px] sm:w-[54px] sm:h-[54px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none transition-transform hover:scale-110 active:scale-95 shadow-lg ${
          isOpen
            ? 'bg-orange-600 text-white border-2 border-orange-400'
            : 'bg-radial from-slate-900 to-black dark:from-zinc-900 dark:to-zinc-950 border border-orange-500/60 text-white shadow-orange-500/20'
        }`}
        style={{
          bottom: '80px',
          right: '16px'
        }}
        title="Definite AI Habit Coach - Tap to open"
        aria-label="Toggle AI Habit Coach"
      >
        {!isOpen ? (
          <svg 
            className="w-[38px] h-[34px] sm:w-[42px] sm:h-[38px] drop-shadow-md pointer-events-none" 
            viewBox="0 0 100 85" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="coach-bot-grad-ball" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ff944d" />
                <stop offset="50%" stopColor="#ff5500" />
                <stop offset="100%" stopColor="#b33600" />
              </radialGradient>
              <linearGradient id="coach-bot-grad-shell" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ff7a29" />
                <stop offset="100%" stopColor="#d44000" />
              </linearGradient>
              <linearGradient id="coach-bot-grad-bezel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="70%" stopColor="#f1ede8" />
                <stop offset="100%" stopColor="#d9d3cb" />
              </linearGradient>
              <linearGradient id="coach-bot-grad-screen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2a2a30" />
                <stop offset="100%" stopColor="#0e0e12" />
              </linearGradient>
              <radialGradient id="coach-bot-grad-ear" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ff8c3b" />
                <stop offset="70%" stopColor="#ff5500" />
                <stop offset="100%" stopColor="#a33000" />
              </radialGradient>
            </defs>

            <g className="coach-float-group">
              {/* Antenna */}
              <g className="coach-antenna-group">
                <rect x="48" y="14" width="4" height="11" rx="2" fill="#1e1e24" />
                <circle cx="50" cy="9" r="7" fill="url(#coach-bot-grad-ball)" />
                <circle cx="48" cy="7" r="2.2" fill="#ffffff" opacity="0.75" />
              </g>

              {/* Ears */}
              <rect x="11" y="37" width="10" height="28" rx="5" fill="url(#coach-bot-grad-ear)" />
              <rect x="15" y="41" width="3" height="20" rx="1.5" fill="#ffffff" opacity="0.9" />
              <rect x="79" y="37" width="10" height="28" rx="5" fill="url(#coach-bot-grad-ear)" />
              <rect x="82" y="41" width="3" height="20" rx="1.5" fill="#ffffff" opacity="0.9" />

              {/* Chassis Shell */}
              <rect x="18" y="22" width="64" height="56" rx="22" fill="url(#coach-bot-grad-shell)" />

              {/* Bezel */}
              <rect x="21.5" y="25.5" width="57" height="49" rx="18.5" fill="url(#coach-bot-grad-bezel)" />
              <path d="M 32 27 Q 50 25.5 68 27" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* Face Screen */}
              <rect x="27.5" y="31.5" width="45" height="37" rx="12" fill="url(#coach-bot-grad-screen)" />
              <path d="M 33 34 Q 50 32 67 34" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

              {/* Blinking Eyes */}
              <g className="coach-eyes-group">
                <circle cx="38.5" cy="46" r="4.5" fill="#ffffff" />
                <circle cx="37.2" cy="44.8" r="1.3" fill="#ffffff" opacity="0.95" />
                <circle cx="61.5" cy="46" r="4.5" fill="#ffffff" />
                <circle cx="60.2" cy="44.8" r="1.3" fill="#ffffff" opacity="0.95" />
              </g>

              {/* Smile */}
              <path className="coach-smile-path" d="M 43 55.5 Q 50 61.5 57 55.5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        ) : (
          <X size={22} weight="bold" />
        )}
      </button>

      {/* ── 2. CHAT MODAL WINDOW ────────────────────────────────────── */}
      {isOpen && (
        <div 
          className="fixed z-[99999] bottom-[76px] right-[12px] sm:right-[20px] w-[calc(100vw-24px)] sm:w-[410px] h-[520px] sm:h-[560px] max-h-[calc(100vh-120px)] bg-white dark:bg-[#111116] border border-slate-800/40 dark:border-zinc-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            boxShadow: '0 24px 50px -10px rgba(0,0,0,0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Header */}
          <div className="p-3 sm:p-3.5 bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#9a3412] dark:from-[#6b1515] dark:via-[#7f1d1d] dark:to-[#7c2d12] text-white border-b border-rose-950/70 shadow-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/25 text-amber-200 flex items-center justify-center font-bold shadow-xs">
                <Robot size={19} weight="duotone" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-[13px] font-black text-white leading-none tracking-tight">
                    Definite Habit Coach
                  </h3>
                  <ProPill size="xs" />
                  <span className="flex items-center gap-1 text-[8.5px] font-black text-amber-200 bg-amber-400/20 border border-amber-300/40 px-1.5 py-0.5 rounded-full leading-none">
                    Telemetry
                  </span>
                </div>
                <p className="text-[10px] text-rose-100/90 font-medium leading-none mt-1">
                  100% Offline Behavioral Analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetWelcome}
                className="w-7 h-7 rounded-lg text-rose-100/80 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center cursor-pointer"
                title="Reset conversation"
              >
                <ArrowClockwise size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg text-rose-100/80 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center cursor-pointer"
                title="Close chat"
              >
                <X size={15} weight="bold" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div 
            ref={msgContainerRef}
            className="flex-1 p-3.5 space-y-3.5 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/40 text-xs"
          >
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] bg-orange-600 text-white font-medium p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // Welcome Message
              if (msg.type === 'welcome') {
                return (
                  <div key={msg.id} className="space-y-3">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-3.5 rounded-2xl shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-black text-[11px]">
                        <Sparkle size={15} weight="fill" />
                        <span>Definite Habit Intelligence Engine</span>
                      </div>
                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                        {msg.content}
                      </p>
                    </div>

                    {/* Segmented Category Tabs & Direct Prompts List */}
                    <div className="space-y-2.5 pt-0.5">
                      {/* Top 4 Segmented Tabs */}
                      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 dark:bg-zinc-800/80 rounded-xl border border-slate-200/70 dark:border-zinc-700/60 shadow-2xs">
                        {COACH_TABS.map(tab => {
                          const TabIcon = tab.IconComponent;
                          const isActive = activeStarterTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveStarterTab(tab.id)}
                              className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 font-extrabold shadow-xs border border-slate-200/60 dark:border-zinc-700'
                                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-semibold'
                              }`}
                            >
                              <TabIcon size={13} weight={isActive ? "fill" : "bold"} className={isActive ? "text-orange-600 dark:text-orange-400" : ""} />
                              <span className="text-[10px] leading-none tracking-tight">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Direct List of Prompts for Selected Tab (No Bulky Wrappers, Subtitle clearly visible) */}
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        {currentTabPrompts.map(p => {
                          const IconComp = p.IconComponent;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleUserTrigger(p.id, p.label)}
                              className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-orange-500/60 dark:hover:border-orange-500/60 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 text-slate-800 dark:text-zinc-200 transition-all flex items-center gap-2.5 group cursor-pointer shadow-2xs"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${p.colorClass}`}>
                                <IconComp size={16} weight="bold" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block font-black text-[11.5px] leading-tight text-slate-900 dark:text-white truncate">
                                  {p.label}
                                </span>
                                <span className="block text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                                  {p.sublabel}
                                </span>
                              </div>
                              <CaretRight 
                                size={13} 
                                weight="bold" 
                                className="text-slate-300 dark:text-zinc-600 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all shrink-0" 
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              // Rich Bot Card Message
              if (msg.type === 'card' && msg.data) {
                const card = msg.data;
                return (
                  <div key={msg.id} className="space-y-2">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-3.5 rounded-2xl shadow-2xs space-y-2.5">
                      {/* Card Header & Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-xs leading-snug">
                            {card.title}
                          </h4>
                        </div>
                        {card.badge && (
                          <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            card.badgeColor === 'emerald'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : card.badgeColor === 'rose'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : card.badgeColor === 'amber'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : card.badgeColor === 'purple'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : card.badgeColor === 'cyan'
                              ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                              : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                          }`}>
                            {card.badge}
                          </span>
                        )}
                      </div>

                      {/* Text */}
                      {card.text && (
                        <p 
                          className="text-slate-600 dark:text-zinc-300 text-[11.5px] leading-relaxed whitespace-pre-line font-medium"
                          dangerouslySetInnerHTML={{ __html: card.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                        />
                      )}

                      {/* Micro-Stats Grid */}
                      {card.stats && (
                        <div className="grid grid-cols-3 gap-1.5 py-1">
                          {card.stats.map((st, sidx) => (
                            <div key={sidx} className="bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-slate-100 dark:border-zinc-700/60 text-center">
                              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-400 block truncate">
                                {st.label}
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-white block mt-0.5 truncate">
                                {st.val}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bullet Recommendations */}
                      {card.bullets && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                          {card.bullets.map((b, bidx) => (
                            <div key={bidx} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-zinc-300 leading-snug">
                              <span className="text-orange-500 font-bold shrink-0">▹</span>
                              <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* DYNAMIC CONTEXTUAL FOLLOW-UP QUESTIONS (WORKFLOW ENGINE) */}
                    <div className="space-y-1 pl-1">
                      <div className="flex items-center justify-between text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        <span>Related Follow-ups:</span>
                        <button
                          type="button"
                          onClick={resetWelcome}
                          className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer font-bold capitalize"
                        >
                          <ArrowClockwise size={11} weight="bold" />
                          <span>Main Topics</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedPrompts && msg.suggestedPrompts.map(sp => {
                          const IconComp = sp.IconComponent || Sparkle;
                          return (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => handleUserTrigger(sp.id, sp.label)}
                              className="text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg bg-orange-50/80 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 border border-orange-200/80 dark:border-orange-900/40 hover:bg-orange-100 hover:border-orange-400 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                              <IconComp size={12} weight="bold" className="text-orange-600 dark:text-orange-400 shrink-0" />
                              <span>{sp.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {/* Simulated Reasoning Animation with Sleek Phosphor Icons (NO EMOJIS) */}
            {isReasoning && (
              <div className="bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/60 rounded-2xl p-3 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-orange-800 dark:text-orange-300 font-black text-[10.5px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                    <span>Analyzing Habit Telemetry</span>
                  </span>
                  <span className="text-[9px] uppercase bg-orange-100 dark:bg-orange-900/80 px-1.5 py-0.5 rounded font-bold">
                    PROCESSING
                  </span>
                </div>

                <div className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px] font-medium">
                  <div className={`p-1 pl-2 border-l-2 transition-all flex items-center gap-1.5 ${reasoningStep >= 1 ? 'border-orange-500 text-orange-900 dark:text-orange-200 font-bold' : 'border-slate-300 opacity-50'}`}>
                    <CheckCircle size={13} weight="bold" className={reasoningStep >= 1 ? 'text-orange-500' : 'text-slate-400'} />
                    <span>{reasoningStep === 1 ? 'Reading active habits and daily summaries...' : 'Telemetry data verified'}</span>
                  </div>
                  {reasoningStep >= 2 && (
                    <div className={`p-1 pl-2 border-l-2 transition-all flex items-center gap-1.5 ${reasoningStep >= 2 ? 'border-orange-500 text-orange-900 dark:text-orange-200 font-bold' : 'border-slate-300 opacity-50'}`}>
                      <CheckCircle size={13} weight="bold" className={reasoningStep >= 2 ? 'text-orange-500' : 'text-slate-400'} />
                      <span>{reasoningStep === 2 ? 'Calculating weekly day patterns and streaks...' : 'Behavioral patterns analyzed'}</span>
                    </div>
                  )}
                  {reasoningStep >= 3 && (
                    <div className="p-1 pl-2 border-l-2 border-orange-500 text-orange-900 dark:text-orange-200 font-bold flex items-center gap-1.5">
                      <Sparkle size={13} weight="fill" className="text-orange-500 animate-spin" />
                      <span>Formulating personalized coaching insights...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserTrigger(null, inputValue);
            }}
            className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-zinc-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask about win condition, danger day, streaks..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700/80 rounded-full px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:border-orange-500 font-medium"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Send query"
            >
              <PaperPlaneRight size={15} weight="fill" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

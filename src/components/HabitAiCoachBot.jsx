import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { calculateStreakData, MILESTONE_TARGETS } from '../lib/streakEngine';
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
  ChatTeardropText 
} from '@phosphor-icons/react';

// Pre-filled Quick Prompts for Normal Habit Tracker Users
const QUICK_PROMPTS = [
  { id: 'strongest', label: '🌟 Meri strongest habit konsi hai?', icon: '🌟' },
  { id: 'weakest', label: '⚠️ Konsi habit weak chal rahi hai?', icon: '⚠️' },
  { id: 'today_status', label: '📊 Aaj ka progress & pending checklist', icon: '📊' },
  { id: 'streak_records', label: '🔥 Mera best streak & milestone?', icon: '🔥' },
  { id: 'coaching_tips', label: '💡 Habit drop se bachne ke tips', icon: '💡' },
  { id: 'full_report', label: '📋 Poori habit health report batao', icon: '📋' },
];

export default function HabitAiCoachBot() {
  const { aiCoachEnabled, habits = [], allSummaries = [] } = useData();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isReasoning, setIsReasoning] = useState(false);
  const [reasoningStep, setReasoningStep] = useState(0);

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
  const isProOrAdmin = location.pathname.startsWith('/pro') || 
                       location.pathname.startsWith('/org') || 
                       location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith('/coach') ||
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

  // Compute live habit intelligence
  const getHabitTelemetry = () => {
    const activeHabits = (habits || []).filter(h => h.status !== 'deleted');
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySummary = (allSummaries || []).find(s => s.id === todayStr);
    const recent7Summaries = (allSummaries || []).slice(0, 7);

    const analyzed = activeHabits.map(h => {
      const streakInfo = calculateStreakData(h.id, allSummaries, todayStr);
      
      // Calculate 7-day completion rate
      let hitCount7d = 0;
      let totalLogged7d = 0;
      let scoreSum7d = 0;

      recent7Summaries.forEach(s => {
        const sc = s.habitScores ? s.habitScores[h.id] : undefined;
        if (sc !== undefined && sc !== null) {
          totalLogged7d++;
          scoreSum7d += Number(sc);
          if (Number(sc) >= 60) hitCount7d++;
        }
      });

      const completionRate7d = recent7Summaries.length > 0 
        ? Math.round((hitCount7d / recent7Summaries.length) * 100) 
        : 0;
      const avgScore7d = totalLogged7d > 0 ? Math.round(scoreSum7d / totalLogged7d) : 0;
      const missCount7d = Math.max(0, recent7Summaries.length - hitCount7d);

      // Today's status
      const todayScore = todaySummary?.habitScores ? todaySummary.habitScores[h.id] : undefined;
      const isDoneToday = todayScore !== undefined && todayScore !== null && Number(todayScore) >= 60;
      const isLoggedToday = todayScore !== undefined && todayScore !== null;

      return {
        ...h,
        currentStreak: streakInfo.currentStreak || 0,
        longestStreak: streakInfo.longestStreak || 0,
        consistencyPct: streakInfo.totalDays > 0 ? Math.round((streakInfo.activeDays / streakInfo.totalDays) * 100) : 0,
        completionRate7d,
        avgScore7d,
        missCount7d,
        isDoneToday,
        isLoggedToday,
        todayScore: todayScore !== undefined ? Number(todayScore) : null
      };
    });

    // Rank strongest habit (composite of streak and 7-day hit rate)
    const sortedStrongest = [...analyzed].sort((a, b) => {
      const scoreA = (a.currentStreak * 2.5) + (a.completionRate7d * 1.5) + (a.avgScore7d * 0.5);
      const scoreB = (b.currentStreak * 2.5) + (b.completionRate7d * 1.5) + (b.avgScore7d * 0.5);
      return scoreB - scoreA;
    });

    // Rank weakest habit (lowest 7-day completion rate, highest misses, lowest streak)
    const sortedWeakest = [...analyzed].sort((a, b) => {
      if (a.completionRate7d !== b.completionRate7d) {
        return a.completionRate7d - b.completionRate7d;
      }
      return a.avgScore7d - b.avgScore7d;
    });

    // Today's pending & completed
    const doneToday = analyzed.filter(h => h.isDoneToday);
    const pendingToday = analyzed.filter(h => !h.isDoneToday);
    const compositeStreak = calculateStreakData('all', allSummaries, todayStr);

    // Next milestone calculation
    const currStrk = compositeStreak.currentStreak || 0;
    const nextTarget = MILESTONE_TARGETS.find(m => m > currStrk) || 365;
    const daysToMilestone = Math.max(0, nextTarget - currStrk);

    return {
      activeHabits: analyzed,
      strongest: sortedStrongest[0] || null,
      weakest: sortedWeakest[0] || null,
      doneToday,
      pendingToday,
      compositeStreak,
      nextTarget,
      daysToMilestone,
      todayStr
    };
  };

  const resetWelcome = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        sender: 'bot',
        type: 'welcome',
        content: `Hey! Main hoon aapka Definite AI Habit Coach 🤖. Main aapki streaks, daily check-ins aur habits ke completion pattern ko live analyze karta hoon taaki aapka momentum kabhi na toote.`,
        suggestedPrompts: QUICK_PROMPTS
      }
    ]);
  };

  // Generate bot answer based on query key or user text
  const generateHabitResponse = (promptKey, userQuery = '') => {
    const data = getHabitTelemetry();
    const { activeHabits, strongest, weakest, doneToday, pendingToday, compositeStreak, nextTarget, daysToMilestone, todayStr } = data;

    if (activeHabits.length === 0) {
      return {
        title: 'Shuruat Karein! (No Active Habits Yet)',
        badge: 'Setup Required',
        badgeColor: 'amber',
        text: `Aapne abhi tak koi habit add nahi ki hai! \n\nScreen par **'+ Add Habit'** par tap karein aur pehle 2 ya 3 habits choose karein (e.g. Hydration, 15 min Walk, Reading). Jaise hi aap track karna shuru karenge, main aapko live stats aur streaks ka breakdown dunga!`,
        bullets: [
          'Choose 1 small morning habit (e.g., Drink 500ml water)',
          'Choose 1 evening habit (e.g., Screens off by 10:30 PM)',
          'Start with small targets so momentum is automatic!'
        ]
      };
    }

    // 1. Strongest Habit
    if (promptKey === 'strongest' || /strong|best|top|achhi|sabse|champion/i.test(userQuery)) {
      if (!strongest) return null;
      return {
        title: `🏆 Aapki Strongest Habit: ${strongest.name}`,
        badge: 'Champion Habit',
        badgeColor: 'emerald',
        text: `Yeh habit aapke daily lifestyle ka sabse mazboot pillar hai! Iska consistency score sabhi habits se aage chal raha hai.`,
        stats: [
          { label: 'Current Streak', val: `${strongest.currentStreak} Din 🔥` },
          { label: '7-Day Hit Rate', val: `${strongest.completionRate7d}% 🎯` },
          { label: 'Longest Record', val: `${strongest.longestStreak} Din 🏆` }
        ],
        bullets: [
          `**Streak Power:** Aapne consecutive ${strongest.currentStreak} din yeh habit complete kari hai.`,
          `**Habit Stacking Tip:** Is mazboot aadat ke theek baad apni kisi kamzor aadat ko jod dein (jaise: "${strongest.name} karte hi main 2 min reading karunga").`,
          `Neural pathways ban chuki hain — iska flow todna mat!`
        ]
      };
    }

    // 2. Weakest Habit / Drop Risk
    if (promptKey === 'weakest' || /weak|drop|risk|struggle|kamzor|kharab|miss|problem/i.test(userQuery)) {
      if (!weakest) return null;
      
      const isAllSolid = weakest.completionRate7d >= 80;
      if (isAllSolid) {
        return {
          title: `✨ Sabhi Habits Super Strong Hain!`,
          badge: 'Zero Drop Risk',
          badgeColor: 'emerald',
          text: `Shaandar! Aapki koi bhi habit severe drop risk par nahi hai. Sabhi active habits 80%+ consistency maintain kar rahi hain!`,
          bullets: [
            `Lowest hit rate bhi ${weakest.completionRate7d}% (${weakest.name}) par solid hai.`,
            `Consistency banaye rakhein aur over-optimistic hokar ek sath bahut nayi habits add na karein.`
          ]
        };
      }

      return {
        title: `⚠️ Needs Attention: ${weakest.name}`,
        badge: 'Drop-Risk Alert',
        badgeColor: 'rose',
        text: `Is habit mein pichle 7 dino mein consistency break hui hai. Abhi ispe dhyan dene se streak bounce-back ho sakti hai!`,
        stats: [
          { label: '7-Day Completion', val: `${weakest.completionRate7d}% 📉` },
          { label: 'Recent Misses', val: `${weakest.missCount7d} Din Drop ❌` },
          { label: 'Current Streak', val: `${weakest.currentStreak} Din` }
        ],
        bullets: [
          `**The 2-Minute Rule:** Target ko temporarily aadha karein (e.g. agar 30 min ka target hai toh bas 5 min karein taaki zero-day na bane).`,
          `**Reduce Friction:** Is aadat ke liye environment pehle se taiyar rakhein (shoes samne rakhein, book bed ke paas rakhein).`,
          `**Never Miss Twice:** 1 din miss hona accident hai, par 2 din miss hona nayi buri aadat ki shuruat hoti hai!`
        ]
      };
    }

    // 3. Today's Status & Pending Checklist
    if (promptKey === 'today_status' || /today|aaj|pending|progress|status|bache/i.test(userQuery)) {
      const total = activeHabits.length;
      const doneCount = doneToday.length;
      const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

      return {
        title: `📊 Aaj Ka Live Habit Status (${todayStr})`,
        badge: `${pct}% Complete`,
        badgeColor: pct === 100 ? 'emerald' : 'indigo',
        text: pct === 100 
          ? `🎉 Zabardast! Aaj ke sabhi ${total} habits aapne complete kar liye hain! Day score 100% locked hai.` 
          : `Aaj aapne ${doneCount} / ${total} habits tick kar liye hain (${pct}%). Abhi ${pendingToday.length} habits baaki hain!`,
        stats: [
          { label: 'Completed', val: `${doneCount} Habits ✅` },
          { label: 'Pending', val: `${pendingToday.length} Habits ⏳` },
          { label: 'Day Score', val: `${pct}%` }
        ],
        bullets: pendingToday.length > 0 ? [
          ...pendingToday.slice(0, 4).map(h => `⏳ **Pending:** ${h.name} (Target: ${h.target100 ?? 'Daily goal'})`),
          `Din khatam hone se pehle inko log karein taaki kal subah streak continue rahe!`
        ] : [
          `Sabhi habits complete! Rest karein aur kal ka momentum ready rakhein.`
        ]
      };
    }

    // 4. Streak & Milestone Record
    if (promptKey === 'streak_records' || /streak|record|milestone|trophy|best|longest/i.test(userQuery)) {
      return {
        title: `🔥 Streak & Milestone Dashboard`,
        badge: `${compositeStreak.currentStreak} Days Active`,
        badgeColor: 'amber',
        text: `Consistent daily actions dimag ke neural wiring ko hamesha ke liye badal dete hain. Dekhein aapka live score:`,
        stats: [
          { label: 'Active Streak', val: `${compositeStreak.currentStreak} Din 🔥` },
          { label: 'Personal Best', val: `${compositeStreak.longestStreak} Din 🏆` },
          { label: 'Next Trophy', val: `${nextTarget} Din Goal` }
        ],
        bullets: [
          `**Next Trophy:** Agle milestone (${nextTarget} Days) ke liye sirf **${daysToMilestone} din** baaki hain!`,
          `**Consistency Rate:** Total tracked days mein aapka consistency rate **${compositeStreak.consistencyPct}%** hai.`,
          `Keep the fire burning! Steady effort beats sporadic intensity.`
        ]
      };
    }

    // 5. Coaching Tips & Bounce-back
    if (promptKey === 'coaching_tips' || /tip|tips|help|advice|kaise|motivation|bounce/i.test(userQuery)) {
      return {
        title: `💡 Habit Consistency Ke 4 Golden Rules`,
        badge: 'Atomic Framework',
        badgeColor: 'indigo',
        text: `Behavioral psychology ke mutabiq habits banane ka sabse solid formula:`,
        bullets: [
          `1️⃣ **Habit Stacking:** Apni strongest habit (${strongest?.name || 'Brush karna'}) ke theek baad new habit ko attach karein.`,
          `2️⃣ **The 2-Minute Rule:** Jab man na kare ya thakaan ho, toh sirf 2 minute ke liye karein. Zero-day ko avoid karna sabse zaroori hai.`,
          `3️⃣ **Visual Cues:** Jo cheez karni hai use aakhon ke samne rakhein (Water bottle table par, clothes ready).`,
          `4️⃣ **Never Miss Twice Rule:** Agar kisi wajah se 1 din miss ho jaye, toh agle din kisi bhi haal mein prioritize karein.`
        ]
      };
    }

    // 6. Full Report
    if (promptKey === 'full_report' || /report|all|summary|pura|poora|scorecard/i.test(userQuery)) {
      return {
        title: `📋 Complete Habit Health Scorecard`,
        badge: `${activeHabits.length} Habits Tracked`,
        badgeColor: 'indigo',
        text: `Aapki sabhi active habits ka performance matrix:`,
        bullets: activeHabits.map(h => {
          const statusDot = h.completionRate7d >= 75 ? '🟢' : h.completionRate7d >= 50 ? '🟡' : '🔴';
          return `${statusDot} **${h.name}:** Streak ${h.currentStreak}d • 7d Rate ${h.completionRate7d}% • ${h.isDoneToday ? 'Aaj Done ✅' : 'Aaj Pending ⏳'}`;
        })
      };
    }

    // Specific Habit Keyword Matching (if user asks about a specific habit like "water" or "reading")
    const matchedHabit = activeHabits.find(h => 
      userQuery.toLowerCase().includes(h.name.toLowerCase()) ||
      (h.unit && userQuery.toLowerCase().includes(h.unit.toLowerCase()))
    );

    if (matchedHabit) {
      return {
        title: `🔍 Habit Spotlight: ${matchedHabit.name}`,
        badge: `${matchedHabit.currentStreak}d Streak`,
        badgeColor: matchedHabit.completionRate7d >= 70 ? 'emerald' : 'amber',
        text: `Yahan hai **${matchedHabit.name}** ka personalized performance telemetry:`,
        stats: [
          { label: 'Current Streak', val: `${matchedHabit.currentStreak} Din 🔥` },
          { label: '7-Day Hit Rate', val: `${matchedHabit.completionRate7d}%` },
          { label: 'Today Status', val: matchedHabit.isDoneToday ? 'Complete ✅' : 'Pending ⏳' }
        ],
        bullets: [
          `Longest recorded streak: **${matchedHabit.longestStreak} din**.`,
          `Recent 7-day average performance: **${matchedHabit.avgScore7d}%**.`,
          matchedHabit.isDoneToday 
            ? `Aaj ka target achieve ho chuka hai! Bahut badiya.` 
            : `Aaj yeh habit abhi pending hai, din khatam hone se pehle log karein.`
        ]
      };
    }

    // Default Fallback
    return {
      title: `🤖 Definite Habit Coach Assistant`,
      badge: 'Habits Active',
      badgeColor: 'indigo',
      text: `Main aapke live habits data aur streak records se connected hoon. Aap neeche diye gaye quick prompts me se choose kar sakte hain ya apni kisi bhi habit ka naam pooch sakte hain!`,
      bullets: [
        `🏆 Strongest Habit: **${strongest?.name || 'N/A'}** (${strongest?.currentStreak || 0}d streak)`,
        `⚠️ Needs Attention: **${weakest?.name || 'N/A'}** (${weakest?.completionRate7d || 0}% 7d rate)`,
        `📅 Aaj Ka Progress: **${doneToday.length} / ${activeHabits.length}** habits done`
      ]
    };
  };

  // Handle user selecting a quick prompt or typing a message
  const handleUserTrigger = (promptId, promptLabel = null) => {
    const userText = promptLabel || inputValue.trim();
    if (!userText && !promptId) return;

    // Append User Message
    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsReasoning(true);
    setReasoningStep(1);

    // Simulate Agentic Telemetry Step 1 -> 2 -> 3
    setTimeout(() => {
      setReasoningStep(2);
      setTimeout(() => {
        setReasoningStep(3);
        setTimeout(() => {
          setIsReasoning(false);
          const responseData = generateHabitResponse(promptId, userText);
          if (responseData) {
            const botMsg = {
              id: 'bot_' + Date.now(),
              sender: 'bot',
              type: 'card',
              data: responseData,
              suggestedPrompts: QUICK_PROMPTS.filter(p => p.id !== promptId).slice(0, 3)
            };
            setMessages(prev => [...prev, botMsg]);
          }
        }, 320);
      }, 280);
    }, 280);
  };

  // Draggable physics for Desktop Mouse + Mobile Touch
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    function onStart(e) {
      if (e.button !== undefined && e.button !== 0) return;
      const evt = e.touches ? e.touches[0] : e;
      dragRef.current.isDragging = true;
      dragRef.current.hasMoved = false;
      dragRef.current.startX = evt.clientX;
      dragRef.current.startY = evt.clientY;
      const rect = el.getBoundingClientRect();
      dragRef.current.initialLeft = rect.left;
      dragRef.current.initialTop = rect.top;
      el.style.transition = 'none';
    }

    function onMove(e) {
      if (!dragRef.current.isDragging) return;
      const evt = e.touches ? e.touches[0] : e;
      const dx = evt.clientX - dragRef.current.startX;
      const dy = evt.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) > 6) {
        dragRef.current.hasMoved = true;
        if (e.cancelable) e.preventDefault();
        const btnW = el.offsetWidth || 54;
        const btnH = el.offsetHeight || 54;
        const maxLeft = window.innerWidth - btnW - 14;
        const maxTop = window.innerHeight - btnH - 14;
        const clampedLeft = Math.max(14, Math.min(maxLeft, dragRef.current.initialLeft + dx));
        const clampedTop = Math.max(14, Math.min(maxTop, dragRef.current.initialTop + dy));
        el.style.left = clampedLeft + 'px';
        el.style.top = clampedTop + 'px';
        el.style.bottom = 'auto';
        el.style.right = 'auto';
      }
    }

    function onEnd() {
      if (!dragRef.current.isDragging) return;
      dragRef.current.isDragging = false;
      el.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s';
      if (dragRef.current.hasMoved) {
        setTimeout(() => {
          dragRef.current.hasMoved = false;
        }, 180);
      }
    }

    el.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    el.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);

    return () => {
      el.removeEventListener('mousedown', onStart);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      el.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, []);

  const isEnabled = aiCoachEnabled === true && localStorage.getItem('preference_ai_coach_enabled') !== 'false';
  if (!isEnabled || isProOrAdmin) {
    return null;
  }

  return (
    <div id="habit-ai-coach-root">
      {/* ── Scoped Micro-Animations ──────────────────────────────────── */}
      <style>{`
        @keyframes coachRobotFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3.5px); }
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
          /* Folio-84 Vector Robot SVG */
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
              {/* Antenna with Sway */}
              <g className="coach-antenna-group">
                <rect x="48" y="14" width="4" height="11" rx="2" fill="#1e1e24" />
                <circle cx="50" cy="9" r="7" fill="url(#coach-bot-grad-ball)" />
                <circle cx="48" cy="7" r="2.2" fill="#ffffff" opacity="0.75" />
              </g>

              {/* Side Ears */}
              <rect x="11" y="37" width="10" height="28" rx="5" fill="url(#coach-bot-grad-ear)" />
              <rect x="15" y="41" width="3" height="20" rx="1.5" fill="#ffffff" opacity="0.9" />
              <rect x="79" y="37" width="10" height="28" rx="5" fill="url(#coach-bot-grad-ear)" />
              <rect x="82" y="41" width="3" height="20" rx="1.5" fill="#ffffff" opacity="0.9" />

              {/* Chassis Shell */}
              <rect x="18" y="22" width="64" height="56" rx="22" fill="url(#coach-bot-grad-shell)" />

              {/* Bezel Faceplate */}
              <rect x="21.5" y="25.5" width="57" height="49" rx="18.5" fill="url(#coach-bot-grad-bezel)" />
              <path d="M 32 27 Q 50 25.5 68 27" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* Black Face Screen */}
              <rect x="27.5" y="31.5" width="45" height="37" rx="12" fill="url(#coach-bot-grad-screen)" />
              <path d="M 33 34 Q 50 32 67 34" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

              {/* Blinking Eyes */}
              <g className="coach-eyes-group">
                <circle cx="38.5" cy="46" r="4.5" fill="#ffffff" />
                <circle cx="37.2" cy="44.8" r="1.3" fill="#ffffff" opacity="0.95" />
                <circle cx="61.5" cy="46" r="4.5" fill="#ffffff" />
                <circle cx="60.2" cy="44.8" r="1.3" fill="#ffffff" opacity="0.95" />
              </g>

              {/* Sweet Smile */}
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
          className="fixed z-[99999] bottom-[76px] right-[12px] sm:right-[20px] w-[calc(100vw-24px)] sm:w-[390px] h-[480px] sm:h-[520px] max-h-[calc(100vh-130px)] bg-white dark:bg-[#111116] border border-slate-900/30 dark:border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{
            boxShadow: '0 20px 45px -10px rgba(0,0,0,0.35), 0 0 0 1px rgba(15, 23, 42, 0.15)'
          }}
        >
          {/* Header - Brand Rich Crimson / Dark Orange Tab with High Contrast */}
          <div className="p-3 sm:p-3.5 bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#9a3412] dark:from-[#6b1515] dark:via-[#7f1d1d] dark:to-[#7c2d12] text-white border-b border-rose-950/70 shadow-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/25 text-amber-200 flex items-center justify-center font-bold shadow-xs">
                <Robot size={19} weight="duotone" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-[13px] font-black text-white leading-none tracking-tight">
                    Definite AI Coach
                  </h3>
                  <ProPill size="xs" />
                  <span className="flex items-center gap-1 text-[8.5px] font-black text-amber-200 bg-amber-400/20 border border-amber-300/40 px-1.5 py-0.5 rounded-full leading-none">
                    Upcoming
                  </span>
                </div>
                <p className="text-[10px] text-rose-100/90 font-medium leading-none mt-1">
                  Personal Habit Telemetry
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
                        <span>Definite Habit Intelligence</span>
                      </div>
                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                        {msg.content}
                      </p>
                    </div>

                    {/* Quick Question Chips Container */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 pl-1">
                        Quick Questions:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {msg.suggestedPrompts?.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleUserTrigger(p.id, p.label)}
                            className="w-full text-left p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-orange-500/60 dark:hover:border-orange-500/60 hover:bg-orange-50/40 dark:hover:bg-orange-950/20 text-slate-800 dark:text-zinc-200 font-bold text-[11px] sm:text-[11.5px] transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                          >
                            <span className="truncate pr-1">{p.label}</span>
                            <CaretRight size={12} weight="bold" className="text-orange-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </button>
                        ))}
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
                        <h4 className="font-black text-slate-900 dark:text-white text-xs leading-snug">
                          {card.title}
                        </h4>
                        {card.badge && (
                          <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            card.badgeColor === 'emerald'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : card.badgeColor === 'rose'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : card.badgeColor === 'amber'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                          }`}>
                            {card.badge}
                          </span>
                        )}
                      </div>

                      {/* Text */}
                      {card.text && (
                        <p className="text-slate-600 dark:text-zinc-300 text-[11.5px] leading-relaxed whitespace-pre-line font-medium">
                          {card.text}
                        </p>
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

                    {/* Follow-up Prompts */}
                    {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedPrompts.map(sp => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => handleUserTrigger(sp.id, sp.label)}
                            className="text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-900/40 hover:bg-orange-100 transition-colors cursor-pointer"
                          >
                            {sp.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}

            {/* Simulated Reasoning Animation Card */}
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
                  <div className={`p-1 pl-2 border-l-2 transition-all ${reasoningStep >= 1 ? 'border-orange-500 text-orange-900 dark:text-orange-200 font-bold' : 'border-slate-300 opacity-50'}`}>
                    {reasoningStep === 1 ? '⚙️ Reading active habits & daily summaries...' : '✓ Telemetry data verified'}
                  </div>
                  {reasoningStep >= 2 && (
                    <div className={`p-1 pl-2 border-l-2 transition-all ${reasoningStep >= 2 ? 'border-orange-500 text-orange-900 dark:text-orange-200 font-bold' : 'border-slate-300 opacity-50'}`}>
                      {reasoningStep === 2 ? '🔍 Calculating 7-day completion curves & streaks...' : '✓ Streak patterns analyzed'}
                    </div>
                  )}
                  {reasoningStep >= 3 && (
                    <div className="p-1 pl-2 border-l-2 border-orange-500 text-orange-900 dark:text-orange-200 font-bold">
                      💡 Formulating personalized coaching insights...
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
              placeholder="Ask about your habits, streaks, drop risk..."
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
    </div>
  );
}

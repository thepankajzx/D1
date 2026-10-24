// src/lib/badgeEngine.js
import { calculateRecoveryScore } from './recoveryAnalytics';
import { calculateStreakData } from './streakEngine';

export const BADGE_DEFINITIONS = [
  {
    id: 'genesis',
    order: 1,
    title: 'Genesis',
    persona: 'Genesis',
    hindiTitle: 'जेनेसिस (Genesis)',
    iconName: 'Lightning',
    criteria: 'First successful habit log',
    hindiCriteria: 'पहला सफल हैबिट लॉग',
    definition: 'Your D1 journey begins with your first real action.',
    hindiDefinition: 'आपकी D1 यात्रा आपके पहले वास्तविक कदम से शुरू होती है।',
    gradient: 'from-amber-400 to-yellow-500',
    colorText: 'text-amber-400',
    bgLight: 'bg-amber-500/10 dark:bg-amber-500/20',
    borderColor: 'border-amber-400/40',
    glow: 'shadow-amber-500/20',
    evaluate: (d) => d.totalLoggedDays >= 1 || d.hasAnyHabitCompleted,
    progressText: (d) => `${d.totalLoggedDays >= 1 ? 1 : 0}/1 Log`
  },
  {
    id: 'kinetic',
    order: 2,
    title: 'Kinetic',
    persona: 'Kinetic',
    hindiTitle: 'काइनेटिक (Kinetic)',
    iconName: 'BatteryCharging',
    criteria: '3 active days',
    hindiCriteria: '3 सक्रिय दिन',
    definition: 'You’ve turned your first action into momentum.',
    hindiDefinition: 'आपने अपने पहले कदम को गति और मोमेंटम में बदल दिया है।',
    gradient: 'from-sky-500 to-blue-600',
    colorText: 'text-sky-400',
    bgLight: 'bg-sky-500/10 dark:bg-sky-500/20',
    borderColor: 'border-sky-500/40',
    glow: 'shadow-sky-500/20',
    evaluate: (d) => d.totalLoggedDays >= 3,
    progressText: (d) => `${Math.min(d.totalLoggedDays, 3)}/3 Days`
  },
  {
    id: 'the_ascendant',
    order: 3,
    title: 'The Ascendant',
    persona: 'Ascendant',
    hindiTitle: 'द असेन्डेंट (The Ascendant)',
    iconName: 'TrendUp',
    criteria: '7-day average ≥ 40% + improvement vs previous 7-day period',
    hindiCriteria: '7-दिन औसत ≥ 40% + पिछले 7 दिनों की तुलना में सुधार',
    definition: 'You’re not just tracking—you’re getting better.',
    hindiDefinition: 'आप सिर्फ ट्रैक नहीं कर रहे—आप लगातार बेहतर हो रहे हैं।',
    gradient: 'from-emerald-400 to-teal-500',
    colorText: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/20',
    evaluate: (d) => d.recent7Avg >= 40 && (d.prior7Avg === 0 || d.recent7Avg >= d.prior7Avg),
    progressText: (d) => `${Math.round(d.recent7Avg)}% (Prev: ${Math.round(d.prior7Avg)}%)`
  },
  {
    id: 'solid_state',
    order: 4,
    title: 'Solid State',
    persona: 'Solid State',
    hindiTitle: 'सॉलिड स्टेट (Solid State)',
    iconName: 'Cube',
    criteria: '7-day average ≥ 60%',
    hindiCriteria: '7-दिन औसत ≥ 60%',
    definition: 'Your routine is becoming stable and dependable.',
    hindiDefinition: 'आपकी दिनचर्या अब स्थिर और भरोसेमंद बनती जा रही है।',
    gradient: 'from-blue-500 to-indigo-600',
    colorText: 'text-blue-400',
    bgLight: 'bg-blue-500/10 dark:bg-blue-500/20',
    borderColor: 'border-blue-500/40',
    glow: 'shadow-blue-500/20',
    evaluate: (d) => d.recent7Avg >= 60 || d.bestRolling7Avg >= 60,
    progressText: (d) => `${Math.round(d.recent7Avg)}% / 60%`
  },
  {
    id: 'flow_state',
    order: 5,
    title: 'Flow State',
    persona: 'Flow State',
    hindiTitle: 'फ्लो स्टेट (Flow State)',
    iconName: 'Waves',
    criteria: '7-day average ≥ 75%',
    hindiCriteria: '7-दिन औसत ≥ 75%',
    definition: 'Your execution is becoming smooth and consistent.',
    hindiDefinition: 'आपका क्रियान्वयन अब सहज और सुचारू बन रहा है।',
    gradient: 'from-teal-400 to-cyan-500',
    colorText: 'text-teal-400',
    bgLight: 'bg-teal-500/10 dark:bg-teal-500/20',
    borderColor: 'border-teal-500/40',
    glow: 'shadow-teal-500/20',
    evaluate: (d) => d.recent7Avg >= 75 || d.bestRolling7Avg >= 75,
    progressText: (d) => `${Math.round(d.recent7Avg)}% / 75%`
  },
  {
    id: 'plot_armor',
    order: 6,
    title: 'Plot Armor',
    persona: 'Plot Armor',
    hindiTitle: 'प्लॉट आर्मर (Plot Armor)',
    iconName: 'ShieldChevron',
    criteria: 'Low day <40% → recovery ≥70% within 48h',
    hindiCriteria: 'खराब दिन <40% → 48 घंटे में ≥70% रिकवरी',
    definition: 'A bad day didn’t end your story. You came back.',
    hindiDefinition: 'एक बुरे दिन ने आपकी कहानी खत्म नहीं की। आपने जोरदार वापसी की।',
    gradient: 'from-rose-500 to-red-600',
    colorText: 'text-rose-400',
    bgLight: 'bg-rose-500/10 dark:bg-rose-500/20',
    borderColor: 'border-rose-500/40',
    glow: 'shadow-rose-500/20',
    evaluate: (d) => d.has48hBounceBack,
    progressText: (d) => d.has48hBounceBack ? 'Recovered in 48h' : 'Awaiting bounce-back'
  },
  {
    id: 'unbreakable',
    order: 7,
    title: 'Unbreakable',
    persona: 'Unbreakable',
    hindiTitle: 'अनब्रेकेबल (Unbreakable)',
    iconName: 'ShieldCheck',
    criteria: '3 successful recovery cycles',
    hindiCriteria: '3 सफल रिकवरी चक्र',
    definition: 'You’ve proven that setbacks can’t keep you down.',
    hindiDefinition: 'आपने साबित कर दिया कि रुकावटें आपको झुका नहीं सकतीं।',
    gradient: 'from-violet-500 to-purple-600',
    colorText: 'text-violet-400',
    bgLight: 'bg-violet-500/10 dark:bg-violet-500/20',
    borderColor: 'border-violet-500/40',
    glow: 'shadow-violet-500/20',
    evaluate: (d) => d.recoveryCyclesCount >= 3,
    progressText: (d) => `${Math.min(d.recoveryCyclesCount, 3)}/3 Cycles`
  },
  {
    id: 'trance',
    order: 8,
    title: 'Trance',
    persona: 'Trance',
    hindiTitle: 'ट्रांस (Trance)',
    iconName: 'Brain',
    criteria: 'Deep Work/Study 7-day average ≥80%',
    hindiCriteria: 'डीप वर्क/स्टडी 7-दिन औसत ≥80%',
    definition: 'You found the zone where focused work takes over.',
    hindiDefinition: 'आपने वह ज़ोन पा लिया है जहाँ सिर्फ एकाग्रता का राज होता है।',
    gradient: 'from-fuchsia-500 to-pink-600',
    colorText: 'text-fuchsia-400',
    bgLight: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20',
    borderColor: 'border-fuchsia-500/40',
    glow: 'shadow-fuchsia-500/20',
    evaluate: (d) => d.focusHabit7Avg >= 80,
    progressText: (d) => `${Math.round(d.focusHabit7Avg)}% / 80%`
  },
  {
    id: 'antifragile',
    order: 9,
    title: 'Antifragile',
    persona: 'Antifragile',
    hindiTitle: 'एंटीफ्रैजाइल (Antifragile)',
    iconName: 'Diamond',
    criteria: '≥5 low-performance days + ≥70% recovery rate',
    hindiCriteria: '≥5 धीमे दिन + ≥70% रिकवरी दर',
    definition: 'Your setbacks are becoming fuel for stronger performance.',
    hindiDefinition: 'आपकी रुकावटें अब आपके और बेहतर प्रदर्शन का ईंधन बन रही हैं।',
    gradient: 'from-cyan-400 to-blue-500',
    colorText: 'text-cyan-400',
    bgLight: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    glow: 'shadow-cyan-500/20',
    evaluate: (d) => d.lowPerformanceDaysCount >= 5 && d.resilienceScore >= 70,
    progressText: (d) => `${d.lowPerformanceDaysCount}/5 Low Days · ${Math.round(d.resilienceScore)}% Rec`
  },
  {
    id: 'ironclad',
    order: 10,
    title: 'Ironclad',
    persona: 'Ironclad',
    hindiTitle: 'आयरनक्लैड (Ironclad)',
    iconName: 'Anchor',
    criteria: 'Critical habit ≥60% for 30 consecutive qualifying days',
    hindiCriteria: 'महत्वपूर्ण आदत 30 लगातार दिनों तक ≥60%',
    definition: 'Your most important habit has become non-negotiable.',
    hindiDefinition: 'आपकी सबसे महत्वपूर्ण आदत अब गैर-परक्राम्य (Non-negotiable) बन चुकी है।',
    gradient: 'from-slate-600 to-zinc-800 dark:from-slate-400 dark:to-zinc-600',
    colorText: 'text-slate-300',
    bgLight: 'bg-slate-500/10 dark:bg-slate-500/20',
    borderColor: 'border-slate-500/40',
    glow: 'shadow-slate-500/20',
    evaluate: (d) => d.criticalHabitConsecutiveDays >= 30,
    progressText: (d) => `${Math.min(d.criticalHabitConsecutiveDays, 30)}/30 Days`
  },
  {
    id: 'd1_og',
    order: 11,
    title: 'D1 OG',
    persona: 'D1 OG',
    hindiTitle: 'D1 OG',
    iconName: 'Crown',
    criteria: '≥90 active days + lifetime weighted average ≥70%',
    hindiCriteria: '≥90 सक्रिय दिन + लाइफटाइम औसत ≥70%',
    definition: 'You didn’t just use D1—you became part of the system.',
    hindiDefinition: 'आपने सिर्फ D1 का उपयोग नहीं किया—आप इस व्यवस्था का अभिन्न अंग बन गए।',
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    colorText: 'text-amber-400',
    bgLight: 'bg-amber-500/15 dark:bg-amber-500/25',
    borderColor: 'border-amber-400/60',
    glow: 'shadow-amber-500/30',
    evaluate: (d) => d.totalLoggedDays >= 90 && d.lifetimeAvgScore >= 70,
    progressText: (d) => `${Math.min(d.totalLoggedDays, 90)}/90 Days · ${Math.round(d.lifetimeAvgScore)}% Avg`
  },
  {
    id: 'phoenix_protocol',
    order: 12,
    title: 'Phoenix Protocol',
    persona: 'Phoenix',
    hindiTitle: 'फीनिक्स प्रोटोकॉल (Phoenix Protocol)',
    iconName: 'Fire',
    criteria: 'Worst historical 7-day period के बाद best-ever 7-day period',
    hindiCriteria: 'सबसे खराब 7-दिन अवधि के बाद सर्वश्रेष्ठ 7-दिन अवधि',
    definition: 'You rose from your lowest point to your strongest week.',
    hindiDefinition: 'आप अपने सबसे निचले स्तर से उठकर अपने सबसे मजबूत सप्ताह तक पहुँचे।',
    gradient: 'from-orange-500 via-rose-500 to-red-600',
    colorText: 'text-orange-400',
    bgLight: 'bg-orange-500/15 dark:bg-orange-500/25',
    borderColor: 'border-orange-500/50',
    glow: 'shadow-orange-500/30',
    evaluate: (d) => d.hasPhoenixSlumpToPeak,
    progressText: (d) => d.hasPhoenixSlumpToPeak ? 'Peak Achieved from Slump' : `${Math.round(d.bestRolling7Avg)}% Peak`
  }
];

export const BADGE_HIERARCHY_ORDER = [
  'phoenix_protocol',
  'd1_og',
  'ironclad',
  'antifragile',
  'trance',
  'unbreakable',
  'plot_armor',
  'flow_state',
  'solid_state',
  'the_ascendant',
  'kinetic',
  'genesis'
];

/**
 * Evaluates the full user badge state from summaries and habits
 */
export function evaluateUserBadges(allSummaries = [], habits = [], streakTrackingEnabled = false) {
  // 1. Filter and sort chronologically by date ascending
  const rawList = Array.isArray(allSummaries) ? allSummaries : [];
  const validSummaries = rawList
    .filter(s => {
      const hasCompleted = (s.habitsCompleted && s.habitsCompleted > 0);
      const hasScore = (s.overallScore !== undefined && s.overallScore !== null && s.overallScore > 0);
      const hasEntries = (s.entries && s.entries.length > 0);
      return hasCompleted || hasScore || hasEntries;
    })
    .sort((a, b) => {
      const dateA = a.date || a.id || '';
      const dateB = b.date || b.id || '';
      return dateA.localeCompare(dateB);
    });

  const totalLoggedDays = validSummaries.length;
  const hasAnyHabitCompleted = validSummaries.some(s => (s.habitsCompleted || 0) > 0 || (s.overallScore || 0) > 0);

  // 2. Lifetime average score
  const lifetimeAvgScore = totalLoggedDays > 0
    ? (validSummaries.reduce((sum, s) => sum + (s.overallScore || 0), 0) / totalLoggedDays)
    : 0;

  // 3. 7-Day Window Averages
  const recent7 = validSummaries.slice(-7);
  const recent7Avg = recent7.length > 0
    ? (recent7.reduce((sum, s) => sum + (s.overallScore || 0), 0) / recent7.length)
    : 0;

  const prior7 = validSummaries.slice(-14, -7);
  const prior7Avg = prior7.length > 0
    ? (prior7.reduce((sum, s) => sum + (s.overallScore || 0), 0) / prior7.length)
    : 0;

  // 4. Rolling 7-day windows analysis across history
  let worstRolling7Avg = 100;
  let bestRolling7Avg = 0;
  let hasPhoenixSlumpToPeak = false;

  if (validSummaries.length >= 7) {
    const rollingAvgs = [];
    for (let i = 0; i <= validSummaries.length - 7; i++) {
      const window7 = validSummaries.slice(i, i + 7);
      const avg = window7.reduce((sum, s) => sum + (s.overallScore || 0), 0) / 7;
      rollingAvgs.push(avg);
      if (avg < worstRolling7Avg) worstRolling7Avg = avg;
      if (avg > bestRolling7Avg) bestRolling7Avg = avg;
    }

    // Check if a slump (<= 45%) was followed in subsequent rolling periods by a peak (>= 75%)
    let encounteredSlump = false;
    for (const avg of rollingAvgs) {
      if (avg <= 45) {
        encounteredSlump = true;
      } else if (encounteredSlump && avg >= 75) {
        hasPhoenixSlumpToPeak = true;
        break;
      }
    }
  } else {
    bestRolling7Avg = recent7Avg;
  }

  // 5. Plot Armor: Low day <40% -> recovery >=70% within 48 hours (1-2 days)
  let has48hBounceBack = false;
  for (let i = 0; i < validSummaries.length; i++) {
    const score = validSummaries[i].overallScore || 0;
    if (score < 40) {
      // Check next 1 or 2 days
      const next1 = validSummaries[i + 1]?.overallScore || 0;
      const next2 = validSummaries[i + 2]?.overallScore || 0;
      if (next1 >= 70 || next2 >= 70) {
        has48hBounceBack = true;
        break;
      }
    }
  }

  // 6. Resilience Score & Recovery Cycles
  let resilienceScore = 100;
  let recoveryCyclesCount = 0;
  try {
    const recoveryRes = calculateRecoveryScore(rawList, 'all', 7, 30);
    if (recoveryRes?.recoveryScore !== undefined && recoveryRes.recoveryScore !== null) {
      resilienceScore = Math.round(recoveryRes.recoveryScore);
    }
    if (recoveryRes?.bounceBackCurves && Array.isArray(recoveryRes.bounceBackCurves)) {
      recoveryCyclesCount = recoveryRes.bounceBackCurves.filter(c => c.successful).length;
    }
  } catch (e) {}

  // Fallback recovery cycles count if zero
  if (recoveryCyclesCount === 0 && has48hBounceBack) {
    recoveryCyclesCount = 1;
  }

  // 7. Low performance days (< 50%)
  const lowPerformanceDaysCount = validSummaries.filter(s => (s.overallScore || 0) < 50).length;

  // 8. Trance: Deep Work / Study habit 7-day average >= 80%
  const deepWorkKeywords = /study|work|focus|deep|read|code|learn|padhai|kitab|meditation/i;
  const deepWorkHabit = (habits || []).find(h => 
    deepWorkKeywords.test(h.name || '') || deepWorkKeywords.test(h.category || '')
  ) || (habits || []).find(h => h.priorityRank === 1) || (habits || [])[0];

  let focusHabit7Avg = 0;
  if (deepWorkHabit && recent7.length > 0) {
    let completedInRecent = 0;
    recent7.forEach(s => {
      if (s.habits && s.habits[deepWorkHabit.id] !== undefined) {
        const val = s.habits[deepWorkHabit.id];
        if (typeof val === 'boolean') {
          if (val) completedInRecent++;
        } else if (val && typeof val === 'object') {
          if (val.completed || (val.score || 0) >= 50) completedInRecent++;
        }
      } else if (s.habitScores && s.habitScores[deepWorkHabit.id] !== undefined) {
        if ((s.habitScores[deepWorkHabit.id] || 0) >= 50) completedInRecent++;
      } else if (s.entries && Array.isArray(s.entries)) {
        const entry = s.entries.find(e => e.habitId === deepWorkHabit.id);
        if (entry && entry.value >= (entry.target || 1)) completedInRecent++;
      }
    });
    focusHabit7Avg = (completedInRecent / recent7.length) * 100;
  } else {
    focusHabit7Avg = recent7Avg;
  }

  // 9. Ironclad: Critical habit >= 60% for 30 consecutive qualifying days
  const criticalHabit = (habits || []).find(h => h.priorityRank === 1) || (habits || [])[0];
  let criticalHabitConsecutiveDays = 0;
  let maxCriticalHabitConsecutive = 0;

  if (criticalHabit) {
    for (const summary of validSummaries) {
      let isDone = false;
      if (summary.habits && summary.habits[criticalHabit.id] !== undefined) {
        const val = summary.habits[criticalHabit.id];
        if (typeof val === 'boolean') isDone = val;
        else if (val && typeof val === 'object') isDone = val.completed || (val.score || 0) >= 60;
      } else if (summary.habitScores && summary.habitScores[criticalHabit.id] !== undefined) {
        isDone = (summary.habitScores[criticalHabit.id] || 0) >= 60;
      } else {
        isDone = (summary.overallScore || 0) >= 60;
      }

      if (isDone) {
        criticalHabitConsecutiveDays++;
        if (criticalHabitConsecutiveDays > maxCriticalHabitConsecutive) {
          maxCriticalHabitConsecutive = criticalHabitConsecutiveDays;
        }
      } else {
        criticalHabitConsecutiveDays = 0;
      }
    }
  }

  // Also factor in currentStreak if streak tracking is on
  let bestStreak = 0;
  let currentStreak = 0;
  if (streakTrackingEnabled) {
    try {
      const streakData = calculateStreakData('all', rawList);
      currentStreak = streakData.currentStreak || 0;
      bestStreak = Math.max(streakData.currentStreak || 0, streakData.longestStreak || 0);
    } catch (e) {}
  }

  const payload = {
    totalLoggedDays,
    hasAnyHabitCompleted,
    lifetimeAvgScore,
    recent7Avg,
    prior7Avg,
    bestRolling7Avg,
    worstRolling7Avg,
    hasPhoenixSlumpToPeak,
    has48hBounceBack,
    resilienceScore,
    recoveryCyclesCount,
    lowPerformanceDaysCount,
    focusHabit7Avg,
    criticalHabitConsecutiveDays: Math.max(maxCriticalHabitConsecutive, bestStreak),
    bestStreak,
    currentStreak,
    streakTrackingEnabled
  };

  // Evaluate each of the 12 badges
  const evaluatedBadges = BADGE_DEFINITIONS.map(badgeDef => {
    const isUnlocked = badgeDef.evaluate(payload);
    const progress = badgeDef.progressText(payload);

    return {
      ...badgeDef,
      isUnlocked,
      progress
    };
  });

  const unlockedBadges = evaluatedBadges.filter(b => b.isUnlocked);
  const lockedBadges = evaluatedBadges.filter(b => !b.isUnlocked);

  // Determine top unlocked badge for persona title & auto-pill feature
  let topBadge = null;
  for (const id of BADGE_HIERARCHY_ORDER) {
    const match = unlockedBadges.find(b => b.id === id);
    if (match) {
      topBadge = match;
      break;
    }
  }

  // If none unlocked, default to Genesis (initial baseline)
  if (!topBadge) {
    topBadge = evaluatedBadges.find(b => b.id === 'genesis') || evaluatedBadges[0];
  }

  return {
    allBadges: evaluatedBadges,
    unlockedBadges,
    lockedBadges,
    topBadge,
    defaultTitle: topBadge.persona,
    defaultIconName: topBadge.iconName,
    metrics: payload
  };
}

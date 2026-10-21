/**
 * progressTowerEngine.js
 * Centralized progression engine for the Habit Adventure Quest Map (हैबिट एडवेंचर यात्रा मैप).
 *
 * Core Philosophy:
 * "One bad day should never erase what the user has already built."
 * - All progress is strictly cumulative (Total Completed Actions).
 * - Missed days or missed habits NEVER reduce actions or decrease quest stages.
 * - Single source of truth: derives directly from existing Firestore habit records.
 */

export const TOWER_LEVELS = [
  {
    level: 1,
    minActions: 0,
    maxActions: 9,
    title: 'Awakening Valley',
    titleHindi: 'शुरुआती हरी घाटी (Campfire)',
    subtitle: 'Foundation & Journey Start',
    icon: '🌿',
    color: '#10b981',
    accentClass: 'from-emerald-500 to-teal-500',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  {
    level: 2,
    minActions: 10,
    maxActions: 24,
    title: 'Whispering Falls',
    titleHindi: 'झरनों की भूमि (Momentum)',
    subtitle: 'Initial Momentum & Flow',
    icon: '🌊',
    color: '#06b6d4',
    accentClass: 'from-cyan-500 to-sky-500',
    badgeClass: 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
  },
  {
    level: 3,
    minActions: 25,
    maxActions: 49,
    title: 'Discipline Ridge',
    titleHindi: 'अनुशासन का पर्वत (Discipline)',
    subtitle: 'Consistent Daily Action',
    icon: '⚡',
    color: '#3b82f6',
    accentClass: 'from-blue-500 to-indigo-500',
    badgeClass: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  {
    level: 4,
    minActions: 50,
    maxActions: 99,
    title: 'Zen Sanctuary',
    titleHindi: 'ज़ेन उपवन (Inner Balance)',
    subtitle: 'Resilient Mindset & Peace',
    icon: '🌸',
    color: '#ec4899',
    accentClass: 'from-pink-500 to-rose-500',
    badgeClass: 'bg-pink-100 dark:bg-pink-950/70 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800'
  },
  {
    level: 5,
    minActions: 100,
    maxActions: 174,
    title: 'Sapphire Peaks',
    titleHindi: 'नीलम शिखर (Deep Mastery)',
    subtitle: 'High Altitude Mastery',
    icon: '🏔️',
    color: '#8b5cf6',
    accentClass: 'from-violet-500 to-purple-500',
    badgeClass: 'bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800'
  },
  {
    level: 6,
    minActions: 175,
    maxActions: 299,
    title: 'Cyber Oasis',
    titleHindi: 'साइबर ओएसिस (High Focus)',
    subtitle: 'Peak Focus & Productivity',
    icon: '🏙️',
    color: '#f97316',
    accentClass: 'from-orange-500 to-amber-500',
    badgeClass: 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800'
  },
  {
    level: 7,
    minActions: 300,
    maxActions: 499,
    title: 'Dragon Citadel',
    titleHindi: 'ड्रैगन का भव्य किला (Peak Power)',
    subtitle: 'Unstoppable Vitality',
    icon: '🏰',
    color: '#eab308',
    accentClass: 'from-yellow-500 to-amber-500',
    badgeClass: 'bg-yellow-100 dark:bg-yellow-950/70 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
  },
  {
    level: 8,
    minActions: 500,
    maxActions: Infinity,
    title: 'Celestial Apex',
    titleHindi: 'आकाशीय परम धाम (Apex Realm)',
    subtitle: 'Supreme Mastery Identity',
    icon: '🌌',
    color: '#f59e0b',
    accentClass: 'from-amber-400 via-orange-500 to-yellow-500',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  }
];

export function getFloorInfoForActions(totalActions = 0) {
  const actions = Math.max(0, Number(totalActions) || 0);

  let currentFloor = TOWER_LEVELS[0];
  for (let i = 0; i < TOWER_LEVELS.length; i++) {
    const floor = TOWER_LEVELS[i];
    if (actions >= floor.minActions && actions <= floor.maxActions) {
      currentFloor = floor;
      break;
    }
  }

  const currentIndex = TOWER_LEVELS.findIndex((f) => f.level === currentFloor.level);
  const nextFloor = currentIndex < TOWER_LEVELS.length - 1 ? TOWER_LEVELS[currentIndex + 1] : null;

  let progressPercent = 100;
  let actionsToNextFloor = 0;
  let floorProgress = 0;
  let floorTarget = 0;

  if (nextFloor) {
    floorTarget = nextFloor.minActions - currentFloor.minActions;
    floorProgress = actions - currentFloor.minActions;
    progressPercent = Math.min(100, Math.max(0, Math.round((floorProgress / floorTarget) * 100)));
    actionsToNextFloor = Math.max(0, nextFloor.minActions - actions);
  } else {
    floorProgress = actions - currentFloor.minActions;
    floorTarget = currentFloor.minActions;
    progressPercent = 100;
    actionsToNextFloor = 0;
  }

  return {
    currentFloor: currentFloor.level,
    currentFloorConfig: currentFloor,
    currentFloorTitle: currentFloor.title,
    currentFloorTitleHindi: currentFloor.titleHindi,
    currentFloorSubtitle: currentFloor.subtitle,
    currentFloorIcon: currentFloor.icon,
    currentFloorColor: currentFloor.color,
    floorProgress,
    floorTarget,
    progressPercent,
    nextFloor: nextFloor ? nextFloor.level : null,
    nextFloorConfig: nextFloor,
    nextFloorTitle: nextFloor ? nextFloor.title : null,
    actionsToNextFloor,
    totalActions: actions
  };
}

export function calculateTowerProgress(summaries = [], habits = []) {
  if (!summaries || summaries.length === 0) {
    const defaultFloor = getFloorInfoForActions(0);
    return {
      ...defaultFloor,
      totalCompletedActions: 0,
      totalHabitsBuilt: habits ? habits.length : 0,
      totalDaysActive: 0,
      habitBreakdown: (habits || []).map((h) => ({
        habitId: h.id,
        name: h.name,
        icon: h.icon || 'star',
        color: h.color || '#3b82f6',
        actions: 0,
        share: 0
      }))
    };
  }

  let totalActions = 0;
  let activeDaysCount = 0;
  const habitActionCounts = {};

  (habits || []).forEach((h) => {
    habitActionCounts[h.id] = 0;
  });

  summaries.forEach((s) => {
    let dayHadCompletion = false;

    if (s.habitScores && typeof s.habitScores === 'object') {
      Object.entries(s.habitScores).forEach(([habitId, score]) => {
        const numScore = Number(score) || 0;
        if (numScore >= 35) {
          totalActions += 1;
          habitActionCounts[habitId] = (habitActionCounts[habitId] || 0) + 1;
          dayHadCompletion = true;
        }
      });
    } else if (s.overallScore && Number(s.overallScore) > 0) {
      const estimatedActions = Math.max(1, Math.round((Number(s.overallScore) / 100) * (habits.length || 3)));
      totalActions += estimatedActions;
      dayHadCompletion = true;
    }

    if (dayHadCompletion) {
      activeDaysCount++;
    }
  });

  const habitBreakdown = (habits || [])
    .map((h) => {
      const actions = habitActionCounts[h.id] || 0;
      const share = totalActions > 0 ? Math.round((actions / totalActions) * 100) : 0;
      return {
        habitId: h.id,
        name: h.name,
        icon: h.icon || 'star',
        color: h.color || '#3b82f6',
        actions,
        share
      };
    })
    .sort((a, b) => b.actions - a.actions);

  const floorStats = getFloorInfoForActions(totalActions);

  return {
    ...floorStats,
    totalCompletedActions: totalActions,
    totalHabitsBuilt: habits ? habits.length : 0,
    totalDaysActive: activeDaysCount,
    habitBreakdown
  };
}

export function getStreakTrackingPreference(userDoc = null) {
  try {
    const localVal = localStorage.getItem('preference_streak_tracking');
    if (localVal !== null) {
      return localVal === 'true';
    }
  } catch (e) {}

  if (userDoc && typeof userDoc.streakTrackingEnabled === 'boolean') {
    return userDoc.streakTrackingEnabled;
  }

  return false;
}

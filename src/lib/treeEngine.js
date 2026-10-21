/**
 * towerEngine.js
 * High-performance modular architecture for Habit Skyscraper (इमारत / टावर इंजन).
 * Clean, fast, zero-lag derivation of tower height, floors, rooms, and sky spire.
 */

export const TOWER_STAGES = {
  foundation: {
    min: 0,
    max: 14,
    key: 'foundation',
    label: 'नींव व लॉबी (Foundation)',
    floorsCount: 1,
    desc: 'मजबूत कंक्रीट नींव और बेस लॉबी। आपकी पहली आदतें इमारत का आधार तैयार कर रही हैं।',
    themeColor: '#38bdf8',
    badge: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
  },
  low_rise: {
    min: 15,
    max: 49,
    key: 'low_rise',
    label: 'मॉड्यूलर टावर (Mid-Rise)',
    floorsCount: 3,
    desc: '3 मंजिला मॉडर्न काँच की इमारत। आदतें अब आपके दैनिक रूटीन में व्यवस्थित हो रही हैं।',
    themeColor: '#34d399',
    badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
  },
  high_rise: {
    min: 50,
    max: 119,
    key: 'high_rise',
    label: 'गगनचुंबी इमारत (High-Rise)',
    floorsCount: 5,
    desc: '5 मंजिला शानदार स्काईस्क्रेपर जिसमें लिफ्ट, ग्लास बालकनी और हैबिट रूम्स चालू हैं।',
    themeColor: '#818cf8',
    badge: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
  },
  sky_bridge: {
    min: 120,
    max: 249,
    key: 'sky_bridge',
    label: 'क्लाउड पेंटहाउस (Sky Penthouse)',
    floorsCount: 7,
    desc: 'बादलों को छूती 7 मंजिला इमारत, रूफटॉप गार्डन और स्काईब्रिज वेधशाला!',
    themeColor: '#f472b6',
    badge: 'bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300'
  },
  cyber_spire: {
    min: 250,
    max: Infinity,
    key: 'cyber_spire',
    label: 'मेगा एंपायर स्पायर (Mega Spire)',
    floorsCount: 9,
    desc: 'सर्वोच्च आर्किटेक्चरल चमत्कार! लेज़र बीकन, हेलीपैड और बादलों के ऊपर चमकता साइबर स्पायर।',
    themeColor: '#fbbf24',
    badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
  }
};

export const TOWER_MILESTONES = [
  {
    key: 'foundation_laid',
    at: 10,
    emoji: '🏗️',
    title: 'नींव स्थापित (Foundation Ready)',
    desc: 'इमारत की पहली नींव और ग्राउंड लॉबी तैयार हो गई।'
  },
  {
    key: 'glass_floors',
    at: 50,
    emoji: '🏢',
    title: 'ग्लास आर्किटेक्चर (Glass Floors)',
    desc: 'आधुनिक कांच के फ्लोर्स और इंटरनल लिफ्ट चालू हुई।'
  },
  {
    key: 'sky_lounge',
    at: 120,
    emoji: '🍹',
    title: 'स्काई लाउंज व गार्डन (Sky Lounge)',
    desc: 'रूफटॉप ग्रीन गार्डन और बादलों के बीच वॉकवे खुला।'
  },
  {
    key: 'helipad_beacon',
    at: 250,
    emoji: '🚁',
    title: 'हेलीपैड व लेज़र स्पायर (Apex Spire)',
    desc: 'शीर्ष पर हेलीपैड और आसमान को छूती लेज़र बीकन चालू हुई!'
  }
];

export function getTowerStageInfo(growthScore = 0) {
  const score = Math.max(0, Number(growthScore) || 0);
  const stageKeys = Object.keys(TOWER_STAGES);

  let currentStageKey = 'cyber_spire';
  for (const [k, stage] of Object.entries(TOWER_STAGES)) {
    if (score >= stage.min && score <= stage.max) {
      currentStageKey = k;
      break;
    }
  }

  const currentStage = TOWER_STAGES[currentStageKey];
  const currentIdx = stageKeys.indexOf(currentStageKey);
  const nextStageKey = currentIdx < stageKeys.length - 1 ? stageKeys[currentIdx + 1] : null;
  const nextStage = nextStageKey ? TOWER_STAGES[nextStageKey] : null;

  let progressPct = 100;
  let pointsToNext = 0;

  if (nextStage) {
    const rangeSpan = nextStage.min - currentStage.min;
    const progressInStage = score - currentStage.min;
    progressPct = Math.min(100, Math.max(0, Math.round((progressInStage / rangeSpan) * 100)));
    pointsToNext = Math.max(0, nextStage.min - score);
  }

  return {
    stageKey: currentStageKey,
    currentStage,
    nextStageKey,
    nextStage,
    progressPct,
    pointsToNext,
    growthScore: score
  };
}

export function calculateHabitGrowthAnalytics(summaries = [], habits = []) {
  if (!summaries || summaries.length === 0) {
    return {
      habitGrowthScore: 0,
      totalHabitsDone: 0,
      totalDaysActive: 0,
      habitBreakdown: []
    };
  }

  let totalPoints = 0;
  let totalHabitsDone = 0;
  let activeDaysCount = 0;
  const habitPointsMap = {};
  const habitDoneCountMap = {};

  habits.forEach(h => {
    habitPointsMap[h.id] = 0;
    habitDoneCountMap[h.id] = 0;
  });

  summaries.forEach((s) => {
    let dayCompletedHabits = 0;
    let dayPoints = 0;
    const isDayActive = (s.overallScore && s.overallScore > 0) || (s.habitScores && Object.values(s.habitScores).some(v => Number(v) > 0));

    if (isDayActive) {
      activeDaysCount++;
    }

    if (s.habitScores && typeof s.habitScores === 'object') {
      Object.entries(s.habitScores).forEach(([hId, sc]) => {
        const numScore = Number(sc) || 0;
        if (numScore >= 35) {
          dayCompletedHabits++;
          totalHabitsDone++;
          habitDoneCountMap[hId] = (habitDoneCountMap[hId] || 0) + 1;

          const quality = numScore >= 80 ? 3 : numScore >= 50 ? 2 : 1;
          habitPointsMap[hId] = (habitPointsMap[hId] || 0) + quality;
          dayPoints += quality;
        }
      });
    } else if (s.overallScore && s.overallScore > 0) {
      const estimated = Math.max(1, Math.round((s.overallScore / 100) * 3));
      dayCompletedHabits = estimated;
      totalHabitsDone += estimated;
      dayPoints += (estimated * 2);
    }

    if (dayCompletedHabits >= 3) {
      dayPoints += 2;
    }

    totalPoints += dayPoints;
  });

  const habitBreakdown = habits.map(h => {
    const pts = habitPointsMap[h.id] || 0;
    const count = habitDoneCountMap[h.id] || 0;
    const share = totalPoints > 0 ? Math.round((pts / totalPoints) * 100) : 0;
    return {
      habitId: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      points: pts,
      completions: count,
      share
    };
  }).sort((a, b) => b.points - a.points);

  return {
    habitGrowthScore: totalPoints,
    totalHabitsDone,
    totalDaysActive: activeDaysCount,
    habitBreakdown
  };
}

export function isTodayDate(dateStr) {
  if (!dateStr) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return dateStr.startsWith(todayStr);
}

export function isYesterdayDate(dateStr) {
  if (!dateStr) return false;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterdayStr = y.toISOString().split('T')[0];
  return dateStr.startsWith(yesterdayStr);
}

export function calculateTowerState(userId, summaries = [], habits = []) {
  const habitAnalytics = calculateHabitGrowthAnalytics(summaries, habits);

  let energyBonus = 0;
  let powerStreak = 0;
  let lastPoweredAt = null;

  try {
    const raw = localStorage.getItem('tower_power_' + (userId || 'guest'));
    if (raw) {
      const parsed = JSON.parse(raw);
      powerStreak = Number(parsed.powerStreak) || 0;
      energyBonus = Number(parsed.energyBonus) || 0;
      lastPoweredAt = parsed.lastPoweredAt || null;
    }
  } catch (e) {}

  const totalGrowthScore = habitAnalytics.habitGrowthScore + energyBonus;
  const stageInfo = getTowerStageInfo(totalGrowthScore);

  return {
    userId: userId || 'guest',
    growthScore: totalGrowthScore,
    habitGrowthScore: habitAnalytics.habitGrowthScore,
    energyBonus,
    currentStage: stageInfo.stageKey,
    totalHabitsDone: habitAnalytics.totalHabitsDone,
    totalDaysActive: habitAnalytics.totalDaysActive,
    habitBreakdown: habitAnalytics.habitBreakdown,
    powerStreak,
    lastPoweredAt,
    unlockedFeatures: TOWER_MILESTONES.filter((r) => totalGrowthScore >= r.at).map((r) => r.key)
  };
}

export function powerTower(userId, currentTower) {
  const nowStr = new Date().toISOString();
  if (isTodayDate(currentTower?.lastPoweredAt)) {
    return {
      success: false,
      alreadyPowered: true,
      message: 'आज की ऊर्जा दी जा चुकी है!'
    };
  }

  const isConsecutive = isYesterdayDate(currentTower?.lastPoweredAt);
  const newPowerStreak = isConsecutive ? (Number(currentTower?.powerStreak) || 0) + 1 : 1;
  const newEnergyBonus = (Number(currentTower?.energyBonus) || 0) + 2;

  try {
    localStorage.setItem('tower_power_' + (userId || 'guest'), JSON.stringify({
      powerStreak: newPowerStreak,
      energyBonus: newEnergyBonus,
      lastPoweredAt: nowStr
    }));
  } catch (e) {}

  return {
    success: true,
    pointsAdded: 2,
    powerStreak: newPowerStreak,
    energyBonus: newEnergyBonus,
    lastPoweredAt: nowStr,
    message: 'टावर को ऊर्जा दी गई! +2 कंस्ट्रक्शन पॉइंट्स अर्जित हुए।'
  };
}

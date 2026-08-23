/**
 * 30-Day Better Report Intelligence Engine
 * Pure deterministic mathematical engine that computes a 30-day narrative documentary
 * of habit consistency, superpower, challenges, slope improvements, recovery, and synergies.
 */

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function generateBetterReport(habits = [], allSummaries = [], requestedWindow = 30) {
  if (!habits || habits.length === 0) return null;

  // 1. Sort summaries chronologically ascending (e.g. 2026-08-01 -> 2026-08-22)
  const sortedSummaries = [...allSummaries].sort((a, b) => (a.id > b.id ? 1 : -1));
  const windowSummaries = sortedSummaries.slice(-requestedWindow);
  const totalDaysTracked = windowSummaries.length;
  const isProvisional = totalDaysTracked < 30;

  const startDateStr = windowSummaries[0]?.id ? formatDateShort(windowSummaries[0].id) : 'Start';
  const endDateStr = windowSummaries[windowSummaries.length - 1]?.id ? formatDateShort(windowSummaries[windowSummaries.length - 1].id) : 'Today';
  const dateRangeLabel = `${startDateStr} – ${endDateStr}`;

  // 2. Consistency Score calculation
  // Active days: days where overallScore > 0 or at least one habit was logged
  let activeDays = 0;
  let overallScoreSum = 0;

  windowSummaries.forEach(s => {
    const hasLog = s.overallScore !== undefined && s.overallScore !== null && s.overallScore > 0;
    if (hasLog) activeDays++;
    overallScoreSum += (s.overallScore || 0);
  });

  const avgOverallScore = totalDaysTracked > 0 ? Math.round(overallScoreSum / totalDaysTracked) : 0;
  const activeRate = requestedWindow > 0 ? (activeDays / requestedWindow) : 0;
  const consistencyScore = Math.min(100, Math.round(avgOverallScore * 0.7 + (activeRate * 100) * 0.3));

  let consistencyTier = 'Beginner';
  let tierColor = 'amber';
  if (consistencyScore >= 85) {
    consistencyTier = 'Master';
    tierColor = 'emerald';
  } else if (consistencyScore >= 70) {
    consistencyTier = 'Pro';
    tierColor = 'sky';
  } else if (consistencyScore >= 50) {
    consistencyTier = 'Learner';
    tierColor = 'indigo';
  }

  // 3. 4-Week Trend Buckets (Partition the window into 4 quarters)
  const bucketSize = Math.max(1, Math.ceil(totalDaysTracked / 4));
  const weeklyAverages = [];
  for (let b = 0; b < 4; b++) {
    const slice = windowSummaries.slice(b * bucketSize, (b + 1) * bucketSize);
    if (slice.length > 0) {
      const bSum = slice.reduce((sum, s) => sum + (s.overallScore || 0), 0);
      weeklyAverages.push(Math.round(bSum / slice.length));
    } else {
      weeklyAverages.push(weeklyAverages[weeklyAverages.length - 1] || 0);
    }
  }

  // 4. Per-Habit Detailed Analysis
  const habitReports = habits.map(h => {
    let habitScoreSum = 0;
    let habitLoggedDays = 0;
    let perfectDays = 0;
    let missedDays = 0;

    // 30-day dot array for calendar heatmap
    const dots = [];

    windowSummaries.forEach(s => {
      const score = s.habitScores?.[h.id];
      if (score !== undefined && score !== null) {
        habitScoreSum += score;
        habitLoggedDays++;
        if (score >= 80) perfectDays++;
        if (score < 40) missedDays++;
        dots.push(score);
      } else {
        dots.push(null);
      }
    });

    const avgScore = habitLoggedDays > 0 ? Math.round(habitScoreSum / habitLoggedDays) : 0;
    const streak = h.streak || h.currentStreak || perfectDays;

    // First half vs Second half improvement slope
    const half = Math.floor(windowSummaries.length / 2);
    const firstHalf = windowSummaries.slice(0, half);
    const secondHalf = windowSummaries.slice(half);

    const firstSum = firstHalf.reduce((sum, s) => sum + (s.habitScores?.[h.id] || 0), 0);
    const firstAvg = firstHalf.length > 0 ? Math.round(firstSum / firstHalf.length) : 0;

    const secondSum = secondHalf.reduce((sum, s) => sum + (s.habitScores?.[h.id] || 0), 0);
    const secondAvg = secondHalf.length > 0 ? Math.round(secondSum / secondHalf.length) : 0;

    const delta = secondAvg - firstAvg;

    // 4-point weekly sparkline
    const habitWeekly = [];
    for (let b = 0; b < 4; b++) {
      const slice = windowSummaries.slice(b * bucketSize, (b + 1) * bucketSize);
      if (slice.length > 0) {
        const bSum = slice.reduce((sum, s) => sum + (s.habitScores?.[h.id] || 0), 0);
        habitWeekly.push(Math.round(bSum / slice.length));
      } else {
        habitWeekly.push(0);
      }
    }

    return {
      id: h.id,
      name: h.name,
      icon: h.icon || 'star',
      scoringType: h.scoringType,
      avgScore,
      streak,
      perfectDays,
      missedDays,
      loggedDays: habitLoggedDays,
      firstAvg,
      secondAvg,
      delta,
      dots,
      weekly: habitWeekly
    };
  });

  // Sort by avgScore descending
  const sortedByScore = [...habitReports].sort((a, b) => b.avgScore - a.avgScore);
  
  // Strongest habit (Superpower)
  const strongestHabit = sortedByScore[0] || null;

  // Weakest habit (Challenge)
  const weakestHabit = sortedByScore[sortedByScore.length - 1] || null;

  // Biggest Improvement habit (Highest positive delta)
  const sortedByDelta = [...habitReports].sort((a, b) => b.delta - a.delta);
  const improvedHabit = sortedByDelta[0]?.delta > 5 ? sortedByDelta[0] : null;

  // 5. 30-Day Cross-Habit Correlations (Synergies & Conflicts)
  const correlations = [];
  if (habits.length >= 2 && windowSummaries.length >= 7) {
    for (let i = 0; i < habits.length; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const hA = habits[i];
        const hB = habits[j];

        let aHighCount = 0;
        let bothHigh = 0;
        let aHighBlow = 0;

        windowSummaries.forEach(s => {
          const sA = s.habitScores?.[hA.id];
          const sB = s.habitScores?.[hB.id];
          if (sA !== undefined && sA !== null && sB !== undefined && sB !== null) {
            if (sA >= 70) {
              aHighCount++;
              if (sB >= 70) bothHigh++;
              if (sB < 40) aHighBlow++;
            }
          }
        });

        if (aHighCount >= 3) {
          const synergyPct = Math.round((bothHigh / aHighCount) * 100);
          const drainPct = Math.round((aHighBlow / aHighCount) * 100);

          if (synergyPct >= 60) {
            correlations.push({
              type: 'positive',
              habitA: hA.name,
              habitB: hB.name,
              percentage: synergyPct,
              headline: `When you master ${hA.name}, your ${hB.name} automatically thrives (${synergyPct}% co-occurrence).`
            });
          } else if (drainPct >= 50) {
            correlations.push({
              type: 'negative',
              habitA: hA.name,
              habitB: hB.name,
              percentage: drainPct,
              headline: `High energy on ${hA.name} drained ${hB.name} on ${drainPct}% of peak days.`
            });
          }
        }
      }
    }
  }

  // 6. Recovery Story (Trajectory)
  const startRecovery = weeklyAverages[0] || 50;
  const endRecovery = weeklyAverages[weeklyAverages.length - 1] || 50;
  const recoveryGrowth = endRecovery - startRecovery;
  const resilienceBadge = recoveryGrowth >= 15 ? 'Resilience Master' : (recoveryGrowth >= 0 ? 'Steady Pacer' : 'Reset Needed');

  // 7. Next 30-Day Action Challenge
  const nextChallenge = {
    targetHabit: weakestHabit ? weakestHabit.name : (habits[0]?.name || 'Habit'),
    targetGoal: weakestHabit ? Math.min(100, weakestHabit.avgScore + 25) : 80,
    headline: weakestHabit 
      ? `Elevate ${weakestHabit.name} to ${Math.min(100, weakestHabit.avgScore + 25)}% in the next 30 days`
      : 'Maintain unbroken 30-day streak across all routines',
    actionText: weakestHabit 
      ? `Use the 2-Minute Anchor rule every morning to build an unbreakable floor for ${weakestHabit.name}.`
      : 'Keep your momentum cruising!'
  };

  return {
    meta: {
      totalHabits: habits.length,
      totalDaysTracked,
      requestedWindow,
      isProvisional,
      dateRangeLabel,
      activeDays,
      avgOverallScore,
      consistencyScore,
      consistencyTier,
      tierColor
    },
    weeklyAverages,
    strongestHabit,
    weakestHabit,
    improvedHabit,
    correlations: correlations.slice(0, 3),
    recoveryStory: {
      weeklyAverages,
      startRecovery,
      endRecovery,
      recoveryGrowth,
      resilienceBadge
    },
    habitReports,
    nextChallenge
  };
}

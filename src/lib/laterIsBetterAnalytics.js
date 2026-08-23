import { calculateRecoveryScore } from './recoveryAnalytics';

// laterIsBetterAnalytics.js
// O(N) single-pass analytics for "Later Is Better" habit scoring type (Time)

const DAYS_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function toDateStr(d) { return d.toISOString().split('T')[0]; }

export function formatTimeVal(minutes) {
  if (minutes === null || minutes === undefined) return 'N/A';
  let h = Math.floor(minutes / 60) % 24;
  let m = Math.round(minutes % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function getDOWIndex(dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return dow === 0 ? 6 : dow - 1;
}

export function getLaterIsBetterAnalytics(habit, allSummaries, dateRange) {
  if (!habit || !allSummaries) return null;

  const { start, end } = dateRange;
  const recoveryData = calculateRecoveryScore(allSummaries, habit.id, 7, 30);

  const startDt = new Date(start + 'T00:00:00');
  const endDt   = new Date(end   + 'T00:00:00');
  const diffDays = Math.round((endDt - startDt) / 86400000) + 1;

  const prevEndDt   = new Date(startDt); prevEndDt.setDate(prevEndDt.getDate() - 1);
  const prevStartDt = new Date(prevEndDt); prevStartDt.setDate(prevStartDt.getDate() - (diffDays - 1));
  const prevStart = toDateStr(prevStartDt);
  const prevEnd   = toDateStr(prevEndDt);

  let targetValue = habit.target100 !== undefined ? Number(habit.target100) : (habit.userTarget100 !== undefined ? Number(habit.userTarget100) : 1080);
  let target0 = habit.target0 !== undefined ? Number(habit.target0) : (habit.userTarget0 !== undefined ? Number(habit.userTarget0) : 900);
  
  if (isNaN(targetValue)) {
    const tv = String(habit.target100 || habit.userTarget100 || "18:00");
    const [h, m] = tv.split(':').map(Number);
    targetValue = (h || 18) * 60 + (m || 0);
  }
  if (isNaN(target0)) {
    const t0 = String(habit.target0 || habit.userTarget0 || "15:00");
    const [h, m] = t0.split(':').map(Number);
    target0 = (h || 15) * 60 + (m || 0);
  }

  let scoreSum = 0, valueSum = 0, trackedDays = 0;
  let prevScoreSum = 0, prevValueSum = 0, prevTrackedDays = 0;
  let daysOnTarget = 0;
  let bestValue = -Infinity, bestDate = null;

  const weekdayValueSum   = [0, 0, 0, 0, 0, 0, 0];
  const weekdayScoreSum   = [0, 0, 0, 0, 0, 0, 0];
  const weekdayCounts     = [0, 0, 0, 0, 0, 0, 0];

  const dailyAll = [];
  let longestStreak = 0, curStreak = 0;

  for (let i = 0; i < allSummaries.length; i++) {
    const s = allSummaries[i];
    const score = s.habitScores?.[habit.id];
    let numValue = s.habitValues?.[habit.id];
    
    if (numValue !== null && numValue !== undefined && typeof numValue === 'number') {
       if (numValue > 1440 && habit.id.includes('sleep')) numValue -= 1440;
    } else {
       numValue = null;
    }

    const hasData = score !== null && score !== undefined;

    if (s.id >= start && s.id <= end) {
      if (hasData) {
        scoreSum += score;
        if (numValue !== null) valueSum += numValue;
        trackedDays++;
        if (score >= 100) daysOnTarget++;
        // Later is better means HIGHER time is better
        if (numValue !== null && numValue > bestValue) {
          bestValue = numValue;
          bestDate = s.id;
        }
        const dowIdx = getDOWIndex(s.id);
        weekdayValueSum[dowIdx] += numValue || 0;
        weekdayScoreSum[dowIdx] += score;
        weekdayCounts[dowIdx]++;
      }
      dailyAll.push({ date: s.id, score: hasData ? score : null, value: numValue });
    }

    if (s.id >= prevStart && s.id <= prevEnd && hasData) {
      prevScoreSum += score;
      if (numValue !== null) prevValueSum += numValue;
      prevTrackedDays++;
    }
  }

  const orderedDates = dailyAll.sort((a, b) => a.date.localeCompare(b.date));
  orderedDates.forEach(d => {
    if (d.score !== null && d.score >= 100) {
      curStreak++;
      longestStreak = Math.max(longestStreak, curStreak);
    } else {
      curStreak = 0;
    }
  });

  const overallScore = trackedDays > 0 ? Math.round(scoreSum / trackedDays) : 0;
  const avgValue     = trackedDays > 0 ? Math.round(valueSum / trackedDays) : 0;

  const prevScore    = prevTrackedDays > 0 ? Math.round(prevScoreSum / prevTrackedDays) : null;
  const prevAvgValue = prevTrackedDays > 0 ? Math.round(prevValueSum / prevTrackedDays) : null;
  const improvement  = prevScore !== null ? overallScore - prevScore : null;
  const valueChange  = prevAvgValue !== null ? avgValue - prevAvgValue : null;

  const weekdayPattern = DAYS_ORDER.map((day, i) => ({
    day,
    avg: weekdayCounts[i] > 0 ? Math.round(weekdayValueSum[i] / weekdayCounts[i]) : 0,
    avgScore: weekdayCounts[i] > 0 ? weekdayScoreSum[i] / weekdayCounts[i] : 0,
    count: weekdayCounts[i],
  }));
  const maxWeekdayAvg = Math.max(...weekdayPattern.map(w => w.avg), 0.0001);

  const tracked = weekdayPattern.filter(w => w.count > 0);
  const mostConsistentDay = tracked.length
    ? tracked.reduce((b, w) => w.avgScore > b.avgScore ? w : b, tracked[0]).day
    : 'N/A';
  const weakestDay = tracked.length
    ? tracked.reduce((b, w) => w.avgScore < b.avgScore ? w : b, tracked[0]).day
    : 'N/A';

  let bestWeekAvg = -Infinity;
  for (let i = 0; i <= orderedDates.length - 7; i++) {
    const week = orderedDates.slice(i, i + 7).filter(d => d.value !== null);
    if (week.length === 0) continue;
    const avg = week.reduce((s, d) => s + d.value, 0) / week.length;
    if (avg > bestWeekAvg) bestWeekAvg = Math.round(avg);
  }

  const insights = [];
  if (weakestDay !== 'N/A') {
    insights.push(`💡 You tend to miss your target time most on ${weakestDay}s.`);
  }
  if (improvement !== null && improvement > 0) {
    insights.push(`↗ Score improved by ${improvement}% vs the previous period. Great job!`);
  } else if (improvement !== null && improvement < 0) {
    insights.push(`↘ Score dropped by ${Math.abs(improvement)}% vs last period.`);
  }
  if (daysOnTarget > 0) {
    insights.push(`🎯 You were on target on ${daysOnTarget} of ${diffDays} days (${Math.round(daysOnTarget / diffDays * 100)}%).`);
  }
  if (valueChange !== null && valueChange > 0) {
    const hr = Math.floor(valueChange / 60);
    const mn = Math.round(valueChange % 60);
    const timeStr = hr > 0 ? `${hr}h ${mn}m` : `${mn}m`;
    insights.push(`↗ You averaged ${timeStr} later vs last period.`);
  }

  return {
    summary: {
      overallScore,
      avgValue,
      daysOnTarget,
      totalDays: diffDays,
      trackedDays,
    },
    streaks: {
      current: recoveryData.currentStreak !== undefined ? recoveryData.currentStreak : curStreak,
      best: recoveryData.bestStreak !== undefined ? recoveryData.bestStreak : longestStreak,
      recoveryScore: recoveryData.recoveryScore,
      recoveryStreak: recoveryData.recoveryStreak,
      resilienceSummary: recoveryData.resilienceSummary
    },
    recoveryData,
    currentStreak: recoveryData.currentStreak !== undefined ? recoveryData.currentStreak : curStreak,
    bestStreak: recoveryData.bestStreak !== undefined ? recoveryData.bestStreak : longestStreak,
    recoveryScore: recoveryData.recoveryScore,
    recoveryStreak: recoveryData.recoveryStreak,
    resilienceSummary: recoveryData.resilienceSummary,
    targetValue,
    target0,
    unit: 'Time',
    formatVal: formatTimeVal,
    fmtVal: formatTimeVal,
    bestDay: bestDate ? { value: bestValue, date: bestDate } : null,
    improvement,
    valueChange,
    prevScore,
    prevAvgValue,
    weekdayPattern,
    maxWeekdayAvg,
    dailyDetails: [...orderedDates].reverse().slice(0, 10),
    personalBests: {
      bestValue: bestDate ? bestValue : null,
      bestDate,
      bestWeekAvg: bestWeekAvg !== -Infinity ? bestWeekAvg : null,
      longestStreak: recoveryData.bestStreak !== undefined ? recoveryData.bestStreak : longestStreak,
      mostConsistentDay,
    },
    trend: {
      currentAvg: avgValue,
      prevAvg: prevAvgValue,
      change: valueChange,
      currentScore: overallScore,
      prevScore,
    },
    insights,
    weakestDay
  };
}

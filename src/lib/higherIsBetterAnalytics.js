import { calculateRecoveryScore } from './recoveryAnalytics';

// higherIsBetterAnalytics.js — O(N) single-pass analytics
const DAYS_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function toDateStr(d) { return d.toISOString().split("T")[0]; }

function formatVal(val, unit) {
  if (val === null || val === undefined) return "N/A";
  const rounded = Math.round(val * 10) / 10;
  return unit ? `${rounded} ${unit}` : String(rounded);
}

function getDOWIndex(dateStr) {
  const dow = new Date(dateStr + "T00:00:00").getDay();
  return dow === 0 ? 6 : dow - 1;
}

export function getHigherIsBetterAnalytics(habit, allSummaries, dateRange) {
  if (!habit || !allSummaries) return null;
  const { start, end } = dateRange;
  const recoveryData = calculateRecoveryScore(allSummaries, habit.id, 7, 30);

  const startDt = new Date(start + "T00:00:00");
  const endDt   = new Date(end   + "T00:00:00");
  const diffDays = Math.round((endDt - startDt) / 86400000) + 1;

  const prevEndDt   = new Date(startDt); prevEndDt.setDate(prevEndDt.getDate() - 1);
  const prevStartDt = new Date(prevEndDt); prevStartDt.setDate(prevStartDt.getDate() - (diffDays - 1));
  const prevStart = toDateStr(prevStartDt);
  const prevEnd   = toDateStr(prevEndDt);

  const targetValue = Number(habit.targetValue || habit.userTarget100 || habit.target100 || habit.target || 0);
  const target0 = Number(habit.target0 || habit.userTarget0 || 0);
  const unit = habit.unit || habit.defaultUnit || habit.customUnit || habit.targetUnit || "";

  let scoreSum = 0, valueSum = 0, trackedDays = 0;
  let prevScoreSum = 0, prevValueSum = 0, prevTrackedDays = 0;
  let daysOnTarget = 0;
  let bestValue = -Infinity, bestDate = null;

  const weekdayValueSum = [0,0,0,0,0,0,0];
  const weekdayScoreSum = [0,0,0,0,0,0,0];
  const weekdayCounts   = [0,0,0,0,0,0,0];

  const dailyAll = [];
  let longestStreak = 0, curStreak = 0;

  for (let i = 0; i < allSummaries.length; i++) {
    const s = allSummaries[i];
    const rawScore = s.habitScores?.[habit.id];
    const rawValue = s.habitValues?.[habit.id] ?? s.habits?.[habit.id]?.value ?? s.habits?.[habit.id];
    const numValue = rawValue !== null && rawValue !== undefined && !isNaN(Number(rawValue)) ? Number(rawValue) : null;
    
    let score = rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore)) ? Number(rawScore) : null;
    if (score === null && numValue !== null) {
      if (numValue >= targetValue) score = 100;
      else if (numValue <= target0) score = 0;
      else if (targetValue !== target0) score = Math.max(0, Math.min(100, Math.round(100 * (numValue - target0) / (targetValue - target0))));
      else score = 0;
    }
    const hasData = score !== null && !isNaN(score);

    if (s.id >= start && s.id <= end) {
      if (hasData) {
        scoreSum += score;
        if (numValue !== null) valueSum += numValue;
        trackedDays++;
        if (score >= 100) daysOnTarget++;
        if (numValue !== null && numValue > bestValue) { bestValue = numValue; bestDate = s.id; }
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
    if (d.score !== null && d.score >= 100) { curStreak++; longestStreak = Math.max(longestStreak, curStreak); }
    else curStreak = 0;
  });

  const overallScore = trackedDays > 0 && !isNaN(scoreSum) ? Math.round(scoreSum / trackedDays) : 0;
  const avgValue     = trackedDays > 0 && !isNaN(valueSum) ? valueSum / trackedDays : 0;

  const prevScore    = prevTrackedDays > 0 && !isNaN(prevScoreSum) ? Math.round(prevScoreSum / prevTrackedDays) : null;
  const prevAvgValue = prevTrackedDays > 0 ? prevValueSum / prevTrackedDays : null;
  const improvement  = prevScore !== null ? overallScore - prevScore : null;
  const valueChange  = prevAvgValue !== null ? avgValue - prevAvgValue : null;

  const weekdayPattern = DAYS_ORDER.map((day, i) => ({
    day,
    avg: weekdayCounts[i] > 0 ? weekdayValueSum[i] / weekdayCounts[i] : 0,
    avgScore: weekdayCounts[i] > 0 ? weekdayScoreSum[i] / weekdayCounts[i] : 0,
    count: weekdayCounts[i],
  }));
  const maxWeekdayAvg = Math.max(...weekdayPattern.map(w => w.avg), 0.0001);

  const tracked = weekdayPattern.filter(w => w.count > 0);
  const mostConsistentDay = tracked.length ? tracked.reduce((b, w) => w.avgScore > b.avgScore ? w : b, tracked[0]).day : "N/A";
  const weakestDay        = tracked.length ? tracked.reduce((b, w) => w.avgScore < b.avgScore ? w : b, tracked[0]).day : "N/A";

  let bestWeekAvg = 0;
  for (let i = 0; i <= orderedDates.length - 7; i++) {
    const week = orderedDates.slice(i, i+7).filter(d => d.value !== null);
    if (!week.length) continue;
    const avg = week.reduce((s, d) => s + d.value, 0) / week.length;
    if (avg > bestWeekAvg) bestWeekAvg = avg;
  }

  const insights = [];
  if (weakestDay !== "N/A") insights.push(`\uD83D\uDCA1 ${weakestDay} tends to be your weakest day. Try a midday reminder.`);
  if (improvement !== null && improvement > 0) insights.push(`\u2197 Score improved by ${improvement}% vs the previous period!`);
  else if (improvement !== null && improvement < 0) insights.push(`\u2198 Score dropped by ${Math.abs(improvement)}% vs last period. Let's push harder!`);
  if (daysOnTarget > 0) insights.push(`\uD83C\uDFAF Hit target on ${daysOnTarget} of ${diffDays} days (${Math.round(daysOnTarget/diffDays*100)}%).`);
  if (targetValue > 0 && avgValue > targetValue) insights.push(`\u2B50 Avg ${formatVal(avgValue, unit)} is above target ${formatVal(targetValue, unit)}.`);
  if (longestStreak >= 3) insights.push(`\uD83D\uDD25 Longest on-target streak: ${longestStreak} days.`);

  return {
    summary: { overallScore, avgValue, daysOnTarget, totalDays: diffDays, trackedDays },
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
    targetValue, unit,
    fmtVal: (v) => formatVal(v, unit),
    formatVal: (v) => formatVal(v, unit),
    bestDay: bestDate ? { value: bestValue, date: bestDate } : null,
    improvement, valueChange, prevScore, prevAvgValue,
    weekdayPattern, maxWeekdayAvg,
    dailyDetails: [...orderedDates].reverse().slice(0, 10),
    personalBests: {
      bestValue: bestDate ? bestValue : null, bestDate,
      bestWeekAvg: bestWeekAvg > 0 ? bestWeekAvg : null,
      longestStreak: recoveryData.bestStreak !== undefined ? recoveryData.bestStreak : longestStreak,
      mostConsistentDay,
    },
    trend: { currentAvg: avgValue, prevAvg: prevAvgValue, change: valueChange, currentScore: overallScore, prevScore },
    insights,
    weakestDay,
  };
}

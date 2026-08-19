import { useMemo } from 'react';

// Helper to format minutes into HH:MM (AM/PM)
export function formatTimeAmPm(minutes) {
  if (minutes == null) return "--:--";
  let h = Math.floor(minutes / 60) % 24;
  let m = minutes % 60;
  let ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function useTargetTimeData(habit, allSummaries, days = 30) {
  return useMemo(() => {
    if (!habit || !allSummaries) return null;

    // Get the last `days` period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    const endStr = endDate.toISOString().split('T')[0];
    const startStr = startDate.toISOString().split('T')[0];

    // Filter summaries for this period
    const periodSummaries = allSummaries.filter(s => s.id >= startStr && s.id <= endStr);
    
    // Sort chronologically
    periodSummaries.sort((a, b) => a.id.localeCompare(b.id));

    let totalScore = 0;
    let daysWithEntry = 0;
    let successfulDays = 0; // Score >= 51 (User requested >51%)
    let totalMinutes = 0;
    let earliest = null;
    let latest = null;

    const distribution = {
      excellent: 0, // 90-100
      good: 0,      // 70-89
      average: 0,   // 50-69
      poor: 0       // < 50
    };

    const patternBuckets = {};

    periodSummaries.forEach(s => {
      const score = s.habitScores?.[habit.id];
      const rawVal = s.habitValues?.[habit.id]; // We just added this to Dashboard!

      if (score !== undefined && score !== null && rawVal !== undefined) {
        daysWithEntry++;
        totalScore += score;
        totalMinutes += rawVal;

        if (score >= 51) successfulDays++;

        // Min / Max
        if (earliest === null || rawVal < earliest.val) earliest = { val: rawVal, date: s.id };
        if (latest === null || rawVal > latest.val) latest = { val: rawVal, date: s.id };

        // Distribution
        if (score >= 90) distribution.excellent++;
        else if (score >= 70) distribution.good++;
        else if (score >= 50) distribution.average++;
        else distribution.poor++;

        // Pattern Bucketing (30-min slots)
        const hour = Math.floor(rawVal / 60) % 24;
        const isHalf = (rawVal % 60) >= 30;
        const bucketKey = `${hour.toString().padStart(2, '0')}:${isHalf ? '30' : '00'}`;
        patternBuckets[bucketKey] = (patternBuckets[bucketKey] || 0) + 1;
      }
    });

    const averageMinutes = daysWithEntry > 0 ? Math.round(totalMinutes / daysWithEntry) : null;
    const averageScore = daysWithEntry > 0 ? Math.round(totalScore / daysWithEntry) : 0;

    // Convert patternBuckets to sorted array for chart
    const timePatternArray = Object.keys(patternBuckets)
      .sort((a, b) => {
        // Simple string sort works for "05:00", "05:30"
        return a.localeCompare(b);
      })
      .map(k => ({ time: k, count: patternBuckets[k] }));

    return {
      stats: {
        totalDays: daysWithEntry,
        successfulDays,
        averageScore,
        averageMinutes,
        earliest,
        latest,
      },
      distribution,
      timePatternArray,
      periodSummaries, // raw for line chart
      startStr,
      endStr
    };

  }, [habit, allSummaries, days]);
}

export function computeKPIs(summaries, startDate, endDate) {
  let scoreSum = 0;
  let count = 0;
  let highestScore = -1;
  let bestDay = null;
  let lowestScore = 101;
  let worstDay = null;
  
  let daysWithEntry = 0;

  for (const sum of summaries) {
    if (sum.id >= startDate && sum.id <= endDate) {
      if (sum.overallScore !== undefined) {
        scoreSum += sum.overallScore;
        count++;
        
        if (sum.overallScore > highestScore) {
          highestScore = sum.overallScore;
          bestDay = sum.id;
        }
        if (sum.overallScore < lowestScore) {
          lowestScore = sum.overallScore;
          worstDay = sum.id;
        }
      }
      
      if (sum.habitsCompleted > 0) {
          daysWithEntry++;
      }
    }
  }

  // To compute tracked days, we need total days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  // inclusive
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  
  return {
    averageScore: count > 0 ? Math.round(scoreSum / count) : 0,
    bestDay: bestDay,
    bestDayScore: highestScore === -1 ? null : highestScore,
    lowestDay: worstDay,
    lowestDayScore: lowestScore === 101 ? null : lowestScore,
    consistency: Math.round((daysWithEntry / totalDays) * 100) || 0,
    trackedDays: daysWithEntry,
    totalDays: totalDays
  };
}

export function generateHeatmapGrid(summaries, entries, filterMode, selectedHabitId, startDate, endDate) {
  // A heatmap usually shows columns of weeks, 7 rows per column (Mon - Sun).
  // First, we create an array of all dates from startDate to endDate.
  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Pre-process scores into a map for fast lookup
  const scoreMap = new Map();
  if (filterMode === 'overall') {
    summaries.forEach(s => {
      scoreMap.set(s.id, {
          score: s.overallScore,
          meta: s
      });
    });
  } else {
    // Per-habit filter
    entries.forEach(e => {
      if (e.habitId === selectedHabitId) {
        scoreMap.set(e.entryDate, {
            score: e.computedScore,
            meta: e
        });
      }
    });
  }

  // We need to pad the front so the first column starts on the right day of the week
  // JS getDay() is 0 for Sun, 1 for Mon. Let's make 0 = Mon, 6 = Sun
  const firstDay = dates[0];
  const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
  
  const paddedDates = Array(dayOfWeek).fill(null).concat(dates);
  
  // Format the output grid
  const gridCells = paddedDates.map(date => {
    if (!date) return { isPad: true };
    
    const dateStr = date.toISOString().split('T')[0];
    const data = scoreMap.get(dateStr);
    const score = data?.score !== undefined && data?.score !== null ? data.score : null;
    
    // Bucket into 5 bands (perf-1 to perf-5)
    let perfBand = 0;
    if (score !== null) {
      if (score === 0) perfBand = 0;
      else if (score <= 20) perfBand = 1;
      else if (score <= 40) perfBand = 2;
      else if (score <= 60) perfBand = 3;
      else if (score <= 80) perfBand = 4;
      else perfBand = 5;
    }
    
    return {
      isPad: false,
      date: dateStr,
      score: score,
      perfBand: perfBand,
      meta: data?.meta
    };
  });
  
  return gridCells;
}

export function computeHabitBreakdown(habits, entries, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  
  const breakdown = habits.map(habit => {
    // exclude subjective entirely from analytics if requested, or just show them with 0% avg
    // but requirement says "average computedScore"
    
    let sum = 0;
    let count = 0;
    let max = -1;
    let min = 101;
    let daysWithEntry = 0;
    
    entries.forEach(e => {
      if (e.habitId === habit.id && e.entryDate >= startDate && e.entryDate <= endDate) {
        if (e.computedScore !== undefined && e.computedScore !== null) {
          sum += e.computedScore;
          count++;
          if (e.computedScore > max) max = e.computedScore;
          if (e.computedScore < min) min = e.computedScore;
        }
        daysWithEntry++;
      }
    });
    
    const avgScore = count > 0 ? sum / count : 0;
    const consistency = Math.round((daysWithEntry / totalDays) * 100) || 0;
    
    return {
      ...habit,
      avgScore,
      consistency,
      bestScore: max === -1 ? null : max,
      lowestScore: min === 101 ? null : min
    };
  });
  
  // Exclude purely subjective habits from ranking if desired, 
  // but we want to show them in the breakdown so users can see their entries.
  return breakdown.sort((a, b) => b.consistency - a.consistency);
}

export function identifyAreasToImprove(breakdown) {
  // surface bottom 2-3 where average < 70
  const needsImprovement = breakdown.filter(h => h.avgScore < 70);
  return needsImprovement.slice(0, 3);
}

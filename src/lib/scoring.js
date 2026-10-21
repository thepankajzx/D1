export function isNightHabit(habit) {
  if (!habit) return false;
  const id = (habit.id || '').toLowerCase();
  const name = (habit.name || '').toLowerCase();
  const category = (habit.category || '').toLowerCase();
  return (
    id === 'sleep' ||
    id.includes('sleep') ||
    id.includes('bed') ||
    id.includes('night') ||
    category === 'night' ||
    category === 'evening' ||
    (name.includes('sleep') && !name.includes('duration')) ||
    name.includes('bedtime') ||
    name.includes('soye') ||
    name.includes('sona') ||
    name.includes('night')
  );
}

export function normalizeNightTime(minutes) {
  if (minutes === null || minutes === undefined || isNaN(Number(minutes))) return minutes;
  const num = Number(minutes);
  if (num < 12 * 60) {
    return num + 1440;
  }
  return num;
}

export function calculateScore(scoringType, direction, rawValue, target100, target0) {
  if (scoringType === "binary" || scoringType === "yn") {
    if (rawValue === null || rawValue === undefined) return null;
    const num = Number(rawValue);
    if (direction === "lower_is_better") {
      return num === 0 ? 100 : 0;
    }
    return num === 1 ? 100 : 0;
  }
  if (scoringType === "subjective") return null;
  if (rawValue === null || rawValue === undefined) return null;

  let val = Number(rawValue);
  let t100 = Number(target100);
  let t0 = Number(target0);

  if (isNaN(val) || isNaN(t100) || isNaN(t0)) return null;

  const lowerIsBetter = direction === "lower_is_better";

  if (lowerIsBetter) {
    if (t100 === t0) return val <= t100 ? 100 : 0;
    if (val <= t100) return 100;
    if (val >= t0) return 0;
    return 100 * (t0 - val) / (t0 - t100);
  } else {
    if (t100 === t0) return val >= t100 ? 100 : 0;
    if (val >= t100) return 100;
    if (val <= t0) return 0;
    return 100 * (val - t0) / (t100 - t0);
  }
}

export function calculateDailySummary(habits, entries, priorityModeEnabled) {
  let scoredHabitsTotal = 0;
  let scoreSum = 0;
  let highestScore = -1;
  let bestHabitId = null;
  let lowestScore = 101;
  let weakestHabitId = null;
  
  let habitsCompleted = 0;
  let habitsTotal = habits.length;

  for (const habit of habits) {
    const entry = entries.find(e => e.habitId === habit.id);
    const score = entry?.computedScore;
    
    // Check if habit is recorded (for the data coverage counter)
    // A habit is considered "recorded" if an entry exists, even if the score is 0.
    if (entry) {
        habitsCompleted++;
    }

    if (habit.scoringType === 'subjective' || score == null) {
      continue;
    }

    // Weighting logic if Priority Mode is enabled
    // Rank 1: 3x, Rank 2: 2x, Rank 3: 1.5x, Normal: 1x
    let weight = 1;
    if (priorityModeEnabled && habit.priorityRank) {
      if (habit.priorityRank === 1) weight = 3;
      else if (habit.priorityRank === 2) weight = 2;
      else if (habit.priorityRank === 3) weight = 1.5;
    }
    
    scoreSum += score * weight;
    scoredHabitsTotal += weight;

    if (score > highestScore) {
      highestScore = score;
      bestHabitId = habit.id;
    }
    if (score < lowestScore) {
      lowestScore = score;
      weakestHabitId = habit.id;
    }
  }

  const overallScore = scoredHabitsTotal > 0 ? Math.round(scoreSum / scoredHabitsTotal) : null;

  return {
    overallScore,
    habitsCompleted,
    habitsTotal,
    bestHabitId,
    bestHabitScore: highestScore === -1 ? null : highestScore,
    weakestHabitId,
    weakestHabitScore: lowestScore === 101 ? null : lowestScore,
  };
}

export function recalculateStreaks(dailySummaries) {
  // dailySummaries is assumed to be an array of documents ordered by date descending
  // format: [{ id: 'YYYY-MM-DD', overallScore: number }, ...]
  
  const todayStr = new Date().toISOString().split('T')[0];
  let currentStreak = 0;
  let longestStreak = 0;
  
  // Create a map for O(1) lookups by date
  const summaryMap = new Map();
  for (const sum of dailySummaries) {
      summaryMap.set(sum.id, sum);
      
      // Calculate longest streak historically in the loaded data while we're at it
      // This is a naive historical calculation for longest streak from the provided data segment
  }
  
  // Calculate Current Streak
  let checkDate = new Date();
  
  // If today has no summary yet, we might still have a streak ending yesterday.
  const todaySummary = summaryMap.get(todayStr);
  const todayIsSuccessful = todaySummary && todaySummary.overallScore !== null && Number(todaySummary.overallScore) >= 60;
  const todayIsFailed = todaySummary && todaySummary.overallScore !== null && Number(todaySummary.overallScore) < 60;

  if (todayIsSuccessful) {
      currentStreak++;
  }
  
  checkDate.setDate(checkDate.getDate() - 1);
  // If today was logged but score < 60, streak is broken today
  let streakActive = !todayIsFailed;
  
  while(streakActive) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const summary = summaryMap.get(dateStr);
      
      if (summary && summary.overallScore !== null && Number(summary.overallScore) >= 60) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
      } else {
          streakActive = false;
      }
  }

  // Calculate Longest Streak from the historical data
  let tempLongest = 0;
  let currentHistoricalStreak = 0;
  
  // sort ascending to calculate longest streak
  const sortedSummaries = [...dailySummaries].sort((a,b) => a.id.localeCompare(b.id));
  
  let previousDate = null;
  
  for (const sum of sortedSummaries) {
      if (sum && sum.overallScore !== null && Number(sum.overallScore) >= 60) {
          if (!previousDate) {
              currentHistoricalStreak = 1;
          } else {
              const diffTime = Math.abs(new Date(sum.id) - previousDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (diffDays === 1) {
                  currentHistoricalStreak++;
              } else {
                  currentHistoricalStreak = 1;
              }
          }
          if (currentHistoricalStreak > tempLongest) {
              tempLongest = currentHistoricalStreak;
          }
      } else {
          currentHistoricalStreak = 0;
      }
      previousDate = new Date(sum.id);
  }
  
  // Longest streak could also be the current streak if they just broke the record
  longestStreak = Math.max(tempLongest, currentStreak);

  return { currentStreak, longestStreak };
}

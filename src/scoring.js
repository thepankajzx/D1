/**
 * Converts a time string "HH:MM" to minutes from midnight.
 */
export function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Calculates score for Wake Up Time (Max 15)
 */
export function calcWakeScore(actualTimeStr, targetTimeStr) {
    const actual = timeToMinutes(actualTimeStr);
    const target = timeToMinutes(targetTimeStr);
    
    // Handle overnight wraps if needed, though usually wake is morning
    const delay = actual - target;

    if (delay <= 0) return 15;
    if (delay <= 60) {
        return 15 - (7.5 * (delay / 60));
    }
    if (delay <= 90) {
        return 7.5 - (7.5 * ((delay - 60) / 30));
    }
    return 0;
}

/**
 * Calculates score for Sleep Time (Max 10)
 */
export function calcSleepScore(actualTimeStr, targetTimeStr) {
    let actual = timeToMinutes(actualTimeStr);
    let target = timeToMinutes(targetTimeStr);
    
    // Sleep time often wraps past midnight (e.g., target 23:30, actual 00:30)
    // If actual is small (e.g. < 12:00) and target is large (e.g. > 18:00), add 24h to actual
    if (actual < 12 * 60 && target > 18 * 60) {
        actual += 24 * 60;
    }
    // If actual is large and target is small, it means you slept early before midnight target which is fine
    if (target < 12 * 60 && actual > 18 * 60) {
        target += 24 * 60;
    }

    const delay = actual - target;

    if (delay <= 0) return 10;
    if (delay <= 60) {
        return 10 - (5 * (delay / 60));
    }
    if (delay <= 90) {
        return 5 - (5 * ((delay - 60) / 30));
    }
    return 0;
}

/**
 * Calculates scores for all activities based on inputs and targets
 */
export function calculateScores(inputs, targets) {
    const wakeScore = calcWakeScore(inputs.wake, targets.wakeTarget);
    const sleepScore = calcSleepScore(inputs.sleep, targets.sleepTarget);
    
    const pornScore = (inputs.porn === 'No') ? 20 : 0;
    const masturbationScore = (inputs.masturbation === 'No') ? 10 : 0;
    const workoutScore = (inputs.workout === 'Yes') ? 10 : 0;
    
    // Study (Max 20)
    let studyScore = 20;
    if (inputs.studyMins < targets.studyTargetMins) {
        studyScore = (inputs.studyMins / targets.studyTargetMins) * 20;
    }

    // Music + Phone (Max 15)
    let musicScore = 15;
    if (inputs.musicMins <= targets.musicMaxMins) {
        musicScore = 15;
    } else if (inputs.musicMins < (targets.musicMaxMins * 2)) {
        const excess = inputs.musicMins - targets.musicMaxMins;
        musicScore = 15 - (15 * (excess / targets.musicMaxMins));
    } else {
        musicScore = 0;
    }

    // Rounding to 1 decimal place to keep it clean
    const round = (val) => Math.round(val * 10) / 10;

    const scores = {
        wakeScore: round(wakeScore),
        sleepScore: round(sleepScore),
        pornScore: round(pornScore),
        masturbationScore: round(masturbationScore),
        studyScore: round(studyScore),
        workoutScore: round(workoutScore),
        musicScore: round(musicScore)
    };

    scores.overallScore = round(
        scores.wakeScore + 
        scores.sleepScore + 
        scores.pornScore + 
        scores.masturbationScore + 
        scores.studyScore + 
        scores.workoutScore + 
        scores.musicScore
    );

    return scores;
}

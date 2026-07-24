export function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

export function calcWakeScore(actualTimeStr) {
    if (!actualTimeStr) return 0;
    const actual = timeToMinutes(actualTimeStr);
    const target = timeToMinutes("08:00");
    const delay = actual - target;

    if (delay <= 0) return 15;
    if (delay >= 1 && delay <= 30) return 12;
    if (delay >= 31 && delay <= 60) return 8;
    if (delay >= 61 && delay <= 90) return 4;
    return 0;
}

export function calcSleepScore(actualTimeStr) {
    if (!actualTimeStr) return 0;
    let actual = timeToMinutes(actualTimeStr);
    const target = timeToMinutes("23:30");
    
    if (actual < 12 * 60) {
        actual += 24 * 60;
    }
    
    const delay = actual - target;

    if (delay <= 0) return 10;
    if (delay >= 1 && delay <= 30) return 7;
    if (delay >= 31 && delay <= 60) return 4;
    return 0;
}

export function calculateScores(inputs, targets) {
    const wakeScore = calcWakeScore(inputs.wake);
    const sleepScore = calcSleepScore(inputs.sleep);
    
    const pornScore = (inputs.porn === 'No') ? 20 : 0;
    const masturbationScore = (inputs.masturbation === 'No') ? 10 : 0;
    
    let workoutScore = 0;
    if (inputs.workout !== undefined) {
        workoutScore = (inputs.workout === 'Yes') ? 10 : 0;
    } else {
        workoutScore = Math.min(((inputs.workoutMins || 0) / 30) * 10, 10);
    }
    
    const studyScore = Math.min(((inputs.studyMins || 0) / 240) * 20, 20);

    let musicScore = 0;
    const musicMins = inputs.musicMins || 0;
    if (musicMins >= 60) {
        musicScore = 0;
    } else {
        musicScore = ((60 - musicMins) / 60) * 15;
    }

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

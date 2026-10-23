// engine_v2.js - Math Engine for CoreX Analytics

/**
 * 🌟 MATHEMATICAL CONSTANTS & GATES
 */
const MIN_N = 5; // Hard gate for Likely/Consistent
const MIN_N_EARLY = 3; // Gate for Early Signal
const EFFECT_SIZE_HURDLE = 0.5; // Minimum abs delta required for Consistent (points)

// t-critical values approximation for Welch's (two-tailed, 95% confidence)
// Since n is small (5-10), we use a lookup instead of flat 2.0
// df roughly = min(n1, n2) - 1. We map df to t-crit:
const T_CRIT_LOOKUP = {
  1: 12.71, 2: 4.30, 3: 3.18, 4: 2.78, 5: 2.57,
  6: 2.45, 7: 2.36, 8: 2.31, 9: 2.26, 10: 2.23,
  15: 2.13, 20: 2.09, 30: 2.04
};
function getTCrit(df) {
  if (df <= 1) return 12.71;
  if (df >= 30) return 2.04; // large sample approx
  const keys = Object.keys(T_CRIT_LOOKUP).map(Number).sort((a,b)=>a-b);
  let best = 1;
  for (const k of keys) {
    if (df >= k) best = k;
    else break;
  }
  return T_CRIT_LOOKUP[best];
}

/**
 * 🌟 STATISTICAL UTILITIES
 */
function calcMean(arr) {
  if (!arr || !arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calcVariance(arr, mean) {
  if (!arr || arr.length <= 1) return 0;
  const sqDiffs = arr.map(val => Math.pow(val - mean, 2));
  return calcMean(sqDiffs) * (arr.length / (arr.length - 1)); // Sample variance
}

function calcMedian(arr) {
  if (!arr || !arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function calcDynamicTimeAnchor(timesInMins) {
  if (!timesInMins || !timesInMins.length) return 60 * 18; // Default 6 PM
  const median = calcMedian(timesInMins);
  let anchor = median - (12 * 60);
  if (anchor < 0) anchor += 24 * 60;
  return anchor;
}

function linearizeTime(minutes, anchor) {
  // Map time to a continuous linear scale based on the anchor
  let linear = minutes - anchor;
  if (linear < 0) linear += 24 * 60;
  return linear;
}

/**
 * 🌟 DATA NORMALIZATION (D-1 Lag, Null mapping)
 */
export function normalizeLogsV2(config, logs = []) {
  if (!logs || !logs.length) return [];
  
  // Cutover check: if the schema config defines a cutoverDate, ignore logs before it
  const cutoverDate = config?.cutoverDate ? new Date(config.cutoverDate).getTime() : 0;
  
  const outcomeKey = config?.outcome?.key || 'outcome';
  // Check default lag. If true, map D evening inputs to D+1 morning score
  const defaultLagDays = config?.lagDays !== undefined ? config.lagDays : 0;
  
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    const logTime = new Date(log.date).getTime();
    if (logTime < cutoverDate) continue; // Skip legacy data

    let outcomeScore = log.outcome !== undefined && log.outcome !== null ? Number(log.outcome) : Number(log[outcomeKey]);
    
    // Determine the date to pull factors from. If lagDays = 1, we pull yesterday's factors for today's score
    let targetFactors = log.factors || {};
    if (defaultLagDays > 0 && i > 0) {
      // Find D-lagDays
      const currentD = new Date(log.date);
      currentD.setDate(currentD.getDate() - defaultLagDays);
      const targetDateStr = currentD.toISOString().split('T')[0];
      const prevLog = sorted.find(l => l.date === targetDateStr);
      if (prevLog) {
        targetFactors = prevLog.factors || {};
      } else {
        // If there's no log for the lag day, we have no properties to attribute to today's score.
        targetFactors = {}; 
      }
    }

    if (isNaN(outcomeScore) || outcomeScore === null) continue;

    result.push({
      date: log.date,
      outcomeScore,
      factors: targetFactors, // These are the correctly lagged properties
    });
  }
  return result;
}

/**
 * 🌟 WELCH'S STATISTICAL ENGINE
 * Computes Delta, Standard Error, Tiers, Opportunity, and Shrinkage
 */
export function computeWelchStats(groupA, groupB, presenceRate) {
  const nA = groupA.length;
  const nB = groupB.length;
  const nMin = Math.min(nA, nB);
  
  if (nMin < MIN_N_EARLY) {
    return { available: false, reason: 'collecting_data', nA, nB };
  }

  const meanA = calcMean(groupA);
  const meanB = calcMean(groupB);
  const delta = meanA - meanB; // Group A (Present/Higher) - Group B (Absent/Lower)

  const varA = calcVariance(groupA, meanA);
  const varB = calcVariance(groupB, meanB);

  // Welch's Standard Error with a floor to prevent SE=0 when SD=0
  let se = Math.sqrt((varA / nA) + (varB / nB));
  if (se < 0.1) se = 0.1; // Hard floor

  // Determine T-Critical based on degrees of freedom ~ nMin - 1
  const df = nMin - 1;
  const tCrit = getTCrit(df);
  
  // Hard gate check
  const isEarly = nMin < MIN_N;
  let tier = 'Unclear';
  
  if (!isEarly) {
    if (Math.abs(delta) >= tCrit * se && Math.abs(delta) >= EFFECT_SIZE_HURDLE) {
      tier = 'Consistent';
    } else if (Math.abs(delta) >= 1.0 * se) {
      tier = 'Likely';
    }
  } else {
    tier = 'Early signal';
  }

  // Shrinkage for ranking (punishes small n coincidences)
  const shrinkageFactor = nMin / (nMin + 5);
  const deltaShrunk = delta * shrinkageFactor;

  // Opportunity (Points leak)
  // If delta < 0 (Destroyer), leak = |delta| * presenceRate
  // If delta > 0 (Supporter), opportunity missed = |delta| * (1 - presenceRate)
  const opportunity = delta < 0 
    ? Math.abs(delta) * presenceRate 
    : Math.abs(delta) * (1 - presenceRate);

  return {
    available: true,
    nA, nB, nMin,
    meanA, meanB,
    delta,
    se,
    tier,
    deltaShrunk,
    opportunity
  };
}

/**
 * 🌟 BINARY (YES/NO/UNSET) PROPERTY ANALYSIS
 */
export function analyzeBinaryProperties(config, normalizedLogs) {
  const factors = (config?.factors || []).filter(f => f.active !== false && f.type !== 'symptom');
  const results = [];

  factors.forEach(factor => {
    const presentScores = [];
    const absentScores = [];

    normalizedLogs.forEach(log => {
      const factorData = log.factors?.[factor.id];
      // Tri-state logic: Unset means null, not No.
      if (!factorData) return; // Unset, ignore.
      
      const isPresent = factorData.had === true;
      const isAbsent = factorData.had === false;

      if (isPresent) presentScores.push(log.outcomeScore);
      else if (isAbsent) absentScores.push(log.outcomeScore);
    });

    const totalValidLogs = presentScores.length + absentScores.length;
    if (totalValidLogs === 0) return;

    const presenceRate = presentScores.length / totalValidLogs;
    const stats = computeWelchStats(presentScores, absentScores, presenceRate);
    
    if (stats.available) {
      results.push({
        id: factor.id,
        name: factor.name,
        icon: factor.icon,
        type: 'boolean',
        isPrivate: factor.isPrivate || false,
        stats
      });
    }
  });

  return results;
}

/**
 * 🌟 MASTER ENTRYPOINT
 */
export function runCoreXEngineV2(config, rawLogs = []) {
  const normalizedLogs = normalizeLogsV2(config, rawLogs);
  
  // For now, let's just analyze Binary Properties to build the base
  const binaryResults = analyzeBinaryProperties(config, normalizedLogs);
  
  // Sort by deltaShrunk magnitude (opportunity sort)
  const supportersAndDestroyers = binaryResults.sort((a, b) => 
    Math.abs(b.stats.deltaShrunk) - Math.abs(a.stats.deltaShrunk)
  );

  return {
    engineVersion: '2.0',
    totalDays: normalizedLogs.length,
    supportersAndDestroyers
  };
}

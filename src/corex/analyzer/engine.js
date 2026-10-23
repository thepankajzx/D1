import { ANALYZER_CONFIG } from '../config/constants';

function calcMean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calcStdDev(arr, mean) {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function runAnalyzer(config, logs) {
  const insights = [];
  const mappedLogs = [];

  // Pair factors with outcomes (handle next_day logic)
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    let outcomeVal = log.outcome;

    if (config.outcome.timing === 'next_day') {
      const tomorrow = new Date(log.date);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tmrStr = tomorrow.toISOString().split('T')[0];
      const tmrLog = logs.find(l => l.date === tmrStr);
      if (tmrLog && tmrLog.outcome !== undefined && tmrLog.outcome !== null) {
        outcomeVal = tmrLog.outcome;
      } else {
        continue; // Skip if tomorrow's outcome is missing
      }
    }

    if (outcomeVal === undefined || outcomeVal === null) continue;

    // If higher is NOT better, we flip it so delta math works universally (positive delta = good)
    const normalizedOutcome = config.outcome.higherIsBetter ? outcomeVal : -outcomeVal;
    
    mappedLogs.push({ ...log, outcomeVal, normalizedOutcome });
  }

  if (mappedLogs.length < ANALYZER_CONFIG.MIN_DAYS_REQUIRED) {
    return { error: 'not_enough_data', days: mappedLogs.length, insights: [] };
  }

  // 1. Analyze Factors (Yes/No Gates)
  config.factors.forEach(factor => {
    if (!factor.active) return;
    
    const withFactor = mappedLogs.filter(l => l.factors && l.factors[factor.id] && l.factors[factor.id].had === true);
    const withoutFactor = mappedLogs.filter(l => l.factors && (!l.factors[factor.id] || l.factors[factor.id].had === false));

    // Require min 5 days in each bucket
    if (withFactor.length >= 5 && withoutFactor.length >= 5) {
      const withOutcomes = withFactor.map(l => l.normalizedOutcome);
      const withoutOutcomes = withoutFactor.map(l => l.normalizedOutcome);
      
      const meanWith = calcMean(withOutcomes);
      const meanWithout = calcMean(withoutOutcomes);
      const sdWith = calcStdDev(withOutcomes, meanWith);
      const sdWithout = calcStdDev(withoutOutcomes, meanWithout);
      
      // Pooled Standard Deviation
      const pooledSD = Math.sqrt(
        ((withOutcomes.length - 1) * Math.pow(sdWith, 2) + (withoutOutcomes.length - 1) * Math.pow(sdWithout, 2)) 
        / (withOutcomes.length + withoutOutcomes.length - 2)
      );
      
      const delta = meanWith - meanWithout;
      const effectSize = pooledSD === 0 ? 0 : delta / pooledSD;

      const outcomeRange = (config.outcome.max || 10) - (config.outcome.min || 0);
      const isSignificant = Math.abs(delta) >= (outcomeRange * ANALYZER_CONFIG.DELTA_THRESHOLD_PERCENT) 
                            && Math.abs(effectSize) >= ANALYZER_CONFIG.EFFECT_SIZE_THRESHOLD;

      let verdict = 'neutral';
      if (isSignificant) {
        verdict = delta > 0 ? 'helps' : 'hurts';
      }

      insights.push({
        type: 'factor_gate',
        factorId: factor.id,
        factorName: factor.name,
        factorIcon: factor.icon,
        verdict,
        effectSize,
        // Unflip values for UI readability
        delta: config.outcome.higherIsBetter ? delta : -delta,
        meanWith: config.outcome.higherIsBetter ? meanWith : -meanWith,
        meanWithout: config.outcome.higherIsBetter ? meanWithout : -meanWithout,
        daysWith: withFactor.length,
        daysWithout: withoutFactor.length
      });
    }

    // Phase 2: We can add property-level logic (e.g., Number median split, Time buckets) here in the future
  });

  // Sort by strength of effect
  insights.sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));

  return {
    insights,
    days: mappedLogs.length,
    confidence: mappedLogs.length >= ANALYZER_CONFIG.RELIABLE_MIN ? 'reliable' 
              : (mappedLogs.length >= ANALYZER_CONFIG.EARLY_SIGNAL_MAX + 1 ? 'building' : 'early_signal')
  };
}

export const runDeepDiveAnalytics = runAnalyzer;

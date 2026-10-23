/**
 * CoreX Analytics Engine V3
 * Computes factor + property level correlations for visual analytics.
 * Rules:
 *  - true = YES (did it), false = NO (didn't do it), null/undefined = UNSET (ignore)
 *  - Shrinkage factor n/(n+5) to penalise small samples
 *  - Welch's SE for tier badges
 *  - Properties analysed only on YES days for the parent factor
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function parseTimeMinutes(t) {
  if (!t || !t.includes(':')) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function fmtMins(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function welchSE(a, b) {
  if (!a.length || !b.length) return 1;
  const nA = a.length, nB = b.length;
  const mA = mean(a), mB = mean(b);
  const vA = nA > 1 ? a.reduce((s, v) => s + (v - mA) ** 2, 0) / (nA - 1) : 0.5;
  const vB = nB > 1 ? b.reduce((s, v) => s + (v - mB) ** 2, 0) / (nB - 1) : 0.5;
  return Math.max(0.05, Math.sqrt(vA / nA + vB / nB));
}

function tierLabel(delta, se, nMin) {
  if (nMin < 2) return 'Collecting';
  if (nMin < 4) return 'Early Signal';
  const tCrit = nMin >= 20 ? 1.96 : nMin >= 10 ? 2.1 : 2.5;
  if (Math.abs(delta) >= tCrit * se && Math.abs(delta) >= 0.5) return 'Consistent ✓';
  if (Math.abs(delta) >= 1.0 * se) return 'Likely';
  return 'Unclear';
}

function round1(v) { return Math.round(v * 10) / 10; }

// ─── Factor Analysis (boolean: YES vs NO) ─────────────────────────────────────

function analyzeBoolean(factorId, logs, outcomeKey) {
  const yesScores = [], noScores = [];
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach(log => {
    const fData = log.factors?.[factorId];
    const score = log[outcomeKey];
    if (score == null || fData == null) return;
    if (fData.had === true)  yesScores.push(Number(score));
    if (fData.had === false) noScores.push(Number(score));
  });

  const yesAvg = mean(yesScores);
  const noAvg  = mean(noScores);
  const delta   = (yesScores.length && noScores.length) ? yesAvg - noAvg : 0;
  const se      = welchSE(yesScores, noScores);
  const nMin    = Math.min(yesScores.length, noScores.length);
  const shrink  = nMin / (nMin + 5);

  // Last 14 days timeline
  const timeline = sorted.slice(-14).map(log => ({
    date: log.date,
    score: log[outcomeKey],
    had: log.factors?.[factorId]?.had ?? null
  }));

  return {
    yesCount:    yesScores.length,
    noCount:     noScores.length,
    yesAvg:      round1(yesAvg),
    noAvg:       round1(noAvg),
    delta:       round1(delta),
    deltaShrunk: round1(delta * shrink),
    tier:        tierLabel(delta, se, nMin),
    nMin,
    presencePct: yesScores.length
      ? Math.round(yesScores.length / (yesScores.length + noScores.length) * 100)
      : 0,
    timeline
  };
}

// ─── Property Analysis ────────────────────────────────────────────────────────

/** Number / rating: bucketed into Low / Mid / High */
function analyzeNumericProp(propId, factorId, logs, outcomeKey, unit = '') {
  const data = [];
  logs.forEach(log => {
    const fData = log.factors?.[factorId];
    if (fData?.had !== true) return;
    const val = fData[propId];
    const score = log[outcomeKey];
    if (val == null || score == null) return;
    data.push({ val: Number(val), score: Number(score) });
  });
  if (data.length < 4) return null;

  data.sort((a, b) => a.val - b.val);
  const third = Math.max(1, Math.floor(data.length / 3));

  const groups = [
    data.slice(0, third),
    data.slice(third, third * 2),
    data.slice(third * 2)
  ].filter(g => g.length > 0);

  const buckets = groups.map((g, i) => {
    const vals = g.map(d => d.val);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const label = i === 0 ? `Low (${lo}${lo !== hi ? `–${hi}` : ''} ${unit})`
                : i === 1 ? `Mid (${lo}${lo !== hi ? `–${hi}` : ''} ${unit})`
                           : `High (${lo}+ ${unit})`;
    return { label, avg: round1(mean(g.map(d => d.score))), count: g.length, rawVals: vals };
  });

  return {
    type: 'number',
    unit,
    buckets,
    allPoints: data.map(d => ({ x: d.val, y: d.score }))
  };
}

/** Time: split into Before / After a median cut */
function analyzeTimeProp(propId, factorId, logs, outcomeKey) {
  const data = [];
  logs.forEach(log => {
    const fData = log.factors?.[factorId];
    if (fData?.had !== true) return;
    const t = fData[propId];
    const score = log[outcomeKey];
    if (!t || score == null) return;
    const mins = parseTimeMinutes(t);
    if (mins == null) return;
    data.push({ mins, score: Number(score), label: t });
  });
  if (data.length < 4) return null;

  data.sort((a, b) => a.mins - b.mins);
  const cutMins = data[Math.floor(data.length / 2)].mins;

  const early = data.filter(d => d.mins <= cutMins);
  const late  = data.filter(d => d.mins > cutMins);

  return {
    type: 'time',
    cutoff: fmtMins(cutMins),
    cutoffMins: cutMins,
    slots: [
      { label: `Before ${fmtMins(cutMins)}`, avg: round1(mean(early.map(d => d.score))), count: early.length },
      { label: `After ${fmtMins(cutMins)}`,  avg: round1(mean(late.map(d => d.score))),  count: late.length }
    ].filter(s => s.count > 0),
    allPoints: data.map(d => ({ x: d.mins, y: d.score, label: d.label })),
    earlyMins: cutMins // for scatter split colour
  };
}

/** Text / custom: group by value */
function analyzeTextProp(propId, factorId, logs, outcomeKey) {
  const groups = {};
  logs.forEach(log => {
    const fData = log.factors?.[factorId];
    if (fData?.had !== true) return;
    const val = fData[propId];
    const score = log[outcomeKey];
    if (!val || score == null) return;
    if (!groups[val]) groups[val] = [];
    groups[val].push(Number(score));
  });

  const breakdown = Object.entries(groups)
    .map(([label, scores]) => ({ label, avg: round1(mean(scores)), count: scores.length }))
    .filter(b => b.count >= 2)
    .sort((a, b) => b.avg - a.avg);

  if (breakdown.length < 2) return null;
  return { type: 'text', breakdown };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function runCoreXEngineV3(config, logs = []) {
  if (!config || !Array.isArray(logs) || logs.length === 0) {
    return { totalDays: 0, factors: [], summary: { best: [], worst: [] } };
  }

  const outcomeKey = config.outcome?.key || 'outcome';

  const factors = (config.factors || []).map(factor => {
    const boolAnalysis = analyzeBoolean(factor.id, logs, outcomeKey);

    const properties = (factor.properties || []).map(prop => {
      let propAnalysis = null;
      switch (prop.type) {
        case 'number':
        case 'rating':
          propAnalysis = analyzeNumericProp(prop.id, factor.id, logs, outcomeKey, prop.unit || '');
          break;
        case 'time':
          propAnalysis = analyzeTimeProp(prop.id, factor.id, logs, outcomeKey);
          break;
        case 'text':
        case 'custom':
          propAnalysis = analyzeTextProp(prop.id, factor.id, logs, outcomeKey);
          break;
        default:
          break;
      }
      return propAnalysis ? { ...prop, analysis: propAnalysis } : null;
    }).filter(Boolean);

    return {
      id: factor.id,
      name: factor.name,
      icon: factor.icon,
      color: factor.color || '#7c3aed',
      analysis: boolAnalysis,
      properties
    };
  });

  // Sort by |deltaShrunk| descending for overview chart
  factors.sort((a, b) => Math.abs(b.analysis.deltaShrunk) - Math.abs(a.analysis.deltaShrunk));

  const withBothGroups = factors.filter(f => f.analysis.yesCount >= 2 && f.analysis.noCount >= 2);
  const best  = withBothGroups.filter(f => f.analysis.delta > 0)
                               .sort((a, b) => b.analysis.delta - a.analysis.delta)
                               .slice(0, 3);
  const worst = withBothGroups.filter(f => f.analysis.delta < 0)
                               .sort((a, b) => a.analysis.delta - b.analysis.delta)
                               .slice(0, 3);

  const outcomeVals = logs.map(l => Number(l[outcomeKey])).filter(v => !isNaN(v));
  const overallAvg  = round1(mean(outcomeVals));

  return { totalDays: logs.length, factors, summary: { best, worst }, overallAvg };
}

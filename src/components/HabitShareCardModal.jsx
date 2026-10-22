import React, { useRef, useState, useMemo } from 'react';
import { 
  X, 
  ShareNetwork, 
  SquaresFour,
  Percent,
  Sparkle
} from '@phosphor-icons/react';
import HabitIcon from './HabitIcon';
import { calculateRecoveryScore } from '../lib/recoveryAnalytics';

// 10-Tier Performance Color Map for Heatmap
export function getHeatmapColor(score) {
  if (score === null || score === undefined) {
    return { bg: '#f1f5f9', text: '#94a3b8', border: '#e2e8f0', hex: '#f1f5f9', isDarkText: true };
  }
  if (score <= 10) return { bg: '#ef4444', text: '#ffffff', border: '#dc2626', hex: '#ef4444', isDarkText: false };
  if (score <= 20) return { bg: '#f87171', text: '#ffffff', border: '#ef4444', hex: '#f87171', isDarkText: false };
  if (score <= 30) return { bg: '#fb923c', text: '#ffffff', border: '#f97316', hex: '#fb923c', isDarkText: false };
  if (score <= 40) return { bg: '#f59e0b', text: '#ffffff', border: '#d97706', hex: '#f59e0b', isDarkText: false };
  if (score <= 50) return { bg: '#eab308', text: '#0f172a', border: '#ca8a04', hex: '#eab308', isDarkText: true };
  if (score <= 60) return { bg: '#a3e635', text: '#0f172a', border: '#84cc16', hex: '#a3e635', isDarkText: true };
  if (score <= 70) return { bg: '#4ade80', text: '#0f172a', border: '#22c55e', hex: '#4ade80', isDarkText: true };
  if (score <= 80) return { bg: '#22c55e', text: '#ffffff', border: '#16a34a', hex: '#22c55e', isDarkText: false };
  if (score <= 90) return { bg: '#16a34a', text: '#ffffff', border: '#15803d', hex: '#16a34a', isDarkText: false };
  return { bg: '#10b981', text: '#ffffff', border: '#059669', hex: '#10b981', isDarkText: false };
}

export default function HabitShareCardModal({
  isOpen,
  onClose,
  habit,
  selectedHabitId,
  dateSeries,
  summaryMap,
  allSummaries,
  streakTrackingEnabled = true,
  rangeOption = '30',
  isHinglish = false
}) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPercentages, setShowPercentages] = useState(true);

  // Derive Habit metadata
  const isOverall = selectedHabitId === 'all' || !habit || habit.id === 'all';
  const habitName = isOverall ? (isHinglish ? 'ओवरऑल परफ़ॉर्मेंस' : 'Overall Performance') : habit.name;
  const habitColor = isOverall ? '#10b981' : (habit?.color || '#3b82f6');
  const habitIcon = isOverall ? 'sparkle' : (habit?.icon || 'star');

  // Cap at maximum 30 days for clean, readable sharing
  const effectiveDateSeries = useMemo(() => {
    if (!dateSeries || dateSeries.length === 0) return [];
    return dateSeries.slice(-30);
  }, [dateSeries]);

  // Compute stats across effectiveDateSeries
  const stats = useMemo(() => {
    if (!effectiveDateSeries || effectiveDateSeries.length === 0) {
      return { 
        avgScore: 0, 
        loggedDays: 0, 
        completedDays: 0, 
        totalDays: 0, 
        streak: 0, 
        resilience: 0, 
        scores: [],
        bestStreak: 0,
        consistencyRate: 0,
        maxScore: 0,
        minScore: 0,
        dateRangeLabel: ''
      };
    }

    const scores = [];
    let loggedCount = 0;
    let completedCount = 0;

    effectiveDateSeries.forEach(dStr => {
      const sum = summaryMap.get(dStr);
      let s = null;
      let hasData = false;

      if (isOverall) {
        if (sum && sum.overallScore !== undefined && sum.overallScore !== null) {
          s = sum.overallScore;
          hasData = true;
        }
      } else {
        if (sum && sum.habitScores && sum.habitScores[habit.id] !== undefined && sum.habitScores[habit.id] !== null) {
          s = sum.habitScores[habit.id];
          hasData = true;
        }
      }

      if (hasData) {
        loggedCount++;
        scores.push(s);
        if (s >= 60) completedCount++;
      } else {
        scores.push(null);
      }
    });

    const validScores = scores.filter(s => s !== null);
    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

    const maxScore = validScores.length > 0 ? Math.max(...validScores) : 0;
    const minScore = validScores.length > 0 ? Math.min(...validScores) : 0;
    const consistencyRate = Math.round((completedCount / (effectiveDateSeries.length || 1)) * 100);

    // Resiliency Calculation
    let resilience = 80;
    if (!isOverall && habit?.id) {
      const rec = calculateRecoveryScore(allSummaries, habit.id, 7, 30);
      resilience = rec?.recoveryScore ? Math.round(rec.recoveryScore) : 80;
    } else {
      resilience = avgScore > 0 ? Math.min(100, Math.round(avgScore * 1.05)) : 75;
    }

    // Active Streak & Best Streak within series
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < effectiveDateSeries.length; i++) {
      const s = scores[i];
      if (s !== null && s >= 60) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    for (let i = effectiveDateSeries.length - 1; i >= 0; i--) {
      const s = scores[i];
      if (s !== null && s >= 60) {
        currentStreak++;
      } else if (s !== null) {
        break;
      }
    }

    // Formatted date range: e.g. "17 Aug – 15 Sep / 30 Days"
    const startObj = new Date(effectiveDateSeries[0] + 'T00:00:00');
    const endObj = new Date(effectiveDateSeries[effectiveDateSeries.length - 1] + 'T00:00:00');
    const formatD = (d) => `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
    const dateRangeLabel = `${formatD(startObj)} – ${formatD(endObj)} / ${effectiveDateSeries.length} Days`;

    return {
      avgScore,
      loggedDays: loggedCount,
      completedDays: completedCount,
      totalDays: effectiveDateSeries.length,
      resilience,
      currentStreak,
      bestStreak,
      consistencyRate,
      maxScore,
      minScore,
      dateRangeLabel,
      scores
    };
  }, [effectiveDateSeries, summaryMap, habit, isOverall, allSummaries]);

  if (!isOpen) return null;

  // Render to Canvas for High-Resolution Download / Native Share (White Theme)
  const generateCanvasImage = async () => {
    const W = 1080;
    const H = 1350; // 4:5 Instagram Portrait Ratio
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1. Clean Premium White/Light Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // Subtle ambient color glow at top right
    const orbGrad1 = ctx.createRadialGradient(900, 150, 50, 900, 150, 450);
    orbGrad1.addColorStop(0, habitColor + '18');
    orbGrad1.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad1;
    ctx.fillRect(0, 0, W, H);

    // 2. Main Crisp White Card Container
    const cardX = 50;
    const cardY = 50;
    const cardW = W - 100;
    const cardH = H - 100;
    const cardR = 40;

    // Card shadow
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Card border
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();
    ctx.restore();

    // 3. Top Header: D1 Analyzer & Date Pill
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('D1 Analyzer', cardX + 45, cardY + 75);

    // Date Range Pill
    const dateText = stats.dateRangeLabel;
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const dateMetrics = ctx.measureText(dateText);
    const pillW = dateMetrics.width + 36;
    const pillH = 44;
    const pillX = cardX + cardW - 45 - pillW;
    const pillY = cardY + 45;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 22);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillText(dateText, pillX + 18, pillY + 30);
    ctx.restore();

    // 4. Habit Title & Subtitle
    const titleY = cardY + 175;
    ctx.beginPath();
    ctx.arc(cardX + 62, titleY - 14, 18, 0, Math.PI * 2);
    ctx.fillStyle = habitColor;
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 50px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(habitName, cardX + 96, titleY);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Consistency & Resilience Execution Report', cardX + 45, titleY + 42);

    // 5. 3 Primary KPI Metrics Grid
    const kpiY = titleY + 85;
    const kpiW = (cardW - 90 - 32) / 3;
    const kpiH = 150;

    const kpiData = [
      { label: 'AVERAGE SCORE', val: `${stats.avgScore}%`, color: '#10b981', sub: 'Performance' },
      { label: 'RESILIENCY', val: `${stats.resilience}%`, color: '#6366f1', sub: 'Bounce-back' },
      { 
        label: streakTrackingEnabled ? 'ACTIVE STREAK' : 'COMPLETION', 
        val: streakTrackingEnabled ? `${stats.currentStreak} Days` : `${stats.completedDays}/${stats.totalDays}`, 
        color: '#f59e0b', 
        sub: streakTrackingEnabled ? 'Unbroken Chain' : 'Goal Achieved' 
      }
    ];

    kpiData.forEach((kpi, idx) => {
      const kx = cardX + 45 + idx * (kpiW + 16);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(kx, kpiY, kpiW, kpiH, 22);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(kpi.label, kx + 20, kpiY + 36);

      ctx.fillStyle = kpi.color;
      ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(kpi.val, kx + 20, kpiY + 92);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(kpi.sub, kx + 20, kpiY + 124);
      ctx.restore();
    });

    // 6. Continuous Heatmap Content
    const contentY = kpiY + kpiH + 45;

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('CONTINUOUS EXECUTION HEATMAP', cardX + 45, contentY);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 19px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`${stats.loggedDays} of ${stats.totalDays} Days Logged (${stats.consistencyRate}% Rate)`, cardX + 45, contentY + 30);

    // Balanced Heatmap Grid
    const numCols = Math.min(effectiveDateSeries.length, effectiveDateSeries.length <= 14 ? effectiveDateSeries.length : 10);
    const numRows = Math.ceil(effectiveDateSeries.length / numCols);
    const gridAvailW = cardW - 90;
    const boxGap = 12;
    const boxW = Math.floor((gridAvailW - (numCols - 1) * boxGap) / numCols);
    const boxH = 74; // generous height to fill space beautifully
    const startGridX = cardX + 45;
    const startGridY = contentY + 54;

    effectiveDateSeries.forEach((dStr, i) => {
      const col = i % numCols;
      const row = Math.floor(i / numCols);
      const bx = startGridX + col * (boxW + boxGap);
      const by = startGridY + row * (boxH + boxGap);

      const score = stats.scores[i];
      const tier = getHeatmapColor(score);

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 14);
      ctx.fillStyle = tier.bg;
      ctx.fill();
      ctx.strokeStyle = tier.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Percentage text (NO DATE NUMBER)
      if (showPercentages) {
        ctx.fillStyle = tier.text;
        ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayScore = score !== null && score !== undefined ? `${score}%` : '—';
        ctx.fillText(displayScore, bx + boxW / 2, by + boxH / 2);
      }
      ctx.restore();
    });

    // Bottom Insight Pill Row to perfectly balance the bottom
    const bottomPillY = startGridY + numRows * (boxH + boxGap) + 30;
    const bPillW = (cardW - 90 - 24) / 3;
    const bPillH = 75;

    const bottomStats = [
      { label: 'BEST STREAK', val: `${stats.bestStreak} Days` },
      { label: 'PEAK SCORE', val: `${stats.maxScore}%` },
      { label: 'LOGGED DAYS', val: `${stats.loggedDays}/${stats.totalDays}` }
    ];

    bottomStats.forEach((bs, bIdx) => {
      const bx = cardX + 45 + bIdx * (bPillW + 12);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(bx, bottomPillY, bPillW, bPillH, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bs.label, bx + bPillW / 2, bottomPillY + 28);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(bs.val, bx + bPillW / 2, bottomPillY + 56);
      ctx.restore();
    });

    // 7. Footer Branding & Clean Watermark
    const footerY = cardY + cardH - 45;

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('✦ Driven by Daily Discipline', cardX + 45, footerY);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('d1.thedefinite.one', cardX + cardW - 45, footerY);

    return canvas;
  };

  const handleShareOrDownload = async () => {
    if (navigator.vibrate) navigator.vibrate(30);
    setIsGenerating(true);

    try {
      const canvas = await generateCanvasImage();
      const filename = `D1-${habitName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${stats.totalDays}d.png`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }

        const file = new File([blob], filename, { type: 'image/png' });

        // Try Native OS Web Share API (mobile instagram, whatsapp, etc.)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `${habitName} Performance - D1 Analyzer`,
              text: `Check out my ${stats.totalDays}-day streak on ${habitName}! Tracked on d1.thedefinite.one.`,
              files: [file]
            });
            setIsGenerating(false);
            return;
          } catch (err) {
            console.log('User cancelled share or unsupported:', err);
          }
        }

        // Fallback: Direct Download
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsGenerating(false);
      }, 'image/png');
    } catch (e) {
      console.error('Error generating share card:', e);
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-2xl overflow-hidden text-slate-900 dark:text-white flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header (Always Visible / Non-scrollable) */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-black dark:bg-black text-white flex items-center justify-center shrink-0">
              <ShareNetwork size={15} weight="bold" className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm leading-tight">
                {isHinglish ? 'परफ़ॉर्मेंस कार्ड शेयर करें' : 'Share Performance Card'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                D1 Analyzer • Max 30 Days Heatmap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Heatmap Toolbar: Percentage Toggle Only */}
        <div className="flex items-center justify-between py-1.5 px-1 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <SquaresFour size={14} weight="bold" className="text-slate-800 dark:text-slate-200" />
            <span>Heatmap ({stats.totalDays} Days)</span>
          </div>

          {/* Minimalist Toggle Button: % + Toggle Switch */}
          <button
            type="button"
            onClick={() => setShowPercentages(!showPercentages)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors cursor-pointer select-none"
            title="Toggle percentage numbers"
          >
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">%</span>
            <div className={`w-6 h-3.5 rounded-full transition-colors relative flex items-center p-0.5 ${showPercentages ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${showPercentages ? 'translate-x-2.5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

        {/* Scrollable Live White Theme Card Preview */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-0.5 space-y-2.5">
          <div 
            ref={cardRef}
            className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 relative overflow-hidden text-slate-900 select-none"
          >
            {/* Top Tag & Date Range */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                D1 Analyzer
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                {stats.dateRangeLabel}
              </span>
            </div>

            {/* Habit Name & Icon */}
            <div className="flex items-center gap-2">
              {isOverall ? (
                <div className="w-8 h-8 rounded-lg text-white bg-emerald-500 flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkle size={16} weight="fill" />
                </div>
              ) : (
                <HabitIcon habit={habit} size={32} className="shrink-0 shadow-xs" />
              )}
              <div className="min-w-0">
                <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight truncate">
                  {habitName}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  Consistency &amp; Resilience Report
                </p>
              </div>
            </div>

            {/* 3 Metric Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Avg Score</span>
                <span className="text-sm sm:text-base font-black text-emerald-600 block mt-0.5">{stats.avgScore}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Resiliency</span>
                <span className="text-sm sm:text-base font-black text-indigo-600 block mt-0.5">{stats.resilience}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">
                  {streakTrackingEnabled ? 'Streak' : 'Completed'}
                </span>
                <span className="text-sm sm:text-base font-black text-amber-600 block mt-0.5 truncate">
                  {streakTrackingEnabled ? `${stats.currentStreak}d` : `${stats.completedDays}/${stats.totalDays}`}
                </span>
              </div>
            </div>

            {/* Continuous Execution Heatmap */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span>Continuous Heatmap</span>
                <span className="text-slate-500">{stats.loggedDays}/{stats.totalDays} Logged</span>
              </div>
              <div className="grid grid-cols-10 gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                {effectiveDateSeries.map((dStr, idx) => {
                  const s = stats.scores[idx];
                  const tier = getHeatmapColor(s);
                  const displayScore = showPercentages ? (s !== null && s !== undefined ? `${s}%` : '—') : '';
                  return (
                    <div
                      key={dStr}
                      style={{ backgroundColor: tier.bg, color: tier.text, borderColor: tier.border }}
                      className="h-6 sm:h-7 rounded-md flex items-center justify-center text-[8px] sm:text-[9px] font-black border shadow-2xs transition-transform hover:scale-105"
                      title={`${dStr}: ${s !== null ? s + '%' : 'No Data'}`}
                    >
                      {displayScore}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Extra Stat Badges */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[8.5px] font-bold text-slate-500 block uppercase">Best Streak</span>
                  <span className="text-[11px] font-black text-slate-900 block">{stats.bestStreak} Days</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[8.5px] font-bold text-slate-500 block uppercase">Peak Score</span>
                  <span className="text-[11px] font-black text-slate-900 block">{stats.maxScore}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[8.5px] font-bold text-slate-500 block uppercase">Consistency</span>
                  <span className="text-[11px] font-black text-slate-900 block">{stats.consistencyRate}%</span>
                </div>
              </div>
            </div>

            {/* Footer Watermark */}
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span>✦ Driven by Daily Discipline</span>
              <span className="font-black text-slate-900">d1.thedefinite.one</span>
            </div>
          </div>
        </div>

        {/* Sticky Action Button (Always Visible & Clickable) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleShareOrDownload}
            className="w-full py-2.5 sm:py-3 px-4 bg-black hover:bg-slate-900 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <span>Generating HD Image...</span>
            ) : (
              <>
                <ShareNetwork size={16} weight="bold" className="text-white" />
                <span>{isHinglish ? 'इमेज शेयर या डाउनलोड करें' : 'Share / Download Image'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


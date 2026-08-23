import React, { useRef, useState, useEffect } from 'react';
import Icon from './Icon';

export default function ShareBetterReportModal({ report, onClose }) {
  const canvasRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !report) return;
    drawStoryCard();
  }, [report]);

  const drawStoryCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const { meta, strongestHabit, weakestHabit, improvedHabit, recoveryStory } = report;

    // 1. Dark Luxury Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0a0d18');
    bgGrad.addColorStop(0.3, '#10172b');
    bgGrad.addColorStop(0.7, '#161c32');
    bgGrad.addColorStop(1, '#080a12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Mesh Glow Circles
    const glow1 = ctx.createRadialGradient(width * 0.2, height * 0.2, 20, width * 0.2, height * 0.2, 450);
    glow1.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
    glow1.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.6, 20, width * 0.8, height * 0.6, 500);
    glow2.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
    glow2.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // 3. Top Header Pill
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    roundRect(ctx, 100, 120, 880, 80, 40);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`30-DAY BEHAVIORAL STORY • ${meta.dateRangeLabel.toUpperCase()}`, 540, 160);
    ctx.restore();

    // 4. Main Hero Stat
    ctx.font = '900 120px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${meta.consistencyScore}%`, 540, 360);

    ctx.font = '800 42px Inter, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText(`Overall Consistency • ${meta.consistencyTier} Mastery`, 540, 430);

    ctx.font = '600 30px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Active ${meta.activeDays} of ${meta.requestedWindow} days tracked`, 540, 480);

    // 5. Section 1: Superpower Card (Strongest Habit)
    if (strongestHabit) {
      drawGlassCard(ctx, 100, 560, 880, 240, {
        badge: 'SUPERPOWER HABIT',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
        badgeBorder: 'rgba(52, 211, 153, 0.5)',
        badgeText: '#6ee7b7',
        title: strongestHabit.name,
        subtitle: `${strongestHabit.avgScore}% Avg Score • ${strongestHabit.perfectDays} High-Discipline Days`,
        body: `Your anchor routine. It created positive momentum for all other habits.`
      });
    }

    // 6. Section 2: Biggest Improvement / Challenge Card
    if (improvedHabit) {
      drawGlassCard(ctx, 100, 840, 880, 240, {
        badge: 'BIGGEST LEAP',
        badgeBg: 'rgba(56, 189, 248, 0.2)',
        badgeBorder: 'rgba(56, 189, 248, 0.5)',
        badgeText: '#7dd3fc',
        title: `${improvedHabit.name} (+${improvedHabit.delta}% Surge)`,
        subtitle: `Jumped from ${improvedHabit.firstAvg}% to ${improvedHabit.secondAvg}% in the second half`,
        body: `Fastest compounding growth in your daily tracking.`
      });
    } else if (weakestHabit) {
      drawGlassCard(ctx, 100, 840, 880, 240, {
        badge: 'PRIME OPPORTUNITY',
        badgeBg: 'rgba(251, 146, 60, 0.2)',
        badgeBorder: 'rgba(251, 146, 60, 0.5)',
        badgeText: '#fdba74',
        title: weakestHabit.name,
        subtitle: `${weakestHabit.avgScore}% Avg • Next Target: +25% Lift`,
        body: `Your highest-leverage growth area for the next 30 days.`
      });
    }

    // 7. Section 3: Recovery Story Card
    if (recoveryStory) {
      drawGlassCard(ctx, 100, 1120, 880, 260, {
        badge: `RECOVERY TRAJECTORY • ${recoveryStory.resilienceBadge.toUpperCase()}`,
        badgeBg: 'rgba(168, 85, 247, 0.2)',
        badgeBorder: 'rgba(192, 132, 252, 0.5)',
        badgeText: '#e9d5ff',
        title: recoveryStory.recoveryGrowth >= 0 
          ? `+${recoveryStory.recoveryGrowth}% Resilience Lift` 
          : `${recoveryStory.recoveryGrowth}% Mid-Month Reset`,
        subtitle: `Week 1: ${recoveryStory.weeklyAverages[0]}%  ➔  Week 4: ${recoveryStory.weeklyAverages[3]}%`,
        body: `Demonstrated strong mental bounce-back and consistency rhythm.`
      });
    }

    // 8. 4-Week Mini Trend Dots Bar
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    roundRect(ctx, 100, 1420, 880, 180, 28);
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 28px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText('4-WEEK CONSISTENCY PROGRESSION', 140, 1475);

    // 4 visual progress bars
    const weeks = report.weeklyAverages || [50, 60, 70, 80];
    for (let w = 0; w < 4; w++) {
      const x = 140 + w * 205;
      const val = weeks[w] || 0;
      
      // Bar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      roundRect(ctx, x, 1510, 180, 20, 10);
      ctx.fill();

      // Bar fill
      ctx.fillStyle = w === 3 ? '#34d399' : '#818cf8';
      roundRect(ctx, x, 1510, Math.max(10, (val / 100) * 180), 20, 10);
      ctx.fill();

      ctx.font = '700 24px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText(`W${w + 1}: ${val}%`, x, 1565);
    }
    ctx.restore();

    // 9. Footer Watermark & Hashtags
    ctx.font = '800 32px Inter, sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'left';
    ctx.fillText('#Definetly  #BuildBetterHabits', 100, 1780);

    ctx.font = '700 30px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText('Definite Habit Tracker', 980, 1780);
  };

  const drawGlassCard = (ctx, x, y, w, h, data) => {
    ctx.save();
    // Glass card background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 28);
    ctx.fill();
    ctx.stroke();

    // Badge
    ctx.fillStyle = data.badgeBg;
    ctx.strokeStyle = data.badgeBorder;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x + 35, y + 28, ctx.measureText(data.badge).width + 60, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 22px Inter, sans-serif';
    ctx.fillStyle = data.badgeText;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.badge, x + 55, y + 50);

    // Title
    ctx.font = '900 40px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.title, x + 35, y + 115);

    // Subtitle
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(data.subtitle, x + 35, y + 160);

    // Body
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(data.body, x + 35, y + 205);

    ctx.restore();
  };

  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `My-30-Day-Habit-Story-${Date.now()}.png`;
      link.href = url;
      link.click();
    } catch (e) {
      console.error('Download error:', e);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'my-30-day-habit-story.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My 30-Day Habit Story',
            text: `I achieved ${report?.meta?.consistencyScore}% consistency on Definite Habit Tracker! #Definetly`,
            files: [file]
          });
        } else {
          handleDownload();
        }
      });
    } catch (e) {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 rounded-[28px] max-w-md w-full border border-slate-700 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden p-4 sm:p-6 text-white animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Icon name="share" className="text-[20px]" />
            </div>
            <div>
              <h3 className="font-black text-white text-base tracking-tight">Share Your 30-Day Story</h3>
              <p className="text-xs text-slate-400">High-Res Story Card (1080x1920)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-[17px]" />
          </button>
        </div>

        {/* Canvas Preview Container */}
        <div className="flex-1 overflow-y-auto py-4 flex items-center justify-center custom-scrollbar">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 max-w-[280px] sm:max-w-[320px]">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <Icon name="download" className="text-[16px]" />
            <span>{downloading ? 'Saving...' : 'Download Image'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Icon name="share" className="text-[16px]" />
            <span>Share Story</span>
          </button>
        </div>

      </div>
    </div>
  );
}

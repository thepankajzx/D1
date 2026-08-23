import React, { useRef, useState, useEffect } from 'react';
import Icon from './Icon';

export default function ShareInsightModal({ insight, onClose }) {
  const canvasRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!insight || !canvasRef.current) return;
    drawCard(canvasRef.current, insight);
  }, [insight]);

  const drawCard = (canvas, data) => {
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // Color Theme Resolution based on Archetype
    const colorThemes = {
      emerald: {
        glow: 'rgba(16, 185, 129, 0.25)',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
        badgeBorder: 'rgba(52, 211, 153, 0.6)',
        badgeText: '#6ee7b7',
        subtitle: '#34d399'
      },
      orange: {
        glow: 'rgba(249, 115, 22, 0.25)',
        badgeBg: 'rgba(249, 115, 22, 0.2)',
        badgeBorder: 'rgba(251, 146, 60, 0.6)',
        badgeText: '#fdba74',
        subtitle: '#f97316'
      },
      indigo: {
        glow: 'rgba(99, 102, 241, 0.25)',
        badgeBg: 'rgba(99, 102, 241, 0.2)',
        badgeBorder: 'rgba(129, 140, 248, 0.6)',
        badgeText: '#c7d2fe',
        subtitle: '#818cf8'
      },
      purple: {
        glow: 'rgba(168, 85, 247, 0.25)',
        badgeBg: 'rgba(168, 85, 247, 0.2)',
        badgeBorder: 'rgba(192, 132, 252, 0.6)',
        badgeText: '#e9d5ff',
        subtitle: '#c084fc'
      },
      amber: {
        glow: 'rgba(245, 158, 11, 0.25)',
        badgeBg: 'rgba(245, 158, 11, 0.2)',
        badgeBorder: 'rgba(251, 191, 36, 0.6)',
        badgeText: '#fde68a',
        subtitle: '#fbbf24'
      },
      teal: {
        glow: 'rgba(20, 184, 166, 0.25)',
        badgeBg: 'rgba(20, 184, 166, 0.2)',
        badgeBorder: 'rgba(45, 212, 191, 0.6)',
        badgeText: '#99f6e4',
        subtitle: '#2dd4bf'
      },
      sky: {
        glow: 'rgba(14, 165, 233, 0.25)',
        badgeBg: 'rgba(14, 165, 233, 0.2)',
        badgeBorder: 'rgba(56, 189, 248, 0.6)',
        badgeText: '#7dd3fc',
        subtitle: '#38bdf8'
      },
      violet: {
        glow: 'rgba(139, 92, 246, 0.25)',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
        badgeBorder: 'rgba(167, 139, 250, 0.6)',
        badgeText: '#ddd6fe',
        subtitle: '#a78bfa'
      },
      blue: {
        glow: 'rgba(14, 165, 233, 0.25)',
        badgeBg: 'rgba(14, 165, 233, 0.2)',
        badgeBorder: 'rgba(56, 189, 248, 0.6)',
        badgeText: '#7dd3fc',
        subtitle: '#38bdf8'
      }
    };

    const activeTheme = colorThemes[data.badge?.color] || colorThemes.sky;

    // 1. Dark Luxurious Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0c0f17');
    bgGradient.addColorStop(0.5, '#121826');
    bgGradient.addColorStop(1, '#090b10');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative Glow Spheres
    const glow1 = ctx.createRadialGradient(200, 200, 20, 200, 200, 400);
    glow1.addColorStop(0, activeTheme.glow);
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.beginPath();
    ctx.arc(200, 200, 400, 0, Math.PI * 2);
    ctx.fill();

    const glow2 = ctx.createRadialGradient(880, 880, 20, 880, 880, 350);
    glow2.addColorStop(0, activeTheme.glow);
    glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.beginPath();
    ctx.arc(880, 880, 350, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main Card Container (Glassmorphism rounded rectangle)
    const cardX = 80;
    const cardY = 100;
    const cardW = 920;
    const cardH = 880;
    const radius = 48;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Header: App Logo + Tag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText('DEFINITE', cardX + 60, cardY + 90);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillText('DAILY INSIGHT MIRROR', cardX + 240, cardY + 90);

    // Pill Badge (Dynamic Archetype Color)
    const badgeText = data.badge?.label || 'DAILY INTELLIGENCE';
    ctx.font = 'bold 22px Inter, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 40;
    
    ctx.fillStyle = activeTheme.badgeBg;
    ctx.strokeStyle = activeTheme.badgeBorder;
    ctx.lineWidth = 2;
    roundRect(ctx, cardX + cardW - badgeWidth - 60, cardY + 58, badgeWidth, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = activeTheme.badgeText;
    ctx.fillText(badgeText, cardX + cardW - badgeWidth - 40, cardY + 88);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, cardY + 140);
    ctx.lineTo(cardX + cardW - 60, cardY + 140);
    ctx.stroke();

    // 4. Headline (Multi-line Flow)
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 42px Inter, sans-serif';
    let currentY = cardY + 220;
    currentY = wrapText(ctx, `"${data.headline}"`, cardX + 60, currentY, cardW - 120, 56);

    // 5. Subtitle (Dynamic Flow)
    if (data.subtitle) {
      currentY += 18;
      ctx.fillStyle = activeTheme.subtitle;
      ctx.font = '700 26px Inter, sans-serif';
      currentY = wrapText(ctx, data.subtitle, cardX + 60, currentY, cardW - 120, 36);
    }

    // 6. Body Paragraph (Dynamic Flow)
    if (data.body) {
      currentY += 24;
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 26px Inter, sans-serif';
      wrapText(ctx, data.body, cardX + 60, currentY, cardW - 120, 42);
    }

    // 7. Footer Watermark & Hashtag
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(cardX + 60, cardY + cardH - 120);
    ctx.lineTo(cardX + cardW - 60, cardY + cardH - 120);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillText('#Definetly', cardX + 60, cardY + cardH - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillText('Definite Habit Tracker', cardX + cardW - 350, cardY + cardH - 60);
  };

  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    if (!text) return y;
    const words = text.split(' ');
    let line = '';
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, curY);
    return curY + lineHeight;
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    try {
      const link = document.createElement('a');
      link.download = `Definite_Insight_${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2500);
        } else {
          handleDownload();
        }
      });
    } catch (e) {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#10141f] border border-slate-700/60 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 text-white animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Icon name="auto_awesome" className="text-[18px]" />
            </span>
            <div>
              <h3 className="font-bold text-base text-white">Share Insight Card</h3>
              <p className="text-xs text-slate-400">Share your smart habit mirror with friends</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>

        {/* Canvas Preview */}
        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/40 border border-slate-800 flex items-center justify-center p-1">
          <canvas ref={canvasRef} className="w-full h-full object-contain rounded-xl" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-98 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
          >
            <Icon name={copySuccess ? "check" : "content_copy"} className="text-[18px]" />
            <span>{copySuccess ? "Copied to Clipboard!" : "Copy Image"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Icon name="download" className="text-[18px]" />
            <span>Save PNG</span>
          </button>
        </div>

      </div>
    </div>
  );
}

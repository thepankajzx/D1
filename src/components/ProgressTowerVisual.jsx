import React, { useEffect, useRef, useState } from 'react';
import { TOWER_LEVELS } from '../lib/progressTowerEngine';

/**
 * ProgressTowerVisual - Adventure Quest World Map (एडवेंचर यात्रा मैप)
 *
 * Visual Features:
 * - Beautiful winding Adventure Path that curves through 8 distinct Biome Checkpoints
 * - Animated Hero Quest Pin (Hero Avatar) that walks & advances along the trail in real time
 * - 8 Unique Checkpoint Castles / Shrines:
 *    Node 1: Awakening Campfire (Valley)
 *    Node 2: Whispering Falls (Rivers)
 *    Node 3: Discipline Fortress (Canyons)
 *    Node 4: Zen Torii Shrine (Sakura)
 *    Node 5: Sapphire Peak Tower (Snow/Ice)
 *    Node 6: Cyber Cloud Oasis (Neon City)
 *    Node 7: Dragon's Grand Citadel (Golden Realm)
 *    Node 8: Celestial Apex Gate (Cosmic Sky)
 * - Dynamic Canvas Particle Engine: floating embers, magic fireflies, and celestial stardust.
 * - Interactive: Tap any world node to inspect its realm lore and habit construction stats.
 */
export default function ProgressTowerVisual({
  towerProgress = {},
  isHinglish = false,
  isPowering = false,
  className = '',
  onFloorClick = null
}) {
  const canvasRef = useRef(null);
  const [activeNodeTap, setActiveNodeTap] = useState(null);

  const currentLevel = towerProgress?.currentFloor || 1;
  const totalActions = towerProgress?.totalCompletedActions || 0;
  const actionsToNext = towerProgress?.actionsToNextFloor || 0;
  const nextFloorNum = towerProgress?.nextFloor;

  // Winding Map Road Waypoint Coordinates (X, Y in 400x560 space)
  // From bottom (Campfire) to top (Celestial Gate)
  const mapNodes = [
    { level: 1, x: 100, y: 480, name: 'Awakening Camp', biome: 'Valley', color: '#10b981', symbol: '⛺' },
    { level: 2, x: 290, y: 430, name: 'Whispering Falls', biome: 'River', color: '#06b6d4', symbol: '🌊' },
    { level: 3, x: 110, y: 360, name: 'Discipline Ridge', biome: 'Canyon', color: '#3b82f6', symbol: '⚡' },
    { level: 4, x: 285, y: 295, name: 'Zen Torii Shrine', biome: 'Sakura', color: '#ec4899', symbol: '🌸' },
    { level: 5, x: 120, y: 225, name: 'Sapphire Peaks', biome: 'Crystal', color: '#8b5cf6', symbol: '🏔️' },
    { level: 6, x: 290, y: 160, name: 'Cyber Oasis', biome: 'Neon', color: '#f97316', symbol: '🏙️' },
    { level: 7, x: 130, y: 95, name: 'Dragon Citadel', biome: 'Golden', color: '#eab308', symbol: '🏰' },
    { level: 8, x: 210, y: 35, name: 'Celestial Apex', biome: 'Cosmic', color: '#f59e0b', symbol: '🌌' }
  ];

  // Dynamic Canvas: Fireflies, Ambient Embers & Magic Spirit Motes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = (rect.width || 380) * dpr;
    canvas.height = (rect.height || 540) * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width || 380;
    const height = rect.height || 540;

    const fireflies = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.35 - 0.1,
      color: Math.random() > 0.5 ? '#fef08a' : '#38bdf8',
      phase: Math.random() * Math.PI * 2
    }));

    let t = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.03;

      fireflies.forEach((f) => {
        f.x += f.speedX + Math.sin(t + f.phase) * 0.25;
        f.y += f.speedY;

        if (f.y < 0) {
          f.y = height;
          f.x = Math.random() * width;
        }
        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.4 + 0.5 * Math.sin(t * 2 + f.phase);
        ctx.shadowBlur = 6;
        ctx.shadowColor = f.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Find active node coordinates for Hero Avatar Pin
  const activeNode = mapNodes.find((n) => n.level === currentLevel) || mapNodes[0];

  return (
    <div className={`w-full max-w-[440px] mx-auto select-none space-y-3 ${className}`}>
      
      {/* ── 1. The Adventure Quest World Map Viewport ── */}
      <div className="relative w-full aspect-[4/5.4] rounded-3xl overflow-hidden bg-gradient-to-b from-[#090e1a] via-[#0f172a] to-[#040810] border border-amber-500/30 shadow-2xl">
        
        {/* Background Fantasy Biome Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Cosmic Celestial Glow */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/15 via-indigo-500/10 to-transparent" />
          {/* Middle Mystic Forest/Sakura Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[320px] h-[320px] bg-pink-500/10 rounded-full blur-3xl" />
          {/* Bottom Valley Campfire Warm Glow */}
          <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-emerald-950/40 via-amber-950/20 to-transparent" />
        </div>

        {/* Ambient Fireflies & Spirit Dust Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* ── Quest Realm Lore Inspector HUD Modal ── */}
        {activeNodeTap !== null && (() => {
          const nodeObj = TOWER_LEVELS.find((f) => f.level === activeNodeTap);
          const mapNode = mapNodes.find((n) => n.level === activeNodeTap);
          if (!nodeObj) return null;
          const isComp = activeNodeTap < currentLevel;
          const isCurr = activeNodeTap === currentLevel;
          const isLock = activeNodeTap > currentLevel;

          return (
            <div className="absolute top-3 inset-x-3 z-30 p-3 rounded-2xl bg-slate-950/95 backdrop-blur-md text-white border border-amber-400/60 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0">{mapNode?.symbol || '🚩'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-800">
                      STAGE {nodeObj.level}
                    </span>
                    <span className="text-xs font-black text-slate-100 truncate">
                      {isHinglish ? nodeObj.titleHindi : nodeObj.title}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-300 font-medium truncate mt-1">
                    {nodeObj.subtitle} • {isComp ? '✓ Conquered & Reached' : isCurr ? `⚡ Current Camp • ${totalActions} Actions Built` : `🔒 Unlocks at ${nodeObj.minActions} Actions`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNodeTap(null)}
                className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>
          );
        })()}

        {/* ── High-End SVG Vector Adventure Quest Map ── */}
        <svg
          viewBox="0 0 400 540"
          className="relative z-10 w-full h-full drop-shadow-2xl overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Trail Road Stone Gradient */}
            <linearGradient id="questRoad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="25%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Glowing Checkpoint Node Filter */}
            <radialGradient id="goldPortal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>

            <radialGradient id="heroAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="80%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ── 1. THE WINDING ADVENTURE TRAIL (ORGANIC CURVED ROAD) ── */}
          <g id="adventure-trail">
            {/* Dark Stone Road Underlay */}
            <path
              d="M 100,480 C 180,480 230,450 290,430 C 340,410 180,390 110,360 C 50,330 220,320 285,295 C 340,270 190,250 120,225 C 60,200 230,190 290,160 C 340,130 200,120 130,95 C 70,70 150,50 210,35"
              fill="none"
              stroke="#1e293b"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Inner Cobblestone Paving Border */}
            <path
              d="M 100,480 C 180,480 230,450 290,430 C 340,410 180,390 110,360 C 50,330 220,320 285,295 C 340,270 190,250 120,225 C 60,200 230,190 290,160 C 340,130 200,120 130,95 C 70,70 150,50 210,35"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Illuminated Completed Gold/Cyan Journey Trail */}
            <path
              d="M 100,480 C 180,480 230,450 290,430 C 340,410 180,390 110,360 C 50,330 220,320 285,295 C 340,270 190,250 120,225 C 60,200 230,190 290,160 C 340,130 200,120 130,95 C 70,70 150,50 210,35"
              fill="none"
              stroke="url(#questRoad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="8 6"
              className="animate-pulse"
            />
          </g>

          {/* ── 2. THE 8 BIOME CHECKPOINT CASTLES & REALM SHRINES ── */}
          <g id="quest-checkpoints">
            {mapNodes.map((node) => {
              const isComp = node.level < currentLevel;
              const isCurr = node.level === currentLevel;
              const isLock = node.level > currentLevel;
              const isSelected = activeNodeTap === node.level;

              return (
                <g
                  key={node.level}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    setActiveNodeTap(isSelected ? null : node.level);
                    if (onFloorClick) onFloorClick(node);
                  }}
                >
                  {/* Outer Checkpoint Stone Platform Base */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="24"
                    fill={isCurr ? '#0f172a' : isComp ? '#1e293b' : '#090e1a'}
                    stroke={
                      isSelected
                        ? '#f59e0b'
                        : isCurr
                        ? '#38bdf8'
                        : isComp
                        ? node.color
                        : '#334155'
                    }
                    strokeWidth={isSelected ? 3.5 : isCurr ? 3 : 2}
                    className={isCurr ? 'animate-pulse' : ''}
                  />

                  {/* Inner Glowing Realm Core Orb */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isCurr ? 15 : 12}
                    fill={
                      isCurr
                        ? 'url(#goldPortal)'
                        : isComp
                        ? node.color
                        : '#1e293b'
                    }
                    opacity={isLock ? 0.4 : 1}
                  />

                  {/* Checkpoint Biome Icon Symbol */}
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fontSize={isCurr ? '14' : '11'}
                  >
                    {isLock ? '🔒' : node.symbol}
                  </text>

                  {/* Stage Number Badge Pill above node */}
                  <rect
                    x={node.x - 22}
                    y={node.y - 34}
                    width="44"
                    height="15"
                    rx="4"
                    fill="#020617"
                    stroke={isCurr ? '#38bdf8' : isComp ? '#64748b' : '#334155'}
                    strokeWidth="1"
                  />
                  <text
                    x={node.x}
                    y={node.y - 23}
                    textAnchor="middle"
                    fill={isCurr ? '#38bdf8' : isComp ? '#f8fafc' : '#64748b'}
                    fontSize="8"
                    fontWeight="900"
                  >
                    STAGE {node.level}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── 3. ANIMATED HERO AVATAR PIN (HERO QUEST TOKEN) ── */}
          <g id="hero-avatar-token">
            {/* Pulsing Quest Aura Ring Under Hero */}
            <circle
              cx={activeNode.x}
              cy={activeNode.y}
              r="34"
              fill="url(#heroAura)"
              className="animate-ping origin-center"
              style={{ animationDuration: '2s' }}
            />

            {/* Hero Quest Avatar Floating Banner & Crown */}
            <g
              transform={`translate(${activeNode.x}, ${activeNode.y - 42})`}
              className="animate-bounce"
              style={{ animationDuration: '2.5s' }}
            >
              {/* Golden Hero Crest Shield */}
              <polygon
                points="0,-18 16,-6 14,14 0,22 -14,14 -16,-6"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Hero Star Emblem */}
              <text x="0" y="7" textAnchor="middle" fill="#020617" fontSize="14" fontWeight="900">
                ⭐
              </text>

              {/* "YOU ARE HERE" Little Banner */}
              <rect
                x="-34"
                y="-32"
                width="68"
                height="13"
                rx="4"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="1"
              />
              <text x="0" y="-23" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="900" letterSpacing="0.5">
                YOU ARE HERE
              </text>
            </g>
          </g>

          {/* ── 4. LIVE POWER SURGE ON MAP (WHEN HABIT COMPLETED) ── */}
          {isPowering && (
            <circle
              cx={activeNode.x}
              cy={activeNode.y}
              r="60"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              className="animate-ping origin-center"
            />
          )}
        </svg>

        {/* Live Power Booster Surge Border */}
        {isPowering && (
          <div className="absolute inset-0 pointer-events-none z-25 border-4 border-amber-400 rounded-3xl animate-ping opacity-75" />
        )}

        {/* Bottom Quest Stage Telemetry Card */}
        <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-amber-500/40 text-white shadow-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-800">
                CHECKPOINT {currentLevel}
              </span>
              <span className="text-xs font-black text-slate-100 truncate">
                {isHinglish ? towerProgress.currentFloorTitleHindi : towerProgress.currentFloorTitle}
              </span>
            </div>
            <div className="text-[10.5px] text-slate-400 font-semibold truncate mt-0.5">
              {totalActions} Habit Actions Conquered
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10.5px] font-black text-amber-400 bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-800">
              {actionsToNext > 0 ? `+${actionsToNext} to STAGE 0${nextFloorNum}` : 'Apex Champion'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

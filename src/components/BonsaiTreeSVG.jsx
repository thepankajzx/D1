import React, { useEffect, useRef, useState } from 'react';
import { TOWER_STAGES } from '../lib/treeEngine';

/**
 * HabitTowerSVG
 * Ultra-clean, modular, isometric Habit Skyscraper (हैबिट गगनचुंबी इमारत).
 * Features:
 * - Clean modular floor stacking (Foundation ➔ Modular Floors ➔ Glass Skybridge ➔ Penthouse ➔ Apex Laser Spire)
 * - Animated glass elevator going up/down
 * - Illuminated glowing habit rooms (Gym, Library, Zen, Code pod)
 * - Night cityscape / Aurora sky with floating sky-traffic or stars
 * - 100% bug-free geometric vector art (Super easy to scale and maintain!)
 */
export default function BonsaiTreeSVG({
  stageKey = 'foundation',
  growthScore = 0,
  isWatering = false,
  className = ''
}) {
  const canvasRef = useRef(null);
  const [activeFloorTap, setActiveFloorTap] = useState(null);

  const stage = TOWER_STAGES[stageKey] || TOWER_STAGES.foundation;
  const floors = stage.floorsCount || 1;
  const isApex = stageKey === 'cyber_spire';

  // Ambient Starfield & Traffic Drone Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = (rect.width || 360) * dpr;
    canvas.height = (rect.height || 440) * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width || 360;
    const height = rect.height || 440;

    // Glowing Sky Data Spores & Drones
    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.75,
      radius: Math.random() * 1.8 + 0.8,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: -Math.random() * 0.4 - 0.1,
      opacity: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.5 ? '#38bdf8' : '#34d399'
    }));

    let t = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.02;

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < 0) {
          p.y = height * 0.75;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * (0.6 + 0.4 * Math.sin(t * 2 + p.x));
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Floor Room Types for visual variety
  const floorThemes = [
    { name: 'Ground Lobby & Plaza', icon: '🏛️', color: '#38bdf8' },
    { name: 'Fitness & Health Deck', icon: '🏋️', color: '#f97316' },
    { name: 'Wisdom & Deep Library', icon: '📚', color: '#a855f7' },
    { name: 'Mindfulness Zen Pod', icon: '🧘', color: '#10b981' },
    { name: 'Focus & Creation Suite', icon: '💻', color: '#3b82f6' },
    { name: 'Sky Observatory Lounge', icon: '🔭', color: '#ec4899' },
    { name: 'Cloud Penthouse Garden', icon: '🌴', color: '#84cc16' },
    { name: 'Apex Helipad & Comm Spire', icon: '🚁', color: '#f59e0b' },
    { name: 'Cyber Orbital Beacon', icon: '📡', color: '#06b6d4' }
  ];

  return (
    <div className={`relative w-full max-w-[390px] mx-auto select-none aspect-[4/4.9] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-[#07131e] to-[#04090e] border border-cyan-500/20 shadow-2xl ${className}`}>
      
      {/* Background City Lights & Sky Aurora Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[280px] h-[280px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-cyan-950/40 to-transparent" />
      </div>

      {/* Canvas Starfield & Sky Drones */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* SVG Skyscraper Vector Architecture */}
      <svg
        viewBox="0 0 400 480"
        className="relative z-10 w-full h-full drop-shadow-2xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glass & Steel Gradients */}
          <linearGradient id="towerSteel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="25%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="glassFloorLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="groundConcrete" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Neon Window Glow */}
          <radialGradient id="windowGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>

          {/* Laser Beacon Beam Gradient */}
          <linearGradient id="spireLaser" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── 1. APEX BEACON BEAM (WHEN TOWER REACHES HIGH TIERS) ── */}
        {floors >= 5 && (
          <g opacity="0.75">
            <polygon
              points="200,10 175,0 225,0"
              fill="url(#spireLaser)"
              className="animate-pulse"
            />
            <line x1="200" y1="90" x2="200" y2="0" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 4" className="animate-pulse" />
          </g>
        )}

        {/* ── 2. FOUNDATION PLAZA & STREET LEVEL ── */}
        <g id="tower-foundation">
          {/* Ground Platform Base */}
          <ellipse cx="200" cy="445" rx="140" ry="14" fill="#020617" opacity="0.8" />
          <path
            d="M 60,435 L 75,448 Q 200,458 325,448 L 340,435 Z"
            fill="url(#groundConcrete)"
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* Plaza Neon Edge Ring */}
          <path
            d="M 70,436 Q 200,446 330,436"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Foundation Entrance Pillar Supports */}
          <rect x="110" y="405" width="20" height="30" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="270" y="405" width="20" height="30" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />

          {/* Grand Ground Lobby */}
          <rect x="125" y="395" width="150" height="42" rx="6" fill="url(#towerSteel)" stroke="#38bdf8" strokeWidth="1.5" />
          
          {/* Lobby Glass Doors & Interior Warm Glow */}
          <rect x="180" y="408" width="40" height="28" rx="2" fill="#fef08a" opacity="0.9" />
          <line x1="200" y1="408" x2="200" y2="436" stroke="#0f172a" strokeWidth="1.5" />

          {/* Plaza Welcome Text / Stage Badge */}
          <text x="200" y="390" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold" letterSpacing="1">
            HABIT TOWER • LVL {floors}
          </text>
        </g>

        {/* ── 3. MODULAR STACKED FLOORS ── */}
        <g id="tower-floors">
          {Array.from({ length: floors }).map((_, idx) => {
            // Floor height and vertical spacing
            const floorHeight = 36;
            const floorWidth = Math.max(100, 150 - idx * 6);
            const floorX = 200 - floorWidth / 2;
            const floorY = 395 - (idx + 1) * (floorHeight + 2);

            const themeInfo = floorThemes[idx] || floorThemes[0];
            const isHovered = activeFloorTap === idx;

            return (
              <g
                key={idx}
                className="transition-all duration-300 cursor-pointer"
                onClick={() => setActiveFloorTap(idx === activeFloorTap ? null : idx)}
              >
                {/* Floor Outer Steel Frame */}
                <rect
                  x={floorX}
                  y={floorY}
                  width={floorWidth}
                  height={floorHeight}
                  rx="6"
                  fill="url(#towerSteel)"
                  stroke={isHovered ? '#f59e0b' : themeInfo.color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />

                {/* Floor Glass Windows with Room Glow */}
                <rect
                  x={floorX + 8}
                  y={floorY + 6}
                  width={floorWidth - 16}
                  height={floorHeight - 12}
                  rx="3"
                  fill="url(#glassFloorLight)"
                />

                {/* Illuminated Room Window Panes */}
                <g opacity="0.9">
                  {Array.from({ length: 4 }).map((_, wIdx) => {
                    const paneW = (floorWidth - 36) / 4;
                    const paneX = floorX + 10 + wIdx * (paneW + 4);
                    return (
                      <rect
                        key={wIdx}
                        x={paneX}
                        y={floorY + 8}
                        width={paneW}
                        height={floorHeight - 16}
                        rx="2"
                        fill="#fef08a"
                        opacity={((idx + wIdx) % 3 === 0) ? 0.95 : 0.65}
                      />
                    );
                  })}
                </g>

                {/* Floor Level Label & Icon */}
                <text
                  x={floorX + 14}
                  y={floorY + 22}
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="black"
                >
                  F{idx + 1}
                </text>

                <text
                  x={floorX + floorWidth - 16}
                  y={floorY + 22}
                  textAnchor="end"
                  fontSize="11"
                >
                  {themeInfo.icon}
                </text>
              </g>
            );
          })}
        </g>

        {/* ── 4. ROOFTOP PENTHOUSE & CYBER SPIRE (FOR UPPER STAGES) ── */}
        {floors >= 3 && (
          <g id="rooftop-spire">
            {/* Crown Top Platform */}
            {(() => {
              const topY = 395 - floors * (36 + 2);
              return (
                <g>
                  {/* Rooftop Helipad / Garden Deck */}
                  <rect
                    x="170"
                    y={topY - 14}
                    width="60"
                    height="12"
                    rx="3"
                    fill="#1e293b"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  {/* Helipad 'H' */}
                  <text x="200" y={topY - 5} textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="black">
                    [ H ]
                  </text>

                  {/* Antenna Spire Mast */}
                  <line
                    x1="200"
                    y1={topY - 14}
                    x2="200"
                    y2={topY - 55}
                    stroke="#94a3b8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="200"
                    y1={topY - 55}
                    x2="200"
                    y2={topY - 80}
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Blinking Red/Cyan Aircraft Warning Beacon */}
                  <circle
                    cx="200"
                    cy={topY - 80}
                    r="4"
                    fill="#ef4444"
                    className="animate-ping origin-center"
                  />
                  <circle
                    cx="200"
                    cy={topY - 80}
                    r="3"
                    fill="#38bdf8"
                  />
                </g>
              );
            })()}
          </g>
        )}

        {/* ── 5. GLASS ELEVATOR GOING UP/DOWN ── */}
        <g id="glass-elevator">
          {/* Elevator Track on Right Wall */}
          <line
            x1="285"
            y1="400"
            x2="285"
            y2={395 - floors * 38}
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {/* Animated Elevator Pod */}
          <rect
            x="280"
            y="350"
            width="10"
            height="16"
            rx="2"
            fill="#38bdf8"
            opacity="0.9"
            className="animate-bounce"
            style={{ animationDuration: '3s' }}
          />
        </g>

        {/* ── 6. CONSTRUCTION / POWER UP PULSE (WHEN USER POWERS/LOGS) ── */}
        {isWatering && (
          <g id="power-surge">
            <rect
              x="80"
              y={395 - (floors + 1) * 38}
              width="240"
              height="350"
              rx="16"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              opacity="0.9"
              className="animate-ping origin-center"
            />
          </g>
        )}
      </svg>

      {/* Floating Floor Tooltip when tapped */}
      {activeFloorTap !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white text-xs px-3.5 py-2 rounded-2xl border border-cyan-500/50 shadow-2xl flex items-center gap-2 animate-in fade-in">
          <span className="text-base">{floorThemes[activeFloorTap]?.icon}</span>
          <div>
            <div className="font-black text-cyan-400">Floor {activeFloorTap + 1}: {floorThemes[activeFloorTap]?.name}</div>
            <div className="text-[10px] text-slate-400">Powered by your consistent habits</div>
          </div>
        </div>
      )}
    </div>
  );
}

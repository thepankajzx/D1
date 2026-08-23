import React from 'react';

export default function PriorityIcon({ rank, className = "w-6 h-6 filter drop-shadow-sm", active = true }) {
  if (rank === 1 || rank === 'very_important') {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none">
                          <defs>
                            <linearGradient id="crownGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fef08a" />
                              <stop offset="40%" stopColor="#eab308" />
                              <stop offset="100%" stopColor="#ca8a04" />
                            </linearGradient>
                            <linearGradient id="crownGradVelvet" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#c084fc" />
                              <stop offset="60%" stopColor="#7e22ce" />
                              <stop offset="100%" stopColor="#581c87" />
                            </linearGradient>
                            <linearGradient id="rubyGem" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fb7185" />
                              <stop offset="100%" stopColor="#e11d48" />
                            </linearGradient>
                            <linearGradient id="sapphireGem" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#67e8f9" />
                              <stop offset="100%" stopColor="#0284c7" />
                            </linearGradient>
                          </defs>

                          {/* Ambient Glow */}
                          <circle cx="32" cy="32" r="26" fill="#a855f7" fillOpacity={active ? "0.22" : "0.08"} />

                          {/* Velvet Cushion */}
                          <path d="M14 43C14 43 17 26 25 32C32 20 32 20 39 32C47 26 50 43 50 43H14Z" fill="url(#crownGradVelvet)" />
                          <path d="M25 32C32 24 32 24 39 32L32 43L25 32Z" fill="white" fillOpacity="0.25" />

                          {/* Golden Crown Structure */}
                          <path d="M12 43L15 22L24 30L32 12L40 30L49 22L52 43H12Z" fill="url(#crownGradGold)" />
                          
                          {/* Facet Shading on Gold */}
                          <path d="M32 12L40 30L32 43L24 30L32 12Z" fill="white" fillOpacity="0.35" />
                          <path d="M15 22L24 30L12 43H18L15 22Z" fill="white" fillOpacity="0.2" />
                          <path d="M49 22L40 30L52 43H46L49 22Z" fill="black" fillOpacity="0.2" />

                          {/* Gold Base Rim with Studded Jewels */}
                          <rect x="10" y="42" width="44" height="8" rx="4" fill="url(#crownGradGold)" stroke="#fef08a" strokeWidth="0.8" />
                          <circle cx="20" cy="46" r="2" fill="url(#sapphireGem)" />
                          <circle cx="32" cy="46" r="2.5" fill="url(#rubyGem)" stroke="#fff" strokeWidth="0.5" />
                          <circle cx="44" cy="46" r="2" fill="url(#sapphireGem)" />

                          {/* Jewels on Crown Peaks */}
                          <circle cx="32" cy="11.5" r="4" fill="url(#crownGradGold)" stroke="#ffffff" strokeWidth="1" />
                          <circle cx="32" cy="11.5" r="2" fill="url(#rubyGem)" />
                          <circle cx="15" cy="21.5" r="3" fill="url(#crownGradGold)" stroke="#ffffff" strokeWidth="0.8" />
                          <circle cx="15" cy="21.5" r="1.4" fill="url(#sapphireGem)" />
                          <circle cx="49" cy="21.5" r="3" fill="url(#crownGradGold)" stroke="#ffffff" strokeWidth="0.8" />
                          <circle cx="49" cy="21.5" r="1.4" fill="url(#sapphireGem)" />

                          {/* Sparkles */}
                          <path d="M54 11L55.5 7.5L59 6.5L55.5 5.5L54 2L52.5 5.5L49 6.5L52.5 7.5L54 11Z" fill="#fbbf24" />
                          <path d="M7 17L8 14.5L10.5 13.5L8 12.5L7 10L6 12.5L3.5 13.5L6 14.5L7 17Z" fill="#c084fc" />
                        </svg>
    );
  }
  if (rank === 2) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none">
                          <defs>
                            <linearGradient id="diamondGradBlueMain" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#7dd3fc" />
                              <stop offset="50%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#1d4ed8" />
                            </linearGradient>
                            <linearGradient id="diamondGradBlueLight" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#bae6fd" />
                              <stop offset="100%" stopColor="#60a5fa" />
                            </linearGradient>
                            <linearGradient id="diamondGradBlueDark" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#1e40af" />
                              <stop offset="100%" stopColor="#172554" />
                            </linearGradient>
                          </defs>

                          {/* Ambient Glow */}
                          <circle cx="32" cy="32" r="26" fill="#3b82f6" fillOpacity={active ? "0.22" : "0.08"} />

                          {/* 3D Brilliant Diamond Facets */}
                          {/* Upper Crown Table */}
                          <path d="M21 16H43L51 28H13L21 16Z" fill="url(#diamondGradBlueLight)" />
                          
                          {/* Lower Pavilion Points */}
                          <path d="M13 28L32 55L24 28H13Z" fill="url(#diamondGradBlueDark)" />
                          <path d="M24 28L32 55L40 28H24Z" fill="url(#diamondGradBlueMain)" />
                          <path d="M40 28L32 55L51 28H40Z" fill="url(#diamondGradBlueDark)" />

                          {/* Upper Crown Triangular Facets */}
                          <path d="M21 16L32 28L43 16H21Z" fill="white" fillOpacity="0.45" />
                          <path d="M13 28L21 16L32 28L13 28Z" fill="white" fillOpacity="0.2" />
                          <path d="M51 28L43 16L32 28L51 28Z" fill="black" fillOpacity="0.15" />

                          {/* Crystal Highlights */}
                          <path d="M25 20L39 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

                          {/* Radiant Sparkles */}
                          <path d="M53 11L54.5 7.5L58 6.5L54.5 5.5L53 2L51.5 5.5L48 6.5L51.5 7.5L53 11Z" fill="#38bdf8" />
                          <path d="M10 40L11.5 37L14.5 36L11.5 35L10 32L8.5 35L5.5 36L8.5 37L10 40Z" fill="#93c5fd" />
                          <circle cx="10" cy="14" r="2" fill="#60a5fa" />
                        </svg>
    );
  }
  if (rank === 3 || rank === 'important') {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none">
                          <defs>
                            <linearGradient id="starFacetGreenL" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#6ee7b7" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                            <linearGradient id="starFacetGreenR" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            <linearGradient id="starFacetGreenDark" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#047857" />
                              <stop offset="100%" stopColor="#064e3b" />
                            </linearGradient>
                          </defs>

                          {/* Ambient Glow */}
                          <circle cx="32" cy="32" r="26" fill="#10b981" fillOpacity={active ? "0.22" : "0.08"} />

                          {/* 8 Faceted Star Polygon with central ridge */}
                          {/* Top Point */}
                          <path d="M32 7L32 33L40 22L32 7Z" fill="url(#starFacetGreenL)" />
                          <path d="M32 7L32 33L24 22L32 7Z" fill="url(#starFacetGreenR)" />

                          {/* Right Point */}
                          <path d="M57 23L32 33L42 38L57 23Z" fill="url(#starFacetGreenL)" />
                          <path d="M57 23L32 33L40 22L57 23Z" fill="url(#starFacetGreenDark)" />

                          {/* Bottom Right Point */}
                          <path d="M47 54L32 33L32 45L47 54Z" fill="url(#starFacetGreenL)" />
                          <path d="M47 54L32 33L42 38L47 54Z" fill="url(#starFacetGreenDark)" />

                          {/* Bottom Left Point */}
                          <path d="M17 54L32 33L22 38L17 54Z" fill="url(#starFacetGreenR)" />
                          <path d="M17 54L32 33L32 45L17 54Z" fill="url(#starFacetGreenL)" />

                          {/* Left Point */}
                          <path d="M7 23L32 33L24 22L7 23Z" fill="url(#starFacetGreenL)" />
                          <path d="M7 23L32 33L22 38L7 23Z" fill="url(#starFacetGreenR)" />

                          {/* Diamond Center Prism Highlight */}
                          <circle cx="32" cy="33" r="5" fill="#ffffff" fillOpacity="0.85" />
                          <circle cx="32" cy="33" r="2.5" fill="#34d399" />

                          {/* Sparkles */}
                          <path d="M54 10L55.5 6.5L59 5.5L55.5 4.5L54 1L52.5 4.5L49 5.5L52.5 6.5L54 10Z" fill="#34d399" />
                          <circle cx="9" cy="13" r="2" fill="#a7f3d0" />
                          <circle cx="53" cy="47" r="2" fill="#6ee7b7" />
                        </svg>
    );
  }
  return null;
}

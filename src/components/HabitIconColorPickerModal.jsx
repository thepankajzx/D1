import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { X, MagnifyingGlass, Check, Palette, WarningCircle, Sparkle } from '@phosphor-icons/react';
import { ALL_PHOSPHOR_ICONS, ICON_CATEGORIES } from '../lib/habitIconCatalog';
import { getPhosphorIcon, getReadableIconColor } from './HabitIcon';

export const PRESET_PALETTES = [
  // Vibrant & Core
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Royal', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Fuchsia', hex: '#d946ef' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Crimson', hex: '#ef4444' },
  { name: 'Coral', hex: '#fb7185' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Gold', hex: '#eab308' },
  { name: 'Lime', hex: '#84cc16' },
  { name: 'Forest', hex: '#059669' },
  // Deep & Rich
  { name: 'Ruby', hex: '#991b1b' },
  { name: 'Rust', hex: '#c2410c' },
  { name: 'Bronze', hex: '#b45309' },
  { name: 'Deep Moss', hex: '#15803d' },
  { name: 'Deep Ocean', hex: '#0e7490' },
  { name: 'Cobalt', hex: '#1d4ed8' },
  { name: 'Midnight', hex: '#4338ca' },
  { name: 'Amethyst', hex: '#6d28d9' },
  { name: 'Berry', hex: '#be185d' },
  // Pastels & Soft
  { name: 'Soft Rose', hex: '#fda4af' },
  { name: 'Peach', hex: '#fdba74' },
  { name: 'Lemon', hex: '#fde047' },
  { name: 'Mint', hex: '#86efac' },
  { name: 'Ice Cyan', hex: '#67e8f9' },
  { name: 'Soft Sky', hex: '#93c5fd' },
  { name: 'Lavender', hex: '#c4b5fd' },
  { name: 'Bubblegum', hex: '#f472b6' }
];

function hsvToHex(h, s, v) {
  s = s / 100;
  v = v / 100;
  const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}

function hexToHsv(hex) {
  let r = 0, g = 0, b = 0;
  if (hex && hex.startsWith('#') && hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16) / 255;
    g = parseInt(hex.slice(3, 5), 16) / 255;
    b = parseInt(hex.slice(5, 7), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

const ICONS_PER_PAGE = 72;

export default function HabitIconColorPickerModal({
  isOpen,
  onClose,
  selectedIcon,
  selectedColor,
  onSelect,
  habitName = 'Custom Habit',
  existingHabits = [],
  currentHabitId = null
}) {
  if (!isOpen) return null;

  const [currentIcon, setCurrentIcon] = useState(selectedIcon || 'RocketLaunch');
  const [currentColor, setCurrentColor] = useState(selectedColor || '#10b981');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ICONS_PER_PAGE);
  const [showCustomWheelBox, setShowCustomWheelBox] = useState(false);

  // HSV state for custom color box
  const [hsv, setHsv] = useState(() => hexToHsv(selectedColor || '#10b981'));
  const satBoxRef = useRef(null);
  const isDraggingSatBox = useRef(false);

  // Sync initial color
  useEffect(() => {
    if (selectedColor) {
      setCurrentColor(selectedColor);
      setHsv(hexToHsv(selectedColor));
    }
  }, [selectedColor]);

  // Duplicate icon & color validation
  const duplicateHabit = useMemo(() => {
    if (!existingHabits || existingHabits.length === 0) return null;
    const normColor = (currentColor || '').toLowerCase().trim();
    const normIcon = (currentIcon || '').toLowerCase().trim();
    return existingHabits.find(h => {
      if (currentHabitId && h.id === currentHabitId) return false;
      const hColor = (h.color || '#10b981').toLowerCase().trim();
      const hIcon = (h.icon || 'rocket_launch').toLowerCase().trim();
      return hIcon === normIcon && hColor === normColor;
    });
  }, [existingHabits, currentHabitId, currentIcon, currentColor]);

  // Filter icons based on category and search query
  const filteredIcons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ALL_PHOSPHOR_ICONS.filter(item => {
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  const visibleIcons = useMemo(() => {
    return filteredIcons.slice(0, visibleCount);
  }, [filteredIcons, visibleCount]);

  const ActiveIconComponent = getPhosphorIcon(currentIcon);

  // Color RGB math for nice soft background and crisp contrast
  const cleanHex = currentColor && currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#10b981';
  const r = parseInt(cleanHex.slice(1, 3), 16) || 16;
  const g = parseInt(cleanHex.slice(3, 5), 16) || 185;
  const b = parseInt(cleanHex.slice(5, 7), 16) || 129;
  const bgRgba = `rgba(${r}, ${g}, ${b}, 0.09)`;
  const borderRgba = `rgba(${r}, ${g}, ${b}, 0.22)`;
  const glowRgba = `rgba(${r}, ${g}, ${b}, 0.20)`;
  const readableIconColor = getReadableIconColor(cleanHex);

  const handleApply = () => {
    if (duplicateHabit) {
      alert(`This icon and color combination is already in use by "${duplicateHabit.name}". Please pick a different icon or distinct color.`);
      return;
    }
    onSelect({
      icon: currentIcon,
      color: currentColor
    });
    onClose();
  };

  const handleHexChange = (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    setCurrentColor(val);
    if (val.length === 7) {
      setHsv(hexToHsv(val));
    }
  };

  const handleHueSlider = (e) => {
    const newHue = parseInt(e.target.value, 10);
    const newHsv = { ...hsv, h: newHue };
    setHsv(newHsv);
    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setCurrentColor(newHex);
  };

  // 2D Saturation-Value Rectangle drag/pointer handler
  const updateSatValFromEvent = (e) => {
    if (!satBoxRef.current) return;
    const rect = satBoxRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const s = Math.round(x * 100);
    const v = Math.round((1 - y) * 100);
    const newHsv = { ...hsv, s, v };
    setHsv(newHsv);
    const newHex = hsvToHex(newHsv.h, s, v);
    setCurrentColor(newHex);
  };

  const handleSatBoxPointerDown = (e) => {
    isDraggingSatBox.current = true;
    updateSatValFromEvent(e);
    if (e.target.setPointerCapture && e.pointerId) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handleSatBoxPointerMove = (e) => {
    if (isDraggingSatBox.current) {
      updateSatValFromEvent(e);
    }
  };

  const handleSatBoxPointerUp = (e) => {
    isDraggingSatBox.current = false;
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ICONS_PER_PAGE);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#121723] border border-slate-200/90 dark:border-slate-800 rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Habit Icon & Color Studio</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/50 dark:border-indigo-700/50">
                1,500+ Icons
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Pick any icon and custom color
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* 2. LIVE PREVIEW BADGE */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-[#121723] border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs relative shrink-0"
              style={{
                backgroundColor: bgRgba,
                border: `1.5px solid ${borderRgba}`,
                color: readableIconColor,
                boxShadow: `0 6px 16px -4px ${glowRgba}`
              }}
            >
              <ActiveIconComponent size={24} weight="fill" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Live Preview
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px] sm:max-w-[200px] block">
                {habitName || 'My Habit'}
              </span>
            </div>
          </div>

          {/* Color & Hex Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span 
                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" 
                style={{ backgroundColor: currentColor }} 
              />
              <input
                type="text"
                value={currentColor}
                onChange={handleHexChange}
                maxLength={7}
                className="w-16 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase bg-transparent outline-none"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        {/* DUPLICATE WARNING BANNER */}
        {duplicateHabit && (
          <div className="mx-4 sm:mx-6 mt-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
            <WarningCircle size={16} weight="bold" className="shrink-0 text-rose-500" />
            <span>This icon & color combination is already used by <strong>"{duplicateHabit.name}"</strong>.</span>
          </div>
        )}

        {/* 3. COLOR SELECTOR SECTION (CUSTOM CIRCLE BUTTON + PRESET PALETTES) */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Palette size={13} weight="bold" className="text-indigo-500" />
              <span>Color Accent &amp; Presets</span>
            </span>

            <span className="text-[10px] text-slate-400 font-medium">
              Tap rainbow circle for custom picker
            </span>
          </div>

          {/* In-App 2D Color Saturation/Brightness Rectangle Box (Zero native OS dialogs!) */}
          {showCustomWheelBox && (
            <div className="mb-3 p-3 rounded-2xl bg-white dark:bg-[#161c2b] border border-slate-200 dark:border-slate-700 shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Sparkle size={14} weight="fill" className="text-amber-500" />
                  <span>Custom Color Canvas</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomWheelBox(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

              {/* 2D Saturation-Value Touch/Click Area */}
              <div
                ref={satBoxRef}
                onPointerDown={handleSatBoxPointerDown}
                onPointerMove={handleSatBoxPointerMove}
                onPointerUp={handleSatBoxPointerUp}
                className="relative w-full h-32 rounded-xl cursor-crosshair overflow-hidden touch-none select-none shadow-inner border border-slate-300 dark:border-slate-700"
                style={{
                  backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                  backgroundImage: `
                    linear-gradient(to top, #000, transparent),
                    linear-gradient(to right, #fff, transparent)
                  `
                }}
              >
                {/* Pointer indicator */}
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${hsv.s}%`,
                    top: `${100 - hsv.v}%`,
                    backgroundColor: currentColor,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
                  }}
                />
              </div>

              {/* Hue Rainbow Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>Hue Spectrum</span>
                  <span className="font-mono text-indigo-500">{currentColor}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hsv.h}
                  onChange={handleHueSlider}
                  className="w-full h-3.5 rounded-full appearance-none cursor-pointer outline-none"
                  style={{
                    background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Horizontal Swatches Row (With ample padding so rings are NEVER clipped!) */}
          <div className="flex items-center gap-3 overflow-x-auto py-2.5 px-3 no-scrollbar">
            {/* 1. First Item: Classic Custom Rainbow Conic Circle Button */}
            <div className="shrink-0 p-0.5">
              <button
                type="button"
                onClick={() => setShowCustomWheelBox(prev => !prev)}
                className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center p-0.5 border-2 shadow-xs transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                  showCustomWheelBox
                    ? 'border-indigo-600 ring-2 ring-indigo-500/50 scale-110'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                style={{
                  background: 'conic-gradient(from 180deg, red, yellow, lime, aqua, blue, magenta, red)'
                }}
                title="Open Custom Color Canvas"
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                  <span 
                    className="w-3.5 h-3.5 rounded-full shadow-2xs border border-black/10" 
                    style={{ backgroundColor: currentColor }} 
                  />
                </div>
              </button>
            </div>

            {/* 2. Curated Preset Color Swatches */}
            {PRESET_PALETTES.map((p) => {
              const isSelected = currentColor.toLowerCase() === p.hex.toLowerCase();
              return (
                <div key={p.hex} className="shrink-0 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentColor(p.hex);
                      setHsv(hexToHsv(p.hex));
                    }}
                    className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                      isSelected 
                        ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110 shadow-sm' 
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.hex }}
                    title={p.name}
                  >
                    {isSelected && <Check size={13} weight="bold" className="text-white drop-shadow-xs" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. SEARCH & CATEGORIES */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex flex-col gap-2">
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlass size={15} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search 1,500+ icons (e.g. gym, boxing, sleep, crypto, book)..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setVisibleCount(ICONS_PER_PAGE);
              }}
              className="w-full pl-9 pr-8 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setVisibleCount(ICONS_PER_PAGE);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold">
            {ICON_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setVisibleCount(ICONS_PER_PAGE);
                  }}
                  className={`px-3 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. ICONS GRID */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 min-h-[220px]">
          {filteredIcons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MagnifyingGlass size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No icons found for "{searchQuery}"</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {visibleIcons.map(item => {
                const isSelected = currentIcon === item.id || currentIcon === item.componentName;
                const IconComp = PhosphorIcons[item.componentName] || PhosphorIcons.Star;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentIcon(item.componentName)}
                    title={item.name}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative p-1 transition-all group cursor-pointer ${
                      isSelected
                        ? 'border-2 shadow-sm scale-105'
                        : 'border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                    style={isSelected ? {
                      borderColor: currentColor,
                      backgroundColor: bgRgba
                    } : {}}
                  >
                    <IconComp 
                      size={20} 
                      weight={isSelected ? "fill" : "regular"} 
                      className="transition-colors"
                      style={{ color: isSelected ? currentColor : undefined }}
                    />
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 truncate w-full text-center mt-1 scale-90">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Load More Button if results exceed visibleCount */}
          {filteredIcons.length > visibleCount && (
            <div className="flex justify-center py-3">
              <button
                type="button"
                onClick={handleLoadMore}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
              >
                Load More Icons ({filteredIcons.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>

        {/* 6. MODAL FOOTER */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: currentColor,
              boxShadow: `0 4px 14px 0 ${glowRgba}`
            }}
          >
            <Check size={14} weight="bold" />
            <span>Apply Icon & Color</span>
          </button>
        </div>
      </div>
    </div>
  );
}

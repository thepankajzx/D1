import React from 'react';

/**
 * ColorfulPaletteButton
 * A vibrant, colorful artist palette button with multicolor paint dots and rich gradient backdrop.
 * Exactly matches the user's reference image for visual punchiness.
 */
export default function ColorfulPaletteButton({
  onClick,
  title = "Customize Icon & Color",
  className = "",
  size = 30
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative rounded-xl p-[1.5px] bg-gradient-to-tr from-rose-500 via-purple-500 via-sky-400 to-emerald-400 hover:from-rose-600 hover:via-purple-600 hover:to-emerald-500 shadow-xs hover:shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer group ${className}`}
    >
      {/* Inner background with subtle translucent fill */}
      <div className="w-full h-full rounded-[10px] bg-white dark:bg-[#151a26] flex items-center justify-center p-0.5 transition-colors">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-2xs group-hover:rotate-6 transition-transform"
        >
          {/* Palette Outer Base Shape */}
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 15.5 3.8 18.57 6.54 20.33C7.23 20.77 8.08 20.65 8.64 20.08L9.5 19.22C10.06 18.66 10.97 18.66 11.53 19.22C12.3 19.99 13.34 20.47 14.47 20.47C16.89 20.47 18.85 18.51 18.85 16.09C18.85 15.42 19.12 14.78 19.59 14.31C21.08 12.82 22 10.74 22 8.44C22 4.88 17.52 2 12 2Z"
            className="fill-slate-100 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Thumb Hole */}
          <circle cx="15.8" cy="14.8" r="1.3" className="fill-slate-300 dark:fill-slate-700" />

          {/* 5 Multicolor Paint Blobs (Bright Rainbow) */}
          {/* 1. Rose / Red Dot */}
          <circle cx="7" cy="7.5" r="1.6" fill="#f43f5e" />
          
          {/* 2. Royal Blue Dot */}
          <circle cx="11.5" cy="5.2" r="1.6" fill="#3b82f6" />
          
          {/* 3. Golden Amber Dot */}
          <circle cx="16.5" cy="7.5" r="1.6" fill="#f59e0b" />
          
          {/* 4. Emerald Green Dot */}
          <circle cx="7" cy="13.2" r="1.6" fill="#10b981" />
          
          {/* 5. Purple Dot */}
          <circle cx="11.2" cy="11.2" r="1.4" fill="#a855f7" />
        </svg>
      </div>
    </button>
  );
}

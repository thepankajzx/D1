import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  XLogo,
  DiscordLogo,
  TelegramLogo,
  InstagramLogo,
  CheckCircle
} from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';

export default function Footer({ hideCta = false }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { isDark } = useTheme();
  const { streakTrackingEnabled } = useData();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="w-full bg-surface-bright text-on-surface-variant relative z-20 overflow-hidden font-sans border-t border-outline-variant/30 mt-auto">
      {/* Container with generous, balanced side margins on mobile (px-5 sm:px-6 md:px-8) and bottom clearance for mobile nav */}
      <div className="w-full max-w-lg md:max-w-[1720px] mx-auto px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12 pt-6 sm:pt-8 pb-[calc(env(safe-area-inset-bottom)+4.25rem)] md:pb-6 space-y-6 sm:space-y-8">
        
        {/* ── MAIN FOOTER NAVIGATION GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Col 1: Brand & Tagline (4 cols on desktop) */}
          <div className="md:col-span-4 space-y-3">
            <Link to="/" className="inline-flex items-center group">
              <img 
                src={isDark ? "/logo-white.svg?v=14" : "/logo-black.svg?v=14"} 
                alt="Definite" 
                className="h-[22px] w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
              />
            </Link>

            <p className="text-xs text-on-surface-variant font-normal leading-relaxed max-w-sm">
              Stop just tracking habits. Build unstoppable daily momentum with precision scoring, streak intelligence, and zero excuses.
            </p>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Built for High Performers
              </span>
            </div>
          </div>

          {/* Mobile 2-Columns Wrapper for Site Map & Resources (5 cols total on desktop) */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:col-span-5 md:grid-cols-2">
            {/* Col 2: Site Map */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
                Site Map
              </h3>
              <ul className="space-y-2 text-xs font-normal">
                <li>
                  <Link to="/" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Today Tracker
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Analytics & Stats
                  </Link>
                </li>
                <li>
                  <Link to="/deep-dive" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Deep Dive
                  </Link>
                </li>
                {streakTrackingEnabled && (
                  <li>
                    <Link to="/streaks" className="text-on-surface-variant hover:text-on-surface transition-colors">
                      Streaks & Recovery
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/select-habits" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Habit Library
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
                Resources
              </h3>
              <ul className="space-y-2 text-xs font-normal">
                <li>
                  <Link to="/scoring-guide" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Scoring Guide
                  </Link>
                </li>
                <li>
                  <Link to="/diagnostics" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Habit Diagnostics
                  </Link>
                </li>
                <li>
                  <Link to="/resilience" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Resilience Hub
                  </Link>
                </li>
                <li>
                  <Link to="/subscription" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Pro Membership
                  </Link>
                </li>
                <li>
                  <Link to="/roadmap" className="text-on-surface-variant hover:text-on-surface transition-colors">
                    Feature Roadmap
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Col 4: Join Us & Newsletter (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
              Join Us
            </h3>

            {/* Social Icons Row */}
            <div className="flex items-center gap-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Twitter / X"
              >
                <XLogo size={14} weight="bold" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Discord"
              >
                <DiscordLogo size={14} weight="bold" />
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Telegram"
              >
                <TelegramLogo size={14} weight="bold" />
              </a>
              <a
                href="https://www.instagram.com/definite.d1/"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Instagram"
              >
                <InstagramLogo size={14} weight="bold" />
              </a>
            </div>

            {/* Email Subscription Capsule Box */}
            <form onSubmit={handleSubscribe} className="pt-1">
              <div className="relative flex items-center rounded-full bg-surface-container border border-outline-variant/60 shadow-2xs focus-within:border-primary p-1 transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-transparent pl-3 pr-2 py-1 text-xs text-on-surface placeholder-on-surface-variant/70 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 px-3.5 py-1.5 rounded-full bg-primary hover:opacity-90 text-on-primary text-xs font-bold transition-colors cursor-pointer"
                >
                  {subscribed ? 'Subscribed!' : 'Subscribe'}
                </button>
              </div>
              {subscribed && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 pl-1 animate-fade-in">
                  <CheckCircle size={13} weight="fill" />
                  <span>Thank you for subscribing!</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* ── BOTTOM COPYRIGHT LINE ── */}
        <div className="pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px] text-on-surface-variant font-medium text-center sm:text-left">
          <p>© {new Date().getFullYear()} Definite. All rights reserved.</p>
          <div className="flex items-center gap-4 text-on-surface-variant justify-center flex-wrap">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>•</span>
            <a href="mailto:thelastpercent01@gmail.com?subject=Definite%20App%20Support" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

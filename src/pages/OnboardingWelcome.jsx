import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendUp, Crown, ShieldCheck, ArrowRight, Sparkle, LockKey
} from '@phosphor-icons/react';

export default function OnboardingWelcome() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleStart = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    navigate('/onboarding/select');
  };

  return (
    <div className="h-screen max-h-screen bg-[#FBFBFA] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased overflow-hidden select-none">
      
      {/* 01. COMPACT TOP BRAND HEADER */}
      <header className="flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center">
          <img src="/icon-d-black.svg?v=6" alt="Definite" className="h-6 w-auto object-contain sm:hidden" />
          <img src="/logo-black.svg?v=6" alt="Definite" className="h-6 sm:h-7 w-auto object-contain hidden sm:block" />
        </Link>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Sparkle size={10} weight="fill" className="text-indigo-600" />
          <span>Precision Habit OS</span>
        </span>
      </header>

      {/* 02. HERO HEADLINE (SUPER TIGHT) */}
      <div className="text-center shrink-0 my-1 sm:my-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
          Build Better. <span className="text-indigo-600">Understand Yourself.</span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
          3 core mathematical principles behind your consistency.
        </p>
      </div>

      {/* 03. 3 MAJOR PILLARS (ZERO-SCROLL COMPACT CARDS) */}
      <div className="grid grid-cols-1 gap-2 sm:gap-2.5 my-auto max-w-md mx-auto w-full">
        
        {/* Pillar 1: Precision Scoring */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendUp size={20} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">5 Precision Scoring Engines</span>
              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">0-100% Score</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              Not just checkmarks. Scored by Build, Break, Timing, Range & Binary rules.
            </p>
          </div>
        </div>

        {/* Pillar 2: 30-Day Locked Priorities */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shrink-0">
            <Crown size={20} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">30-Day Weighted Priorities</span>
              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">3× • 2× • 1×</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              Lock your keystone habits for 30 days to build genuine neuroplastic discipline.
            </p>
          </div>
        </div>

        {/* Pillar 3: Resiliency & Recovery */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">Resilience & Recovery Hub</span>
              <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">Bounce-Back</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              1 missed day isn't failure. Recovering within 24h earns +20 resilience points.
            </p>
          </div>
        </div>

      </div>

      {/* 04. BOTTOM ACTION & LAUNCH BUTTON (ALWAYS VISIBLE ABOVE THE FOLD) */}
      <footer className="shrink-0 pt-1 pb-2 flex flex-col items-center gap-1.5 max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-3 sm:py-3.5 rounded-xl bg-slate-950 text-white font-black text-xs sm:text-sm shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Choose Your Habits Now</span>
          <ArrowRight size={15} weight="bold" />
        </button>

        <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400">
          <span>Precision Engines</span>
          <span>•</span>
          <span>30D Lock</span>
          <span>•</span>
          <span>100% Free</span>
        </div>
      </footer>

    </div>
  );
}

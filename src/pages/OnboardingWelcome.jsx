import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingWelcome() {
  const navigate = useNavigate();
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    // Subtle entry animation for the progress ring
    const timer = setTimeout(() => {
      setRotated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-tertiary-container text-surface flex flex-col min-h-screen font-body-md antialiased overflow-hidden absolute inset-0 z-50">
      <main className="flex-1 flex flex-col justify-between items-center p-margin-mobile md:p-margin-desktop max-w-md mx-auto w-full h-full">
        {/* Brand Header */}
        <header className="w-full pt-8 flex justify-center">
          <span className="font-headline-md text-headline-md text-surface tracking-tight">Definite</span>
        </header>

        {/* Core Content Area */}
        <section className="flex-1 flex flex-col justify-center items-center text-center space-y-12 w-full">
          {/* Abstract Progress Art */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Ambient Glow */}
            <div className="absolute inset-0 rounded-full bg-surface opacity-5 blur-3xl"></div>
            
            {/* SVG Line Art */}
            <svg className="w-48 h-48 text-surface opacity-90" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle cx="50" cy="50" r="40" strokeOpacity="0.1"></circle>
              
              {/* Progress Arc */}
              <path 
                className="origin-center" 
                d="M 50 10 A 40 40 0 0 1 88.5 38.5" 
                strokeLinecap="round" 
                style={{ 
                  transform: rotated ? 'rotate(0deg)' : 'rotate(-10deg)', 
                  transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}
              ></path>
              
              {/* Indicator Dot */}
              <circle 
                className="origin-center" 
                cx="88.5" cy="38.5" r="2" fill="currentColor" stroke="none" 
                style={{ 
                  transform: rotated ? 'rotate(0deg)' : 'rotate(-10deg)', 
                  transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}
              ></circle>
              
              {/* Precision Lines */}
              <line strokeLinecap="round" strokeOpacity="0.2" x1="50" x2="50" y1="10" y2="18"></line>
              <line strokeLinecap="round" strokeOpacity="0.2" x1="90" x2="82" y1="50" y2="50"></line>
              <line strokeLinecap="round" strokeOpacity="0.2" x1="10" x2="18" y1="50" y2="50"></line>
              
              {/* Inner Ring */}
              <circle cx="50" cy="50" r="28" strokeDasharray="2 4" strokeOpacity="0.15"></circle>
            </svg>
          </div>

          {/* Value Proposition */}
          <div className="space-y-4 px-4">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-surface">
              Track what matters.
            </h1>
            <p className="font-body-lg text-body-lg text-surface opacity-70 max-w-xs mx-auto">
              See your progress clearly. Reduce noise and focus on consistent execution.
            </p>
          </div>
        </section>

        {/* Bottom Controls */}
        <footer className="w-full pb-8 space-y-8 flex flex-col items-center">
          {/* Progress Indicators */}
          <div aria-label="Onboarding step 1 of 3" className="flex space-x-2 items-center">
            <div className="w-8 h-1 rounded-full bg-surface transition-all duration-300"></div>
            <div className="w-2 h-1 rounded-full bg-surface opacity-20 transition-all duration-300"></div>
            <div className="w-2 h-1 rounded-full bg-surface opacity-20 transition-all duration-300"></div>
          </div>

          {/* Primary Action */}
          <button 
            onClick={() => navigate('/onboarding/select')}
            className="w-full py-4 rounded-lg bg-surface text-tertiary-container font-label-sm text-label-sm uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex justify-center items-center border border-surface shadow-[0_4px_20px_rgba(255,255,255,0.05)]"
          >
            Get Started
          </button>
        </footer>
      </main>
    </div>
  );
}

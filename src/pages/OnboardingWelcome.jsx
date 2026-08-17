import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

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
        <section className="flex-1 flex flex-col justify-center items-center text-center space-y-8 w-full mt-4">
          
          {/* Header text */}
          <div className="space-y-2 px-4 mb-4">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-surface">
              How it works
            </h1>
            <p className="font-body-lg text-body-lg text-surface opacity-70 max-w-xs mx-auto">
              Three simple steps to build bulletproof consistency.
            </p>
          </div>

          {/* How it Works - Vertical Steps */}
          <div className="w-full max-w-[320px] flex flex-col gap-2 items-start text-left mx-auto">
            
            {/* Step 1 */}
            <div className="flex gap-5 items-start w-full group">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-surface/10 border border-surface/20 flex items-center justify-center text-surface transition-all duration-300 group-hover:bg-surface/20 group-hover:scale-105">
                  <Icon name="fact_check" className="text-[24px]" />
                </div>
                <div className="w-[2px] h-8 bg-gradient-to-b from-surface/30 to-surface/5 mt-2 rounded-full"></div>
              </div>
              <div className="pt-2">
                <h3 className="font-bold text-[17px] text-surface tracking-wide">1. Select Habits</h3>
                <p className="text-surface/70 text-[14px] mt-1 leading-snug">Choose from our library or build your custom habits.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5 items-start w-full group">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-surface/10 border border-surface/20 flex items-center justify-center text-surface transition-all duration-300 group-hover:bg-surface/20 group-hover:scale-105">
                  <Icon name="tune" className="text-[24px]" />
                </div>
                <div className="w-[2px] h-8 bg-gradient-to-b from-surface/30 to-surface/5 mt-2 rounded-full"></div>
              </div>
              <div className="pt-2">
                <h3 className="font-bold text-[17px] text-surface tracking-wide">2. Choose Scoring</h3>
                <p className="text-surface/70 text-[14px] mt-1 leading-snug">Set target numbers, timers, or simple Yes/No tracking.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5 items-start w-full group">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-surface text-tertiary-container flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 group-hover:scale-105">
                  <Icon name="trending_up" className="text-[24px]" />
                </div>
              </div>
              <div className="pt-2">
                <h3 className="font-bold text-[17px] text-surface tracking-wide">3. Track Consistency</h3>
                <p className="text-surface/70 text-[14px] mt-1 leading-snug">Build your streak and analyze your progress over time.</p>
              </div>
            </div>

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
            className="w-full py-4 rounded-lg bg-surface text-tertiary-container font-label-sm text-label-sm uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 border border-surface shadow-[0_4px_20px_rgba(255,255,255,0.05)]"
          >
            Start Tracking <Icon name="arrow_forward" className="text-lg" />
          </button>
        </footer>
      </main>
    </div>
  );
}

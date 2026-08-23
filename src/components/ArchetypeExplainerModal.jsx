import React from 'react';
import Icon from './Icon';
import { useLanguage } from '../contexts/LanguageContext';

export default function ArchetypeExplainerModal({ badgeLabel = 'POWER DUO', onClose }) {
  const { isHinglish } = useLanguage();
  const normalizedKey = (badgeLabel || 'POWER DUO').toUpperCase();

  const getGuide = () => ({
    'POWER DUO': {
      title: 'Power Duo & Synergy %',
      icon: 'PlugsConnected',
      color: 'sky',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-200/80',
      iconBoxClass: 'bg-sky-100 text-sky-700 border border-sky-200/70',
      headerBg: 'bg-sky-50/50',
      headline: isHinglish ? 'Positive Behavioral Reinforcement' : 'Positive Behavioral Reinforcement',
      summary: isHinglish 
        ? 'Jab ek habit poori karne se doosri habit automatically boost ho jati hai.' 
        : 'When completing one habit naturally unlocks and boosts another habit.',
      details: [
        {
          icon: 'PlugsConnected',
          label: isHinglish ? 'Power Duo kya hai?' : 'What is Power Duo?',
          desc: isHinglish ? (
            <>
              Aisi do habits jo ek doosre ko <span className="font-bold text-slate-900">support karti hain</span>. Jab <span className="font-bold text-sky-800">Habit A</span> high level (70%+) par hoti hai, to <span className="font-bold text-sky-800">Habit B</span> bhi lagbhag hamesha poori hoti hai.
            </>
          ) : (
            <>
              Identifies two habits that strongly <span className="font-bold text-slate-900">complement each other</span>. When <span className="font-bold text-sky-800">Habit A</span> is performed at a high level (70%+), <span className="font-bold text-sky-800">Habit B</span> is almost always completed too.
            </>
          )
        },
        {
          icon: 'percent',
          label: isHinglish ? 'Synergy % ka kya matlab hai?' : 'What does Synergy % mean?',
          desc: isHinglish ? (
            <>
              <span className="font-bold text-sky-800">Synergy %</span> in dono ka co-occurrence rate hai. Jaise <span className="font-bold text-slate-900">85% synergy</span> ka matlab hai ki 100 me se 85 din jab aapne Habit A kiya, tab Habit B bhi poora hua.
            </>
          ) : (
            <>
              <span className="font-bold text-sky-800">Synergy %</span> is the mathematical co-occurrence rate. For example, <span className="font-bold text-slate-900">85% synergy</span> means that on 85 out of 100 days when you did Habit A, Habit B was also accomplished.
            </>
          )
        }
      ]
    },
    'COMEBACK HERO': {
      title: 'Comeback Hero (U-Shape Recovery)',
      icon: 'RocketLaunch',
      color: 'violet',
      badgeClass: 'bg-violet-100 text-violet-800 border-violet-200/80',
      iconBoxClass: 'bg-violet-100 text-violet-700 border border-violet-200/70',
      headerBg: 'bg-violet-50/50',
      headline: 'Bounce-Back Resilience',
      summary: isHinglish ? 'Ek hi hafte me slump ko reverse karna.' : 'Reversing a slump within the same week.',
      details: [
        {
          icon: 'RocketLaunch',
          label: isHinglish ? 'Comeback Hero kab trigger hota hai?' : 'What is Comeback Hero?',
          desc: isHinglish ? (
            <>
              Jab hafte ke beech me score <span className="font-bold text-rose-700">35% se neeche</span> chala jaye, par aap har nahi maante aur weekend aate-aate wapas <span className="font-bold text-violet-800">75%+ par bounce back</span> kar lete ho.
            </>
          ) : (
            <>
              Triggered when performance dips mid-week (<span className="font-bold text-rose-700">below 35%</span>), but you refuse to quit and bounce right back to <span className="font-bold text-violet-800">75%+ by the weekend</span>.
            </>
          )
        },
        {
          icon: 'psychology',
          label: isHinglish ? 'Ye kyun zaroori hai?' : 'Why is it important?',
          desc: isHinglish ? (
            <>
              Consistency ka matlab kabhi miss na hona nahi, balki <span className="font-bold text-slate-900">kitni jaldi wapas aate ho</span> wo hai. Bounce-back karna hi lifelong habits banata hai.
            </>
          ) : (
            <>
              Consistency is not about never slipping — it is about <span className="font-bold text-slate-900">how fast you recover</span>. Bouncing back builds lifelong behavioral resilience.
            </>
          )
        }
      ]
    },
    'KEYSTONE HABIT': {
      title: 'Keystone Habit',
      icon: 'Crown',
      color: 'purple',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200/80',
      iconBoxClass: 'bg-purple-100 text-purple-700 border border-purple-200/70',
      headerBg: 'bg-purple-50/50',
      headline: 'The Master Catalyst Habit',
      summary: isHinglish ? 'Wo ek habit jo poore din ko elevate karti hai.' : 'The one habit that elevates your entire day.',
      details: [
        {
          icon: 'Crown',
          label: isHinglish ? 'Keystone Habit kya hai?' : 'What is a Keystone Habit?',
          desc: isHinglish ? (
            <>
              Ek aisi high-impact habit (jaise morning workout ya meditation) jo <span className="font-bold text-purple-800">positive domino effect</span> banati hai aur overall daily score ko <span className="font-bold text-slate-900">+20% ya usse zyada</span> badha deti hai.
            </>
          ) : (
            <>
              A single high-impact routine (like morning workout or meditation) that triggers a <span className="font-bold text-purple-800">positive domino effect</span>, raising your overall daily score by <span className="font-bold text-slate-900">+20% or more</span>.
            </>
          )
        }
      ]
    },
    'FOCUS DRAIN': {
      title: 'Focus Drain (Trade-off)',
      icon: 'BatteryLow',
      color: 'amber',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200/80',
      iconBoxClass: 'bg-amber-100 text-amber-700 border border-amber-200/70',
      headerBg: 'bg-amber-50/50',
      headline: 'Energy Trade-off',
      summary: isHinglish ? 'Ek habit par zyada energy lagane se doosri habit miss hona.' : 'When high effort on one habit drains energy from another.',
      details: [
        {
          icon: 'BatteryLow',
          label: isHinglish ? 'Focus Drain kya hai?' : 'What is Focus Drain?',
          desc: isHinglish ? (
            <>
              Jab ek intensive habit me zyada energy lagne ki wajah se doosri habit <span className="font-bold text-amber-800">dopahar ya shaam me miss</span> ho jati hai. Inhe din ke alag-alag hisso me plan karna behtar hai.
            </>
          ) : (
            <>
              Occurs when one intensive habit consumes cognitive bandwidth, causing another habit to slip. Schedule them at different times of the day to eliminate friction.
            </>
          )
        }
      ]
    },
    'GOLDEN HOUR': {
      title: 'Golden Hour (Optimal Time Window)',
      icon: 'schedule',
      color: 'amber',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200/80',
      iconBoxClass: 'bg-amber-100 text-amber-700 border border-amber-200/70',
      headerBg: 'bg-amber-50/50',
      headline: 'Circadian Alignment',
      summary: isHinglish ? 'Wo time window jahan consistency 90%+ rehti hai.' : 'The time window where your consistency peaks above 90%.',
      details: [
        {
          icon: 'schedule',
          label: isHinglish ? 'Golden Hour kya hai?' : 'What is Golden Hour?',
          desc: isHinglish ? (
            <>
              Aapke data se pata chalta hai ki kis time par habit complete karne ki probability sabse highest hoti hai (jaise subah 6-8 AM).
            </>
          ) : (
            <>
              Reveals your highest-probability completion window (e.g. early morning 6-8 AM) where routines face zero friction.
            </>
          )
        }
      ]
    },
    'SUNDAY SLUMP': {
      title: 'Sunday Slump Rhythm',
      icon: 'CalendarBlank',
      color: 'orange',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200/80',
      iconBoxClass: 'bg-orange-100 text-orange-700 border border-orange-200/70',
      headerBg: 'bg-orange-50/50',
      headline: 'Weekend Energy Shift',
      summary: isHinglish ? 'Sundays ko consistency me aane wala dip.' : 'Natural consistency dip on rest days.',
      details: [
        {
          icon: 'CalendarBlank',
          label: isHinglish ? 'Sunday Slump se kaise bachein?' : 'How to navigate Sunday Slump?',
          desc: isHinglish ? (
            <>
              Sundays ko sabhi habits ka pressure lene ke bajaye sirf 1-2 anchor habits maintain karo taaki Monday ka start strong ho.
            </>
          ) : (
            <>
              Instead of aiming for 100% perfection on rest days, protect 1-2 core anchor habits to keep momentum alive.
            </>
          )
        }
      ]
    },
    'MONDAY CHAMPION': {
      title: 'Monday Champion',
      icon: 'Trophy',
      color: 'teal',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-200/80',
      iconBoxClass: 'bg-teal-100 text-teal-700 border border-teal-200/70',
      headerBg: 'bg-teal-50/50',
      headline: 'Fresh Start Momentum',
      summary: isHinglish ? 'Monday mornings me will-power sabse highest hona.' : 'Peak willpower on Monday mornings.',
      details: [
        {
          icon: 'Trophy',
          label: isHinglish ? 'Monday Champion kya hai?' : 'What is Monday Champion?',
          desc: isHinglish ? (
            <>
              Aapka discipline score Monday ko baaki dino se significantly high rehta hai. Is early week momentum ko poore hafte use karo!
            </>
          ) : (
            <>
              Your discipline score on Mondays is significantly higher than other days. Ride this early-week energy into the rest of the week!
            </>
          )
        }
      ]
    },
    'RISING STAR': {
      title: 'Rising Star (Upward Trend)',
      icon: 'trending_up',
      color: 'emerald',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
      iconBoxClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200/70',
      headerBg: 'bg-emerald-50/50',
      headline: 'Continuous Growth',
      summary: isHinglish ? 'Lagatar 7 dino se score me steady growth.' : 'Consistent score increase over 7 consecutive days.',
      details: [
        {
          icon: 'trending_up',
          label: isHinglish ? 'Rising Star kya hai?' : 'What is Rising Star?',
          desc: isHinglish ? (
            <>
              Jab koi habit lagatar grow kar rahi hoti hai aur 7 dino me +25% ya usse zyada ka surge dikhati hai.
            </>
          ) : (
            <>
              Awarded when a habit climbs steadily for 7 consecutive days, surging by +25% or more.
            </>
          )
        }
      ]
    },
    'ATTENTION NEEDED': {
      title: 'Attention Needed (Downward Slip)',
      icon: 'trending_down',
      color: 'rose',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200/80',
      iconBoxClass: 'bg-rose-100 text-rose-700 border border-rose-200/70',
      headerBg: 'bg-rose-50/50',
      headline: 'Early Warning Signal',
      summary: isHinglish ? 'Score me aane wala temporary drop.' : 'Temporary drop in consistency.',
      details: [
        {
          icon: 'trending_down',
          label: isHinglish ? 'Ise kaise reset karein?' : 'How to reset?',
          desc: isHinglish ? (
            <>
              Aadhe ghante ke lambe session ke bajaye sirf 2 minute ka micro-action karo taaki streak aur habit psychology wapas track par aa jaye.
            </>
          ) : (
            <>
              Lower friction with a tiny 2-minute micro session today to reset the downward trajectory.
            </>
          )
        }
      ]
    }
  });

  const guides = getGuide();
  const info = guides[normalizedKey] || guides['POWER DUO'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-[440px] max-h-[90vh] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200/90 z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800">
        
        {/* Header with Archetype Theme */}
        <div className={`flex items-center justify-between p-3 sm:p-4 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-2 ${info.headerBg} border-b border-slate-200/70 shrink-0`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-2xs ${info.iconBoxClass}`}>
              <Icon name={info.icon === 'PlugsConnected' ? 'join_inner' : info.icon === 'RocketLaunch' ? 'rocket_launch' : info.icon === 'Crown' ? 'workspace_premium' : info.icon === 'BatteryLow' ? 'battery_charging_full' : info.icon} className="text-[20px]" />
            </div>
            <div className="min-w-0">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${info.badgeClass}`}>
                {normalizedKey}
              </span>
              <h2 className="font-black text-slate-900 leading-tight text-base sm:text-lg tracking-tight truncate">
                {info.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-slate-500 hover:text-slate-800 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <Icon name="close" className="text-[17px]" />
          </button>
        </div>

        {/* Scrollable Context Details */}
        <div className="overflow-y-auto space-y-3 py-3.5 pr-1 text-slate-600 custom-scrollbar text-xs sm:text-[13px] leading-relaxed">
          
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80">
            <h4 className="font-black text-slate-900 mb-1 text-xs sm:text-[13.5px]">
              {info.headline}
            </h4>
            <p className="text-slate-600 leading-normal">
              {info.summary}
            </p>
          </div>

          {info.details?.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 font-black text-slate-900 text-xs sm:text-[13px]">
                {item.icon && <Icon name={item.icon === 'PlugsConnected' ? 'join_inner' : item.icon === 'RocketLaunch' ? 'rocket_launch' : item.icon === 'Crown' ? 'workspace_premium' : item.icon === 'BatteryLow' ? 'battery_charging_full' : item.icon} className="text-[16px] text-slate-500" />}
                <span>{item.label}</span>
              </div>
              <p className="text-slate-600 leading-normal">
                {item.desc}
              </p>
            </div>
          ))}

        </div>

        {/* Bottom Close Button */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-[#4f39f6] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] active:scale-98 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Icon name="auto_awesome" className="text-white text-[17px]" />
            <span>{isHinglish ? 'Samajh Gaya!' : 'Got it, Thanks!'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

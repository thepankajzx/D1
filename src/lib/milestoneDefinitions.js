// src/lib/milestoneDefinitions.js
import { 
  Sparkle, 
  Lightning, 
  Plant, 
  Brain, 
  ShieldChevron, 
  RocketLaunch, 
  Diamond, 
  Crown, 
  Planet 
} from '@phosphor-icons/react';

export const DEDICATED_MILESTONES = [
  { 
    target: 3, 
    title: '3-Day Ignition', 
    hindiTitle: '3-दिन इग्निशन (Ignition)', 
    desc: 'The spark that starts everything. First 3 consecutive days.',
    hindiDesc: 'पहला स्पार्क - 3 दिन की लगातार और मजबूत शुरुआत!',
    icon: Sparkle, 
    color: 'from-amber-400 to-orange-500', 
    borderColor: 'border-amber-400/40',
    bgLight: 'bg-amber-500/10',
    accentText: 'text-amber-500',
    motto: 'Every giant habit was once a 3-day spark.'
  },
  { 
    target: 7, 
    title: '7-Day Momentum', 
    hindiTitle: '7-दिन मोमेंटम (Momentum)', 
    desc: '1 full week without break. The flywheel begins to turn.',
    hindiDesc: '1 पूरा हफ़्ता बिना रुके - गति और लय पकड़ ली है!',
    icon: Lightning, 
    color: 'from-orange-500 to-amber-600', 
    borderColor: 'border-orange-500/40',
    bgLight: 'bg-orange-500/10',
    accentText: 'text-orange-500',
    motto: 'Momentum is gravity working in your favor.'
  },
  { 
    target: 14, 
    title: '14-Day Habit Seed', 
    hindiTitle: '14-दिन आदत का बीज (Habit Seed)', 
    desc: '2 weeks of consistency. Roots are firmly planted in soil.',
    hindiDesc: '2 हफ़्ते - जड़ें ज़मीन में मज़बूती से जम चुकी हैं!',
    icon: Plant, 
    color: 'from-emerald-500 to-teal-600', 
    borderColor: 'border-emerald-500/40',
    bgLight: 'bg-emerald-500/10',
    accentText: 'text-emerald-500',
    motto: 'Water the seed every day and watch it become unbreakable.'
  },
  { 
    target: 21, 
    title: '21-Day Neural Path', 
    hindiTitle: '21-दिन दिमागी सर्किट (Neural Path)', 
    desc: 'The classical threshold. New synaptic pathway formed.',
    hindiDesc: '21 दिन का नियम - दिमाग में नया न्यूरल पाथवे लॉक हो गया!',
    icon: Brain, 
    color: 'from-cyan-500 to-blue-600', 
    borderColor: 'border-cyan-500/40',
    bgLight: 'bg-cyan-500/10',
    accentText: 'text-cyan-500',
    motto: 'Your brain now defaults to action rather than resistance.'
  },
  { 
    target: 30, 
    title: '30-Day Solid Iron', 
    hindiTitle: '30-दिन ठोस लोहा (Solid Iron)', 
    desc: '1 full month. Discipline forged under pressure.',
    hindiDesc: '1 पूरा महीना - अनुशासन अब ठोस लोहे जैसा पक्का बन चुका है!',
    icon: ShieldChevron, 
    color: 'from-blue-600 to-indigo-600', 
    borderColor: 'border-blue-500/40',
    bgLight: 'bg-blue-500/10',
    accentText: 'text-blue-500',
    motto: 'Iron sharpens iron; repetition sharpens will.'
  },
  { 
    target: 60, 
    title: '60-Day Unstoppable', 
    hindiTitle: '60-दिन अजेय रफ़्तार (Unstoppable)', 
    desc: '2 months of mastery. Velocity overcomes all obstacles.',
    hindiDesc: '2 महीने - अब आपको कोई बाहरी रुकावट नहीं डिगा सकती!',
    icon: RocketLaunch, 
    color: 'from-purple-500 to-pink-600', 
    borderColor: 'border-purple-500/40',
    bgLight: 'bg-purple-500/10',
    accentText: 'text-purple-500',
    motto: 'You no longer negotiate with daily fatigue.'
  },
  { 
    target: 90, 
    title: '90-Day New Identity', 
    hindiTitle: '90-दिन नई पहचान (New Identity)', 
    desc: 'Quarter of a year. It is no longer what you do, but who you are.',
    hindiDesc: '90 दिन - यह आदत अब सिर्फ़ काम नहीं, आपकी पहचान बन चुकी है!',
    icon: Diamond, 
    color: 'from-pink-500 to-rose-600', 
    borderColor: 'border-pink-500/40',
    bgLight: 'bg-pink-500/10',
    accentText: 'text-pink-500',
    motto: 'Identity is the ultimate habit anchor.'
  },
  { 
    target: 180, 
    title: '180-Day Titan', 
    hindiTitle: '180-दिन टाइटन (Titan)', 
    desc: 'Half a year of continuous excellence. Elite tier consistency.',
    hindiDesc: 'आधा साल - चैंपियन स्तर का अटूट और अडिग अनुशासन!',
    icon: Crown, 
    color: 'from-amber-400 to-yellow-600', 
    borderColor: 'border-yellow-400/40',
    bgLight: 'bg-yellow-500/10',
    accentText: 'text-yellow-500',
    motto: 'Titans do not rely on motivation; they build monuments.'
  },
  { 
    target: 365, 
    title: '365-Day Grandmaster', 
    hindiTitle: '365-दिन ग्रैंडमास्टर (Grandmaster)', 
    desc: '1 full year of triumph. The pinnacle of human consistency.',
    hindiDesc: '1 पूरा साल (365 दिन) - आदत का सर्वोच्च शिखर हासिल!',
    icon: Planet, 
    color: 'from-yellow-400 via-amber-500 to-red-500', 
    borderColor: 'border-red-400/40',
    bgLight: 'bg-rose-500/10',
    accentText: 'text-rose-500',
    motto: 'A 365-day master changes the trajectory of a lifetime.'
  }
];

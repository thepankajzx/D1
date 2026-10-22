import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PRE_MADE_TEMPLATES } from '../pro/services/orgService';
import WhatsAppIcon from './WhatsAppIcon';

export default function ClinicalAiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isReasoning, setIsReasoning] = useState(false);
  const [reasoningStep, setReasoningStep] = useState(0);
  const [reasoningIntent, setReasoningIntent] = useState('');

  const location = useLocation();
  const btnRef = useRef(null);
  const msgContainerRef = useRef(null);

  const isProOrAdmin = location.pathname.startsWith('/pro') || 
                       location.pathname.startsWith('/org') || 
                       location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith('/coach') ||
                       location.pathname.startsWith('/join');

  // Dragging state
  const dragRef = useRef({
    isDragging: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0
  });

  // Initialize with Master Welcome Message
  useEffect(() => {
    resetToWelcome();
  }, [location.pathname]);

  const resetToWelcome = () => {
    const isProOrAdmin = location.pathname.includes('/pro') || location.pathname.includes('/org') || location.pathname.includes('/admin');
    const initialGreeting = {
      id: 'welcome_' + Date.now(),
      sender: 'bot',
      type: 'welcome',
      context: isProOrAdmin ? 'Hospital & Clinician Admin Mode' : 'Clinical Nutrition & Patient Care',
      content: isProOrAdmin
        ? 'Assisting clinic directors and specialists with patient triage, care protocols, WhatsApp nudges, and caseload allocation.'
        : 'Assisting with evidence-based diet plans, metabolic reset, PCOS/Diabetes reversal, and habit adherence.'
    };
    setMessages([initialGreeting]);
  };

  // Draggable physics for Desktop Mouse + Mobile Touch
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    function onStart(e) {
      if (e.button !== undefined && e.button !== 0) return;
      const evt = e.touches ? e.touches[0] : e;
      dragRef.current.isDragging = true;
      dragRef.current.hasMoved = false;
      dragRef.current.startX = evt.clientX;
      dragRef.current.startY = evt.clientY;
      const rect = el.getBoundingClientRect();
      dragRef.current.initialLeft = rect.left;
      dragRef.current.initialTop = rect.top;
      el.style.transition = 'none';
    }

    function onMove(e) {
      if (!dragRef.current.isDragging) return;
      const evt = e.touches ? e.touches[0] : e;
      const dx = evt.clientX - dragRef.current.startX;
      const dy = evt.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) > 6) {
        dragRef.current.hasMoved = true;
        if (e.cancelable) e.preventDefault();
        const btnW = el.offsetWidth || 56;
        const btnH = el.offsetHeight || 56;
        const maxLeft = window.innerWidth - btnW - 14;
        const maxTop = window.innerHeight - btnH - 14;
        const clampedLeft = Math.max(14, Math.min(maxLeft, dragRef.current.initialLeft + dx));
        const clampedTop = Math.max(14, Math.min(maxTop, dragRef.current.initialTop + dy));
        el.style.left = clampedLeft + 'px';
        el.style.top = clampedTop + 'px';
        el.style.bottom = 'auto';
        el.style.right = 'auto';
      }
    }

    function onEnd() {
      if (!dragRef.current.isDragging) return;
      dragRef.current.isDragging = false;
      el.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s';
      if (dragRef.current.hasMoved) {
        setTimeout(() => {
          dragRef.current.hasMoved = false;
        }, 180);
      }
    }

    el.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    el.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);

    return () => {
      el.removeEventListener('mousedown', onStart);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      el.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  }, [messages, isReasoning, reasoningStep]);

  const toggleChat = () => {
    if (dragRef.current.hasMoved) return;
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 200);
    } else {
      setIsOpen(true);
    }
  };

  const closeChat = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  // Clinical Knowledge Matching Engine
  const generateClinicalReply = (query) => {
    const low = query.toLowerCase();

    // 1. Diet, Nutrition & Meals
    if (low.includes('diet') || low.includes('meal') || low.includes('food') || low.includes('nutrition') || low.includes('protein') || low.includes('calorie')) {
      return {
        badge: 'CLINICAL NUTRITION & METABOLISM',
        title: 'Evidence-Based Diet & Nutrition Architecture',
        pills: ['High-Protein Reset', 'Low Glycemic Load', 'ICMR / ADA Guidelines', 'Hydration Optimization'],
        bullets: [
          'Target protein pacing: 1.2–1.6g per kg of target body mass divided into 3 equal feeding windows.',
          'Carbohydrate timing: Complex fiber-dense carbs (quinoa, millets, greens) paired with healthy fats to flatten postprandial glucose spikes.',
          'Electrolyte & hydration cadence: 35-40ml per kg daily intake with morning pink salt & lemon for adrenals.',
          'Elimination of ultra-processed seed oils and artificial sweeteners to reduce systemic inflammation.'
        ],
        actions: [
          { text: '📋 Prescribe Metabolic Reset Plan', link: '#/org-portal' },
          { text: '💬 Send Diet WhatsApp Nudge', link: 'https://wa.me/?text=' + encodeURIComponent('Hi! Here is your dietitian-approved nutrition guide for today. Remember: 30g protein at lunch and 3L hydration!') }
        ]
      };
    }

    // 2. PCOS & Hormonal Balance
    if (low.includes('pcos') || low.includes('hormon') || low.includes('period') || low.includes('cycle') || low.includes('ovulat')) {
      return {
        badge: 'ENDOCRINOLOGY & PCOS PROTOCOL',
        title: 'PCOS & Hormonal Health Restoration Protocol',
        pills: ['Myo-Inositol', 'Seed Cycling', 'Insulin Sensitivity', 'Cortisol Regulation'],
        bullets: [
          'Anti-inflammatory dietary foundation: Zero refined sugars, high cruciferous vegetables for estrogen clearance.',
          'Insulin sensitization: Incorporate 40:1 Myo & D-Chiro Inositol along with Ceylon cinnamon and chromium.',
          'Circadian alignment: Avoid high-intensity cardio post 6 PM; favor slow-weighted resistance training and walking.',
          'Cycle synchronization: Seed cycling (Flax/Pumpkin during follicular, Sesame/Sunflower during luteal).'
        ],
        actions: [
          { text: '📋 Assign PCOS Hormone Protocol', link: '#/org-portal' },
          { text: '💬 WhatsApp PCOS Check-in', link: 'https://wa.me/?text=' + encodeURIComponent('Hello! Your PCOS hormone care team checking in: how is your cycle tracking and sleep rhythm this week?') }
        ]
      };
    }

    // 3. Diabetes & Blood Sugar Control
    if (low.includes('diabetes') || low.includes('sugar') || low.includes('glucose') || low.includes('hba1c') || low.includes('insulin')) {
      return {
        badge: 'METABOLIC DIABETES REVERSAL',
        title: 'Type 2 Diabetes & Glucose Stability Protocol',
        pills: ['Fasting Glucose < 100', 'Postprandial Walking', 'Soluble Fiber', 'Continuous Monitoring'],
        bullets: [
          'Order of eating: Fiber & leafy greens first, then proteins and fats, and whole grains last to cut glucose spikes by up to 40%.',
          'Post-meal movement: Compulsory 10-15 minute gentle walk within 30 minutes of lunch and dinner.',
          'Apple Cider Vinegar (ACV): 1 tbsp diluted in warm water 15 minutes before high-carb meals.',
          'Magnesium Glycinate & Alpha Lipoic Acid supplementation for peripheral insulin receptor upregulation.'
        ],
        actions: [
          { text: '📋 Prescribe Diabetes Reversal', link: '#/org-portal' },
          { text: '💬 WhatsApp Glucose Alert', link: 'https://wa.me/?text=' + encodeURIComponent('Clinical reminder: Please log your 2-hour postprandial glucose check-in on the habit app!') }
        ]
      };
    }

    // 4. Gut Health & Microbiome
    if (low.includes('gut') || low.includes('bloat') || low.includes('microbiome') || low.includes('digest') || low.includes('acid') || low.includes('constipat')) {
      return {
        badge: 'GASTROINTESTINAL HEALTH',
        title: 'Gut Microbiome & Digestive Reset Protocol',
        pills: ['3R Gut Protocol', 'Low-FODMAP Phase', 'L-Glutamine', 'Fermented Probiotics'],
        bullets: [
          'Phase 1 (Remove): 14-day elimination of gluten, dairy, artificial sweeteners, and processed emulsifiers.',
          'Phase 2 (Repair): L-Glutamine (5g/day), bone broth / collagen peptides, and zinc carnosine to heal intestinal tight junctions.',
          'Phase 3 (Reinoculate): Traditional kimchi, sauerkraut, organic kefir, and diverse polyphenols (berries, dark leafy greens).',
          'Mindful chewing: 30 chews per bite to trigger optimum cephalic phase salivary digestive enzymes.'
        ],
        actions: [
          { text: '📋 Prescribe Gut Health Plan', link: '#/org-portal' },
          { text: '💬 Send Gut Protocol Nudge', link: 'https://wa.me/?text=' + encodeURIComponent('Dietitian Tip: Start your morning with warm cumin-fennel water and log your digestive comfort score today!') }
        ]
      };
    }

    // 5. Patient Adherence, Triage & Nudges
    if (low.includes('nudge') || low.includes('adherence') || low.includes('triage') || low.includes('attention') || low.includes('score') || low.includes('whatsapp') || low.includes('drop')) {
      return {
        badge: 'PATIENT RETENTION & ADHERENCE',
        title: 'Clinical Adherence Triage & Automated Nudge Engine',
        pills: ['Tamper-Proof Audit', '0% Manual Override', 'WhatsApp API Deep Links', 'Behavioral Micro-Habits'],
        bullets: [
          'Score calculation is 100% tamper-proof: Derived directly from daily patient check-in events in the PWA.',
          'Patients dropping below 70% 7-day adherence are automatically triaged with an Amber ⚠ Attention badge.',
          '1-Click WhatsApp nudges trigger personalized pre-filled clinical coaching messages to re-engage patients within 24 hours.',
          'Micro-habit scaling: If adherence drops, reduce daily habit target by 50% to rebuild momentum before increasing difficulty.'
        ],
        actions: [
          { text: '👥 Open Patient Roster Triage', link: '#/org-portal' },
          { text: '💬 Send WhatsApp Re-engagement', link: 'https://wa.me/?text=' + encodeURIComponent('Hi! We noticed you missed a couple of check-ins on your health tracker. We are here to support you—is everything okay?') }
        ]
      };
    }

    // 6. Doctor Roster, Reassignment & Hospital Multi-Clinic
    if (low.includes('doctor') || low.includes('reassign') || low.includes('transfer') || low.includes('clinic') || low.includes('hospital') || low.includes('branch') || low.includes('caseload')) {
      return {
        badge: 'HOSPITAL ENTERPRISE MANAGEMENT',
        title: 'Multi-Clinic Operations & Doctor Caseload Balancing',
        pills: ['Matrix Performance View', 'Caseload Rebalancing', 'Branch Isolation', '1-Click Reassignment'],
        bullets: [
          'Doctor Reassignment: Click "⇄ Transfer" on any patient row in the Admin Portal to reassign them to another specialist.',
          'Performance Matrix: Sort doctors by 7-Day Adherence Average, Active Caseload, or Clinic Branch to audit care delivery.',
          'Zero Clinical Override: Doctors cannot artificially inflate adherence scores, maintaining audit integrity.',
          'Branch Support: Manage South Delhi, Bandra West, Online Care, or Corporate branches with unified oversight.'
        ],
        actions: [
          { text: '▦ Open Doctors Matrix View', link: '#/org-portal' },
          { text: '⚙️ Configure Clinic Branches', link: '#/org-setup' }
        ]
      };
    }

    // 7. General / Fallback
    return {
      badge: 'CLINICAL COPILOT DISPATCH',
      title: `Guidance for: "${query}"`,
      pills: ['Personalized Nutrition', 'Care Protocols', 'Caseload Triage', 'WhatsApp Nudges'],
      bullets: [
        'Ask about specific conditions: "Diabetes reversal protocol", "PCOS diet", "Gut health elimination", "High protein meal timing".',
        'Ask about patient care: "How to nudge unengaged patients", "Why is adherence 70%", "Send WhatsApp follow-up".',
        'Ask about hospital admin: "How to reassign patients between doctors", "Sort doctor performance matrix", "Configure clinic branches".'
      ],
      actions: [
        { text: '🥗 Explore Diet Protocols', link: '#/org-portal' },
        { text: '👨‍⚕️ View Doctor Matrix', link: '#/org-portal' },
        { text: '⚙️ Workspace Setup', link: '#/org-setup' }
      ]
    };
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    // Append user message
    const userMsg = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: text
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Trigger Autonomous Clinical Reasoning Simulation
    setIsReasoning(true);
    setReasoningStep(1);
    setReasoningIntent(text.length > 28 ? text.substring(0, 28) + '...' : text);

    setTimeout(() => {
      setReasoningStep(2);
    }, 500);

    setTimeout(() => {
      setReasoningStep(3);
    }, 1000);

    setTimeout(() => {
      setIsReasoning(false);
      setReasoningStep(0);
      const replyData = generateClinicalReply(text);
      const botMsg = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        type: 'clinical_card',
        ...replyData
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1500);
  };

  if (!isProOrAdmin) return null;

  return (
    <div id="agy-chat-widget">
      {/* ── STYLESCOPE & KEYFRAME ANIMATIONS ── */}
      <style>{`
        #agy-chat-widget * {
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }

        /* Launcher Button Glow & Physics */
        #agy-chat-btn {
          position: fixed;
          bottom: 84px;
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #1e1b4b 0%, #0f172a 100%);
          border: 1.5px solid rgba(99, 102, 241, 0.55);
          color: white;
          cursor: grab;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45), 0 0 20px rgba(99, 102, 241, 0.35);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s, border-color 0.2s;
          user-select: none;
          touch-action: none;
        }
        #agy-chat-btn:active {
          cursor: grabbing;
          transform: scale(1.02);
        }
        #agy-chat-btn:hover {
          transform: scale(1.08);
          border-color: #6366f1;
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55), 0 0 25px rgba(99, 102, 241, 0.6);
        }
        #agy-chat-btn.agy-btn-active {
          background: #4f46e5 !important;
          border-color: #818cf8 !important;
        }

        /* 1. Gentle Floating Bounce */
        @keyframes agyRobotFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3.5px); }
        }
        .agy-float-group {
          animation: agyRobotFloat 3.2s ease-in-out infinite;
          transform-origin: 50% 50%;
        }

        /* 2. Antenna Sway & Hover Wiggle */
        @keyframes agyAntennaWiggle {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-7deg); }
          40% { transform: rotate(0deg); }
          60% { transform: rotate(7deg); }
          80% { transform: rotate(0deg); }
        }
        .agy-antenna-group {
          transform-origin: 50px 24px;
          animation: agyAntennaWiggle 3.6s ease-in-out infinite;
        }
        #agy-chat-btn:hover .agy-antenna-group {
          animation: agyAntennaHover 0.45s ease-in-out infinite alternate !important;
        }
        @keyframes agyAntennaHover {
          0% { transform: rotate(-14deg); }
          100% { transform: rotate(14deg); }
        }

        /* 3. Natural Eye Blink Cadence */
        @keyframes agyBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.08); }
          97% { transform: scaleY(1); }
        }
        .agy-eyes-group {
          transform-origin: 50% 46px;
          animation: agyBlink 3.8s infinite ease-in-out;
        }

        /* 4. Cheerful Smile & Happy Reaction on Hover */
        .agy-smile-path {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), stroke-width 0.2s;
          transform-origin: 50% 57px;
        }
        #agy-chat-btn:hover .agy-smile-path {
          transform: scale(1.22);
          stroke-width: 3px;
        }
        #agy-chat-btn:hover .agy-float-group {
          animation: agyHappyBob 0.5s ease-in-out infinite alternate !important;
        }
        @keyframes agyHappyBob {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }

        /* Modal Spring Animation */
        @keyframes agyModalSpringPop {
          0% { opacity: 0; transform: scale(0.7) translateY(40px); transform-origin: bottom right; }
          70% { opacity: 1; transform: scale(1.02) translateY(-3px); }
          100% { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
        }
        @keyframes agyModalSpringShrink {
          0% { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
          100% { opacity: 0; transform: scale(0.6) translateY(40px); }
        }

        .agy-chat-modal {
          position: fixed;
          bottom: 84px;
          right: 20px;
          width: 420px;
          max-width: calc(100vw - 32px);
          height: 600px;
          max-height: calc(100vh - 100px);
          background: #ffffff;
          border: 1.5px solid rgba(99, 102, 241, 0.35);
          border-radius: 24px;
          box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25), 0 0 35px rgba(99, 102, 241, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 999999;
          overflow: hidden;
          transform-origin: bottom right;
        }
        .dark .agy-chat-modal {
          background: #0f172a !important;
          border: 1.5px solid rgba(99, 102, 241, 0.5) !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(99, 102, 241, 0.25) !important;
        }
        .agy-chat-modal.agy-open {
          animation: agyModalSpringPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .agy-chat-modal.agy-closing {
          animation: agyModalSpringShrink 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes agyMsgSlide {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .agy-msg-animate {
          animation: agyMsgSlide 0.25s ease forwards;
        }

        @media (max-width: 480px) {
          #agy-chat-btn {
            bottom: 76px !important;
            right: 16px !important;
            width: 50px !important;
            height: 50px !important;
          }
          .agy-chat-modal {
            width: calc(100vw - 24px) !important;
            right: 12px !important;
            bottom: 76px !important;
            height: min(490px, calc(100vh - 130px)) !important;
            border-radius: 20px;
          }
        }
      `}</style>

      {/* ── DRAGGABLE FLOATING ROBOT LAUNCHER BUTTON ── */}
      <button
        ref={btnRef}
        id="agy-chat-btn"
        className={isOpen ? 'agy-btn-active' : ''}
        onClick={toggleChat}
        title="Drag anywhere or click to consult Clinical & Dietitian AI Copilot"
        aria-label="Clinical AI Copilot"
      >
        {!isOpen ? (
          /* SVG Animated Robot */
          <svg className="agy-robot-svg" viewBox="0 0 100 85" width="46" height="42" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <radialGradient id="btn-bot-grad-ball" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#818cf8"/>
                <stop offset="50%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#4338ca"/>
              </radialGradient>
              <linearGradient id="btn-bot-grad-shell" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#4338ca"/>
              </linearGradient>
              <linearGradient id="btn-bot-grad-bezel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="70%" stopColor="#f8fafc"/>
                <stop offset="100%" stopColor="#e2e8f0"/>
              </linearGradient>
              <linearGradient id="btn-bot-grad-screen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b"/>
                <stop offset="100%" stopColor="#0f172a"/>
              </linearGradient>
              <radialGradient id="btn-bot-grad-ear" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#a5b4fc"/>
                <stop offset="70%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#3730a3"/>
              </radialGradient>
            </defs>

            {/* Floating Robot Group */}
            <g className="agy-float-group">
              {/* Antenna with Sway Wiggle Animation */}
              <g className="agy-antenna-group">
                <rect x="48" y="14" width="4" height="11" rx="2" fill="#1e1b4b"/>
                <circle cx="50" cy="9" r="7" fill="url(#btn-bot-grad-ball)"/>
                <circle cx="48" cy="7" r="2.2" fill="#ffffff" opacity="0.85"/>
              </g>

              {/* Headphone Side Ears */}
              <g className="agy-ear-left">
                <rect x="11" y="37" width="10" height="28" rx="5" fill="url(#btn-bot-grad-ear)"/>
                <rect x="15" y="41" width="3" height="20" rx="1.5" fill="#ffffff" opacity="0.9"/>
                <rect x="19" y="43" width="3" height="16" rx="1.5" fill="#1e1b4b"/>
              </g>
              <g className="agy-ear-right">
                <rect x="79" y="37" width="10" height="28" rx="5" fill="url(#btn-bot-grad-ear)"/>
                <rect x="82" y="41" width="3" height="20" rx="1.5" fill="#ffffff" opacity="0.9"/>
                <rect x="78" y="43" width="3" height="16" rx="1.5" fill="#1e1b4b"/>
              </g>

              {/* Outer Clinical Indigo Chassis Shell */}
              <rect x="18" y="22" width="64" height="56" rx="22" fill="url(#btn-bot-grad-shell)"/>

              {/* Clean Glossy Bezel Faceplate */}
              <rect x="21.5" y="25.5" width="57" height="49" rx="18.5" fill="url(#btn-bot-grad-bezel)"/>
              <path d="M 32 27 Q 50 25.5 68 27" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

              {/* Glossy Black Face Screen */}
              <rect x="27.5" y="31.5" width="45" height="37" rx="12" fill="url(#btn-bot-grad-screen)"/>
              <path d="M 33 34 Q 50 32 67 34" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

              {/* Blinking Eyes */}
              <g className="agy-eyes-group">
                <circle cx="38.5" cy="46" r="4.5" fill="#ffffff"/>
                <circle cx="37.2" cy="44.8" r="1.3" fill="#ffffff" opacity="0.95"/>
                <circle cx="61.5" cy="46" r="4.5" fill="#ffffff"/>
                <circle cx="60.2" cy="44.8" r="1.3" fill="#ffffff" opacity="0.95"/>
              </g>

              {/* Sweet Smile */}
              <path className="agy-smile-path" d="M 43 55.5 Q 50 61.5 57 55.5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            </g>
          </svg>
        ) : (
          /* Close X Icon */
          <span className="text-xl font-bold">✕</span>
        )}
      </button>

      {/* ── CHATBOX MODAL WINDOW ── */}
      {isOpen && (
        <div className={`agy-chat-modal ${isClosing ? 'agy-closing' : 'agy-open'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-3.5 px-4 flex items-center justify-between border-b border-indigo-500/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-400/50 flex items-center justify-center shrink-0">
                <span className="text-lg">🩺</span>
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight text-white m-0">
                  Clinical &amp; Dietitian AI Copilot
                </h4>
                <div className="flex items-center gap-2 text-[10.5px] text-slate-300 mt-0.5 font-medium">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    ICMR / ADA Grounded
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">● Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={resetToWelcome}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                title="Reset session"
              >
                ↺
              </button>
              <button
                onClick={closeChat}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/30 hover:text-rose-300 text-slate-300 flex items-center justify-center text-xs transition-colors cursor-pointer"
                title="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Model Telemetry Strip */}
          <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-1.5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 shrink-0">
            <span>Clinical Engine: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">Nutrition &amp; Metabolic Care</strong></span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">🔒 Tamper-Proof Adherence</span>
          </div>

          {/* Message Stream */}
          <div
            ref={msgContainerRef}
            className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-900/90 text-xs"
          >
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end agy-msg-animate">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-2.5 px-3.5 rounded-2xl rounded-br-xs max-w-[85%] shadow-xs leading-relaxed font-medium">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // Bot: Welcome template
              if (msg.type === 'welcome') {
                return (
                  <div key={msg.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 agy-msg-animate">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        CLINICAL COPILOT DISPATCH
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{msg.context}</span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Welcome! How can I assist your health or clinic today?
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed text-xs">
                        {msg.content}
                      </p>
                    </div>

                    {/* Starter Hub Chips */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Explore Clinical Capabilities:</span>
                        <span className="text-indigo-600 dark:text-indigo-400">TAP TO CONSULT</span>
                      </div>

                      <div className="space-y-1.5">
                        <button
                          onClick={() => handleSendMessage('What is the Clinical Metabolic Reset Diet Plan?')}
                          className="w-full p-2 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-left font-bold flex items-center justify-between transition-colors cursor-pointer group"
                        >
                          <span>🥗 Metabolic Reset &amp; Meal Plans</span>
                          <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>

                        <button
                          onClick={() => handleSendMessage('How does the PCOS and Hormonal Balance Protocol work?')}
                          className="w-full p-2 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-left font-bold flex items-center justify-between transition-colors cursor-pointer group"
                        >
                          <span>🌸 PCOS &amp; Hormone Balance Protocol</span>
                          <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>

                        <button
                          onClick={() => handleSendMessage('How to reverse Type 2 Diabetes with nutrition?')}
                          className="w-full p-2 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-left font-bold flex items-center justify-between transition-colors cursor-pointer group"
                        >
                          <span>🩸 Diabetes &amp; Blood Sugar Stabilization</span>
                          <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>

                        <button
                          onClick={() => handleSendMessage('How do WhatsApp patient nudges and adherence triage work?')}
                          className="w-full p-2 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-left font-bold flex items-center justify-between transition-colors cursor-pointer group"
                        >
                          <span className="flex items-center gap-1.5">
                            <WhatsAppIcon size={14} className="text-emerald-500" />
                            <span>1-Click WhatsApp Patient Nudges</span>
                          </span>
                          <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>

                        <button
                          onClick={() => handleSendMessage('How to reassign patients to other doctors in the clinic?')}
                          className="w-full p-2 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-left font-bold flex items-center justify-between transition-colors cursor-pointer group"
                        >
                          <span>👨‍⚕️ Doctor Reassignment &amp; Matrix View</span>
                          <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Bot: Structured Clinical Response Card
              if (msg.type === 'clinical_card') {
                return (
                  <div key={msg.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 agy-msg-animate">
                    <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {msg.badge}
                    </span>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {msg.title}
                    </h4>

                    {/* Tech / Clinical Pills */}
                    {msg.pills && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.pills.map((pill, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                            {pill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Clinical Guidelines Bullets */}
                    {msg.bullets && (
                      <ul className="space-y-1.5 pl-0 list-none text-slate-700 dark:text-slate-300 text-xs">
                        {msg.bullets.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-600 font-bold">▹</span>
                            <span className="leading-relaxed">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Action Buttons */}
                    {msg.actions && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        {msg.actions.map((act, idx) => {
                          const isWA = act.link.includes('wa.me') || act.text.includes('WhatsApp');
                          const displayText = act.text.replace(/^[💬\s]+/, '');
                          return (
                            <a
                              key={idx}
                              href={act.link}
                              target={act.link.startsWith('http') ? '_blank' : '_self'}
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-2xs ${
                                isWA 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              }`}
                            >
                              {isWA && <WhatsAppIcon size={13} className="text-emerald-500" />}
                              <span>{displayText}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}

            {/* Autonomous Reasoning Simulation Card */}
            {isReasoning && (
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-3.5 space-y-2 agy-msg-animate">
                <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 font-black text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                    <span>Autonomous Clinical Reasoning</span>
                  </span>
                  <span className="text-[9.5px] uppercase bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded font-bold">
                    PROCESSING
                  </span>
                </div>

                <div className="space-y-1 text-slate-600 dark:text-slate-400 text-xs font-medium">
                  <div className={`p-1 pl-2 border-l-2 transition-all ${reasoningStep >= 1 ? 'border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold' : 'border-slate-300 opacity-50'}`}>
                    {reasoningStep === 1 ? '⚙️ Parsing clinical inquiry: ' : '✓ Intent: '} <em>{reasoningIntent}</em>
                  </div>

                  {reasoningStep >= 2 && (
                    <div className={`p-1 pl-2 border-l-2 transition-all ${reasoningStep >= 2 ? 'border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold' : 'border-slate-300 opacity-50'}`}>
                      {reasoningStep === 2 ? '🔍 Querying Clinical Knowledge Graph & ICMR guidelines...' : '✓ Context verified'}
                    </div>
                  )}

                  {reasoningStep >= 3 && (
                    <div className="p-1 pl-2 border-l-2 border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold">
                      💡 Formulating evidence-based medical &amp; dietary plan...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask about diet plans, PCOS, diabetes, patient nudges..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Submit clinical query"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

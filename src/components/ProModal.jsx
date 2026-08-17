import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProModal({ isOpen, onClose, source }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Determine the dynamic text based on the source
  let description = "";
  if (source === "custom_habit_creation") {
    description = (
      <>Reached your free limit?<br /><strong>Unlock unlimited custom habits</strong> with Pro.</>
    );
  } else if (source === "total_habits_limit") {
    description = (
      <>Reached your free limit?<br /><strong>Track 10+ habits at once</strong> with Pro.</>
    );
  } else if (source === "custom_analytics") {
    description = (
      <>Want deeper insights?<br /><strong>Unlock Advanced Analytics</strong> for Custom Habits with Pro.</>
    );
  } else {
    description = (
      <>Reached your free limit?<br /><strong>Unlock unlimited tracking</strong> with Pro.</>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-center p-5 bg-[#3b3d44]/90 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-[24px] p-10 pt-10 pb-8 max-w-[360px] w-full text-center relative shadow-[0_8px_24px_rgba(0,0,0,0.2)]" 
        onClick={e => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-none bg-[#f0f0f0] cursor-pointer flex items-center justify-center text-[#333] transition-colors hover:bg-[#e0e0e0]" 
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <h1 className="text-[26px] font-[800] text-black mb-5 flex items-center justify-center gap-2.5">
          Upgrade to
          <span className="bg-black text-white text-[14px] font-[700] py-1 px-3 rounded-[20px] inline-flex items-center gap-1 tracking-[0.5px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            PRO
          </span>
        </h1>

        <p className="text-black text-[17px] leading-[1.4] mb-8 px-1">
          {description}
        </p>

        <div className="flex flex-col gap-3">
          <button 
            className="w-full p-4 rounded-[12px] text-[16px] font-[700] cursor-pointer border-none transition-transform active:scale-[0.98] bg-black text-white"
            onClick={() => {
                onClose();
                navigate('/subscription');
            }}
          >
            Unlock Pro Now
          </button>
          <button 
            className="w-full p-4 rounded-[12px] text-[16px] font-[700] cursor-pointer transition-transform active:scale-[0.98] bg-white text-black border border-black"
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

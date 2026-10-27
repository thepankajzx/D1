import React from 'react';
import Icon from './Icon';
import { Buildings, Crown, CheckCircle, Robot, ArrowRight } from '@phosphor-icons/react';

export default function B2bEnterpriseSection({
  isHinglish,
  currentUser,
  openSections,
  toggleSection,
  navigate
}) {
  return (
    <section className="bg-white dark:bg-[#131722] border border-indigo-200/90 dark:border-indigo-900/70 rounded-2xl overflow-hidden shadow-2xs transition-all">
      <button 
        type="button"
        onClick={() => toggleSection('b2bSection')}
        className="w-full p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 active:bg-indigo-100/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-2xs">
            <Buildings size={18} weight="fill" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate">
                {isHinglish ? 'B2B एंटरप्राइज हब' : 'B2B Enterprise & Institutional Hub'}
              </h2>
              <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                Master Admin
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {isHinglish ? 'संस्थान प्रबंधन, डॉक्टर डायरेक्टरी व क्लिनिकल वर्कस्पेस' : 'Multi-tenant clinical management, institutions & practitioner portals'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Icon name={openSections.b2bSection ? "expand_less" : "expand_more"} className="text-indigo-500 text-xl" />
        </div>
      </button>

      {openSections.b2bSection && (
        <div className="p-3.5 sm:p-4 pt-4 border-t border-indigo-100 dark:border-indigo-950/80 space-y-3 animate-in fade-in duration-150">
          {/* Quick Info Badge */}
          <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
              <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 truncate">
                Authorized B2B Master: <strong className="font-black">{currentUser?.email || 'Administrator'}</strong>
              </span>
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#10141d] px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/40 shrink-0">
              Web Only
            </span>
          </div>

          {/* Grid of B2B Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Super Admin Command Center */}
            <div 
              onClick={() => navigate('/super-admin')}
              className="p-3 rounded-xl bg-white dark:bg-[#10141d] hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <Crown size={15} weight="fill" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">Master Command Center</span>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Platform Control
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
                Institutions registry, organization onboarding token generator, and master token list.
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                <span>Open Command Center</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>

            {/* 2. Organization Admin Portal */}
            <div 
              onClick={() => navigate('/org-portal')}
              className="p-3 rounded-xl bg-white dark:bg-[#10141d] hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Buildings size={15} weight="fill" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">Org Admin Portal</span>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Clinic Portal
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
                Hospital and clinic admin, specialists directory, patient rosters, and WhatsApp invitations.
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                <span>Open Org Portal</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>

            {/* 3. New Organization Setup */}
            <div 
              onClick={() => navigate('/org-setup')}
              className="p-3 rounded-xl bg-white dark:bg-[#10141d] hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle size={15} weight="fill" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">Register Institution</span>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Onboard
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
                Setup custom branding, domain, specialties, and initialize enterprise workspace.
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                <span>Launch Setup Wizard</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>

            {/* 4. Practitioner & Coach Workspace */}
            <div 
              onClick={() => navigate('/pro')}
              className="p-3 rounded-xl bg-white dark:bg-[#10141d] hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Robot size={15} weight="fill" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">Practitioner Workspace</span>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Pro / Coach
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
                Doctor & dietitian client tracking, Clinical AI Copilot, and compliance audits.
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                <span>Open Practitioner View</span>
                <ArrowRight size={12} weight="bold" />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

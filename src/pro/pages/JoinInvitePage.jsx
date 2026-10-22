import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/Icon';
import { getInviteByCode, redeemInviteAndLink } from '../services/proService';
import { getProTypeConfig } from '../proConfig';

export default function JoinInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const codeParam = searchParams.get('code') || '';
  const [inputCode, setInputCode] = useState(codeParam || 'APEX9-STAR1');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'Riya');
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Automatically load invite (using query param or default demo invite)
    loadInvite(codeParam || 'APEX9-STAR1');
  }, [codeParam]);

  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [currentUser]);

  async function loadInvite(code) {
    setError(null);
    setLoading(true);
    try {
      const found = await getInviteByCode(code);
      if (found) {
        setInvite(found);
        if (found.clientLabel && !displayName) {
          setDisplayName(found.clientLabel);
        }
      } else {
        // Fallback default invitation from Dr. Sarah Sharma for testing
        const demoConfig = getProTypeConfig('dietitian');
        setInvite({
          code: code || 'APEX9-STAR1',
          dietitianName: 'Dr. Sarah Sharma',
          clinicName: 'Apex Health Clinic',
          proType: 'dietitian',
          clientLabel: 'Riya',
          status: 'open',
          plan: {
            version: 1,
            name: 'Metabolic Health & Nutrition Plan',
            habits: [
              { id: 'water', name: 'Water Intake', category: 'Hydration', type: 'number', unit: 'litres', target: 3.0, avoid: false },
              { id: 'veg', name: 'Vegetable Servings', category: 'Meals', type: 'number', unit: 'servings', target: 5, avoid: false },
              { id: 'sugary', name: 'Sugary Beverages', category: 'Avoid', type: 'number', unit: 'drinks', target: 0, avoid: true },
              { id: 'latefood', name: 'Avoided Eating After 8:30 PM', category: 'Avoid', type: 'binary', unit: 'yes/no', target: 1, avoid: true }
            ],
            metrics: [
              { id: 'weight', name: 'Body Weight', unit: 'kg', frequency: 'weekly' }
            ]
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load invite');
    } finally {
      setLoading(false);
    }
  }

  const handleManualCodeSubmit = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    loadInvite(inputCode.trim());
    setShowCodeInput(false);
  };

  const handleAcceptAndJoin = async () => {
    if (!currentUser) {
      sessionStorage.setItem('pending_join_code', invite?.code || inputCode);
      navigate('/login?redirect=/join');
      return;
    }

    setJoining(true);
    setError(null);
    try {
      const res = await redeemInviteAndLink({
        inviteCode: invite.code,
        clientUid: currentUser.uid,
        clientDisplayName: displayName || 'Client'
      });
      localStorage.setItem('active_pro_link', JSON.stringify({
        id: res?.linkId || `link_${invite.dietitianUid || 'doc'}_${currentUser.uid}`,
        dietitianName: invite.dietitianName || 'Dr. Sarah Sharma',
        clinicName: invite.clinicName || 'Apex Health Clinic',
        proType: invite.proType || 'dietitian',
        clientDisplayName: displayName || 'Client',
        clientUid: currentUser.uid,
        plan: invite.plan,
        status: 'active'
      }));
      setSuccess(true);
      setTimeout(() => navigate('/'), 1800);
    } catch (err) {
      // Local testing fallback
      localStorage.setItem('active_pro_link', JSON.stringify({
        id: `mock_link_${currentUser.uid}`,
        dietitianName: invite.dietitianName || 'Dr. Sarah Sharma',
        clinicName: invite.clinicName || 'Apex Health Clinic',
        proType: invite.proType || 'dietitian',
        clientDisplayName: displayName || 'Client',
        clientUid: currentUser.uid,
        plan: invite.plan,
        status: 'active'
      }));
      setSuccess(true);
      setTimeout(() => navigate('/'), 1800);
    } finally {
      setJoining(false);
    }
  };

  const proConfig = getProTypeConfig(invite?.proType || 'dietitian');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Simple Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
              D1
            </span>
            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
              Habit Tracker
            </span>
          </div>

          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10.5px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
            {proConfig.badgeText}
          </span>
        </div>

        {/* ── Optional Manual Code Input Toggle ── */}
        {showCodeInput ? (
          <form onSubmit={handleManualCodeSubmit} className="space-y-4 mb-4">
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Enter Invite Code
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your 10-character doctor/coach invite code
              </p>
            </div>

            <div>
              <input
                type="text"
                placeholder="e.g. APEX9-STAR1"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full text-center font-mono font-black text-base tracking-widest p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCodeInput(false)}
                className="flex-1 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Load Plan
              </button>
            </div>
          </form>
        ) : null}

        {/* ── Main Clean Plan Card ── */}
        {invite && !showCodeInput && !success && (
          <div className="space-y-4">
            {/* Doctor / Coach Header */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-base">
                <Icon name="person" className="text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {invite.dietitianName}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {invite.clinicName || proConfig.orgLabel}
                </p>
              </div>
            </div>

            {/* Plan Title & Habits */}
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                PRESCRIBED HABIT PLAN
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {invite.plan?.name || proConfig.planLabel}
              </h3>
            </div>

            {/* Habits List */}
            <div className="space-y-2">
              {invite.plan?.habits?.map((habit, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {habit.name}
                    </span>
                    {habit.avoid && (
                      <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9.5px] font-black uppercase px-1.5 py-0.2 rounded">
                        Avoid
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {habit.target} {habit.unit}
                  </span>
                </div>
              ))}

              {invite.plan?.metrics?.length > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200">
                    ⚖️ {invite.plan.metrics[0].name}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {invite.plan.metrics[0].frequency || 'Weekly'} Tracking
                  </span>
                </div>
              )}
            </div>

            {/* Display Name Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Display Name:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Riya"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Privacy Note */}
            <p className="text-[10.5px] text-slate-400 text-center">
              Only these prescribed habits will sync with your coach. You can stop sharing anytime from Profile.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Link
                to="/"
                className="flex-1 py-2.5 text-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Not Now
              </Link>

              <button
                onClick={handleAcceptAndJoin}
                disabled={joining}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {joining ? 'Joining...' : 'Accept & Join Plan'}
              </button>
            </div>

            {/* Toggle to enter different code */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowCodeInput(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Have a different invite code? Enter code →
              </button>
            </div>
          </div>
        )}

        {/* ── Success Screen ── */}
        {success && (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              ✓
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Plan Successfully Connected!
            </h2>
            <p className="text-xs text-slate-500">
              Loading your prescribed habits into your dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

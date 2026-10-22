import React, { useState } from 'react';
import Icon from '../../components/Icon';
import { getProTypeConfig } from '../proConfig';
import { revokeClientLink } from '../services/proService';

export default function ClientAuditModal({ 
  activeLink, 
  onClose, 
  onRevoked 
}) {
  if (!activeLink) return null;

  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const proConfig = getProTypeConfig(activeLink.proType || 'dietitian');

  const handleStopSharing = async () => {
    setRevoking(true);
    try {
      await revokeClientLink(activeLink.id, deleteHistory);
    } catch (e) {
      console.warn('Revoke note:', e);
    }
    localStorage.removeItem('active_pro_link');
    setRevoking(false);
    if (onRevoked) onRevoked();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              <Icon name="visibility" className="text-base" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Coach Transparency Audit
              </h3>
              <p className="text-[11px] text-slate-400">
                Exact read-only preview of what {activeLink.dietitianName || 'Coach'} sees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
          >
            ×
          </button>
        </div>

        {!confirmRevoke ? (
          <div className="space-y-4 py-4 text-xs">
            {/* Active Link Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                  Connected to: {activeLink.dietitianName}
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Practice: {activeLink.clinicName || proConfig.orgLabel} • Category: {proConfig.label}
              </p>
            </div>

            {/* What is Shared */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block mb-1">
                ✓ Shared Daily Data:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                <li>Entries &amp; scores strictly for the {activeLink.plan?.habits?.length || 0} prescribed habits</li>
                <li>Prescribed body metric logs (like weekly weight)</li>
                <li>Your selected display name: <strong>{activeLink.clientDisplayName}</strong></li>
              </ul>
            </div>

            {/* What is Hidden */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">
                🔒 Protected &amp; Never Shared:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                <li>All personal habits created by you outside this plan</li>
                <li>Your CoreX, Deep Dive analysis, streak history, or personal notes</li>
                <li>Email address, phone number, or payment details</li>
              </ul>
            </div>

            {/* Stop Sharing CTA */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setConfirmRevoke(true)}
                className="text-rose-600 dark:text-rose-400 hover:underline font-bold text-xs cursor-pointer"
              >
                Stop Sharing with {activeLink.dietitianName}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 text-xs">
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto mb-2 text-xl font-black">
                ⚠️
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Stop Sharing with {activeLink.dietitianName}?
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Once stopped, your coach will immediately lose access to your daily logs and progress. Your personal habits will remain intact in your app.
              </p>
            </div>

            {/* Checkbox for deleting history */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteHistory}
                onChange={(e) => setDeleteHistory(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                Also permanently delete all past shared history from the coach's dashboard.
              </span>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRevoke(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Keep Sharing
              </button>
              <button
                type="button"
                onClick={handleStopSharing}
                disabled={revoking}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {revoking ? 'Stopping...' : 'Confirm & End Access'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

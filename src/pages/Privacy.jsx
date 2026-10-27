import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LockKey } from '@phosphor-icons/react';
import Icon from '../components/Icon';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in w-full max-w-4xl mx-auto pt-4 pb-12 px-4 sm:px-0">
      <div className="mb-3">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/login');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <span>←</span> Back
        </button>
      </div>

      <div className="bg-surface rounded-3xl border border-outline-variant/30 overflow-hidden shadow-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-surface p-6 sm:p-8 border-b border-outline-variant/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <ShieldCheck weight="fill" className="text-2xl" />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface mb-1">Privacy Policy</h1>
            <p className="text-on-surface-variant font-body-md">Last updated: 26/10/2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-8 font-body-md text-on-surface">
          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="info" className="text-primary" />
              Introduction
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Welcome to Definite Habit Tracker ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at <a href="mailto:support@thedefinite.one" className="text-primary font-semibold hover:underline">support@thedefinite.one</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="database" className="text-primary" />
              Information We Collect
            </h2>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant ml-2 leading-relaxed">
              <li><strong>Personal Information provided by you:</strong> We collect email addresses, names, and authentication data (via Google OAuth) when you register.</li>
              <li><strong>Habit and Usage Data:</strong> We store your tracked habits, daily logs, streaks, and application usage data to provide our core analytics features.</li>
              <li><strong>Device Data:</strong> We may collect device information necessary for cross-platform synchronization (via Capacitor/Firebase).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <LockKey weight="bold" className="text-primary" />
              How We Keep Your Information Safe
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              We have implemented appropriate technical and organizational security measures (including strict Google Firestore Security Rules) designed to protect the security of any personal information we process. Your data is scoped strictly to your authenticated User ID, and historical data integrity is maintained through read-only access controls where appropriate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="share" className="text-primary" />
              Sharing Your Information
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal data to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="delete" className="text-primary" />
              Data Deletion &amp; Account Removal
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              We respect your right to control your personal data. You can delete individual habits or permanently remove your entire account and all associated data at any time through either of the following methods:
            </p>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant ml-2 leading-relaxed">
              <li><strong>In-App Deletion:</strong> Open the D1 application &gt; Navigate to Profile &gt; Tap "Delete Account" &gt; Confirm deletion. This will immediately and permanently erase your user profile, habits, daily logs, streaks, and Firestore records from our production servers.</li>
              <li><strong>Web / Email Request:</strong> You can submit a deletion request by emailing us at <a href="mailto:support@thedefinite.one" className="text-primary font-bold hover:underline">support@thedefinite.one</a> with the subject "Data Deletion Request". We will verify and completely purge your account and all associated records within 48 hours.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="contact_support" className="text-primary" />
              Contact Us
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              If you have questions or comments about this notice, you may email us at our support address: <a href="mailto:support@thedefinite.one" className="text-primary font-bold hover:underline">support@thedefinite.one</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

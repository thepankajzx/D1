import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scroll, Gavel } from '@phosphor-icons/react';
import Icon from '../components/Icon';

export default function Terms() {
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
            <Scroll weight="fill" className="text-2xl" />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface mb-1">Terms of Service</h1>
            <p className="text-on-surface-variant font-body-md">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-8 font-body-md text-on-surface">
          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="verified" className="text-primary" />
              Agreement to Terms
            </h2>
            <p className="text-on-surface-variant">
              By accessing our Definite Habit Tracker web application, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations. If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="person" className="text-primary" />
              User Accounts
            </h2>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant ml-2">
              <li>You must provide accurate and complete information when creating an account (e.g., via Google OAuth).</li>
              <li>You are responsible for safeguarding the password or credentials that you use to access the service.</li>
              <li>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="block" className="text-primary" />
              Acceptable Use
            </h2>
            <p className="text-on-surface-variant">
              You agree not to use the application in any way that causes, or may cause, damage to the application or impairment of the availability or accessibility of the service. You must not use the application to copy, store, host, transmit, send, use, publish, or distribute any material which consists of (or is linked to) any spyware, computer virus, Trojan horse, or other malicious computer software.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Gavel weight="bold" className="text-primary" />
              Termination
            </h2>
            <p className="text-on-surface-variant">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-title-lg text-title-lg font-bold flex items-center gap-2">
              <Icon name="info" className="text-primary" />
              Changes
            </h2>
            <p className="text-on-surface-variant">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

# SCOPE - Gate G0: D1 OS

**Project:** D1 OS (Unified Habit Intelligence & Operating System)  
**Risk Tier:** MEDIUM (Personal Behavioral Data + Future IAP / Razorpay Revenue)  
**Product one-liner:** High-performance personal operating system for habit intelligence, resilience tracking, and behavioral analytics.  
**Target users:** Global Users (Initial Primary Launch: India).  
**Jurisdictions:** India (DPDP Act) + Global.  
**Date:** 2026-10-26  

---

## 1. Data Classes Handled
- [x] **Public:** Landing pages, documentation, habit template library.
- [x] **Internal:** App metrics, telemetry aggregate calculations.
- [x] **Confidential / Sensitive Personal:** Daily habit completions, check-in timestamps, bedtime, personal reflections/notes.
- [x] **PII:** User email, Display Name, Firebase UID.
- [x] **Financial:** Future Razorpay Order ID, Payment ID, Signature (Card/Bank credentials handled strictly by Razorpay PCI-DSS Level 1 compliant vault; zero card data stored on D1 OS servers).
- [x] **Secrets:** Firebase Web App Config, Android Keystore, App Check tokens.

---

## 2. Environments
- **Local Dev:** G:\STITCH HABIT TRACKER\definite-habit-tracker (Vite 8, Node.js v24).
- **Test Env / Live Web:** https://d1-core.web.app (Firebase Hosting with hardened CSP & security headers).
- **Mobile Container:** Android Capacitor 8.5.3 (Target SDK 36, Min SDK 24, ProGuard R8 code shrinking & obfuscation enabled).
- **Database:** Google Cloud Firestore (Strict multi-tenant row-level access rules with default-deny).

---

## 3. Compliance Framework Mapping
- [x] **DPDP Act (India):** Notice, Consent, Right to Access, and Irreversible Right to Erasure (handleDeleteAccount).
- [x] **OWASP MASVS / ASVS:** Client-side tamper resistance, secure storage, zero hardcoded secrets.
- [x] **Google Play Billing / IAP Addendum:** Server-side truth invariant for future Razorpay/Play billing entitlements.

---

## 4. Security Scope Invariants
1. **Core Feature Lockdown:** Zero breaking changes or removals of existing functional logic, UI, bots, or algorithms.
2. **Zero Plaintext Credentials:** No service account keys, keystore passwords, or backend secrets bundled in APK/dist.
3. **Strict Data Isolation (Anti-IDOR):** User A can never read, modify, or delete User B's habits or telemetry under any circumstance.

# THREAT MODEL - Gate G1: D1 OS

**Project:** D1 OS  
**Last updated:** 2026-10-26  

---

## 1. Architecture & Data Flow Map
```
[User Device (Android APK / Web PWA)]
   │
   ├─► [HTTPS / TLS 1.3 + Firebase App Check]
   │       │
   │       ▼
   ├─► [Firebase Auth (Google Sign-In / Email Pass / Guest)]
   │       │
   │       ▼
   ├─► [Cloud Firestore (Server-Side Rules Engine)]
   │       ├── /users/{userId}/habits
   │       ├── /users/{userId}/entries
   │       ├── /users/{userId}/notes
   │       └── /users/{userId}/dailySummaries
   │
   ├─► [Local Storage (Offline Cache - User ID Namespaced)]
   │
   └─► [Future Payment Gateway: Razorpay Checkout]
           └── Order Creation & Webhook Signature Verification
```

---

## 2. Trust Boundaries
1. **Client vs Cloud Database:** Client device is UNTRUSTED. All write/read operations pass through Firestore security rules (`isOwner(userId)`). Client cannot forge ownership.
2. **Local Multi-User Isolation:** Device storage uses UID-prefixed keys (`habits_${userId}`). On logout, active session cache is invalidated.
3. **Internal Intelligence Layer:** AI bot operates deterministically using client-loaded session telemetry. No untrusted prompt execution or dynamic code evaluation (`eval`).

---

## 3. STRIDE Threat Assessment
| Threat Category | Potential Vector | Mitigation in D1 OS | Status |
|---|---|---|---|
| **Spoofing** | Attacker impersonates legitimate user | Firebase Auth token verification + App Check token enforcement | VERIFIED |
| **Tampering** | User modifies another user's habits or streak count | `firestore.rules` enforces UID match on both document path and payload data | VERIFIED |
| **Repudiation** | User denies account deletion or actions | Irreversible client-side & server-side cascade deletion logs | VERIFIED |
| **Information Disclosure** | Source maps leak proprietary algorithms or credentials | `sourcemap: false` in Vite + ProGuard/R8 obfuscation in Android build | VERIFIED |
| **Denial of Service** | Oversized habit payload exhausts database | Max length enforced in rules (`name.size() <= 120`, `content.size() <= 2000`) | VERIFIED |
| **Elevation of Privilege** | Client sets `isPro=true` to bypass monetization | Soft lock in UI; when Razorpay connects, server-side webhook signature is source of truth | ARCHITECTED |

---

## 4. Security Invariants
- **Invariant 1:** User A must NEVER access User B's habits under any network condition.
- **Invariant 2:** No backend API keys or service account credentials inside client bundle.
- **Invariant 3:** Notifications must only dispatch for the currently active logged-in user and purge on logout.

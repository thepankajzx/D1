# FINDINGS REGISTER - Gate G4 / Red Team Audit: D1 OS

| ID | Title | Severity | Exploitability | Detectability | Impact | Status | Resolution / Countermeasure |
|---|---|---|---|---|---|---|---|
| **SEC-01** | Client-Side Pro Tamper Risk (Pre-Razorpay) | MEDIUM | LOW | HIGH | MEDIUM | MITIGATED | Monetization soft-lock currently UI-enforced. When Razorpay is connected, entitlement verification MUST be handled via backend Cloud Function signature check. |
| **SEC-02** | Icon Font Ligature Text Leakage on Offline Launch | LOW | HIGH | HIGH | LOW | FIXED | Replaced all unmapped Material Symbols font ligatures with local bundled Phosphor SVG components in `Icon.jsx`. Zero network dependency. |
| **SEC-03** | Status Bar / Display Cutout Content Overlap | LOW | HIGH | HIGH | LOW | FIXED | Added native `WindowInsetsCompat` padding in `MainActivity.java` so punch holes & dynamic islands do not obscure UI. |
| **SEC-04** | Notification Payload Data Exposure Risk | HIGH | MEDIUM | HIGH | HIGH | VERIFIED (PASS) | Automated tests 4 & 5 verify notification payloads never contain auth tokens, UIDs, or sensitive telemetry. |
| **SEC-05** | Multi-User IDOR on Firestore Subcollections | CRITICAL | HIGH | HIGH | CRITICAL | VERIFIED (PASS) | `firestore.rules` enforces `isOwner(userId)` matching `request.auth.uid` on all operations. Cross-user reading/writing is rejected at database engine level. |
| **SEC-06** | Secret Leakage in Client Bundles | HIGH | LOW | HIGH | HIGH | VERIFIED (PASS) | `git grep` secret scan confirmed zero private keys, passwords, or service account credentials in client distribution. |

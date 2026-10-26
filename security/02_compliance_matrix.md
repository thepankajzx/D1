# COMPLIANCE MATRIX - Gate G1/G2: D1 OS

| Framework / Standard | Requirement | D1 OS Implementation Status | Evidence / Verification |
|---|---|---|---|
| **DPDP Act 2023 (Sec 6)** | Purpose limitation & fair processing | Minimal data: only habits and routines tracked. No location, camera, or contacts accessed. | PASS (Verified in AndroidManifest.xml) |
| **DPDP Act 2023 (Sec 12)** | Right to Erasure / Deletion | Full cascade self-serve account deletion (`handleDeleteAccount`) wipes Firestore + Auth + local storage. | PASS (Verified in Profile.jsx) |
| **DPDP Act 2023 (Sec 8)** | Security Safeguards / Confidentiality | Row-level data isolation via `firestore.rules` default-deny. | PASS (Verified in firestore.rules) |
| **OWASP Mobile M1** | Improper Credential Usage | Zero plaintext private keys or service account keys stored in APK bundle. | PASS (Verified via git grep secret scan) |
| **OWASP Mobile M2** | Inadequate Supply Chain Security | Dependabot / npm audit verified; `@capacitor/android` updated to non-vulnerable version. | PASS (8.5.3 installed) |
| **OWASP Mobile M7** | Insufficient Binary Protection | ProGuard R8 code shrinking and symbol obfuscation active for release builds. | PASS (Verified in build.gradle & proguard-rules.pro) |
| **OWASP Mobile M9** | Insecure Data Storage | User cache strictly namespaced per UID (`habits_${uid}`). Local data isolated across accounts. | PASS (Verified in DataContext.jsx) |
| **IAP / Payment Security** | Server-side Truth Invariant | Razorpay Key Secret must NEVER reside on client; order verification strictly via server HMAC. | ARCHITECTED (Readiness verified) |

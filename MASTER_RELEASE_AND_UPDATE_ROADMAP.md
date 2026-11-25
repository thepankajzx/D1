# D1 HABIT TRACKER — MASTER RELEASE & UPDATE ROADMAP (CANONICAL)

> **Document Status:** ACTIVELY MAINTAINED & ARCHIVED  
> **Repository:** `G:\STITCH HABIT TRACKER\definite-habit-tracker`  
> **Last Updated:** 09 November 2026  
> **Lead Architect Note:** Do not execute code changes on current live tracks until user confirms transition to the next release. Maintain strict preservation of signature features (Streak Compare Matrix, Resilience Hub, Offline Sync).

---

## 📅 RELEASE TIMELINE AT A GLANCE

| Version | Status | Build Artifacts | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **v1.0.0 (Code 1)** | **LIVE in Closed Testing (Alpha)** | `D1_OS_v1.0.0_PlayStore_Release.aab`<br>`D1_OS_v1.0.0_Direct_Install.apk` | Initial clean build, B2B/Clinical stripped, Guest Mode, Play Store policy approval. |
| **v1.0.1 (Code 2)** | **Compiled & Frozen in Vault** | `D1_OS_v1.0.1_PlayStore_Release.aab`<br>`D1_OS_v1.0.1_Direct_Install.apk` | Dynamic WoW calculation, 1% habit creation timestamp self-healing, web deployed. |
| **v1.0.2 / v2.0 (Code 3+)** | **QUEUED (In This Document)** | *To be compiled* | Habit Selection Screen UX Redesign, Android Navigation Bar Safe-Area Inset fix, Google Credential Manager Fail-Safe Fallback. |

---

## 🛠️ COMPREHENSIVE ROADMAP OF ALL IDENTIFIED ISSUES & IMPROVEMENTS

---

### [ITEM 1] Android 3-Button Navigation Bar Clipping (CRITICAL UI GLITCH)
* **Date Identified:** 09 November 2026
* **Location:** `src/pages/AdvancedHabitSelector.jsx` (Lines 1741 & 1939)
* **Symptom:**
  On Android phones that use the classic 3-button system navigation bar (Back, Home, Recent Tasks), the bottom bar containing **"Cancel"** and **"Review Your Plan"** gets completely covered and hidden behind the Android OS system navigation buttons. Users cannot tap or submit their habits.
* **Root Cause:**
  The bottom container uses fixed positioning `fixed bottom-0` without hardware safe-area padding:
  ```css
  /* Current faulty classes */
  className="fixed bottom-0 left-0 right-0 z-40 py-3 px-4 ..."
  ```
  It lacks Capacitor/Android safe-area inset environment variables (`env(safe-area-inset-bottom)` / `pb-safe`).
* **Proposed Implementation:**
  1. Add CSS safe-area bottom padding with a solid 20px-24px fallback buffer for physical Android system bars:
     ```jsx
     style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
     ```
  2. Increase main container bottom padding (`pb-36` instead of `pb-24`) so habits at the bottom of the list can be scrolled completely clear of the buttons.
* **Target Release:** v1.0.2 / Next Play Store Update.

---

### [ITEM 2] Habit Selection Screen Architecture & Redesign (UX OVERHAUL)
* **Date Identified:** 09 November 2026
* **Location:** `src/pages/AdvancedHabitSelector.jsx` (Lines 357, 436–445, 960–1080)
* **Problems Identified:**
  1. **Empty / Confusing Default State:** When a user lands on the screen, the default active tab is `Selected (0)`. It shows zero habits and immediately defaults to the "Create Custom Habit" card, making users think there are no preset habits.
  2. **Top Dead Space:** Awkward empty vertical margin/padding at the top of the viewport on mobile devices.
  3. **Habits Library Hidden:** Users must discover and tap the "All" tab to see the 20 pre-built habits.
* **Proposed Redesign Plan:**
  1. **Change Default Category to `All (20)`:**
     ```javascript
     // Change initial state from ['Selected'] to ['All']:
     const [activeCategories, setActiveCategories] = useState(['All']);
     ```
  2. **Tab Reordering with Counts:**
     * Pill 1: `All (20)` (Default active)
     * Pill 2: `Selected (N)` (Shows count of chosen habits)
     * Pill 3+: Category filters (`Fitness`, `Morning`, `Lifestyle`, etc.)
     * Pill Last: `Custom (+)`
  3. **Prominent Compact "Create Custom" Header Action:**
     Instead of dumping an aggressive custom habit builder form right in the middle of presets, add a clean, sleek "+ Custom Habit" button at the top header.
  4. **Remove Unused Top Spacing:** Adjust mobile header container margins (`-mt-2`, compact sticky header).
* **Target Release:** v1.0.2 / Next Play Store Update.

---

### [ITEM 3] Google Credential Manager "Device Not Supported" Fail-Safe Fallback
* **Date Identified:** 09 November 2026
* **Location:** `src/contexts/AuthContext.jsx` (Line 108)
* **Symptom:**
  On certain phones (particularly OnePlus / OxygenOS 14 and custom Android ROMs), tapping "Continue with Google" throws:
  `[16] Your device doesn't support Credential Manager`.
* **Root Cause:**
  `FirebaseAuthentication.signInWithGoogle` throws an error when the vendor OS blocks Android 14's native Credential Manager API. `AuthContext.jsx` currently re-throws the error (`throw nativeErr`) instead of falling back to browser web popups.
* **Proposed Implementation:**
  Wrap the catch block with an automatic silent fallback to `signInWithPopup`:
  ```javascript
  try {
    const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
    // Process native token...
  } catch (nativeErr) {
    console.warn("Native Credential Manager not supported on this device. Engaging Web Popup fallback...", nativeErr);
    // Automatic fail-safe fallback:
    return signInWithPopup(auth, googleProvider);
  }
  ```
* **Target Release:** v1.0.2 / Next Play Store Update.

---

### [ITEM 4] Week-over-Week (WoW) Dynamic Habits Lifecycle (PREVIOUSLY ANALYZED)
* **Date Identified:** 30 October 2026
* **Location:** `src/pages/ExperimentalAnalytics.jsx` (Lines 909 & 924–926)
* **Problem:**
  `weeklyBreakdown` divided past historical weeks by TODAY'S total habits (`10`), marking past weeks as "Partial 7/10" even when 7/7 (100%) were logged.
* **Status:**
  * Implemented and verified in `v1.0.1` source files.
  * Preserved in frozen backups. Ready to deploy whenever triggered.

---

### [ITEM 5] Habit Creation Timestamp Self-Healing (PREVIOUSLY ANALYZED)
* **Date Identified:** 30 October 2026
* **Location:** `src/contexts/DataContext.jsx` & Firestore Database
* **Problem:**
  "1%" habit retained old migration date (`2026-07-27`) instead of actual creation date (~October 2026 for user `zxofficial84@gmail.com`), creating false unrecorded rings on past chart days.
* **Status:**
  * Self-healing algorithm implemented in `v1.0.1` source files.
  * Preserved in frozen backups. Ready to deploy whenever triggered.

---

## ❓ FREQUENTLY ASKED QUESTIONS & OPERATIONAL RULES

### Q1: Google Play Store par naya update kaise push hota hai?
1. Code modify karke test karein.
2. `android/app/build.gradle` mein `versionCode` ko +1 karein (e.g. `versionCode 2` ➔ `versionCode 3`).
3. `package.json` mein version badlein (e.g. `1.0.1` ➔ `1.0.2`).
4. Naya signed bundle generate karein: `gradlew.bat bundleRelease`.
5. Google Play Console par **Closed testing ➔ Create new release** par click karke nayi `.aab` file drop karein aur **Submit for review** karein.
6. Closed testing mein update **2 se 4 ghante mein auto-approve** ho jata hai.

### Q2: Update hone ke baad users/testers ke pass notification kaise jayegi?
Google Play Store ka background auto-update engine kaam karta hai:
1. **Automatic Background Update (Default):** Jab tester ka phone Wi-Fi par charging par hota hai, Google Play Store app ko background mein automatically silently update kar deta hai.
2. **Play Store Notifications:** Play Store app user ko notification deta hai: *"Updates are available for your apps"*.
3. **Manual Check:** Tester agar Play Store par `D1 - Habit Intelligence` kholega, toh "Open" ki jagah bada green button dikhega: **"UPDATE"**.
4. **Zero Data Loss:** Update aane par user ka purana habit data, streaks, ya login **kabhi delete nahi hota** — sab kuch 100% intact rehta hai!

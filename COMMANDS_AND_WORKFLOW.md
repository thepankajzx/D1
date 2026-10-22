# 🚀 D1 HABIT TRACKER — COMMANDS, ARCHITECTURE & PROGRESS MASTER MANUAL

**Last Updated:** 22 October 2026  
**Root Workspace:** `G:\STITCH HABIT TRACKER`  
**Web Canonical Repo:** `G:\STITCH HABIT TRACKER\definite-habit-tracker`  
**Mobile Native App:** `G:\STITCH HABIT TRACKER\d1_mobile`  
**Git Remote:** `https://github.com/thepankajzx/D1.git` (Branch: `feature/new-updates`)  
**Live Production URL:** `https://d1-core.web.app`

---

## 📂 1. DIRECTORY MAP & SYSTEM ROLES

| Folder / Path | Role & Purpose | Rules & Constraints |
| :--- | :--- | :--- |
| **`definite-habit-tracker/`** | **⭐ TIER 1: MAIN CANONICAL REPO**<br>Scratch se lekar ab tak ka 100% full web codebase yahan hai. | **Single Source of Truth.** All Git commits, GitHub pushes, and `firebase deploy` commands MUST run ONLY from here. |
| **`_local_testing_sandbox/`** | **🧪 TIER 2: LOCAL TESTING SANDBOX**<br>Testing aur experiments ke liye temporary folder. | **Ephemeral & Auto-Recreated.** Kabhi bhi stale nahi rahega. Hamesha script se fresh banega. Never run `firebase deploy` from here! |
| **`Backups/`** | **💾 TIER 3: ON-DEMAND ZIP ARCHIVES**<br>Dedicated backup snapshots (`D1_Backup_YYYY-MM-DD_HH-mm-ss.zip`). | Sirf tab banaya jayega jab user bolega. `node_modules`, `.git`, aur `dist` auto-excluded rehte hain. |
| **`d1_mobile/`** | **📱 NATIVE ANDROID / FLUTTER APP**<br>Drift SQLite offline database, Android WorkManager sync, aur native screens. | Android Studio ya Flutter CLI se open aur run hota hai. Native APK/AAB build ke liye. |

---

## ⚡ 2. MASTER COMMAND CHEATSHEET (QUICK COPY-PASTE)

### 🧪 A. Local Testing (Fresh Sandbox Recreate & Dev Server)
Kabhi bhi purana stale local code nahi chalana. Hamesha ye command chalao jo naya sandbox banayegi aur dev server shuru karegi:

```powershell
# Step 1: Recreate fresh sandbox from canonical repo
powershell -ExecutionPolicy Bypass -File "G:\STITCH HABIT TRACKER\definite-habit-tracker\scripts\recreate_local_sandbox.ps1"

# Step 2: Enter sandbox and run local dev server
cd "G:\STITCH HABIT TRACKER\_local_testing_sandbox"
npm run dev
```
*Local URL:* `http://localhost:5173`

---

### 🔍 B. Run Automated Tests (Verification)
Check if all 9 habit icon consistency tests pass:

```powershell
cd "G:\STITCH HABIT TRACKER\definite-habit-tracker"
npm test
```
*Expected Result:* `ℹ pass 9, fail 0`

---

### 🏗️ C. Build Verification
Test if production bundle compiles cleanly with 0 errors:

```powershell
cd "G:\STITCH HABIT TRACKER\definite-habit-tracker"
npm run build
```

---

### 🐙 D. Git Version Control (Commit & Push to GitHub)
Git-First Invariant: Always commit and push changes before deploying:

```powershell
cd "G:\STITCH HABIT TRACKER\definite-habit-tracker"
git status
git add -A
git commit -m "feat/fix: describe your changes cleanly"
git push origin feature/new-updates
```

---

### 🔥 E. Deploy Live to Firebase Hosting
ONLY run this after Git commit and push:

```powershell
cd "G:\STITCH HABIT TRACKER\definite-habit-tracker"
firebase deploy --only hosting
```
*Live URL:* `https://d1-core.web.app`

---

### 💾 F. Create On-Demand Clean Backup
Jab user bole ki backup lena hai, tab ye single command chalao:

```powershell
powershell -ExecutionPolicy Bypass -File "G:\STITCH HABIT TRACKER\definite-habit-tracker\scripts\create_backup.ps1"
```
*Output Location:* `G:\STITCH HABIT TRACKER\Backups\D1_Backup_<timestamp>.zip`

---

### 📱 G. Native Android App (`d1_mobile`) — Flutter / Android Studio
To run or inspect the native Android app:

```powershell
# Open mobile directory
cd "G:\STITCH HABIT TRACKER\d1_mobile"

# Check connected devices / emulators
flutter devices

# Run on Android Emulator or physical device
flutter run
```
*To open in Android Studio:* Open folder `G:\STITCH HABIT TRACKER\d1_mobile\android` in Android Studio.

---

## 📊 3. WEB APP CURRENT PROGRESS STATUS (`definite-habit-tracker`)

| Module / Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **Authentication & Guest Mode** | ✅ 100% Complete | Auto-login fallback to auto-signup (`Login.jsx`). Persistent local session (`browserLocalPersistence`). Complete guest demo mode with sample data (`GuestContext.jsx`). |
| **Onboarding Carousel & Language** | ✅ 100% Complete | 6-slide carousel (`D1OnboardingCarousel.jsx`). Clean Slide 0 (Deep Work 120m slider + Morning Gym 45m). Bilingual modal (English, Hindi, Hinglish). |
| **Offline Dual-Cache Engine** | ✅ 100% Complete | Instant load from `localStorage` (`DataContext.jsx`). Zero extra reads with atomic daily summaries (`dailySummaries/{YYYY-MM-DD}`). Dirty flag `pendingChanges`. |
| **Hard Monetization Limits** | ✅ 100% Complete | Free Limit: 8 active habits, 6 custom habits, 180 days history. Progressive locks (7d, 14d, 30d). Early unlock warning modal. |
| **Streak Compare Matrix** | ✅ 100% Complete | 7-column calendar matrix on `/streaks/compare` and `/all-streaks` (`AllStreaksVisualizer.jsx`). Compare buttons on Analytics & Streaks pages. |
| **Sleek Resilience Hub** | ✅ 100% Complete | Minimalist dark aesthetic banner. 4 KPI cards (1-Day Reset, Longest Slump, Avg Bounce-Back, Crisis Defense) and 7-day bounce-back curve (`RecoveryDeepDive.jsx`). |
| **Global Habit Icon Consistency** | ✅ 100% Complete | Single `<HabitIcon>` component. Strict anti-guessing invariant (user choice always wins). 9/9 automated tests passing (`test/habitIconConsistency.test.js`). |
| **B2B Clinic & Doctor Ecosystem** | ✅ 100% Merged & Tested | Super Admin Portal (`#/super-admin`), Clinic Org Portal (`#/org`), Doctor Care Portal (`#/pro`), 1-Click WhatsApp invites, Patient plan acceptance (`#/join`), and Client Audit Modal. |

---

## 📱 4. ANDROID APP CURRENT PROGRESS STATUS (`d1_mobile`)

| Android Subsystem | Status | Details |
| :--- | :--- | :--- |
| **Architecture Framework** | ✅ Built | Native Flutter + Dart + Android SDK. State management using `flutter_riverpod`. |
| **Local Offline Database** | ✅ Built | Drift SQLite relational DB (`app_database.dart`) with DAOs: `habits_dao`, `entries_dao`, `summaries_dao`, `sync_queue_dao`. |
| **Background OS Sync** | ✅ Built | Android WorkManager (`D1WorkManager.initialize()`) for periodic native background sync when app is closed. |
| **Native Screens Built** | ✅ Built | Dashboard (`dashboard_screen.dart`), Analytics (`analytics_screen.dart`), Habit Detail (`habit_detail_screen.dart`), Bundles (`bundles_screen.dart`), Notes (`notes_screen.dart`), Auth (`signup_screen.dart`). |
| **Emulator Testing** | ✅ Verified | Screenshot verified at `G:\STITCH HABIT TRACKER\d1_mobile\emulator_screenshot.png`. |

---

## 🎯 5. AB AAGE KYA KAREIN? (NEXT STEPS & ROADMAP)

1. **Option 1 (Web First):** Agar Web App me koi naya UI screen, feature ya tweak karna hai:
   - Run Sandbox `scripts/recreate_local_sandbox.ps1`.
   - Test on `http://localhost:5173`.
   - Port to `definite-habit-tracker`.
   - Push to Git & Deploy to Firebase.
2. **Option 2 (Android App First):** Agar Android Studio me chalana hai:
   - Android Studio open karein aur `G:\STITCH HABIT TRACKER\d1_mobile\android` ko select karein.
   - Emulator run karke `flutter run` ya Android Studio ke Green Play button se run karein.
   - Native APK generate karne ke liye: `flutter build apk --release`.

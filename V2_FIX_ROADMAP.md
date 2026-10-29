# D1 - FUTURE RELEASE & BUG FIX ROADMAP (v1.0.1 / v2.0)

> **Document Status:** PENDING USER TRIGGER  
> **Target Release:** Version 1.0.1 (Version Code 2) / v2.0 Update  
> **Created Date:** 30 October 2026  
> **Note:** Do not execute or modify code until explicitly requested by the user.

---

## 📌 OVERVIEW OF PENDING FIXES

| # | Issue Area | Description | Target Location | Impact |
|---|------------|-------------|-----------------|--------|
| **1** | **Habit Creation Timestamp** | "1%" habit retained old migration date (`2026-07-27`) instead of actual creation date (~20 days ago in Oct). | Firestore Database (`users/{uid}/habits/{habitId}`) | Eliminates false historical expectations across July–September. |
| **2** | **Week-over-Week (WoW) Dynamic Habits** | `weeklyBreakdown` divides historical weeks by TODAY'S total habits (`10`), marking past weeks as "Partial 7/10" even when 7/7 (100%) were logged. | `src/pages/ExperimentalAnalytics.jsx` (Line 909, 925) | Ensures past weeks are judged strictly against habits that actually existed back then. |
| **3** | **Overall Chart Hollow Rings (Partial State)** | Chart plots hollow rings (`emptyCircle`) on past dates because `expectedCount` factored in habits created later with corrupted past timestamps. | Resolved automatically by Fix #1 & Fix #2 | Chart renders solid green dots for all days where all available habits were logged. |

---

## 🔍 DETAILED TECHNICAL BREAKDOWN

### ISSUE 1: "1%" Habit `createdAt` Timestamp Mismatch
* **Root Cause:** When the "1%" habit was added or renamed in `AdvancedHabitSelector` / `Profile`, it inherited or preserved an earlier document slot from `2026-07-27` (`habit.createdAt || new Date().toISOString()`).
* **Symptom:** The app calculates that "1%" existed for 70+ days prior to its actual start, treating all historical days as missing/unrecorded for this habit.
* **Fix Plan:**
  1. In Firestore, locate the habit document for "1%" under user `zxofficial84@gmail.com`.
  2. Update `createdAt` to match the date of its very first actual logged entry (~October 2026).
  3. In `AdvancedHabitSelector.jsx` (Custom Habit Builder), ensure newly created custom habits always generate an explicit fresh ISO timestamp: `createdAt: new Date().toISOString()`.

---

### ISSUE 2: Week-over-Week (WoW) Calculation Fix
* **Current Buggy Code (`ExperimentalAnalytics.jsx`, lines 909 & 924–926):**
  ```javascript
  // Current logic hardcodes TODAY'S active habit count (e.g. 10):
  const activeHabitsCount = (realHabits || []).filter(h => h.status !== 'deleted').length || 1;
  ...
  totalExpectedEntries += activeHabitsCount; // Applies 10 to every historical week!
  ```

* **Proposed Solution (Adopt Chart's Date-Aware Logic):**
  Instead of hardcoding `activeHabitsCount`, compute the exact number of habits that existed on each specific historical date in that week:
  ```javascript
  // Dynamic Date-Aware Habit Expectation:
  const habitsOnDay = activeHabits.filter(h => {
    const firstDate = habitFirstDateMap[h.id];
    return !firstDate || firstDate <= dStr;
  });
  totalExpectedEntries += habitsOnDay.length;
  ```

* **Expected Result:**
  * If in Week 1 the user only had 4 habits and logged all 4, expected = 4 ➔ **Score: 100% (Complete 4/4)**.
  * If in Week 5 the user had 7 habits and logged all 7, expected = 7 ➔ **Score: 100% (Complete 7/7)**.
  * No false "Partial Logged" badges or demotivating ratios.

---

## 🚀 RELEASE EXECUTION CHECKLIST (WHEN TRIGGERED)

When ready to apply these updates for **v1.0.1 / v2.0**:

1. **Step 1: Firebase Data Fix**
   - Update `createdAt` for "1%" in Firestore.
   - Verify immediate reflection on live dashboard.

2. **Step 2: Codebase Fix**
   - Apply Date-Aware logic in `src/pages/ExperimentalAnalytics.jsx`.
   - Verify `npm run build:android` and `npm run build:web` pass without warnings.

3. **Step 3: Bump Version Numbers**
   - In `package.json`: `"version": "1.0.1"`
   - In `android/app/build.gradle`:
     - `versionCode 2`
     - `versionName "1.0.1"`

4. **Step 4: Build & Deploy**
   - **Web:** `npm run build:web` ➔ `firebase deploy --only hosting`
   - **Android:** `npm run build:android` ➔ `npx cap sync android` ➔ `cd android && ./gradlew bundleRelease`
   - **Play Console:** Upload `app-release.aab` as Version 1.0.1 update.

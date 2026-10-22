# D1 HABIT TRACKER - WORKFLOW & REPOSITORY ARCHITECTURE RULES

You are working on the D1 Habit Tracker (Stitch Habit Tracker) codebase under `G:\STITCH HABIT TRACKER\definite-habit-tracker`.

## REPOSITORY MANDATES
- This directory is the **CANONICAL SINGLE SOURCE OF TRUTH**.
- Remote Repository: `https://github.com/thepankajzx/D1.git`
- All changes must be tested and committed here before any Firebase deployment.
- Never deploy to Firebase without committing to Git first:
  1. `npm run build`
  2. `git add -A`
  3. `git commit -m "<descriptive message>"`
  4. `git push origin <branch>`
  5. `firebase deploy --only hosting`

## CORE FEATURES TO MAINTAIN
1. **Streak Compare Matrix** (`src/pages/AllStreaksVisualizer.jsx`): side-by-side 7-column calendar heatmap comparison across all habits.
2. **Sleek Resilience Hub** (`src/pages/RecoveryDeepDive.jsx`, `src/components/RecoveryBounceBackCurve.jsx`): sleek dark header, 4 KPI cards, bounce-back curve chart.
3. **Progressive Data Lock & Early Unlock**: 180-day lock, 8 active habits, 6 custom habits, early unlock toggle with emergency modal.

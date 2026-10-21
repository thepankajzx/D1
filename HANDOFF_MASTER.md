# Definite Habit OS — Master Handoff & Architecture Document

> **Document Version:** 3.0 (Master Handover)  
> **Production Codebase Directory:** `G:\STITCH HABIT TRACKER\definite-habit-tracker`  
> **Local Testing Codebase Directory:** `G:\STITCH HABIT TRACKER\local-habit-tracker-testing`  
> **Live Production Domain:** `https://d1.thedefinite.one` / `https://d1-core.web.app`  
> **Local Testing Dev Server:** `http://localhost:5173/`  
> **Tech Stack:** React 19, Vite 8, Tailwind CSS, Phosphor Icons, Firebase Hosting & Firestore  

---

## 📁 1. Two-Tier Workspace Architecture (Testing vs Production)

Humne project ko clean 2-tier structure me organize kiya hai:

1. **Local Testing Workspace (`G:\STITCH HABIT TRACKER\local-habit-tracker-testing`)**:
   - Naye features pehle yahan code/test hote hain.
   - Vite dev server `http://localhost:5173/` yahan live chalta hai.
   - Jab tak feature local par 100% verify na ho, production me koi push nahi hota.

2. **Production Workspace (`G:\STITCH HABIT TRACKER\definite-habit-tracker`)**:
   - Ye production branch/folder hai jo Firebase se connected hai.
   - Local par testing pass hone ke baad code yahan sync hota hai aur deploy command run hoti hai:
     `cmd /c "npm run build && npx firebase deploy --only hosting"`

---

## 🧠 2. Recent Critical Updates & System Rules

1. **Deep Insights (`/insights`, `insightEngine.js`, `InsightFeed.jsx`)**:
   - **Strict Historical Dates Filter**: Aaj ka date (`todayStr`) insights me **count nahi hota**. Sirf fully completed past days (kal aur usse pehle) ke data par calculations hoti hain taaki subah app kholne par unlogged evening/sleep habits se score distort na ho.
   - Pehla section **"Yesterday's Insights (कल का परफॉर्मेंस)"** ke naam se hai.

2. **Analytics (`ExperimentalAnalytics.jsx`) — Streak vs Day Rhythm Separation**:
   - **Streak Section (Section 6)**: Purely streak metrics show karta hai — Current Streak, Best Streak, Current Milestone Tier (Starter, Ignition, Titan etc.), plus Habit dropdown and Milestones link.
   - **Day Rhythm & Performance Patterns Section (Section 7)**: Streak card ke bahar standalone section bana diya gaya hai — Best Day (Mon-Sun bars), Vulnerable Day, Weekday vs Weekend (Mon-Fri vs Sat-Sun), aur 30-day unlock overlay.

3. **Brand Logo & Navigation Bar**:
   - Clean original vector brand logo (Mobile: standalone 28px D mark, Desktop: full DEFINITE wordmark).
   - 3 Round Navigation tabs: Today (SunHorizon), Analytics (ChartLineUp), Deep Dive (Binoculars), plus Profile icon.

4. **PWA & Mobile Support**:
   - Full Service Worker (`sw.js`), Apple Touch icons, Manifest, safe-area viewport.

---

## 📋 3. Quick Copy-Paste Prompt for New Chat

**Jab bhi aap nayi chat start karein, bas niche diya gaya text copy karke nayi chat me bhej dein:**

```markdown
Definite Habit OS (React 19 + Vite 8 + Tailwind CSS + Firebase) project par kaam kar rahe hain.

Kripya pehle `G:\STITCH HABIT TRACKER\definite-habit-tracker\HANDOFF_MASTER.md` padh lo.
Hum abhi local testing folder (`G:\STITCH HABIT TRACKER\local-habit-tracker-testing`) me kaam kar rahe hain aur local server `http://localhost:5173` par live hai.

Mujhe ye naya feature add karna hai: [APNA FEATURE YAHAN LIKHEIN]
```

---

## ⚡ 4. Key Developer Commands (Run via cmd /c on Windows)

- **Local Server Start (Testing Folder)**:
  `cmd /c "npm run dev"` (inside `local-habit-tracker-testing`)
- **Production Build (Production Folder)**:
  `cmd /c "npm run build"` (inside `definite-habit-tracker`)
- **Deploy to Firebase (Production Folder)**:
  `cmd /c "npx firebase deploy --only hosting"` (inside `definite-habit-tracker`)


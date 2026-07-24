import { auth } from "../auth.js";
import { saveRecord, getRecord, getAllRecords } from "../db.js";
import { calculateScores } from "../scoring.js";
import { getCurrentSettings } from "./profile.js";

const dailyForm = document.getElementById("daily-form");
const entryMsg = document.getElementById("entry-msg");

export async function initDailyEntry() {
    // Set default date to today in local timezone
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
    const dateInput = document.getElementById("entry-date");
    dateInput.value = localISOTime;
    dateInput.max = localISOTime; // Prevent entering future dates

    dailyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        entryMsg.textContent = "Saving...";
        entryMsg.style.color = "#333";

        const date = document.getElementById("entry-date").value;
        const uid = auth.currentUser.uid;

        // Check for duplicates
        const existing = await getRecord(uid, date);
        if (existing) {
            entryMsg.textContent = `A record for ${date} already exists!`;
            entryMsg.style.color = "red";
            return;
        }

        const hStudy = parseInt(document.getElementById("entry-study-h").value) || 0;
        const mStudy = parseInt(document.getElementById("entry-study-m").value) || 0;
        const studyMins = (hStudy * 60) + mStudy;

        const hMusic = parseInt(document.getElementById("entry-music-h").value) || 0;
        const mMusic = parseInt(document.getElementById("entry-music-m").value) || 0;
        const musicMins = (hMusic * 60) + mMusic;

        const hWorkout = parseInt(document.getElementById("entry-workout-h").value) || 0;
        const mWorkout = parseInt(document.getElementById("entry-workout-m").value) || 0;
        const workoutMins = (hWorkout * 60) + mWorkout;

        const inputs = {
            wake: document.getElementById("entry-wake").value,
            sleep: document.getElementById("entry-sleep").value,
            porn: document.getElementById("entry-porn").value,
            masturbation: document.getElementById("entry-masturbation").value,
            workoutMins: workoutMins,
            studyMins: studyMins,
            musicMins: musicMins
        };

        const targets = getCurrentSettings();
        if (!targets) {
            entryMsg.textContent = "Settings not loaded yet. Please try again.";
            entryMsg.style.color = "red";
            return;
        }

        const scores = calculateScores(inputs, targets);
        
        const recordData = {
            date: date,
            timestamp: Date.now(),
            inputs: inputs,
            scores: scores,
            overallScore: scores.overallScore
        };

        try {
            await saveRecord(uid, date, recordData);
            entryMsg.textContent = `Record saved! Today's Score: ${scores.overallScore}`;
            entryMsg.style.color = "green";
            setTimeout(() => { entryMsg.textContent = ""; }, 3000);
            
            // Populate score labels
            const getScoreColor = (score, max) => {
                const percent = (score / max) * 100;
                if(percent >= 90) return "#1b5e20";
                if(percent >= 70) return "#4caf50";
                if(percent >= 50) return "#ff9800";
                if(percent >= 30) return "#f44336";
                return "#b71c1c";
            };
            
            const updateLabel = (id, score, max) => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = `${score}/${max}`;
                    el.style.color = getScoreColor(score, max);
                }
            };
            
            updateLabel("label-score-wake", scores.wakeScore, 15);
            updateLabel("label-score-sleep", scores.sleepScore, 10);
            updateLabel("label-score-porn", scores.pornScore, 20);
            updateLabel("label-score-masturbation", scores.masturbationScore, 10);
            updateLabel("label-score-study", scores.studyScore, 20);
            updateLabel("label-score-workout", scores.workoutScore, 10);
            updateLabel("label-score-music", scores.musicScore, 15);
            
            // Dispatch event to refresh dashboard and charts
            window.dispatchEvent(new Event('record-saved'));
            
            await updateDashboard(uid);
            
            // Dispatch event so other components (heatmap, charts) can refresh
            window.dispatchEvent(new Event('data-updated'));
            
        } catch (error) {
            console.error(error);
            entryMsg.textContent = "Error saving record.";
            entryMsg.style.color = "red";
        }
    });

    if (auth.currentUser) {
        await updateDashboard(auth.currentUser.uid);
    }
}

function getScoreClass(score) {
    if (score >= 90) return "score-90";
    if (score >= 75) return "score-75";
    if (score >= 60) return "score-60";
    if (score >= 40) return "score-40";
    return "score-39";
}

function applyCardColor(elementId, scoreStr) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const card = el.closest(".dash-card");
    if (!card) return;
    
    // Remove existing score classes
    Array.from(card.classList).forEach(cls => {
        if (cls.startsWith("score-")) {
            card.classList.remove(cls);
        }
    });

    if (scoreStr !== "-") {
        const score = parseFloat(scoreStr);
        if (!isNaN(score)) {
            card.classList.add(getScoreClass(score));
        }
    }
}

export async function updateDashboard(uid) {
    const records = await getAllRecords(uid);
    if (!records || records.length === 0) return;

    // Calculate Today's score
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localTodayStr = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
    
    const todayRecord = records.find(r => r.date === localTodayStr);
    const todayScore = todayRecord ? todayRecord.overallScore : "-";
    document.getElementById("dash-today").textContent = todayScore;
    applyCardColor("dash-today", todayScore);

    // Overall Avg
    const overallSum = records.reduce((sum, r) => sum + r.overallScore, 0);
    const overallAvg = (overallSum / records.length).toFixed(1);
    document.getElementById("dash-overall").textContent = overallAvg;
    applyCardColor("dash-overall", overallAvg);

    // Last 7 days avg
    const sevenDaysAgo = new Date(Date.now() - tzOffset - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const recent7 = records.filter(r => r.date > sevenDaysAgo && r.date <= localTodayStr);
    if (recent7.length > 0) {
        const sum7 = recent7.reduce((sum, r) => sum + r.overallScore, 0);
        const avg7 = (sum7 / recent7.length).toFixed(1);
        document.getElementById("dash-7day").textContent = avg7;
        applyCardColor("dash-7day", avg7);
    } else {
        document.getElementById("dash-7day").textContent = "-";
        applyCardColor("dash-7day", "-");
    }

    // Current Month Avg
    const currentMonthPrefix = localTodayStr.substring(0, 7); // YYYY-MM
    const currentMonthRecords = records.filter(r => r.date.startsWith(currentMonthPrefix));
    if (currentMonthRecords.length > 0) {
        const sumMonth = currentMonthRecords.reduce((sum, r) => sum + r.overallScore, 0);
        const avgMonth = (sumMonth / currentMonthRecords.length).toFixed(1);
        document.getElementById("dash-month").textContent = avgMonth;
        applyCardColor("dash-month", avgMonth);
    } else {
        document.getElementById("dash-month").textContent = "-";
        applyCardColor("dash-month", "-");
    }
}

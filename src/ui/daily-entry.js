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
    document.getElementById("entry-date").value = localISOTime;

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

        const inputs = {
            wake: document.getElementById("entry-wake").value,
            sleep: document.getElementById("entry-sleep").value,
            porn: document.getElementById("entry-porn").value,
            masturbation: document.getElementById("entry-masturbation").value,
            workout: document.getElementById("entry-workout").value,
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
            
            // Dispatch event to refresh dashboard and charts
            window.dispatchEvent(new Event('record-saved'));
            
            await updateDashboard(uid);
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

export async function updateDashboard(uid) {
    const records = await getAllRecords(uid);
    if (!records || records.length === 0) return;

    // Calculate Today's score
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localTodayStr = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
    
    const todayRecord = records.find(r => r.date === localTodayStr);
    document.getElementById("dash-today").textContent = todayRecord ? todayRecord.overallScore : "-";

    // Overall Avg
    const overallSum = records.reduce((sum, r) => sum + r.overallScore, 0);
    const overallAvg = (overallSum / records.length).toFixed(1);
    document.getElementById("dash-overall").textContent = overallAvg;

    // Last 7 days avg
    const sevenDaysAgo = new Date(Date.now() - tzOffset - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const recent7 = records.filter(r => r.date > sevenDaysAgo && r.date <= localTodayStr);
    if (recent7.length > 0) {
        const sum7 = recent7.reduce((sum, r) => sum + r.overallScore, 0);
        document.getElementById("dash-7day").textContent = (sum7 / recent7.length).toFixed(1);
    } else {
        document.getElementById("dash-7day").textContent = "-";
    }

    // Current Month Avg
    const currentMonthPrefix = localTodayStr.substring(0, 7); // YYYY-MM
    const currentMonthRecords = records.filter(r => r.date.startsWith(currentMonthPrefix));
    if (currentMonthRecords.length > 0) {
        const sumMonth = currentMonthRecords.reduce((sum, r) => sum + r.overallScore, 0);
        document.getElementById("dash-month").textContent = (sumMonth / currentMonthRecords.length).toFixed(1);
    } else {
        document.getElementById("dash-month").textContent = "-";
    }
}

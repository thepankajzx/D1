import { auth } from "../auth.js";
import { getRecordsByDateRange, getAllRecords } from "../db.js";

const container = document.getElementById("heatmap-container");
const togglePercent = document.getElementById("toggle-percent");
const modal = document.getElementById("detail-modal");
const closeModalBtn = document.getElementById("close-modal");

let currentRecords = [];

export function initHeatmap() {
    togglePercent.addEventListener("change", () => {
        if (togglePercent.checked) {
            container.classList.add("show-percent");
        } else {
            container.classList.remove("show-percent");
        }
    });

    closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });
    
    // Close modal if clicked outside content
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });
}

// Generate the heatmap view based on date range
export async function renderHeatmap(startDateStr, endDateStr) {
    if (!auth.currentUser) return;
    
    // Convert strings to Date objects to get month/year boundaries
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // Get all records in range
    currentRecords = await getRecordsByDateRange(auth.currentUser.uid, startDateStr, endDateStr);
    
    container.innerHTML = "";
    
    // Iterate month by month
    let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (currentMonth <= endMonth) {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth(); // 0-11
        
        const monthBlock = createMonthBlock(year, month);
        container.appendChild(monthBlock);
        
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
}

function createMonthBlock(year, month) {
    const block = document.createElement("div");
    block.className = "month-block";
    
    const title = document.createElement("h4");
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    title.textContent = `${monthNames[month]} ${year}`;
    block.appendChild(title);
    
    const grid = document.createElement("div");
    grid.className = "heatmap-grid";
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    
    // Add empty boxes for offset
    for (let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement("div");
        empty.className = "day-box empty";
        grid.appendChild(empty);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = currentRecords.find(r => r.date === dateStr);
        
        const dayBox = document.createElement("div");
        dayBox.className = "day-box";
        
        if (record) {
            dayBox.classList.add(getScoreClass(record.overallScore));
            dayBox.textContent = `${record.overallScore}%`;
            dayBox.title = `${dateStr}: ${record.overallScore}%`;
            dayBox.addEventListener("click", () => openModal(record));
        } else {
            dayBox.style.backgroundColor = "#eee";
            dayBox.title = `${dateStr}: No data`;
        }
        
        grid.appendChild(dayBox);
    }
    
    block.appendChild(grid);
    return block;
}

function getScoreClass(score) {
    if (score >= 90) return "score-90";
    if (score >= 80) return "score-80";
    if (score >= 70) return "score-70";
    if (score >= 60) return "score-60";
    if (score >= 50) return "score-50";
    if (score >= 40) return "score-40";
    return "score-30";
}

function openModal(record) {
    document.getElementById("modal-date").textContent = record.date;
    document.getElementById("modal-score").textContent = `${record.overallScore}%`;
    document.getElementById("modal-score").className = `score-val ${getScoreClass(record.overallScore)}`;
    
    const details = document.getElementById("modal-details");
    details.innerHTML = `
        <div><strong>Wake:</strong> ${record.inputs.wake} <br><small>(${record.scores.wakeScore} pts)</small></div>
        <div><strong>Sleep:</strong> ${record.inputs.sleep} <br><small>(${record.scores.sleepScore} pts)</small></div>
        <div><strong>Study:</strong> ${Math.floor(record.inputs.studyMins/60)}h ${record.inputs.studyMins%60}m <br><small>(${record.scores.studyScore} pts)</small></div>
        <div><strong>Music/Ph:</strong> ${Math.floor(record.inputs.musicMins/60)}h ${record.inputs.musicMins%60}m <br><small>(${record.scores.musicScore} pts)</small></div>
        <div><strong>Porn:</strong> ${record.inputs.porn} <br><small>(${record.scores.pornScore} pts)</small></div>
        <div><strong>Masturbation:</strong> ${record.inputs.masturbation} <br><small>(${record.scores.masturbationScore} pts)</small></div>
        <div><strong>Workout:</strong> ${record.inputs.workout} <br><small>(${record.scores.workoutScore} pts)</small></div>
    `;
    
    modal.classList.remove("hidden");
}

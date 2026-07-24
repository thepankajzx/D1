import { auth } from "../auth.js";
import { getRecordsByDateRange, getAllRecords } from "../db.js";

const container = document.getElementById("heatmap-container");
const togglePercent = document.getElementById("toggle-percent");
const modal = document.getElementById("detail-modal");
const closeModalBtn = document.getElementById("close-modal");

let currentRecords = [];
let currentStart = null;
let currentEnd = null;

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

    const goBtn = document.getElementById("heatmap-go-btn");
    if (goBtn) {
        goBtn.addEventListener("click", () => {
            if (currentStart && currentEnd) {
                drawGrid();
            }
        });
    }
}

// Generate the heatmap view based on date range
export async function renderHeatmap(startDateStr, endDateStr) {
    if (!auth.currentUser) return;
    
    // Convert strings to Date objects to get month/year boundaries
    currentStart = new Date(startDateStr);
    currentEnd = new Date(endDateStr);
    
    // Get all records in range
    currentRecords = await getRecordsByDateRange(auth.currentUser.uid, startDateStr, endDateStr);
    
    drawGrid();
}

function drawGrid() {
    container.innerHTML = "";
    
    // Iterate month by month
    let currentMonth = new Date(currentStart.getFullYear(), currentStart.getMonth(), 1);
    const endMonth = new Date(currentEnd.getFullYear(), currentEnd.getMonth(), 1);
    
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
    
    const wrapper = document.createElement("div");
    wrapper.className = "heatmap-wrapper";

    const yAxis = document.createElement("div");
    yAxis.className = "heatmap-y-axis";
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => {
        const dEl = document.createElement("div");
        dEl.textContent = d;
        yAxis.appendChild(dEl);
    });
    wrapper.appendChild(yAxis);
    
    const grid = document.createElement("div");
    grid.className = "heatmap-grid";
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // We want Mon=0, Tue=1, ..., Sun=6
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayIndex = (firstDay + 6) % 7;
    
    // Add empty boxes for offset
    for (let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement("div");
        empty.className = "day-box empty";
        grid.appendChild(empty);
    }
    
    const filterEl = document.getElementById("heatmap-filter");
    const filter = filterEl ? filterEl.value : "overallScore";
    const maxScores = {
        wakeScore: 15,
        sleepScore: 10,
        studyScore: 20,
        musicScore: 15,
        workoutScore: 10,
        pornScore: 20,
        masturbationScore: 10,
        overallScore: 100
    };

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = currentRecords.find(r => r.date === dateStr);
        
        const dayBox = document.createElement("div");
        dayBox.className = "day-box";
        
        if (record) {
            let percentage = 0;
            if (filter === "overallScore") {
                percentage = record.overallScore || 0;
            } else {
                const score = (record.scores && record.scores[filter] !== undefined) ? record.scores[filter] : 0;
                const max = maxScores[filter] || 1;
                percentage = (score / max) * 100;
            }

            if (isNaN(percentage)) percentage = 0;

            dayBox.classList.add(getScoreClass(percentage));
            
            const textSpan = document.createElement("span");
            textSpan.className = "percent-text";
            textSpan.textContent = `${Math.round(percentage)}%`;
            dayBox.appendChild(textSpan);
            
            dayBox.title = `${dateStr}: ${Math.round(percentage)}%`;
            dayBox.addEventListener("click", () => openModal(record));
        } else {
            dayBox.style.backgroundColor = "#eee";
            dayBox.title = `${dateStr}: No data`;
        }
        
        grid.appendChild(dayBox);
    }
    
    wrapper.appendChild(grid);
    block.appendChild(wrapper);
    return block;
}

function getScoreClass(score) {
    if (score >= 90) return "score-90";
    if (score >= 75) return "score-75";
    if (score >= 60) return "score-60";
    if (score >= 40) return "score-40";
    return "score-39";
}

function openModal(record) {
    document.getElementById("modal-date").textContent = record.date;
    document.getElementById("modal-score").textContent = `${record.overallScore}%`;
    document.getElementById("modal-score").className = `score-val ${getScoreClass(record.overallScore)}`;
    
    function formatDuration(mins) {
        if (mins === undefined || isNaN(mins)) return "0h 0m";
        return `${Math.floor(mins/60)}h ${mins%60}m`;
    }
    
    const workoutDisplay = record.inputs.workout !== undefined ? record.inputs.workout : formatDuration(record.inputs.workoutMins);
    
    const details = document.getElementById("modal-details");
    details.innerHTML = `
        <div><strong>Wake:</strong> ${record.inputs.wake || '-'} <br><small>(${record.scores.wakeScore || 0} pts)</small></div>
        <div><strong>Sleep:</strong> ${record.inputs.sleep || '-'} <br><small>(${record.scores.sleepScore || 0} pts)</small></div>
        <div><strong>Study:</strong> ${formatDuration(record.inputs.studyMins)} <br><small>(${record.scores.studyScore || 0} pts)</small></div>
        <div><strong>Music/Ph:</strong> ${formatDuration(record.inputs.musicMins)} <br><small>(${record.scores.musicScore || 0} pts)</small></div>
        <div><strong>Porn:</strong> ${record.inputs.porn || '-'} <br><small>(${record.scores.pornScore || 0} pts)</small></div>
        <div><strong>Masturbation:</strong> ${record.inputs.masturbation || '-'} <br><small>(${record.scores.masturbationScore || 0} pts)</small></div>
        <div><strong>Workout:</strong> ${workoutDisplay} <br><small>(${record.scores.workoutScore || 0} pts)</small></div>
    `;
    
    modal.classList.remove("hidden");
}

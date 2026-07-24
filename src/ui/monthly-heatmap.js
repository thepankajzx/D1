import { auth } from "../auth.js";
import { getAllRecords } from "../db.js";

const container = document.getElementById("heatmap-container");
const togglePercent = document.getElementById("toggle-percent");
const modal = document.getElementById("day-modal");
const closeBtn = document.querySelector(".close-btn");

let currentRecords = [];

export function initHeatmap() {
    if (togglePercent) {
        togglePercent.addEventListener("change", (e) => {
            if (e.target.checked) {
                container.classList.add("show-percent");
            } else {
                container.classList.remove("show-percent");
            }
        });
    }

    const goBtn = document.getElementById("heatmap-go-btn");
    if (goBtn) {
        goBtn.addEventListener("click", () => {
            drawGrid();
        });
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    window.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
}

function getScoreClass(score) {
    if (score >= 90) return "score-level-5";
    if (score >= 75) return "score-level-4";
    if (score >= 60) return "score-level-3";
    if (score >= 40) return "score-level-2";
    return "score-level-1";
}

export async function renderHeatmap() {
    if (!auth.currentUser) return;
    
    currentRecords = await getAllRecords(auth.currentUser.uid);
    drawGrid();
}

function drawGrid() {
    container.innerHTML = "";
    if (currentRecords.length === 0) {
        container.innerHTML = "<p>No records found.</p>";
        return;
    }

    let minDateStr = currentRecords[0].date;
    let maxDateStr = currentRecords[0].date;
    
    currentRecords.forEach(r => {
        if (r.date < minDateStr) minDateStr = r.date;
        if (r.date > maxDateStr) maxDateStr = r.date;
    });

    const startObj = new Date(minDateStr);
    const endObj = new Date(maxDateStr);

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
    
    const firstDay = startObj.getDay();
    const firstDayIndex = (firstDay + 6) % 7;
    
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

    let currDate = new Date(startObj);
    while (currDate <= endObj) {
        const dateStr = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}-${String(currDate.getDate()).padStart(2, '0')}`;
        const record = currentRecords.find(r => r.date === dateStr);
        
        const dayBox = document.createElement("div");
        dayBox.className = "day-box";
        
        let percentage = 0;
        if (record) {
            if (filter === "overallScore") {
                percentage = record.overallScore || 0;
            } else {
                const score = (record.scores && record.scores[filter] !== undefined) ? record.scores[filter] : 0;
                const max = maxScores[filter] || 1;
                percentage = (score / max) * 100;
            }
            dayBox.addEventListener("click", () => openModal(record));
        }

        if (isNaN(percentage)) percentage = 0;

        dayBox.classList.add(getScoreClass(percentage));
        
        const textSpan = document.createElement("span");
        textSpan.className = "percent-text";
        textSpan.textContent = `${Math.round(percentage)}%`;
        dayBox.appendChild(textSpan);
        
        dayBox.title = `${dateStr}: ${Math.round(percentage)}%`;
        
        grid.appendChild(dayBox);
        currDate.setDate(currDate.getDate() + 1);
    }
    
    wrapper.appendChild(grid);
    container.appendChild(wrapper);
}

function openModal(record) {
    document.getElementById("modal-date").textContent = record.date;
    document.getElementById("modal-overall").textContent = record.overallScore + "%";
    
    const details = document.getElementById("modal-details");
    details.innerHTML = "";
    
    const fields = [
        { label: "Wake Up", val: record.inputs.wake },
        { label: "Sleep", val: record.inputs.sleep },
        { label: "Govt Study", val: record.inputs.studyMins + " mins" },
        { label: "Workout", val: record.inputs.workoutMins ? (record.inputs.workoutMins + " mins") : record.inputs.workout },
        { label: "Music+Phone", val: record.inputs.musicMins + " mins" },
        { label: "Porn", val: record.inputs.porn },
        { label: "Masturbation", val: record.inputs.masturbation }
    ];
    
    fields.forEach(f => {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${f.label}:</strong> ${f.val || '-'}`;
        details.appendChild(div);
    });
    
    modal.style.display = "flex";
}

function closeModal() {
    modal.style.display = "none";
}

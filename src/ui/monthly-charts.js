import { auth } from "../auth.js";
import { getRecordsByDateRange } from "../db.js";

const habits = [
    { id: "wakeScore", label: "Wake Up (Time)", type: "time", max: 24 },
    { id: "sleepScore", label: "Sleep (Time)", type: "sleepTime", max: 24 },
    { id: "studyScore", label: "Govt Study (Hrs)", type: "duration", max: 10 },
    { id: "workoutScore", label: "Workout (Hrs)", type: "duration", max: 2 },
    { id: "musicScore", label: "Music+Phone (Hrs)", type: "duration", max: 5 },
    { id: "pornScore", label: "Porn (Score)", max: 20, type: "score" },
    { id: "masturbationScore", label: "Masturbation (Score)", max: 10, type: "score" },
    { id: "overallScore", label: "Overall Score (%)", max: 100, type: "score" }
];

const colors = [
    "#4285F4", "#DB4437", "#0F9D58", "#AB47BC", 
    "#FF7043", "#00ACC1", "#F4B400", "#333333"
];

export function initCharts() {
    const filtersContainer = document.getElementById("chart-habits");
    if (!filtersContainer) return;
    filtersContainer.innerHTML = "";
    
    // Inject checkboxes
    habits.forEach((habit) => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = habit.id;
        if (habit.id === "overallScore") checkbox.checked = true; // default
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + habit.label));
        filtersContainer.appendChild(label);
    });

    // Set default dates
    const endInput = document.getElementById("chart-end-date");
    const startInput = document.getElementById("chart-start-date");
    if (endInput && startInput) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        
        endInput.value = end.toISOString().split('T')[0];
        startInput.value = start.toISOString().split('T')[0];
    }

    const genBtn = document.getElementById("generate-charts");
    if (genBtn) {
        genBtn.addEventListener("click", () => renderCharts());
    }
}

function timeToFloat(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
}

function extractData(record, habit) {
    if (habit.type === "time") {
        return timeToFloat(record.inputs.wake) || 0;
    }
    if (habit.type === "sleepTime") {
        let val = timeToFloat(record.inputs.sleep) || 0;
        if (val < 12) val += 24; 
        return val;
    }
    if (habit.type === "duration") {
        if (habit.id === "studyScore") return (record.inputs.studyMins || 0) / 60;
        if (habit.id === "musicScore") return (record.inputs.musicMins || 0) / 60;
        if (habit.id === "workoutScore") {
            if (record.inputs.workout !== undefined) return record.inputs.workout === 'Yes' ? 0.5 : 0;
            return (record.inputs.workoutMins || 0) / 60;
        }
    }
    return habit.id === 'overallScore' ? (record.overallScore || 0) : ((record.scores && record.scores[habit.id]) || 0);
}

function formatFloatToTime(val, isSleep) {
    if (val === null || isNaN(val)) return '-';
    if (isSleep && val >= 24) val -= 24;
    let h = Math.floor(val);
    let m = Math.round((val - h) * 60);
    if (m === 60) { h += 1; m = 0; }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function shortDate(dateStr) {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}

export async function renderCharts() {
    if (!auth.currentUser) return;
    
    const container = document.getElementById("charts-container");
    if (!container) return;
    container.innerHTML = "";
    
    const startDateStr = document.getElementById("chart-start-date").value;
    const endDateStr = document.getElementById("chart-end-date").value;

    if (!startDateStr || !endDateStr) {
        container.innerHTML = "<p>Please select a date range.</p>";
        return;
    }

    const records = await getRecordsByDateRange(auth.currentUser.uid, startDateStr, endDateStr);
    if (records.length === 0) {
        container.innerHTML = "<p>No data in this date range.</p>";
        return;
    }

    const labels = records.map(r => shortDate(r.date));
    
    const selectedIds = Array.from(document.querySelectorAll("#chart-habits input:checked")).map(el => el.value);
    const selectedHabits = habits.filter(h => selectedIds.includes(h.id));
    
    if (selectedHabits.length === 0) {
        container.innerHTML = "<p>Please select at least one habit.</p>";
        return;
    }

    selectedHabits.forEach((habit, i) => {
        const card = document.createElement("div");
        card.className = "card mt-1";
        card.innerHTML = `<h4>${habit.label}</h4>`;
        
        const wrapper = document.createElement("div");
        wrapper.className = "chart-wrapper";
        wrapper.style.height = '250px';
        wrapper.style.position = 'relative';
        
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(800, labels.length * 40); 
        canvas.height = 230;
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = '230px';
        
        wrapper.appendChild(canvas);
        card.appendChild(wrapper);
        container.appendChild(card);
        
        const data = records.map(r => extractData(r, habit));
        drawNativeChart(canvas, labels, data, habit, colors[i % colors.length]);
    });
}

function drawNativeChart(canvas, labels, data, habit, color) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    let min = Math.min(...data);
    let max = Math.max(...data);
    if (habit.max !== undefined) max = Math.max(max, habit.max);
    if (min === max) { min -= 1; max += 1; }
    if (min > 0 && habit.type !== "sleepTime" && habit.type !== "time") min = 0;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
        const val = min + (max - min) * (i / steps);
        const y = padding.top + chartHeight - (i / steps) * chartHeight;
        
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        
        let labelStr = "";
        if (habit.type === "time" || habit.type === "sleepTime") {
            labelStr = formatFloatToTime(val, habit.type === "sleepTime");
        } else {
            labelStr = Math.round(val * 10) / 10;
        }
        ctx.fillText(labelStr, padding.left - 10, y);
    }
    ctx.stroke();
    
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    labels.forEach((lbl, i) => {
        const x = padding.left + (i / (labels.length - 1 || 1)) * chartWidth;
        ctx.fillText(lbl, x, height - padding.bottom + 10);
    });
    
    if (data.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        data.forEach((val, i) => {
            const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
            const normalizedY = (val - min) / (max - min);
            const y = padding.top + chartHeight - (normalizedY * chartHeight);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        ctx.fillStyle = color;
        data.forEach((val, i) => {
            const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
            const normalizedY = (val - min) / (max - min);
            const y = padding.top + chartHeight - (normalizedY * chartHeight);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "#333";
            ctx.font = "10px Arial";
            let valStr = "";
            if (habit.type === "time" || habit.type === "sleepTime") {
                valStr = formatFloatToTime(val, habit.type === "sleepTime");
            } else {
                valStr = Math.round(val * 10) / 10;
            }
            ctx.fillText(valStr, x, y - 15);
            ctx.fillStyle = color;
        });
    }
}

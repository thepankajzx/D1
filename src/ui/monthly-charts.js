import { auth } from "../auth.js";
import { getRecordsByDateRange } from "../db.js";

const habits = [
    { id: "wakeScore", label: "Wake Up (Time)", type: "time" },
    { id: "sleepScore", label: "Sleep (Time)", type: "sleepTime" },
    { id: "studyScore", label: "Govt Study (Hrs)", type: "duration" },
    { id: "workoutScore", label: "Workout (Hrs)", type: "duration" },
    { id: "musicScore", label: "Music+Phone (Hrs)", type: "duration" },
    { id: "pornScore", label: "Porn (Score)", max: 20, type: "score" },
    { id: "masturbationScore", label: "Masturbation (Score)", max: 10, type: "score" },
    { id: "overallScore", label: "Overall Score (%)", max: 100, type: "score" }
];

// Colors for the charts
const colors = [
    "#4285F4", "#DB4437", "#0F9D58", "#AB47BC", 
    "#FF7043", "#00ACC1", "#F4B400", "#333333"
];

let chartInstances = [];

export function initCharts() {
    const filtersContainer = document.getElementById("chart-habits");
    
    // Inject checkboxes
    habits.forEach((habit, idx) => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = habit.id;
        if (habit.id === "overallScore") checkbox.checked = true; // default
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + habit.label));
        filtersContainer.appendChild(label);
    });
}

// Convert HH:MM to float hours
function timeToFloat(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
}

// Helper to extract the right data point based on habit type
function extractData(record, habit) {
    if (habit.type === "time") {
        return timeToFloat(record.inputs.wake);
    }
    if (habit.type === "sleepTime") {
        let val = timeToFloat(record.inputs.sleep);
        if (val !== null && val < 12) {
            val += 24; // map times like 1 AM to 25 for smoother graph
        }
        return val;
    }
    if (habit.type === "duration") {
        if (habit.id === "studyScore") return record.inputs.studyMins / 60;
        if (habit.id === "musicScore") return record.inputs.musicMins / 60;
        if (habit.id === "workoutScore") {
            // handle old records
            if (record.inputs.workout !== undefined) return record.inputs.workout === 'Yes' ? 0.5 : 0;
            return (record.inputs.workoutMins || 0) / 60;
        }
    }
    // Type Score
    return habit.id === 'overallScore' ? record.overallScore : record.scores[habit.id];
}

function formatFloatToTime(val, isSleep) {
    if (val === null || isNaN(val)) return '-';
    if (isSleep && val >= 24) val -= 24;
    let h = Math.floor(val);
    let m = Math.round((val - h) * 60);
    if (m === 60) { h += 1; m = 0; }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatFloatToDuration(val) {
    if (val === null || isNaN(val)) return '-';
    let h = Math.floor(val);
    let m = Math.round((val - h) * 60);
    return `${h}h ${m}m`;
}

// Format "2026-07-21" to "21 Jul"
function shortDate(dateStr) {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}

export async function renderCharts(startDateStr, endDateStr) {
    if (!auth.currentUser) return;
    
    // Destroy previous charts
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];
    
    const container = document.getElementById("charts-container");
    container.innerHTML = "";
    
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

    const mode = document.querySelector("input[name='chartMode']:checked").value;

    if (mode === "combined") {
        const wrapper = document.createElement("div");
        wrapper.className = "chart-wrapper";
        const canvas = document.createElement("canvas");
        wrapper.appendChild(canvas);
        container.appendChild(wrapper);
        
        const datasets = selectedHabits.map((habit, i) => {
            return {
                label: habit.label,
                data: records.map(r => extractData(r, habit)),
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + '33',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6
            };
        });

        const chart = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grace: '5%' // Add padding to top so line doesn't cut off
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const habit = selectedHabits[context.datasetIndex];
                                const val = context.parsed.y;
                                if (habit.type === 'time' || habit.type === 'sleepTime') {
                                    return `${habit.label}: ${formatFloatToTime(val, habit.type === 'sleepTime')}`;
                                }
                                if (habit.type === 'duration') {
                                    return `${habit.label}: ${formatFloatToDuration(val)}`;
                                }
                                return `${habit.label}: ${val}`;
                            }
                        }
                    }
                }
            }
        });
        
        // Fix height for wrapper
        wrapper.style.height = '400px';
        chartInstances.push(chart);
        
    } else {
        // Separate Mode
        selectedHabits.forEach((habit, i) => {
            const card = document.createElement("div");
            card.className = "card mt-1";
            card.innerHTML = `<h4>${habit.label}</h4>`;
            
            const wrapper = document.createElement("div");
            wrapper.className = "chart-wrapper";
            wrapper.style.height = '250px'; // fixed height for separate charts
            
            const canvas = document.createElement("canvas");
            wrapper.appendChild(canvas);
            card.appendChild(wrapper);
            container.appendChild(card);
            
            const data = records.map(r => extractData(r, habit));
            
            const chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: habit.label,
                        data: data,
                        borderColor: colors[i % colors.length],
                        backgroundColor: colors[i % colors.length] + '33',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            max: habit.max, // Optional max for scores
                            grace: '10%' // Padding on top
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const val = context.parsed.y;
                                    if (habit.type === 'time' || habit.type === 'sleepTime') {
                                        return `${habit.label}: ${formatFloatToTime(val, habit.type === 'sleepTime')}`;
                                    }
                                    if (habit.type === 'duration') {
                                        return `${habit.label}: ${formatFloatToDuration(val)}`;
                                    }
                                    return `${habit.label}: ${val}`;
                                }
                            }
                        }
                    }
                }
            });
            chartInstances.push(chart);
        });
    }
}

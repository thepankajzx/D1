import { auth } from "../auth.js";
import { getRecordsByDateRange } from "../db.js";

const habits = [
    { id: "wakeScore", label: "Wake Up", max: 15 },
    { id: "sleepScore", label: "Sleep", max: 10 },
    { id: "pornScore", label: "Porn", max: 20 },
    { id: "masturbationScore", label: "Masturbation", max: 10 },
    { id: "studyScore", label: "Govt Study", max: 20 },
    { id: "workoutScore", label: "Workout", max: 10 },
    { id: "musicScore", label: "Music+Phone", max: 15 },
    { id: "overallScore", label: "Overall Score", max: 100 }
];

// Colors for the charts
const colors = [
    "#4285F4", "#DB4437", "#F4B400", "#0F9D58", 
    "#AB47BC", "#00ACC1", "#FF7043", "#333333"
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

    const labels = records.map(r => r.date);
    
    // Determine selected habits
    const selectedIds = Array.from(document.querySelectorAll("#chart-habits input:checked")).map(el => el.value);
    const selectedHabits = habits.filter(h => selectedIds.includes(h.id));
    
    if (selectedHabits.length === 0) {
        container.innerHTML = "<p>Please select at least one habit.</p>";
        return;
    }

    const mode = document.querySelector("input[name='chartMode']:checked").value;

    if (mode === "combined") {
        const canvas = document.createElement("canvas");
        container.appendChild(canvas);
        
        const datasets = selectedHabits.map((habit, i) => {
            return {
                label: habit.label,
                data: records.map(r => habit.id === 'overallScore' ? r.overallScore : r.scores[habit.id]),
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + '33', // 20% opacity
                borderWidth: 2,
                fill: false,
                tension: 0.3
            };
        });

        const chart = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        chartInstances.push(chart);
        
    } else {
        // Separate Mode
        selectedHabits.forEach((habit, i) => {
            const wrapper = document.createElement("div");
            wrapper.className = "card mt-1";
            wrapper.innerHTML = `<h4>${habit.label}</h4>`;
            
            const canvas = document.createElement("canvas");
            wrapper.appendChild(canvas);
            container.appendChild(wrapper);
            
            const data = records.map(r => habit.id === 'overallScore' ? r.overallScore : r.scores[habit.id]);
            
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
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, max: habit.max }
                    }
                }
            });
            chartInstances.push(chart);
        });
    }
}

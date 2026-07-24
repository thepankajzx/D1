import { auth } from "../auth.js";
import { getRecordsByDateRange } from "../db.js";

const habits = [
    { id: "wakeScore", inputKey: "wake", label: "Wake Up", max: 15, type: "time" },
    { id: "sleepScore", inputKey: "sleep", label: "Sleep Time", max: 10, type: "time" },
    { id: "studyScore", inputKey: "studyMins", label: "Study", max: 20, type: "duration" },
    { id: "workoutScore", inputKey: "workoutMins", label: "Workout", max: 10, type: "duration" },
    { id: "musicScore", inputKey: "musicMins", label: "Music+Phone", max: 15, type: "duration" },
    { id: "pornScore", inputKey: "porn", label: "Porn", max: 20, type: "boolean" },
    { id: "masturbationScore", inputKey: "masturbation", label: "Masturbation", max: 10, type: "boolean" },
    { id: "overallScore", inputKey: null, label: "Overall Score", max: 100, type: "score" }
];

// Colors for the charts
const colors = [
    "#4285F4", "#DB4437", "#0F9D58", "#AB47BC", 
    "#FF7043", "#00ACC1", "#F4B400", "#333333"
];

let chartInstances = [];
let modalChartInstance = null;
let currentRecords = []; // Store current records globally for tooltips

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

    const genBtn = document.getElementById("generate-charts");
    if (genBtn) {
        genBtn.addEventListener("click", renderCharts);
    }

    // Modal Close
    document.getElementById("close-chart-modal").addEventListener("click", () => {
        document.getElementById("chart-modal").style.display = "none";
        if (modalChartInstance) {
            modalChartInstance.destroy();
            modalChartInstance = null;
        }
    });
}

// Helper to extract the score for Y-axis
function extractData(record, habit) {
    if (habit.id === 'overallScore') return record.overallScore || 0;
    return (record.scores && record.scores[habit.id]) || 0;
}

// Helper to format the original raw value for the tooltip
function formatRawValue(record, habit) {
    if (habit.id === 'overallScore') return `${record.overallScore}%`;
    
    let raw = record.inputs[habit.inputKey];
    if (habit.type === 'duration') {
        if (habit.inputKey === 'workoutMins' && record.inputs.workout !== undefined) {
            return record.inputs.workout === 'Yes' ? 'Done' : 'No';
        }
        let mins = parseInt(raw) || 0;
        let h = Math.floor(mins / 60);
        let m = mins % 60;
        return `${h}h ${m}m`;
    }
    return raw || '-';
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
    currentRecords = records;
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
        const card = document.createElement("div");
        card.className = "card mt-2";
        card.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3>Combined Performance</h3>
                            <button class="zoom-btn" title="Expand Chart" style="padding: 6px 12px; font-size: 0.9rem; background: #eee; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">⛶</button>
                          </div>`;

        const wrapper = document.createElement("div");
        wrapper.className = "chart-wrapper";
        wrapper.style.marginTop = "10px";
        const canvas = document.createElement("canvas");
        wrapper.appendChild(canvas);
        card.appendChild(wrapper);
        container.appendChild(card);
        
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
                    legend: {
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            pointStyleWidth: 10,
                            boxWidth: 10,
                            boxHeight: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const habit = selectedHabits[context.datasetIndex];
                                const record = currentRecords[context.dataIndex];
                                const score = context.parsed.y;
                                const rawVal = formatRawValue(record, habit);
                                return `${habit.label}: ${rawVal} (Score: ${score})`;
                            }
                        }
                    }
                }
            }
        });
        
        // Fix height for wrapper
        wrapper.style.height = '400px';
        chartInstances.push(chart);
        
        // Add zoom functionality
        card.querySelector('.zoom-btn').addEventListener('click', () => {
            openChartModal("Combined Performance", datasets, labels);
        });
        
    } else {
        // Separate Mode
        selectedHabits.forEach((habit, i) => {
            const card = document.createElement("div");
            card.className = "card mt-1";
            card.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center;">
                                <h4>${habit.label}</h4>
                                <button class="zoom-btn" title="Expand Chart" style="padding: 6px 12px; font-size: 0.9rem; background: #eee; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">⛶</button>
                              </div>`;
            
            const wrapper = document.createElement("div");
            wrapper.className = "chart-wrapper";
            wrapper.style.height = '250px'; // fixed height for separate charts
            
            const canvas = document.createElement("canvas");
            wrapper.appendChild(canvas);
            card.appendChild(wrapper);
            container.appendChild(card);
            
            const data = records.map(r => extractData(r, habit));
            
            const chartDataset = [{
                label: habit.label,
                data: data,
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + '33',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 5
            }];

            const chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: chartDataset
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
                        legend: {
                            labels: {
                                usePointStyle: true,
                                pointStyle: 'circle',
                                pointStyleWidth: 10,
                                boxWidth: 10,
                                boxHeight: 10
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const record = currentRecords[context.dataIndex];
                                    const score = context.parsed.y;
                                    const rawVal = formatRawValue(record, habit);
                                    return `${habit.label}: ${rawVal} (Score: ${score})`;
                                }
                            }
                        }
                    }
                }
            });
            chartInstances.push(chart);
            
            // Add zoom functionality
            card.querySelector('.zoom-btn').addEventListener('click', () => {
                openChartModal(habit.label, chartDataset, labels, habit);
            });
        });
    }
}

export function openChartModal(title, datasets, labels, habit = null) {
    const modal = document.getElementById("chart-modal");
    const modalTitle = document.getElementById("chart-modal-title");
    const canvas = document.getElementById("chart-modal-canvas");
    const heatmapCanvas = document.getElementById("heatmap-modal-canvas");
    
    heatmapCanvas.style.display = "none";
    canvas.style.display = "block";

    modal.style.display = "flex";
    modalTitle.textContent = title;
    
    if (modalChartInstance) {
        modalChartInstance.destroy();
    }
    
    // Configure tooltip exactly like original
    const tooltipConfig = {
        callbacks: {
            label: function(context) {
                const dsLabel = context.dataset.label;
                const score = context.parsed.y;
                const record = currentRecords[context.dataIndex];
                
                // If we passed a specific habit, use it. Otherwise guess from label (for combined)
                const h = habit || habits.find(hbt => hbt.label === dsLabel);
                
                if (h && record) {
                    const rawVal = formatRawValue(record, h);
                    return `${h.label}: ${rawVal} (Score: ${score})`;
                }
                return `${dsLabel}: ${score}`;
            }
        }
    };
    
    // Common options
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: { 
                beginAtZero: true,
                grace: '10%'
            }
        },
        plugins: {
            tooltip: tooltipConfig,
            legend: {
                labels: { 
                    usePointStyle: true,
                    pointStyle: 'circle',
                    pointStyleWidth: 10,
                    boxWidth: 10,
                    boxHeight: 10,
                    font: { size: 14 } 
                } // Bigger legend on mobile
            }
        }
    };
    
    if (habit && habit.max !== undefined) {
        options.scales.y.max = habit.max;
    }

    modalChartInstance = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: options
    });
}

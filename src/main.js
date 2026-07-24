import { auth, login, logout } from "./auth.js";
import { onAuthChange } from "./auth.js";
import { initProfile } from "./ui/profile.js";
import { initDailyEntry, updateDashboard } from "./ui/daily-entry.js";
import { initHeatmap, renderHeatmap } from "./ui/monthly-heatmap.js";
import { initCharts, renderCharts } from "./ui/monthly-charts.js";
import { wipeOldRecords } from "./db.js";

// DOM Elements
const authSection = document.getElementById("auth-section");
const mainSection = document.getElementById("main-section");
const loginForm = document.getElementById("login-form");
const authError = document.getElementById("auth-error");

// Tabs
const navDaily = document.getElementById("nav-daily");
const navMonthly = document.getElementById("nav-monthly");
const navProfile = document.getElementById("nav-profile");

const tabDaily = document.getElementById("tab-daily");
const tabMonthly = document.getElementById("tab-monthly");
const tabProfile = document.getElementById("tab-profile");

// Monthly Sub-tabs
const subHeatmapBtn = document.getElementById("sub-heatmap");
const subChartsBtn = document.getElementById("sub-charts");
const viewHeatmap = document.getElementById("view-heatmap");
const viewCharts = document.getElementById("view-charts");

const monthlyRange = document.getElementById("monthly-range");
const customRangeInputs = document.getElementById("custom-range-inputs");
const applyCustomRangeBtn = document.getElementById("apply-custom-range");
const generateChartsBtn = document.getElementById("generate-charts");

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initHeatmap();
    initCharts();
    
    // Auth Listener
    onAuthChange(async (user) => {
        if (user) {
            authSection.classList.add("hidden");
            mainSection.classList.remove("hidden");
            await initProfile();
            await initDailyEntry();
            switchTab("daily");
        } else {
            authSection.classList.remove("hidden");
            mainSection.classList.add("hidden");
        }
    });

    // Login Form
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = document.getElementById("login-password").value;
        try {
            await login(code);
            window.location.reload(); // Refresh to trigger onAuthChange and update UI
        } catch (error) {
            authError.textContent = "Login failed: " + error.message;
        }
    });

    // Navigation
    navDaily.addEventListener("click", () => switchTab("daily"));
    navMonthly.addEventListener("click", () => switchTab("monthly"));
    navProfile.addEventListener("click", () => switchTab("profile"));

    subHeatmapBtn.addEventListener("click", () => switchMonthlyTab("heatmap"));
    subChartsBtn.addEventListener("click", () => switchMonthlyTab("charts"));

    // Event listeners for data updates
    window.addEventListener("record-saved", () => {
        if (!tabMonthly.classList.contains("hidden")) {
            loadMonthlyData();
        }
    });

    // Date Range handler
    monthlyRange.addEventListener("change", () => {
        if (monthlyRange.value === "custom") {
            customRangeInputs.classList.remove("hidden");
        } else {
            customRangeInputs.classList.add("hidden");
            loadMonthlyData();
        }
    });

    document.getElementById("apply-custom-range").addEventListener("click", () => {
        loadMonthlyData();
    });

    window.addEventListener('data-updated', () => {
        // Refresh the heatmap/charts data in background so it's ready
        loadMonthlyData();
    });

    // Expose a global method for the user to wipe all old data via console
    window.wipeDatabase = async function() {
        if (!auth.currentUser) {
            console.error("Not logged in");
            return;
        }
        const today = new Date();
        const tzOffset = today.getTimezoneOffset() * 60000;
        const localTodayStr = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
        
        // Wipe everything strictly before localTodayStr. Or wait, user says "aaj se pehle ka", so < today.
        // If they want to wipe EVERYTHING, even today, they can just use a future date like "2030-01-01"
        console.log("Wiping all records...");
        await wipeOldRecords(auth.currentUser.uid, "2030-01-01");
        console.log("Database Wiped! Please refresh the page.");
        alert("Database successfully wiped! Refreshing page...");
        window.location.reload();
    };

    generateChartsBtn.addEventListener("click", () => {
        loadMonthlyData("charts");
    });
});

function switchTab(tabId) {
    // Hide all
    tabDaily.classList.add("hidden");
    tabMonthly.classList.add("hidden");
    tabProfile.classList.add("hidden");
    
    navDaily.classList.remove("active");
    navMonthly.classList.remove("active");
    navProfile.classList.remove("active");

    if (tabId === "daily") {
        tabDaily.classList.remove("hidden");
        navDaily.classList.add("active");
        if (auth.currentUser) updateDashboard(auth.currentUser.uid);
    } else if (tabId === "monthly") {
        tabMonthly.classList.remove("hidden");
        navMonthly.classList.add("active");
        loadMonthlyData();
    } else if (tabId === "profile") {
        tabProfile.classList.remove("hidden");
        navProfile.classList.add("active");
    }
}

function switchMonthlyTab(tabId) {
    viewHeatmap.classList.add("hidden");
    viewCharts.classList.add("hidden");
    subHeatmapBtn.classList.remove("active");
    subChartsBtn.classList.remove("active");

    const hf = document.getElementById("heatmap-filter-group");

    if (tabId === "heatmap") {
        viewHeatmap.classList.remove("hidden");
        subHeatmapBtn.classList.add("active");
        if(hf) hf.style.display = "block";
        loadMonthlyData("heatmap");
    } else {
        viewCharts.classList.remove("hidden");
        subChartsBtn.classList.add("active");
        if(hf) hf.style.display = "none";
        loadMonthlyData("charts");
    }
}

function getDateRange() {
    const range = monthlyRange.value;
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    
    // Default: local today
    let endDate = new Date(Date.now() - tzOffset);
    let startDate = new Date(Date.now() - tzOffset);

    if (range === "current") {
        startDate.setDate(1); // First day of current month
    } else if (range === "30") {
        startDate.setDate(startDate.getDate() - 30);
    } else if (range === "90") {
        startDate.setDate(startDate.getDate() - 90);
    } else if (range === "180") {
        startDate.setDate(startDate.getDate() - 180);
    } else if (range === "365") {
        startDate.setDate(startDate.getDate() - 365);
    } else if (range === "custom") {
        const customStart = document.getElementById("range-start").value;
        const customEnd = document.getElementById("range-end").value;
        if (!customStart || !customEnd) return null;
        return { start: customStart, end: customEnd };
    }

    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

async function loadMonthlyData(forceTab = null) {
    const range = getDateRange();
    if (!range) return;

    const activeTab = forceTab || (subHeatmapBtn.classList.contains("active") ? "heatmap" : "charts");

    if (activeTab === "heatmap") {
        await renderHeatmap(range.start, range.end);
    } else {
        await renderCharts(range.start, range.end);
    }
}

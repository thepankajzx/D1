import { auth, login } from "./auth.js";
import { onAuthChange } from "./auth.js";
import { initProfile } from "./ui/profile.js";
import { initDailyEntry, updateDashboard } from "./ui/daily-entry.js";
import { initHeatmap, renderHeatmap } from "./ui/monthly-heatmap.js";
import { initCharts, renderCharts } from "./ui/monthly-charts.js";

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
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-password").value;
        try {
            await login(email, pass);
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

    applyCustomRangeBtn.addEventListener("click", () => {
        loadMonthlyData();
    });

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

    if (tabId === "heatmap") {
        viewHeatmap.classList.remove("hidden");
        subHeatmapBtn.classList.add("active");
        loadMonthlyData("heatmap");
    } else {
        viewCharts.classList.remove("hidden");
        subChartsBtn.classList.add("active");
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

import { auth, logout } from "../auth.js";
import { saveSettings, getSettings } from "../db.js";

const profileEmail = document.getElementById("profile-email");
const btnLogout = document.getElementById("btn-logout");
const settingsForm = document.getElementById("settings-form");
const settingsMsg = document.getElementById("settings-msg");

let currentSettings = null;

export async function initProfile() {
    profileEmail.textContent = auth.currentUser.uid; // This is now the secret code

    btnLogout.addEventListener("click", async () => {
        await logout();
    });

    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const hStudy = parseInt(document.getElementById("set-study-h").value) || 0;
        const mStudy = parseInt(document.getElementById("set-study-m").value) || 0;
        
        const hMusic = parseInt(document.getElementById("set-music-h").value) || 0;
        const mMusic = parseInt(document.getElementById("set-music-m").value) || 0;

        const newSettings = {
            wakeTarget: document.getElementById("set-wake").value,
            sleepTarget: document.getElementById("set-sleep").value,
            studyTargetMins: (hStudy * 60) + mStudy,
            musicMaxMins: (hMusic * 60) + mMusic
        };

        try {
            await saveSettings(auth.currentUser.uid, newSettings);
            currentSettings = newSettings;
            settingsMsg.textContent = "Settings saved successfully!";
            settingsMsg.style.color = "green";
            setTimeout(() => { settingsMsg.textContent = ""; }, 3000);
            
            // Dispatch event to notify other parts of the app if needed
            window.dispatchEvent(new Event('settings-updated'));
        } catch (error) {
            console.error(error);
            settingsMsg.textContent = "Error saving settings.";
            settingsMsg.style.color = "red";
        }
    });

    await loadSettings();
}

export async function loadSettings() {
    if (!auth.currentUser) return;
    
    currentSettings = await getSettings(auth.currentUser.uid);
    
    document.getElementById("set-wake").value = currentSettings.wakeTarget;
    document.getElementById("set-sleep").value = currentSettings.sleepTarget;
    
    document.getElementById("set-study-h").value = Math.floor(currentSettings.studyTargetMins / 60);
    document.getElementById("set-study-m").value = currentSettings.studyTargetMins % 60;
    
    document.getElementById("set-music-h").value = Math.floor(currentSettings.musicMaxMins / 60);
    document.getElementById("set-music-m").value = currentSettings.musicMaxMins % 60;
}

export function getCurrentSettings() {
    return currentSettings;
}

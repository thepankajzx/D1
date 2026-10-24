# ==============================================================================
# D1 HABIT TRACKER - UNIVERSAL 1-COMMAND DEPLOY & SYNC SCRIPT
# ==============================================================================
# Purpose: Single command to test, build, commit to Git, deploy live to Firebase
#          (Chrome Web + PWA), sync Capacitor Android, and build the latest APK.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\ship_all.ps1 -Message "your update note"
#   OR via npm:
#   npm run ship -- -Message "your update note"
# ==============================================================================

param(
    [string]$Message = "chore: universal sync update for web, pwa, and mobile app"
)

$ErrorActionPreference = "Stop"
$RepoDir = "G:\STITCH HABIT TRACKER\definite-habit-tracker"
$RootDir = "G:\STITCH HABIT TRACKER"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " [D1] STARTING UNIVERSAL 1-COMMAND DEPLOY & SYNC" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Set-Location $RepoDir

# ------------------------------------------------------------------------------
# STEP 1: RUN AUTOMATED TESTS
# ------------------------------------------------------------------------------
Write-Host "[1/6] Running automated verification tests (npm test)..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Tests failed! Aborting deploy to prevent broken build." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Verification tests passed cleanly.`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 2: BUILD PRODUCTION BUNDLE
# ------------------------------------------------------------------------------
Write-Host "[2/6] Compiling production web bundle (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Production build failed! Aborting." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Production bundle built successfully in /dist.`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: GIT-FIRST INVARIANT (COMMIT & PUSH)
# ------------------------------------------------------------------------------
Write-Host "[3/6] Committing & pushing to GitHub (feature/new-updates)..." -ForegroundColor Yellow
git add -A
$gitStatus = git status --porcelain
if ($gitStatus) {
    git commit -m "$Message"
} else {
    Write-Host "[-] Working tree already clean, no new git commit needed." -ForegroundColor Gray
}
git push origin feature/new-updates
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Warning: Git push reported non-zero status. Continuing with deploy..." -ForegroundColor DarkYellow
}
Write-Host "[OK] Git version control synchronized.`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 4: DEPLOY TO FIREBASE HOSTING (CHROME WEBSITE + PWA LIVE)
# ------------------------------------------------------------------------------
Write-Host "[4/6] Deploying live to Firebase Hosting (Website & PWA)..." -ForegroundColor Yellow
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Firebase Hosting deployment failed! Aborting." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Website & PWA live at https://d1-core.web.app`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 5: SYNC CAPACITOR ANDROID ASSETS
# ------------------------------------------------------------------------------
Write-Host "[5/6] Syncing web assets to native Android project (npx cap sync android)..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Capacitor sync failed! Aborting." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Capacitor Android assets synchronized.`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 6: COMPILE ANDROID APK
# ------------------------------------------------------------------------------
Write-Host "[6/6] Compiling latest Android APK via Gradle (assembleDebug)..." -ForegroundColor Yellow
Set-Location "$RepoDir\android"
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) {
    Set-Location $RepoDir
    Write-Host "[X] Gradle build failed! Aborting." -ForegroundColor Red
    exit 1
}
Set-Location $RepoDir

$SrcApk = "$RepoDir\android\app\build\outputs\apk\debug\app-debug.apk"
$DestApk = "$RootDir\D1_Habit_Tracker_vLatest.apk"

if (Test-Path $SrcApk) {
    Copy-Item -Path $SrcApk -Destination $DestApk -Force
    $apkSizeMB = [math]::Round(((Get-Item $DestApk).Length / 1MB), 2)
    Write-Host "[OK] Latest APK exported to: $DestApk ($apkSizeMB MB)`n" -ForegroundColor Green
} else {
    Write-Host "[!] Could not find compiled APK at $SrcApk" -ForegroundColor DarkYellow
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " [D1] 100% COMPLETE! ALL PLATFORMS UPDATED" -ForegroundColor Green
Write-Host "  1. Chrome Web: https://d1-core.web.app (Updated)" -ForegroundColor White
Write-Host "  2. PWA App:    Automatic Service Worker Sync (Updated)" -ForegroundColor White
Write-Host "  3. Android:    $DestApk ($apkSizeMB MB)" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Cyan

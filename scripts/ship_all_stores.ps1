# ==============================================================================
# D1 HABIT TRACKER - DUAL-STORE MASTER RELEASE & SHIP SCRIPT
# ==============================================================================
# Target Stores:
#   1. Google Play Store (Android .aab bundle)
#   2. Microsoft Store (Windows 10 & 11 .msix / .msixbundle)
#
# Guardrails:
#   - ZERO-CLASH: No modifications to android/ configuration files.
#   - CLEAN ISOLATION: Windows artifacts strictly isolated in windows_store_build/.
# ==============================================================================

param(
    [switch]$SkipAndroid = $false,
    [switch]$SkipWindows = $false,
    [string]$VersionOverride = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoDir = Resolve-Path "$ScriptDir\.."
Set-Location $RepoDir

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " [D1] MASTER DUAL-STORE RELEASE AUTOMATION" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Determine Version from package.json
$packageJsonPath = Join-Path $RepoDir "package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$Version = if ($VersionOverride) { $VersionOverride } else { $packageJson.version }
Write-Host "Target Version: $Version" -ForegroundColor Yellow

# ------------------------------------------------------------------------------
# STEP A: SINGLE SHARED REACT BUILD
# ------------------------------------------------------------------------------
Write-Host "`n[STEP A] Compiling Single Shared Web Bundle (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Shared build failed! Aborting release pipeline." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Shared React web bundle built successfully in /dist.`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP B: GOOGLE PLAY STORE ANDROID BUNDLE (.AAB)
# ------------------------------------------------------------------------------
$androidAabPath = "$RepoDir\android\app\build\outputs\bundle\release\app-release.aab"
$androidCleanOut = "$RepoDir\android_store_build"

if (-not $SkipAndroid) {
    Write-Host "[STEP B] Syncing & Compiling Android Release Bundle (.aab)..." -ForegroundColor Yellow
    
    # Sync dist to Android assets (without touching any Gradle/Manifest configs)
    Write-Host "  -> Running Capacitor sync for Android..." -ForegroundColor Gray
    npx cap sync android
    
    # Run gradle bundleRelease
    Write-Host "  -> Running gradlew.bat bundleRelease..." -ForegroundColor Gray
    Set-Location "$RepoDir\android"
    try {
        .\gradlew.bat bundleRelease
        Set-Location $RepoDir
        
        if (Test-Path $androidAabPath) {
            if (-not (Test-Path $androidCleanOut)) {
                New-Item -ItemType Directory -Path $androidCleanOut -Force | Out-Null
            }
            $finalAab = "$androidCleanOut\D1_PlayStore_Release_v$Version.aab"
            Copy-Item $androidAabPath $finalAab -Force
            Write-Host "[OK] Android Play Store Bundle (.aab) created successfully!" -ForegroundColor Green
        } else {
            Write-Host "[!] Note: Gradle completed but output file not found at expected path: $androidAabPath" -ForegroundColor DarkYellow
        }
    } catch {
        Set-Location $RepoDir
        Write-Host "[!] Warning: Android Gradle build encountered an error: $($_.Exception.Message)" -ForegroundColor DarkYellow
        Write-Host "[*] Note: You can run Android build separately whenever Android SDK is configured." -ForegroundColor Gray
    }
} else {
    Write-Host "[STEP B] Skipped Android build (-SkipAndroid)." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# STEP C: MICROSOFT STORE WINDOWS PACKAGING (.MSIX)
# ------------------------------------------------------------------------------
$windowsCleanOut = "$RepoDir\windows_store_build"
$finalMsix = "$windowsCleanOut\D1_Habit_Intelligence_v$Version.msix"
$finalBundle = "$windowsCleanOut\D1_Habit_Intelligence_v$Version.msixbundle"

if (-not $SkipWindows) {
    Write-Host "`n[STEP C] Packaging Windows MSIX & Store Bundle..." -ForegroundColor Yellow
    powershell -ExecutionPolicy Bypass -File "$ScriptDir\build_windows_msix.ps1" -SkipBuild -VersionOverride $Version
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Windows MSIX packaging script failed!" -ForegroundColor Red
    } else {
        Write-Host "[OK] Windows MSIX packaging completed successfully!" -ForegroundColor Green
    }
} else {
    Write-Host "[STEP C] Skipped Windows build (-SkipWindows)." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# STEP D: DUAL-STORE SHIPMENT SUMMARY (CLEAN FOLDERS)
# ------------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " [D1] DUAL-STORE RELEASE SUMMARY (v$Version)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "1. GOOGLE PLAY STORE (ANDROID):" -ForegroundColor Magenta
if (Test-Path "$androidCleanOut\D1_PlayStore_Release_v$Version.aab") {
    $aabItem = Get-Item "$androidCleanOut\D1_PlayStore_Release_v$Version.aab"
    Write-Host "   Artifact: $androidCleanOut\D1_PlayStore_Release_v$Version.aab" -ForegroundColor White
    Write-Host "   Size:     $([math]::Round($aabItem.Length / 1MB, 2)) MB" -ForegroundColor Gray
    Write-Host "   Action:   Upload to Google Play Console -> Closed Testing -> Create Release" -ForegroundColor Gray
} else {
    Write-Host "   Status:   Ready for 'npx cap sync android' & 'gradlew.bat bundleRelease'" -ForegroundColor Gray
}

Write-Host "`n2. MICROSOFT STORE (WINDOWS 10 & 11):" -ForegroundColor Blue
if (Test-Path $finalMsix) {
    $msixItem = Get-Item $finalMsix
    Write-Host "   Local Test MSIX:  $finalMsix" -ForegroundColor White
    Write-Host "   Size:             $([math]::Round($msixItem.Length / 1KB, 1)) KB" -ForegroundColor Gray
    Write-Host "   Install Command:  Add-AppxPackage -Path `".\windows_store_build\D1_Habit_Intelligence_v$Version.msix`"" -ForegroundColor Cyan
}
if (Test-Path $finalBundle) {
    $bundleItem = Get-Item $finalBundle
    Write-Host "   Store Submission: $finalBundle" -ForegroundColor White
    Write-Host "   Size:             $([math]::Round($bundleItem.Length / 1KB, 1)) KB" -ForegroundColor Gray
    Write-Host "   Action:           Upload to Microsoft Partner Center -> New Submission" -ForegroundColor Gray
}

Write-Host "`n========================================================`n" -ForegroundColor Cyan

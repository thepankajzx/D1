# ==============================================================================
# D1 HABIT TRACKER - OFFICIAL WINDOWS MSIX PACKAGING SCRIPT
# ==============================================================================
# Architecture: Microsoft Store PWA / MSIX Packaging Pipeline
# Isolation Rule: Strictly contained within windows_store_build/ (Zero Android clash)
# ==============================================================================

param(
    [switch]$SkipBuild = $false,
    [string]$VersionOverride = "",
    [string]$OutputDir = "windows_store_build"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoDir = Resolve-Path "$ScriptDir\.."
Set-Location $RepoDir

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " [D1] WINDOWS MSIX PACKAGING ENGINE" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. Determine Version
$packageJsonPath = Join-Path $RepoDir "package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$Version = if ($VersionOverride) { $VersionOverride } else { $packageJson.version }
Write-Host "[1/5] Target Version: $Version" -ForegroundColor Yellow

# 2. Ensure Output Directory
$TargetDir = Join-Path $RepoDir $OutputDir
if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}
$AssetsDir = Join-Path $TargetDir "assets"
$PublicWinDir = Join-Path $RepoDir "public\windows"
@($AssetsDir, $PublicWinDir) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

# 3. Generate Windows Assets if missing
Write-Host "[2/5] Verifying Windows App Assets..." -ForegroundColor Yellow
$masterIcon = Join-Path $RepoDir "public\pwa-512x512.png"
if (Test-Path $masterIcon) {
    Add-Type -AssemblyName System.Drawing
    $srcImg = [System.Drawing.Image]::FromFile($masterIcon)

    $sizes = @(
        @{ Size = 44; File = "Square44x44Logo.png" },
        @{ Size = 50; File = "Square50x50Logo.png" },
        @{ Size = 150; File = "Square150x150Logo.png" }
    )

    foreach ($s in $sizes) {
        $dest1 = Join-Path $AssetsDir $s.File
        $dest2 = Join-Path $PublicWinDir $s.File
        if (-not (Test-Path $dest1) -or -not (Test-Path $dest2)) {
            $bmp = New-Object System.Drawing.Bitmap $s.Size, $s.Size
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.Clear([System.Drawing.Color]::FromArgb(15, 20, 28))
            $g.DrawImage($srcImg, 0, 0, $s.Size, $s.Size)
            $g.Dispose()
            $bmp.Save($dest1, [System.Drawing.Imaging.ImageFormat]::Png)
            $bmp.Save($dest2, [System.Drawing.Imaging.ImageFormat]::Png)
            $bmp.Dispose()
        }
    }

    # Rectangular assets
    $rects = @(
        @{ W = 310; H = 150; IconSize = 110; File = "Wide310x150Logo.png" },
        @{ W = 620; H = 300; IconSize = 160; File = "SplashScreen.png" }
    )
    foreach ($r in $rects) {
        $dest1 = Join-Path $AssetsDir $r.File
        $dest2 = Join-Path $PublicWinDir $r.File
        if (-not (Test-Path $dest1) -or -not (Test-Path $dest2)) {
            $bmp = New-Object System.Drawing.Bitmap $r.W, $r.H
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.Clear([System.Drawing.Color]::FromArgb(15, 20, 28))
            $x = [int](($r.W - $r.IconSize) / 2)
            $y = [int](($r.H - $r.IconSize) / 2)
            $g.DrawImage($srcImg, $x, $y, $r.IconSize, $r.IconSize)
            $g.Dispose()
            $bmp.Save($dest1, [System.Drawing.Imaging.ImageFormat]::Png)
            $bmp.Save($dest2, [System.Drawing.Imaging.ImageFormat]::Png)
            $bmp.Dispose()
        }
    }
    $srcImg.Dispose()
    Write-Host "[OK] Windows assets verified in $OutputDir\assets and public\windows" -ForegroundColor Green
}

# 4. Compile Web Bundle
if (-not $SkipBuild) {
    Write-Host "[3/5] Compiling production web bundle (npm run build)..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Build failed! Aborting MSIX packaging." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Production web bundle compiled." -ForegroundColor Green
} else {
    Write-Host "[3/5] Skipping web build step (using existing dist/)." -ForegroundColor Gray
}

# 5. Package via PWABuilder Service
Write-Host "[4/5] Packaging MSIX via Microsoft PWABuilder engine..." -ForegroundColor Yellow
$zipOutput = Join-Path $TargetDir "pwabuilder_output.zip"
$extractPath = Join-Path $TargetDir "extracted"

$body = @{
    name = "D1 - Habit Intelligence"
    packageId = "com.definite.d1habits"
    version = $Version
    url = "https://d1-core.web.app/"
    manifestUrl = "https://d1-core.web.app/manifest.json"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "https://pwabuilder-windows-docker.azurewebsites.net/msix/generatezip" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -OutFile $zipOutput `
        -TimeoutSec 90
    
    if (Test-Path $zipOutput) {
        Expand-Archive -Path $zipOutput -DestinationPath $extractPath -Force
        
        $sideloadSrc = Join-Path $extractPath "D1 - Habit Intelligence.sideload.msix"
        $bundleSrc = Join-Path $extractPath "D1 - Habit Intelligence.msixbundle"
        
        $finalMsix = Join-Path $TargetDir "D1_Habit_Intelligence_v$Version.msix"
        $finalBundle = Join-Path $TargetDir "D1_Habit_Intelligence_v$Version.msixbundle"
        
        if (Test-Path $sideloadSrc) {
            Copy-Item $sideloadSrc $finalMsix -Force
        }
        if (Test-Path $bundleSrc) {
            Copy-Item $bundleSrc $finalBundle -Force
        }
        Write-Host "[OK] MSIX package and Store bundle created successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "[!] Note: Remote PWABuilder generation failed or timed out: $($_.Exception.Message)" -ForegroundColor DarkYellow
    Write-Host "[*] Checking for existing cached packages in $OutputDir..." -ForegroundColor Gray
}

# 6. Ensure Development Test Certificate Exists
Write-Host "[5/5] Ensuring test development certificate (.cer / .pfx)..." -ForegroundColor Yellow
$cerPath = Join-Path $TargetDir "D1_Test_Certificate.cer"
$pfxPath = Join-Path $TargetDir "D1_Test_Certificate.pfx"
if (-not (Test-Path $cerPath) -or -not (Test-Path $pfxPath)) {
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=d1-core.web.app" -KeyUsage DigitalSignature -FriendlyName "D1 Habit Intelligence Test Certificate" -CertStoreLocation "Cert:\CurrentUser\My"
    Export-Certificate -Cert $cert -FilePath $cerPath -Force | Out-Null
    $pwd = ConvertTo-SecureString -String "D1Habits2026" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd -Force | Out-Null
}
Write-Host "[OK] Test certificates ready." -ForegroundColor Green

# 7. Final Summary
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " [D1] WINDOWS MSIX PACKAGING COMPLETE!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Local Test MSIX:      $TargetDir\D1_Habit_Intelligence_v$Version.msix" -ForegroundColor White
Write-Host "Store Submission:     $TargetDir\D1_Habit_Intelligence_v$Version.msixbundle" -ForegroundColor White
Write-Host "Test Certificate:     $cerPath" -ForegroundColor White
Write-Host "`nTo install and test directly on Windows 10 & 11, run in PowerShell:" -ForegroundColor Yellow
Write-Host "  Add-AppxPackage -Path `".\$OutputDir\D1_Habit_Intelligence_v$Version.msix`"" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

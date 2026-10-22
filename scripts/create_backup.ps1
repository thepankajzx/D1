<#
.SYNOPSIS
  Generates an ultra-fast timestamped ZIP backup of definite-habit-tracker into G:\STITCH HABIT TRACKER\Backups
  Uses native tar.exe (fast zip compression) and excludes node_modules, .git, dist, and cache.
#>

param(
    [string]$Label = ""
)

$sourceDir = "G:\STITCH HABIT TRACKER\definite-habit-tracker"
$backupDir = "G:\STITCH HABIT TRACKER\Backups"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

$suffix = if ($Label) { "_$Label" } else { "" }
$zipName = "D1_Backup_$timestamp$suffix.zip"
$zipPath = Join-Path $backupDir $zipName

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " [D1] Creating Clean System Backup" -ForegroundColor Cyan
Write-Host " Source: $sourceDir" -ForegroundColor White
Write-Host " Output: $zipPath" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

try {
    Push-Location $sourceDir
    Write-Host "[1/2] Compressing into $zipName..." -ForegroundColor Yellow
    
    tar.exe -a -cf "$zipPath" `
        --exclude="node_modules" `
        --exclude=".git" `
        --exclude="dist" `
        --exclude=".cache" `
        --exclude="android/app/build" `
        --exclude="android/.gradle" `
        *
        
    Pop-Location

    if (Test-Path $zipPath) {
        $fileSizeMB = [math]::Round(((Get-Item $zipPath).Length / 1MB), 2)
        Write-Host "[2/2] Backup Created Successfully!" -ForegroundColor Green
        Write-Host " Size: $fileSizeMB MB" -ForegroundColor Green
        Write-Host " Location: $zipPath" -ForegroundColor Green
    } else {
        Write-Error "Zip file was not generated."
    }
}
catch {
    Write-Error "Backup failed: $_"
}

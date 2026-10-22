<#
.SYNOPSIS
  Recreates a fresh, clean local testing sandbox from definite-habit-tracker.
  Destination: G:\STITCH HABIT TRACKER\_local_testing_sandbox
#>

$sourceDir = "G:\STITCH HABIT TRACKER\definite-habit-tracker"
$sandboxDir = "G:\STITCH HABIT TRACKER\_local_testing_sandbox"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " [D1] Recreating Fresh Local Sandbox" -ForegroundColor Cyan
Write-Host " Source: $sourceDir" -ForegroundColor White
Write-Host " Target: $sandboxDir" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan

if (Test-Path $sandboxDir) {
    Write-Host "[1/3] Purging existing stale sandbox..." -ForegroundColor Yellow
    # Remove files but keep node_modules if possible to avoid re-running npm install
    $hasNodeModules = Test-Path (Join-Path $sandboxDir "node_modules")
    
    Get-ChildItem -Path $sandboxDir -Exclude "node_modules" | Remove-Item -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $sandboxDir -Force | Out-Null
    $hasNodeModules = $false
}

Write-Host "[2/3] Copying fresh files from canonical repository..." -ForegroundColor Yellow
robocopy $sourceDir $sandboxDir /E /XD node_modules .git dist .cache /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

if (-not $hasNodeModules) {
    Write-Host "[3/3] Linking or copying node_modules for instant execution..." -ForegroundColor Yellow
    # Create directory junction for node_modules so npm install is NOT needed!
    $srcModules = Join-Path $sourceDir "node_modules"
    $targetModules = Join-Path $sandboxDir "node_modules"
    if (Test-Path $srcModules) {
        cmd /c "mklink /J `"$targetModules`" `"$srcModules`"" | Out-Null
        Write-Host " Linked node_modules via Junction!" -ForegroundColor Green
    }
} else {
    Write-Host "[3/3] Preserved existing sandbox dependencies." -ForegroundColor Green
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host " Sandbox Ready at: $sandboxDir" -ForegroundColor Green
Write-Host " You can run: cd `"$sandboxDir`"; npm run dev" -ForegroundColor Green
Write-Host " IMPORTANT: Never run 'firebase deploy' from the sandbox!" -ForegroundColor Yellow
Write-Host " Port your tested changes back to definite-habit-tracker." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green

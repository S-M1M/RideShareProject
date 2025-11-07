# PowerShell script to switch between local and production environments
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('local','production')]
    [string]$Environment
)

$envFile = ".env.$Environment"
$targetFile = ".env"

if (Test-Path $envFile) {
    Copy-Item $envFile $targetFile -Force
    Write-Host "✓ Switched to $Environment environment" -ForegroundColor Green
    Write-Host "Current .env file now points to:" -ForegroundColor Cyan
    Get-Content $targetFile | Select-String "VITE_API_URL" | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
} else {
    Write-Host "✗ Error: $envFile not found!" -ForegroundColor Red
    exit 1
}

# Also update backend .env if it exists
$backendEnvFile = "backend\.env.$Environment"
$backendTargetFile = "backend\.env"

if (Test-Path $backendEnvFile) {
    Copy-Item $backendEnvFile $backendTargetFile -Force
    Write-Host "✓ Backend .env also updated" -ForegroundColor Green
}

#Requires -Version 7.0
<#
.SYNOPSIS
    Launcher for Miami-Dade County property data import

.DESCRIPTION
    This is a simple launcher script that runs the Import-PropertyData.ps1 script
    and keeps the console window open to view the results.

.NOTES
    Author: Miami Real Estate Analytics
    Requires: PowerShell 7+
#>

# Stop on any error
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = $PSScriptRoot
$ImportScript = Join-Path -Path $ProjectRoot -ChildPath "server\scripts\Import-PropertyData.ps1"

# Clear screen and show title
Clear-Host
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Miami-Dade County Property Data Importer   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host

try {
    # Check if script exists
    if (-not (Test-Path -Path $ImportScript)) {
        throw "Import script not found at: $ImportScript"
    }
    
    # Run the import script
    & $ImportScript
    
    # If successful, display completion message
    if ($LASTEXITCODE -eq 0) {
        Write-Host
        Write-Host "=============================================" -ForegroundColor Green
        Write-Host "  Import completed successfully!             " -ForegroundColor Green
        Write-Host "=============================================" -ForegroundColor Green
    }
}
catch {
    Write-Host
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
}
finally {
    # Keep console window open
    Write-Host
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    [void][System.Console]::ReadKey($true)
} 
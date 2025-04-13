#Requires -Version 7.0
<#
.SYNOPSIS
    Installs dependencies required for the Miami-Dade County property data import

.DESCRIPTION
    This script checks for and installs the 'fast-csv' npm package and any other
    dependencies required for processing the Miami-Dade County property data CSV file.

.NOTES
    Author: Miami Real Estate Analytics
    Requires: PowerShell 7+, Node.js, npm
#>

# Stop on any error
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Resolve-Path -Path "$PSScriptRoot\..\.."
$ServerDir = "$ProjectRoot\server"
$NpmExe = "npm"

try {
    Write-Host "Installing required dependencies for property data import..." -ForegroundColor Cyan
    
    # Check if Node.js and npm are installed
    try {
        $npmVersion = & $NpmExe --version
        Write-Host "npm version: $npmVersion" -ForegroundColor Green
    }
    catch {
        throw "npm is not installed or not in PATH. Please install Node.js and npm first."
    }
    
    # Move to server directory
    Push-Location $ServerDir
    
    # Install required packages
    $packages = @(
        "fast-csv@^4.3.6"  # For CSV parsing
    )
    
    foreach ($package in $packages) {
        Write-Host "Installing $package..." -ForegroundColor Gray
        & $NpmExe install $package --save
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install $package (Exit code: $LASTEXITCODE)"
        }
    }
    
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    Write-Host "You can now run the Import-PropertyData.ps1 script to import the property data." -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    # Ensure we return to the original directory
    Pop-Location
} 
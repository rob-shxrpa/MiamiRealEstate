# Restart-App.ps1
# Script to restart the Miami Real Estate application
$ErrorActionPreference = "Stop"

# Function to handle errors
function Handle-Error {
    param (
        [string]$ErrorMessage,
        [bool]$ExitScript = $true
    )
    Write-Host "ERROR: $ErrorMessage" -ForegroundColor Red
    if ($ExitScript) {
        exit 1
    }
}

# Find NPM path
function Get-NpmPath {
    try {
        $npmPath = (Get-Command npm -ErrorAction Stop).Source
        return $npmPath
    }
    catch {
        # Try common locations if not in PATH
        $possiblePaths = @(
            "C:\Program Files\nodejs\npm.cmd",
            "C:\Program Files (x86)\nodejs\npm.cmd",
            "$env:APPDATA\npm\npm.cmd"
        )
        
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                return $path
            }
        }
        
        Handle-Error "NPM not found. Please ensure Node.js is installed."
    }
}

# Main try/catch block
try {
    Write-Host "Finding npm path..." -ForegroundColor Yellow
    $npmPath = Get-NpmPath
    Write-Host "Using npm at: $npmPath" -ForegroundColor Green
    
    Write-Host "Stopping any running application processes..." -ForegroundColor Yellow
    
    # Get and stop any running node processes from previous runs
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "Stopping node processes..." -ForegroundColor Yellow
        $processes | ForEach-Object { 
            try {
                Stop-Process -Id $_.Id -Force
                Write-Host "Stopped process with ID: $($_.Id)" -ForegroundColor Green
            } catch {
                Write-Host "Could not stop process $($_.Id): $_" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "No node processes found running." -ForegroundColor Green
    }
    
    # Allow time for processes to fully terminate
    Start-Sleep -Seconds 2
    
    # Navigate to the client directory
    Write-Host "Changing to client directory..." -ForegroundColor Yellow
    Set-Location -Path ".\client"
    
    # Check if node_modules exists, install if not
    if (-not (Test-Path -Path ".\node_modules")) {
        Write-Host "Installing client dependencies..." -ForegroundColor Yellow
        & $npmPath install
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to install client dependencies"
        }
    }
    
    # Start client application
    Write-Host "Starting client application..." -ForegroundColor Yellow
    Start-Process -FilePath $npmPath -ArgumentList "start" -NoNewWindow
    
    # Navigate back to project root
    Set-Location -Path ".."
    
    # Navigate to server directory
    Write-Host "Changing to server directory..." -ForegroundColor Yellow
    Set-Location -Path ".\server"
    
    # Check if node_modules exists, install if not
    if (-not (Test-Path -Path ".\node_modules")) {
        Write-Host "Installing server dependencies..." -ForegroundColor Yellow
        & $npmPath install
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to install server dependencies"
        }
    }
    
    # Start server application
    Write-Host "Starting server application..." -ForegroundColor Yellow
    Start-Process -FilePath $npmPath -ArgumentList "start" -NoNewWindow
    
    # Navigate back to project root
    Set-Location -Path ".."
    
    Write-Host "Application restarted successfully!" -ForegroundColor Green
    Write-Host "- Client running at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "- Server running at: http://localhost:3001/api" -ForegroundColor Cyan
    
} catch {
    Handle-Error "An unexpected error occurred: $_"
} 
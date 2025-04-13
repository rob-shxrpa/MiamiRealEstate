#Requires -Version 7.0
<#
.SYNOPSIS
    Starts the Miami Real Estate Analytics application

.DESCRIPTION
    This script starts both the server and client components of the Miami Real Estate Analytics application.
    It includes proper error handling and provides status information.

.NOTES
    Author: Miami Real Estate Analytics
    Requires: PowerShell 7+, Node.js, PostgreSQL
#>

# Stop on any error
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = $PSScriptRoot
$ServerDir = Join-Path -Path $ProjectRoot -ChildPath "server"
$ClientDir = Join-Path -Path $ProjectRoot -ChildPath "client"
$NodeExe = "node"
$NpmExe = "npm"

# Function to check if a process is running on a port
function Test-PortInUse {
    param (
        [int]$Port
    )
    
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port }
    return ($connections -ne $null)
}

# Function to start a component of the application
function Start-Component {
    param (
        [string]$Name,
        [string]$Directory,
        [string]$Command,
        [int]$Port,
        [switch]$IsBackground
    )
    
    Write-Host "Starting $Name..." -ForegroundColor Cyan
    
    # Check if service is already running
    if (Test-PortInUse -Port $Port) {
        Write-Host "Service is already running on port $Port" -ForegroundColor Yellow
        return $true
    }
    
    try {
        Push-Location $Directory
        
        if ($IsBackground) {
            # Start in background
            $job = Start-Job -ScriptBlock {
                param($dir, $cmd)
                Set-Location $dir
                Invoke-Expression $cmd
            } -ArgumentList $Directory, $Command
            
            Write-Host "$Name started in background (Job ID: $($job.Id))" -ForegroundColor Green
        } else {
            # Start in foreground
            Write-Host "Running: $Command" -ForegroundColor DarkGray
            Invoke-Expression $Command
        }
        
        Pop-Location
        return $true
    }
    catch {
        Write-Host "ERROR: Failed to start $Name - $_" -ForegroundColor Red
        Pop-Location
        return $false
    }
}

function Show-ApplicationInfo {
    Write-Host "`n================================" -ForegroundColor Cyan
    Write-Host "Miami Real Estate Analytics" -ForegroundColor Cyan
    Write-Host "================================`n" -ForegroundColor Cyan
    
    Write-Host "API Server URL: http://localhost:3001/api" -ForegroundColor Green
    Write-Host "Web Application: http://localhost:3000" -ForegroundColor Green
    
    Write-Host "`nAvailable API endpoints:" -ForegroundColor Yellow
    Write-Host "  - /api/properties         - Property information" -ForegroundColor Yellow
    Write-Host "  - /api/permits            - Permit information" -ForegroundColor Yellow
    Write-Host "  - /api/property-data      - Miami-Dade County property data" -ForegroundColor Yellow
    Write-Host "  - /api/pois               - Points of interest" -ForegroundColor Yellow
    Write-Host "  - /api/distances          - Distance calculations" -ForegroundColor Yellow
}

# Main script
try {
    Write-Host "Starting Miami Real Estate Analytics Application" -ForegroundColor Cyan
    Write-Host "================================================`n" -ForegroundColor Cyan
    
    # Check if dependencies are installed
    Write-Host "Checking dependencies..." -ForegroundColor Cyan
    try {
        $nodeVersion = & $NodeExe --version
        Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
        
        $npmVersion = & $NpmExe --version
        Write-Host "npm version: $npmVersion" -ForegroundColor Green
    }
    catch {
        throw "Required dependencies are not installed: $_"
    }
    
    # Offer to install property data if not already done
    $propertyDataMigration = Join-Path -Path $ProjectRoot -ChildPath "database\migrations\property_data_migration.sql"
    if (Test-Path $propertyDataMigration) {
        $csvFile = Join-Path -Path $ProjectRoot -ChildPath "Files\MunRoll - 00 RE - All Properties.csv"
        if (Test-Path $csvFile) {
            Write-Host "`nMiami-Dade County property data file detected." -ForegroundColor Cyan
            $importData = Read-Host "Would you like to import this data now? (y/n)"
            
            if ($importData -eq "y") {
                $importScript = Join-Path -Path $ProjectRoot -ChildPath "server\scripts\Import-PropertyData.ps1"
                & $importScript
            }
        }
    }
    
    # Start server
    Write-Host "`nStarting application components..." -ForegroundColor Cyan
    
    # Start API server in background
    $serverStarted = Start-Component -Name "API Server" -Directory $ServerDir -Command "npm run dev" -Port 3001 -IsBackground
    
    # Wait for server to be ready
    if ($serverStarted) {
        Write-Host "Waiting for API server to initialize..." -ForegroundColor Gray
        $maxRetries = 10
        $retryCount = 0
        $serverReady = $false
        
        while (-not $serverReady -and $retryCount -lt $maxRetries) {
            try {
                Start-Sleep -Seconds 2
                $response = Invoke-WebRequest -Uri "http://localhost:3001/api" -Method Get -TimeoutSec 1 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    $serverReady = $true
                    Write-Host "API Server is ready!" -ForegroundColor Green
                }
            }
            catch {
                $retryCount++
                Write-Host "." -NoNewline -ForegroundColor Gray
            }
        }
        
        if (-not $serverReady) {
            Write-Warning "API Server did not respond in time, but might still be starting up."
        }
    }
    
    # Start client application
    Start-Component -Name "Client Application" -Directory $ClientDir -Command "npm start" -Port 3000
    
    # Display application information
    Show-ApplicationInfo
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 
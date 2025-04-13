#Requires -Version 7.0
<#
.SYNOPSIS
    Imports Miami-Dade County property data from CSV into PostgreSQL database

.DESCRIPTION
    This script performs the complete import process for the Miami-Dade County property data:
    1. Installs required NPM dependencies
    2. Applies database migration to create the property_data table
    3. Executes the import script to load CSV data into the database

.NOTES
    Author: Miami Real Estate Analytics
    Requires: PowerShell 7+, Node.js, PostgreSQL
#>

# Stop on any error
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Resolve-Path -Path "$PSScriptRoot\..\.."
$ScriptsDir = "$ProjectRoot\server\scripts"
$DatabaseDir = "$ProjectRoot\database"
$MigrationFile = "$DatabaseDir\migrations\property_data_migration.sql"
$CsvFilePath = "$ProjectRoot\Files\MunRoll - 00 RE - All Properties.csv"
$NodeExe = "node"

try {
    # Step 1: Verify prerequisites
    Write-Host "Verifying prerequisites..." -ForegroundColor Cyan
    
    # Check if CSV file exists
    if (-not (Test-Path -Path $CsvFilePath)) {
        throw "Error: CSV file not found at $CsvFilePath"
    }
    
    # Check if database migration file exists
    if (-not (Test-Path -Path $MigrationFile)) {
        throw "Error: Migration file not found at $MigrationFile"
    }
    
    # Check for Node.js
    try {
        $nodeVersion = & $NodeExe --version
        Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    }
    catch {
        throw "Error: Node.js is not installed or not in PATH"
    }
    
    # Step 2: Install required dependencies using PowerShell script
    Write-Host "Installing required npm dependencies..." -ForegroundColor Cyan
    try {
        $installDepsScript = Join-Path -Path $ScriptsDir -ChildPath "Install-Dependencies.ps1"
        & $installDepsScript
        
        if ($LASTEXITCODE -ne 0) {
            throw "Dependency installation failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        throw "Error installing dependencies: $_"
    }
    
    # Step 3: Run database migration
    Write-Host "Applying database migration to create property_data table..." -ForegroundColor Cyan
    try {
        # Load .env file to get database connection details
        $envFile = Get-Content "$ProjectRoot\server\.env" -ErrorAction SilentlyContinue
        $dbUser = ($envFile | Where-Object { $_ -match "DB_USER=(.+)" } | ForEach-Object { $matches[1] })
        $dbHost = ($envFile | Where-Object { $_ -match "DB_HOST=(.+)" } | ForEach-Object { $matches[1] })
        $dbName = ($envFile | Where-Object { $_ -match "DB_NAME=(.+)" } | ForEach-Object { $matches[1] })
        $dbPassword = ($envFile | Where-Object { $_ -match "DB_PASSWORD=(.+)" } | ForEach-Object { $matches[1] })
        
        if (-not $dbUser -or -not $dbName) {
            throw "Database connection information not found in .env file"
        }
        
        # Set password as environment variable to avoid exposing it in the command line
        $env:PGPASSWORD = $dbPassword
        
        # Run psql command to apply migration
        $psqlParams = "-U $dbUser"
        if ($dbHost) { $psqlParams += " -h $dbHost" }
        
        # Use command with proper error handling
        $psqlCommand = "psql $psqlParams -d $dbName -f `"$MigrationFile`""
        Write-Host "Executing migration with command: $psqlCommand" -ForegroundColor DarkGray
        
        Invoke-Expression $psqlCommand
        
        if ($LASTEXITCODE -ne 0) {
            throw "Database migration failed with exit code $LASTEXITCODE"
        }
        
        Write-Host "Database migration applied successfully" -ForegroundColor Green
    }
    catch {
        throw "Error applying database migration: $_"
    }
    finally {
        # Clear password from environment
        $env:PGPASSWORD = ""
    }
    
    # Step 4: Import CSV data
    Write-Host "Importing property data from CSV file..." -ForegroundColor Cyan
    try {
        Push-Location $ScriptsDir
        & $NodeExe "$ScriptsDir\import_property_data.js"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Data import failed with exit code $LASTEXITCODE"
        }
        
        Pop-Location
        Write-Host "Property data imported successfully" -ForegroundColor Green
    }
    catch {
        throw "Error importing property data: $_"
    }
    
    Write-Host "Miami-Dade County property data import completed successfully!" -ForegroundColor Green
    Write-Host "You can now access the data through the API at /api/property-data" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Import process failed. Please check the logs for details." -ForegroundColor Red
    exit 1
} 
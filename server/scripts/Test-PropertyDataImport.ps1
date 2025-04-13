#Requires -Version 7.0
<#
.SYNOPSIS
    Tests the Miami-Dade County property data import

.DESCRIPTION
    This script performs various tests to verify that the property data was imported correctly:
    1. Connects to the database and counts records in the property_data table
    2. Retrieves sample records to verify data integrity
    3. Makes API calls to test the new endpoints

.NOTES
    Author: Miami Real Estate Analytics
    Requires: PowerShell 7+, Node.js, PostgreSQL
#>

# Stop on any error
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Resolve-Path -Path "$PSScriptRoot\..\.."
$ApiBaseUrl = "http://localhost:3001/api"

function Test-Database {
    param (
        [string]$DbUser,
        [string]$DbHost,
        [string]$DbName,
        [string]$DbPassword
    )
    
    Write-Host "`n===== Testing Database =====`n" -ForegroundColor Cyan
    
    try {
        # Set password as environment variable
        $env:PGPASSWORD = $DbPassword
        
        # Build psql command
        $psqlParams = "-U $DbUser"
        if ($DbHost) { $psqlParams += " -h $DbHost" }
        
        # Count records
        Write-Host "Counting records in property_data table..." -ForegroundColor Gray
        $countQuery = "SELECT COUNT(*) FROM property_data;"
        $countCommand = "psql $psqlParams -d $DbName -t -c `"$countQuery`""
        $count = Invoke-Expression $countCommand
        
        if ($LASTEXITCODE -ne 0) {
            throw "Database query failed with exit code $LASTEXITCODE"
        }
        
        $count = $count.Trim()
        Write-Host "Found $count records in property_data table" -ForegroundColor Green
        
        if ([int]$count -eq 0) {
            Write-Warning "No records found in property_data table!"
            return $false
        }
        
        # Check for trigger function
        Write-Host "Verifying database trigger is installed..." -ForegroundColor Gray
        $triggerQuery = "SELECT COUNT(*) FROM pg_trigger WHERE tgname='trigger_update_property_data_geom';"
        $triggerCommand = "psql $psqlParams -d $DbName -t -c `"$triggerQuery`""
        $triggerCount = Invoke-Expression $triggerCommand
        
        if ([int]$triggerCount.Trim() -gt 0) {
            Write-Host "Trigger is properly installed" -ForegroundColor Green
        } else {
            Write-Warning "Trigger is not installed!"
        }
        
        # Sample some data
        Write-Host "`nRetrieving sample property data..." -ForegroundColor Gray
        $sampleQuery = "SELECT folio_number, property_address, total_value, zoning, bedrooms, bathrooms, year_built FROM property_data LIMIT 3;"
        $sampleCommand = "psql $psqlParams -d $DbName -c `"$sampleQuery`""
        Invoke-Expression $sampleCommand | Out-Host
        
        return $true
    }
    catch {
        Write-Host "ERROR: Database test failed: $_" -ForegroundColor Red
        return $false
    }
    finally {
        # Clear password from environment
        $env:PGPASSWORD = ""
    }
}

function Test-Api {
    Write-Host "`n===== Testing API Endpoints =====`n" -ForegroundColor Cyan
    
    $success = $true
    
    try {
        # Test property data endpoint
        Write-Host "Testing /api/property-data endpoint..." -ForegroundColor Gray
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/property-data?limit=1" -Method Get -ErrorAction Stop
        
        if ($response.data -and $response.data.Count -gt 0) {
            Write-Host "Success: /api/property-data endpoint returned data" -ForegroundColor Green
            $property = $response.data[0]
            Write-Host "Sample property: $($property.folioNumber) - $($property.address)" -ForegroundColor Gray
        } else {
            Write-Warning "No data returned from /api/property-data endpoint"
            $success = $false
        }
        
        # Test zoning codes endpoint
        Write-Host "`nTesting /api/property-data/codes/zoning endpoint..." -ForegroundColor Gray
        $zoningResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/property-data/codes/zoning" -Method Get -ErrorAction Stop
        
        if ($zoningResponse -and $zoningResponse.Count -gt 0) {
            Write-Host "Success: /api/property-data/codes/zoning endpoint returned $(($zoningResponse).Count) zoning codes" -ForegroundColor Green
        } else {
            Write-Warning "No data returned from /api/property-data/codes/zoning endpoint"
            $success = $false
        }
        
        # Test land use codes endpoint
        Write-Host "`nTesting /api/property-data/codes/land-use endpoint..." -ForegroundColor Gray
        $landUseResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/property-data/codes/land-use" -Method Get -ErrorAction Stop
        
        if ($landUseResponse -and $landUseResponse.Count -gt 0) {
            Write-Host "Success: /api/property-data/codes/land-use endpoint returned $(($landUseResponse).Count) land use codes" -ForegroundColor Green
        } else {
            Write-Warning "No data returned from /api/property-data/codes/land-use endpoint"
            $success = $false
        }
        
        return $success
    }
    catch {
        Write-Host "ERROR: API test failed: $_" -ForegroundColor Red
        return $false
    }
}

# Main script
try {
    Write-Host "Testing Miami-Dade County Property Data Import" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    
    # Load environment variables
    $envFile = Get-Content "$ProjectRoot\server\.env" -ErrorAction SilentlyContinue
    $dbUser = ($envFile | Where-Object { $_ -match "DB_USER=(.+)" } | ForEach-Object { $matches[1] })
    $dbHost = ($envFile | Where-Object { $_ -match "DB_HOST=(.+)" } | ForEach-Object { $matches[1] })
    $dbName = ($envFile | Where-Object { $_ -match "DB_NAME=(.+)" } | ForEach-Object { $matches[1] })
    $dbPassword = ($envFile | Where-Object { $_ -match "DB_PASSWORD=(.+)" } | ForEach-Object { $matches[1] })
    
    if (-not $dbUser -or -not $dbName) {
        throw "Database connection information not found in .env file"
    }
    
    # Run tests
    $dbTestResult = Test-Database -DbUser $dbUser -DbHost $dbHost -DbName $dbName -DbPassword $dbPassword
    
    # Check if API server is running
    try {
        $serverStatus = Invoke-RestMethod -Uri "$ApiBaseUrl" -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "`nAPI server is running" -ForegroundColor Green
        $apiTestResult = Test-Api
    }
    catch {
        Write-Host "`nERROR: Could not connect to API server at $ApiBaseUrl" -ForegroundColor Red
        Write-Host "Make sure the server is running before testing the API endpoints" -ForegroundColor Yellow
        $apiTestResult = $false
    }
    
    # Print summary
    Write-Host "`n===== Test Summary =====`n" -ForegroundColor Cyan
    if ($dbTestResult) {
        Write-Host "✓ Database tests passed" -ForegroundColor Green
    } else {
        Write-Host "✗ Database tests failed" -ForegroundColor Red
    }
    
    if ($apiTestResult) {
        Write-Host "✓ API tests passed" -ForegroundColor Green
    } else {
        Write-Host "✗ API tests failed or skipped" -ForegroundColor Red
    }
    
    if ($dbTestResult -and $apiTestResult) {
        Write-Host "`nSUCCESS: All tests passed!" -ForegroundColor Green
    } else {
        Write-Host "`nWARNING: Some tests failed, review the output above for details" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 
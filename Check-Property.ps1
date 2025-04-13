# Check-Property.ps1
# This script checks if a property with a specific folio number exists in database tables
# and provides diagnostics about what might be missing
$ErrorActionPreference = "Stop"

# Database connection settings
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbName = "miami_realestate"
$dbPassword = "Rob123!"

# Folio number to check
$folioNumber = "014109013014"

# Environment variables for psql
$env:PGPASSWORD = $dbPassword

# Find psql.exe
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    # Try other versions
    @(16, 15, 14, 13, 12) | ForEach-Object {
        $testPath = "C:\Program Files\PostgreSQL\$_\bin\psql.exe"
        if (Test-Path $testPath) {
            $psqlPath = $testPath
            break
        }
    }
}

if (-not (Test-Path $psqlPath)) {
    Write-Host "Could not find psql.exe. Please enter the full path:" -ForegroundColor Yellow
    $psqlPath = Read-Host
    if (-not (Test-Path $psqlPath)) {
        Write-Host "Invalid path: $psqlPath" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Using PostgreSQL client: $psqlPath" -ForegroundColor Green

# Function to execute SQL
function Invoke-SQL {
    param (
        [string]$Query
    )
    
    try {
        $result = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $Query 2>&1
        # Check if there was an error
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error executing SQL: $result" -ForegroundColor Red
            return $null
        }
        return $result
    }
    catch {
        Write-Host "Error executing SQL: $_" -ForegroundColor Red
        return $null
    }
}

# Function to get the count from a result
function Get-Count {
    param (
        [string]$Result
    )
    
    if ([string]::IsNullOrEmpty($Result)) {
        return 0
    }
    
    $cleanResult = $Result.Trim()
    try {
        return [int]$cleanResult
    }
    catch {
        Write-Host "Warning: Could not convert '$cleanResult' to integer. Returning 0." -ForegroundColor Yellow
        return 0
    }
}

Write-Host "=====================================================" -ForegroundColor Blue
Write-Host "          MIAMI PROPERTY DATA CHECKER               " -ForegroundColor Blue  
Write-Host "=====================================================" -ForegroundColor Blue
Write-Host "Checking folio number: $folioNumber" -ForegroundColor Green
Write-Host

# Check if folio exists in properties table
Write-Host "Checking properties table..." -ForegroundColor Yellow
$propertiesResult = Invoke-SQL "SELECT COUNT(*) FROM properties WHERE folio_number = '$folioNumber'"
$propertiesCount = Get-Count $propertiesResult

if ($propertiesCount -gt 0) {
    Write-Host "✅ Found in properties table" -ForegroundColor Green
    $propertyData = Invoke-SQL "SELECT * FROM properties WHERE folio_number = '$folioNumber'"
    Write-Host $propertyData
} else {
    Write-Host "❌ Not found in properties table" -ForegroundColor Red
}

# Check if folio exists in property_data table
Write-Host "`nChecking property_data table..." -ForegroundColor Yellow
$propertyDataResult = Invoke-SQL "SELECT COUNT(*) FROM property_data WHERE folio_number = '$folioNumber'"
$propertyDataCount = Get-Count $propertyDataResult

if ($propertyDataCount -gt 0) {
    Write-Host "✅ Found in property_data table" -ForegroundColor Green
    $pdData = Invoke-SQL "SELECT * FROM property_data WHERE folio_number = '$folioNumber'"
    Write-Host $pdData
} else {
    Write-Host "❌ Not found in property_data table" -ForegroundColor Red
}

# Check for sales history data
Write-Host "`nChecking for sales history data..." -ForegroundColor Yellow
if ($propertyDataCount -gt 0) {
    $salesResult = Invoke-SQL "SELECT sale_date_1, sale_amount_1, sale_date_2, sale_amount_2, sale_date_3, sale_amount_3 FROM property_data WHERE folio_number = '$folioNumber'"
    if ($salesResult -match "sale_date_1") {
        Write-Host "✅ Sales history data exists" -ForegroundColor Green
        Write-Host $salesResult
    } else {
        Write-Host "❌ No sales history data" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Cannot check sales history because property_data record doesn't exist" -ForegroundColor Red
}

# Check for any occurrence in any table
Write-Host "`nChecking for folio in all tables..." -ForegroundColor Yellow
$allTablesQuery = @"
SELECT
    table_name
FROM
    information_schema.tables
WHERE
    table_schema = 'public'
    AND table_type = 'BASE TABLE';
"@

$allTables = Invoke-SQL $allTablesQuery
$tables = $allTables -split "`n" | Where-Object { $_.Trim() -ne "" }
$foundInTable = $false

foreach ($table in $tables) {
    $tableName = $table.Trim()
    
    # Skip if the table name is empty
    if (-not $tableName) { continue }
    
    # Check if the table has a folio_number column
    $columnQuery = "SELECT column_name FROM information_schema.columns WHERE table_name = '$tableName' AND column_name LIKE '%folio%';"
    $folioColumn = (Invoke-SQL $columnQuery).Trim()
    
    if ($folioColumn) {
        $countQuery = "SELECT COUNT(*) FROM $tableName WHERE $folioColumn = '$folioNumber';"
        $countResult = Invoke-SQL $countQuery
        $count = Get-Count $countResult
        
        if ($count -gt 0) {
            Write-Host "✅ Found in $tableName table ($count records)" -ForegroundColor Green
            $foundInTable = $true
            
            # Show the data
            $dataQuery = "SELECT * FROM $tableName WHERE $folioColumn = '$folioNumber';"
            $data = Invoke-SQL $dataQuery
            Write-Host $data
        }
    }
}

if (-not $foundInTable) {
    Write-Host "❌ Folio number not found in any table" -ForegroundColor Red
}

# Conclusion and recommendations
Write-Host "`n=====================================================" -ForegroundColor Blue
Write-Host "                 DIAGNOSIS                        " -ForegroundColor Blue
Write-Host "=====================================================" -ForegroundColor Blue

if (-not $foundInTable) {
    Write-Host "ISSUE: Property with folio number $folioNumber does not exist in the database." -ForegroundColor Yellow
    Write-Host "`nRECOMMENDATIONS:" -ForegroundColor Cyan
    Write-Host "1. Import the property from source data using the import-properties.ps1 script"
    Write-Host "2. Or manually add the property to both tables using SQL"
    Write-Host "3. Verify the folio number is correct (check for typos)"
} elseif ($propertiesCount -gt 0 -and $propertyDataCount -eq 0) {
    Write-Host "ISSUE: Property exists in properties table but not in property_data table." -ForegroundColor Yellow
    Write-Host "`nRECOMMENDATIONS:" -ForegroundColor Cyan
    Write-Host "1. Run the Copy-SalesData.ps1 script to populate property_data"
    Write-Host "2. Or manually copy the data using SQL"
} elseif ($propertyDataCount -gt 0 -and (-not ($salesResult -match "sale_date_1"))) {
    Write-Host "ISSUE: Property exists in property_data but has no sales history." -ForegroundColor Yellow
    Write-Host "`nRECOMMENDATIONS:" -ForegroundColor Cyan
    Write-Host "1. Run the Copy-SalesData.ps1 script with updates for this property"
    Write-Host "2. Or manually update the sales history using SQL"
} else {
    Write-Host "No issues detected. If sales history still doesn't display, check the API and frontend code." -ForegroundColor Green
} 
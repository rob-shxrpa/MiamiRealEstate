# direct_import.ps1
# Simplified direct import script for testing
$ErrorActionPreference = "Stop"

Write-Host "Miami Real Estate - Direct Import Test" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$csvFile = "C:\Projects\MiamiRealEstate\Files\MunRoll - 00 RE - All Properties.csv"
$tempCsvFile = "$pwd\temp_import.csv"
$currentDir = Get-Location

# Database connection settings
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbName = "miami_realestate"

# Password handling based on previous approach
Write-Host "Enter PostgreSQL password for user 'postgres':" -ForegroundColor Yellow
$securePassword = Read-Host -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
$env:PGPASSWORD = $password
Write-Host "Password set for this session" -ForegroundColor Green

try {
    # Create a simple test CSV with just a few rows
    Write-Host "Creating test CSV..." -ForegroundColor Green
    @"
folio_number,property_address,property_city,property_zip,land_value,building_value,total_value,assessed_value,land_use,zoning,owner_name1,owner_name2,lot_size,bedrooms,bathrooms,year_built,living_sqft,actual_sqft,sale_date,sale_amount
0101000000020,"16 SE 2 ST","Miami","33131",42138600,8602,42147202,29807290,"PARKING LOT","CD-3","FLAGLER STREET GARAGE LLC","",22500,0,0,0,0,0,"2022-01-30",0
0101000000022,"245 NE 1 AVE","Miami","33142",0,0,347164191,347164191,"GOV-OWNED","CS","MIAMI-DADE COUNTY INTERNAL SVCS","",0,0,0,0,0,0,null,0
0101000000026,"1251 NW 20 ST","Miami","33142",0,0,8550000,7145050,"INDUSTRIAL","D1","MIDET PROP LLC","",25000,0,0,2003,0,0,"2019-05-09",5250000
"@ | Out-File -FilePath $tempCsvFile -Encoding utf8

    # Verify the file exists
    if (-not (Test-Path $tempCsvFile)) {
        throw "Failed to create temp CSV file at: $tempCsvFile"
    }
    
    $escapedCsvPath = $tempCsvFile -replace '\\', '\\'
    
    # Create the staging table and use the absolute path in the COPY command
    $createAndImportCmd = @"
    DROP TABLE IF EXISTS property_import_staging;
    
    CREATE TABLE property_import_staging (
        folio_number TEXT PRIMARY KEY,
        property_address TEXT,
        property_city TEXT,
        property_zip TEXT,
        land_value NUMERIC,
        building_value NUMERIC,
        total_value NUMERIC,
        assessed_value NUMERIC,
        land_use TEXT,
        zoning TEXT,
        owner_name1 TEXT,
        owner_name2 TEXT,
        lot_size NUMERIC,
        bedrooms INTEGER,
        bathrooms NUMERIC,
        year_built INTEGER,
        living_sqft NUMERIC,
        actual_sqft NUMERIC,
        sale_date DATE,
        sale_amount NUMERIC
    );
    
    \COPY property_import_staging FROM '$escapedCsvPath' WITH (FORMAT csv, HEADER true);
    
    SELECT COUNT(*) FROM property_import_staging;
"@

    # Write the SQL to a temp file for debugging
    $tempSqlFile = "$pwd\temp_import.sql"
    $createAndImportCmd | Out-File -FilePath $tempSqlFile -Encoding utf8
    
    Write-Host "Running import SQL command..." -ForegroundColor Green
    $env:PGPASSWORD = $password
    & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $tempSqlFile
    
    if ($LASTEXITCODE -ne 0) {
        throw "Error executing PostgreSQL command. Exit code: $LASTEXITCODE"
    }
    
    Write-Host "Import completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($env:PGPASSWORD) {
        $env:PGPASSWORD = $null
    }
    exit 1
}
finally {
    # Clean up
    if ($env:PGPASSWORD) {
        $env:PGPASSWORD = $null
    }
    
    if (Test-Path $tempCsvFile) {
        Remove-Item $tempCsvFile -Force
    }
    
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile -Force
    }
}

# Verify data was imported
Write-Host "Checking data in staging table..." -ForegroundColor Cyan
$dataCheck = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT COUNT(*) FROM property_import_staging;" -t
Write-Host "Rows in staging table: $($dataCheck.Trim())" -ForegroundColor Green

# Show the data
Write-Host "Data in staging table:" -ForegroundColor Cyan
& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT * FROM property_import_staging;"

# Update the properties table
Write-Host "Updating properties table from staging data..." -ForegroundColor Cyan
$updateResult = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c @"
INSERT INTO properties (
    folio_number,
    address,
    city,
    zip_code,
    property_type,
    bedrooms,
    bathrooms,
    total_area,
    year_built,
    last_sale_date,
    last_sale_price
)
SELECT
    folio_number,
    property_address,
    property_city,
    property_zip,
    CASE 
        WHEN land_use LIKE '%RES%' THEN 'Residential'
        WHEN land_use LIKE '%COM%' THEN 'Commercial'
        WHEN land_use LIKE '%IND%' THEN 'Industrial'
        ELSE 'Other'
    END AS property_type,
    bedrooms,
    bathrooms,
    actual_sqft,
    year_built,
    sale_date,
    sale_amount
FROM property_import_staging
WHERE folio_number NOT IN (SELECT folio_number FROM properties)
ON CONFLICT (folio_number) DO NOTHING;
SELECT 'Inserted: ' || COUNT(*) FROM properties;
"@

Write-Host "Update result: $updateResult" -ForegroundColor Green

Write-Host "Import test completed successfully!" -ForegroundColor Green 
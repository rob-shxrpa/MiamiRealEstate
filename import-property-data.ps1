# import-property-data.ps1
# Script to import property data from CSV to PostgreSQL
$ErrorActionPreference = "Stop"

Write-Host "Miami Real Estate - Property Data Import" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$csvFile = "C:\Projects\MiamiRealEstate\Files\MunRoll - 00 RE - All Properties.csv"
$batchSize = 1000  # Process this many rows at once to avoid memory issues
$logFile = "import-log.txt"

# Database connection settings
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbName = "miami_realestate"

# Read password from .env file
$dbPassword = $null
if (Test-Path "server/.env") {
    Get-Content "server/.env" | ForEach-Object {
        if ($_ -match "^\s*DB_PASSWORD=(.*)$") {
            $dbPassword = $matches[1]
        }
    }
}

if (-not $dbPassword) {
    $dbPassword = Read-Host "Enter PostgreSQL password for user 'postgres'"
}

# Find psql.exe
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    # Try other versions
    @(16, 15, 14, 13, 12) | ForEach-Object {
        $testPath = "C:\Program Files\PostgreSQL\$_\bin\psql.exe"
        if (Test-Path $testPath) {
            $psqlPath = $testPath
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
$env:PGPASSWORD = $dbPassword

# Check if CSV file exists
if (-not (Test-Path $csvFile)) {
    Write-Host "CSV file not found: $csvFile" -ForegroundColor Red
    exit 1
}

# Create staging table
Write-Host "Creating staging table for import..." -ForegroundColor Cyan
$createStagingTable = @"
DROP TABLE IF EXISTS property_import_staging;
CREATE TABLE property_import_staging (
    folio_number VARCHAR(25) PRIMARY KEY,
    address TEXT,
    city VARCHAR(100),
    zipcode VARCHAR(20),
    land_value NUMERIC(15,2),
    building_value NUMERIC(15,2),
    total_value NUMERIC(15,2),
    assessed_value NUMERIC(15,2),
    exemption_value NUMERIC(15,2),
    taxable_value NUMERIC(15,2),
    land_use VARCHAR(50),
    zoning VARCHAR(50),
    owner1 VARCHAR(200),
    owner2 VARCHAR(200),
    mailing_address TEXT,
    mailing_city VARCHAR(100),
    mailing_state VARCHAR(50),
    mailing_zip VARCHAR(20),
    legal_description TEXT,
    lot_size NUMERIC(15,2),
    bedrooms INT,
    bathrooms NUMERIC(4,1),
    stories INT,
    units INT,
    year_built INT,
    living_area NUMERIC(12,2),
    actual_area NUMERIC(12,2),
    sale_date1 DATE,
    sale_amount1 NUMERIC(15,2),
    sale_date2 DATE,
    sale_amount2 NUMERIC(15,2),
    sale_date3 DATE,
    sale_amount3 NUMERIC(15,2),
    import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"@

& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $createStagingTable

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating staging table. Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Create log file
"Import started at $(Get-Date)" | Out-File -FilePath $logFile

# Prepare COPY command file for PostgreSQL
$tempSqlFile = "temp_copy.sql"
@"
-- First, create a temporary staging file with the exact CSV structure
CREATE TEMPORARY TABLE csv_raw (
    folio TEXT,
    property_address TEXT,
    property_city TEXT,
    property_zip TEXT,
    year TEXT,
    land TEXT,
    bldg TEXT,
    total TEXT,
    assessed TEXT,
    wvdb TEXT,
    hex TEXT,
    gpar TEXT,
    county_2nd_hex TEXT,
    county_senior TEXT,
    county_longterm_senior TEXT,
    county_other_exempt TEXT,
    county_taxable TEXT,
    city_2nd_hex TEXT,
    city_senior TEXT,
    city_longterm_senior TEXT,
    city_other_exempt TEXT,
    city_taxable TEXT,
    millcode TEXT,
    land_use TEXT,
    zoning TEXT,
    owner1 TEXT,
    owner2 TEXT,
    mailing_address TEXT,
    mailing_city TEXT,
    mailing_state TEXT,
    mailing_zip TEXT,
    mailing_country TEXT,
    legal1 TEXT,
    legal2 TEXT,
    legal3 TEXT,
    legal4 TEXT,
    legal5 TEXT,
    legal6 TEXT,
    adjusted_sqft TEXT,
    lot_size TEXT,
    bed TEXT,
    bath TEXT,
    stories TEXT,
    units TEXT,
    year_built TEXT,
    effective_year_built TEXT,
    sale_type_1 TEXT,
    sale_qual_1 TEXT,
    sale_date_1 TEXT,
    sale_amt_1 TEXT,
    sale_type_2 TEXT,
    sale_qual_2 TEXT,
    sale_date_2 TEXT,
    sale_amt_2 TEXT,
    sale_type_3 TEXT,
    sale_qual_3 TEXT,
    sale_date_3 TEXT,
    sale_amt_3 TEXT,
    xf1 TEXT,
    xf2 TEXT,
    xf3 TEXT,
    living_sqft TEXT,
    actual_sqft TEXT,
    cra TEXT
);

-- Load data from CSV into the raw table
\\COPY csv_raw FROM '$csvFile' WITH (FORMAT csv, HEADER true, DELIMITER E'\t', NULL '', ENCODING 'UTF8', QUOTE '"');

-- Now insert from the raw CSV data into our properly typed staging table
INSERT INTO property_import_staging (
    folio_number,
    address,
    city,
    zipcode,
    land_value,
    building_value,
    total_value,
    assessed_value,
    exemption_value,
    taxable_value,
    land_use,
    zoning,
    owner1,
    owner2,
    mailing_address,
    mailing_city,
    mailing_state,
    mailing_zip,
    legal_description,
    lot_size,
    bedrooms,
    bathrooms,
    stories,
    units,
    year_built,
    living_area,
    actual_area,
    sale_date1,
    sale_amount1,
    sale_date2,
    sale_amount2,
    sale_date3,
    sale_amount3
)
SELECT
    folio,
    property_address,
    property_city,
    property_zip,
    NULLIF(land, '')::NUMERIC,
    NULLIF(bldg, '')::NUMERIC,
    NULLIF(total, '')::NUMERIC,
    NULLIF(assessed, '')::NUMERIC,
    NULLIF(hex, '')::NUMERIC,
    NULLIF(county_taxable, '')::NUMERIC,
    land_use,
    zoning,
    owner1,
    owner2,
    mailing_address,
    mailing_city,
    mailing_state,
    mailing_zip,
    CONCAT_WS(' ', NULLIF(legal1, ''), NULLIF(legal2, ''), NULLIF(legal3, '')),
    NULLIF(lot_size, '')::NUMERIC,
    NULLIF(bed, '')::INT,
    NULLIF(bath, '')::NUMERIC,
    NULLIF(stories, '')::INT,
    NULLIF(units, '')::INT,
    NULLIF(year_built, '')::INT,
    NULLIF(living_sqft, '')::NUMERIC,
    NULLIF(actual_sqft, '')::NUMERIC,
    CASE WHEN sale_date_1 ~ E'^\\d{1,2}/\\d{1,2}/\\d{4}$' THEN TO_DATE(sale_date_1, 'MM/DD/YYYY') ELSE NULL END,
    NULLIF(REGEXP_REPLACE(sale_amt_1, '\\$|,', '', 'g'), '')::NUMERIC,
    CASE WHEN sale_date_2 ~ E'^\\d{1,2}/\\d{1,2}/\\d{4}$' THEN TO_DATE(sale_date_2, 'MM/DD/YYYY') ELSE NULL END,
    NULLIF(REGEXP_REPLACE(sale_amt_2, '\\$|,', '', 'g'), '')::NUMERIC,
    CASE WHEN sale_date_3 ~ E'^\\d{1,2}/\\d{1,2}/\\d{4}$' THEN TO_DATE(sale_date_3, 'MM/DD/YYYY') ELSE NULL END,
    NULLIF(REGEXP_REPLACE(sale_amt_3, '\\$|,', '', 'g'), '')::NUMERIC
FROM csv_raw
WHERE folio IS NOT NULL AND folio <> 'Folio';

-- Count how many records were imported
SELECT COUNT(*) FROM property_import_staging;
"@ | Out-File -FilePath $tempSqlFile -Encoding utf8

# Process the CSV file
Write-Host "Importing data from CSV file..." -ForegroundColor Cyan
Write-Host "This may take several minutes for large files..." -ForegroundColor Yellow

& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $tempSqlFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error importing data. Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Remove temporary file
Remove-Item $tempSqlFile

# Get count of imported records
$countResult = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c "SELECT COUNT(*) FROM property_import_staging;"
$importCount = $countResult.Trim()
Write-Host "Imported $importCount records into staging table" -ForegroundColor Green
"Imported $importCount records into staging table" | Out-File -FilePath $logFile -Append

# Update the properties table
Write-Host "Updating properties table from staging data..." -ForegroundColor Cyan

$updateScript = @"
-- Create a temporary table for geocoding
CREATE TEMP TABLE geo_updates AS
SELECT 
    folio_number,
    address,
    city,
    zipcode AS zip_code,
    'Residential' AS property_type,
    bedrooms,
    bathrooms,
    actual_area AS total_area,
    year_built,
    sale_date1 AS last_sale_date,
    sale_amount1 AS last_sale_price,
    NULL::NUMERIC AS longitude, 
    NULL::NUMERIC AS latitude
FROM property_import_staging;

-- Insert new properties
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
FROM geo_updates
WHERE folio_number NOT IN (SELECT folio_number FROM properties)
ON CONFLICT (folio_number) DO NOTHING;

-- Update existing properties
UPDATE properties p
SET 
    address = g.address,
    city = g.city,
    zip_code = g.zip_code,
    property_type = g.property_type,
    bedrooms = g.bedrooms,
    bathrooms = g.bathrooms,
    total_area = g.total_area,
    year_built = g.year_built,
    last_sale_date = g.last_sale_date,
    last_sale_price = g.last_sale_price,
    updated_at = NOW()
FROM geo_updates g
WHERE p.folio_number = g.folio_number;

-- Count updated and inserted records
SELECT 
    (SELECT COUNT(*) FROM properties) AS total_properties,
    (SELECT COUNT(*) FROM properties WHERE updated_at > NOW() - INTERVAL '5 minutes') AS updated_properties;
"@

$updateResult = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $updateScript
Write-Host "Update complete: $updateResult" -ForegroundColor Green
"Update complete: $updateResult" | Out-File -FilePath $logFile -Append

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Cyan
& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "DROP TABLE property_import_staging;"

Write-Host "Import process completed successfully!" -ForegroundColor Green
"Import completed at $(Get-Date)" | Out-File -FilePath $logFile -Append
Write-Host "Log file saved to: $logFile" -ForegroundColor Cyan 
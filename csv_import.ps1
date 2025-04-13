# csv_import.ps1
# Script to import property data from tab-delimited CSV file
$ErrorActionPreference = "Stop"

Write-Host "Miami Real Estate - CSV Import" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$csvFile = "C:\Projects\MiamiRealEstate\Files\MunRoll - 00 RE - All Properties.csv"
$tempCsvFile = "C:\Projects\MiamiRealEstate\temp_import.csv"
$logFile = "C:\Projects\MiamiRealEstate\import_log.txt"

# Start logging
"Import started at $(Get-Date)" | Out-File -FilePath $logFile -Force

# Database connection settings
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbName = "miami_realestate"

# Get password
Write-Host "Enter PostgreSQL password for user 'postgres':" -ForegroundColor Yellow
$dbPassword = Read-Host
$env:PGPASSWORD = $dbPassword

Write-Host "Testing database connection..." -ForegroundColor Cyan
$testResult = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Database connection failed: $testResult" -ForegroundColor Red
    "Database connection failed: $testResult" | Out-File -FilePath $logFile -Append
    exit 1
}
Write-Host "Database connection successful" -ForegroundColor Green
"Database connection successful" | Out-File -FilePath $logFile -Append

# Create staging table if it doesn't exist
Write-Host "Creating staging table if it doesn't exist..." -ForegroundColor Cyan
$createStagingSqlFile = "C:\Projects\MiamiRealEstate\create_staging.sql"

$createStagingSqlContent = @"
-- Drop and recreate the staging table
DROP TABLE IF EXISTS property_import_staging;

-- Create a new staging table
CREATE TABLE property_import_staging (
    folio_number VARCHAR(20) NOT NULL PRIMARY KEY,
    property_address TEXT,
    property_city TEXT,
    property_zip VARCHAR(10),
    land_value NUMERIC,
    building_value NUMERIC,
    total_value NUMERIC,
    assessed_value NUMERIC,
    land_use TEXT,
    zoning TEXT,
    owner_name1 TEXT,
    owner_name2 TEXT,
    lot_size NUMERIC,
    bedrooms NUMERIC,
    bathrooms NUMERIC,
    year_built INTEGER,
    living_sqft NUMERIC,
    actual_sqft NUMERIC,
    sale_date DATE,
    sale_amount NUMERIC
);
"@

$createStagingSqlContent | Out-File -FilePath $createStagingSqlFile -Encoding ASCII

$createStagingResult = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $createStagingSqlFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating staging table: $createStagingResult" -ForegroundColor Red
    "Error creating staging table: $createStagingResult" | Out-File -FilePath $logFile -Append
    exit 1
}

Write-Host "Staging table created successfully" -ForegroundColor Green
"Staging table created successfully" | Out-File -FilePath $logFile -Append

# Cleanup staging SQL file
Remove-Item $createStagingSqlFile -Force -ErrorAction SilentlyContinue

# Read the CSV file, skipping the first 4 lines (header + disclaimer)
Write-Host "Reading CSV file..." -ForegroundColor Cyan
$allLines = Get-Content $csvFile
"CSV file has $($allLines.Count) lines" | Out-File -FilePath $logFile -Append

# Skip first 4 lines and get header
$headerLine = $allLines[3]  # 0-based index for 4th line
"Header: $headerLine" | Out-File -FilePath $logFile -Append

# Get data starting from the 5th line
$data = $allLines | Select-Object -Skip 4
"Data records to process: $($data.Count)" | Out-File -FilePath $logFile -Append

# Create column mapping from header
Write-Host "Analyzing header structure..." -ForegroundColor Cyan
$headerFields = $headerLine -split ","
"Found $($headerFields.Count) columns in header" | Out-File -FilePath $logFile -Append

# Create a new CSV file with comma delimiter for test data
Write-Host "Creating comma-delimited CSV for test import..." -ForegroundColor Cyan
$outputHeader = "folio_number,property_address,property_city,property_zip,land_value,building_value,total_value,assessed_value,land_use,zoning,owner_name1,owner_name2,lot_size,bedrooms,bathrooms,year_built,living_sqft,actual_sqft,sale_date,sale_amount"
$outputHeader | Out-File -FilePath $tempCsvFile -Encoding UTF8

# Process records in batches
Write-Host "Processing records in batches..." -ForegroundColor Cyan

$batchSize = 1000
$totalRecords = 0
$batches = [math]::Ceiling($data.Count / $batchSize)

for ($batch = 0; $batch -lt $batches; $batch++) {
    $start = $batch * $batchSize
    $end = [math]::Min(($batch + 1) * $batchSize, $data.Count)
    
    Write-Host "Processing batch $($batch+1) of $batches (records $start to $end)..." -ForegroundColor Yellow
    
    # Create a new CSV file for this batch
    $batchCsvFile = "C:\Projects\MiamiRealEstate\temp_import_batch_$batch.csv"
    $outputHeader | Out-File -FilePath $batchCsvFile -Encoding UTF8
    
    $processedInBatch = 0
    
    for ($i = $start; $i -lt $end -and $i -lt $data.Count; $i++) {
        $line = $data[$i]
        
        # Skip empty lines
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }
        
        # Split by comma (the actual format appears to be comma-delimited)
        $fields = $line -split ","
        
        if ($fields.Count -lt 10) {
            continue
        }
        
        # Clean and validate fields
        $folio = $fields[0] -replace '"', ''
        if ([string]::IsNullOrWhiteSpace($folio)) { continue }
        
        $address = $fields[1] -replace '"', ''
        $city = $fields[2] -replace '"', ''
        $zip = $fields[3].Trim() -replace '"', '' -replace '-.*', ''
        
        # Numeric fields - ensure they contain only numbers, otherwise set to 0
        $year = $fields[4] -replace '"', ''
        if (![string]::IsNullOrWhiteSpace($year) -and $year -notmatch '^\d+$') { $year = 0 }
        
        $land = $fields[5] -replace '"', '' -replace '\$', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($land) -and $land -notmatch '^\d+(\.\d+)?$') { $land = 0 }
        
        $bldg = $fields[6] -replace '"', '' -replace '\$', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($bldg) -and $bldg -notmatch '^\d+(\.\d+)?$') { $bldg = 0 }
        
        $total = $fields[7] -replace '"', '' -replace '\$', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($total) -and $total -notmatch '^\d+(\.\d+)?$') { $total = 0 }
        
        $assessed = $fields[8] -replace '"', '' -replace '\$', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($assessed) -and $assessed -notmatch '^\d+(\.\d+)?$') { $assessed = 0 }
        
        $land_use = $fields[23] -replace '"', ''
        $zoning = $fields[24] -replace '"', ''
        $owner1 = $fields[25] -replace '"', ''
        $owner2 = $fields[26] -replace '"', ''
        
        $lot_size = $fields[39] -replace '"', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($lot_size) -and $lot_size -notmatch '^\d+(\.\d+)?$') { $lot_size = 0 }
        
        $bed = $fields[40] -replace '"', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($bed) -and $bed -notmatch '^\d+(\.\d+)?$') { $bed = 0 }
        
        $bath = $fields[41] -replace '"', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($bath) -and $bath -notmatch '^\d+(\.\d+)?$') { $bath = 0 }
        
        $year_built = $fields[44] -replace '"', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($year_built) -and $year_built -notmatch '^\d+$') { $year_built = 0 }
        
        $living_sqft = $fields[61] -replace '"', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($living_sqft) -and $living_sqft -notmatch '^\d+(\.\d+)?$') { $living_sqft = 0 }
        
        $actual_sqft = $fields[62] -replace '"', '' -replace ',', ''
        if (![string]::IsNullOrWhiteSpace($actual_sqft) -and $actual_sqft -notmatch '^\d+(\.\d+)?$') { $actual_sqft = 0 }
        
        # Extract sale date and amount
        $sale_date = if ($fields[48] -and $fields[48] -match '\d{1,2}/\d{1,2}/\d{4}') {
            $dateParts = $fields[48] -split '/'
            "$($dateParts[2])-$($dateParts[0])-$($dateParts[1])"
        } else { "" }
        
        $sale_amount = $fields[49] -replace '"', '' -replace '\$', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($sale_amount) -or $sale_amount -notmatch '^\d+(\.\d+)?$') { $sale_amount = 0 }
        
        # Create properly escaped CSV row
        $newRow = "$folio,""$address"",""$city"",$zip,$land,$bldg,$total,$assessed,""$land_use"",""$zoning"",""$owner1"",""$owner2"",$lot_size,$bed,$bath,$year_built,$living_sqft,$actual_sqft,$sale_date,$sale_amount"
        $newRow | Out-File -FilePath $batchCsvFile -Append -Encoding UTF8
        
        $processedInBatch++
        $totalRecords++
        
        # Show progress every 100 records
        if ($totalRecords % 100 -eq 0) {
            Write-Host "Processed $totalRecords records..." -ForegroundColor Green
        }
    }
    
    Write-Host "Processed $processedInBatch records in batch $($batch+1)" -ForegroundColor Green
    
    # Import this batch into the database
    $batchSqlFile = "C:\Projects\MiamiRealEstate\import_batch_$batch.sql"
    
    $batchSqlContent = @"
-- Import from the batch CSV file
\COPY property_import_staging (folio_number, property_address, property_city, property_zip, land_value, building_value, total_value, assessed_value, land_use, zoning, owner_name1, owner_name2, lot_size, bedrooms, bathrooms, year_built, living_sqft, actual_sqft, sale_date, sale_amount) FROM '$batchCsvFile' WITH CSV HEADER NULL AS '';

-- Count records so far
SELECT COUNT(*) AS "Records in staging table" FROM property_import_staging;
"@
    
    $batchSqlContent | Out-File -FilePath $batchSqlFile -Encoding ASCII
    
    Write-Host "Importing batch $($batch+1) to database..." -ForegroundColor Cyan
    $importBatchResult = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $batchSqlFile 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error importing batch $($batch+1): $importBatchResult" -ForegroundColor Red
        "Error importing batch $($batch+1): $importBatchResult" | Out-File -FilePath $logFile -Append
        exit 1
    }
    
    # Cleanup batch files
    Remove-Item $batchCsvFile -Force -ErrorAction SilentlyContinue
    Remove-Item $batchSqlFile -Force -ErrorAction SilentlyContinue
}

# Prepare SQL to update the properties table from staging data
Write-Host "Finalizing data import to properties table..." -ForegroundColor Cyan
$finalizeSqlFile = "C:\Projects\MiamiRealEstate\finalize_import.sql"

$finalizeSqlContent = @"
-- Insert new properties from staging table
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
WHERE folio_number NOT IN (SELECT folio_number FROM properties WHERE folio_number IS NOT NULL)
ON CONFLICT (folio_number) DO NOTHING;

-- Update existing properties with new data
UPDATE properties p
SET
    address = CASE WHEN s.property_address IS NOT NULL AND s.property_address != '' THEN s.property_address ELSE p.address END,
    city = CASE WHEN s.property_city IS NOT NULL AND s.property_city != '' THEN s.property_city ELSE p.city END,
    zip_code = CASE WHEN s.property_zip IS NOT NULL AND s.property_zip != '' THEN s.property_zip ELSE p.zip_code END,
    property_type = CASE 
        WHEN s.land_use LIKE '%RES%' THEN 'Residential'
        WHEN s.land_use LIKE '%COM%' THEN 'Commercial'
        WHEN s.land_use LIKE '%IND%' THEN 'Industrial'
        ELSE p.property_type
    END,
    bedrooms = CASE WHEN s.bedrooms IS NOT NULL THEN s.bedrooms ELSE p.bedrooms END,
    bathrooms = CASE WHEN s.bathrooms IS NOT NULL THEN s.bathrooms ELSE p.bathrooms END,
    total_area = CASE WHEN s.actual_sqft IS NOT NULL THEN s.actual_sqft ELSE p.total_area END,
    year_built = CASE WHEN s.year_built IS NOT NULL THEN s.year_built ELSE p.year_built END,
    last_sale_date = CASE WHEN s.sale_date IS NOT NULL THEN s.sale_date ELSE p.last_sale_date END,
    last_sale_price = CASE WHEN s.sale_amount IS NOT NULL THEN s.sale_amount ELSE p.last_sale_price END
FROM property_import_staging s
WHERE p.folio_number = s.folio_number;

-- Count properties
SELECT COUNT(*) AS "Total properties after import" FROM properties;
"@

$finalizeSqlContent | Out-File -FilePath $finalizeSqlFile -Encoding ASCII

# Execute finalize SQL commands
Write-Host "Finalizing property import..." -ForegroundColor Cyan
$finalizeResult = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $finalizeSqlFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error finalizing import: $finalizeResult" -ForegroundColor Red
    "Error finalizing import: $finalizeResult" | Out-File -FilePath $logFile -Append
    exit 1
}

# Output finalize results
Write-Host "Finalize Results:" -ForegroundColor Green
Write-Host $finalizeResult
$finalizeResult | Out-File -FilePath $logFile -Append

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Cyan
Remove-Item $finalizeSqlFile -Force -ErrorAction SilentlyContinue

Write-Host "Import completed successfully!" -ForegroundColor Green
Write-Host "Total records processed: $totalRecords" -ForegroundColor Green
"Import completed at $(Get-Date)" | Out-File -FilePath $logFile -Append
"Total records processed: $totalRecords" | Out-File -FilePath $logFile -Append 
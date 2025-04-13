# import-properties.ps1
# Simplified script for importing property data
$ErrorActionPreference = "Stop"

Write-Host "Miami Real Estate - Property Data Import" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$csvFile = "C:\Projects\MiamiRealEstate\Files\MunRoll - 00 RE - All Properties.csv"
$sqlFile = "database\import_properties.sql"
$propertyDataSqlFile = "database\import_property_data.sql"
$tempCsvFile = "temp_import.csv"
$logFile = "import-log.txt"

# Start logging
"Import started at $(Get-Date)" | Out-File -FilePath $logFile -Force

# Database connection settings
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbName = "miami_realestate"

# Get password for all PostgreSQL commands
Write-Host "Enter PostgreSQL password for user 'postgres':" -ForegroundColor Yellow
$securePassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$dbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $dbPassword
Write-Host "Password set for this session" -ForegroundColor Green

# Find psql.exe
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    Write-Host "PostgreSQL 17 not found, looking for other versions..." -ForegroundColor Yellow
    # Try other versions
    @(16, 15, 14, 13, 12) | ForEach-Object {
        $testPath = "C:\Program Files\PostgreSQL\$_\bin\psql.exe"
        if (Test-Path $testPath) {
            $psqlPath = $testPath
            Write-Host "Found PostgreSQL $_ at $testPath" -ForegroundColor Green
        }
    }
}

if (-not (Test-Path $psqlPath)) {
    Write-Host "Could not find psql.exe. Please enter the full path:" -ForegroundColor Yellow
    $psqlPath = Read-Host
    if (-not (Test-Path $psqlPath)) {
        Write-Host "Invalid path: $psqlPath" -ForegroundColor Red
        "ERROR: Invalid PostgreSQL path - $psqlPath" | Out-File -FilePath $logFile -Append
        exit 1
    }
}

Write-Host "Using PostgreSQL client: $psqlPath" -ForegroundColor Green

# Test database connection
Write-Host "Testing database connection..." -ForegroundColor Cyan
try {
    $testConnection = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT 'Connection successful';" -t
    if ($LASTEXITCODE -ne 0) {
        throw "Database connection test failed with exit code $LASTEXITCODE"
    }
    Write-Host "Database connection successful!" -ForegroundColor Green
} catch {
    Write-Host "Database connection failed: $_" -ForegroundColor Red
    "ERROR: Database connection failed - $_" | Out-File -FilePath $logFile -Append
    exit 1
}

# Check if CSV file exists
if (-not (Test-Path $csvFile)) {
    Write-Host "CSV file not found: $csvFile" -ForegroundColor Red
    "ERROR: CSV file not found - $csvFile" | Out-File -FilePath $logFile -Append
    exit 1
}

# Step 1: Run import_properties.sql to set up the database
Write-Host "Setting up database for import..." -ForegroundColor Cyan
try {
    & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile
    if ($LASTEXITCODE -ne 0) {
        throw "Database setup failed with exit code $LASTEXITCODE"
    }
    Write-Host "Database structure created successfully" -ForegroundColor Green
} catch {
    Write-Host "Database setup failed: $_" -ForegroundColor Red
    "ERROR: Database setup failed - $_" | Out-File -FilePath $logFile -Append
    exit 1
}

# Step 2: Process the CSV file
Write-Host "Processing CSV file..." -ForegroundColor Cyan

# Skip the first 3 lines which contain headers and read the 4th line (column headers)
$csvContent = Get-Content $csvFile
$headerLine = $csvContent[3]

# Create headers array
$headers = $headerLine -split '\t'

# Create a map of column indices for easy access
$columnMap = @{}
for ($i = 0; $i -lt $headers.Count; $i++) {
    $columnMap[$headers[$i]] = $i
}

# Create header for the new temporary CSV file
$newHeader = "folio,property_address,property_city,property_zip,land_value,building_value,total_value,assessed_value,land_use,zoning,owner_name1,owner_name2,lot_size,bedrooms,bathrooms,year_built,living_sqft,actual_sqft,sale_date,sale_amount"

# Create a new temporary CSV file
$newHeader | Out-File -FilePath $tempCsvFile -Encoding UTF8

$totalRecords = 0
$batchSize = 10000  # Process in batches to avoid memory issues

# Process the file in batches
for ($batch = 0; $batch -lt [Math]::Ceiling(($csvContent.Count - 4) / $batchSize); $batch++) {
    $startLine = 4 + ($batch * $batchSize)
    $endLine = [Math]::Min($startLine + $batchSize - 1, $csvContent.Count - 1)
    
    Write-Host "Processing batch $($batch+1) (lines $startLine to $endLine)..." -ForegroundColor Yellow
    
    $processedInBatch = 0
    
    for ($lineNumber = $startLine; $lineNumber -le $endLine; $lineNumber++) {
        $line = $csvContent[$lineNumber]
        
        # Skip empty lines
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }
        
        $fields = $line -split '\t'
        
        # Skip if no folio number (essential field)
        if ([string]::IsNullOrWhiteSpace($fields[$columnMap["FOLIO"]])) {
            continue
        }
        
        # Extract and clean fields
        $folio = $fields[$columnMap["FOLIO"]] -replace '"', ''
        $address = $fields[$columnMap["ADDRESS"]] -replace '"', '' -replace ',', ''
        $city = $fields[$columnMap["CITY"]] -replace '"', '' -replace ',', ''
        $zip = $fields[$columnMap["ZIPCODE"]] -replace '"', '' -replace ',', ''
        
        $land = $fields[$columnMap["LND"]] -replace '"', '' -replace '\$', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($land) -or $land -notmatch '^\d+(\.\d+)?$') { $land = 0 }
        
        $bldg = $fields[$columnMap["BLDG"]] -replace '"', '' -replace '\$', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($bldg) -or $bldg -notmatch '^\d+(\.\d+)?$') { $bldg = 0 }
        
        $total = $fields[$columnMap["TOTAL"]] -replace '"', '' -replace '\$', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($total) -or $total -notmatch '^\d+(\.\d+)?$') { $total = 0 }
        
        $assessed = $fields[$columnMap["ASMNT"]] -replace '"', '' -replace '\$', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($assessed) -or $assessed -notmatch '^\d+(\.\d+)?$') { $assessed = 0 }
        
        $land_use = $fields[$columnMap["USE_CODE"]] -replace '"', '' -replace ',', ''
        $zoning = $fields[$columnMap["ZONING"]] -replace '"', '' -replace ',', ''
        
        $owner1 = $fields[$columnMap["OWNER1"]] -replace '"', '' -replace ',', ''
        $owner2 = $fields[$columnMap["OWNER2"]] -replace '"', '' -replace ',', ''
        
        $lot_size = $fields[$columnMap["LOT_SIZE"]] -replace '"', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($lot_size) -or $lot_size -notmatch '^\d+(\.\d+)?$') { $lot_size = 0 }
        
        $bed = $fields[$columnMap["BED"]] -replace '"', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($bed) -or $bed -notmatch '^\d+(\.\d+)?$') { $bed = 0 }
        
        $bath = $fields[$columnMap["BATH"]] -replace '"', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($bath) -or $bath -notmatch '^\d+(\.\d+)?$') { $bath = 0 }
        
        $year_built = $fields[$columnMap["YR_BLT"]] -replace '"', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($year_built) -or $year_built -notmatch '^\d+$') { $year_built = 0 }
        
        $living_sqft = $fields[$columnMap["LIV_SQFT"]] -replace '"', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($living_sqft) -or $living_sqft -notmatch '^\d+(\.\d+)?$') { $living_sqft = 0 }
        
        $actual_sqft = $fields[$columnMap["ACT_SQFT"]] -replace '"', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($actual_sqft) -or $actual_sqft -notmatch '^\d+(\.\d+)?$') { $actual_sqft = 0 }
        
        $sale_date = if ($fields[$columnMap["SALE_DT1"]] -and $fields[$columnMap["SALE_DT1"]] -match '\d{1,2}/\d{1,2}/\d{4}') {
            $dateParts = $fields[$columnMap["SALE_DT1"]] -split '/'
            "$($dateParts[2])-$($dateParts[0])-$($dateParts[1])"
        } else { "" }
        
        $sale_amount = $fields[$columnMap["SALE_VAL1"]] -replace '"', '' -replace '\$', '' -replace ',', ''
        if ([string]::IsNullOrWhiteSpace($sale_amount) -or $sale_amount -notmatch '^\d+(\.\d+)?$') { $sale_amount = 0 }
        
        # Create properly escaped CSV row
        $newRow = "$folio,""$address"",""$city"",$zip,$land,$bldg,$total,$assessed,""$land_use"",""$zoning"",""$owner1"",""$owner2"",$lot_size,$bed,$bath,$year_built,$living_sqft,$actual_sqft,$sale_date,$sale_amount"
        $newRow | Out-File -FilePath $tempCsvFile -Append -Encoding UTF8
        
        $processedInBatch++
        $totalRecords++
        
        # Show progress every 1000 records
        if ($totalRecords % 1000 -eq 0) {
            Write-Host "Processed $totalRecords records..." -ForegroundColor Green
        }
    }
    
    Write-Host "Processed $processedInBatch records in batch $($batch+1)" -ForegroundColor Green
}

Write-Host "Total records processed: $totalRecords" -ForegroundColor Green
"Total records processed: $totalRecords" | Out-File -FilePath $logFile -Append

# Step 3: Import the data into PostgreSQL
Write-Host "Importing data into PostgreSQL..." -ForegroundColor Cyan

try {
    $importSql = @"
\COPY property_import_staging (folio_number, property_address, property_city, property_zip, land_value, building_value, total_value, assessed_value, land_use, zoning, owner_name1, owner_name2, lot_size, bedrooms, bathrooms, year_built, living_sqft, actual_sqft, sale_date, sale_amount) FROM '$tempCsvFile' WITH CSV HEADER NULL AS '';

SELECT COUNT(*) FROM property_import_staging;
"@

    $importFile = "temp_import.sql"
    $importSql | Out-File -FilePath $importFile -Encoding UTF8 -Force
    
    $importOutput = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $importFile
    
    if ($LASTEXITCODE -ne 0) {
        throw "Import failed with exit code $LASTEXITCODE"
    }
    
    # Extract the count of records
    $importCount = ($importOutput | Where-Object { $_ -match '^\s*\d+\s*$' } | Select-Object -First 1).Trim()
    Write-Host "Imported $importCount records to staging table" -ForegroundColor Green
    "Imported $importCount records to staging table" | Out-File -FilePath $logFile -Append
    
    # Update properties table from the imported data
    Write-Host "Updating properties table from imported data..." -ForegroundColor Cyan
    $updateOutput = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c @"
UPDATE properties p
SET 
    address = s.property_address,
    city = s.property_city,
    zip_code = s.property_zip,
    property_type = s.land_use,
    bedrooms = s.bedrooms,
    bathrooms = s.bathrooms,
    total_area = s.living_sqft,
    year_built = s.year_built,
    last_sale_date = s.sale_date,
    last_sale_price = s.sale_amount,
    updated_at = NOW()
FROM property_import_staging s
WHERE p.folio_number = s.folio_number;

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
    last_sale_price,
    created_at,
    updated_at
)
SELECT 
    folio_number,
    property_address,
    property_city,
    property_zip,
    land_use,
    bedrooms,
    bathrooms,
    living_sqft,
    year_built,
    sale_date,
    sale_amount,
    NOW(),
    NOW()
FROM property_import_staging s
WHERE NOT EXISTS (
    SELECT 1 FROM properties p WHERE p.folio_number = s.folio_number
);

SELECT COUNT(*) FROM properties;
"@
    
    # Extract the count of updated properties
    $updateCount = ($updateOutput | Where-Object { $_ -match '^\s*\d+\s*$' } | Select-Object -First 1).Trim()
    Write-Host "Updated properties: $updateCount" -ForegroundColor Green
    "Updated properties: $updateCount" | Out-File -FilePath $logFile -Append

    # Import data into property_data table for sales history
    Write-Host "Importing data into property_data table for sales history..." -ForegroundColor Cyan
    
    # First, ensure the property_data table exists
    $tableCheckOutput = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'property_data');"
    $tableExists = ($tableCheckOutput | Where-Object { $_ -match 'true|false' }).Trim()
    
    if ($tableExists -eq "false") {
        Write-Host "Creating property_data table using migration script..." -ForegroundColor Yellow
        & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "database\migrations\property_data_migration.sql"
    }
    
    # Run the property data import script
    Write-Host "Running property_data import script..." -ForegroundColor Cyan
    $propertyDataOutput = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $propertyDataSqlFile
    
    # Extract the count of records in property_data
    $propertyDataCount = ($propertyDataOutput | Where-Object { $_ -match 'Records imported to property_data' } | 
                         ForEach-Object { $_ -replace 'Records imported to property_data', '' }).Trim()
    
    Write-Host "Imported $propertyDataCount records to property_data table" -ForegroundColor Green
    "Imported $propertyDataCount records to property_data table" | Out-File -FilePath $logFile -Append
} catch {
    Write-Host "Import error: $_" -ForegroundColor Red
    "ERROR: Import failed - $_" | Out-File -FilePath $logFile -Append
    exit 1
} finally {
    # Clean up
    if (Test-Path $tempCsvFile) {
        Remove-Item $tempCsvFile -Force
        Write-Host "Temporary CSV file removed" -ForegroundColor Gray
    }
    
    if (Test-Path $importFile) {
        Remove-Item $importFile -Force
        Write-Host "Temporary SQL file removed" -ForegroundColor Gray
    }
    
    # Clear password from environment
    $env:PGPASSWORD = ""
}

Write-Host "Import process completed successfully!" -ForegroundColor Green
"Import completed at $(Get-Date)" | Out-File -FilePath $logFile -Append 
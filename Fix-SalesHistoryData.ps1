# Fix-SalesHistoryData.ps1
# This script fixes the sales history data in the property_data table
# by ensuring that sale_date_2, sale_amount_2, sale_date_3, and sale_amount_3 are properly populated

$ErrorActionPreference = "Stop"

Write-Host "Miami Real Estate - Fix Sales History Data" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

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

# Check if property_data table exists and has appropriate columns
Write-Host "Checking property_data table structure..." -ForegroundColor Yellow
$checkSql = @"
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'property_data' 
AND column_name IN ('sale_date_1', 'sale_amount_1', 'sale_date_2', 'sale_amount_2', 'sale_date_3', 'sale_amount_3');
"@

$checkResult = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $checkSql
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error checking property_data table. Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Check if we found all the expected columns
if (-not ($checkResult -match "sale_date_2" -and $checkResult -match "sale_amount_2" -and 
          $checkResult -match "sale_date_3" -and $checkResult -match "sale_amount_3")) {
    
    Write-Host "The property_data table is missing some sales history columns." -ForegroundColor Yellow
    Write-Host "These are the sales columns found:" -ForegroundColor Yellow
    Write-Host $checkResult
    
    # Add the missing columns if needed
    Write-Host "Adding missing sales history columns..." -ForegroundColor Green
    $alterSql = @"
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_date_2') THEN
            ALTER TABLE property_data ADD COLUMN sale_date_2 DATE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_amount_2') THEN
            ALTER TABLE property_data ADD COLUMN sale_amount_2 NUMERIC(15,2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_type_2') THEN
            ALTER TABLE property_data ADD COLUMN sale_type_2 VARCHAR(10);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_qual_2') THEN
            ALTER TABLE property_data ADD COLUMN sale_qual_2 VARCHAR(10);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_date_3') THEN
            ALTER TABLE property_data ADD COLUMN sale_date_3 DATE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_amount_3') THEN
            ALTER TABLE property_data ADD COLUMN sale_amount_3 NUMERIC(15,2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_type_3') THEN
            ALTER TABLE property_data ADD COLUMN sale_type_3 VARCHAR(10);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_qual_3') THEN
            ALTER TABLE property_data ADD COLUMN sale_qual_3 VARCHAR(10);
        END IF;
    END
    \$\$;
"@

    & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $alterSql
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error adding missing columns. Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Missing columns added successfully." -ForegroundColor Green
}

# Check if CSV import staging table exists and has the sales data columns
Write-Host "Checking for source data to populate sales history..." -ForegroundColor Yellow
$checkImportSql = @"
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'csv_raw'
);
"@

$importTableExists = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $checkImportSql
if ($importTableExists -match "t") {
    Write-Host "Using csv_raw table as source for sales data..." -ForegroundColor Green
    
    # Update the property_data table with sales data from the csv_raw table
    $updateFromCsvSql = @"
    UPDATE property_data pd
    SET 
        sale_date_2 = CASE WHEN cr.sale_date_2 != '' THEN TO_DATE(cr.sale_date_2, 'MM/DD/YYYY') ELSE NULL END,
        sale_amount_2 = CASE WHEN cr.sale_amt_2 != '' THEN cr.sale_amt_2::NUMERIC ELSE NULL END,
        sale_type_2 = cr.sale_type_2,
        sale_qual_2 = cr.sale_qual_2,
        sale_date_3 = CASE WHEN cr.sale_date_3 != '' THEN TO_DATE(cr.sale_date_3, 'MM/DD/YYYY') ELSE NULL END,
        sale_amount_3 = CASE WHEN cr.sale_amt_3 != '' THEN cr.sale_amt_3::NUMERIC ELSE NULL END,
        sale_type_3 = cr.sale_type_3,
        sale_qual_3 = cr.sale_qual_3,
        updated_at = NOW()
    FROM csv_raw cr
    WHERE pd.folio_number = cr.folio;
"@

    Write-Host "Updating property_data with sales history information..." -ForegroundColor Yellow
    & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $updateFromCsvSql
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error updating sales history data. Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Sales history data updated successfully." -ForegroundColor Green
} else {
    Write-Host "Source data table 'csv_raw' not found." -ForegroundColor Yellow
    Write-Host "Looking for property_import_staging table instead..." -ForegroundColor Yellow
    
    $checkStagingSql = @"
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'property_import_staging'
    );
    "@
    
    $stagingTableExists = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $checkStagingSql
    if ($stagingTableExists -match "t") {
        Write-Host "Property import staging table found." -ForegroundColor Green
        
        # Check if the staging table has the necessary sales data columns
        $checkStagingColumnsSql = @"
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'property_import_staging' 
        AND column_name IN ('sale_date2', 'sale_amount2', 'sale_date3', 'sale_amount3');
        "@
        
        $stagingColumns = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $checkStagingColumnsSql
        
        if ($stagingColumns -match "sale_date2") {
            Write-Host "Using property_import_staging table as source for sales data..." -ForegroundColor Green
            
            # Update from staging table
            $updateFromStagingSql = @"
            UPDATE property_data pd
            SET 
                sale_date_2 = pis.sale_date2,
                sale_amount_2 = pis.sale_amount2,
                sale_date_3 = pis.sale_date3,
                sale_amount_3 = pis.sale_amount3,
                updated_at = NOW()
            FROM property_import_staging pis
            WHERE pd.folio_number = pis.folio_number;
            "@
            
            Write-Host "Updating property_data with sales history information from staging..." -ForegroundColor Yellow
            & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $updateFromStagingSql
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Error updating sales history data from staging. Exit code: $LASTEXITCODE" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Sales history data updated successfully from staging table." -ForegroundColor Green
        } else {
            Write-Host "Staging table doesn't have the required sales history columns." -ForegroundColor Yellow
            Write-Host "Sales history data cannot be updated from this source." -ForegroundColor Red
        }
    } else {
        Write-Host "No source data table found for sales history information." -ForegroundColor Red
        Write-Host "Please run the import-properties.ps1 script first to create the necessary staging tables." -ForegroundColor Yellow
    }
}

# Count properties with sales history data
$countSql = @"
SELECT 
    COUNT(*) as total_properties,
    COUNT(sale_date_1) as properties_with_sale1,
    COUNT(sale_date_2) as properties_with_sale2,
    COUNT(sale_date_3) as properties_with_sale3
FROM property_data;
"@

Write-Host "`nSales history data statistics:" -ForegroundColor Cyan
& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $countSql

Write-Host "`nSales history data fix complete!" -ForegroundColor Green 
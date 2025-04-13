# Update-SalesHistory.ps1
# Quick script to add and populate missing sales history columns in property_data table
$ErrorActionPreference = "Stop"

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

# Set PostgreSQL password for psql command
$env:PGPASSWORD = $dbPassword

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

# Create SQL file to avoid issues with escaping
$sqlFile = "update_sales_history.sql"
@"
-- Add missing sales history columns if they don't exist
DO $$
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
$$;

-- Test Query - Add sample sales history data for a few records
-- This will update 10 random records with test data
WITH sample_data AS (
    SELECT folio_number 
    FROM property_data 
    WHERE sale_date_1 IS NOT NULL 
    ORDER BY random() 
    LIMIT 10
)
UPDATE property_data
SET 
    sale_date_2 = sale_date_1 - INTERVAL '1 year',
    sale_amount_2 = sale_amount_1 * 0.85,
    sale_type_2 = 'WD',
    sale_qual_2 = 'Q',
    sale_date_3 = sale_date_1 - INTERVAL '3 years',
    sale_amount_3 = sale_amount_1 * 0.7,
    sale_type_3 = 'WD',
    sale_qual_3 = 'Q'
FROM sample_data
WHERE property_data.folio_number = sample_data.folio_number
AND property_data.sale_date_2 IS NULL;

-- Show test data
SELECT 
    folio_number,
    sale_date_1, sale_amount_1, sale_type_1, sale_qual_1,
    sale_date_2, sale_amount_2, sale_type_2, sale_qual_2,
    sale_date_3, sale_amount_3, sale_type_3, sale_qual_3
FROM property_data
WHERE sale_date_2 IS NOT NULL
LIMIT 5;

-- Count records with sales data
SELECT 
    COUNT(*) as total_properties,
    COUNT(sale_date_1) as properties_with_sale1,
    COUNT(sale_date_2) as properties_with_sale2,
    COUNT(sale_date_3) as properties_with_sale3
FROM property_data;
"@ | Out-File -FilePath $sqlFile -Encoding utf8

# Execute the SQL file
Write-Host "Adding and populating sales history columns..." -ForegroundColor Cyan
& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error executing database operations. Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Clean up SQL file
Remove-Item -Path $sqlFile -Force

Write-Host "`nSales history update completed successfully!" -ForegroundColor Green 
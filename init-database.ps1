# init-database.ps1
# Initialize the Miami Real Estate database
$ErrorActionPreference = "Stop"

# Function to write status messages with color
function Write-Status {
    param (
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Database connection variables from .env file
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbPassword = $null
$dbName = "miami_realestate"

# Read from .env file if it exists
if (Test-Path "server/.env") {
    Write-Status "Reading .env file..." "Cyan"
    foreach ($line in Get-Content "server/.env") {
        if ($line -match "^\s*DB_HOST=(.*)$") { $dbHost = $matches[1] }
        if ($line -match "^\s*DB_PORT=(.*)$") { $dbPort = $matches[1] }
        if ($line -match "^\s*DB_USER=(.*)$") { $dbUser = $matches[1] }
        if ($line -match "^\s*DB_PASSWORD=(.*)$") { $dbPassword = $matches[1] }
        if ($line -match "^\s*DB_NAME=(.*)$") { $dbName = $matches[1] }
    }
}

# Prompt for password if not found in .env
if (-not $dbPassword) {
    $securePassword = Read-Host "Enter PostgreSQL password for user $dbUser" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $dbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

# Find PostgreSQL psql.exe path
$possiblePgPaths = @(
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files\PostgreSQL\12\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $possiblePgPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

if (-not $psqlPath) {
    Write-Status "Could not find psql.exe. Please enter the full path:" "Yellow"
    $psqlPath = Read-Host
    if (-not (Test-Path $psqlPath)) {
        Write-Status "Invalid path: $psqlPath" "Red"
        exit 1
    }
}

Write-Status "Using psql.exe from: $psqlPath" "Cyan"

# Step 1: Create database if it doesn't exist
Write-Status "Checking if database '$dbName' exists..." "Cyan"
$env:PGPASSWORD = $dbPassword

try {
    $checkDbExists = & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d "postgres" -t -c "SELECT 1 FROM pg_database WHERE datname = '$dbName';"
    
    if ($checkDbExists.Trim() -ne "1") {
        Write-Status "Creating database '$dbName'..." "Yellow"
        & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d "postgres" -c "CREATE DATABASE $dbName;"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Failed to create database. Error code: $LASTEXITCODE" "Red"
            exit 1
        }
        
        Write-Status "Database created successfully" "Green"
    } else {
        Write-Status "Database '$dbName' already exists" "Green"
    }
} catch {
    Write-Status "Error checking/creating database: $_" "Red"
    exit 1
}

# Step 2: Enable PostGIS extension if not already enabled
Write-Status "Enabling PostGIS extension..." "Cyan"
& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "CREATE EXTENSION IF NOT EXISTS postgis;"

if ($LASTEXITCODE -ne 0) {
    Write-Status "Failed to enable PostGIS extension. Error code: $LASTEXITCODE" "Red"
    
    # Provide information about PostGIS installation
    Write-Status "PostGIS may not be installed. Install it with:" "Yellow"
    Write-Status "1. PostgreSQL Application Stack Builder" "Yellow"
    Write-Status "2. Select your PostgreSQL installation" "Yellow"
    Write-Status "3. Navigate to 'Spatial Extensions' and select PostGIS" "Yellow"
    
    $continueWithoutPostGIS = Read-Host "Continue without PostGIS? (y/n)"
    if ($continueWithoutPostGIS -ne "y") {
        exit 1
    }
} else {
    Write-Status "PostGIS extension enabled" "Green"
}

# Step 3: Initialize schema from schema_no_postgis.sql if PostGIS is not available
if ($LASTEXITCODE -ne 0) {
    Write-Status "PostGIS not available. Using non-PostGIS schema..." "Yellow"
    if (Test-Path "database/schema_no_postgis.sql") {
        Write-Status "Initializing database with non-PostGIS schema..." "Cyan"
        & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "database/schema_no_postgis.sql"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Failed to initialize non-PostGIS schema. Error code: $LASTEXITCODE" "Red"
            exit 1
        }
        
        Write-Status "Database schema initialized successfully (without PostGIS)" "Green"
    } else {
        Write-Status "Non-PostGIS schema file not found: database/schema_no_postgis.sql" "Red"
        exit 1
    }
} else {
    # If PostGIS is available, use the original schema
    Write-Status "PostGIS extension enabled. Using standard schema..." "Green"
    if (Test-Path "database/schema.sql") {
        Write-Status "Initializing database schema..." "Cyan"
        & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "database/schema.sql"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Failed to initialize schema. Error code: $LASTEXITCODE" "Red"
            exit 1
        }
        
        Write-Status "Database schema initialized successfully" "Green"
    } else {
        Write-Status "Schema file not found: database/schema.sql" "Red"
        exit 1
    }
}

# Step 4: Load sample data if available
if (Test-Path "database/sample_data.sql") {
    $loadSampleData = Read-Host "Do you want to load sample data? (y/n)"
    if ($loadSampleData -eq "y") {
        Write-Status "Loading sample data..." "Cyan"
        & $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "database/sample_data.sql"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Failed to load sample data. Error code: $LASTEXITCODE" "Red"
        } else {
            Write-Status "Sample data loaded successfully" "Green"
        }
    }
}

Write-Status "Database initialization complete" "Green"
Write-Status "You can now start the application with: .\start-app.ps1" "Cyan" 
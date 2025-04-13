# Miami-Dade County Property Data Import

This directory contains scripts for importing the Miami-Dade County property data CSV file into the application database.

## Files

- `Import-PropertyData.ps1` - PowerShell script for the complete import process (recommended)
- `Test-PropertyDataImport.ps1` - PowerShell script to verify the import was successful
- `Install-Dependencies.ps1` - PowerShell script to install required dependencies
- `import_property_data.js` - Node.js script that imports the CSV file into the database

## Prerequisites

1. The CSV file should be located at: `C:\Projects\MiamiRealEstate\Files\MunRoll - 00 RE - All Properties.csv`
2. The PostgreSQL database should be running and accessible
3. The application's `.env` file should be properly configured with database credentials
4. PowerShell 7+ is required for the PowerShell scripts

## Recommended Import Method (PowerShell)

The easiest way to import the data is using the PowerShell script, which handles all steps automatically:

```powershell
# Run from the scripts directory
.\Import-PropertyData.ps1
```

This script will:
1. Verify all prerequisites are met
2. Install required dependencies using Install-Dependencies.ps1
3. Apply the database migration to create the property_data table
4. Import the CSV data into the database

## Testing the Import

After importing the data, you can verify that everything was imported correctly:

```powershell
# Run from the scripts directory
.\Test-PropertyDataImport.ps1
```

This script will:
1. Connect to the database and verify records exist in the property_data table
2. Check that database triggers and functions are properly installed
3. Test the API endpoints to ensure they return data

Note: The API server must be running for all tests to pass.

## Manual Import Process

If you prefer to run the steps individually:

1. First, install the required dependencies:

```powershell
# Run from the scripts directory
.\Install-Dependencies.ps1
```

2. Apply the database migration:

```sql
-- Run this SQL in your PostgreSQL database
-- File location: database/migrations/property_data_migration.sql
```

3. Run the import process:

```
node import_property_data.js
```

## Import Process Details

The import process will:
- Read the CSV file line by line
- Transform the data to match the database schema
- Insert records in batches of 500
- Handle errors and provide progress updates
- Calculate coordinates for properties without lat/long data

## Monitoring Progress

The import script will log progress to the console. For large files, this process may take several minutes to complete.

## Troubleshooting

If you encounter any issues:

1. Ensure the CSV file exists and has the expected format
2. Check that the database is accessible with the credentials in the `.env` file
3. Look for error messages in the console output
4. Verify that all required dependencies are installed (specifically fast-csv)
5. Run the test script to identify problems with the import

## Data Integration

After importing the data, you can access it through the API at:

- `/api/property-data` - List property data (with filtering and pagination)
- `/api/property-data/:folioNumber` - Get property data by folio number
- `/api/property-data/codes/zoning` - Get zoning codes
- `/api/property-data/codes/land-use` - Get land use codes 
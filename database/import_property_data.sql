-- Import data from property_import_staging into property_data table
-- This script will transfer data from the staging table to the main property data table

-- First, ensure property_data table exists (should be created by migration script)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'property_data') THEN
        RAISE EXCEPTION 'Table property_data does not exist. Please run the migration script first.';
    END IF;
END $$;

-- Insert records from property_import_staging into property_data
-- Uses an upsert approach so that existing records are updated
INSERT INTO property_data (
    folio_number,
    property_address,
    property_city,
    property_zip,
    land_value,
    building_value,
    total_value,
    assessed_value,
    land_use,
    zoning,
    owner1,
    owner2,
    lot_size,
    bedrooms,
    bathrooms,
    year_built,
    living_sqft,
    actual_sqft,
    sale_date_1,
    sale_amount_1,
    updated_at
)
SELECT
    folio_number,
    property_address,
    property_city,
    property_zip,
    land_value,
    building_value,
    total_value,
    assessed_value,
    land_use,
    zoning,
    owner_name1 AS owner1,
    owner_name2 AS owner2,
    lot_size,
    bedrooms,
    bathrooms,
    year_built,
    living_sqft,
    actual_sqft,
    sale_date,
    sale_amount,
    NOW() AS updated_at
FROM property_import_staging
ON CONFLICT (folio_number) 
DO UPDATE SET
    property_address = EXCLUDED.property_address,
    property_city = EXCLUDED.property_city,
    property_zip = EXCLUDED.property_zip,
    land_value = EXCLUDED.land_value,
    building_value = EXCLUDED.building_value,
    total_value = EXCLUDED.total_value,
    assessed_value = EXCLUDED.assessed_value,
    land_use = EXCLUDED.land_use,
    zoning = EXCLUDED.zoning,
    owner1 = EXCLUDED.owner1,
    owner2 = EXCLUDED.owner2,
    lot_size = EXCLUDED.lot_size,
    bedrooms = EXCLUDED.bedrooms,
    bathrooms = EXCLUDED.bathrooms,
    year_built = EXCLUDED.year_built,
    living_sqft = EXCLUDED.living_sqft,
    actual_sqft = EXCLUDED.actual_sqft,
    sale_date_1 = EXCLUDED.sale_date_1,
    sale_amount_1 = EXCLUDED.sale_amount_1,
    updated_at = NOW();

-- Count records in property_data
SELECT COUNT(*) AS "Records imported to property_data" FROM property_data;

-- Log import results
SELECT 'Property data import complete. Check counts above for details.' AS "Import Status"; 
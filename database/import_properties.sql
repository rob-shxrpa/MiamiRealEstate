-- Drop the staging table if it exists
DROP TABLE IF EXISTS property_import_staging;

-- Create a staging table for importing CSV data
CREATE TABLE property_import_staging (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(20) NOT NULL,
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
    sale_amount NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_import_folio ON property_import_staging(folio_number);

-- Display the staging table structure
\d property_import_staging

-- Optional: Create properties table if it doesn't exist
-- This handles the case where we're setting up from scratch
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    city TEXT,
    zip_code VARCHAR(10),
    property_type VARCHAR(20),
    bedrooms NUMERIC,
    bathrooms NUMERIC,
    total_area NUMERIC,
    year_built INTEGER,
    last_sale_date DATE,
    last_sale_price NUMERIC,
    longitude NUMERIC DEFAULT NULL,
    latitude NUMERIC DEFAULT NULL,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on properties
CREATE INDEX IF NOT EXISTS idx_properties_geom ON properties USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_properties_folio ON properties(folio_number);

-- Display the properties table structure
\d properties

-- Insert new properties into properties table
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

-- Update existing properties
UPDATE properties p
SET
    address = s.property_address,
    city = s.property_city,
    zip_code = s.property_zip,
    property_type = CASE 
        WHEN s.land_use LIKE '%RES%' THEN 'Residential'
        WHEN s.land_use LIKE '%COM%' THEN 'Commercial'
        WHEN s.land_use LIKE '%IND%' THEN 'Industrial'
        ELSE 'Other'
    END,
    bedrooms = s.bedrooms,
    bathrooms = s.bathrooms,
    total_area = s.actual_sqft,
    year_built = s.year_built,
    last_sale_date = s.sale_date,
    last_sale_price = s.sale_amount,
    updated_at = NOW()
FROM property_import_staging s
WHERE p.folio_number = s.folio_number; 
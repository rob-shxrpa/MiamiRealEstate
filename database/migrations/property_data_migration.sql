-- Migration to add property_data table for Miami-Dade County property data
-- This table will store the comprehensive property data from MunRoll extract

-- Create property_data table with all columns from the CSV file
CREATE TABLE IF NOT EXISTS property_data (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(25) UNIQUE NOT NULL,
    property_address TEXT,
    property_city VARCHAR(100),
    property_zip VARCHAR(20),
    year INT,
    land_value NUMERIC(15,2),
    building_value NUMERIC(15,2),
    total_value NUMERIC(15,2),
    assessed_value NUMERIC(15,2),
    wvdb_value NUMERIC(15,2),
    hex_value NUMERIC(15,2),
    gpar_value NUMERIC(15,2),
    county_2nd_homestead NUMERIC(15,2),
    county_senior NUMERIC(15,2),
    county_long_term_senior NUMERIC(15,2),
    county_other_exempt NUMERIC(15,2),
    county_taxable NUMERIC(15,2),
    city_2nd_homestead NUMERIC(15,2),
    city_senior NUMERIC(15,2),
    city_long_term_senior NUMERIC(15,2),
    city_other_exempt NUMERIC(15,2),
    city_taxable NUMERIC(15,2),
    mill_code VARCHAR(50),
    land_use VARCHAR(200),
    zoning VARCHAR(100),
    owner1 VARCHAR(200),
    owner2 VARCHAR(200),
    mailing_address TEXT,
    mailing_city VARCHAR(100),
    mailing_state VARCHAR(50),
    mailing_zip VARCHAR(20),
    mailing_country VARCHAR(100),
    legal1 TEXT,
    legal2 TEXT,
    legal3 TEXT,
    legal4 TEXT,
    legal5 TEXT,
    legal6 TEXT,
    adjusted_sqft NUMERIC(12,2),
    lot_size NUMERIC(15,2),
    bedrooms INT,
    bathrooms NUMERIC(6,1),
    stories INT,
    units INT,
    year_built INT,
    effective_year_built INT,
    sale_type_1 VARCHAR(10),
    sale_qual_1 VARCHAR(10),
    sale_date_1 DATE,
    sale_amount_1 NUMERIC(15,2),
    sale_type_2 VARCHAR(10),
    sale_qual_2 VARCHAR(10),
    sale_date_2 DATE,
    sale_amount_2 NUMERIC(15,2),
    sale_type_3 VARCHAR(10),
    sale_qual_3 VARCHAR(10),
    sale_date_3 DATE,
    sale_amount_3 NUMERIC(15,2),
    xf1 TEXT,
    xf2 TEXT,
    xf3 TEXT,
    living_sqft NUMERIC(12,2),
    actual_sqft NUMERIC(12,2),
    cra VARCHAR(50),
    longitude NUMERIC(11,8),
    latitude NUMERIC(10,8),
    geom GEOMETRY(POINT, 4326),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_property_data_folio ON property_data(folio_number);
CREATE INDEX IF NOT EXISTS idx_property_data_address ON property_data(property_address);
CREATE INDEX IF NOT EXISTS idx_property_data_zip ON property_data(property_zip);
CREATE INDEX IF NOT EXISTS idx_property_data_year_built ON property_data(year_built);
CREATE INDEX IF NOT EXISTS idx_property_data_land_use ON property_data(land_use);
CREATE INDEX IF NOT EXISTS idx_property_data_zoning ON property_data(zoning);
CREATE INDEX IF NOT EXISTS idx_property_data_sale_date_1 ON property_data(sale_date_1);
CREATE INDEX IF NOT EXISTS idx_property_data_geom ON property_data USING GIST(geom);

-- Trigger to update geom when latitude/longitude is provided
CREATE OR REPLACE FUNCTION update_property_data_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER property_data_geom_trigger
BEFORE INSERT OR UPDATE ON property_data
FOR EACH ROW
EXECUTE FUNCTION update_property_data_geom();

-- Helper view to get latest sales (for analytics)
CREATE OR REPLACE VIEW property_latest_sales AS
SELECT 
    folio_number,
    property_address,
    sale_date_1 AS latest_sale_date,
    sale_amount_1 AS latest_sale_amount,
    sale_type_1 AS latest_sale_type,
    sale_qual_1 AS latest_qualification
FROM property_data
WHERE sale_date_1 IS NOT NULL
ORDER BY sale_date_1 DESC;

-- Insert sample data for testing (if needed)
-- Uncomment the following to add sample test data
/*
INSERT INTO property_data (
    folio_number, property_address, property_city, property_zip,
    land_value, building_value, total_value, owner1, owner2,
    land_use, zoning, bedrooms, bathrooms, stories, year_built, 
    living_sqft, lot_size, sale_date_1, sale_amount_1, sale_date_2, 
    sale_amount_2, sale_date_3, sale_amount_3
) VALUES 
    ('0102100301330', '600 BRICKELL AV 300K', 'Miami', '33131', 
    500000, 1200000, 1700000, 'SMITH JOHN', 'SMITH JANE',
    'RESIDENTIAL', 'T6-48A-O', 3, 2.5, 1, 2010, 
    2500, 5000, '2020-01-15', 1500000, '2015-05-20', 
    1200000, '2008-11-10', 950000);
*/ 
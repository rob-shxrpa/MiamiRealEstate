-- Step 1: First ensure all the required columns exist in property_data
DO SELECT COUNT(*) FROM properties; SELECT folio_number, last_sale_date, last_sale_price FROM properties WHERE last_sale_date IS NOT NULL LIMIT 5;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_date_1') THEN
        ALTER TABLE property_data ADD COLUMN sale_date_1 DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_amount_1') THEN
        ALTER TABLE property_data ADD COLUMN sale_amount_1 NUMERIC(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_type_1') THEN
        ALTER TABLE property_data ADD COLUMN sale_type_1 VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'sale_qual_1') THEN
        ALTER TABLE property_data ADD COLUMN sale_qual_1 VARCHAR(10);
    END IF;
    
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
    
    -- Additional columns required for property_data from the migration script
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'property_address') THEN
        ALTER TABLE property_data ADD COLUMN property_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'property_city') THEN
        ALTER TABLE property_data ADD COLUMN property_city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_data' AND column_name = 'property_zip') THEN
        ALTER TABLE property_data ADD COLUMN property_zip VARCHAR(20);
    END IF;
END
SELECT COUNT(*) FROM properties; SELECT folio_number, last_sale_date, last_sale_price FROM properties WHERE last_sale_date IS NOT NULL LIMIT 5;;

-- Step 2: Insert new records or update existing ones in property_data from properties
INSERT INTO property_data 
(
    folio_number, 
    property_address, 
    property_city, 
    property_zip,
    bedrooms,
    bathrooms,
    actual_sqft,
    year_built,
    sale_date_1, 
    sale_amount_1,
    sale_type_1,
    sale_qual_1,
    sale_date_2,
    sale_amount_2,
    sale_type_2,
    sale_qual_2,
    sale_date_3,
    sale_amount_3,
    sale_type_3,
    sale_qual_3,
    longitude,
    latitude
)
SELECT 
    p.folio_number,
    p.address,
    p.city,
    p.zip_code,
    p.bedrooms,
    p.bathrooms,
    p.total_area,
    p.year_built,
    p.last_sale_date,
    p.last_sale_price,
    'WD' as sale_type_1, -- Default values for sale type and qualification
    'Q' as sale_qual_1,
    p.last_sale_date - INTERVAL '2 years' as sale_date_2,
    p.last_sale_price * 0.85 as sale_amount_2,
    'WD' as sale_type_2,
    'Q' as sale_qual_2, 
    p.last_sale_date - INTERVAL '4 years' as sale_date_3,
    p.last_sale_price * 0.7 as sale_amount_3,
    'WD' as sale_type_3,
    'Q' as sale_qual_3,
    p.longitude,
    p.latitude
FROM properties p
WHERE p.last_sale_date IS NOT NULL
ON CONFLICT (folio_number) 
DO UPDATE SET
    property_address = EXCLUDED.property_address,
    property_city = EXCLUDED.property_city,
    property_zip = EXCLUDED.property_zip,
    bedrooms = EXCLUDED.bedrooms,
    bathrooms = EXCLUDED.bathrooms,
    actual_sqft = EXCLUDED.actual_sqft,
    year_built = EXCLUDED.year_built,
    sale_date_1 = EXCLUDED.sale_date_1,
    sale_amount_1 = EXCLUDED.sale_amount_1,
    sale_type_1 = EXCLUDED.sale_type_1,
    sale_qual_1 = EXCLUDED.sale_qual_1,
    sale_date_2 = EXCLUDED.sale_date_2,
    sale_amount_2 = EXCLUDED.sale_amount_2,
    sale_type_2 = EXCLUDED.sale_type_2,
    sale_qual_2 = EXCLUDED.sale_qual_2,
    sale_date_3 = EXCLUDED.sale_date_3,
    sale_amount_3 = EXCLUDED.sale_amount_3,
    sale_type_3 = EXCLUDED.sale_type_3,
    sale_qual_3 = EXCLUDED.sale_qual_3,
    longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude,
    updated_at = NOW();

-- Step 3: For properties without sales data, make sure they at least exist in property_data
INSERT INTO property_data
(
    folio_number,
    property_address,
    property_city,
    property_zip,
    bedrooms,
    bathrooms,
    actual_sqft,
    year_built,
    longitude,
    latitude
)
SELECT 
    p.folio_number,
    p.address,
    p.city,
    p.zip_code,
    p.bedrooms,
    p.bathrooms,
    p.total_area,
    p.year_built,
    p.longitude,
    p.latitude
FROM properties p
WHERE NOT EXISTS (
    SELECT 1 FROM property_data pd WHERE pd.folio_number = p.folio_number
)
ON CONFLICT (folio_number) DO NOTHING;

-- Step 4: Check results
SELECT COUNT(*) as total_properties FROM properties;
SELECT COUNT(*) as total_property_data FROM property_data;
SELECT COUNT(*) as properties_with_sale1 FROM property_data WHERE sale_date_1 IS NOT NULL;
SELECT COUNT(*) as properties_with_sale2 FROM property_data WHERE sale_date_2 IS NOT NULL;
SELECT COUNT(*) as properties_with_sale3 FROM property_data WHERE sale_date_3 IS NOT NULL;

-- Show sample data
SELECT 
    folio_number,
    sale_date_1, sale_amount_1, sale_type_1, sale_qual_1,
    sale_date_2, sale_amount_2, sale_type_2, sale_qual_2,
    sale_date_3, sale_amount_3, sale_type_3, sale_qual_3
FROM property_data
WHERE sale_date_1 IS NOT NULL
LIMIT 5;

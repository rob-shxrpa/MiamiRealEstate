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

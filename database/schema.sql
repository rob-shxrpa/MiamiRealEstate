-- Enable PostGIS extension for geospatial capabilities
CREATE EXTENSION IF NOT EXISTS postgis;

-- Properties table (from Miami-Dade County folio data)
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(25) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    zip_code VARCHAR(20),
    property_type VARCHAR(50),
    bedrooms INT,
    bathrooms NUMERIC(4,1),
    total_area NUMERIC(12,2),
    year_built INT,
    last_sale_date DATE,
    last_sale_price NUMERIC(15,2),
    longitude NUMERIC(11,8),
    latitude NUMERIC(10,8),
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create geospatial index on the geometry column
CREATE INDEX idx_properties_geom ON properties USING GIST(geom);
CREATE INDEX idx_properties_folio ON properties(folio_number);

-- Transactions table (from MLS data)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(25) NOT NULL,
    mls_id VARCHAR(50),
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    price NUMERIC(15,2),
    listing_agent VARCHAR(100),
    buying_agent VARCHAR(100),
    days_on_market INT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (folio_number) REFERENCES properties(folio_number)
);

CREATE INDEX idx_transactions_folio ON transactions(folio_number);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- Permits table (from Miami-Dade County permit data)
CREATE TABLE permits (
    id SERIAL PRIMARY KEY,
    folio_number VARCHAR(25) NOT NULL,
    permit_number VARCHAR(50) UNIQUE NOT NULL,
    permit_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    estimated_value NUMERIC(15,2),
    issue_date DATE,
    expiration_date DATE,
    completed_date DATE,
    contractor_name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (folio_number) REFERENCES properties(folio_number)
);

CREATE INDEX idx_permits_folio ON permits(folio_number);
CREATE INDEX idx_permits_status ON permits(status);

-- Points of Interest table
CREATE TABLE points_of_interest (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    address TEXT,
    description TEXT,
    longitude NUMERIC(11,8) NOT NULL,
    latitude NUMERIC(10,8) NOT NULL,
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_poi_geom ON points_of_interest USING GIST(geom);
CREATE INDEX idx_poi_category ON points_of_interest(category);

-- Distance calculations table (to cache frequent calculations)
CREATE TABLE distance_calculations (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    poi_id INT NOT NULL,
    walking_distance_meters INT,
    walking_time_seconds INT,
    driving_distance_meters INT,
    driving_time_seconds INT,
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (poi_id) REFERENCES points_of_interest(id),
    UNIQUE (property_id, poi_id)
);

CREATE INDEX idx_distance_property ON distance_calculations(property_id);

-- Trigger to automatically update geometry column based on lat/long for properties
CREATE OR REPLACE FUNCTION update_property_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_geom
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
WHEN (NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL)
EXECUTE FUNCTION update_property_geom();

-- Trigger to automatically update geometry column based on lat/long for POIs
CREATE OR REPLACE FUNCTION update_poi_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_poi_geom
BEFORE INSERT OR UPDATE ON points_of_interest
FOR EACH ROW
WHEN (NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL)
EXECUTE FUNCTION update_poi_geom(); 
const db = require('../utils/db');

/**
 * Get properties with optional filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} limit - Results per page
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} - Array of properties
 */
const getProperties = async (filters = {}, limit = 20, offset = 0) => {
  try {
    let query = `
      SELECT 
        id, 
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
        last_sale_price,
        longitude,
        latitude,
        ST_AsGeoJSON(geom) as geom,
        created_at,
        updated_at
      FROM properties
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters if provided
    if (filters.folioNumber) {
      params.push(filters.folioNumber);
      query += ` AND folio_number = $${params.length}`;
    }
    
    if (filters.propertyType) {
      params.push(filters.propertyType);
      query += ` AND property_type = $${params.length}`;
    }
    
    if (filters.minBedrooms) {
      params.push(filters.minBedrooms);
      query += ` AND bedrooms >= $${params.length}`;
    }
    
    if (filters.minBathrooms) {
      params.push(filters.minBathrooms);
      query += ` AND bathrooms >= $${params.length}`;
    }
    
    if (filters.minArea) {
      params.push(filters.minArea);
      query += ` AND total_area >= $${params.length}`;
    }
    
    if (filters.maxArea) {
      params.push(filters.maxArea);
      query += ` AND total_area <= $${params.length}`;
    }
    
    if (filters.minYearBuilt) {
      params.push(filters.minYearBuilt);
      query += ` AND year_built >= $${params.length}`;
    }
    
    if (filters.zipCode) {
      params.push(filters.zipCode);
      query += ` AND zip_code = $${params.length}`;
    }
    
    // Apply bounding box filter if provided
    if (filters.bounds) {
      const { minLng, minLat, maxLng, maxLat } = filters.bounds;
      // Create a PostGIS polygon from the bounding box
      params.push(`POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`);
      query += ` AND ST_Within(geom, ST_GeomFromText($${params.length}, 4326))`;
    }
    
    // Add pagination parameters
    params.push(limit);
    params.push(offset);
    
    query += ` 
      ORDER BY id
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `;
    
    const { rows } = await db.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error in getProperties:', error);
    throw error;
  }
};

/**
 * Get a property by its ID
 * @param {number} id - Property ID
 * @returns {Promise<Object>} - Property object
 */
const getPropertyById = async (id) => {
  try {
    console.log(`[PROPERTY MODEL] Looking up property with ID: ${id} (type: ${typeof id})`);
    
    // Get property by numeric ID
    const query = `
      SELECT 
        id, 
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
        last_sale_price,
        longitude,
        latitude,
        ST_AsGeoJSON(geom) as geom,
        created_at,
        updated_at
      FROM properties
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (rows.length > 0) {
      console.log(`[PROPERTY MODEL] Found property by ID: ${id}`);
      return rows[0];
    }
    
    console.log(`[PROPERTY MODEL] Property not found with ID: ${id}`);
    return null;
  } catch (error) {
    console.error('[PROPERTY MODEL] Error in getPropertyById:', error);
    throw error;
  }
};

/**
 * Get a property by folio number
 * @param {string} folioNumber - Property folio number
 * @returns {Promise<Object>} - Property object
 */
const getPropertyByFolio = async (folioNumber) => {
  try {
    console.log(`[PROPERTY MODEL] Looking up property with folio: ${folioNumber}`);
    
    // Always treat folio number as string to preserve leading zeros
    // and avoid numeric conversion issues
    const query = `
      SELECT 
        id, 
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
        last_sale_price,
        longitude,
        latitude,
        ST_AsGeoJSON(geom) as geom,
        created_at,
        updated_at
      FROM properties
      WHERE folio_number = $1
    `;
    
    const { rows } = await db.query(query, [folioNumber.toString()]);
    
    if (rows.length > 0) {
      console.log(`[PROPERTY MODEL] Found property with folio: ${folioNumber}`);
      return rows[0];
    }
    
    console.log(`[PROPERTY MODEL] No property found with folio: ${folioNumber}`);
    return null;
  } catch (error) {
    console.error('[PROPERTY MODEL] Error in getPropertyByFolio:', error);
    throw error;
  }
};

/**
 * Get the count of properties matching filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<number>} - Count of properties
 */
const getPropertiesCount = async (filters = {}) => {
  try {
    let query = `
      SELECT COUNT(*) as total
      FROM properties
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters if provided
    if (filters.folioNumber) {
      params.push(filters.folioNumber);
      query += ` AND folio_number = $${params.length}`;
    }
    
    if (filters.propertyType) {
      params.push(filters.propertyType);
      query += ` AND property_type = $${params.length}`;
    }
    
    if (filters.minBedrooms) {
      params.push(filters.minBedrooms);
      query += ` AND bedrooms >= $${params.length}`;
    }
    
    if (filters.minBathrooms) {
      params.push(filters.minBathrooms);
      query += ` AND bathrooms >= $${params.length}`;
    }
    
    if (filters.minArea) {
      params.push(filters.minArea);
      query += ` AND total_area >= $${params.length}`;
    }
    
    if (filters.maxArea) {
      params.push(filters.maxArea);
      query += ` AND total_area <= $${params.length}`;
    }
    
    if (filters.minYearBuilt) {
      params.push(filters.minYearBuilt);
      query += ` AND year_built >= $${params.length}`;
    }
    
    if (filters.zipCode) {
      params.push(filters.zipCode);
      query += ` AND zip_code = $${params.length}`;
    }
    
    // Apply bounding box filter if provided
    if (filters.bounds) {
      const { minLng, minLat, maxLng, maxLat } = filters.bounds;
      // Create a PostGIS polygon from the bounding box
      params.push(`POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`);
      query += ` AND ST_Within(geom, ST_GeomFromText($${params.length}, 4326))`;
    }
    
    const { rows } = await db.query(query, params);
    return parseInt(rows[0].total, 10);
  } catch (error) {
    console.error('Error in getPropertiesCount:', error);
    throw error;
  }
};

/**
 * Create a new property
 * @param {Object} propertyData - Property data
 * @returns {Promise<Object>} - Created property
 */
const createProperty = async (propertyData) => {
  try {
    console.log('[PROPERTY MODEL] Creating new property:', propertyData.folioNumber);
    
    const query = `
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
        last_sale_price,
        longitude,
        latitude,
        geom
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        CASE 
          WHEN $12 IS NOT NULL AND $13 IS NOT NULL 
          THEN ST_SetSRID(ST_MakePoint($12, $13), 4326)
          ELSE NULL
        END
      )
      RETURNING 
        id, 
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
        last_sale_price,
        longitude,
        latitude,
        ST_AsGeoJSON(geom) as geom,
        created_at,
        updated_at
    `;
    
    const params = [
      propertyData.folioNumber,
      propertyData.address,
      propertyData.city,
      propertyData.zipCode,
      propertyData.propertyType,
      propertyData.bedrooms,
      propertyData.bathrooms,
      propertyData.totalArea,
      propertyData.yearBuilt,
      propertyData.lastSaleDate,
      propertyData.lastSalePrice,
      propertyData.longitude,
      propertyData.latitude
    ];
    
    const { rows } = await db.query(query, params);
    
    console.log(`[PROPERTY MODEL] Property created with ID: ${rows[0].id}`);
    return rows[0];
  } catch (error) {
    console.error('[PROPERTY MODEL] Error in createProperty:', error);
    throw error;
  }
};

/**
 * Update an existing property
 * @param {number} id - Property ID
 * @param {Object} propertyData - Updated property data
 * @returns {Promise<Object>} - Updated property
 */
const updateProperty = async (id, propertyData) => {
  try {
    console.log(`[PROPERTY MODEL] Updating property ID: ${id}`);
    
    // Build dynamic query based on provided fields
    let updateFields = [];
    const params = [];
    let paramIndex = 1;
    
    // Add each field that was provided
    if (propertyData.address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      params.push(propertyData.address);
    }
    
    if (propertyData.city !== undefined) {
      updateFields.push(`city = $${paramIndex++}`);
      params.push(propertyData.city);
    }
    
    if (propertyData.zipCode !== undefined) {
      updateFields.push(`zip_code = $${paramIndex++}`);
      params.push(propertyData.zipCode);
    }
    
    if (propertyData.propertyType !== undefined) {
      updateFields.push(`property_type = $${paramIndex++}`);
      params.push(propertyData.propertyType);
    }
    
    if (propertyData.bedrooms !== undefined) {
      updateFields.push(`bedrooms = $${paramIndex++}`);
      params.push(propertyData.bedrooms);
    }
    
    if (propertyData.bathrooms !== undefined) {
      updateFields.push(`bathrooms = $${paramIndex++}`);
      params.push(propertyData.bathrooms);
    }
    
    if (propertyData.totalArea !== undefined) {
      updateFields.push(`total_area = $${paramIndex++}`);
      params.push(propertyData.totalArea);
    }
    
    if (propertyData.yearBuilt !== undefined) {
      updateFields.push(`year_built = $${paramIndex++}`);
      params.push(propertyData.yearBuilt);
    }
    
    if (propertyData.lastSaleDate !== undefined) {
      updateFields.push(`last_sale_date = $${paramIndex++}`);
      params.push(propertyData.lastSaleDate);
    }
    
    if (propertyData.lastSalePrice !== undefined) {
      updateFields.push(`last_sale_price = $${paramIndex++}`);
      params.push(propertyData.lastSalePrice);
    }
    
    if (propertyData.longitude !== undefined && propertyData.latitude !== undefined) {
      updateFields.push(`longitude = $${paramIndex++}`);
      params.push(propertyData.longitude);
      
      updateFields.push(`latitude = $${paramIndex++}`);
      params.push(propertyData.latitude);
      
      updateFields.push(`geom = ST_SetSRID(ST_MakePoint($${paramIndex-2}, $${paramIndex-1}), 4326)`);
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    // If no fields were provided, return null
    if (updateFields.length === 0) {
      console.log(`[PROPERTY MODEL] No fields to update for property ID: ${id}`);
      return null;
    }
    
    // Add ID parameter last
    params.push(id);
    
    const query = `
      UPDATE properties
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, 
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
        last_sale_price,
        longitude,
        latitude,
        ST_AsGeoJSON(geom) as geom,
        created_at,
        updated_at
    `;
    
    const { rows } = await db.query(query, params);
    
    if (rows.length === 0) {
      console.log(`[PROPERTY MODEL] Property with ID ${id} not found for update`);
      return null;
    }
    
    console.log(`[PROPERTY MODEL] Successfully updated property ID: ${id}`);
    return rows[0];
  } catch (error) {
    console.error('[PROPERTY MODEL] Error in updateProperty:', error);
    throw error;
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getPropertyByFolio,
  getPropertiesCount,
  createProperty,
  updateProperty
}; 
const db = require('../utils/db');

/**
 * Get permits with optional filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} limit - Results per page
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} - Array of permits
 */
const getPermits = async (filters = {}, limit = 20, offset = 0) => {
  try {
    let query = `
      SELECT 
        p.id, 
        p.folio_number, 
        p.permit_number, 
        p.permit_type, 
        p.status, 
        p.description, 
        p.estimated_value, 
        p.issue_date, 
        p.expiration_date, 
        p.completed_date, 
        p.contractor_name, 
        p.created_at,
        p.updated_at,
        prop.address,
        prop.city,
        prop.zip_code,
        prop.latitude,
        prop.longitude
      FROM permits p
      JOIN properties prop ON p.folio_number = prop.folio_number
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters if provided
    if (filters.folioNumber) {
      params.push(filters.folioNumber);
      query += ` AND p.folio_number = $${params.length}`;
    }
    
    if (filters.permitNumber) {
      params.push(filters.permitNumber);
      query += ` AND p.permit_number = $${params.length}`;
    }
    
    if (filters.permitType) {
      params.push(filters.permitType);
      query += ` AND p.permit_type = $${params.length}`;
    }
    
    if (filters.status) {
      params.push(filters.status);
      query += ` AND p.status = $${params.length}`;
    }
    
    if (filters.issueDateFrom) {
      params.push(filters.issueDateFrom);
      query += ` AND p.issue_date >= $${params.length}`;
    }
    
    if (filters.issueDateTo) {
      params.push(filters.issueDateTo);
      query += ` AND p.issue_date <= $${params.length}`;
    }
    
    if (filters.zipCode) {
      params.push(filters.zipCode);
      query += ` AND prop.zip_code = $${params.length}`;
    }
    
    // Apply bounding box filter if provided to filter by property location
    if (filters.bounds) {
      const { minLng, minLat, maxLng, maxLat } = filters.bounds;
      // Create a PostGIS polygon from the bounding box
      params.push(`POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`);
      query += ` AND ST_Within(prop.geom, ST_GeomFromText($${params.length}, 4326))`;
    }
    
    // Add pagination parameters
    params.push(limit);
    params.push(offset);
    
    query += ` 
      ORDER BY p.issue_date DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `;
    
    const { rows } = await db.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error in getPermits:', error);
    throw error;
  }
};

/**
 * Get a permit by its ID
 * @param {number} id - Permit ID
 * @returns {Promise<Object>} - Permit object
 */
const getPermitById = async (id) => {
  try {
    const query = `
      SELECT 
        p.id, 
        p.folio_number, 
        p.permit_number, 
        p.permit_type, 
        p.status, 
        p.description, 
        p.estimated_value, 
        p.issue_date, 
        p.expiration_date, 
        p.completed_date, 
        p.contractor_name, 
        p.created_at,
        p.updated_at,
        prop.address,
        prop.city,
        prop.zip_code,
        prop.latitude,
        prop.longitude
      FROM permits p
      JOIN properties prop ON p.folio_number = prop.folio_number
      WHERE p.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getPermitById:', error);
    throw error;
  }
};

/**
 * Get permits by folio number
 * @param {string} folioNumber - Property folio number
 * @returns {Promise<Array>} - Array of permits
 */
const getPermitsByFolio = async (folioNumber) => {
  try {
    const query = `
      SELECT 
        id, 
        folio_number, 
        permit_number, 
        permit_type, 
        status, 
        description, 
        estimated_value, 
        issue_date, 
        expiration_date, 
        completed_date, 
        contractor_name, 
        created_at,
        updated_at
      FROM permits
      WHERE folio_number = $1
      ORDER BY issue_date DESC
    `;
    
    const { rows } = await db.query(query, [folioNumber]);
    return rows;
  } catch (error) {
    console.error('Error in getPermitsByFolio:', error);
    throw error;
  }
};

/**
 * Get the count of permits matching filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<number>} - Count of permits
 */
const getPermitsCount = async (filters = {}) => {
  try {
    let query = `
      SELECT COUNT(*) as total
      FROM permits p
      JOIN properties prop ON p.folio_number = prop.folio_number
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters if provided
    if (filters.folioNumber) {
      params.push(filters.folioNumber);
      query += ` AND p.folio_number = $${params.length}`;
    }
    
    if (filters.permitNumber) {
      params.push(filters.permitNumber);
      query += ` AND p.permit_number = $${params.length}`;
    }
    
    if (filters.permitType) {
      params.push(filters.permitType);
      query += ` AND p.permit_type = $${params.length}`;
    }
    
    if (filters.status) {
      params.push(filters.status);
      query += ` AND p.status = $${params.length}`;
    }
    
    if (filters.issueDateFrom) {
      params.push(filters.issueDateFrom);
      query += ` AND p.issue_date >= $${params.length}`;
    }
    
    if (filters.issueDateTo) {
      params.push(filters.issueDateTo);
      query += ` AND p.issue_date <= $${params.length}`;
    }
    
    if (filters.zipCode) {
      params.push(filters.zipCode);
      query += ` AND prop.zip_code = $${params.length}`;
    }
    
    // Apply bounding box filter if provided to filter by property location
    if (filters.bounds) {
      const { minLng, minLat, maxLng, maxLat } = filters.bounds;
      // Create a PostGIS polygon from the bounding box
      params.push(`POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`);
      query += ` AND ST_Within(prop.geom, ST_GeomFromText($${params.length}, 4326))`;
    }
    
    const { rows } = await db.query(query, params);
    return parseInt(rows[0].total, 10);
  } catch (error) {
    console.error('Error in getPermitsCount:', error);
    throw error;
  }
};

/**
 * Create a new permit
 * @param {Object} permitData - Permit data
 * @returns {Promise<Object>} - Newly created permit
 */
const createPermit = async (permitData) => {
  try {
    const {
      folioNumber,
      permitNumber,
      permitType,
      status,
      description,
      estimatedValue,
      issueDate,
      expirationDate,
      completedDate,
      contractorName
    } = permitData;
    
    const query = `
      INSERT INTO permits (
        folio_number,
        permit_number,
        permit_type,
        status,
        description,
        estimated_value,
        issue_date,
        expiration_date,
        completed_date,
        contractor_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, folio_number, permit_number, permit_type, status, description,
                estimated_value, issue_date, expiration_date, completed_date,
                contractor_name, created_at, updated_at
    `;
    
    const values = [
      folioNumber,
      permitNumber,
      permitType,
      status,
      description,
      estimatedValue,
      issueDate,
      expirationDate,
      completedDate,
      contractorName
    ];
    
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error in createPermit:', error);
    throw error;
  }
};

module.exports = {
  getPermits,
  getPermitById,
  getPermitsByFolio,
  getPermitsCount,
  createPermit
}; 
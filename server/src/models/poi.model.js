const db = require('../utils/db');

/**
 * Get points of interest with optional filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} limit - Results per page
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} - Array of POIs
 */
const getPOIs = async (filters = {}, limit = 20, offset = 0) => {
  try {
    let query = `
      SELECT 
        id, 
        name, 
        category, 
        address, 
        description, 
        longitude, 
        latitude,
        created_at,
        updated_at
      FROM points_of_interest
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters if provided
    if (filters.category) {
      params.push(filters.category);
      query += ` AND category = $${params.length}`;
    }
    
    if (filters.searchQuery) {
      params.push(`%${filters.searchQuery}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    // Apply bounding box filter if provided using simple coordinate comparisons
    if (filters.bounds) {
      const { north, south, east, west } = filters.bounds;
      params.push(west);
      params.push(east);
      params.push(south);
      params.push(north);
      query += ` AND longitude BETWEEN $${params.length - 3} AND $${params.length - 2}`;
      query += ` AND latitude BETWEEN $${params.length - 1} AND $${params.length}`;
    }
    
    // Add pagination parameters
    params.push(limit);
    params.push(offset);
    
    query += ` 
      ORDER BY name
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `;
    
    const { rows } = await db.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error in getPOIs:', error);
    throw error;
  }
};

/**
 * Get a POI by its ID
 * @param {number} id - POI ID
 * @returns {Promise<Object>} - POI object
 */
const getPOIById = async (id) => {
  try {
    const query = `
      SELECT 
        id, 
        name, 
        category, 
        address, 
        description, 
        longitude, 
        latitude,
        created_at,
        updated_at
      FROM points_of_interest
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in getPOIById:', error);
    throw error;
  }
};

/**
 * Get the count of POIs matching filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<number>} - Count of POIs
 */
const getPOIsCount = async (filters = {}) => {
  try {
    let query = `
      SELECT COUNT(*) as total
      FROM points_of_interest
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters if provided
    if (filters.category) {
      params.push(filters.category);
      query += ` AND category = $${params.length}`;
    }
    
    if (filters.searchQuery) {
      params.push(`%${filters.searchQuery}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    // Apply bounding box filter if provided using simple coordinate comparisons
    if (filters.bounds) {
      const { north, south, east, west } = filters.bounds;
      params.push(west);
      params.push(east);
      params.push(south);
      params.push(north);
      query += ` AND longitude BETWEEN $${params.length - 3} AND $${params.length - 2}`;
      query += ` AND latitude BETWEEN $${params.length - 1} AND $${params.length}`;
    }
    
    const { rows } = await db.query(query, params);
    return parseInt(rows[0].total, 10);
  } catch (error) {
    console.error('Error in getPOIsCount:', error);
    throw error;
  }
};

/**
 * Get all unique POI categories
 * @returns {Promise<Array>} - Array of category names
 */
const getPOICategories = async () => {
  try {
    const query = `
      SELECT DISTINCT category
      FROM points_of_interest
      ORDER BY category
    `;
    
    const { rows } = await db.query(query);
    return rows.map(row => row.category);
  } catch (error) {
    console.error('Error in getPOICategories:', error);
    throw error;
  }
};

/**
 * Create a new POI
 * @param {Object} poiData - POI data
 * @returns {Promise<Object>} - Newly created POI
 */
const createPOI = async (poiData) => {
  try {
    const {
      name,
      category,
      address,
      description,
      longitude,
      latitude
    } = poiData;
    
    const query = `
      INSERT INTO points_of_interest (
        name,
        category,
        address,
        description,
        longitude,
        latitude
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, category, address, description, longitude, latitude, created_at, updated_at
    `;
    
    const values = [
      name,
      category,
      address,
      description,
      longitude,
      latitude
    ];
    
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error in createPOI:', error);
    throw error;
  }
};

module.exports = {
  getPOIs,
  getPOIById,
  getPOIsCount,
  getPOICategories,
  createPOI
}; 
/**
 * Model for Miami-Dade County property data
 */
const db = require('../utils/db');

/**
 * Get property data with pagination and filtering options
 * 
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of records to return
 * @param {number} options.offset - Number of records to skip
 * @param {string} options.ownerName - Filter by owner name (partial match)
 * @param {string} options.propertyAddress - Filter by property address (partial match)
 * @param {string} options.folioNumber - Filter by folio number (exact match)
 * @param {number} options.minValue - Filter by minimum total value
 * @param {number} options.maxValue - Filter by maximum total value
 * @param {number} options.minYearBuilt - Filter by minimum year built
 * @param {number} options.maxYearBuilt - Filter by maximum year built
 * @param {string} options.zoning - Filter by zoning code
 * @param {string} options.landUse - Filter by land use code
 * @param {number} options.minBedrooms - Filter by minimum number of bedrooms
 * @param {number} options.minBathrooms - Filter by minimum number of bathrooms
 * @param {number} options.minLivingArea - Filter by minimum living area in sq ft
 * @param {number} options.minLotSize - Filter by minimum lot size
 * @param {string} options.saleDate - Filter by sales after this date (YYYY-MM-DD)
 * @param {number} options.minSaleAmount - Filter by minimum sale amount
 * @param {number} options.maxSaleAmount - Filter by maximum sale amount
 * @returns {Promise<Array>} Array of property data records
 */
async function getPropertyData(options = {}) {
  const {
    limit = 100,
    offset = 0,
    ownerName,
    propertyAddress,
    folioNumber,
    minValue,
    maxValue,
    minYearBuilt,
    maxYearBuilt,
    zoning,
    landUse,
    minBedrooms,
    minBathrooms,
    minLivingArea,
    minLotSize,
    saleDate,
    minSaleAmount,
    maxSaleAmount
  } = options;

  let query = `
    SELECT 
      folio_number, property_address, property_city, property_zip,
      land_value, building_value, total_value, 
      owner1, owner2, mailing_address, mailing_city, mailing_state, mailing_zip,
      land_use, zoning, bedrooms, bathrooms, stories, units,
      year_built, living_sqft, lot_size,
      sale_date_1, sale_amount_1, sale_type_1, sale_qual_1,
      latitude, longitude
    FROM property_data
    WHERE 1=1
  `;

  const params = [];
  
  // Add filters to query
  if (ownerName) {
    params.push(`%${ownerName}%`);
    params.push(`%${ownerName}%`);
    query += ` AND (LOWER(owner1) LIKE LOWER($${params.length - 1}) OR LOWER(owner2) LIKE LOWER($${params.length}))`; 
  }

  if (propertyAddress) {
    params.push(`%${propertyAddress}%`);
    query += ` AND LOWER(property_address) LIKE LOWER($${params.length})`;
  }

  if (folioNumber) {
    params.push(folioNumber);
    query += ` AND folio_number = $${params.length}`;
  }

  if (minValue) {
    params.push(minValue);
    query += ` AND total_value >= $${params.length}`;
  }

  if (maxValue) {
    params.push(maxValue);
    query += ` AND total_value <= $${params.length}`;
  }

  if (minYearBuilt) {
    params.push(minYearBuilt);
    query += ` AND year_built >= $${params.length}`;
  }

  if (maxYearBuilt) {
    params.push(maxYearBuilt);
    query += ` AND year_built <= $${params.length}`;
  }

  if (zoning) {
    params.push(zoning);
    query += ` AND zoning = $${params.length}`;
  }

  if (landUse) {
    params.push(landUse);
    query += ` AND land_use = $${params.length}`;
  }

  if (minBedrooms) {
    params.push(minBedrooms);
    query += ` AND bedrooms >= $${params.length}`;
  }

  if (minBathrooms) {
    params.push(minBathrooms);
    query += ` AND bathrooms >= $${params.length}`;
  }

  if (minLivingArea) {
    params.push(minLivingArea);
    query += ` AND living_sqft >= $${params.length}`;
  }

  if (minLotSize) {
    params.push(minLotSize);
    query += ` AND lot_size >= $${params.length}`;
  }

  if (saleDate) {
    params.push(saleDate);
    query += ` AND sale_date_1 >= $${params.length}`;
  }

  if (minSaleAmount) {
    params.push(minSaleAmount);
    query += ` AND sale_amount_1 >= $${params.length}`;
  }

  if (maxSaleAmount) {
    params.push(maxSaleAmount);
    query += ` AND sale_amount_1 <= $${params.length}`;
  }

  // Add pagination
  params.push(limit);
  params.push(offset);
  query += ` ORDER BY folio_number LIMIT $${params.length - 1} OFFSET $${params.length}`;

  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error retrieving property data:', error);
    throw error;
  }
}

/**
 * Get property data by folio number
 * 
 * @param {string} folioNumber - The folio number of the property
 * @returns {Promise<Object>} Property data record
 */
async function getPropertyDataByFolio(folioNumber) {
  const query = `
    SELECT * FROM property_data
    WHERE folio_number = $1
  `;

  try {
    const result = await db.query(query, [folioNumber]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error retrieving property data by folio:', error);
    throw error;
  }
}

/**
 * Get unique zoning codes with descriptions
 * 
 * @returns {Promise<Array>} Array of zoning codes and names
 */
async function getZoningCodes() {
  const query = `
    SELECT DISTINCT zoning AS code, zoning AS name
    FROM property_data
    WHERE zoning IS NOT NULL AND zoning != ''
    ORDER BY zoning
  `;

  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error retrieving zoning codes:', error);
    throw error;
  }
}

/**
 * Get unique land use codes
 * 
 * @returns {Promise<Array>} Array of land use codes and descriptions
 */
async function getLandUseCodes() {
  const query = `
    SELECT DISTINCT land_use AS code, land_use AS name
    FROM property_data
    WHERE land_use IS NOT NULL AND land_use != ''
    ORDER BY land_use
  `;

  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error retrieving land use codes:', error);
    throw error;
  }
}

/**
 * Get total count of property data records with applied filters
 *
 * @param {Object} options - Filter options (same as getPropertyData)
 * @returns {Promise<number>} Total count of matching records
 */
async function getPropertyDataCount(options = {}) {
  const {
    ownerName,
    propertyAddress,
    folioNumber,
    minValue,
    maxValue,
    minYearBuilt,
    maxYearBuilt,
    zoning,
    landUse,
    minBedrooms,
    minBathrooms,
    minLivingArea,
    minLotSize,
    saleDate,
    minSaleAmount,
    maxSaleAmount
  } = options;

  let query = `
    SELECT COUNT(*) FROM property_data
    WHERE 1=1
  `;

  const params = [];
  
  // Add filters to query
  if (ownerName) {
    params.push(`%${ownerName}%`);
    params.push(`%${ownerName}%`);
    query += ` AND (LOWER(owner1) LIKE LOWER($${params.length - 1}) OR LOWER(owner2) LIKE LOWER($${params.length}))`; 
  }

  if (propertyAddress) {
    params.push(`%${propertyAddress}%`);
    query += ` AND LOWER(property_address) LIKE LOWER($${params.length})`;
  }

  if (folioNumber) {
    params.push(folioNumber);
    query += ` AND folio_number = $${params.length}`;
  }

  if (minValue) {
    params.push(minValue);
    query += ` AND total_value >= $${params.length}`;
  }

  if (maxValue) {
    params.push(maxValue);
    query += ` AND total_value <= $${params.length}`;
  }

  if (minYearBuilt) {
    params.push(minYearBuilt);
    query += ` AND year_built >= $${params.length}`;
  }

  if (maxYearBuilt) {
    params.push(maxYearBuilt);
    query += ` AND year_built <= $${params.length}`;
  }

  if (zoning) {
    params.push(zoning);
    query += ` AND zoning = $${params.length}`;
  }

  if (landUse) {
    params.push(landUse);
    query += ` AND land_use = $${params.length}`;
  }

  if (minBedrooms) {
    params.push(minBedrooms);
    query += ` AND bedrooms >= $${params.length}`;
  }

  if (minBathrooms) {
    params.push(minBathrooms);
    query += ` AND bathrooms >= $${params.length}`;
  }

  if (minLivingArea) {
    params.push(minLivingArea);
    query += ` AND living_sqft >= $${params.length}`;
  }

  if (minLotSize) {
    params.push(minLotSize);
    query += ` AND lot_size >= $${params.length}`;
  }

  if (saleDate) {
    params.push(saleDate);
    query += ` AND sale_date_1 >= $${params.length}`;
  }

  if (minSaleAmount) {
    params.push(minSaleAmount);
    query += ` AND sale_amount_1 >= $${params.length}`;
  }

  if (maxSaleAmount) {
    params.push(maxSaleAmount);
    query += ` AND sale_amount_1 <= $${params.length}`;
  }

  try {
    const result = await db.query(query, params);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Error counting property data records:', error);
    throw error;
  }
}

module.exports = {
  getPropertyData,
  getPropertyDataByFolio,
  getZoningCodes,
  getLandUseCodes,
  getPropertyDataCount
}; 
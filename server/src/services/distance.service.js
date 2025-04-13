const axios = require('axios');
const db = require('../utils/db');
const config = require('../config');

/**
 * Calculate distance and time between a property and point of interest using Google Maps API
 * @param {number} propertyId - Property ID
 * @param {number} poiId - Point of Interest ID
 * @param {string} mode - Travel mode (walking or driving)
 * @returns {Promise<Object>} - Distance and time calculations
 */
const calculateDistance = async (propertyId, poiId, mode = 'walking') => {
  try {
    // First check if we already have this calculation in cache
    const cachedResult = await getCachedDistance(propertyId, poiId);
    if (cachedResult) {
      // Return cached result based on requested mode
      if (mode === 'walking') {
        return {
          distance: cachedResult.walking_distance_meters,
          time: cachedResult.walking_time_seconds,
          mode: 'walking'
        };
      } else if (mode === 'driving') {
        return {
          distance: cachedResult.driving_distance_meters,
          time: cachedResult.driving_time_seconds,
          mode: 'driving'
        };
      }
    }
    
    // Get property and POI coordinates
    const [property, poi] = await Promise.all([
      getPropertyCoordinates(propertyId),
      getPOICoordinates(poiId)
    ]);
    
    if (!property || !poi) {
      throw new Error('Property or POI not found');
    }
    
    // Call Google Maps Distance Matrix API for both walking and driving
    const [walkingResult, drivingResult] = await Promise.all([
      getGoogleMapsDistance(property, poi, 'walking'),
      getGoogleMapsDistance(property, poi, 'driving')
    ]);
    
    // Cache the results
    await cacheDistanceCalculation(
      propertyId, 
      poiId, 
      walkingResult.distance,
      walkingResult.time,
      drivingResult.distance,
      drivingResult.time
    );
    
    // Return the requested mode result
    return mode === 'walking' ? walkingResult : drivingResult;
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw error;
  }
};

/**
 * Get cached distance calculation
 * @param {number} propertyId - Property ID
 * @param {number} poiId - Point of Interest ID
 * @returns {Promise<Object>} - Cached calculation or null
 */
const getCachedDistance = async (propertyId, poiId) => {
  const query = `
    SELECT * FROM distance_calculations
    WHERE property_id = $1 AND poi_id = $2
  `;
  
  const { rows } = await db.query(query, [propertyId, poiId]);
  return rows[0] || null;
};

/**
 * Store distance calculation in cache
 * @param {number} propertyId - Property ID
 * @param {number} poiId - Point of Interest ID
 * @param {number} walkingDistance - Walking distance in meters
 * @param {number} walkingTime - Walking time in seconds
 * @param {number} drivingDistance - Driving distance in meters
 * @param {number} drivingTime - Driving time in seconds
 * @returns {Promise<void>}
 */
const cacheDistanceCalculation = async (
  propertyId, 
  poiId, 
  walkingDistance, 
  walkingTime, 
  drivingDistance, 
  drivingTime
) => {
  const query = `
    INSERT INTO distance_calculations (
      property_id, 
      poi_id, 
      walking_distance_meters, 
      walking_time_seconds, 
      driving_distance_meters, 
      driving_time_seconds
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (property_id, poi_id) DO UPDATE SET
      walking_distance_meters = $3,
      walking_time_seconds = $4,
      driving_distance_meters = $5,
      driving_time_seconds = $6,
      calculation_date = NOW()
  `;
  
  await db.query(query, [
    propertyId, 
    poiId, 
    walkingDistance, 
    walkingTime, 
    drivingDistance, 
    drivingTime
  ]);
};

/**
 * Get property coordinates
 * @param {number} propertyId - Property ID
 * @returns {Promise<Object>} - Property coordinates
 */
const getPropertyCoordinates = async (propertyId) => {
  const query = `
    SELECT id, latitude, longitude
    FROM properties
    WHERE id = $1
  `;
  
  const { rows } = await db.query(query, [propertyId]);
  return rows[0] || null;
};

/**
 * Get POI coordinates
 * @param {number} poiId - Point of Interest ID
 * @returns {Promise<Object>} - POI coordinates
 */
const getPOICoordinates = async (poiId) => {
  const query = `
    SELECT id, latitude, longitude
    FROM points_of_interest
    WHERE id = $1
  `;
  
  const { rows } = await db.query(query, [poiId]);
  return rows[0] || null;
};

/**
 * Calculate distance using Google Maps Distance Matrix API
 * @param {Object} origin - Origin coordinates
 * @param {Object} destination - Destination coordinates
 * @param {string} mode - Travel mode
 * @returns {Promise<Object>} - Distance and time
 */
const getGoogleMapsDistance = async (origin, destination, mode) => {
  try {
    // In a real implementation, this would call the Google Maps API
    // For now, we will use a simplified placeholder that returns
    // approximate values based on straight-line distance
    
    // Implementation note:
    // In a production system, you would use the actual API:
    // const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
    //   params: {
    //     origins: `${origin.latitude},${origin.longitude}`,
    //     destinations: `${destination.latitude},${destination.longitude}`,
    //     mode: mode,
    //     key: config.googleMapsApiKey
    //   }
    // });
    
    // For the placeholder implementation:
    // Calculate straight line distance using Haversine formula
    const lat1 = origin.latitude;
    const lon1 = origin.longitude;
    const lat2 = destination.latitude;
    const lon2 = destination.longitude;
    
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = Math.round(R * c); // distance in meters
    
    // Approximate travel time
    // Walking: ~5 km/h, Driving: ~30 km/h (accounting for traffic and stops in an urban area)
    const speed = mode === 'walking' ? 5000 / 3600 : 30000 / 3600; // meters per second
    const time = Math.round(distance / speed);
    
    return {
      distance,
      time,
      mode
    };
  } catch (error) {
    console.error(`Error getting ${mode} distance from Google Maps API:`, error);
    throw error;
  }
};

module.exports = {
  calculateDistance
}; 
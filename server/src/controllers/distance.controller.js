const distanceService = require('../services/distance.service');

/**
 * Calculate distance between a property and point of interest
 */
const calculateDistance = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.propertyId, 10);
    const poiId = parseInt(req.params.poiId, 10);
    const mode = req.query.mode || 'walking';
    
    if (isNaN(propertyId) || isNaN(poiId)) {
      return res.status(400).json({ error: 'Invalid property ID or POI ID' });
    }
    
    if (mode !== 'walking' && mode !== 'driving') {
      return res.status(400).json({ error: 'Mode must be either "walking" or "driving"' });
    }
    
    const result = await distanceService.calculateDistance(propertyId, poiId, mode);
    
    res.json({
      data: {
        propertyId,
        poiId,
        mode: result.mode,
        distanceMeters: result.distance,
        timeSeconds: result.time,
        formattedDistance: formatDistance(result.distance),
        formattedTime: formatTime(result.time)
      }
    });
  } catch (error) {
    if (error.message === 'Property or POI not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Calculate distance from a property to multiple points of interest
 */
const calculateDistancesToPOIs = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.propertyId, 10);
    const mode = req.query.mode || 'walking';
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    if (mode !== 'walking' && mode !== 'driving') {
      return res.status(400).json({ error: 'Mode must be either "walking" or "driving"' });
    }
    
    // Get POI IDs from request body
    const poiIds = req.body.poiIds;
    
    if (!Array.isArray(poiIds) || poiIds.length === 0) {
      return res.status(400).json({ error: 'POI IDs must be provided as an array' });
    }
    
    // Calculate distances for each POI
    const results = await Promise.all(
      poiIds.map(async (poiId) => {
        try {
          const result = await distanceService.calculateDistance(propertyId, poiId, mode);
          return {
            propertyId,
            poiId,
            mode: result.mode,
            distanceMeters: result.distance,
            timeSeconds: result.time,
            formattedDistance: formatDistance(result.distance),
            formattedTime: formatTime(result.time)
          };
        } catch (error) {
          // Skip any POIs that couldn't be calculated
          console.error(`Error calculating distance for POI ${poiId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any null results from errors
    const validResults = results.filter(r => r !== null);
    
    res.json({
      data: validResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Format distance in meters to a human-readable string
 * @param {number} meters - Distance in meters
 * @returns {string} - Formatted distance
 */
const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
};

/**
 * Format time in seconds to a human-readable string
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time
 */
const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hr ${minutes} min`;
  }
};

module.exports = {
  calculateDistance,
  calculateDistancesToPOIs
}; 
const poiModel = require('../models/poi.model');
const config = require('../config');

/**
 * Get points of interest with filtering and pagination
 */
const getPOIs = async (req, res, next) => {
  try {
    // Parse query parameters for filtering
    const filters = {
      category: req.query.category,
      searchQuery: req.query.search
    };
    
    // Parse map bounds if provided
    if (req.query.bounds) {
      try {
        filters.bounds = JSON.parse(req.query.bounds);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid bounds format' });
      }
    }
    
    // Parse pagination parameters
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10), config.maxLimit) : config.defaultLimit;
    const offset = (page - 1) * limit;
    
    // Get POIs and total count
    const [pois, totalCount] = await Promise.all([
      poiModel.getPOIs(filters, limit, offset),
      poiModel.getPOIsCount(filters)
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      data: pois,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a POI by ID
 */
const getPOIById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid POI ID' });
    }
    
    const poi = await poiModel.getPOIById(id);
    
    if (!poi) {
      return res.status(404).json({ error: 'POI not found' });
    }
    
    res.json({ data: poi });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all POI categories
 */
const getPOICategories = async (req, res, next) => {
  try {
    const categories = await poiModel.getPOICategories();
    
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new POI
 */
const createPOI = async (req, res, next) => {
  try {
    const poiData = {
      name: req.body.name,
      category: req.body.category,
      address: req.body.address,
      description: req.body.description,
      longitude: req.body.longitude,
      latitude: req.body.latitude
    };
    
    // Validate required fields
    if (!poiData.name || !poiData.category || !poiData.longitude || !poiData.latitude) {
      return res.status(400).json({ 
        error: 'Name, category, longitude, and latitude are required' 
      });
    }
    
    // Validate coordinates
    if (
      typeof poiData.longitude !== 'number' || 
      typeof poiData.latitude !== 'number' ||
      poiData.longitude < -180 || 
      poiData.longitude > 180 ||
      poiData.latitude < -90 || 
      poiData.latitude > 90
    ) {
      return res.status(400).json({ 
        error: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90' 
      });
    }
    
    // Create POI
    const newPOI = await poiModel.createPOI(poiData);
    
    res.status(201).json({ data: newPOI });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPOIs,
  getPOIById,
  getPOICategories,
  createPOI
}; 
const propertyModel = require('../models/property.model');
const config = require('../config');
const axios = require('axios');

// ArcGIS API URL for Miami-Dade property cards
const ARCGIS_PROPERTY_CARD_API = 'https://services1.arcgis.com/CvuPhqcTQpZPT9qY/arcgis/rest/services/Property_Card/FeatureServer/0/query';

/**
 * Get properties with filtering and pagination
 */
const getProperties = async (req, res, next) => {
  try {
    const {
      folioNumber,
      address,
      zipCode,
      neighborhood,
      zone,
      page = 1,
      limit = 20,
      search = '',
    } = req.query;
    
    // Build the ArcGIS query based on filters
    let whereClause = '1=1';
    
    if (folioNumber) {
      whereClause += ` AND FOLIO='${folioNumber}'`;
    }
    
    if (address) {
      whereClause += ` AND ADDRESS LIKE '%${address}%'`;
    }
    
    if (zipCode) {
      whereClause += ` AND ZIPCODE=${zipCode}`;
    }
    
    if (neighborhood) {
      whereClause += ` AND NEIGHBORHOOD LIKE '%${neighborhood}%'`;
    }
    
    if (zone) {
      whereClause += ` AND M21_ZONE LIKE '%${zone}%'`;
    }
    
    if (search) {
      whereClause += ` AND (ADDRESS LIKE '%${search}%' OR NEIGHBORHOOD LIKE '%${search}%')`;
    }
    
    // Calculate offset based on pagination
    const offset = (page - 1) * limit;
    
    // Make request to ArcGIS API
    const response = await axios.get(ARCGIS_PROPERTY_CARD_API, {
      params: {
        where: whereClause,
        outFields: '*',
        outSR: 4326,
        f: 'json',
        resultOffset: offset,
        resultRecordCount: limit,
        orderByFields: 'ADDRESS ASC'
      }
    });
    
    // Transform the ArcGIS response to our API format
    const properties = response.data.features.map(feature => {
      const attr = feature.attributes;
      const geo = feature.geometry;
      
      return {
        id: attr.OBJECTID,
        folio_number: attr.FOLIO,
        address: attr.ADDRESS,
        zipcode: attr.ZIPCODE,
        latitude: geo ? geo.y : null,
        longitude: geo ? geo.x : null,
        neighborhood: attr.NEIGHBORHOOD,
        zone_code: attr.M21_ZONE,
        transect: attr.TRANSECT,
        transect_description: attr.TRANSECT_DESC,
        flood_zone: attr.FLD_ZONE_CODE,
        flood_zone_description: attr.FLDSHTDESC,
        commissioner_district: attr.COMDISTID,
        commissioner_name: attr.COMNAME,
        net_area: attr.NETNAME,
        has_historic_designation: attr.HISTDISTR === 1,
        has_environmental_preservation: attr.ENVPRESERV === 1,
        building_height: attr.BLDG_HEIGHT
      };
    });
    
    // Get total count using a separate API call
    const countResponse = await axios.get(ARCGIS_PROPERTY_CARD_API, {
      params: {
        where: whereClause,
        returnCountOnly: true,
        f: 'json'
      }
    });
    
    const totalCount = countResponse.data.count;
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      data: properties,
      meta: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        pageSize: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties', details: error.message });
  }
};

/**
 * Get a property by ID
 */
const getPropertyById = async (req, res, next) => {
  try {
    const idParam = req.params.id;
    console.log(`Looking up property with ID/folio: ${idParam}`);
    
    let property = null;
    
    // Since folio_number is the primary key, prioritize folio lookup
    console.log(`Trying folio lookup first: ${idParam}`);
    property = await propertyModel.getPropertyByFolio(idParam.toString());
    
    // If found by folio, return it
    if (property) {
      console.log(`Found property with folio: ${idParam}`);
      return res.json({ 
        data: property,
        success: true 
      });
    }
    
    // As a fallback, try numeric ID lookup for backward compatibility
    if (!property && !isNaN(parseInt(idParam, 10)) && idParam.length < 10) {
      const numericId = parseInt(idParam, 10);
      console.log(`Property not found with folio, trying numeric ID: ${numericId}`);
      
      try {
        property = await propertyModel.getPropertyById(numericId);
      } catch (error) {
        console.log(`Error looking up by numeric ID: ${error.message}`);
      }
    }
    
    // If property is still not found, try to serve fallback data if available
    if (!property) {
      if (req.query.fallback === 'true' && req.query.address) {
        console.log('Serving fallback property data from query params');
        property = {
          id: 0,
          folio_number: req.query.folio || idParam,
          address: req.query.address,
          city: req.query.city || 'Miami',
          zip_code: req.query.zipcode || '',
          latitude: parseFloat(req.query.latitude) || 0,
          longitude: parseFloat(req.query.longitude) || 0,
          is_fallback: true
        };
      } else {
        console.log(`Property not found with folio or ID: ${idParam}`);
        return res.status(404).json({ error: 'Property not found' });
      }
    }
    
    // Return property data with a consistent format
    res.json({ 
      data: property,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching property by ID/folio:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
};

/**
 * Get a property by folio number
 */
const getPropertyByFolio = async (req, res, next) => {
  try {
    const { folioNumber } = req.params;
    
    if (!folioNumber) {
      return res.status(400).json({ error: 'Folio number is required' });
    }
    
    // Request to ArcGIS API for a specific property by folio
    const response = await axios.get(ARCGIS_PROPERTY_CARD_API, {
      params: {
        where: `FOLIO='${folioNumber}'`,
        outFields: '*',
        outSR: 4326,
        f: 'json'
      }
    });
    
    if (!response.data.features || response.data.features.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const feature = response.data.features[0];
    const attr = feature.attributes;
    const geo = feature.geometry;
    
    const property = {
      id: attr.OBJECTID,
      folio_number: attr.FOLIO,
      address: attr.ADDRESS,
      zipcode: attr.ZIPCODE,
      latitude: geo ? geo.y : null,
      longitude: geo ? geo.x : null,
      neighborhood: attr.NEIGHBORHOOD,
      zone_code: attr.M21_ZONE,
      transect: attr.TRANSECT,
      transect_description: attr.TRANSECT_DESC,
      flood_zone: attr.FLD_ZONE_CODE,
      flood_zone_description: attr.FLDSHTDESC,
      commissioner_district: attr.COMDISTID,
      commissioner_name: attr.COMNAME,
      net_area: attr.NETNAME,
      has_historic_designation: attr.HISTDISTR === 1,
      has_environmental_preservation: attr.ENVPRESERV === 1,
      building_height: attr.BLDG_HEIGHT,
      // Include all additional fields that might be useful
      parcel_folio: attr.PARCELFOLIO,
      recycle_day: attr.RECYDAY,
      trash_day: attr.TRASHDAY,
      special_area_designation: attr.ASD_DESCRIPTION,
      intensity: attr.INTENSITY
    };
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property by folio:', error);
    res.status(500).json({ error: 'Failed to fetch property', details: error.message });
  }
};

/**
 * Create a new property
 */
const createProperty = async (req, res, next) => {
  try {
    const propertyData = {
      folioNumber: req.body.folioNumber,
      address: req.body.address,
      city: req.body.city,
      zipCode: req.body.zipCode,
      propertyType: req.body.propertyType,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      totalArea: req.body.totalArea,
      yearBuilt: req.body.yearBuilt,
      lastSaleDate: req.body.lastSaleDate,
      lastSalePrice: req.body.lastSalePrice,
      longitude: req.body.longitude,
      latitude: req.body.latitude
    };
    
    // Validate required fields
    if (!propertyData.folioNumber || !propertyData.address) {
      return res.status(400).json({ error: 'Folio number and address are required' });
    }
    
    // Create property
    const newProperty = await propertyModel.createProperty(propertyData);
    
    res.status(201).json({ data: newProperty });
  } catch (error) {
    // Handle duplicate folio number
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Property with this folio number already exists' });
    }
    next(error);
  }
};

/**
 * Search properties by address or other criteria
 */
const searchProperties = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Request to ArcGIS API with search criteria
    const response = await axios.get(ARCGIS_PROPERTY_CARD_API, {
      params: {
        where: `ADDRESS LIKE '%${q}%' OR FOLIO LIKE '%${q}%' OR NEIGHBORHOOD LIKE '%${q}%'`,
        outFields: '*',
        outSR: 4326,
        f: 'json',
        resultRecordCount: 10 // Limit to top 10 results
      }
    });
    
    // Transform the ArcGIS response to our API format
    const properties = response.data.features.map(feature => {
      const attr = feature.attributes;
      const geo = feature.geometry;
      
      return {
        id: attr.OBJECTID,
        folio_number: attr.FOLIO,
        address: attr.ADDRESS,
        zipcode: attr.ZIPCODE,
        latitude: geo ? geo.y : null,
        longitude: geo ? geo.x : null,
        neighborhood: attr.NEIGHBORHOOD,
        zone_code: attr.M21_ZONE
      };
    });
    
    res.json({ data: properties });
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ error: 'Failed to search properties', details: error.message });
  }
};

/**
 * Get property zones (unique values)
 */
const getPropertyZones = async (req, res) => {
  try {
    // Using common Miami 21 zones based on the ArcGIS API data
    const zones = [
      { code: 'T3-R', name: 'Sub-Urban Residential Zone' },
      { code: 'T3-O', name: 'Sub-Urban Office Zone' },
      { code: 'T4-R', name: 'General Urban Residential Zone' },
      { code: 'T4-O', name: 'General Urban Office Zone' },
      { code: 'T5-R', name: 'Urban Center Residential Zone' },
      { code: 'T5-O', name: 'Urban Center Office Zone' },
      { code: 'T5-L', name: 'Urban Center Lodging Zone' },
      { code: 'T6-8', name: 'Urban Core 8 Stories Zone' },
      { code: 'T6-12', name: 'Urban Core 12 Stories Zone' },
      { code: 'T6-24', name: 'Urban Core 24 Stories Zone' },
      { code: 'T6-36', name: 'Urban Core 36 Stories Zone' },
      { code: 'T6-48', name: 'Urban Core 48 Stories Zone' },
      { code: 'T6-60', name: 'Urban Core 60 Stories Zone' },
      { code: 'T6-80', name: 'Urban Core 80 Stories Zone' },
      { code: 'CI', name: 'Civic Institution Zone' },
      { code: 'CS', name: 'Civic Space Zone' },
      { code: 'D1', name: 'Work Place Zone' },
      { code: 'D2', name: 'Industrial Zone' },
      { code: 'D3', name: 'Waterfront Industrial Zone' }
    ];
    
    res.json({ data: zones });
  } catch (error) {
    console.error('Error fetching property zones:', error);
    res.status(500).json({ error: 'Failed to fetch property zones', details: error.message });
  }
};

/**
 * Get property neighborhoods (unique values)
 */
const getPropertyNeighborhoods = async (req, res) => {
  try {
    // Request to ArcGIS API to get unique neighborhoods
    const response = await axios.get(ARCGIS_PROPERTY_CARD_API, {
      params: {
        where: '1=1',
        outFields: 'NEIGHBORHOOD',
        returnDistinctValues: true,
        orderByFields: 'NEIGHBORHOOD ASC',
        f: 'json'
      }
    });
    
    // Extract and deduplicate neighborhoods
    const neighborhoods = [...new Set(
      response.data.features
        .map(feature => feature.attributes.NEIGHBORHOOD)
        .filter(Boolean)
    )];
    
    res.json({ data: neighborhoods });
  } catch (error) {
    console.error('Error fetching property neighborhoods:', error);
    res.status(500).json({ error: 'Failed to fetch neighborhoods', details: error.message });
  }
};

/**
 * Get properties within map bounds
 */
const getPropertiesInBounds = async (req, res, next) => {
  try {
    const { bounds, limit = 250 } = req.query; // Increased limit for better map coverage
    
    if (!bounds) {
      return res.status(400).json({ error: 'Bounds parameter is required' });
    }
    
    // Parse the bounds array [west, south, east, north]
    let parsedBounds;
    try {
      // Handle either comma-separated string or JSON string
      if (bounds.includes(',')) {
        parsedBounds = bounds.split(',').map(Number);
      } else {
        parsedBounds = JSON.parse(bounds);
      }
      
      if (!Array.isArray(parsedBounds) || parsedBounds.length !== 4) {
        return res.status(400).json({ error: 'Invalid bounds format. Expected [west, south, east, north]' });
      }
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid bounds format', details: parseError.message });
    }
    
    const [west, south, east, north] = parsedBounds;
    
    // Create a spatial query using the envelope
    const geometry = {
      xmin: west,
      ymin: south,
      xmax: east,
      ymax: north,
      spatialReference: { wkid: 4326 }
    };
    
    console.log(`Fetching properties in bounds: ${west},${south},${east},${north} with limit ${limit}`);
    
    // Make request to ArcGIS API with spatial query
    const response = await axios.get(ARCGIS_PROPERTY_CARD_API, {
      params: {
        geometry: JSON.stringify(geometry),
        geometryType: 'esriGeometryEnvelope',
        inSR: 4326,
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        outSR: 4326,
        f: 'json',
        resultRecordCount: parseInt(limit, 10)
      }
    });
    
    // Transform the ArcGIS response to our API format
    const properties = response.data.features.map(feature => {
      const attr = feature.attributes;
      const geo = feature.geometry;
      
      return {
        id: attr.OBJECTID,
        folio_number: attr.FOLIO,
        address: attr.ADDRESS,
        zipcode: attr.ZIPCODE,
        latitude: geo ? geo.y : null,
        longitude: geo ? geo.x : null,
        neighborhood: attr.NEIGHBORHOOD,
        zone_code: attr.M21_ZONE,
        transect: attr.TRANSECT,
        transect_description: attr.TRANSECT_DESC,
        flood_zone: attr.FLD_ZONE_CODE,
        commissioner_district: attr.COMDISTID,
        commissioner_name: attr.COMNAME
      };
    });
    
    console.log(`Returning ${properties.length} properties in map bounds`);
    
    res.json({
      data: properties,
      meta: {
        totalCount: properties.length,
        bounds: parsedBounds
      }
    });
  } catch (error) {
    console.error('Error fetching properties in bounds:', error);
    res.status(500).json({ error: 'Failed to fetch properties in bounds', details: error.message });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getPropertyByFolio,
  createProperty,
  searchProperties,
  getPropertyZones,
  getPropertyNeighborhoods,
  getPropertiesInBounds
}; 
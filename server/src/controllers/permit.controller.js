const axios = require('axios');
const permitModel = require('../models/permit.model');
const config = require('../config');

// ArcGIS API URL for Miami-Dade permits
const ARCGIS_PERMITS_API = 'https://services1.arcgis.com/CvuPhqcTQpZPT9qY/arcgis/rest/services/Building_Permits_Since_2014/FeatureServer/0/query';

/**
 * Get permits with filtering and pagination
 */
const getPermits = async (req, res, next) => {
  try {
    const {
      folioNumber,
      permitNumber,
      permitType,
      status,
      zipCode,
      page = 1,
      limit = 20,
      search = '',
    } = req.query;
    
    // Build the ArcGIS query based on filters
    let whereClause = '1=1';
    
    if (folioNumber) {
      whereClause += ` AND FolioNumber=${folioNumber}`;
    }
    
    if (permitNumber) {
      whereClause += ` AND PermitNumber LIKE '%${permitNumber}%'`;
    }
    
    if (permitType) {
      whereClause += ` AND WorkItems LIKE '%${permitType}%'`;
    }
    
    if (status) {
      whereClause += ` AND BuildingPermitStatusDescription='${status}'`;
    }
    
    if (zipCode) {
      whereClause += ` AND CompanyZip=${zipCode}`;
    }
    
    if (search) {
      whereClause += ` AND (ScopeofWork LIKE '%${search}%' OR WorkItems LIKE '%${search}%' OR DeliveryAddress LIKE '%${search}%')`;
    }
    
    // Calculate offset based on pagination
    const offset = (page - 1) * limit;
    
    // Make request to ArcGIS API
    const response = await axios.get(ARCGIS_PERMITS_API, {
      params: {
        where: whereClause,
        outFields: '*',
        outSR: 4326,
        f: 'json',
        resultOffset: offset,
        resultRecordCount: limit,
        orderByFields: 'IssuedDate DESC'
      }
    });
    
    // Transform the ArcGIS response to our API format
    const permits = response.data.features.map(feature => {
      const attr = feature.attributes;
      const geo = feature.geometry;
      
      // Convert ArcGIS timestamp (milliseconds) to ISO date string if exists
      const convertTimestamp = (timestamp) => {
        return timestamp ? new Date(timestamp).toISOString() : null;
      };
      
      // Extract cost as number from string
      const extractCost = (costString) => {
        if (!costString) return null;
        const numericValue = costString.replace(/\D/g, '');
        return numericValue ? parseInt(numericValue, 10) : null;
      };
      
      return {
        id: attr.ObjectId,
        permit_number: attr.PermitNumber,
        folio_number: attr.FolioNumber ? attr.FolioNumber.toString() : null,
        application_number: attr.ApplicationNumber,
        process_number: attr.ProcessNumber,
        permit_type: attr.WorkItems || attr.ScopeofWork,
        status: attr.BuildingPermitStatusDescription,
        status_reason: attr.BuildingPermitStatusReasonDescr,
        address: attr.DeliveryAddress,
        property_type: attr.PropertyType,
        latitude: geo ? geo.y : attr.Latitude,
        longitude: geo ? geo.x : attr.Longitude,
        issued_date: convertTimestamp(attr.IssuedDate),
        final_date: convertTimestamp(attr.BuildingFinalLastInspDate),
        submitted_date: convertTimestamp(attr.FirstSubmissionDate),
        status_date: convertTimestamp(attr.Statusdate),
        is_final: attr.IsPermitFinal === 'YES',
        estimated_value: extractCost(attr.TotalCost),
        total_sqft: attr.TotalSQFT,
        addition_sqft: attr.AdditionSQFT,
        remodeling_sqft: attr.RemSQFT,
        scope_of_work: attr.ScopeofWork,
        zone: attr.Miami21Zone,
        company_name: attr.CompanyName,
        company_address: attr.CompanyAddress,
        company_city: attr.CompanyCity,
        company_zip: attr.CompanyZip,
        days_in_review: attr.TotalDaysInPlanReviewNumeric
      };
    });
    
    // Get total count using a separate API call
    const countResponse = await axios.get(ARCGIS_PERMITS_API, {
      params: {
        where: whereClause,
        returnCountOnly: true,
        f: 'json'
      }
    });
    
    const totalCount = countResponse.data.count;
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      data: permits,
      meta: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ error: 'Failed to fetch permits', details: error.message });
  }
};

/**
 * Get a permit by ID
 */
const getPermitById = async (req, res, next) => {
  try {
    let { id } = req.params;
    
    console.log(`Fetching permit with ID: ${id}`);
    
    // Handle different ID formats that might come from the client
    // ArcGIS ObjectId is numeric, permit_number may include letters
    let whereClause = '';
    
    // If the ID is numeric, try to use it directly first
    if (!isNaN(parseInt(id))) {
      // Try to find by permit number first with pattern like "BD" + ID
      whereClause = `PermitNumber LIKE '%${id}%'`;
      console.log(`Looking for permit with number containing: ${id}`);
    } 
    // If ID contains letters (like 'BD'), treat it as a PermitNumber
    else if (id.includes('F') || id.includes('BD')) {
      whereClause = `PermitNumber='${id}'`;
    }
    // If no match, try to format it as a permit number with prefix
    else {
      // Attempt to format as a permit number
      if (!id.startsWith('BD')) {
        id = `BD${id}`;
        whereClause = `PermitNumber='${id}'`;
      }
    }
    
    console.log(`Using where clause: ${whereClause}`);
    
    // Request to ArcGIS API for a specific permit
    const response = await axios.get(ARCGIS_PERMITS_API, {
      params: {
        where: whereClause,
        outFields: '*',
        outSR: 4326,
        f: 'json'
      }
    });
    
    if (!response.data.features || response.data.features.length === 0) {
      console.log(`No permit found with query: ${whereClause}`);
      
      // If we didn't find the permit with the first query and the ID is numeric,
      // try a broader search as a fallback
      if (!isNaN(parseInt(id)) && !whereClause.includes('OR')) {
        const fallbackWhereClause = `PermitNumber LIKE '%${id}%' OR ApplicationNumber LIKE '%${id}%'`;
        console.log(`Trying fallback query: ${fallbackWhereClause}`);
        
        const fallbackResponse = await axios.get(ARCGIS_PERMITS_API, {
          params: {
            where: fallbackWhereClause,
            outFields: '*',
            outSR: 4326,
            f: 'json'
          }
        });
        
        if (fallbackResponse.data.features && fallbackResponse.data.features.length > 0) {
          console.log(`Found ${fallbackResponse.data.features.length} permit(s) with fallback query`);
          // Use the first matching permit from the fallback query
          const feature = fallbackResponse.data.features[0];
          const permit = processPermitFeature(feature, id);
          return res.json(permit);
        }
      }
      
      return res.status(404).json({ error: 'Permit not found' });
    }
    
    console.log(`Found ${response.data.features.length} permit(s) matching query`);
    
    // Use the first matching permit
    const feature = response.data.features[0];
    const permit = processPermitFeature(feature, id);
    
    res.json(permit);
  } catch (error) {
    console.error('Error fetching permit by ID:', error);
    res.status(500).json({ error: 'Failed to fetch permit', details: error.message });
  }
};

// Helper function to process a permit feature from ArcGIS API
const processPermitFeature = (feature, requestedId) => {
  const attr = feature.attributes;
  const geo = feature.geometry;
  
  // Convert ArcGIS timestamp to ISO date string if exists
  const convertTimestamp = (timestamp) => {
    if (!timestamp) return null;
    // ArcGIS timestamps are in milliseconds since epoch
    const date = new Date(timestamp);
    // Validate the date is valid before converting
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return null;
    }
    return date.toISOString();
  };
  
  // Generate a stable ID for the permit
  // Use requested ID if it's numeric, as it's likely the ID we assigned
  const id = !isNaN(parseInt(requestedId)) ? parseInt(requestedId) : 
            attr.OBJECTID || attr.ObjectID || 
            // Generate a unique ID based on the permit number
            parseInt(attr.PermitNumber.replace(/\D/g, '')) % 1000000;
  
  return {
    id,
    permit_number: attr.PermitNumber,
    folio_number: attr.FolioNumber ? attr.FolioNumber.toString() : null,
    application_number: attr.ApplicationNumber,
    process_number: attr.ProcessNumber,
    permit_type: attr.WorkItems || attr.ScopeofWork,
    status: attr.BuildingPermitStatusDescription,
    status_reason: attr.BuildingPermitStatusReasonDescr,
    address: attr.DeliveryAddress,
    property_type: attr.PropertyType,
    latitude: geo ? geo.y : attr.Latitude,
    longitude: geo ? geo.x : attr.Longitude,
    issued_date: convertTimestamp(attr.IssuedDate),
    final_date: convertTimestamp(attr.BuildingFinalLastInspDate),
    submitted_date: convertTimestamp(attr.FirstSubmissionDate),
    status_date: convertTimestamp(attr.Statusdate),
    is_final: attr.IsPermitFinal === 'YES',
    estimated_value: attr.TotalCost,
    total_sqft: attr.TotalSQFT,
    addition_sqft: attr.AdditionSQFT,
    remodeling_sqft: attr.RemSQFT,
    scope_of_work: attr.ScopeofWork,
    zone: attr.Miami21Zone,
    company_name: attr.CompanyName,
    company_address: attr.CompanyAddress,
    company_city: attr.CompanyCity,
    company_zip: attr.CompanyZip,
    days_in_review: attr.TotalDaysInPlanReviewNumeric
  };
};

/**
 * Get permits by folio number
 */
const getPermitsByFolio = async (req, res, next) => {
  try {
    const { folioNumber } = req.params;
    
    if (!folioNumber) {
      return res.status(400).json({ error: 'Folio number is required' });
    }
    
    console.log(`Fetching permits for folio: ${folioNumber}`);
    
    // Request to ArcGIS API for permits by folio number
    const response = await axios.get(ARCGIS_PERMITS_API, {
      params: {
        where: `FolioNumber=${folioNumber}`,
        outFields: '*',
        outSR: 4326,
        f: 'json',
        orderByFields: 'IssuedDate DESC'
      }
    });
    
    console.log(`Found ${response.data.features.length} permits for folio ${folioNumber}`);
    
    // Debug: Log the first permit's attributes to see what fields are available
    if (response.data.features.length > 0) {
      console.log("First permit attribute keys:", Object.keys(response.data.features[0].attributes));
      
      // Check for common ID field names in the first permit
      const firstAttr = response.data.features[0].attributes;
      console.log("Possible ID fields:");
      console.log("- OBJECTID:", firstAttr.OBJECTID);
      console.log("- ObjectID:", firstAttr.ObjectID);
      console.log("- objectid:", firstAttr.objectid);
      console.log("- objectId:", firstAttr.objectId);
      console.log("- object_id:", firstAttr.object_id);
      console.log("- id:", firstAttr.id);
      console.log("- ID:", firstAttr.ID);
    }
    
    // Transform the ArcGIS response to our API format
    const permits = response.data.features.map((feature, index) => {
      const attr = feature.attributes;
      const geo = feature.geometry;
      
      // Convert ArcGIS timestamp to ISO date string if exists
      const convertTimestamp = (timestamp) => {
        if (!timestamp) return null;
        // ArcGIS timestamps are in milliseconds since epoch
        const date = new Date(timestamp);
        // Validate the date is valid before converting
        if (isNaN(date.getTime())) {
          console.error('Invalid timestamp:', timestamp);
          return null;
        }
        // Format the date as ISO string
        return date.toISOString();
      };
      
      // Use a unique ID based on the permit number if OBJECTID is undefined
      // ArcGIS sometimes doesn't include OBJECTID in the response
      const permitId = attr.OBJECTID || attr.ObjectID || attr.objectid || 
                       attr.objectId || attr.object_id || 
                       // Fallback to numeric ID based on the permit number or index
                       (index + 1) * 1000 + parseInt(Math.random() * 1000);
                      
      // Log the permit ID for debugging
      console.log(`Permit ${attr.PermitNumber} has ID: ${permitId}`);
      
      const issuedDate = convertTimestamp(attr.IssuedDate);
      
      return {
        // CRITICAL: Use the permitId to ensure each permit has a valid ID
        id: permitId,
        permit_number: attr.PermitNumber,
        folio_number: attr.FolioNumber ? attr.FolioNumber.toString() : null,
        application_number: attr.ApplicationNumber,
        process_number: attr.ProcessNumber,
        permit_type: attr.WorkItems || attr.ScopeofWork,
        status: attr.BuildingPermitStatusDescription,
        status_reason: attr.BuildingPermitStatusReasonDescr,
        address: attr.DeliveryAddress,
        property_type: attr.PropertyType,
        latitude: geo ? geo.y : attr.Latitude,
        longitude: geo ? geo.x : attr.Longitude,
        issued_date: issuedDate,
        final_date: convertTimestamp(attr.BuildingFinalLastInspDate),
        submitted_date: convertTimestamp(attr.FirstSubmissionDate),
        status_date: convertTimestamp(attr.Statusdate),
        is_final: attr.IsPermitFinal === 'YES',
        estimated_value: attr.TotalCost,
        total_sqft: attr.TotalSQFT,
        addition_sqft: attr.AdditionSQFT,
        remodeling_sqft: attr.RemSQFT,
        scope_of_work: attr.ScopeofWork,
        zone: attr.Miami21Zone,
        company_name: attr.CompanyName,
        company_address: attr.CompanyAddress,
        company_city: attr.CompanyCity,
        company_zip: attr.CompanyZip,
        days_in_review: attr.TotalDaysInPlanReviewNumeric
      };
    });
    
    // Even if property doesn't exist in our database, return permit data
    res.json({
      data: permits,
      meta: {
        totalCount: permits.length,
        folioNumber
      }
    });
  } catch (error) {
    console.error('Error fetching permits by folio:', error);
    res.status(500).json({ error: 'Failed to fetch permits by folio number', details: error.message });
  }
};

/**
 * Get permit types (unique values)
 */
const getPermitTypes = async (req, res) => {
  try {
    // Use our own cached list of common permit types since ArcGIS doesn't provide a clean way to get unique values
    const permitTypes = [
      { code: 'Building', name: 'Building' },
      { code: 'Electrical', name: 'Electrical' },
      { code: 'Mechanical', name: 'Mechanical' },
      { code: 'Plumbing', name: 'Plumbing' },
      { code: 'Roofing', name: 'Roofing' },
      { code: 'Demolition', name: 'Demolition' },
      { code: 'Sign', name: 'Sign' },
      { code: 'TreeRemoval', name: 'Tree Removal' },
      { code: 'SolarPanels', name: 'Solar Panels' },
      { code: 'Pool', name: 'Pool' },
      { code: 'Fence', name: 'Fence' },
      { code: 'InteriorRenovation', name: 'Interior Renovation' },
      { code: 'NewConstruction', name: 'New Construction' },
      { code: 'Addition', name: 'Addition' }
    ];
    
    res.json({
      data: permitTypes
    });
  } catch (error) {
    console.error('Error fetching permit types:', error);
    res.status(500).json({ error: 'Failed to fetch permit types', details: error.message });
  }
};

/**
 * Get permit statuses (unique values)
 */
const getPermitStatuses = async (req, res) => {
  try {
    console.log('Getting permit statuses');
    
    // Using common permit statuses based on the ArcGIS API data
    const statuses = [
      { code: 'Active', name: 'Active' },
      { code: 'Final', name: 'Final' },
      { code: 'Expired', name: 'Expired' },
      { code: 'Hold', name: 'Hold' },
      { code: 'Pending', name: 'Pending' },
      { code: 'InProgress', name: 'In Progress' },
      { code: 'Rejected', name: 'Rejected' },
      { code: 'Completed', name: 'Completed' }
    ];
    
    // Log the response being sent
    console.log('Sending permit statuses:', { data: statuses });
    
    res.json({
      data: statuses
    });
  } catch (error) {
    console.error('Error fetching permit statuses:', error);
    res.status(500).json({ error: 'Failed to fetch permit statuses', details: error.message });
  }
};

/**
 * Create a new permit
 */
const createPermit = async (req, res, next) => {
  try {
    const permitData = {
      folioNumber: req.body.folioNumber,
      permitNumber: req.body.permitNumber,
      permitType: req.body.permitType,
      status: req.body.status,
      description: req.body.description,
      estimatedValue: req.body.estimatedValue,
      issueDate: req.body.issueDate,
      expirationDate: req.body.expirationDate,
      completedDate: req.body.completedDate,
      contractorName: req.body.contractorName
    };
    
    // Validate required fields
    if (!permitData.folioNumber || !permitData.permitNumber || !permitData.permitType || !permitData.status) {
      return res.status(400).json({ 
        error: 'Folio number, permit number, permit type, and status are required' 
      });
    }
    
    // Create permit
    const newPermit = await permitModel.createPermit(permitData);
    
    res.status(201).json({ data: newPermit });
  } catch (error) {
    // Handle duplicate permit number
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Permit with this permit number already exists' });
    }
    
    // Handle foreign key violation
    if (error.code === '23503') { // PostgreSQL foreign key violation
      return res.status(400).json({ error: 'Property with the provided folio number does not exist' });
    }
    
    next(error);
  }
};

/**
 * Get a permit by permit number
 */
const getPermitByNumber = async (req, res, next) => {
  try {
    const { permitNumber } = req.params;
    
    if (!permitNumber) {
      return res.status(400).json({ error: 'Permit number is required' });
    }
    
    console.log(`Fetching permit with permit number: ${permitNumber}`);
    
    // Create the exact query for the permit number
    const whereClause = `PermitNumber='${permitNumber}'`;
    console.log(`Using where clause: ${whereClause}`);
    
    // Request to ArcGIS API for the specific permit
    const response = await axios.get(ARCGIS_PERMITS_API, {
      params: {
        where: whereClause,
        outFields: '*',
        outSR: 4326,
        f: 'json'
      }
    });
    
    if (!response.data.features || response.data.features.length === 0) {
      console.log(`No permit found with permit number: ${permitNumber}`);
      
      // Try a less strict search as a fallback
      const fallbackWhereClause = `PermitNumber LIKE '%${permitNumber}%'`;
      console.log(`Trying fallback query: ${fallbackWhereClause}`);
      
      const fallbackResponse = await axios.get(ARCGIS_PERMITS_API, {
        params: {
          where: fallbackWhereClause,
          outFields: '*',
          outSR: 4326,
          f: 'json'
        }
      });
      
      if (fallbackResponse.data.features && fallbackResponse.data.features.length > 0) {
        console.log(`Found ${fallbackResponse.data.features.length} permit(s) with fallback query`);
        // Use the first matching permit from the fallback query
        const feature = fallbackResponse.data.features[0];
        const permit = processPermitFeature(feature, permitNumber);
        return res.json(permit);
      }
      
      return res.status(404).json({ error: 'Permit not found' });
    }
    
    console.log(`Found ${response.data.features.length} permit(s) matching query`);
    
    // Use the first matching permit
    const feature = response.data.features[0];
    const permit = processPermitFeature(feature, permitNumber);
    
    res.json(permit);
  } catch (error) {
    console.error('Error fetching permit by permit number:', error);
    res.status(500).json({ error: 'Failed to fetch permit', details: error.message });
  }
};

module.exports = {
  getPermits,
  getPermitById,
  getPermitsByFolio,
  getPermitByNumber,
  getPermitTypes,
  getPermitStatuses,
  createPermit
}; 
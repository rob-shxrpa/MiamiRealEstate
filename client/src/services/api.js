import axios from 'axios';
import { logApiRequest, logApiResponse, logApiError } from '../utils/apiLogger';

// Create base axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add debug logging to help troubleshoot
console.log('API base URL:', process.env.REACT_APP_API_URL || 'http://localhost:3001/api');

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Log the full URL being requested
    const fullUrl = `${config.baseURL}${config.url}`.replace('//', '/');
    console.log(`Requesting: ${config.method.toUpperCase()} ${fullUrl}`);
    
    logApiRequest(config.method.toUpperCase(), config.url, config.params || config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    logApiResponse(response.config.method.toUpperCase(), response.config.url, response);
    return response;
  },
  (error) => {
    logApiError(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'UNKNOWN',
      error
    );
    return Promise.reject(error);
  }
);

// Properties API
export const propertiesAPI = {
  // Get properties with optional filtering
  getProperties: async (params = {}) => {
    try {
      const response = await api.get('/properties', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get a single property by ID
  getPropertyById: async (id, fallbackData = null) => {
    try {
      // If we have fallback data, send it as query parameters
      const params = fallbackData ? {
        fallback: 'true',
        address: fallbackData.address,
        city: fallbackData.city,
        zipcode: fallbackData.zipcode || fallbackData.zip_code,
        latitude: fallbackData.latitude,
        longitude: fallbackData.longitude,
        folio: fallbackData.folio_number
      } : {};
      
      const response = await api.get(`/properties/${id}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching property by ID ${id}:`, error);
      
      // If request failed and we have fallback data, return it as a mock response
      if (fallbackData) {
        console.log('Using fallback data for property:', fallbackData);
        return { 
          data: { ...fallbackData, is_fallback: true },
          success: true
        };
      }
      
      throw error;
    }
  },

  // Get a property by folio number
  getPropertyByFolio: async (folioNumber) => {
    try {
      const response = await api.get(`/properties/folio/${folioNumber}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching property by folio ${folioNumber}:`, error);
      throw error;
    }
  },

  // Search properties by address, folio, or neighborhood
  searchProperties: async (query) => {
    try {
      const response = await api.get('/properties/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error(`Error searching properties with query "${query}":`, error);
      throw error;
    }
  },
  
  // Get all available property zones (Miami 21 zones)
  getPropertyZones: async () => {
    try {
      const response = await api.get('/properties/zones');
      return response.data;
    } catch (error) {
      console.error('Error fetching property zones:', error);
      throw error;
    }
  },
  
  // Get all available neighborhoods
  getPropertyNeighborhoods: async () => {
    try {
      const response = await api.get('/properties/neighborhoods');
      return response.data;
    } catch (error) {
      console.error('Error fetching property neighborhoods:', error);
      throw error;
    }
  },
  
  /**
   * Get properties within map bounds
   * @param {Array} bounds - [west, south, east, north]
   * @param {number} limit - Maximum number of properties to return
   * @returns {Promise<Object>} - Response with properties data
   */
  getPropertiesInBounds: async (bounds, limit = 100) => {
    try {
      const response = await api.get('/properties/bounds', {
        params: {
          bounds: bounds.join(','),
          limit
        }
      });
      console.log(`Fetched ${response.data.data.length} properties from bounds`);
      return response.data;
    } catch (error) {
      console.error('Error fetching properties in bounds:', error);
      throw error;
    }
  }
};

// Permits API
export const permitsAPI = {
  // Get permits with optional filtering
  getPermits: async (params = {}) => {
    try {
      const response = await api.get('/permits', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching permits:', error);
      throw error;
    }
  },

  // Get a single permit by ID
  getPermitById: async (id) => {
    try {
      const response = await api.get(`/permits/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching permit by ID ${id}:`, error);
      throw error;
    }
  },

  // Get a permit by permit number
  getPermitByNumber: async (permitNumber) => {
    try {
      const response = await api.get(`/permits/by-number/${permitNumber}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching permit by number ${permitNumber}:`, error);
      throw error;
    }
  },

  // Get permits for a property
  getPermitsByFolio: async (folioNumber) => {
    try {
      const response = await api.get(`/permits/folio/${folioNumber}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching permits by folio ${folioNumber}:`, error);
      throw error;
    }
  },

  /**
   * Get all permit types
   * @returns {Promise<Object>} - Response with permit types data
   */
  getPermitTypes: async () => {
    try {
      const response = await api.get('/permits/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching permit types:', error);
      throw error;
    }
  },

  /**
   * Get all permit statuses
   * @returns {Promise<Object>} - Response with permit statuses data
   */
  getPermitStatuses: async () => {
    try {
      const response = await api.get('/permits/statuses');
      return response.data;
    } catch (error) {
      console.error('Error fetching permit statuses:', error);
      throw error;
    }
  }
};

// Points of Interest API
export const poisAPI = {
  // Get points of interest with optional filtering
  getPOIs: async (params = {}) => {
    try {
      const response = await api.get('/pois', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching POIs:', error);
      throw error;
    }
  },

  // Get a single POI by ID
  getPOIById: async (id) => {
    try {
      const response = await api.get(`/pois/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching POI by ID ${id}:`, error);
      throw error;
    }
  },

  // Get all POI categories
  getPOICategories: async () => {
    try {
      const response = await api.get('/pois/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching POI categories:', error);
      throw error;
    }
  },

  createPOI: async (poiData) => {
    try {
      const response = await api.post('/pois', poiData);
      return response.data;
    } catch (error) {
      console.error('Error creating POI:', error);
      throw error;
    }
  },

  updatePOI: async (poiData) => {
    try {
      const response = await api.put(`/pois/${poiData.id}`, poiData);
      return response.data;
    } catch (error) {
      console.error('Error updating POI:', error);
      throw error;
    }
  },

  deletePOI: async (id) => {
    try {
      const response = await api.delete(`/pois/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting POI:', error);
      throw error;
    }
  }
};

// Distance calculations API
export const distancesAPI = {
  // Calculate distance between properties and POIs
  calculateDistances: async (propertyIds, poiIds) => {
    try {
      const response = await api.post('/distances/calculate', { propertyIds, poiIds });
      return response.data;
    } catch (error) {
      console.error('Error calculating distances:', error);
      throw error;
    }
  },

  // Get distance between a property and POIs
  getDistancesByProperty: async (propertyId) => {
    try {
      const response = await api.get(`/distances/property/${propertyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching distances for property ${propertyId}:`, error);
      throw error;
    }
  }
};

// Miami-Dade County property data API
export const propertyDataAPI = {
  // Get property data with optional filtering and pagination
  getPropertyData: async (params = {}) => {
    try {
      const response = await api.get('/property-data', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching property data:', error);
      throw error;
    }
  },

  // Get property data by folio number
  getPropertyDataByFolio: async (folioNumber) => {
    try {
      const response = await api.get(`/property-data/${folioNumber}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching property data by folio ${folioNumber}:`, error);
      throw error;
    }
  },

  // Get all zoning codes
  getZoningCodes: async () => {
    try {
      const response = await api.get('/property-data/codes/zoning');
      return response.data;
    } catch (error) {
      console.error('Error fetching zoning codes:', error);
      throw error;
    }
  },

  // Get all land use codes
  getLandUseCodes: async () => {
    try {
      const response = await api.get('/property-data/codes/land-use');
      return response.data;
    } catch (error) {
      console.error('Error fetching land use codes:', error);
      throw error;
    }
  }
};

export default {
  propertiesAPI,
  permitsAPI,
  poisAPI,
  distancesAPI,
  propertyDataAPI
}; 
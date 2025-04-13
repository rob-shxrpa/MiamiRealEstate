/**
 * API Logger utility for debugging network requests
 */

// Set to true to enable logging
const DEBUG_MODE = true;

/**
 * Log API requests with method, URL and data/params
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Request URL
 * @param {object} data - Request data or params
 */
export const logApiRequest = (method, url, data) => {
  if (!DEBUG_MODE) return;
  
  console.group(`🚀 API Request: ${method} ${url}`);
  console.log('Request details:', { method, url, data });
  console.groupEnd();
};

/**
 * Log API responses with status and data
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} response - Response data
 */
export const logApiResponse = (method, url, response) => {
  if (!DEBUG_MODE) return;
  
  console.group(`✅ API Response: ${method} ${url}`);
  console.log('Status:', response.status);
  console.log('Data:', response.data);
  console.groupEnd();
};

/**
 * Log API errors with details
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Error} error - Error object
 */
export const logApiError = (method, url, error) => {
  if (!DEBUG_MODE) return;
  
  console.group(`❌ API Error: ${method} ${url}`);
  console.error('Error:', error.message);
  
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  }
  
  console.error('Full error:', error);
  console.groupEnd();
}; 
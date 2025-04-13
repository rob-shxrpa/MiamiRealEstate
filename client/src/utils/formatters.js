/**
 * Format a date string into a more readable format
 * @param {string} dateString - ISO date string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined) return 'N/A';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${amount}`;
  }
};

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return 'N/A';
  
  try {
    return new Intl.NumberFormat('en-US').format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    return num.toString();
  }
};

/**
 * Format square footage
 * @param {number} sqft - Square footage
 * @returns {string} Formatted square footage string
 */
export const formatSquareFeet = (sqft) => {
  if (sqft === null || sqft === undefined) return 'N/A';
  if (sqft === 0) return '0 sq ft';
  
  return `${formatNumber(sqft)} sq ft`;
};

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
}; 
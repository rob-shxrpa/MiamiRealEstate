require('dotenv').config();

module.exports = {
  // Server config
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database config
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'miami_realestate',
  },
  
  // API keys
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  
  // Pagination defaults
  defaultLimit: 20,
  maxLimit: 100,
}; 
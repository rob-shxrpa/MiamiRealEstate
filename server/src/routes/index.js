const express = require('express');
const propertyRoutes = require('./property.routes');
const permitRoutes = require('./permit.routes');
const distanceRoutes = require('./distance.routes');
const poiRoutes = require('./poi.routes');
const propertyDataRoutes = require('./property-data.routes');

const router = express.Router();

// API documentation route
router.get('/', (req, res) => {
  res.json({
    message: 'Miami Real Estate Analytics API',
    version: '1.0.0',
    endpoints: {
      properties: '/api/properties',
      permits: '/api/permits',
      pointsOfInterest: '/api/pois',
      distances: '/api/distances',
      propertyData: '/api/property-data'
    }
  });
});

// Log all route calls for debugging
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Apply routes
router.use('/properties', propertyRoutes);
router.use('/permits', permitRoutes);
router.use('/distances', distanceRoutes);
router.use('/pois', poiRoutes);
router.use('/property-data', propertyDataRoutes);

module.exports = router; 
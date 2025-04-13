const express = require('express');
const distanceController = require('../controllers/distance.controller');

const router = express.Router();

/**
 * @route   GET /api/distances/property/:propertyId/poi/:poiId
 * @desc    Calculate distance between a property and point of interest
 * @access  Public
 */
router.get('/property/:propertyId/poi/:poiId', distanceController.calculateDistance);

/**
 * @route   POST /api/distances/property/:propertyId/pois
 * @desc    Calculate distances from a property to multiple points of interest
 * @access  Public
 */
router.post('/property/:propertyId/pois', distanceController.calculateDistancesToPOIs);

module.exports = router; 
/**
 * Routes for Miami-Dade County property data
 */
const express = require('express');
const propertyDataController = require('../controllers/property-data.controller');

const router = express.Router();

/**
 * @route GET /api/property-data
 * @desc Get property data with pagination and filtering
 * @access Public
 */
router.get('/', propertyDataController.getPropertyData);

/**
 * @route GET /api/property-data/:folioNumber
 * @desc Get property data by folio number
 * @access Public
 */
router.get('/:folioNumber', propertyDataController.getPropertyDataByFolio);

/**
 * @route GET /api/property-data/codes/zoning
 * @desc Get zoning codes
 * @access Public
 */
router.get('/codes/zoning', propertyDataController.getZoningCodes);

/**
 * @route GET /api/property-data/codes/land-use
 * @desc Get land use codes
 * @access Public
 */
router.get('/codes/land-use', propertyDataController.getLandUseCodes);

module.exports = router; 
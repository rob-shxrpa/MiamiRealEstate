const express = require('express');
const propertyController = require('../controllers/property.controller');

const router = express.Router();

/**
 * @route   GET /api/properties
 * @desc    Get all properties with filtering
 * @access  Public
 */
router.get('/', propertyController.getProperties);

/**
 * @route   GET /api/properties/zones
 * @desc    Get all property zones
 * @access  Public
 */
router.get('/zones', propertyController.getPropertyZones);

/**
 * @route   GET /api/properties/neighborhoods
 * @desc    Get all property neighborhoods
 * @access  Public
 */
router.get('/neighborhoods', propertyController.getPropertyNeighborhoods);

/**
 * @route   GET /api/properties/search
 * @desc    Search properties by address or other criteria
 * @access  Public
 */
router.get('/search', propertyController.searchProperties);

/**
 * @route   GET /api/properties/bounds
 * @desc    Get properties within map bounds
 * @access  Public
 */
router.get('/bounds', propertyController.getPropertiesInBounds);

/**
 * @route   GET /api/properties/folio/:folioNumber
 * @desc    Get a property by folio number
 * @access  Public
 */
router.get('/folio/:folioNumber', propertyController.getPropertyByFolio);

/**
 * @route   GET /api/properties/:id
 * @desc    Get a property by ID
 * @access  Public
 */
router.get('/:id', propertyController.getPropertyById);

/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private
 */
router.post('/', propertyController.createProperty);

module.exports = router; 
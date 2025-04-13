const express = require('express');
const poiController = require('../controllers/poi.controller');

const router = express.Router();

/**
 * @route   GET /api/pois
 * @desc    Get points of interest with filtering and pagination
 * @access  Public
 */
router.get('/', poiController.getPOIs);

/**
 * @route   GET /api/pois/categories
 * @desc    Get all POI categories
 * @access  Public
 */
router.get('/categories', poiController.getPOICategories);

/**
 * @route   GET /api/pois/:id
 * @desc    Get a POI by ID
 * @access  Public
 */
router.get('/:id', poiController.getPOIById);

/**
 * @route   POST /api/pois
 * @desc    Create a new POI
 * @access  Public
 */
router.post('/', poiController.createPOI);

module.exports = router; 
const express = require('express');
const router = express.Router();
const permitController = require('../controllers/permit.controller');

/**
 * @route   GET /api/permits
 * @desc    Get all permits with filtering
 * @access  Public
 */
router.get('/', permitController.getPermits);

/**
 * @route   GET /api/permits/folio/:folioNumber
 * @desc    Get permits by folio number
 * @access  Public
 */
router.get('/folio/:folioNumber', permitController.getPermitsByFolio);

/**
 * @route   GET /api/permits/by-number/:permitNumber
 * @desc    Get a permit by permit number
 * @access  Public
 */
router.get('/by-number/:permitNumber', permitController.getPermitByNumber);

/**
 * @route   GET /api/permits/types
 * @desc    Get all permit types
 * @access  Public
 */
router.get('/types', permitController.getPermitTypes);

/**
 * @route   GET /api/permits/statuses
 * @desc    Get all permit statuses
 * @access  Public
 */
router.get('/statuses', permitController.getPermitStatuses);

/**
 * @route   POST /api/permits
 * @desc    Create a new permit
 * @access  Private
 */
router.post('/', permitController.createPermit);

/**
 * @route   GET /api/permits/:id
 * @desc    Get a permit by ID
 * @access  Public
 */
router.get('/:id', permitController.getPermitById);

module.exports = router; 
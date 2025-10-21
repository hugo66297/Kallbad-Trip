const express = require('express');
const router = express.Router();
const bathingWater = require('../controllers/bathingWater.js');

/**
 * GET /api/health
 * Checks the external API health status
 */
router.get('/health', bathingWater.checkApiHealth);

/**
 * GET /api/bathing-waters
 * Retrieves all active bathing sites
 */
router.get('/bathing-waters', bathingWater.getAllBathingWaters);

/**
 * GET /api/bathing-waters/:id
 * Retrieves a specific bathing site by its ID
 */
router.get('/bathing-waters/:id', bathingWater.getBathingWaterById);

/**
 * GET /api/bathing-waters/:id/profile
 * Retrieves the complete profile of a bathing site
 */
router.get('/bathing-waters/:id/profile', bathingWater.getBathingWaterProfile);

/**
 * GET /api/bathing-waters/:id/results
 * Retrieves the monitoring results of a site
 */
router.get('/bathing-waters/:id/results', bathingWater.getBathingWaterResults);

/**
 * GET /api/forecasts
 * Retrieves water temperature forecasts
 * Query params: bathingWaterId, municId, municName
 */
router.get('/forecasts', bathingWater.getForecast);

module.exports = router;
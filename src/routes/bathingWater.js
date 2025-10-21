const express = require('express');
const router = express.Router();
const bathingWater = require('../controllers/bathingWater.js');

const verifyMiddleware = require('../middlewares/verify.js');

router.use('/bathing-waters/:lid', verifyMiddleware.verifyLocationID);

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
 * GET /api/bathing-waters/:id/profile
 * Retrieves the complete profile of a bathing site
 */
router.get('/bathing-waters/:lid/profile', bathingWater.getBathingWaterProfile);

/**
 * GET /api/forecasts
 * Retrieves water temperature forecasts
 * Query params: bathingWaterId, municId, municName
 */
router.get('/forecasts', bathingWater.getForecast);

module.exports = router;
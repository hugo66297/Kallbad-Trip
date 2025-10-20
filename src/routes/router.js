const router = require('express').Router();
const bathingWatersController = require('../controllers/bathingWatersController');

// ============================================
// Bathing Waters Routes
// ============================================

/**
 * GET /api/health
 * Checks the external API health status
 */
router.get('/health', bathingWatersController.checkApiHealth);

/**
 * GET /api/bathing-waters
 * Retrieves all active bathing sites
 */
router.get('/bathing-waters', bathingWatersController.getAllBathingWaters);

/**
 * GET /api/bathing-waters/:id
 * Retrieves a specific bathing site by its ID
 */
router.get('/bathing-waters/:id', bathingWatersController.getBathingWaterById);

/**
 * GET /api/bathing-waters/:id/profile
 * Retrieves the complete profile of a bathing site
 */
router.get('/bathing-waters/:id/profile', bathingWatersController.getBathingWaterProfile);

/**
 * GET /api/bathing-waters/:id/results
 * Retrieves the monitoring results of a site
 */
router.get('/bathing-waters/:id/results', bathingWatersController.getBathingWaterResults);

/**
 * GET /api/forecasts
 * Retrieves water temperature forecasts
 * Query params: bathingWaterId, municId, municName
 */
router.get('/forecasts', bathingWatersController.getForecast);

router.use(require('./user.js'));
router.use(require('./review.js'));

module.exports = router;
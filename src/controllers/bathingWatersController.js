/**
 * Controller for bathing waters endpoints
 */

const bathingWatersService = require('../services/bathingWatersService');

/**
 * GET /api/bathing-waters
 * Retrieves all active bathing sites
 */
async function getAllBathingWaters(req, res) {
    try {
        const data = await bathingWatersService.getAllBathingWaters();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving bathing sites',
            error: error.message
        });
    }
}

/**
 * GET /api/bathing-waters/:id
 * Retrieves a specific bathing site
 */
async function getBathingWaterById(req, res) {
    try {
        const { id } = req.params;
        
        // Basic ID format validation
        const idPattern = /^SE[A-Z0-9]{4}[0-9]{12}$/;
        if (!idPattern.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format. Expected format: SE[A-Z0-9]{4}[0-9]{12}'
            });
        }
        
        const data = await bathingWatersService.getBathingWaterById(id);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        const status = error.message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
}

/**
 * GET /api/bathing-waters/:id/profile
 * Retrieves the profile of a bathing site
 */
async function getBathingWaterProfile(req, res) {
    try {
        const { id } = req.params;
        const data = await bathingWatersService.getBathingWaterProfile(id);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        const status = error.message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
}

/**
 * GET /api/bathing-waters/:id/results
 * Retrieves the monitoring results of a site
 */
async function getBathingWaterResults(req, res) {
    try {
        const { id } = req.params;
        const data = await bathingWatersService.getBathingWaterResults(id);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        const status = error.message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message,
            error: error.message
        });
    }
}

/**
 * GET /api/forecasts
 * Retrieves water temperature forecasts
 */
async function getForecast(req, res) {
    try {
        const { bathingWaterId, municId, municName } = req.query;
        const filters = {
            bathingWaterId,
            municId,
            municName
        };
        
        const data = await bathingWatersService.getForecast(filters);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving forecasts',
            error: error.message
        });
    }
}

/**
 * GET /api/health
 * Checks the external API health status
 */
async function checkApiHealth(req, res) {
    try {
        const data = await bathingWatersService.checkApiHealth();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'External API unavailable',
            error: error.message
        });
    }
}

module.exports = {
    getAllBathingWaters,
    getBathingWaterById,
    getBathingWaterProfile,
    getBathingWaterResults,
    getForecast,
    checkApiHealth
};


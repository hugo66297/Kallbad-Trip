/**
 * Controller for bathing waters endpoints
 */

const bathingWatersService = require('../services/bathingWatersService');

async function getAllBathingWaters(req, res) {
    //#swagger.tags = ['Bathing Waters']
    //#swagger.summary = 'Retrieves all active bathing sites'
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

async function getBathingWaterById(req, res) {
    //#swagger.tags = ['Bathing Waters']
    //#swagger.summary = 'Retrieves a specific bathing site by its ID'
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

async function getBathingWaterProfile(req, res) {
    //#swagger.tags = ['Bathing Waters']
    //#swagger.summary = 'Retrieves the profile of a bathing site'
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

async function getBathingWaterResults(req, res) {
    //#swagger.tags = ['Bathing Waters']
    //#swagger.summary = 'Retrieves the monitoring results of a bathing site'
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

async function getForecast(req, res) {
    //#swagger.tags = ['Bathing Waters']
    //#swagger.summary = 'Retrieves water temperature forecasts'
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

async function checkApiHealth(req, res) {
    //#swagger.tags = ['Bathing Waters']
    //#swagger.summary = 'Checks the external API health status'
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


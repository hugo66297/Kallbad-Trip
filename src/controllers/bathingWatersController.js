/**
 * Controller for bathing waters endpoints
 */

const bathingWatersService = require('../services/bathingWatersService');
const dataProcessor = require('../services/dataProcessor');

async function getAllBathingWaters(req, res) {
    //#swagger.tags = ['Bathing Waters']
    //#swagger.summary = 'Retrieves all active bathing sites'
    try {
        const { page = 1, limit = 100, bounds } = req.query;
        
        const rawData = await bathingWatersService.getAllBathingWaters();
        let processedData = dataProcessor.processMapData(rawData);
        
        // Filter by bounds if provided (to optimize map display)
        if (bounds) {
            const { north, south, east, west } = JSON.parse(bounds);
            processedData = processedData.filter(site => {
                const lat = site.coordinates.latitude;
                const lng = site.coordinates.longitude;
                return lat >= south && lat <= north && lng >= west && lng <= east;
            });
        }
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedData = processedData.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: paginatedData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(processedData.length / limit),
                totalItems: processedData.length,
                itemsPerPage: parseInt(limit)
            }
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
        
        const rawData = await bathingWatersService.getBathingWaterById(id);
        const processedData = dataProcessor.processMapData(rawData);
        
        if (processedData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bathing site not found'
            });
        }
        
        res.json({
            success: true,
            data: processedData[0]
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
        const rawData = await bathingWatersService.getBathingWaterProfile(id);
        const processedData = await dataProcessor.processDetailData(rawData);
        
        if (!processedData) {
            return res.status(404).json({
                success: false,
                message: 'Bathing site profile not found'
            });
        }
        
        res.json({
            success: true,
            data: processedData
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
        const rawData = await bathingWatersService.getBathingWaterResults(id);
        const processedData = dataProcessor.processMonitoringData(rawData);
        
        if (!processedData) {
            return res.status(404).json({
                success: false,
                message: 'Monitoring results not found'
            });
        }
        
        res.json({
            success: true,
            data: processedData
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
        
        const rawData = await bathingWatersService.getForecast(filters);
        const processedData = dataProcessor.processForecastData(rawData);
        
        if (!processedData) {
            return res.status(404).json({
                success: false,
                message: 'Forecast data not found'
            });
        }
        
        res.json({
            success: true,
            data: processedData
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


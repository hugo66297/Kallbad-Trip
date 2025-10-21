const status = require('http-status');
const CodeError = require('../util/CodeError.js');

const bathingWatersService = require('../services/bathingWatersService');
const dataProcessor = require('../services/dataProcessor');

module.exports = {
    async getAllBathingWaters(req, res) {
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
                message: 'Retrieving all Bathing sites',
                data: paginatedData,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(processedData.length / limit),
                    totalItems: processedData.length,
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (error) {
            throw new CodeError(`Error retrieving bathing sites : ${error.message}`, status.INTERNAL_SERVER_ERROR);
        }
    },

    async getBathingWaterById(req, res) {
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
                throw new CodeError('Bathing site not found', status.NOT_FOUND);
            }
            res.json({
                success: true,
                message: 'Retrieving all Bathing sites',
                data: processedData[0]
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? status.NOT_FOUND : status.INTERNAL_SERVER_ERROR;
            throw new CodeError(`Error retrieving bathing site : ${error.message}`, statusCode);
        }
    },

    async getBathingWaterProfile(req, res) {
        //#swagger.tags = ['Bathing Waters']
        //#swagger.summary = 'Retrieves the profile of a bathing site'
        try {
            const { id } = req.params;
            const rawData = await bathingWatersService.getBathingWaterProfile(id);
            const processedData = await dataProcessor.processDetailData(rawData);
            
            if (!processedData) {
                throw new CodeError('Bathing site profile not found', status.NOT_FOUND);
            }
            
            res.json({
                success: true,
                message: 'Retrieving bathing site profile',
                data: processedData
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? status.NOT_FOUND : status.INTERNAL_SERVER_ERROR;
            throw new CodeError(`Error retrieving bathing site profile : ${error.message}`, statusCode);
        }
    },

    async getBathingWaterResults(req, res) {
        //#swagger.tags = ['Bathing Waters']
        //#swagger.summary = 'Retrieves the monitoring results of a bathing site'
        try {
            const { id } = req.params;
            const rawData = await bathingWatersService.getBathingWaterResults(id);
            const processedData = dataProcessor.processMonitoringData(rawData);
            
            if (!processedData) {
                throw new CodeError('Monitoring results not found', status.NOT_FOUND);
            }
            
            res.json({
                success: true,
                message: 'Retrieving bathing site monitoring results',
                data: processedData
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? status.NOT_FOUND : status.INTERNAL_SERVER_ERROR;
            throw new CodeError(`Error retrieving monitoring results : ${error.message}`, statusCode);
        }
    },

    async getForecast(req, res) {
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
                throw new CodeError('No forecasts found for the given criteria', status.NOT_FOUND);
            }
            
            res.json({
                success: true,
                message: 'Retrieving water temperature forecasts',
                data: processedData
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? status.NOT_FOUND : status.INTERNAL_SERVER_ERROR;
            throw new CodeError(`Error retrieving forecasts : ${error.message}`, statusCode);
        }
    },

    async checkApiHealth(req, res) {
        //#swagger.tags = ['Bathing Waters']
        //#swagger.summary = 'Checks the external API health status'
        try {
            const data = await bathingWatersService.checkApiHealth();
            res.json({
                success: true,
                message: 'External API working',
                data: data
            });
        } catch (error) {
            throw new CodeError(`External API unavailable: ${error.message}`, status.INTERNAL_SERVER_ERROR);
        }
    }
};


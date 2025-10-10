/**
 * Service to interact with the external bathing waters API
 * Documentation: https://www.havochvatten.se/data-kartor-och-rapporter/data-och-statistik/data-och-apier.html
 */

// Production URL (test API returns 500 errors)
const API_BASE_URL = 'https://gw.havochvatten.se/external-public/bathing-waters/v2';

/**
 * Retrieves all active bathing sites
 * @returns {Promise<Object>} List of all active bathing sites with their advisories
 */
async function getAllBathingWaters() {
    try {
        const response = await fetch(`${API_BASE_URL}/bathing-waters`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Error retrieving bathing sites:', error.message);
        throw error;
    }
}

/**
 * Retrieves a specific bathing site by its ID
 * @param {string} id - The unique identifier of the bathing site (format: SE[A-Z0-9]{4}[0-9]{12})
 * @returns {Promise<Object>} Details of the bathing site with active advisories
 */
async function getBathingWaterById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bathing-waters/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Bathing site not found: ${id}`);
            }
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ Error retrieving site ${id}:`, error.message);
        throw error;
    }
}

/**
 * Retrieves the profile of a bathing site
 * @param {string} id - The unique identifier of the bathing site
 * @returns {Promise<Object>} Complete profile of the bathing site
 */
async function getBathingWaterProfile(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bathing-waters/${id}/profiles`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Profile not found for site: ${id}`);
            }
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ Error retrieving profile for site ${id}:`, error.message);
        throw error;
    }
}

/**
 * Retrieves the monitoring results of a bathing site
 * @param {string} id - The unique identifier of the bathing site
 * @returns {Promise<Object>} Monitoring results of the site
 */
async function getBathingWaterResults(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bathing-waters/${id}/results`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Results not found for site: ${id}`);
            }
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ Error retrieving results for site ${id}:`, error.message);
        throw error;
    }
}

/**
 * Retrieves water temperature forecasts
 * @param {Object} filters - Optional filters (bathingWaterId, municId, municName)
 * @returns {Promise<Object>} Temperature forecasts
 */
async function getForecast(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        if (filters.bathingWaterId) params.append('bathingWaterId', filters.bathingWaterId);
        if (filters.municId) params.append('municId', filters.municId);
        if (filters.municName) params.append('municName', filters.municName);
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`${API_BASE_URL}/forecasts${queryString}`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Error retrieving forecasts:', error.message);
        throw error;
    }
}

/**
 * Checks the API health status
 * @returns {Promise<Object>} API health status
 */
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/operations/health-checks/readiness`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Error checking API health:', error.message);
        throw error;
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


const API_BASE_URL = 'https://gw.havochvatten.se/external-public/bathing-waters/v2';

async function getAllBathingWaters() {
    try {
        const response = await fetch(`${API_BASE_URL}/bathing-waters`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error retrieving bathing sites:', error.message);
        throw error;
    }
}

async function getBathingWaterById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bathing-waters/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Bathing site not found: ${id}`);
            }
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error retrieving site ${id}:`, error.message);
        throw error;
    }
}

async function getBathingWaterProfile(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bathing-waters/${id}/profiles`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Profile not found for site: ${id}`);
            }
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error retrieving profile for site ${id}:`, error.message);
        throw error;
    }
}

async function getBathingWaterResults(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/bathing-waters/${id}/results`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Results not found for site: ${id}`);
            }
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error retrieving results for site ${id}:`, error.message);
        throw error;
    }
}

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
        
        return await response.json();
    } catch (error) {
        console.error('Error retrieving forecasts:', error.message);
        throw error;
    }
}

async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/operations/health-checks/readiness`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error checking API health:', error.message);
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


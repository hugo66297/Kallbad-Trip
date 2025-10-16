const { translateText } = require('./translationService');

async function translateClassification(classification) {
    if (!classification) return null;
    
    const translatedText = classification.qualityClassIdText ? 
        await translateText(classification.qualityClassIdText) : 
        classification.qualityClassIdText;
    
    return {
        ...classification,
        qualityClassIdText: translatedText
    };
}

function processMapData(apiData) {
    if (!apiData || !apiData.watersAndAdvisories) {
        return [];
    }

    return apiData.watersAndAdvisories.map(item => {
        const water = item.bathingWater;
        return {
            id: water.id,
            name: water.name,
            coordinates: {
                latitude: parseFloat(water.samplingPointPosition.latitude),
                longitude: parseFloat(water.samplingPointPosition.longitude)
            }
        };
    });
}

async function processDetailData(apiData) {
    if (!apiData || !apiData.bathingWater) {
        return null;
    }

    const data = apiData;
    const water = data.bathingWater;

    const translatedDescription = water.description && water.description.length > 20 ? 
        await translateText(water.description) : water.description;
    
    const translatedWaterType = water.waterTypeIdText ? 
        await translateText(water.waterTypeIdText) : water.waterTypeIdText;

    const translatedSummary = data.summary && data.summary.length > 15 ? 
        await translateText(data.summary) : data.summary;

    return {
        id: water.id,
        name: water.name,
        description: translatedDescription,
        euMotive: water.euMotive,
        coordinates: {
            latitude: parseFloat(water.samplingPointPosition.latitude),
            longitude: parseFloat(water.samplingPointPosition.longitude)
        },
        waterType: {
            id: water.waterTypeId,
            name: translatedWaterType
        },
        bathingSeason: data.bathingSeason ? {
            startDate: data.bathingSeason.startsAt,
            endDate: data.bathingSeason.endsAt,
            isActive: isBathingSeasonActive(data.bathingSeason)
        } : null,
        waterQuality: {
            currentClassification: data.lastFourClassifications ? 
                await translateClassification(data.lastFourClassifications[0]) : null,
            classificationHistory: data.lastFourClassifications || [],
            hasAlgae: data.algae || false,
            hasCyanobacteria: data.cyano || false
        },
        pollutionSources: data.pollutionSources || [],
        summary: translatedSummary,
        administrativeAuthority: data.administrativeAuthority ? {
            contactInfo: {
                address: data.administrativeAuthority.contactInfo?.address || '',
                email: data.administrativeAuthority.contactInfo?.email || '',
                name: data.administrativeAuthority.contactInfo?.name || '',
                phone: data.administrativeAuthority.contactInfo?.phone || '',
                visitAddress: data.administrativeAuthority.contactInfo?.visitAddress || ''
            }
        } : null,
        supervisoryAuthority: data.supervisoryAuthority ? {
            contactInfo: {
                address: data.supervisoryAuthority.contactInfo?.address || '',
                email: data.supervisoryAuthority.contactInfo?.email || '',
                name: data.supervisoryAuthority.contactInfo?.name || '',
                phone: data.supervisoryAuthority.contactInfo?.phone || '',
                visitAddress: data.supervisoryAuthority.contactInfo?.visitAddress || ''
            }
        } : null,
        updateDetail: data.updateDetail ? {
            authoredBy: data.updateDetail.authoredBy || '',
            frequency: data.updateDetail.frequency || '',
            latestAt: data.updateDetail.latestAt || '',
            schedule: data.updateDetail.schedule || ''
        } : null
    };
}

function isBathingSeasonActive(bathingSeason) {
    if (!bathingSeason || !bathingSeason.startsAt || !bathingSeason.endsAt) {
        return false;
    }
    
    const now = new Date();
    const startDate = new Date(bathingSeason.startsAt);
    const endDate = new Date(bathingSeason.endsAt);
    
    return now >= startDate && now <= endDate;
}

function processMonitoringData(apiData) {
    if (!apiData.success || !apiData.data) {
        return null;
    }

    const data = apiData.data;
    
    return {
        siteId: data.bathingWater?.id,
        siteName: data.bathingWater?.name,
        results: data.results || [],
        lastUpdate: data.lastUpdate || null,
        qualityIndicators: {
            eColi: data.eColi || null,
            intestinalEnterococci: data.intestinalEnterococci || null,
            temperature: data.temperature || null
        }
    };
}

function processForecastData(apiData) {
    if (!apiData.success || !apiData.data) {
        return null;
    }

    const data = apiData.data;
    
    return {
        siteId: data.bathingWaterId,
        forecasts: data.forecasts || [],
        lastUpdate: data.lastUpdate || null,
        temperatureForecast: data.temperatureForecast || null
    };
}


module.exports = {
    processMapData,
    processDetailData,
    processMonitoringData,
    processForecastData,
    isBathingSeasonActive
};

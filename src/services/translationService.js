const translate = require('google-translate-api-x');

const cache = new Map();

async function translateText(text, from = 'sv', to = 'en') {
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return text;
    }

    const cacheKey = `${from}-${to}-${text}`;
    
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const result = await translate(text, { from, to });
        cache.set(cacheKey, result.text);
        return result.text;
    } catch (error) {
        console.error('Translation error:', error.message);
        return text;
    }
}

function clearCache() {
    cache.clear();
}

module.exports = {
    translateText,
    clearCache
};

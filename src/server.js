require('dotenv').config();
require('mandatoryenv').load(['PORT']);
const http = require('http');
const { testConnection } = require('./util/db');
const { PORT } = process.env;

const app = require('./app');

// Database connection test on startup
testConnection()
    .then(() => {
        console.log('✅ Database connected');
    })
    .catch((error) => {
        console.warn('⚠️  Database unavailable:', error.message);
        console.warn('⚠️  Server starting anyway (external API only)');
    })
    .finally(() => {
        const server = http.createServer(app);
        
        server.listen(
            PORT,
            () => {
                console.info('🚀 Server started on port', PORT);
                console.info('📡 Bathing Waters API available at http://localhost:' + PORT + '/api');
                console.info('📖 Swagger documentation available at http://localhost:' + PORT + '/doc');
            }
        );
    });
require('dotenv').config();
require('mandatoryenv').load(['PORT']);
const http = require('http');
const { testConnection } = require('./util/db');
const { PORT } = process.env;

const app = require('./app');

// Test de connexion à la base de données au démarrage
testConnection()
    .then(() => {
        const server = http.createServer(app);
        
        server.listen(
            PORT,
            () => console.info('🚀 Serveur démarré sur le port', PORT)
        );
    })
    .catch((error) => {
        console.error('❌ Impossible de démarrer le serveur:', error.message);
        console.error('⚠️  Vérifiez la configuration de la base de données dans .env');
        process.exit(1);
    });
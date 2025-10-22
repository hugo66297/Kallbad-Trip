const swaggerAutogen = require('swagger-autogen')()

const outputFile = 'swagger_output.json'
const endpointsFiles = ['./src/routes/router.js']

swaggerAutogen(outputFile, endpointsFiles, {
    host: 'localhost:3002',
    basePath: '/api',
    securityDefinitions: {
        apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-access-token',
            description: 'User JWT token'
        }
    },
    security: [
        {
            apiKeyAuth: []
        }
    ]
});

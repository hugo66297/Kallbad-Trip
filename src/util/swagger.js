const swaggerAutogen = require('swagger-autogen')()

const outputFile = 'swagger_output.json'
const endpointsFiles = ['./src/routes/router.js']

swaggerAutogen(outputFile, endpointsFiles, {
    basePath: '/api',
    securityDefinitions: {
        apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-access-token',
            description: 'Token JWT du user'
        }
    },
    security: [
        {
            apiKeyAuth: []
        }
    ]
});

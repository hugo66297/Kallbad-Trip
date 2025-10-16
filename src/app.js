/*Patches*/
//const { inject, errorHandler } = require('express-custom-error');
//inject(); // in order to use async / await

/*Dépendencies*/
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./util/logger');
const jws = require('jws');

//Instantiate Express App
const app = express();

//Express App instance
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//Configure Middleware
app.use(logger.dev, logger.combined);
app.use(cookieParser());
app.use(cors());
app.use(helmet());

//Swagger Configuration & Documentation
if (process.env.NODE_ENV == 'dev') {
    const swaggerUI = require('swagger-ui-express');
    const swaggerFile = require('../swagger_output.json');
    app.use('/doc', swaggerUI.serve, swaggerUI.setup(swaggerFile));
}

//API routes
app.use('/api', require('./routes/router.js'));

//Handle not valid API routes
app.use('/api', (req, res) => {
    res
        .status(404)
        .json({ status: false, message: 'Endpoint Not Found' })
});

//Serve static files
app.use(express.static('src/frontend'));

//Root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/frontend/index.html');
});

module.exports = app;
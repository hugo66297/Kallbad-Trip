require('mandatoryenv').load(['PORT'])
const http = require('http')
const https = require('https')
const fs = require('fs')
const { PORT } = process.env

const app = require('./app')

var server = http.createServer(app);

server.listen(
    PORT,
    () => console.info('server listening on port ', PORT)
)
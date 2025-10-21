const has = require('has-keys');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');
const db = require('../util/db.js');

module.exports = {
    async addVisitedSite(req, res) {
        //#swagger.tags = ['Visited Sites']
        //#swagger.summary = 'Endpoint to add a visited site to a user'
        
        res.json({status:true, message:'Visited site added to user list'});
    },
    async removeVisitedSite(req, res) {
        //#swagger.tags = ['Visited Sites']
        //#swagger.summary = 'Endpoint to remove a visited site from a user'

        res.json({status:true, message:'Visited site removed from user list'});
    }
}
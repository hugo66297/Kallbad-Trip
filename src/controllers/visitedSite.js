const has = require('has-keys');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');
const db = require('../util/db.js');

module.exports = {
    async getVisitedSites(req,res){
        //#swagger.tags = ['Visited Sites']
        //#swagger.summary = 'Endpoint to get all visited sites of a user'

        //get user ID
        const u = await db.query(`SELECT id FROM users WHERE email = $1`, [req.login.email]);
        const user = u.rows[0];

        //get visited sites
        const vs = await db.query(`SELECT site_api_id, visited_on FROM visited_sites WHERE user_id = $1`, [user.id]);
        const visitedSites = vs.rows;

        res.json({status:true, message:'Visited sites retrieved successfully', data: visitedSites});
    },
    async addVisitedSite(req, res) {
        //#swagger.tags = ['Visited Sites']
        //#swagger.summary = 'Endpoint to add a visited site to a user'
        const lid = req.params.lid;
        //get user ID
        const u = await db.query(`SELECT id FROM users WHERE email = $1`, [req.login.email]);
        const user = u.rows[0];

        //if location is already in visited sites
        const vs = await db.query(`SELECT id FROM visited_sites WHERE user_id = $1 AND site_api_id = $2`, [user.id, lid]);
        const visitedSite = vs.rows[0];
        if (visitedSite) throw new CodeError('Location is already in your list', status.CONFLICT);
        
        //insert visited site
        const newVisitedSite = await db.query(`INSERT INTO visited_sites (user_id, site_api_id) VALUES ($1, $2)`, [user.id, lid]);
        if(!newVisitedSite) throw new CodeError('could not add visited site', status.INTERNAL_SERVER_ERROR);

        res.json({status:true, message:'Visited site added to user list'});
    },
    async removeVisitedSite(req, res) {
        //#swagger.tags = ['Visited Sites']
        //#swagger.summary = 'Endpoint to remove a visited site from a user'
        const lid = req.params.lid;

        //get user ID
        const u = await db.query(`SELECT id FROM users WHERE email = $1`, [req.login.email]);
        const user = u.rows[0];

        //if location is not in visited sites
        const vs = await db.query(`SELECT id FROM visited_sites WHERE user_id = $1 AND site_api_id = $2`, [user.id, lid]);
        const visitedSite = vs.rows[0];
        if (!visitedSite) throw new CodeError('Location is not in your list', status.NOT_FOUND);

        //delete visited site
        const deletedVisitedSite = await db.query(`DELETE FROM visited_sites WHERE user_id = $1 AND site_api_id = $2`, [user.id, lid]);
        if(!deletedVisitedSite) throw new CodeError('could not remove visited site', status.INTERNAL_SERVER_ERROR);

        res.json({status:true, message:'Visited site removed from user list'});
    }
}
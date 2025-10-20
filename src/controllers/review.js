const has = require('has-keys');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');
const db = require('../util/db.js');


module.exports = {
    async getReview(req,res){
        //#swagger.tags = ['Reviews']
        //#swagger.summary = 'Endpoint to get all reviews from the location ID'

        const locationID = req.params.id;
        
        //vérifier que locationID existe avec l'api des baignade

        //get all reviews from locationID
        const reviews = await db.query(`SELECT r.user_id, r.rating, r.review_text, r.created_at FROM reviews r WHERE r.site_api_id = $1`, [locationID]);

        res.json({status:true, message:'Get all reviews from location', data: reviews.rows});
    },
    async addReview(req,res){},
    async modifyReview(req,res){},
    async deleteReview(req,res){}
}
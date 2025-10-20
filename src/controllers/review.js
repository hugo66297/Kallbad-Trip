const has = require('has-keys');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');
const db = require('../util/db.js');
const jws = require('jws');

module.exports = {
    async getReview(req,res){
        //#swagger.tags = ['Reviews']
        //#swagger.summary = 'Endpoint to get all reviews from the location ID'

        const locationID = req.params.lid;

        //get all reviews from locationID
        const reviews = await db.query(`SELECT r.user_id, r.rating, r.review_text, r.created_at FROM reviews r WHERE r.site_api_id = $1`, [locationID]);

        res.json({status:true, message:'Get all reviews from location', data: reviews.rows});
    },
    async addReview(req,res){
        //#swagger.tags = ['Reviews']
        //#swagger.summary = 'Endpoint to add a review to a location ID'
        //#swagger.parameters['obj'] = { in: 'body', description: 'rating and review_text', required: true, schema: { $rating: 4, $review_text: 'Smell wierd but water is warm !' }}

        const locationID = req.params.lid;
        const token = req.cookies.authToken;
        const login = JSON.parse(jws.decode(token).payload);

        const { rating, review_text } = req.body;
        
        if(!has(req.body,['rating','review_text'])) throw new CodeError('rating and review_text are required', status.BAD_REQUEST);
        if(rating < 1 || rating > 5) throw new CodeError('rating must be between 1 and 5', status.BAD_REQUEST);
        if(review_text.length > 500) throw new CodeError('review_text must be less than 500 characters', status.BAD_REQUEST);
        
        //get user ID from email
        const u = await db.query(`SELECT id FROM users WHERE email = $1`, [login.email]);
        const user = u.rows[0];
        if(!user) throw new CodeError('user does not exist', status.BAD_REQUEST);

        //insert review :
        
        const newReview = await db.query(`INSERT INTO reviews (user_id, site_api_id, rating, review_text, created_at) VALUES ($1, $2, $3, $4, NOW())`, [user.id, locationID, rating, review_text]);
        
        if(!newReview) throw new CodeError('could not add review', status.INTERNAL_SERVER_ERROR);

        res.json({status:true, message:'Review added'});
    },
    async modifyReview(req,res){},
    async deleteReview(req,res){}
}
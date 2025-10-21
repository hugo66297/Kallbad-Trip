const db = require('../util/db.js');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');

async function verifyReviewID(req,res,next) {

    if(isNaN(req.params.id)) return res.status(400).json({status: false, message: 'The id is not on the right format'});
    
    const r = await db.query(`SELECT id FROM reviews WHERE id = $1`, [req.params.id]);
    const review = r.rows[0];
    if(!review) throw new CodeError('Review does not exist', status.NOT_FOUND);

    next();
}
async function verifyLocationID(req, res, next){
    //verifier que l'id commence par SE et qu'il est bien dans l'api externe
    const id = req.params.lid;
    
    const idPattern = /^SE[A-Z0-9]{4}[0-9]{12}$/;
    if (!idPattern.test(id)) {
        throw new CodeError(`Invalid ID format. ${id}`, status.BAD_REQUEST);
    }

    next();
}

module.exports = {verifyReviewID, verifyLocationID};
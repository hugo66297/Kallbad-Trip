const db = require('../util/db.js');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');

async function verifyUserID(req,res,next) {
    if(isNaN(req.params.uid)) throw new CodeError('The id is not on the right format', status.BAD_REQUEST);
    const u = await db.query(`SELECT id FROM users WHERE id = $1`, [req.params.uid]);
    const user = u.rows[0];
    if(!user) throw new CodeError('User does not exist', status.NOT_FOUND);

    next();
}

async function verifyReviewID(req,res,next) {

    if(isNaN(req.params.rid)) throw new CodeError('The id is not on the right format', status.BAD_REQUEST);
    
    const r = await db.query(`SELECT id FROM reviews WHERE id = $1`, [req.params.rid]);
    const review = r.rows[0];
    if(!review) throw new CodeError('Review does not exist', status.NOT_FOUND);

    next();
}
async function verifyLocationID(req, res, next){
    const id = req.params.lid;
    
    const idPattern = /^SE[A-Z0-9]{4}[0-9]{12}$/;
    if (!idPattern.test(id)) {
        throw new CodeError(`Invalid ID format. ${id}`, status.BAD_REQUEST);
    }

    next();
}

module.exports = {verifyUserID,verifyReviewID, verifyLocationID};
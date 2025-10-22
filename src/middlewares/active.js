const db = require('../util/db.js');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');

async function verifyUserBan(req, res, next){
    const u = await db.query('SELECT * FROM users WHERE email = $1', [req.login.email]);
    const authUser = u.rows[0];

    if (!authUser.is_active) throw new CodeError('Your account is banned. You cannot access this resource.', status.FORBIDDEN);

    next();
}

module.exports = {verifyUserBan}
const jws = require('jws');
const db = require('../util/db.js');

async function verifyTokenPresence(req, res, next){
    const token = req.cookies.authToken;

    if(!token) throw {code: 403, message: 'Missing token'};
    if(!jws.verify(token, 'HS256', process.env.TOKENSECRET)) throw {code: 403, message: 'Invalid token'}
    
    const login = JSON.parse(jws.decode(token).payload);
    const u = await db.query('SELECT * FROM users WHERE email = $1 AND username = $2', [login.email, login.pseudo]);
    const authUser = u.rows[0];
    if(!authUser) throw {code: 403, message: 'Authenticated user does not exist'};
    
    req.login = login;
    next();
}

async function verifyTokenAdmin(req, res, next){
    const u = await db.query('SELECT * FROM users WHERE email = $1 AND username = $2', [req.login.email, req.login.pseudo]);
    const authUser = u.rows[0];
    if(!authUser) throw {code: 403, message: 'Authenticated user does not exist'};
    if (authUser.role != "admin") throw {code:403, message: 'Forbidden : you don\'t have the rights to access this resource'};
    next();
}

module.exports = {verifyTokenPresence, verifyTokenAdmin}
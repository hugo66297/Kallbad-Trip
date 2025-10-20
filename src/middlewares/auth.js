const jws = require('jws');
const db = require('../util/db.js');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');

async function verifyTokenPresence(req, res, next){
    const token = req.cookies.authToken;

    if(!token) throw new CodeError('Missing token', status.UNAUTHORIZED);
    if(!jws.verify(token, 'HS256', process.env.TOKENSECRET)) throw new CodeError('Invalid token', status.UNAUTHORIZED);

    const login = JSON.parse(jws.decode(token).payload);
    const u = await db.query('SELECT * FROM users WHERE email = $1 AND username = $2', [login.email, login.pseudo]);
    const authUser = u.rows[0];
    if(!authUser) throw new CodeError('Authenticated user does not exist', status.FORBIDDEN);

    req.login = login;
    next();
}

async function verifyTokenAdmin(req, res, next){
    const u = await db.query('SELECT * FROM users WHERE email = $1 AND username = $2', [req.login.email, req.login.pseudo]);
    const authUser = u.rows[0];
    if(!authUser) throw new CodeError('Authenticated user does not exist', status.FORBIDDEN);
    if (authUser.role != "admin") throw new CodeError('You don\'t have the rights to access this resource', status.FORBIDDEN);
    next();
}

module.exports = {verifyTokenPresence, verifyTokenAdmin}
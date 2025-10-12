const has = require('has-keys');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');
const db = require('../util/db.js');
const bcrypt = require('bcrypt');
const jws = require('jws');
require('mandatoryenv').load(['TOKENSECRET']);
const TOKENSECRET = process.env.TOKENSECRET;
require('mandatoryenv').load(['SECURE_COOKIE']);
const SECURE_COOKIE = process.env.SECURE_COOKIE;

function validPassword (password){
    return /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/.test(password);
}

module.exports = {
    async register(req,res){
        //#swagger.tags = ['Users']
        //#swagger.summary = 'Endpoint to create an account'
        //#swagger.parameters['obj'] = { in: 'body', description: 'username, email and password', required: true, schema: { $username: 'Hugo', $email:'kalbad@gmail.com', $password: 'Password1234!'}}
        if(!has(req.body,['username','email','password'])) throw new CodeError('username, email and password are required', status.UNAUTHORIZED);
        const {username, email, password, firstName, lastName} = req.body;
        if(username == '' || email == '' || password == '') throw new CodeError('You need to specify username, email and password', status.BAD_REQUEST);
        if(!validPassword(password)) throw new CodeError('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number and one special character', status.BAD_REQUEST);

        // Create user

        // email or useername must be unique
        const existing = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email.toLowerCase(),username]);
        if (existing.rows.length > 0) {
            throw new CodeError("user already exists", status.CONFLICT);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5)`,
            //first letter capitalized and the rest in lowercase
            [username, email.toLowerCase(), hashedPassword, firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : null, lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase() : null]
        );


        res.json({status:true, message:'User Added'});
    },
    async login(req,res){
        //#swagger.tags = ['Users']
        //#swagger.summary = 'Endpoint to login'
        //#swagger.parameters['obj'] = { in: 'body', description: 'email and password', required: true, schema: { $email:'kalbad@gmail.com', $password: 'Password1234!'}}
        if(!has(req.body,['email','password'])) throw new CodeError('email and password are required', status.BAD_REQUEST);
        const { email, password } = req.body;
        if(email == '' || password == '') throw new CodeError('email or password cannot be empty', status.BAD_REQUEST);

        //check if user exists
        const u = await db.query(
            `SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]
        );
        const user = u.rows[0];

        if(!user) throw new CodeError('user does not exist', status.BAD_REQUEST);

        //check if password is correct
        if(await bcrypt.compare(password, user.password_hash)){
            const token = jws.sign({header:{alg:'HS256'}, payload:{pseudo: user.username, email: user.email}, secret:TOKENSECRET});

            //AUTH COOKIE 🍪🍪🍪
            res.cookie('authToken', token,{
                httpOnly: true,
                secure: SECURE_COOKIE === 'true',
                sameSite: 'Strict'
            });

            res.json({status:true, message: "login successful", data:token});
            return;
        } throw new CodeError("Wrong password", status.UNAUTHORIZED);
    },
    async logout(req,res){
        //#swagger.tags = ['Users']
        //#swagger.summary = 'Endpoint to logout'

        res.clearCookie('authToken');
        res.json({status:true, message:'User logged out'});
        
    }
}
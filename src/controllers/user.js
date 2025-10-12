const has = require('has-keys');
const status = require('http-status');
const CodeError = require('../util/CodeError.js');
const db = require('../util/db.js');
const bcrypt = require('bcrypt');
//const jws = require('jws');

function validPassword (password){
    return /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/.test(password);
}

module.exports = {
    async register(req,res){
        //#swagger.tags = ['Users']
        //#swagger.summary = 'Endpoint to create an account'
        //#swagger.parameters['obj'] = { in: 'body', description: 'username, email and password', required: true, schema: { $username: 'Hugo', $email:'kalbad@gmail.com', $password: 'Password1234!'}}
        if(!has(req.body,['username','email','password'])) throw new CodeError('username, email and password are required', status.UNAUTHORIZED);
        const {username, email, password} = req.body;
        if(username === '' || email === '' || password === '') throw new CodeError('You need to specify username, email and password', status.BAD_REQUEST);
        if(!validPassword(password)) throw new CodeError('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number and one special character', status.BAD_REQUEST);

        // Create user

        // Vérifie si l'utilisateur existe déjà
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            throw new CodeError("Email already registered", status.CONFLICT);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)`,
            [username, email.toLowerCase(), hashedPassword]
        );


        res.json({status:true, message:'User Added'});
    },
}
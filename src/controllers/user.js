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
        //#swagger.summary = 'Endpoint to create an account you canq add firstname and lastname optionally'
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

            db.query('UPDATE users SET last_login = NOW() WHERE username = $1', [user.username]);
            res.json({status:true, message: "login successful", data:token});
            return;
        } throw new CodeError("Wrong password", status.UNAUTHORIZED);
    },
    async checkAuth(req,res){
        //#swagger.tags = ['Users']
        //#swagger.summary = 'Endpoint to check if user is authenticated and retrieve data'
        
        const data = await db.query(`SELECT username, email, first_name, last_name, role, is_active FROM users WHERE email = $1`, [req.login.email]);

        res.json({status:true, message:'User is authenticated', data: data.rows[0]});
    },
    async logout(req,res){
        //#swagger.tags = ['Users']
        //#swagger.summary = 'Endpoint to logout'

        res.clearCookie('authToken');
        res.json({status:true, message:'User logged out'});

    },
    async modifyUser(req,res){
        //#swagger.tags = ['Users']
        //#swagger.summary = 'Endpoint to edit your account'
        //#swagger.parameters['obj'] = { in: 'body', description: 'you can change pseudo, email, password, firstname, lastname', required: true, schema: { $email:'kalbad@gmail.com', $password: 'Password1234!' }}
        
        const u = await db.query(`SELECT * FROM users WHERE email = $1`,[req.login.email]);
        const oldUser = u.rows[0];
        if(!oldUser) throw new CodeError('Internal Server Error', status.INTERNAL_SERVER_ERROR);
        

        const userModified = {};

        for(const key of ['pseudo','email','password','firstname','lastname']){
            if(has(req.body, key)){
                // Cannot be null
                if((key === "pseudo" || key === "email" || key === "password") && req.body[key] === null) throw new CodeError(`the property ${key} cannot be null`, status.BAD_REQUEST);
                // Pseudo, email, password can't be empty
                if((key === "pseudo" || key === "email" || key === "password") && req.body[key] === '') throw new CodeError(`the property ${key} cannot be empty`, status.BAD_REQUEST);
                
                // Validations
                if(key === "pseudo" && req.body[key].length > 100) throw new CodeError("username cannot exceed 100 characters", status.BAD_REQUEST);
                else if(key === "email" && req.body[key].length > 255) throw new CodeError("email cannot exceed 255 characters", status.BAD_REQUEST);
                else if(key === "password" && !validPassword(req.body[key])) throw new CodeError('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number and one special character', status.BAD_REQUEST);

                // Check if it's the same as current
                if(key === "pseudo" && req.body[key] === oldUser.username) continue;
                else if(key === "email" && req.body[key].toLowerCase() === oldUser.email) continue;
                else if(key === "firstname" && req.body[key] === oldUser.first_name) continue;
                else if(key === "lastname" && req.body[key] === oldUser.last_name) continue;
                else {
                    if(key === "email"){
                        req.body[key] = req.body[key].toLowerCase();
                    }
                    userModified[key] = req.body[key];
                }
            }
        }
        // At least one field must be modified
        if(Object.keys(userModified).length === 0) throw new CodeError('At least one field must be modified', status.BAD_REQUEST);

        // Check if pseudo or email is unique
        if(userModified.pseudo){
            const up = await db.query('SELECT id FROM users WHERE username = $1', [userModified.pseudo]);
            const existing = up.rows[0];
            if (existing) throw new CodeError("Pseudo is already taken", status.CONFLICT);
        }
        if(userModified.email){
            const up = await db.query('SELECT id FROM users WHERE email = $1', [userModified.email]);
            const existing = up.rows[0];
            if(existing) throw new CodeError("Email already used", status.CONFLICT);
        }
        // Handle null for firstname and lastname
        var boolFN = userModified.hasOwnProperty('firstname') && userModified.firstname === null;
        var boolLN = userModified.hasOwnProperty('lastname') && userModified.lastname === null;
        
        // Update user
        if(userModified.password){
            userModified.passhash = await bcrypt.hash(req.body.password, 10);
        }
        const updatedUser = await db.query(
            `UPDATE users SET username = $1, email = $2, first_name = $3, last_name = $4, password_hash = $5 WHERE id = $6`,
            [userModified.pseudo ? userModified.pseudo : oldUser.username, userModified.email ? userModified.email : oldUser.email, boolFN ? null : (userModified.firstname ? userModified.firstname.charAt(0).toUpperCase() + userModified.firstname.slice(1).toLowerCase() : oldUser.first_name), boolLN ? null : (userModified.lastname ? userModified.lastname.charAt(0).toUpperCase() + userModified.lastname.slice(1).toLowerCase() : oldUser.last_name), userModified.passhash ? userModified.passhash : oldUser.password_hash, oldUser.id]
        )
        // update cookie if email or pseudo changed
        if(userModified.pseudo || userModified.email){
            const newtoken = jws.sign({header:{alg:'HS256'}, payload:{pseudo: userModified.pseudo ? userModified.pseudo : oldUser.username, email: userModified.email ? userModified.email : oldUser.email}, secret:TOKENSECRET});

            //AUTH COOKIE 🍪🍪🍪
            res.cookie('authToken', newtoken,{
                httpOnly: true,
                secure: SECURE_COOKIE === 'true',
                sameSite: 'Strict'
            });
        }
        res.json({status:true, message:'User updated'});

    },
    async deleteUser(req,res){
        //#swagger.tags = ['Users']
        //#swagger.summary = 'Endpoint to delete your account'
 
        //check if user exists
        const u = await db.query(
            `SELECT * FROM users WHERE email = $1`, [req.login.email]
        );
        const user = u.rows[0];
        if(!user) throw new CodeError('user does not exist', status.BAD_REQUEST);

        const deletedUser = await db.query(`DELETE FROM users WHERE id = $1`, [user.id]);
        
        res.clearCookie('authToken');
        
        res.json({status:true, message:'User deleted'});
    },
    
    // ADMIN ENDPOINTS
    async getAllUsers(req,res){
        //#swagger.tags = ['Admin']
        //#swagger.summary = 'Endpoint to get all users informations'

        const u = await db.query(`SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.is_active, u.created_at, u.last_login, COUNT(r.id) AS review_count FROM users u LEFT JOIN reviews r ON u.id = r.user_id GROUP BY u.id ORDER BY u.id`);
        const users = u.rows;

        res.json({status:true, message:'All users fetched', data: users});
    },
    async getUserInfos(req,res){
        //#swagger.tags = ['Admin']
        //#swagger.summary = 'Endpoint to get all reviews from a user and the user infos'

        const r = await db.query(`SELECT id, site_api_id, rating, review_text,created_at FROM reviews WHERE user_id = $1 ORDER BY id`,[req.params.uid]);
        const reviews = r.rows;
        const u = await db.query(`SELECT id, username, role, is_active FROM users WHERE id = $1`, [req.params.uid]);
        const user = u.rows[0];
        res.json({status:true, message:'User infos fetched', data: {reviews: reviews, user: user}});
    },
    async changeUserStatus(req,res){
        //#swagger.tags = ['Admin']
        //#swagger.summary = 'Endpoint to change user status (ban/unban), (admin/user)'
        //#swagger.parameters['obj'] = { in: 'body', description: 'is_active (true/false), role (admin/user)', required: true, schema: { $is_active: true, $role: 'admin' }}
        
        if(!has(req.body,['is_active','role'])) throw new CodeError('is_active and role are required', status.BAD_REQUEST);
        const {is_active, role} = req.body;
        if(typeof is_active !== 'boolean' || (role !== 'admin' && role !== 'user')) throw new CodeError('is_active must be boolean and role must be admin or user', status.BAD_REQUEST);

        const modU = await db.query(`UPDATE users SET is_active = $1, role = $2 WHERE id = $3`, [is_active, role, req.params.uid]);
        if(!modU) throw new CodeError('could not modify user', status.INTERNAL_SERVER_ERROR);
        
        res.json({status:true, message:'User status changed'});

    },  
    async deleteUserByAdmin(req,res){
        //#swagger.tags = ['Admin']
        //#swagger.summary = 'Endpoint to delete a user by admin'

        const delU = await db.query(`DELETE FROM users WHERE id = $1`, [req.params.uid]);
        if(!delU) throw new CodeError('could not delete user', status.INTERNAL_SERVER_ERROR);

        res.json({status:true, message:'User successfully deleted'});
    }
}
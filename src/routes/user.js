const express = require('express');
const router = express.Router();
const user = require('../controllers/user.js');
//const verifyMiddleware = require('../middlewares/verify.js');
//const authMiddleware = require('../middlewares/auth.js');

//router.use('/users', authMiddleware.verifyTokenPresence);
//router.use('/user', authMiddleware.verifyTokenPresence);
//router.use('/user/:id',verifyMiddleware.verifyID);

//router.use('/register', authMiddleware.verifyTokenPresence, authMiddleware.verifyTokenAdmin);


module.exports = router;
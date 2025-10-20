const express = require('express');
const router = express.Router();
const user = require('../controllers/user.js');

const authMiddleware = require('../middlewares/auth.js');
//const verifyMiddleware = require('../middlewares/verify.js');

router.use('/logout', authMiddleware.verifyTokenPresence);
router.use('/changeInfo', authMiddleware.verifyTokenPresence);
//router.use('/user/:id',authMiddleware.verifyTokenPresence);

router.post('/register', user.register);
router.post('/login',user.login);
router.get('/logout',user.logout);

//router.get('/user/:id', user.getUser);
router.put('/changeInfo', user.modifyUser);
router.delete('/changeInfo', user.deleteUser);


module.exports = router;
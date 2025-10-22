const express = require('express');
const router = express.Router();
const user = require('../controllers/user.js');

const authMiddleware = require('../middlewares/auth.js');
const verifyMiddleware = require('../middlewares/verify.js');

router.use('/logout', authMiddleware.verifyTokenPresence);
router.use('/changeInfo', authMiddleware.verifyTokenPresence);
router.use('/manage/user',authMiddleware.verifyTokenPresence, authMiddleware.verifyTokenAdmin);
router.use('/manage/user/:uid', verifyMiddleware.verifyUserID);

router.post('/register', user.register);
router.post('/login',user.login);
router.get('/logout',user.logout);

router.put('/changeInfo', user.modifyUser);
router.delete('/changeInfo', user.deleteUser);

router.get('/manage/user', user.getAllUsers);
router.get('/manage/user/:uid', user.getUserInfos);
router.post('/manage/user/:uid', user.changeUserStatus);
router.delete('/manage/user/:uid', user.deleteUserByAdmin);


module.exports = router;
const express = require('express');
const router = express.Router();
const visitedSite = require('../controllers/visitedSite.js');

const verifyMiddleware = require('../middlewares/verify.js');

router.use('/location/:lid/user/:uid', verifyMiddleware.verifyLocationID,verifyMiddleware.verifyUserID);

router.put('/location/:lid/user/:uid', visitedSite.addVisitedSite);
router.delete('/location/:lid/user/:uid', visitedSite.removeVisitedSite);

module.exports = router;
const express = require('express');
const router = express.Router();
const visitedSite = require('../controllers/visitedSite.js');

const authMiddleware = require('../middlewares/auth.js');
const verifyMiddleware = require('../middlewares/verify.js');

router.use('/user/location', authMiddleware.verifyTokenPresence)
router.use('/user/location/:lid', verifyMiddleware.verifyLocationID);

router.get('/user/location', visitedSite.getVisitedSites);
router.put('/user/location/:lid', visitedSite.addVisitedSite);
router.delete('/user/location/:lid', visitedSite.removeVisitedSite);

module.exports = router;
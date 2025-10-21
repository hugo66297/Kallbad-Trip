const router = require('express').Router();

router.use(require('./bathingWater.js'));
router.use(require('./user.js'));
router.use(require('./review.js'));

module.exports = router;
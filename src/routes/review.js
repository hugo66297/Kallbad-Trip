const express = require('express');
const router = express.Router();
const review = require('../controllers/review.js');

const authMiddleware = require('../middlewares/auth.js');
const verifyMiddleware = require('../middlewares/verify.js');

router.use('/review/:id',verifyMiddleware.verifyID);

router.get('/review/:id', review.getReview);
router.post('/review/:id', authMiddleware.verifyTokenPresence, review.addReview);
router.put('/review/:id', authMiddleware.verifyTokenPresence, review.modifyReview);
router.delete('/review/:id', authMiddleware.verifyTokenPresence, review.deleteReview);

module.exports = router;
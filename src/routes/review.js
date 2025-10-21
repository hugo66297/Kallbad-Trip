const express = require('express');
const router = express.Router();
const review = require('../controllers/review.js');

const authMiddleware = require('../middlewares/auth.js');
const verifyMiddleware = require('../middlewares/verify.js');

router.use('/locations/:lid/reviews', verifyMiddleware.verifyLocationID);
router.use('/review/:rid',authMiddleware.verifyTokenPresence, verifyMiddleware.verifyReviewID);

router.get('/locations/:lid/reviews', review.getReview);
router.post('/locations/:lid/reviews', authMiddleware.verifyTokenPresence, review.addReview);

router.put('/review/:rid', review.modifyReview);
router.delete('/review/:rid', review.deleteReview);

module.exports = router;
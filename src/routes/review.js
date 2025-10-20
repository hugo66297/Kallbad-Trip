const express = require('express');
const router = express.Router();
const review = require('../controllers/review.js');

const authMiddleware = require('../middlewares/auth.js');
const verifyMiddleware = require('../middlewares/verify.js');

router.use('/locations/:lid/reviews', verifyMiddleware.verifyID);
router.use('/review/:id',authMiddleware.verifyTokenPresence, verifyMiddleware.verifyID);

router.get('/locations/:lid/reviews', review.getReview);
router.post('/locations/:lid/reviews', authMiddleware.verifyTokenPresence, review.addReview);

router.put('/review/:id', review.modifyReview);
router.delete('/review/:id', review.deleteReview);

module.exports = router;
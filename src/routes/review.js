const express = require('express');
const router = express.Router();
const review = require('../controllers/review.js');

const authMiddleware = require('../middlewares/auth.js');
const activeMiddleware = require('../middlewares/active.js');
const verifyMiddleware = require('../middlewares/verify.js');

router.use('/locations/:lid/reviews', verifyMiddleware.verifyLocationID);
router.use('/review/:rid',authMiddleware.verifyTokenPresence, verifyMiddleware.verifyReviewID);
router.use('/manage/review/:rid', authMiddleware.verifyTokenPresence, authMiddleware.verifyTokenAdmin, verifyMiddleware.verifyReviewID);

router.get('/locations/:lid/reviews', review.getReview);
router.post('/locations/:lid/reviews', authMiddleware.verifyTokenPresence, activeMiddleware.verifyUserBan, review.addReview);

router.put('/review/:rid', activeMiddleware.verifyUserBan, review.modifyReview);
router.delete('/review/:rid', review.deleteReview);

router.get('/manage/review/:rid', review.getReviewByAdmin);
router.put('/manage/review/:rid', review.modifyReviewByAdmin);
router.delete('/manage/review/:rid', review.deleteReviewByAdmin);

module.exports = router;
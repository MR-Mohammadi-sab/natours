const router = require('express').Router({ mergeParams: true });

const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setUserTourIds,
  getReview,
} = require('../controllers/reviewController');

router.use(protect);
router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setUserTourIds, createReview);
// .post(protect, createReview);

router
  .route('/:id')
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .get(getReview);

module.exports = router;

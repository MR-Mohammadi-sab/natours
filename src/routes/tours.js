const express = require('express');

const {
  getTours,
  createTours,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getToursStates,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./review');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);
router
  .route('/')
  .get(getTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTours);
router.get('/tours-states', getToursStates);
router.get('/top-5-cheap', aliasTopTours);
router.get(
  '/monthly-plan/:year',
  protect,
  restrictTo('admin', 'lead-guide', 'guide'),
  getMonthlyPlan,
);
router.get('/tours-within/:distance/center/:latlng/unit/:unit', getToursWithin);
router.get('/distances/:latlng/unit/:unit', getDistances);
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour,
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;

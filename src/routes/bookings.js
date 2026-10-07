const router = require('express').Router();
const { protect, restrictTo } = require('../controllers/authController');
const {
  deleteBooking,
  getCheckoutSession,
  getAllBookings,
  createBooking,
  getBooking,
  updateBooking,
} = require('../controllers/bookingController');

router.use(protect);
router.get('/checkout-session/:tourId', getCheckoutSession);
router.use(restrictTo('admin', 'lead-guide'));
router.route('/').get(getAllBookings).post(createBooking);
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

module.exports = router;

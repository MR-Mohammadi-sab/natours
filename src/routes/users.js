const express = require('express');

const router = express.Router();

const {
  getAllUsers,
  // createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  getMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  verifyOTP,
  requireVerifiedEmail,
  sendVerificationOTP,
  loginLimiter,
  restrictTo,
  logout,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', loginLimiter, login);
// forgot password
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.use(protect);
router.patch('/update-password', updatePassword);
// verify
router.post('/verify-email', verifyOTP);
router.post('/send-verification-otp', sendVerificationOTP);
// me
router.patch('/update-me', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/delete-me', deleteMe);
router.get('/me', requireVerifiedEmail, getMe);
router.get('/logout', logout);
router.use(restrictTo('admin'));
router.route('/').get(getAllUsers);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

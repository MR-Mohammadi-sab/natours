const Review = require('../model/reviewModel');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

exports.getAllReviews = getAll(Review, 'reviess');

exports.getReview = getOne(Review, null, 'review');

exports.setUserTourIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.createReview = createOne(Review, 'review');

exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review, 'review');

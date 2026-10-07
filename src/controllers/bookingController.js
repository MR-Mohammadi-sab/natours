/* eslint-disable import/no-extraneous-dependencies */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../model/bookingModel');
const Tour = require('../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    allowed_payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?user=${req.user.id}&tour=${tour.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',

          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwO0wY2zmLQ-AFOwPUfj_GWNfC4AVxIUeIKEocoo0a9g&s=10',
            ],
          },

          unit_amount: Math.round(tour.price * 100),
        },

        quantity: 1,
      },
    ],
    // line_items: [
    //   {
    //     name: `${tour.name} Tour`,
    //     description: tour.summary,
    //     images: [
    //       'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwO0wY2zmLQ-AFOwPUfj_GWNfC4AVxIUeIKEocoo0a9g&s=10',
    //     ],
    //     amount: tour.price * 100,
    //     currency: 'usd',
    //     quantity: 1,
    //   },
    // ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createCheckoutBooking = catchAsync(async (req, res, next) => {
  const { price, tour, user } = req.query;
  if (!price && !tour && !user) return next();

  await Booking.create({ price, tour, user });
  return res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = getAll(Booking, 'bookings');
exports.getBooking = getOne(Booking, null, 'booking');
exports.createBooking = createOne(Booking, 'booking');
exports.updateBooking = updateOne(Booking, 'booking');
exports.deleteBooking = deleteOne(Booking);

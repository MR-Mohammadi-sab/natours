/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const hpp = require('hpp');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const AppError = require('./utils/appError');
const globalError = require('./controllers/errorController');
const { webhookCheckout } = require('./controllers/bookingController');

const app = express();
app.enable('trust proxy');
app.use(cors());
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://js.stripe.com',
          'https://*.stripe.com',
          'blob:', // برای لود شدن درست اسکریپت‌های مپ‌باکس
        ],
        frameSrc: [
          "'self'",
          'https://js.stripe.com',
          'https://hooks.stripe.com',
          'https://*.stripe.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://api.mapbox.com',
          'https://fonts.googleapis.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.mapbox.com',
          'https://*.stripe.com',
        ],

        connectSrc: [
          "'self'",
          'blob:',
          'https://*.natours-1-h0tv.onrender.com',
          'https://natours-1-h0tv.onrender.com',
          'wss://natours-1-h0tv.onrender.com:*', // اجازه به تمام وب‌ سوکت‌ های سرور رندر
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://js.stripe.com',
          'https://*.stripe.com',
        ],
        workerSrc: ["'self'", 'blob:'],
        upgradeInsecureRequests: [], // از تبدیل خودکار برخی لینک‌ها جلوگیری می‌کند
      },
    },
  }),
);

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const limiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this api. Please try again an hour later!',
});

app.use('/api', limiter);

app.post(
  'webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout,
);
app.use(express.json({ limit: '10kb' }));

app.use(cookieParser());
app.set('query parser', 'extended');
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// prevent query
app.use(mongoSanitize());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'price',
      'difficulty',
    ],
  }),
);

// app.use((req, res, next) => {
//   console.log('hello from middleWare');
//   next();
// });

// app.use((req, res, next) => {
//   req.requestAt = new Date().toISOString();
//   // console.log(req.cookies);

//   next();
// });

// app.get('/api/v1/tours',getTours );
// app.post('/api/v1/tours',createTours);
app.use('/', require('./routes/viewRoutes'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/tours', require('./routes/tours'));
app.use('/api/v1/reviews', require('./routes/review'));
app.use('/api/v1/bookings', require('./routes/bookings'));

app.use((req, res, next) => {
  // const error = new Error(`Can't find ${req.originalUrl} on this server`);
  // error.statusCode = 404;
  // error.status = 'fail';

  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalError);
module.exports = app;

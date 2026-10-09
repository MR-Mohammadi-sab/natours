const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../model/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('./handlerFactory');

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only image'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req?.files?.images || !req?.files?.imageCover) return next();
  const imageCoverFileName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`src/public/img/tours/${imageCoverFileName}`);
  req.body.imageCover = imageCoverFileName;
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`src/public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
  next();
});
exports.getTours = getAll(Tour, 'tours');

exports.getTour = getOne(
  Tour,
  {
    path: 'reviews',
  },
  'tour',
);

exports.createTours = createOne(Tour, 'tour');

exports.updateTour = updateOne(Tour, 'tour');

exports.deleteTour = deleteOne(Tour);

exports.aliasTopTours = catchAsync(async (req, res) => {
  // this way is expried
  // req.query.limit = 5;
  // req.query.sort = '-ratingsAverage,price';
  // console.log('hello from middleware.sdcsdcsdsd');
  // next();
  // try {
  const tours = await Tour.find().sort('-ratingsAverage price').limit(5);
  res.status(200).json({
    status: 'sucess',
    result: tours.length,
    data: {
      tours,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err.message,
  //   });
  // }
});
exports.getToursStates = catchAsync(async (req, res) => {
  const states = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatingsAverage: { $sum: '$ratingsQuantity' },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: -1 },
    },
    // { $match: { _id: { $ne: 'EASY' } } },
  ]);

  res.status(200).json({
    status: 'sucess',
    result: states.length,
    data: {
      states,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const { year } = req.params;
  const plans = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { month: 1 } },
    // { $limit: 6 },
  ]);

  res.status(200).json({
    status: 'sucess',
    result: plans.length,
    data: {
      plans,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',').map(Number);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }

  const radius =
    unit === 'mi' ? Number(distance) / 3963.2 : Number(distance) / 6378.1;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',').map(Number);
  const multiplier = unit === 'mi' ? 0.00062137 : 0.001;
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    { $project: { name: 1, distance: 1 } },
    // {
    //   $merge: {
    //     into: 'tours',
    //     whenMatched: 'merge',
    //     whenNotMatched: 'discard',
    //   },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

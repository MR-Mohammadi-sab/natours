const mongoose = require('mongoose');

// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal then 40 characters'],
      minLength: [10, 'A tour name must have mre or equal then 10 characters'],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1.0, 'Rating must be above 1.0'],
      max: [5.0, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message: 'Difficulty is either : easy , medium , difficult',
      },
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'The price should be bigger then discount ({VALUE})',
      },
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have image cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secrectTour: {
      type: Boolean,
      default: false,
    },
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeak').get(function () {
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre('save', function () {
  // console.log('Hello from mongo middleware');
  this.slug = slugify(this.name, { lower: true });
});

// tourSchema.pre('save', async function () {
//   const guides = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guides);
// });

// tourSchema.post('save', (doc) => {
//   console.log(doc);
// });

tourSchema.pre(/^find/, function () {
  this.find({ secrectTour: { $ne: true } });
  this.start = Date.now();
});
tourSchema.pre(/^find/, function () {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangeAt',
  });
});

// tourSchema.post(/^find/, function (docs) {
//   console.log(`take in milleSeconds ${Date.now() - this.start}`);
// });

// tourSchema.pre('aggregate', function () {
//   this.pipeline().unshift({ $match: { secrectTour: { $ne: true } } });
// });
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;

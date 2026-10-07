require('dotenv').config({
  path: '../../../config.env',
});
const { default: mongoose } = require('mongoose');
const fs = require('fs');
const Tour = require('../../model/tourModel');
const Review = require('../../model/reviewModel');
const User = require('../../model/userModel');

const tours = JSON.parse(fs.readFileSync('./tours.json'));
const users = JSON.parse(fs.readFileSync('./users.json'));
const reviews = JSON.parse(fs.readFileSync('./reviews.json'));

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
// const DB = process.env.DATABASE_LOCAL;

mongoose.connect(DB).then(() => {
  console.log('connected successfully');
});
async function createTours() {
  try {
    await Tour.create(tours);
    console.log('created successFully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
}
async function createUsers() {
  try {
    await User.create(users, {
      validateBeforeSave: false,
    });
    console.log('created successFully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
}
async function createReviews() {
  try {
    await Review.create(reviews);
    console.log('created successFully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
}
async function deleteTours() {
  try {
    await Tour.deleteMany();
    console.log('deleted successFully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
}
async function deleteUsers() {
  try {
    await User.deleteMany();
    console.log('deleted successFully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
}
async function deleteReviews() {
  try {
    await Review.deleteMany();
    console.log('deleted successFully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
}
if (process.argv[2] === '--import-tour') {
  createTours();
} else if (process.argv[2] === '--delete-tour') {
  deleteTours();
} else if (process.argv[2] === '--import-user') {
  createUsers();
} else if (process.argv[2] === '--delete-user') {
  deleteUsers();
} else if (process.argv[2] === '--import-review') {
  createReviews();
} else if (process.argv[2] === '--delete-review') {
  deleteReviews();
}

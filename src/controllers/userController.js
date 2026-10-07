/* eslint-disable import/no-extraneous-dependencies */
const multer = require('multer');
const sharp = require('sharp');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'src/public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`src/public/img/users/${req.file.filename}`);
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates. Please use this route {{ /update-password }}',
        400,
      ),
    );

  const { name, email } = req.body;
  if (!name && !email && !req.file)
    return next(
      new AppError(
        'You can only update this fields name , email and photo',
        400,
      ),
    );
  const updateBody = {};
  if (email) updateBody.email = email;
  if (name) updateBody.name = name;
  if (req.file) updateBody.photo = req.file.filename;
  const user = await User.findByIdAndUpdate(req.user._id, updateBody, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const me = await User.findById(req.user._id);
  res.status(200).json({
    status: 'success',
    data: { me },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = getAll(User, 'users');

exports.getUser = getOne(User, null, 'user');
// exports.createUser = createOne(User, 'user');
exports.updateUser = updateOne(User, 'user');
exports.deleteUser = deleteOne(User);

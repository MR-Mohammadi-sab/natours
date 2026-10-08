/* eslint-disable import/no-extraneous-dependencies */
const crypto = require('crypto');

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { default: rateLimit } = require('express-rate-limit');

const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

const cookieOptions = {
  maxAge: Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role = 'user' } = req.body;
  // try {
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
  });

  const token = signToken(newUser._id);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  res.cookie('jwt', token, cookieOptions);

  res.status(201).json({
    status: 'success',
    message: 'Account created. Please verify your email.',
    token,
    data: {
      user: newUser,
    },
  });
  //   const otp = newUser.createOTP();
  //   await newUser.save({ validateBeforeSave: false });
  // } catch (err) {
  //   await User.findByIdAndDelete(newUser?.id);
  //   return next(
  //     new AppError(
  //       'There was an error sending the code to the email. PLease try again .',
  //       500,
  //     ),
  //   );
  // }
});

exports.sendVerificationOTP = catchAsync(async (req, res, next) => {
  const { user } = req;

  if (user.emailVerified) {
    return res.status(400).json({
      status: 'fail',
      message: 'Email is already verified',
    });
  }

  try {
    const otp = user.createOTP();
    await user.save({ validateBeforeSave: false });
    await new Email().sendOTP(user, otp);

    res.status(200).json({
      status: 'success',
      message: 'Verification code sent',
    });
  } catch (err) {
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the code to the email. Please try again .',
        500,
      ),
    );
  }
});

exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { otp } = req.body;
  const { email } = req.user;

  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  const user = await User.findOne({
    email,
    emailVerificationOTP: hashedOTP,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user)
    return next(new AppError('Invalid or has expired verification code.', 400));

  user.emailVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully.',
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect password or email!', 401));

  const token = signToken(user._id);

  res.cookie('jwt', token, cookieOptions);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // maximum 5 requests
  message: {
    status: 'fail',
    veryAttempts: true,
    message: 'Too many login attempts. Please try again later.',
  },
});
exports.protect = catchAsync(async (req, res, next) => {
  // with cookie
  let token;
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // with header
  // if (
  //   req.headers.authorization &&
  //   req.headers.authorization.startsWith('Bearer')
  // ) {
  //   token = req.headers.authorization.split(' ')[1];
  // }
  if (!token)
    return next(
      new AppError('You are not loged in. Please log in to get access!', 401),
    );
  // id, iat , exp
  // decoded
  // the jwt.verify is sync but I need if it regect throw to catchAsync for that I put on promisify
  const { id, iat } = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );

  const currenthUser = await User.findById(id).select('+emailVerified');

  if (!currenthUser)
    return next(
      new AppError(
        'The user belonging to this token does not longer exist.',
        401,
      ),
    );
  if (currenthUser.changedPasswordAfter(iat))
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );

  // this is not a good idea
  // if (!currenthUser.verifyedEmail)
  //   return next(
  //     new AppError(
  //       'Your email was not verifyed. Please verify your email',
  //       401,
  //     ),
  //   );

  req.user = currenthUser;
  next();
});
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
exports.requireVerifiedEmail = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      status: 'fail',
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email first',
    });
  }

  next();
};
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action'),
        403,
      );

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email)
    return next(new AppError('You must enter your email', 401));
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError('There is not user with this email address.', 404),
    );

  const resetToken = user.createPasswordResetToken();
  user.save({ validateBeforeSave: false });

  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. try again later.',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = signToken(user._id);

  res.cookie('jwt', token, cookieOptions);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Incorrect password !', 401));
  }
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  const token = signToken(user._id);

  res.cookie('jwt', token, cookieOptions);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.logout = (req, res) => {
  res.clearCookie('jwt');

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  photo: {
    type: String,
    trim: true,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    trim: true,
    minLength: [8, 'Password must be more or equal then 8 character'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Password are not the same!',
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  emailVerified: {
    type: Boolean,
    defaul: false,
    select: false,
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationOTP: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
});
userSchema.pre('save', function () {
  if (!this.isModified('password') || this.isNew) return;

  this.passwordChangeAt = Date.now() - 1000;
});

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});
userSchema.methods.correctPassword = async function (
  cadidnatePassword,
  userPassword,
) {
  return await bcrypt.compare(cadidnatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangeAt) {
    const changeTimestamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10,
    );
    return JWTTimeStamp < changeTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.createOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000;

  return otp;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

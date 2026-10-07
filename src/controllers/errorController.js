const AppError = require('../utils/appError');

function handleCastError(err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}
function handleDuplicateFieldsDB(err) {
  let message;
  if (err.keyValue && err.keyValue.name) {
    message = `duplicate field : ${err.keyValue.name} exists already`;
  }
  if (err.keyValue && err.keyValue.tour && err.keyValue.user) {
    message = `duplicate field : ${err.keyValue.tour} ${err.keyValue.user} exists already`;
  }
  return new AppError(message, 400);
}
function handleValidatorError(err) {
  const errors = Object.values(err.errors).map((val) => val.message);
  return new AppError(`Invalid input data . ${errors.join('. /n ')}`, 400);
}

function handleJsonWebTokenError() {
  return new AppError('Invalid token. Please log in again', 401);
}

function handleTokenExpiredError() {
  return new AppError('Your token has expired! please log in again.', 401);
}

function setErrorProd(err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // console.error('Error ', err);

    res.status(500).json({
      status: 'error',
      message: 'something went wrong !',
    });
  }
}
function setErrorDev(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
}

module.exports = (err, req, res, next) => {
  //   console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    setErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = err;
    // invalid params or mongo id
    if (error.name === 'CastError') error = handleCastError(error);
    // duplicate key
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidatorError(error);
    if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    setErrorProd(error, res);
  }
};

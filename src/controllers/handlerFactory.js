const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findByIdAndDelete(id);
    if (!doc)
      return next(new AppError('The document with this id is not exists', 404));
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model, resourceName) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findByIdAndUpdate(id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!doc)
      return next(
        new AppError(`The ${resourceName} with this id not exists`, 404),
      );
    res.status(200).json({
      status: 'success',
      data: {
        [resourceName]: doc,
      },
    });
  });

exports.createOne = (Model, resourceName) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        [resourceName]: doc,
      },
    });
  });

exports.getOne = (Model, popOption, resourceName) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id);
    if (popOption) query = query.populate(popOption);
    const doc = await query;
    if (!doc)
      return next(
        new AppError(`The ${resourceName} with this id not exists`, 404),
      );
    res.status(200).json({
      status: 'sucess',
      data: {
        [resourceName]: doc,
      },
    });
  });

exports.getAll = (Model, resourceName) =>
  catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limiFields()
      .paginate();

    const docs = await features.query;
    // const docs = await features.query.explain();

    res.status(200).json({
      status: 'sucess',
      results: docs.length,
      data: {
        [resourceName]: docs,
      },
    });
  });

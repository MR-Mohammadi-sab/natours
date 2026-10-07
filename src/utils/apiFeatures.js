class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);
    // Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = JSON.parse(
      queryStr.replace(/\b(gte|gt|lte|lt|ne)\b/g, (match) => `$${match}`),
    );

    this.query = this.query.find(queryStr);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.replaceAll(',', ' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limiFields() {
    if (this.queryString.fields) {
      const limitingFields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(limitingFields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const { page = 1, limit: limitDoc = 100 } = this.queryString;
    const skip = (page - 1) * limitDoc;

    this.query = this.query.skip(skip).limit(limitDoc);

    return this;
  }
}

module.exports = APIFeatures;

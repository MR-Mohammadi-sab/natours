# 🏔️ Natours - Full-Stack Nature Tours Booking Application

Natours is a premium, fully-functional full-stack web application designed for a fictional nature tourism and adventure booking agency. This production-ready platform features a robust RESTful API, advanced data modeling, secure authentication, live payments, and dynamic server-side rendering.

## 🚀 Key Features

- **Authentication & Security:**
  - Full sign-up, login, logout, password reset, and update capabilities.
  - Secure authentication via JSON Web Tokens (JWT) stored in HTTP-only cookies.
  - Data sanitization against NoSQL injection and XSS attacks.
  - Rate limiting, HTTP parameter pollution prevention, and secure headers (Helmet).
- **Tour Management:**
  - Advanced filtering, sorting, limiting, and pagination capabilities.
  - Geospatial queries to find tours within a specific distance or radius.
  - Dynamic map rendering using Mapbox.
- **Booking & Payments:**
  - Real-time credit card processing using **Stripe Integration**.
  - Automatic creation of booking documents upon successful checkout.
- **Reviews & Ratings:**
  - Dynamic, interactive review and rating system.
  - Real-time calculation of average ratings and number of ratings for each tour.
- **User Dashboard:**
  - Personalized profiles where users can update details, change passwords, and view booked tours.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Sass (SCSS), JavaScript (ES6+), **Pug Templates** (Server-Side Rendering)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose (Advanced aggregation pipelines, data validation, geospatial indexes)
- **Payments:** Stripe API
- **Maps:** Mapbox API
- **Email:** Mailtrap (Development) / SendGrid (Production)

---

## ⚙️ Environment Variables Setup

To run this project locally, create a `config.env` (or `.env`) file in your root directory and add the following configurations:

```env
NODE_ENV=development
PORT=3000
DATABASE=your_mongodb_connection_string
DATABASE_PASSWORD=your_mongodb_password

JWT_SECRET=your_super_long_and_secret_jwt_string
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

EMAIL_USERNAME=your_mailtrap_username
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_FROM=hello@natours.io

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

---

## 🏃‍♂️ How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com
cd natours
```

### 2. Install dependencies

```bash
npm install
```

### 3. Import Development Data (Optional)

If you have a JSON file with sample tours/users data and want to seed your database:

```bash
# To import data:
node dev-data/data/import-dev-data.js --import

# To delete data:
node dev-data/data/import-dev-data.js --delete
```

### 4. Start the application

```bash
# For development (with nodemon):
npm run start:dev

# For production:
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action!

---

## 📄 License

This project is licensed under the MIT License.

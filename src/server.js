const mongoose = require('mongoose');

// process.on('uncaughtException', (err) => {
//   console.log('Uncaught Exception 💥 shutting down...');
//   console.log(`${err.name}  ${err.message}`);
//   process.exit(1);
// });

require('dotenv').config({
  path: './config.env',
});

const app = require('./app');

const port = process.env.PORT || 3000;

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
// const DB = process.env.DATABASE_LOCAL;

mongoose.connect(DB).then(() => console.log('Database connected successfully'));

const server = app.listen(port, () => {
  console.log(`server is runing on 127.0.0.1:${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandle rejection 💥 shutting down...');
  console.log(`${err.name}  ${err.message}`);
  server.close(() => process.exit(1));
});

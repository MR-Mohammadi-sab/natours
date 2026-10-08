/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const pug = require('pug');
const nodemailer = require('nodemailer');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Mohammad Asif <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(
      path.join(__dirname, `../views/email/${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    const options = {
      from: this.from,
      to: this.to,
      subject,
      // text: options.message,
      html,
    };

    await this.createTransport().sendMail(options);
  }

  async sendWelcome() {
    await this.send('welcome', 'welcome to natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 mins)',
    );
  }

  async sendOTP() {
    await this.send('OTP', 'Verify your email please!');
  }
};

// async function sendEmail(options) {
//   const transport = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   await transport.sendMail(
//     {
//       from: 'Mohammad Asif <asf423796@gmail.com>',
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//     },
//     // (error, info) => {
//     //   if (error) {
//     //     return console.log(error);
//     //   }
//     //   console.log('Message sent: %s', info.messageId);
//     // },
//   );
// }

// module.exports = sendEmail;

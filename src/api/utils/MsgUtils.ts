const fs = require('fs');

// configure for Slack
const { SLACK_WEBHOOK_URL } = require('../../config/vars');
const { IncomingWebhook } = require('@slack/client');
let incomingWebhook: any = null;
if (SLACK_WEBHOOK_URL) {
  incomingWebhook = new IncomingWebhook(SLACK_WEBHOOK_URL);
}

// configure for emailing
const { EMAIL_TEMPLATE_BASE, EMAIL_NODEMAILER, PASSWORD_EMAIL } = require('../../config/vars');

const handlebars = require('handlebars');

// load template file & inject data => return content with injected data.
const template = (fileName: string, data: any) => {
  const content = fs.readFileSync(EMAIL_TEMPLATE_BASE + fileName).toString();
  const inject = handlebars.compile(content);
  return inject(data);
};

// --------- Email Templates --------- //

export function welcomeEmail({ name, email }: { name: string; email: string }) {
  return {
    from: EMAIL_NODEMAILER,
    to: `${name} <${email}>`,
    subject: `Welcome!`,
    text: template('welcome.txt', { name, email }),
    html: template('welcome.html', { name, email })
  };
}

export function forgotPasswordEmail({ name, email, tempPass }: { name: string; email: string; tempPass: string }) {
  return {
    from: EMAIL_NODEMAILER,
    to: `${name} <${email}>`,
    subject: `Your one-time temporary password`,
    text: template('forgot-password.txt', { name, email, tempPass }),
    html: template('forgot-password.html', { name, email, tempPass })
  };
}
export function customEmail({ name, email, content, object }: { name: string; email: string; content: string; object: string }) {
  return {
    from: EMAIL_NODEMAILER,
    to: `${name} <${email}>`,
    subject: object,
    text: template('custom.txt', { name, email, content }),
    html: template('custom.html', { name, email, content })
  };
}

export function verifyYourAccount({ name, email, tempPass }: { name: string; email: string; tempPass: string }) {
  return {
    from: EMAIL_NODEMAILER,
    to: `${name} <${email}>`,
    subject: `verify Your Account`,
    text: template('verify-account.txt', { name, email, tempPass }),
    html: template('verify-account.html', { name, email, tempPass })
  };
}

// resetPswEmail, forgotPswEmail, etc.

// --------- Nodemailer and Mailgun setup --------- //
const nodemailer = require('nodemailer');
let emailClient: any = null;

emailClient = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_NODEMAILER,
    pass: PASSWORD_EMAIL
  }
});

export function sendEmail(data: any) {
  if (!emailClient) {
    return;
  }
  return new Promise((resolve, reject) => {
    emailClient
      ? emailClient.sendMail(data, (err: any, info: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(info);
        }
      })
      : '';
  });
}

// send slack message using incoming webhook url
// @example: slackWebhook('message')
export function slackWebhook(message: string) {
  incomingWebhook ? incomingWebhook.send(message) : '';
}

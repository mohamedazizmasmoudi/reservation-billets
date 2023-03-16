const serverless = require('serverless-http'); // Netlify

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, env, socketEnabled } = require('./config/vars');

const http = require('http'); // to use HTTPS, use: require('https') and the "options" with key, cert below.
const fs = require('fs');
const app = require('./config/express');
const mongoose = require('./config/mongoose');

mongoose.connect(); // open mongoose connection

// HTTPS options
const options = {};
const server = http.createServer(options, app);
const serve = server.listen(port, () => {
  console.info(`--- 🌟  Started (${env}) --- http://localhost:${port}`);
});

if (env === 'development') {
  // initialize test data once (admin@example.com)
  require('./api/utils/InitData');
}

/**
 * Exports express
 * @public
 */
module.exports = app;

module.exports.handler = serverless(app);

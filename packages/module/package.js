/* eslint-disable global-require */
if (process.env.NODE_ENV === 'PROD') {
	module.exports = require('./dist/index.js');
} else {
	module.exports = require('./src/index.js');
}

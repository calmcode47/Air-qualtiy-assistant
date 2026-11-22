const { createProxyHandler } = require('../../server/vercelProxy.cjs');

module.exports = createProxyHandler();

module.exports.config = { api: { bodyParser: false } };

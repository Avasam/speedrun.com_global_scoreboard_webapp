const proxyMiddleware = require('../../setupProxy.js')
const createProxyMiddleware = require('http-proxy-middleware')

module.exports = proxyMiddleware(createProxyMiddleware)

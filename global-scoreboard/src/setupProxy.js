const proxyMiddleware = require('../../setupProxy.js')
const proxy = require('http-proxy-middleware')

module.exports = proxyMiddleware(proxy.createProxyMiddleware)

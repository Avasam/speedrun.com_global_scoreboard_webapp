module.exports = (createProxyMiddleware) => (app) => {
  if (process.env.NODE_ENV === 'production') return
  const SERVER_PORT = '5000'
  const CLIENT_PORT = '3000'
  const proxyMiddleware = (req, res, next) =>
    createProxyMiddleware(['!/ws'], {
      target: `${req.protocol}://${req.hostname}:${SERVER_PORT}`,
      changeOrigin: true,
      logLevel: 'warn',
      ws: false,
    })(req, res, next)

  app.use('/api', proxyMiddleware)
  app.use('/assets', proxyMiddleware)
  app.listen(CLIENT_PORT)
}

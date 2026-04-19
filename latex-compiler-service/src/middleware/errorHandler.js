/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Global Error]', err);

  const statusCode = err.status || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({
    error: message,
    // Provide stack traces only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;

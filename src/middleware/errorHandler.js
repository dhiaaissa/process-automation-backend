/**
 * errorHandler.js
 * Centralized error-handling middleware for Express.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.path} → ${statusCode}: ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && err.stack
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = errorHandler;

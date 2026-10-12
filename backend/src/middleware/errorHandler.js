const logger = require('../utils/logger');

/**
 * Catch-all 404 handler for unmatched routes.
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Central error handler. Any error passed to next(err) ends up here.
 * Never leaks stack traces in production responses.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  if (statusCode >= 500 || !isOperational) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.message}\n${err.stack}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Something went wrong. Please try again later.',
    ...(err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV !== 'production' && !isOperational ? { stack: err.stack } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };

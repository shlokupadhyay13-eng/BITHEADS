/**
 * Custom operational error class for HTTP exceptions.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Middleware - forwards a formatted AppError to the global error handler.
 */
function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred on the server.';
  let details = undefined;

  // 1. Express body-parser malformed JSON error
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON payload provided in request body.';
  }

  // 2. Mongoose CastError (e.g. invalid ObjectId format)
  else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'CAST_ERROR';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // 3. Mongoose ValidationError
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed for one or more fields.';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // 4. Mongoose Duplicate Key Error (code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value '${val}' for unique field '${field}'.`;
  }

  // 5. Custom AppError instances
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = `HTTP_${err.statusCode}`;
    message = err.message;
  }

  // Log 5xx internal server errors
  if (statusCode >= 500) {
    console.error('[errorHandler 5xx]:', err);
  }

  const responseEnvelope = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {})
    }
  };

  res.status(statusCode).json(responseEnvelope);
}

module.exports = {
  AppError,
  notFound,
  errorHandler
};

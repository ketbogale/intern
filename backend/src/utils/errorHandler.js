/**
 * Centralized error handling utility
 * Provides safe error responses that don't expose system internals in production
 */

/**
 * Safe error response handler
 * @param {Object} res - Express response object
 * @param {Error} error - The error object
 * @param {string} message - User-friendly error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const handleError = (res, error, message = "Internal server error", statusCode = 500) => {
  // Log the full error for debugging (server-side only)
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Determine if we should expose error details
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const errorResponse = {
    success: false,
    error: message
  };

  // Only include error details in development mode
  if (isDevelopment) {
    errorResponse.details = error.message;
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Safe error response for async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped route handler with error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleError(res, error);
    });
  };
};

/**
 * Validation error handler
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 */
const handleValidationError = (res, message) => {
  res.status(400).json({
    success: false,
    error: message
  });
};

/**
 * Not found error handler
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
const handleNotFound = (res, resource = "Resource") => {
  res.status(404).json({
    success: false,
    error: `${resource} not found`
  });
};

/**
 * Unauthorized error handler
 * @param {Object} res - Express response object
 */
const handleUnauthorized = (res) => {
  res.status(401).json({
    success: false,
    error: "Authentication required"
  });
};

module.exports = {
  handleError,
  asyncHandler,
  handleValidationError,
  handleNotFound,
  handleUnauthorized
};

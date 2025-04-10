/**
 * Standardized success response handler
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} [statusCode=200] - HTTP status code
 * @returns {Object} Express response
 */
function successResponse(res, data, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data: data
    });
  }
  
  /**
   * Standardized error response handler
   * @param {Object} res - Express response object
   * @param {Error} error - Error object
   * @returns {Object} Express response
   */
  function errorResponse(res, error) {
    // Determine appropriate status code
    const statusCode = error.statusCode || 
      (error.name === 'ValidationError' ? 400 : 
      (error.name === 'UnauthorizedError' ? 401 : 500));
  
    return res.status(statusCode).json({
      success: false,
      error: {
        message: error.message,
        type: error.name
      }
    });
  }
  
  /**
   * Custom validation error class
   */
  class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
      this.statusCode = 400;
    }
  }
  
  module.exports = {
    successResponse,
    errorResponse,
    ValidationError
  };
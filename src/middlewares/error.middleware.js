import { ApiError } from "../utils/ApiError.js";

/**
 * Centralized Error Handling Middleware for Express
 * Catches all operational and unexpected errors and formats them into a uniform JSON response
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of our custom ApiError, standardize it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Resource not found with id: ${err.value}`;
    error = new ApiError(404, message);
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
    error = new ApiError(400, message);
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const duplicatedField = Object.keys(err.keyValue || {})[0] || "field";
    const message = `Duplicate value entered for ${duplicatedField}. Please use another value.`;
    error = new ApiError(409, message);
  }

  // Handle JWT Malformed / Invalid Error
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token. Please authenticate again.");
  }

  // Handle JWT Expired Error
  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token has expired. Please authenticate again.");
  }

  // Prepare standard JSON response
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || []
  };

  // Include stack trace only in development mode for debugging
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
export default errorHandler;

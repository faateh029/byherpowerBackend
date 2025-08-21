import { ApiError } from "../utils/apiError.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If it's not our custom ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, [], error.stack);
  }

  // Log error for debugging
  console.error(`Error ${error.statusCode}: ${error.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(error.stack);
  }

  // Handle specific MongoDB errors
  if (error.name === "CastError") {
    const message = "Invalid ID format";
    error = new ApiError(400, message);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field} already exists`;
    error = new ApiError(409, message);
  }

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors).map(val => val.message).join(", ");
    error = new ApiError(400, message);
  }

  if (error.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new ApiError(401, message);
  }

  if (error.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new ApiError(401, message);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    ...(error.errors.length > 0 && { errors: error.errors })
  };

  res.status(error.statusCode).json(response);
};

export { errorHandler };

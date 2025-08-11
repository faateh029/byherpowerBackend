// error.middleware.js

const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log error stack trace (you can replace with Winston or other logger)

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export default errorHandler;
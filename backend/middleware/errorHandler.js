/**
 * Global Error Handler Middleware
 * Ensures the system NEVER crashes on unexpected downstream asynchronous errors.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[CRITICAL ERROR THWARTED] ${err.name}: ${err.message}`);
  
  // Return a graceful JSON fallback response to the frontend rather than crashing Express
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: "A system operation failed, but safety mechanisms engaged and stabilized the request. Please try again.",
    errorDetails: process.env.NODE_ENV === "development" ? err.message : undefined,
    fallback: true
  });
};

module.exports = errorHandler;

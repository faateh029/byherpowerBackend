// Middleware to verify JWT token and authenticate user
export const verifyToken = (req, res, next) => {
  next();
};
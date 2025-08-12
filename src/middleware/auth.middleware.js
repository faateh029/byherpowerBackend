import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

// Middleware to verify JWT token and authenticate user
export const verifyToken = (req, res, next) => {
  try {
    const headerToken = req.headers.authorization || req.headers.Authorization;

    if (!headerToken || !headerToken.startsWith("Bearer ")) {
      logger.warn("JWT verification failed: Missing or invalid token format");
      throw new Error("Authorization token missing or format invalid");
    }

    const token = headerToken.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn(`JWT verification failed: ${err.message}`);
        throw new Error("Invalid or expired token");
      }

      req.user = decoded; // Attach user data to request
      logger.info(`JWT verified successfully for user ID: ${decoded.id}`);
      next();
    });

  } catch (error) {
    next(error);
  }
};

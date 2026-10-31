import { USER_ROLES } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to restrict access to administrators only
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    return next(
      new ApiError(403, "Access denied. Administrator privileges required for this action.")
    );
  }

  next();
};

/**
 * Flexible middleware to authorize specific user roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'seller')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Role '${req.user?.role || "guest"}' is not authorized to access this resource`
        )
      );
    }
    next();
  };
};

export default isAdmin;

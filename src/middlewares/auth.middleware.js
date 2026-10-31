import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to verify JWT Access Token and authenticate requests
 * Token can be sent in either:
 * 1. HTTP-Only Cookie: "accessToken"
 * 2. Authorization Header: "Bearer <accessToken>"
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request - Access token is missing");
    }

    // Verify token using secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch user from DB, excluding sensitive credentials
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid access token - User does not exist");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Account has been deactivated. Please contact support.");
    }

    // Attach authenticated user to request object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired access token");
  }
});

export default verifyJWT;

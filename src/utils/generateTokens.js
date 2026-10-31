import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

/**
 * Helper to generate and persist JWT Access and Refresh tokens
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found for token generation");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token in database for session tracking and revocation
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while generating access and refresh tokens"
    );
  }
};

export default generateAccessAndRefreshTokens;

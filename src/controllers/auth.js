import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import { generateAccessAndRefreshTokens } from "../utils/generateTokens.js";

// Cookie security options
const cookieOptions = {
  httpOnly: true, // Prevents JavaScript from reading the cookie (protects against XSS)
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict"
};

/**
 * @desc    Register a new user account
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password, phoneNumber, phone, role } = req.body;

  // 1. Validation: Ensure required fields are not empty
  if (!fullName?.trim() || !username?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, "Full Name, Username, Email, and Password are all required");
  }

  // 2. Check if user already exists with either email or username
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // 3. Handle Avatar file upload if provided
  let avatarUrl = "";
  const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;

  if (avatarLocalPath) {
    const avatarUpload = await uploadOnCloudinary(avatarLocalPath, "users/avatars");
    if (avatarUpload) {
      avatarUrl = avatarUpload.secure_url || avatarUpload.url;
    }
  }

  // 4. Create user document in MongoDB
  const user = await User.create({
    fullName: fullName.trim(),
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    password, // will be automatically hashed by pre("save") in user.model.js
    phoneNumber: (phoneNumber || phone || "").trim(),
    phone: (phoneNumber || phone || "").trim(),
    avatar: avatarUrl,
    role: role === "admin" ? "admin" : "user"
  });

  // 5. Generate authentication tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // 6. Fetch sanitized created user (excluding password and refreshToken)
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        {
          user: createdUser,
          accessToken,
          refreshToken
        },
        "User registered successfully"
      )
    );
});

/**
 * @desc    Log in user with Email, Username, or Phone Number + Password
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, phone, phoneNumber, identifier, password } = req.body;

  // Allow login by identifier (email/username/phone) or specific fields
  const loginIdentifier = identifier || email || username || phone || phoneNumber;

  if (!loginIdentifier || !password) {
    throw new ApiError(400, "Username/Email/Phone and Password are required for login");
  }

  // 1. Find user by either email, username, or phone
  const user = await User.findOne({
    $or: [
      { email: loginIdentifier.toLowerCase() },
      { username: loginIdentifier.toLowerCase() },
      { phoneNumber: loginIdentifier },
      { phone: loginIdentifier }
    ]
  });

  if (!user) {
    throw new ApiError(404, "Invalid credentials - User does not exist");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Please contact support.");
  }

  // 2. Validate Password with bcrypt comparison
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials - Incorrect password");
  }

  // 3. Generate Access and Refresh Tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // 4. Retrieve user object without sensitive secrets
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});

/**
 * @desc    Log out user, invalidate refreshToken, and clear cookies
 * @route   POST /api/v1/auth/logout
 * @access  Private (Requires JWT)
 */
const logoutUser = asyncHandler(async (req, res) => {
  // Clear refresh token from database so it can no longer be used
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * @desc    Generate a new access token using a valid refresh token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized - Refresh token is missing");
  }

  try {
    // 1. Verify the refresh token signature
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // 2. Find user
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token - User not found");
    }

    // 3. Check if token matches the one stored in DB
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or has been revoked");
    }

    // 4. Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired refresh token");
  }
});

/**
 * @desc    Get currently logged-in user details
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser
};


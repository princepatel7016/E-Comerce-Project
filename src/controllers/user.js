import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import { registerUser as signupUser, loginUser, logoutUser } from "./auth.js";

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetched successfully"));
});

/**
 * @desc    Update user profile details (fullName, phoneNumber, avatar)
 * @route   PATCH /api/v1/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, phone } = req.body;
  const newPhone = phoneNumber || phone;

  const updateFields = {};
  if (fullName?.trim()) updateFields.fullName = fullName.trim();
  if (newPhone?.trim()) {
    updateFields.phoneNumber = newPhone.trim();
    updateFields.phone = newPhone.trim();
  }

  // Handle avatar update if new image file uploaded
  const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;
  if (avatarLocalPath) {
    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath, "users/avatars");
    if (uploadedAvatar) {
      updateFields.avatar = uploadedAvatar.secure_url || uploadedAvatar.url;
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

/**
 * @desc    Change user password
 * @route   PATCH /api/v1/users/change-password
 * @access  Private
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are both required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  const user = await User.findById(req.user._id);

  // Verify old password
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password. Please enter your correct current password.");
  }

  // Set new password (the pre('save') hook will hash it)
  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export {
  getUserProfile,
  updateUserProfile,
  changeCurrentPassword,
  signupUser,
  loginUser,
  logoutUser
};

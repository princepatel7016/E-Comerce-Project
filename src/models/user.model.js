import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { USER_ROLES } from "../constants/index.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"]
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: ""
    },

    phone: {
      // Backward-compatible alias for phone number
      type: String,
      trim: true,
      default: ""
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"]
    },

    avatar: {
      type: String, // Cloudinary URL
      default: ""
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    isPhoneVerified: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    },

    refreshToken: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save hook: Hash password with bcrypt before saving to MongoDB
 */
userSchema.pre("save", async function (next) {
  // If password was not modified, don't re-hash it
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/**
 * Method to check if entered password matches hashed password in DB
 */
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * Method to generate short-lived JWT Access Token
 */
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d"
    }
  );
};

/**
 * Method to generate long-lived JWT Refresh Token
 */
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d"
    }
  );
};

// Aliases for backward compatibility with previous spelling
userSchema.methods.genrateAccessToken = userSchema.methods.generateAccessToken;
userSchema.methods.genrateRefreshToken = userSchema.methods.generateRefreshToken;

export const User = mongoose.model("User", userSchema);
export default User;

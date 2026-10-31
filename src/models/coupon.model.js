import mongoose from "mongoose";
import { COUPON_TYPES } from "../constants/index.js";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },

    discountType: {
      type: String,
      enum: Object.values(COUPON_TYPES),
      default: COUPON_TYPES.PERCENTAGE
    },

    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"]
    },

    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    maximumDiscount: {
      type: Number,
      default: null, // Cap limit for percentage discount
      min: 0
    },

    expiryDate: {
      type: Date,
      required: [true, "Coupon expiry date is required"]
    },

    usageLimit: {
      type: Number,
      default: 100,
      min: 1
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Helper method to check if coupon is valid for a given order amount
couponSchema.methods.isValid = function (subtotal) {
  const isExpired = new Date() > new Date(this.expiryDate);
  const isLimitReached = this.usedCount >= this.usageLimit;
  const isMinAmountMet = subtotal >= this.minimumOrderAmount;

  return this.isActive && !isExpired && !isLimitReached && isMinAmountMet;
};

// Helper method to calculate discount amount
couponSchema.methods.calculateDiscount = function (subtotal) {
  let discount = 0;
  if (this.discountType === COUPON_TYPES.PERCENTAGE) {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maximumDiscount && discount > this.maximumDiscount) {
      discount = this.maximumDiscount;
    }
  } else {
    discount = this.discountValue;
  }
  return Math.min(discount, subtotal);
};

export const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;

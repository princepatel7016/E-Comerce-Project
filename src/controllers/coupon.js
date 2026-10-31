import { Coupon } from "../models/coupon.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Create a new discount coupon
 * @route   POST /api/v1/coupons
 * @access  Private/Admin
 */
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    minimumOrderAmount,
    maximumDiscount,
    expiryDate,
    usageLimit
  } = req.body;

  if (!code || !discountValue || !expiryDate) {
    throw new ApiError(400, "Coupon code, discount value, and expiry date are required");
  }

  const existingCoupon = await Coupon.findOne({
    code: code.trim().toUpperCase()
  });

  if (existingCoupon) {
    throw new ApiError(409, "A coupon with this code already exists");
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    discountType: discountType || "percentage",
    discountValue: Number(discountValue),
    minimumOrderAmount: minimumOrderAmount ? Number(minimumOrderAmount) : 0,
    maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
    expiryDate: new Date(expiryDate),
    usageLimit: usageLimit ? Number(usageLimit) : 100
  });

  return res
    .status(201)
    .json(new ApiResponse(201, coupon, "Coupon created successfully"));
});

/**
 * @desc    Get all coupons
 * @route   GET /api/v1/coupons
 * @access  Private/Admin
 */
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, coupons, "Coupons fetched successfully"));
});

/**
 * @desc    Validate a coupon code and calculate discount
 * @route   POST /api/v1/coupons/validate
 * @access  Private
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code || subtotal === undefined) {
    throw new ApiError(400, "Coupon code and order subtotal are required");
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

  if (!coupon || !coupon.isActive) {
    throw new ApiError(404, "Invalid or inactive coupon code");
  }

  if (new Date() > new Date(coupon.expiryDate)) {
    throw new ApiError(400, "This coupon has expired");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "This coupon's usage limit has been reached");
  }

  const numSubtotal = Number(subtotal);
  if (numSubtotal < coupon.minimumOrderAmount) {
    throw new ApiError(
      400,
      `Minimum order amount of ₹${coupon.minimumOrderAmount} is required to apply this coupon.`
    );
  }

  const discount = coupon.calculateDiscount(numSubtotal);
  const newTotal = numSubtotal - discount;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        subtotal: numSubtotal,
        finalAmount: newTotal
      },
      "Coupon applied successfully!"
    )
  );
});

/**
 * @desc    Delete a coupon
 * @route   DELETE /api/v1/coupons/:couponId
 * @access  Private/Admin
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const coupon = await Coupon.findByIdAndDelete(couponId);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Coupon deleted successfully"));
});

export {
  createCoupon,
  getAllCoupons,
  validateCoupon,
  deleteCoupon
};


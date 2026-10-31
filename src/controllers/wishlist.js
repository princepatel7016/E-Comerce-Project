import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Get user's wishlist
 * @route   GET /api/v1/wishlist
 * @access  Private
 */
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: "products",
    select: "name slug thumbnail price discountPrice stock ratings numReviews"
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist fetched successfully"));
});

/**
 * @desc    Add product to wishlist
 * @route   POST /api/v1/wishlist/:productId
 * @access  Private
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Use $addToSet to ensure no duplicate products are added
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: product._id } },
    { new: true, upsert: true }
  ).populate({
    path: "products",
    select: "name slug thumbnail price discountPrice stock ratings"
  });

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Product added to wishlist"));
});

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/v1/wishlist/:productId
 * @access  Private
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Use $pull to remove product from array
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: productId } },
    { new: true }
  ).populate({
    path: "products",
    select: "name slug thumbnail price discountPrice stock ratings"
  });

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Product removed from wishlist"));
});

/**
 * @desc    Clear entire wishlist
 * @route   DELETE /api/v1/wishlist
 * @access  Private
 */
const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $set: { products: [] } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist cleared successfully"));
});

export {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};


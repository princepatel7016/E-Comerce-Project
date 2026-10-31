import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper function to recalculate product's average rating and total reviews count
const recalculateProductRatings = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const totalReviews = reviews.length;

  let averageRating = 0;
  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    averageRating = Number((sum / totalReviews).toFixed(1));
  }

  await Product.findByIdAndUpdate(productId, {
    ratings: averageRating,
    numReviews: totalReviews
  });
};

/**
 * @desc    Submit a review for a purchased product
 * @route   POST /api/v1/reviews/:productId
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new ApiError(400, "Rating must be a number between 1 and 5");
  }

  if (!comment?.trim()) {
    throw new ApiError(400, "Review comment cannot be empty");
  }

  // 1. Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // 2. Flipkart Rule: Verify that user actually ordered this product
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    "items.product": productId,
    orderStatus: { $in: ["Confirmed", "Processing", "Shipped", "Delivered"] }
  });

  if (!hasPurchased) {
    throw new ApiError(
      403,
      "Only verified buyers who have purchased this product can submit a review."
    );
  }

  // 3. Verify user hasn't already submitted a review
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId
  });

  if (existingReview) {
    throw new ApiError(
      400,
      "You have already submitted a review for this product. You can update or delete your existing review."
    );
  }

  // 4. Create review document
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating: numRating,
    comment: comment.trim()
  });

  // 5. Recalculate average rating for product
  await recalculateProductRatings(productId);

  await review.populate("user", "fullName avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review submitted successfully"));
});

/**
 * @desc    Get all reviews for a product
 * @route   GET /api/v1/reviews/:productId
 * @access  Public
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId })
    .populate("user", "fullName avatar")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: reviews.length, reviews },
        "Product reviews fetched successfully"
      )
    );
});

/**
 * @desc    Delete a review
 * @route   DELETE /api/v1/reviews/:reviewId
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Only review author or admin can delete
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not authorized to delete this review");
  }

  const productId = review.product;
  await Review.findByIdAndDelete(reviewId);

  // Recalculate product rating after deletion
  await recalculateProductRatings(productId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

export {
  createReview,
  getProductReviews,
  deleteReview
};


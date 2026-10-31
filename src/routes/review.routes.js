import { Router } from "express";
import {
  createReview,
  getProductReviews,
  deleteReview
} from "../controllers/review.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public: Anyone can read product reviews
router.get("/:productId", getProductReviews);

// Protected: Only authenticated customers can post or delete reviews
router.post("/:productId", verifyJWT, createReview);
router.delete("/:reviewId", verifyJWT, deleteReview);

export default router;

import { Router } from "express";
import {
  createCoupon,
  getAllCoupons,
  validateCoupon,
  deleteCoupon
} from "../controllers/coupon.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

// Validate coupon during checkout (Customer)
router.post("/validate", verifyJWT, validateCoupon);

// Admin-only coupon management
router.post("/", verifyJWT, isAdmin, createCoupon);
router.get("/", verifyJWT, isAdmin, getAllCoupons);
router.delete("/:couponId", verifyJWT, isAdmin, deleteCoupon);

export default router;

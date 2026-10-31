import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getAllOrders,
  updateOrderStatus
} from "../controllers/admin.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

// Protect all admin routes
router.use(verifyJWT, isAdmin);

// Dashboard metrics
router.get("/dashboard", getDashboardStats);

// User administration
router.get("/users", getAllUsers);
router.patch("/users/:userId/status", toggleUserStatus);

// Order administration
router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);

export default router;

import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder
} from "../controllers/order.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All order operations require authentication
router.use(verifyJWT);

router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/:orderId", getOrderById);
router.patch("/:orderId/cancel", cancelOrder);

export default router;

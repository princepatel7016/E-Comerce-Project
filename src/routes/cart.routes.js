import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from "../controllers/cart.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All cart operations require authentication
router.use(verifyJWT);

router.route("/").get(getCart).post(addToCart).delete(clearCart);
router.route("/:productId").patch(updateCartItemQuantity).delete(removeCartItem);

export default router;

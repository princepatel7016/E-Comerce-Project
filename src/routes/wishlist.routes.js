import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} from "../controllers/wishlist.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All wishlist operations require authentication
router.use(verifyJWT);

router.route("/").get(getWishlist).delete(clearWishlist);
router.route("/:productId").post(addToWishlist).delete(removeFromWishlist);

export default router;

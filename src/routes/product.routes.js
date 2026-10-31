import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getRelatedProducts
} from "../controllers/product.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:productId", getProductById);
router.get("/:productId/related", getRelatedProducts);

// Admin-only routes
router.post("/", verifyJWT, isAdmin, upload.array("images", 5), createProduct);
router.patch("/:productId", verifyJWT, isAdmin, upload.array("images", 5), updateProduct);
router.delete("/:productId", verifyJWT, isAdmin, deleteProduct);

export default router;

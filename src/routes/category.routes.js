import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryByIdOrSlug,
  updateCategory,
  deleteCategory
} from "../controllers/category.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:idOrSlug", getCategoryByIdOrSlug);

// Admin-only routes
router.post("/", verifyJWT, isAdmin, upload.single("image"), createCategory);
router.patch("/:categoryId", verifyJWT, isAdmin, upload.single("image"), updateCategory);
router.delete("/:categoryId", verifyJWT, isAdmin, deleteCategory);

export default router;

import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  changeCurrentPassword
} from "../controllers/user.js";
import { registerUser, loginUser } from "../controllers/auth.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Backward compatibility with previous signup & login endpoints
router.post("/signup", upload.single("avatar"), registerUser);
router.post("/login", loginUser);

// User profile management (Protected)
router.get("/profile", verifyJWT, getUserProfile);
router.patch("/profile", verifyJWT, upload.single("avatar"), updateUserProfile);
router.patch("/change-password", verifyJWT, changeCurrentPassword);

export default router;
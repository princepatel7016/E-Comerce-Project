import { Router } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

/**
 * @route   GET /api/v1/healthcheck
 * @desc    Check server health and uptime
 * @access  Public
 */
router.get("/", (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "UP",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      },
      "Flipkart E-Commerce Backend is healthy and running smoothly"
    )
  );
});

export default router;

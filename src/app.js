import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";

// Routes imports
import healthcheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import categoryRouter from "./routes/category.routes.js";
import productRouter from "./routes/product.routes.js";
import addressRouter from "./routes/address.routes.js";
import cartRouter from "./routes/cart.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import orderRouter from "./routes/order.routes.js";
import reviewRouter from "./routes/review.routes.js";
import couponRouter from "./routes/coupon.routes.js";
import adminRouter from "./routes/admin.routes.js";

const app = express();

/**
 * Global Middlewares Configuration
 */

// Enable CORS with credentials support for frontend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
  })
);

// Body Parsers: Limit size to 16kb to prevent payload DoS attacks
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static assets from public directory
app.use(express.static("public"));

// Parse HTTP cookies from incoming requests
app.use(cookieParser());

/**
 * Flipkart-Inspired REST API Routes Mount Points
 */
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/admin", adminRouter);

/**
 * 404 Fallback Handler for undefined routes
 */
app.use((req, res, next) => {
  next(
    new ApiError(
      404,
      `Cannot ${req.method} ${req.originalUrl} - Route not found on this server`
    )
  );
});

/**
 * Centralized Error Handling Middleware (must be registered last)
 */
app.use(errorHandler);

export { app };
export default app;

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";

// Routes imports
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();

/**
 * Global Middlewares Configuration
 */

// Enable CORS with credentials support
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
  })
);

// Body Parsers: Limit size to prevent DoS payload attacks
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static assets from public directory
app.use(express.static("public"));

// Parse cookies from incoming requests
app.use(cookieParser());

/**
 * API Routes Mount Point
 */
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);

/**
 * 404 Fallback Handler for undefined routes
 */
app.use((req, res, next) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Route not found on this server`));
});

/**
 * Centralized Error Handling Middleware (must be after all routes)
 */
app.use(errorHandler);

export { app };
export default app;

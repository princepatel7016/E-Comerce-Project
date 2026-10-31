import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";

// Load environment variables from .env file
dotenv.config({
  path: "./.env"
});

const PORT = process.env.PORT || 8000;

/**
 * Initialize Database Connection and Start HTTP Server
 */
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Flipkart E-Commerce Server is running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/healthcheck`);
      console.log(`===============================================`);
    });

    server.on("error", (error) => {
      console.error(" Server encounter error:", error);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed!", error);
    process.exit(1);
  });

// Handle unhandled Promise rejections
process.on("unhandledRejection", (err) => {
  console.error(" UNHANDLED REJECTION! Shutting down gracefully...", err);
});

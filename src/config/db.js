import mongoose from "mongoose";
import { DB_NAME } from "../constants/index.js";

/**
 * Connect to MongoDB database
 * Uses Mongoose with connection pooling and error listeners
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Connect with database name appended if not present
    const connectionInstance = await mongoose.connect(`${mongoUri.replace(/\/$/, "")}/${DB_NAME}`);

    console.log(`\n MongoDB Connected! DB HOST: ${connectionInstance.connection.host}`);
    console.log(` Connected to Database: ${connectionInstance.connection.name}`);

    // Monitor MongoDB connection events
    mongoose.connection.on("error", (err) => {
      console.error(" MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn(" MongoDB connection disconnected.");
    });

    return connectionInstance;
  } catch (error) {
    console.error(" MongoDB connection FAILED:", error.message);
    process.exit(1);
  }
};

export default connectDB;

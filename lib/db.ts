// lib/mongoose.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('❌ Missing environment variable: "MONGODB_URI"');
}

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "your-db-name",
    });

    isConnected = true;
    console.log("✅ MongoDB connected via Mongoose");
  } catch (err) {
    console.error("❌ Mongoose connection error:", err);
    throw err;
  }
};

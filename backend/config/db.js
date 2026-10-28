import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectDB() {
  if (!config.mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env at the repo root and fill in MONGODB_URI.",
    );
  }
  await mongoose.connect(config.mongoUri);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

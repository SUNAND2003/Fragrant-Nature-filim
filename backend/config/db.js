import dns from "node:dns";
import mongoose from "mongoose";
import { config } from "./env.js";

// On Windows, Node's default DNS resolver often fails SRV queries (querySrv ECONNREFUSED)
// with certain local DNS servers. Setting public DNS servers ensures Atlas SRV lookups work reliably.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom DNS cannot be set in the current environment
}

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

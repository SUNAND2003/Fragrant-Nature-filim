import app from "./app.js";
import { config } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";

async function main() {
  if (!config.mongoUri) {
    console.error(
      [
        "MONGODB_URI is not set.",
        "Copy .env.example to .env at the repo root and fill in MONGODB_URI,",
        "e.g. MONGODB_URI=mongodb://127.0.0.1:27017/fragrant-nature",
      ].join("\n"),
    );
    process.exit(1);
  }
  if (!process.env.JWT_SECRET?.trim()) {
    console.warn(
      "JWT_SECRET is not set — using an insecure development secret. Set it in .env before deploying.",
    );
  }

  try {
    await connectDB();
  } catch (err) {
    console.error(`Could not connect to MongoDB at ${config.mongoUri}: ${err.message}`);
    process.exit(1);
  }

  const storage = config.cloudinaryConfigured ? "cloudinary" : "local";
  const server = app.listen(config.port, "0.0.0.0", () => {
    console.log(
      `Fragrant Nature API listening on http://127.0.0.1:${config.port} (${storage} storage)`,
    );
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();

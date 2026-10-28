import "dotenv/config";

const trimmed = (value) => (value ?? "").trim();

const cloudinaryUrl = trimmed(process.env.CLOUDINARY_URL);
const cloudinary = {
  url: cloudinaryUrl,
  cloudName: trimmed(process.env.CLOUDINARY_CLOUD_NAME),
  apiKey: trimmed(process.env.CLOUDINARY_API_KEY),
  apiSecret: trimmed(process.env.CLOUDINARY_API_SECRET),
};

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: trimmed(process.env.MONGODB_URI),
  // Dev fallback so the server runs before .env is filled in; index.js warns when it's active.
  jwtSecret: trimmed(process.env.JWT_SECRET) || "fragrant-nature-dev-secret",
  corsOrigins: [
    "http://localhost:5173",
    "http://localhost:4173",
    ...trimmed(process.env.CORS_ORIGIN)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],
  cloudinary,
  cloudinaryConfigured:
    Boolean(cloudinaryUrl) ||
    Boolean(cloudinary.cloudName && cloudinary.apiKey && cloudinary.apiSecret),
  adminEmail: trimmed(process.env.ADMIN_EMAIL) || "admin",
  adminPassword: trimmed(process.env.ADMIN_PASSWORD) || "admin1234",
};

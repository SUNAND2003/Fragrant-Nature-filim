/**
 * Removes admin records other than the current `ADMIN_EMAIL`.
 *
 * Run it after changing the login name in `.env` + `npm run seed`, so a seed
 * under a new identifier doesn't leave the old account behind:
 *   node backend/scripts/remove-stale-admins.js
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { config } from "../config/env.js";
import Admin from "../models/Admin.js";

if (!config.mongoUri) {
  console.error("MONGODB_URI is not set — copy .env.example to .env first.");
  process.exit(1);
}

await mongoose.connect(config.mongoUri);

const keep = config.adminEmail.toLowerCase();
const admins = await Admin.find({}).select("email");

for (const admin of admins) {
  if (admin.email !== keep) {
    await Admin.deleteOne({ _id: admin._id });
    console.log(`Removed stale admin: ${admin.email}`);
  }
}

// Re-assert the current credentials so the login is guaranteed to match .env.
const passwordHash = await bcrypt.hash(config.adminPassword, 10);
await Admin.findOneAndUpdate(
  { email: keep },
  { $set: { name: "Admin", email: keep, passwordHash, role: "admin" } },
  { upsert: true },
);
console.log(`Admin account now: ${keep} (password from ADMIN_PASSWORD)`);
console.log("Remaining:", (await Admin.find({}).select("email")).map((a) => a.email).join(", "));

await mongoose.disconnect();

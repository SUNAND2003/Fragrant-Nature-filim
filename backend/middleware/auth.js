import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.admin = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function signAdmin(admin) {
  return jwt.sign(
    { sub: String(admin._id), email: admin.email, name: admin.name },
    config.jwtSecret,
    { expiresIn: "7d" },
  );
}

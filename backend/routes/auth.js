import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import Admin from "../models/Admin.js";
import { parse } from "../lib/validate.js";
import { requireAdmin, signAdmin } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  // Identifier rather than a strict email — an admin may sign in with a
  // username such as `admin` as well as a full address.
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

function adminView(admin) {
  return { id: String(admin._id), name: admin.name, email: admin.email };
}

router.post("/login", async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  // Identical response for unknown email and wrong password — don't leak which admins exist.
  if (!admin || !(await admin.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  return res.json({ token: signAdmin(admin), admin: adminView(admin) });
});

router.get("/me", requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.admin.sub);
  if (!admin) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ admin: adminView(admin) });
});

router.put("/password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = parse(passwordSchema, req.body);
  const admin = await Admin.findById(req.admin.sub);
  if (!admin) return res.status(401).json({ error: "Unauthorized" });
  if (!(await admin.comparePassword(currentPassword))) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }
  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  await admin.save();
  return res.json({ ok: true });
});

export default router;

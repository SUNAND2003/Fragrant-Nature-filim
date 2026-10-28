import { Router } from "express";
import { z } from "zod";
import Award from "../models/Award.js";
import { parse } from "../lib/validate.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const awardFields = {
  id: z.string().trim().min(1),
  festival: z.string().trim().min(1),
  award: z.string().trim().min(1),
  year: z.coerce.number().int().min(1900).max(2200),
  filmSlug: z.string().trim().min(1),
  category: z.enum(["Major Prize", "Selection", "Craft", "Audience"]),
  citation: z.string().trim().default(""),
};

const createSchema = z.object(awardFields);
const updateSchema = createSchema.partial();

router.get("/", async (req, res) => {
  const awards = await Award.find().sort({ createdAt: -1, _id: -1 });
  return res.json(awards);
});

router.post("/", requireAdmin, async (req, res) => {
  const body = parse(createSchema, req.body);
  const award = await Award.create(body);
  return res.status(201).json(award);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const body = parse(updateSchema, req.body);
  const award = await Award.findById(req.params.id);
  if (!award) return res.status(404).json({ error: "Award not found" });
  for (const key of Object.keys(body)) {
    award[key] = body[key];
  }
  await award.save();
  return res.json(award);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const award = await Award.findByIdAndDelete(req.params.id);
  if (!award) return res.status(404).json({ error: "Award not found" });
  return res.json({ ok: true });
});

export default router;

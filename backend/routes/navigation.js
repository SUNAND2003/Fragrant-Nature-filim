import { Router } from "express";
import { z } from "zod";
import Navigation from "../models/Navigation.js";
import { parse } from "../lib/validate.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const subcategoryField = z.object({
  _id: z.string().optional(),
  label: z.string().trim().min(1),
  to: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
});

const navFields = {
  label: z.string().trim().min(1),
  to: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
  subcategories: z.array(subcategoryField).optional().default([]),
};

const createSchema = z.object(navFields);
const updateSchema = createSchema.partial();
// Bulk reorder: ids in the order they should appear on the public menu.
const reorderSchema = z.object({ order: z.array(z.string()).min(1) });

async function listNavigation(includeHidden, res) {
  const filter = includeHidden ? {} : { visible: true };
  const items = await Navigation.find(filter).sort({ order: 1, createdAt: 1 });
  return res.json(items);
}

router.get("/", async (req, res, next) => {
  // Hidden entries are admin-only, same contract as drafts in news.
  if (req.query.all === "true") {
    return requireAdmin(req, res, () => listNavigation(true, res));
  }
  return listNavigation(false, res);
});

router.post("/", requireAdmin, async (req, res) => {
  const body = parse(createSchema, req.body);
  const item = await Navigation.create(body);
  return res.status(201).json(item);
});

router.put("/", requireAdmin, async (req, res) => {
  const { order } = parse(reorderSchema, req.body);
  // position = index in the array, so the menu re-orders atomically.
  await Promise.all(
    order.map((id, position) => Navigation.updateOne({ _id: id }, { $set: { order: position } })),
  );
  return listNavigation(true, res);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const body = parse(updateSchema, req.body);
  const item = await Navigation.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ error: "Navigation item not found" });
  return res.json(item);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const item = await Navigation.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: "Navigation item not found" });
  return res.json({ ok: true });
});

export default router;

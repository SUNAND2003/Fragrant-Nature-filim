import { Router } from "express";
import { z } from "zod";
import Gallery from "../models/Gallery.js";
import { parse } from "../lib/validate.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const galleryImageField = z.object({
  _id: z.string().optional(),
  url: z.string().trim().min(1),
  caption: z.string().trim().optional().default(""),
  order: z.coerce.number().int().default(0),
});

const galleryFields = {
  filmTitle: z.string().trim().min(1),
  filmSlug: z.string().trim().min(1),
  genre: z.string().trim().optional().default(""),
  year: z.coerce.number().int().default(new Date().getFullYear()),
  poster: z.string().trim().optional().default(""),
  images: z.array(galleryImageField).optional().default([]),
  order: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
};

const createSchema = z.object(galleryFields);
const updateSchema = createSchema.partial();
const reorderSchema = z.object({ order: z.array(z.string()).min(1) });

async function listGallery(includeHidden, res) {
  const filter = includeHidden ? {} : { visible: true };
  const items = await Gallery.find(filter).sort({ order: 1, createdAt: 1 });
  return res.json(items);
}

router.get("/", async (req, res) => {
  if (req.query.all === "true") {
    return requireAdmin(req, res, () => listGallery(true, res));
  }
  return listGallery(false, res);
});

router.get("/:id", async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Gallery item not found" });
  return res.json(item);
});

router.post("/", requireAdmin, async (req, res) => {
  const body = parse(createSchema, req.body);
  const item = await Gallery.create(body);
  return res.status(201).json(item);
});

router.put("/", requireAdmin, async (req, res) => {
  const { order } = parse(reorderSchema, req.body);
  await Promise.all(
    order.map((id, position) => Gallery.updateOne({ _id: id }, { $set: { order: position } })),
  );
  return listGallery(true, res);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const body = parse(updateSchema, req.body);
  const item = await Gallery.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ error: "Gallery item not found" });
  return res.json(item);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const item = await Gallery.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: "Gallery item not found" });
  return res.json({ ok: true });
});

export default router;

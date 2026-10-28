import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Film from "../models/Film.js";
import { badRequest, parse } from "../lib/validate.js";
import { uniqueSlug } from "../lib/slugify.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const HYDRATE = "name slug";

const subcategoryFields = {
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
};

const createSchema = z.object(subcategoryFields);
const updateSchema = createSchema.partial();

async function requireCategory(id) {
  const category = await Category.findById(id);
  if (!category) throw badRequest("Category not found");
  return category;
}

router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.category) {
    const category = await Category.findOne({
      $or: [
        { slug: req.query.category },
        ...(mongoose.isValidObjectId(req.query.category) ? [{ _id: req.query.category }] : []),
      ],
    });
    if (!category) return res.json([]);
    filter.category = category._id;
  }
  const subcategories = await Subcategory.find(filter)
    .sort({ order: 1, name: 1 })
    .populate("category", HYDRATE);
  return res.json(subcategories);
});

router.post("/", requireAdmin, async (req, res) => {
  const body = parse(createSchema, req.body);
  const category = await requireCategory(body.category);
  // Slugs are unique per parent category.
  const slug = await uniqueSlug(body.slug ?? body.name, (candidate) =>
    Subcategory.exists({ slug: candidate, category: category._id }),
  );
  const subcategory = await Subcategory.create({
    name: body.name,
    slug,
    category: category._id,
    order: body.order,
  });
  await subcategory.populate("category", HYDRATE);
  return res.status(201).json(subcategory);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const body = parse(updateSchema, req.body);
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });
  const category = body.category !== undefined ? await requireCategory(body.category) : null;
  if (category) subcategory.category = category._id;
  if (body.slug !== undefined) {
    subcategory.slug = await uniqueSlug(body.slug, (candidate) =>
      Subcategory.exists({
        slug: candidate,
        category: subcategory.category,
        _id: { $ne: subcategory._id },
      }),
    );
  }
  for (const key of Object.keys(body)) {
    if (key === "slug" || key === "category") continue;
    subcategory[key] = body[key];
  }
  await subcategory.save();
  await subcategory.populate("category", HYDRATE);
  return res.json(subcategory);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
  if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });
  const result = await Film.updateMany(
    { subcategories: subcategory._id },
    { $pull: { subcategories: subcategory._id } },
  );
  return res.json({ ok: true, unlinked: result.modifiedCount });
});

export default router;

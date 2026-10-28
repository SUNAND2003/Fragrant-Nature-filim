import { Router } from "express";
import { z } from "zod";
import Category from "../models/Category.js";
import Film from "../models/Film.js";
import Subcategory from "../models/Subcategory.js";
import { parse } from "../lib/validate.js";
import { uniqueSlug } from "../lib/slugify.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const categoryFields = {
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().default(""),
  accent: z.string().trim().default(""),
  order: z.coerce.number().int().default(0),
};

const createSchema = z.object(categoryFields);
const updateSchema = createSchema.partial();

router.get("/", async (req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 });
  return res.json(categories);
});

router.post("/", requireAdmin, async (req, res) => {
  const body = parse(createSchema, req.body);
  const slug = await uniqueSlug(body.slug ?? body.name, (candidate) =>
    Category.exists({ slug: candidate }),
  );
  const category = await Category.create({ ...body, slug });
  return res.status(201).json(category);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const body = parse(updateSchema, req.body);
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found" });
  // Slug changes only when explicitly sent — a rename must not break existing film links.
  if (body.slug !== undefined) {
    category.slug = await uniqueSlug(body.slug, (candidate) =>
      Category.exists({ slug: candidate, _id: { $ne: category._id } }),
    );
  }
  for (const key of Object.keys(body)) {
    if (key === "slug") continue;
    category[key] = body[key];
  }
  await category.save();
  return res.json(category);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found" });
  // Detach the category from films, and clean up its subcategories so no film
  // is left pointing at a subcategory whose parent no longer exists.
  const subIds = (await Subcategory.find({ category: category._id }).select("_id")).map(
    (doc) => doc._id,
  );
  const unlinked = (await Film.updateMany({ category: category._id }, { $set: { category: null } }))
    .modifiedCount;
  if (subIds.length) {
    await Film.updateMany(
      { subcategories: { $in: subIds } },
      { $pull: { subcategories: { $in: subIds } } },
    );
    await Subcategory.deleteMany({ category: category._id });
  }
  return res.json({ ok: true, unlinked });
});

export default router;

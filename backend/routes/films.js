import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Film from "../models/Film.js";
import { boolish, badRequest, parse } from "../lib/validate.js";
import { uniqueSlug } from "../lib/slugify.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const HYDRATE = "name slug";

const filmFields = {
  slug: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  director: z.string().trim().min(1),
  year: z.coerce.number().int().min(1888).max(2200),
  genre: z.string().trim().min(1),
  runtime: z.string().trim().default(""),
  rating: z.string().trim().default(""),
  poster: z.string().trim().default(""),
  posterPublicId: z.string().trim().default(""),
  tagline: z.string().trim().default(""),
  synopsis: z.string().trim().default(""),
  cast: z.array(z.string().trim()).default([]),
  status: z.enum(["now", "upcoming"]).default("now"),
  release: z.string().trim().default(""),
  laurels: z.array(z.string().trim()).default([]),
  accent: z.string().trim().default(""),
  trailer: z.string().trim().default(""),
  featured: boolish.default(false),
  category: z.union([z.string().trim(), z.null()]).optional(),
  subcategories: z.array(z.string().trim()).default([]),
  order: z.coerce.number().int().default(0),
};

const createSchema = z.object(filmFields);
const updateSchema = createSchema.partial();

const listQuerySchema = z.object({
  status: z.enum(["now", "upcoming"]).optional(),
  category: z.string().trim().min(1).optional(),
  subcategory: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  featured: boolish.optional(),
});

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Both public filters accept either a slug or a Mongo _id.
async function resolveRef(Model, value) {
  const or = [{ slug: value }];
  if (mongoose.isValidObjectId(value)) or.push({ _id: value });
  return Model.findOne({ $or: or });
}

// Turns write-body refs into ObjectIds, rejecting unknown ones with a clear 400.
async function resolveRefs(body) {
  let categoryId = null;
  if (body.category != null) {
    if (!mongoose.isValidObjectId(body.category)) {
      throw badRequest("category must be a category _id or null");
    }
    const category = await Category.findById(body.category);
    if (!category) throw badRequest("Category not found");
    categoryId = category._id;
  }
  let subcategoryIds = [];
  if (body.subcategories?.length) {
    const invalid = body.subcategories.find((id) => !mongoose.isValidObjectId(id));
    if (invalid) throw badRequest(`Unknown subcategory "${invalid}"`);
    const docs = await Subcategory.find({ _id: { $in: body.subcategories } });
    if (docs.length !== body.subcategories.length) {
      throw badRequest("One or more subcategories not found");
    }
    subcategoryIds = docs.map((doc) => doc._id);
  }
  return { categoryId, subcategoryIds };
}

async function hydrate(film) {
  return film.populate([
    { path: "category", select: HYDRATE },
    { path: "subcategories", select: HYDRATE },
  ]);
}

router.get("/", async (req, res) => {
  const query = parse(listQuerySchema, req.query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.featured !== undefined) filter.featured = query.featured;
  if (query.category) {
    const category = await resolveRef(Category, query.category);
    // Unknown category → empty list, so a stale filter can never 400 the public site.
    if (!category) return res.json([]);
    filter.category = category._id;
  }
  if (query.subcategory) {
    const subcategory = await resolveRef(Subcategory, query.subcategory);
    if (!subcategory) return res.json([]);
    filter.subcategories = subcategory._id;
  }
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ title: rx }, { director: rx }, { genre: rx }, { synopsis: rx }, { cast: rx }];
  }
  const films = await Film.find(filter)
    .sort({ order: 1, year: -1 })
    .populate("category", HYDRATE)
    .populate("subcategories", HYDRATE);
  return res.json(films);
});

router.get("/:slug", async (req, res) => {
  const or = [{ slug: req.params.slug }];
  if (mongoose.isValidObjectId(req.params.slug)) or.push({ _id: req.params.slug });
  const film = await Film.findOne({ $or: or })
    .populate("category", HYDRATE)
    .populate("subcategories", HYDRATE);
  if (!film) return res.status(404).json({ error: "Film not found" });
  return res.json(film);
});

router.post("/", requireAdmin, async (req, res) => {
  const body = parse(createSchema, req.body);
  const { categoryId, subcategoryIds } = await resolveRefs(body);
  const slug = await uniqueSlug(body.slug ?? body.title, (candidate) =>
    Film.exists({ slug: candidate }),
  );
  const film = await Film.create({
    ...body,
    slug,
    category: categoryId,
    subcategories: subcategoryIds,
  });
  await hydrate(film);
  return res.status(201).json(film);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const body = parse(updateSchema, req.body);
  const film = await Film.findById(req.params.id);
  if (!film) return res.status(404).json({ error: "Film not found" });
  // Slug changes only when explicitly sent — editing a title must not break existing links.
  if (body.slug !== undefined) {
    film.slug = await uniqueSlug(body.slug, (candidate) =>
      Film.exists({ slug: candidate, _id: { $ne: film._id } }),
    );
  }
  const { categoryId, subcategoryIds } = await resolveRefs(body);
  if (body.category !== undefined) film.category = categoryId;
  if (body.subcategories !== undefined) film.subcategories = subcategoryIds;
  for (const key of Object.keys(body)) {
    if (key === "slug" || key === "category" || key === "subcategories") continue;
    film[key] = body[key];
  }
  await film.save();
  await hydrate(film);
  return res.json(film);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const film = await Film.findByIdAndDelete(req.params.id);
  if (!film) return res.status(404).json({ error: "Film not found" });
  return res.json({ ok: true });
});

export default router;

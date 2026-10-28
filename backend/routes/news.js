import { Router } from "express";
import { z } from "zod";
import News from "../models/News.js";
import { boolish, parse } from "../lib/validate.js";
import { slugify } from "../lib/slugify.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

const quoteSchema = z.object({
  text: z.string().trim().min(1),
  author: z.string().trim().default(""),
});

const newsFields = {
  date: z
    .string()
    .trim()
    .min(1)
    .default(() => todayLabel()),
  tag: z.string().trim().default(""),
  title: z.string().trim().min(1),
  excerpt: z.string().trim().default(""),
  image: z.string().trim().default(""),
  imagePublicId: z.string().trim().default(""),
  author: z.string().trim().default(""),
  readTime: z.string().trim().default(""),
  filmSlug: z.string().trim().default(""),
  content: z.array(z.string().trim().min(1)).default([]),
  quote: quoteSchema.nullish(),
  published: boolish.default(true),
};

const createSchema = z.object(newsFields);
const updateSchema = createSchema.partial();

async function listNews(includeDrafts, res) {
  const filter = includeDrafts ? {} : { published: true };
  const articles = await News.find(filter).sort({ createdAt: -1, _id: -1 });
  return res.json(articles);
}

router.get("/", async (req, res, next) => {
  // Drafts are only visible to a logged-in admin.
  if (req.query.all === "true") {
    return requireAdmin(req, res, () => listNews(true, res));
  }
  return listNews(false, res);
});

router.get("/:id", async (req, res) => {
  const param = req.params.id;
  let article = null;
  if (/^\d+$/.test(param)) {
    article = await News.findOne({ id: Number(param), published: true });
  }
  if (!article) {
    // News has no stored slug field; the public URL slug is derived from the title.
    const target = slugify(param);
    const candidates = await News.find({ published: true });
    article = candidates.find((doc) => slugify(doc.title) === target) ?? null;
  }
  if (!article) return res.status(404).json({ error: "Article not found" });
  return res.json(article);
});

router.post("/", requireAdmin, async (req, res) => {
  const body = parse(createSchema, req.body);
  const latest = await News.findOne().sort({ id: -1 }).select("id");
  const article = await News.create({ ...body, id: (latest?.id ?? 0) + 1 });
  return res.status(201).json(article);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const body = parse(updateSchema, req.body);
  const article = await News.findById(req.params.id);
  if (!article) return res.status(404).json({ error: "Article not found" });
  for (const key of Object.keys(body)) {
    article[key] = body[key];
  }
  await article.save();
  return res.json(article);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const article = await News.findByIdAndDelete(req.params.id);
  if (!article) return res.status(404).json({ error: "Article not found" });
  return res.json({ ok: true });
});

export default router;

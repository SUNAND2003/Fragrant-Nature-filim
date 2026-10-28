import { Router } from "express";
import { z } from "zod";
import Setting from "../models/Setting.js";
import { parse } from "../lib/validate.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Keys that could pollute prototypes if written straight into objects/maps.
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const settingsSchema = z.record(z.string().trim().min(1), z.any());

async function settingsMap() {
  const docs = await Setting.find();
  return Object.fromEntries(docs.map((doc) => [doc.key, doc.value]));
}

router.get("/", async (req, res) => {
  return res.json(await settingsMap());
});

router.put("/", requireAdmin, async (req, res) => {
  const body = parse(settingsSchema, req.body ?? {});
  for (const [key, value] of Object.entries(body)) {
    if (UNSAFE_KEYS.has(key)) continue;
    await Setting.updateOne({ key }, { $set: { key, value } }, { upsert: true });
  }
  return res.json(await settingsMap());
});

export default router;

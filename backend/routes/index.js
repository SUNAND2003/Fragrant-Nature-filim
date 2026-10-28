import { Router } from "express";
import mongoose from "mongoose";
import { config } from "../config/env.js";
import { storageMode } from "../lib/storage.js";
import auth from "./auth.js";
import awards from "./awards.js";
import categories from "./categories.js";
import films from "./films.js";
import media, { uploadRouter } from "./media.js";
import news from "./news.js";
import navigation from "./navigation.js";
import gallery from "./gallery.js";
import settings from "./settings.js";
import subcategories from "./subcategories.js";

const router = Router();

router.get("/health", (req, res) => {
  // Sync readyState check only — this endpoint must never throw.
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? "up" : "down",
    cloudinary: config.cloudinaryConfigured,
    uploads: storageMode,
  });
});

router.use("/auth", auth);
router.use("/films", films);
router.use("/categories", categories);
router.use("/subcategories", subcategories);
router.use("/news", news);
router.use("/navigation", navigation);
router.use("/gallery", gallery);
router.use("/awards", awards);
router.use("/media", media);
router.use("/upload", uploadRouter);
router.use("/settings", settings);

export default router;

import { Router } from "express";
import Media from "../models/Media.js";
import { destroyStorage, uploadBuffer } from "../lib/storage.js";
import { requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

const KINDS = ["poster", "news", "gallery", "misc"];

async function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided (multipart field "file")' });
  }
  const kind = KINDS.includes(req.body?.kind) ? req.body.kind : "misc";
  const stored = await uploadBuffer(req.file.buffer, {
    kind,
    filename: req.file.originalname,
  });
  const media = await Media.create({
    ...stored,
    originalName: req.file.originalname ?? "",
    bytes: req.file.size,
    kind,
  });
  return res.status(201).json(media);
}

// Contract puts the upload endpoint at /api/upload; list/delete live under /api/media.
export const uploadRouter = Router();
uploadRouter.post("/", requireAdmin, upload.single("file"), handleUpload);

router.get("/", requireAdmin, async (req, res) => {
  const media = await Media.find().sort({ createdAt: -1, _id: -1 });
  return res.json(media);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) return res.status(404).json({ error: "Media not found" });
  await destroyStorage(media.publicId);
  await media.deleteOne();
  return res.json({ ok: true });
});

export default router;

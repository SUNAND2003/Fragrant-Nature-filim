import path from "node:path";
import multer from "multer";

export const MAX_UPLOAD_MB = 150;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
  "image/x-ms-bmp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/heic",
  "image/heif",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/ogg",
  "application/mp4",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".svg",
  ".bmp",
  ".ico",
  ".heic",
  ".heif",
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".ogv",
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();
    if (IMAGE_TYPES.has(mime) || VIDEO_TYPES.has(mime) || ALLOWED_EXTENSIONS.has(ext)) {
      return cb(null, true);
    }
    cb(
      Object.assign(
        new Error(
          `Unsupported file type "${file.mimetype}" — expected an image (JPG, PNG, WEBP, SVG) or video (MP4, WEBM, MOV)`,
        ),
        { status: 400 },
      ),
    );
  },
});

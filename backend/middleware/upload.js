import multer from "multer";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES.has(file.mimetype)) return cb(null, true);
    cb(
      Object.assign(new Error(`Unsupported file type "${file.mimetype}" — expected an image`), {
        status: 400,
      }),
    );
  },
});

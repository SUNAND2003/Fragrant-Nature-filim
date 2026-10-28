import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env.js";

export const uploadsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "uploads",
);

export const storageMode = config.cloudinaryConfigured ? "cloudinary" : "local";

if (config.cloudinaryConfigured) {
  cloudinary.config(
    config.cloudinary.url
      ? { url: config.cloudinary.url }
      : {
          cloud_name: config.cloudinary.cloudName,
          api_key: config.cloudinary.apiKey,
          api_secret: config.cloudinary.apiSecret,
          secure: true,
        },
  );
}

function uploadStream(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) =>
      err ? reject(err) : resolve(result),
    );
    stream.end(buffer);
  });
}

export async function uploadBuffer(
  buffer,
  { folder = "fragrant-nature", kind = "misc", filename } = {},
) {
  if (storageMode === "cloudinary") {
    const result = await uploadStream(buffer, { folder: `${folder}/${kind}` });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  }
  const ext = path.extname(filename || "").toLowerCase() || ".bin";
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), buffer);
  // Local mode records no dimensions — reading them would need an image decoder dependency.
  return {
    url: `/uploads/${name}`,
    publicId: name,
    width: null,
    height: null,
    format: ext.replace(".", ""),
  };
}

export async function destroyStorage(publicId) {
  if (!publicId) return;
  if (storageMode === "cloudinary") {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      // Already-gone assets are fine to ignore; anything else should surface.
      if (err?.http_code !== 404) throw err;
    }
    return;
  }
  // basename() guards against path traversal through a crafted publicId.
  await unlink(path.join(uploadsDir, path.basename(publicId))).catch(() => {});
}

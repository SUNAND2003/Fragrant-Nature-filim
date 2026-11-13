import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
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

/**
 * Extract image format and dimensions (width, height) directly from the buffer
 * without external C++ or third-party dependencies. Supports JPEG, PNG, GIF, WEBP, and SVG.
 */
export function parseImageMetadata(buf) {
  if (!buf || buf.length < 8) return { width: null, height: null, format: "" };

  // PNG: signature 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    if (buf.length >= 24) {
      return { format: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    return { format: "png", width: null, height: null };
  }

  // GIF: GIF87a or GIF89a
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    if (buf.length >= 10) {
      return { format: "gif", width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    return { format: "gif", width: null, height: null };
  }

  // WEBP: RIFF....WEBP
  if (buf.length >= 16 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const type = buf.toString("ascii", 12, 16);
    if (type === "VP8 " && buf.length >= 30) {
      const w = buf.readUInt16LE(26) & 0x3fff;
      const h = buf.readUInt16LE(28) & 0x3fff;
      return { format: "webp", width: w, height: h };
    }
    if (type === "VP8L" && buf.length >= 25) {
      const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
      const w = 1 + (((b1 & 0x3f) << 8) | b0);
      const h = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { format: "webp", width: w, height: h };
    }
    if (type === "VP8X" && buf.length >= 30) {
      const w = 1 + buf.readUIntLE(24, 3);
      const h = 1 + buf.readUIntLE(27, 3);
      return { format: "webp", width: w, height: h };
    }
    return { format: "webp", width: null, height: null };
  }

  // JPEG: starts with 0xFF 0xD8
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        if (i + 9 <= buf.length) {
          return { format: "jpeg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        break;
      }
      if (marker === 0xd9 || marker === 0xda) break;
      if (i + 3 < buf.length) {
        const len = buf.readUInt16BE(i + 2);
        i += 2 + len;
      } else {
        break;
      }
    }
    return { format: "jpeg", width: null, height: null };
  }

  // SVG inspection: look for <svg ... viewBox="0 0 W H"
  const head = buf.slice(0, Math.min(buf.length, 1024)).toString("utf8");
  if (head.includes("<svg")) {
    const vb = head.match(/viewBox\s*=\s*["']\s*[\d.-]+\s+[\d.-]+\s+([\d.-]+)\s+([\d.-]+)\s*["']/i);
    if (vb) {
      const w = parseFloat(vb[1]);
      const h = parseFloat(vb[2]);
      if (!isNaN(w) && !isNaN(h)) {
        return { format: "svg", width: Math.round(w), height: Math.round(h) };
      }
    }
    return { format: "svg", width: null, height: null };
  }

  return { width: null, height: null, format: "" };
}

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v", ".ogv"]);

/**
 * Automatically optimizes oversized uploads (e.g. 20-40 MB raw camera/print posters)
 * into high-fidelity web assets (max 1920px, 85% quality) so pages load instantly
 * with zero blank screens or socket lag.
 */
async function autoProcessImage(buffer, kind, filename) {
  const ext = path.extname(filename || "").toLowerCase();
  const isVideo = kind === "video" || VIDEO_EXTS.has(ext);
  if (isVideo) return buffer;
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) return buffer;

    // Preserve already-compact images (< 1920px and < 600KB)
    if (meta.width <= 1920 && meta.height <= 1920 && buffer.length <= 600 * 1024) {
      return buffer;
    }

    let pipeline = sharp(buffer).resize({
      width: 1920,
      height: 1920,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (meta.format === "png") {
      pipeline = pipeline.png({ quality: 85, compressionLevel: 8 });
    } else if (meta.format === "webp") {
      pipeline = pipeline.webp({ quality: 85 });
    } else {
      pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
    }

    return await pipeline.toBuffer();
  } catch (err) {
    console.warn("Image auto-compression skipped, preserving raw buffer:", err.message);
    return buffer;
  }
}

export async function uploadBuffer(
  buffer,
  { folder = "fragrant-nature", kind = "misc", filename } = {},
) {
  const processedBuffer = await autoProcessImage(buffer, kind, filename);
  if (storageMode === "cloudinary") {
    const result = await uploadStream(processedBuffer, {
      folder: `${folder}/${kind}`,
      resource_type: "auto",
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width ?? null,
      height: result.height ?? null,
      format: result.format ?? "",
      resourceType: result.resource_type === "video" ? "video" : "image",
    };
  }
  const meta = parseImageMetadata(processedBuffer);
  const ext = path.extname(filename || "").toLowerCase() || (meta.format ? `.${meta.format}` : ".bin");
  const isVideo = kind === "video" || VIDEO_EXTS.has(ext);
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), processedBuffer);
  return {
    url: `/uploads/${name}`,
    publicId: name,
    width: meta.width,
    height: meta.height,
    format: meta.format || ext.replace(".", ""),
    resourceType: isVideo ? "video" : "image",
  };
}

export async function destroyStorage(publicId, resourceType = "image") {
  if (!publicId) return;
  if (storageMode === "cloudinary") {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      // Already-gone assets are fine to ignore; anything else should surface.
      if (err?.http_code !== 404) throw err;
    }
    return;
  }
  // basename() guards against path traversal through a crafted publicId.
  await unlink(path.join(uploadsDir, path.basename(publicId))).catch(() => {});
}

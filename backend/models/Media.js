import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    // Cloudinary public id, or the bare filename in local-disk mode.
    publicId: { type: String, default: "" },
    originalName: { type: String, default: "" },
    bytes: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    format: { type: String, default: "" },
    kind: { type: String, enum: ["poster", "news", "gallery", "misc"], default: "misc" },
  },
  { timestamps: true },
);

export default mongoose.model("Media", mediaSchema);

import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    caption: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

const gallerySchema = new mongoose.Schema(
  {
    filmTitle: { type: String, required: true, trim: true },
    filmSlug: { type: String, required: true, trim: true },
    genre: { type: String, default: "", trim: true },
    year: { type: Number, default: 2026 },
    poster: { type: String, default: "" },
    images: { type: [galleryImageSchema], default: [] },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Gallery", gallerySchema);

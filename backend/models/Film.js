import mongoose from "mongoose";

const filmSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    director: { type: String, default: "", trim: true },
    year: { type: Number, default: 0 },
    genre: { type: String, default: "", trim: true },
    runtime: { type: String, default: "" },
    rating: { type: String, default: "" },
    poster: { type: String, default: "" },
    posterPublicId: { type: String, default: "" },
    tagline: { type: String, default: "" },
    synopsis: { type: String, default: "" },
    cast: { type: [String], default: [] },
    status: { type: String, enum: ["now", "upcoming"], default: "now" },
    release: { type: String, default: "" },
    laurels: { type: [String], default: [] },
    accent: { type: String, default: "" },
    trailer: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    screenRequest: { type: Boolean, default: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    subcategories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],
      default: [],
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Film", filmSchema);

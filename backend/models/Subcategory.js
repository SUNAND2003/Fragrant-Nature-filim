import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Slugs only need to be unique within their parent category.
subcategorySchema.index({ slug: 1, category: 1 }, { unique: true });

export default mongoose.model("Subcategory", subcategorySchema);

import mongoose from "mongoose";

const awardSchema = new mongoose.Schema(
  {
    // Client-supplied unique string slug, per the API contract.
    id: { type: String, required: true, unique: true },
    festival: { type: String, required: true },
    award: { type: String, required: true },
    year: { type: Number, required: true },
    filmSlug: { type: String, required: true },
    category: {
      type: String,
      enum: ["Major Prize", "Selection", "Craft", "Audience"],
      required: true,
    },
    citation: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Award", awardSchema);

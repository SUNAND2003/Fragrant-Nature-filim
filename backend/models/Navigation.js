import mongoose from "mongoose";

/**
 * A single entry in the public header menu (and the footer's Navigation list).
 * The site reads these live, so renaming/hiding/reordering here changes the
 * public site immediately.
 */
const subcategorySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: true },
);

const navigationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    // Route path ("/films") or an external URL ("/gallery").
    to: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    // Hidden entries stay in the admin list but drop out of the public menu.
    visible: { type: Boolean, default: true },
    // Subnav entries (e.g. News inside About)
    subcategories: { type: [subcategorySchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("Navigation", navigationSchema);

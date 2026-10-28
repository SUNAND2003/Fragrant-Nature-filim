import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    text: String,
    author: String,
  },
  { _id: false },
);

const newsSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    date: { type: String, default: "" },
    tag: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, default: "" },
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    author: { type: String, default: "" },
    readTime: { type: String, default: "" },
    filmSlug: { type: String, default: "" },
    content: { type: [String], default: [] },
    quote: { type: quoteSchema, default: null },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("News", newsSchema);

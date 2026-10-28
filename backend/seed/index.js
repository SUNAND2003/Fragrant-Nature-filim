import bcrypt from "bcryptjs";
import { config } from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import Admin from "../models/Admin.js";
import Award from "../models/Award.js";
import Category from "../models/Category.js";
import Film from "../models/Film.js";
import News from "../models/News.js";
import Navigation from "../models/Navigation.js";
import Gallery from "../models/Gallery.js";
import Setting from "../models/Setting.js";
import Subcategory from "../models/Subcategory.js";
import {
  awards,
  categories,
  films,
  gallery,
  navigation,
  news,
  settings,
  subcategories,
} from "./data.js";

async function seed() {
  if (!config.mongoUri) {
    console.error(
      [
        "MONGODB_URI is not set.",
        "Copy .env.example to .env at the repo root and fill in MONGODB_URI,",
        "e.g. MONGODB_URI=mongodb://127.0.0.1:27017/fragrant-nature",
      ].join("\n"),
    );
    process.exit(1);
  }
  await connectDB();

  const categoryBySlug = new Map();
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { upsert: true, returnDocument: "after" },
    );
    categoryBySlug.set(category.slug, doc);
  }

  const subcategoryByName = new Map();
  for (const subcategory of subcategories) {
    const parent = categoryBySlug.get(subcategory.categorySlug);
    const { categorySlug, ...fields } = subcategory;
    const doc = await Subcategory.findOneAndUpdate(
      { slug: subcategory.slug, category: parent._id },
      { $set: { ...fields, category: parent._id } },
      { upsert: true, returnDocument: "after" },
    );
    subcategoryByName.set(subcategory.name, doc);
  }

  for (const [index, film] of films.entries()) {
    const subcategory = subcategoryByName.get(film.genre);
    await Film.findOneAndUpdate(
      { slug: film.slug },
      {
        $set: {
          ...film,
          category: categoryBySlug.get("feature-films")._id,
          subcategories: subcategory ? [subcategory._id] : [],
          featured: index < 4,
          order: index,
        },
      },
      { upsert: true },
    );
  }

  for (const article of news) {
    await News.findOneAndUpdate(
      { id: article.id },
      { $set: { ...article, published: true } },
      { upsert: true },
    );
  }

  for (const award of awards) {
    await Award.findOneAndUpdate({ id: award.id }, { $set: award }, { upsert: true });
  }

  for (const [key, value] of Object.entries(settings)) {
    await Setting.findOneAndUpdate({ key }, { $set: { key, value } }, { upsert: true });
  }

  for (const set of gallery) {
    await Gallery.findOneAndUpdate({ filmSlug: set.filmSlug }, { $set: set }, { upsert: true });
  }

  // The menu is admin-owned after first boot: seed the defaults only when the
  // collection is empty, so renames/hides/reorders survive a re-seed.
  let navigationSeeded = 0;
  if ((await Navigation.countDocuments()) === 0) {
    await Navigation.insertMany(navigation);
    navigationSeeded = navigation.length;
  } else {
    // Populate About with News subcategory if it has none yet
    await Navigation.updateOne(
      { to: "/about", "subcategories.0": { $exists: false } },
      {
        $set: {
          subcategories: [
            {
              label: "News",
              to: "/news",
              description: "Festival honors, press announcements, and studio updates",
            },
          ],
        },
      },
    );
  }

  // Re-hash on every run so the .env password always wins over a manually changed one.
  const email = config.adminEmail.toLowerCase();
  const passwordHash = await bcrypt.hash(config.adminPassword, 10);
  await Admin.findOneAndUpdate(
    { email },
    { $set: { name: "Admin", email, passwordHash, role: "admin" } },
    { upsert: true },
  );

  console.log("Seed complete (idempotent upserts):");
  console.log(
    `  ${categories.length} categories, ${subcategories.length} subcategories, ` +
      `${films.length} films, ${news.length} news, ${awards.length} awards, ` +
      `${Object.keys(settings).length} settings` +
      (navigationSeeded ? `, ${navigationSeeded} menu items` : " (menu kept as edited)"),
  );
  console.log(`  Admin login → email: ${email}  password: ${config.adminPassword}`);

  await disconnectDB();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

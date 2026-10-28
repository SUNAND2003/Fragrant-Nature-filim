import cors from "cors";
import express from "express";
import { config } from "./config/env.js";
import { uploadsDir } from "./lib/storage.js";
import { errorHandler, notFound } from "./middleware/error.js";
import api from "./routes/index.js";

const app = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir, { maxAge: "1d" }));
app.use("/api", api);
app.use(notFound);
app.use(errorHandler);

export default app;

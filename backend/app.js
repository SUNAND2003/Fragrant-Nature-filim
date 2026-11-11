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

// Root welcome / status page for developers visiting http://localhost:4000 in a browser
app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fragrant Nature Studio — API Server</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #0a0a0d;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .card {
          max-width: 500px;
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: #121217;
          padding: 36px 32px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
        }
        .badge {
          display: inline-block;
          background: rgba(124, 255, 61, 0.15);
          border: 1px solid rgba(124, 255, 61, 0.4);
          color: #7cff3d;
          font-family: monospace;
          font-size: 11px;
          padding: 4px 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        h1 {
          font-size: 26px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 18px 0 8px;
        }
        p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn {
          display: block;
          text-align: center;
          background: #ffffff;
          color: #000000;
          padding: 13px 20px;
          text-decoration: none;
          font-weight: bold;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          transition: transform 0.15s, opacity 0.15s;
        }
        .btn:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .btn-outline {
          background: transparent;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .btn-outline:hover {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }
        .footer {
          margin-top: 28px;
          font-family: monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 18px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">● Backend Online (Port 4000)</span>
        <h1>Fragrant Nature Studio</h1>
        <p>The Express API backend is running live and connected to MongoDB Atlas. To manage films, categories, awards, and settings, open the Studio Admin panel.</p>
        <div class="actions">
          <a class="btn" href="http://localhost:5173/admin">Open Admin Panel (Login) →</a>
          <a class="btn btn-outline" href="http://localhost:5173">Open Public Website →</a>
          <a class="btn btn-outline" href="/api/health">View API Health Status →</a>
        </div>
        <div class="footer">Fragrant Nature Film Creations · Atlas Cluster Connected</div>
      </div>
    </body>
    </html>
  `);
});

app.use("/api", api);
app.use(notFound);
app.use(errorHandler);

export default app;

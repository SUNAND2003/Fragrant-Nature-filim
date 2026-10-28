import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiTarget = process.env["API_URL"] ?? "http://127.0.0.1:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Vite-native replacement for the vite-tsconfig-paths plugin ("@/*" alias).
    tsconfigPaths: true,
  },
  server: {
    // The Express API (`npm run backend`) is proxied in dev so the browser
    // only ever talks to one origin.
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/uploads": { target: apiTarget, changeOrigin: true },
    },
  },
});

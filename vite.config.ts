import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Vite-native replacement for the vite-tsconfig-paths plugin ("@/*" alias).
    tsconfigPaths: true,
  },
});

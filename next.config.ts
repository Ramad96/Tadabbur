import type { NextConfig } from "next";

// Deployed to GitHub Pages, so the whole site is a static export: no server,
// no route handlers that read the request, no image optimisation service.
const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages serves /map/index.html for /map/, so emit folders, not .html files.
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

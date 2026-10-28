/**
 * MapLibre 6 runs tile parsing in a module worker it expects to find next to its own file.
 * After bundling that path doesn't exist, so serve the worker from public/ and point
 * setWorkerUrl() at it (see components/map/MapView.tsx). Runs before dev and build.
 */
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "node_modules/maplibre-gl/package.json"), "utf8"));
mkdirSync(join(root, "public/vendor"), { recursive: true });
copyFileSync(
  join(root, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"),
  join(root, "public/vendor/maplibre-gl-worker.mjs"),
);
console.log(`Copied maplibre-gl ${pkg.version} worker to public/vendor/`);

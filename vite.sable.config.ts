import base from "./vite.config";
import { defineConfig } from "vite";

// Explicit local trial build. The normal campaign build still excludes this entry.
export default defineConfig({
  ...base,
  build: {
    ...base.build,
    outDir: "dist-sable",
    rollupOptions: {
      ...base.build?.rollupOptions,
      input: { campaign: "index.html", trial: "sable-trial.html" },
    },
  },
});
